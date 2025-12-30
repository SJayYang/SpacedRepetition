# SpaceRep - Spaced Repetition for LeetCode

A web application that uses spaced repetition to help you retain LeetCode problems over time. Built with FastAPI, React, TypeScript, and Supabase.

## Features

- 🎯 **SM-2 Spaced Repetition Algorithm** - Scientifically-proven scheduling
- 📚 **Collections Management** - Organize problems by topic or goal
- ✅ **Review Sessions** - Clean, focused interface for reviewing problems
- 📊 **Analytics Dashboard** - Track retention rate, streaks, and performance by topic
- 🔥 **Streak Tracking** - Build consistent study habits
- 📦 **Preset Lists** - Import Blind 75, NeetCode 150, Grind 75
- 🔐 **Google OAuth** - Simple, secure authentication via Supabase

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation and settings management
- **Supabase Python Client** - Database and auth integration
- **Python 3.11+**

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing

### Database & Auth
- **Supabase** - PostgreSQL database with built-in auth
- **Google OAuth** - Authentication provider

## Project Structure

```
spacerep/
├── backend/
│   ├── app/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── collections/   # Collection management
│   │   ├── items/         # LeetCode problems CRUD
│   │   ├── reviews/       # Review submission & scheduling
│   │   ├── analytics/     # Statistics and metrics
│   │   ├── presets/       # Preset problem lists
│   │   ├── main.py        # FastAPI app entry
│   │   ├── config.py      # Environment configuration
│   │   └── dependencies.py # Auth middleware
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Supabase client
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Root component
│   │   └── main.tsx       # Entry point
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account (free tier is fine)
- Google Cloud Console project (for OAuth)

### 1. Supabase Setup

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Project Settings → API** and note:
   - Project URL
   - Anon/Public key
   - Service role key (keep this secret!)

#### Set Up Database Schema

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,

    -- Settings
    timezone TEXT DEFAULT 'UTC',
    daily_review_limit INTEGER DEFAULT 100,
    new_items_per_day INTEGER DEFAULT 20,
    default_ease_factor DECIMAL(4,2) DEFAULT 2.5,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Collections
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    item_type TEXT NOT NULL DEFAULT 'leetcode',
    is_default BOOLEAN DEFAULT FALSE,
    config JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- Items
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    external_id TEXT,
    external_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ,

    UNIQUE(user_id, collection_id, external_id)
);

-- Tags
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, collection_id, name)
);

-- Item-Tag junction
CREATE TABLE public.item_tags (
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

-- Scheduling State
CREATE TABLE public.scheduling_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- SM-2 state
    ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,

    -- Status and scheduling
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review')),
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_review_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(item_id, user_id)
);

-- Reviews (history)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),

    -- Snapshot for analytics
    ease_factor_before DECIMAL(4,2),
    interval_before INTEGER,
    ease_factor_after DECIMAL(4,2),
    interval_after INTEGER,

    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_items_user_collection ON public.items(user_id, collection_id);
CREATE INDEX idx_items_archived ON public.items(user_id) WHERE archived_at IS NULL;
CREATE INDEX idx_scheduling_due ON public.scheduling_states(user_id, next_review_at);
CREATE INDEX idx_scheduling_status ON public.scheduling_states(user_id, status);
CREATE INDEX idx_reviews_user_date ON public.reviews(user_id, reviewed_at);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own collections" ON public.collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own items" ON public.items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags" ON public.tags
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own item_tags" ON public.item_tags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can manage own scheduling" ON public.scheduling_states
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL USING (auth.uid() = user_id);
```

#### Configure Google OAuth

1. Go to **Authentication → Providers → Google** in Supabase dashboard
2. Enable Google provider
3. Note the **Callback URL** (e.g., `https://your-project.supabase.co/auth/v1/callback`)
4. Go to [Google Cloud Console](https://console.cloud.google.com)
5. Create a new project or select existing one
6. Enable **Google+ API**
7. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
8. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - The Supabase callback URL
9. Copy **Client ID** and **Client Secret**
10. Paste them into Supabase Google provider settings

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Run the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 4. Test the Application

1. Open `http://localhost:5173`
2. Click "Continue with Google"
3. Complete OAuth flow
4. You'll be redirected to the dashboard
5. Create a collection
6. Import a preset list (Blind 75, NeetCode 150, or Grind 75)
7. Start reviewing!

## Usage Guide

### Adding Problems

1. Go to **Collections** and create a collection (e.g., "Interview Prep")
2. Go to **Items** and click "Add Item"
3. Fill in:
   - Title (e.g., "Two Sum")
   - LeetCode URL
   - Difficulty
   - Topics (comma-separated)
   - Pattern
   - Personal notes
4. The item is immediately added to your review queue

### Reviewing

1. From **Dashboard**, click "Start Review Session"
2. For each problem:
   - Review the metadata and your notes
   - Click "Open in LeetCode" to attempt the problem
   - Rate your recall:
     - **Forgot (1)**: Reset interval to 1 day
     - **Hard (2)**: Short interval
     - **Good (3)**: Normal progression
     - **Easy (4)**: Longer interval
3. The SM-2 algorithm automatically schedules the next review

### Analytics

View your progress in the **Analytics** page:
- Retention rate over time
- Performance by topic
- Success rates for different problem categories

### Settings

Customize your experience:
- Daily review limit
- New items per day
- Default ease factor
- Timezone

## How Spaced Repetition Works

The app uses the **SM-2 algorithm**:

1. After each review, you rate how well you recalled the problem (1-4)
2. The algorithm adjusts two parameters:
   - **Ease Factor**: How difficult this problem is for you
   - **Interval**: Days until next review
3. Easy problems → longer intervals (weeks/months)
4. Hard problems → short intervals (1-2 days)
5. Forgotten problems → reset to 1 day

This creates a personalized schedule that maximizes retention while minimizing study time.

## API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/settings` - Update user settings

### Collections
- `GET /api/collections` - List collections
- `POST /api/collections` - Create collection
- `GET /api/collections/{id}` - Get collection
- `PATCH /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection

### Items
- `GET /api/items` - List items
- `POST /api/items` - Create item
- `POST /api/items/bulk` - Bulk import
- `GET /api/items/{id}` - Get item
- `PATCH /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete/archive item

### Reviews
- `GET /api/reviews/due` - Get due items
- `POST /api/reviews` - Submit review
- `GET /api/reviews/forecast` - Get forecast
- `GET /api/reviews/history` - Get history

### Analytics
- `GET /api/analytics/summary` - Dashboard stats
- `GET /api/analytics/retention` - Retention over time
- `GET /api/analytics/heatmap` - Activity heatmap
- `GET /api/analytics/topics` - Performance by topic

### Presets
- `GET /api/presets` - List presets
- `GET /api/presets/{name}` - Get preset details
- `POST /api/presets/{name}/import` - Import preset

## Development

### Backend

```bash
# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# View API docs
open http://localhost:8000/docs
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT

## Acknowledgments

- Spaced repetition algorithm based on SM-2 (SuperMemo)
- Problem lists curated by the community (Blind 75, NeetCode, Grind 75)
