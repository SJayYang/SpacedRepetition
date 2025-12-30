-- =====================================================
-- Supabase-specific setup (RLS, triggers, functions)
-- Run this AFTER pushing Prisma schema with `prisma db push`
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TRIGGER: Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles: Users can only access their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Collections: Users can only manage their own collections
DROP POLICY IF EXISTS "Users can manage own collections" ON public.collections;
CREATE POLICY "Users can manage own collections" ON public.collections
    FOR ALL USING (auth.uid() = user_id);

-- Items: Users can only manage their own items
DROP POLICY IF EXISTS "Users can manage own items" ON public.items;
CREATE POLICY "Users can manage own items" ON public.items
    FOR ALL USING (auth.uid() = user_id);

-- Tags: Users can only manage their own tags
DROP POLICY IF EXISTS "Users can manage own tags" ON public.tags;
CREATE POLICY "Users can manage own tags" ON public.tags
    FOR ALL USING (auth.uid() = user_id);

-- Item Tags: Users can only manage tags for their own items
DROP POLICY IF EXISTS "Users can manage own item_tags" ON public.item_tags;
CREATE POLICY "Users can manage own item_tags" ON public.item_tags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
    );

-- Scheduling States: Users can only manage their own scheduling
DROP POLICY IF EXISTS "Users can manage own scheduling" ON public.scheduling_states;
CREATE POLICY "Users can manage own scheduling" ON public.scheduling_states
    FOR ALL USING (auth.uid() = user_id);

-- Reviews: Users can only manage their own reviews
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- CONSTRAINTS (add any missing constraints)
-- =====================================================

-- Ensure status field only accepts valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'scheduling_states_status_check'
    ) THEN
        ALTER TABLE public.scheduling_states
        ADD CONSTRAINT scheduling_states_status_check
        CHECK (status IN ('new', 'learning', 'review'));
    END IF;
END $$;

-- Ensure rating field only accepts 1-4
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'reviews_rating_check'
    ) THEN
        ALTER TABLE public.reviews
        ADD CONSTRAINT reviews_rating_check
        CHECK (rating BETWEEN 1 AND 4);
    END IF;
END $$;

-- =====================================================
-- DONE
-- =====================================================
SELECT 'Supabase setup complete! RLS policies and triggers are in place.' AS status;
