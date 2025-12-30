# Product Requirements Document: SpaceRep

**Version:** 1.1  
**Date:** December 30, 2025  
**Status:** Draft

---

## 1. Overview

SpaceRep is a web application that uses spaced repetition to help users retain knowledge over time. The platform schedules review sessions at scientifically optimal intervals, maximizing retention while minimizing study time.

**Initial Application:** LeetCode problem review scheduling for software engineering interview preparation.

**Vision:** A generic spaced repetition engine that can be extended to any learning domain—coding problems, system design, flashcards, or any reviewable content.

---

## 2. Understanding Spaced Repetition

Spaced repetition exploits the psychological spacing effect: information is better retained when reviews are spaced out over increasing intervals rather than crammed in a single session.

**How it works:**
1. User reviews an item and rates how well they recalled it
2. Easy recalls → schedule further in the future (e.g., 2 weeks)
3. Hard recalls → schedule sooner (e.g., 1 day)
4. Forgotten items → reset and start over

**The SM-2 Algorithm** (our default) calculates the next review interval based on:
- Current interval length
- Ease factor (how difficult this item is for this user)
- User's recall rating (1-4 scale)

This creates a personalized schedule where easy items fade into infrequent reviews while difficult items appear frequently until mastered.

---

## 3. Problem Statement

### The Core Problem

LeetCode users solve hundreds of problems but forget solutions within weeks. When interview time comes, they must re-learn problems from scratch, wasting the effort already invested.

### Specific Pain Points

| Pain Point | Impact |
|------------|--------|
| No review system exists | Users have no idea when to revisit problems |
| Inefficient studying | Time wasted re-solving easy problems while hard ones are forgotten |
| No personalization | Generic study plans ignore individual strengths and weaknesses |
| Lost progress | Solving 300+ problems is meaningless if patterns aren't retained |
| Manual tracking fails | Spreadsheets and notes become unmanageable at scale |

### Why Users Will Return

- **Daily value:** Clear answer to "what should I study today?"
- **Visible progress:** Watch retention improve over time
- **Reduced anxiety:** Confidence that important problems won't be forgotten
- **Time savings:** Stop wasting time on unnecessary reviews
- **Streak motivation:** Don't break the chain psychology

---

## 4. User Personas

### Primary: Interview Preparer

- Software engineer with 1-4 years experience
- Has solved 100-300 LeetCode problems
- Preparing for upcoming interviews (1-6 months out)
- Frustrated by forgetting solutions to problems they've already solved
- Wants efficient, structured review without manual tracking

### Secondary: Skill Builder

- CS student or early-career developer
- Building DSA fundamentals systematically
- Wants to understand patterns, not just memorize solutions
- Values progress tracking and topic coverage visibility

---

## 5. Core Features (MVP)

### 5.1 User Authentication

- Google OAuth sign-in (via Supabase Auth)
- Session management
- Sign out

### 5.2 Collections

Generic containers for organizing items by domain or purpose.

**Default Collections:**
- LeetCode Problems (system-provided)
- Users can create custom collections

**Collection Properties:**
- Name and description
- Item type (determines metadata schema)
- Default scheduling parameters

### 5.3 Items

The core unit of review. Generic structure with domain-specific metadata.

**LeetCode Problem Schema:**
```json
{
  "title": "Two Sum",
  "external_id": "1",
  "external_url": "https://leetcode.com/problems/two-sum/",
  "metadata": {
    "difficulty": "Easy",
    "topics": ["Array", "Hash Table"],
    "patterns": ["Hash Map Lookup"],
    "companies": ["Google", "Amazon"],
    "time_complexity": "O(n)",
    "space_complexity": "O(n)"
  },
  "notes": "Use complement lookup in hash map"
}
```

**Item Management:**
- Add items manually (paste URL, enter details)
- Import from curated lists (Blind 75, NeetCode 150, Grind 75)
- Bulk CSV import
- Edit item metadata and personal notes
- Archive/delete items
- Tag items for filtering

### 5.4 Scheduling Engine

The spaced repetition algorithm that powers the platform.

**SM-2 Algorithm Implementation:**
```
After each review with rating q (1-4, mapped to 0-5 scale):

1. Update ease factor:
   EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
   EF' = max(1.3, EF')  // Minimum ease factor

2. Calculate next interval:
   - If rating < 3 (forgot): interval = 1 day, reset repetitions
   - If repetitions = 1: interval = 1 day
   - If repetitions = 2: interval = 6 days
   - Otherwise: interval = previous_interval * EF'

3. Schedule next review date
```

**Rating Scale:**
| Rating | Label | Meaning | Effect |
|--------|-------|---------|--------|
| 1 | Forgot | Couldn't recall at all | Reset to 1 day |
| 2 | Hard | Recalled with significant struggle | Short interval |
| 3 | Good | Recalled with moderate effort | Normal progression |
| 4 | Easy | Instant recall | Longer interval |

**Scheduling Features:**
- Due items queue (items where next_review_at ≤ now)
- Overdue handling (overdue items prioritized)
- Daily new item limit (configurable)
- Review forecasting (predict future load)

### 5.5 Review Session Interface

The core user interaction for reviewing items.

**Session Flow:**
1. User starts session from dashboard
2. System presents due items one at a time
3. For each item:
   - Display: title, metadata, personal notes, review history
   - User clicks "Open in LeetCode" to attempt problem
   - User returns and rates recall (1-4)
   - System shows next review date, advances to next item
4. Session complete: show summary statistics

**Session Options:**
- Review all due items
- Review specific collection or tag
- Review specific topic (e.g., "Dynamic Programming only")
- Limit session size (e.g., "max 20 items")

### 5.6 Dashboard

The home screen showing current status and actions.

**Dashboard Components:**
- Today's due count (with breakdown by collection)
- Overdue items warning
- Quick "Start Review" button
- Upcoming reviews (next 7 days forecast)
- Current streak counter
- Overall retention rate
- Recently added items

### 5.7 Analytics

Progress tracking to demonstrate value and motivate continued use.

**Metrics Displayed:**
- Retention rate (% of reviews rated ≥3) over time
- Reviews completed per day/week
- Streak (consecutive days with at least one review)
- Items by maturity stage (new, learning, young, mature)
- Heatmap calendar (GitHub-style activity visualization)
- Per-topic/tag performance breakdown
- Forecast: expected reviews for next 30 days

### 5.8 Settings

User preferences and configuration.

**Options:**
- Daily review limit
- New items per day limit
- Default ease factor for new items
- Timezone
- Account management

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                 React + TypeScript + Vite                       │
│                      TailwindCSS                                │
│                    (localhost:5173)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│                    FastAPI (Python)                             │
│              REST API + Pydantic Validation                     │
│                    (localhost:8000)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                 │
├─────────────────────────────┬───────────────────────────────────┤
│       PostgreSQL            │         Supabase Auth             │
│    (Primary Database)       │       (Google OAuth)              │
└─────────────────────────────┴───────────────────────────────────┘
```

### 6.2 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + TypeScript | Component-based, type safety |
| Build Tool | Vite | Fast dev server, simple config |
| Styling | TailwindCSS | Rapid development, utility-first |
| HTTP Client | Axios or fetch | API communication |
| State | React Query (TanStack Query) | Server state, caching |
| Backend | FastAPI (Python 3.11+) | Fast, async, auto-docs |
| Validation | Pydantic v2 | Type-safe request/response |
| Database | Supabase (PostgreSQL) | Managed Postgres, built-in auth |
| Auth | Supabase Auth (Google OAuth) | Simple OAuth integration |
| DB Client | supabase-py | Official Python client |

### 6.3 Project Structure

```
spacerep/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings and env vars
│   │   ├── dependencies.py      # Dependency injection
│   │   │
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── router.py        # Auth endpoints
│   │   │   └── service.py       # Supabase auth logic
│   │   │
│   │   ├── collections/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── items/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── reviews/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── scheduler.py     # SM-2 algorithm
│   │   │
│   │   ├── analytics/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   │
│   │   └── presets/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       └── data/
│   │           ├── blind75.json
│   │           ├── neetcode150.json
│   │           └── grind75.json
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                 # API client functions
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript types
│   │   └── lib/
│   │       └── supabase.ts      # Supabase client init
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
│
└── README.md
```

### 6.4 Supabase Setup

#### Environment Variables

```bash
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key  # For admin operations

# frontend/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

#### Google OAuth Setup (Supabase Dashboard)

1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Add Google OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret
4. Set redirect URL: `http://localhost:5173` (for local dev)

### 6.5 Database Schema (Supabase SQL Editor)

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

-- RLS Policies: Users can only access their own data
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

### 6.6 Backend Implementation

#### Main Application (app/main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.collections.router import router as collections_router
from app.items.router import router as items_router
from app.reviews.router import router as reviews_router
from app.analytics.router import router as analytics_router
from app.presets.router import router as presets_router

app = FastAPI(
    title="SpaceRep API",
    description="Spaced repetition scheduling for LeetCode and more",
    version="1.0.0"
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(collections_router, prefix="/api/collections", tags=["collections"])
app.include_router(items_router, prefix="/api/items", tags=["items"])
app.include_router(reviews_router, prefix="/api/reviews", tags=["reviews"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(presets_router, prefix="/api/presets", tags=["presets"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
```

#### Config (app/config.py)

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    class Config:
        env_file = ".env"


settings = Settings()
```

#### Dependencies (app/dependencies.py)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from app.config import settings

security = HTTPBearer()


def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_key)


def get_supabase_admin() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> dict:
    """Verify JWT token and return user data."""
    try:
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "token": token
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
```

#### Scheduling Service (app/reviews/scheduler.py)

```python
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


Rating = Literal[1, 2, 3, 4]
Status = Literal["new", "learning", "review"]


class SchedulingState(BaseModel):
    ease_factor: Decimal = Decimal("2.5")
    interval_days: int = 0
    repetitions: int = 0
    status: Status = "new"
    next_review_at: datetime = datetime.utcnow()
    last_review_at: datetime | None = None


class ReviewResult(BaseModel):
    new_state: SchedulingState
    next_review_at: datetime


class SM2Scheduler:
    """SM-2 Spaced Repetition Algorithm implementation."""
    
    MIN_EASE_FACTOR = Decimal("1.3")
    
    # Map 1-4 rating to SM-2's 0-5 quality scale
    RATING_MAP = {
        1: 0,  # Forgot
        2: 2,  # Hard
        3: 4,  # Good
        4: 5,  # Easy
    }
    
    def process_review(
        self,
        current_state: SchedulingState,
        rating: Rating
    ) -> ReviewResult:
        """Process a review and calculate next scheduling state."""
        
        q = self.RATING_MAP[rating]
        
        ease_factor = current_state.ease_factor
        interval_days = current_state.interval_days
        repetitions = current_state.repetitions
        
        # Update ease factor
        ease_factor = ease_factor + Decimal(str(
            0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
        ))
        ease_factor = max(self.MIN_EASE_FACTOR, ease_factor)
        
        # Calculate new interval
        if q < 3:
            # Failed - reset
            repetitions = 0
            interval_days = 1
        else:
            # Success
            repetitions += 1
            
            if repetitions == 1:
                interval_days = 1
            elif repetitions == 2:
                interval_days = 6
            else:
                interval_days = round(interval_days * float(ease_factor))
        
        next_review_at = datetime.utcnow() + timedelta(days=interval_days)
        status = self._determine_status(repetitions, interval_days)
        
        new_state = SchedulingState(
            ease_factor=ease_factor,
            interval_days=interval_days,
            repetitions=repetitions,
            status=status,
            next_review_at=next_review_at,
            last_review_at=datetime.utcnow()
        )
        
        return ReviewResult(
            new_state=new_state,
            next_review_at=next_review_at
        )
    
    def _determine_status(self, repetitions: int, interval_days: int) -> Status:
        if repetitions == 0:
            return "new"
        elif interval_days < 21:
            return "learning"
        return "review"


scheduler = SM2Scheduler()
```

#### Reviews Router (app/reviews/router.py)

```python
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.dependencies import get_current_user, get_supabase
from app.reviews.scheduler import scheduler, Rating

router = APIRouter()


class ReviewCreate(BaseModel):
    item_id: UUID
    rating: Rating


class ReviewResponse(BaseModel):
    id: UUID
    item_id: UUID
    rating: int
    next_review_at: datetime
    interval_days: int


@router.get("/due")
async def get_due_items(
    limit: int = Query(default=50, le=100),
    collection_id: Optional[UUID] = None,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Get items due for review."""
    query = supabase.table("scheduling_states")\
        .select("*, items(*)")\
        .eq("user_id", user["id"])\
        .lte("next_review_at", datetime.utcnow().isoformat())\
        .order("next_review_at")\
        .limit(limit)
    
    if collection_id:
        query = query.eq("items.collection_id", str(collection_id))
    
    response = query.execute()
    return response.data


@router.post("/", response_model=ReviewResponse)
async def submit_review(
    review: ReviewCreate,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Submit a review rating and update scheduling."""
    
    # Get current scheduling state
    state_response = supabase.table("scheduling_states")\
        .select("*")\
        .eq("item_id", str(review.item_id))\
        .eq("user_id", user["id"])\
        .single()\
        .execute()
    
    current_state = state_response.data
    
    # Calculate new scheduling
    from app.reviews.scheduler import SchedulingState
    state = SchedulingState(
        ease_factor=current_state["ease_factor"],
        interval_days=current_state["interval_days"],
        repetitions=current_state["repetitions"],
        status=current_state["status"],
        next_review_at=current_state["next_review_at"],
        last_review_at=current_state["last_review_at"]
    )
    
    result = scheduler.process_review(state, review.rating)
    
    # Record review
    review_record = supabase.table("reviews").insert({
        "item_id": str(review.item_id),
        "user_id": user["id"],
        "rating": review.rating,
        "ease_factor_before": float(current_state["ease_factor"]),
        "interval_before": current_state["interval_days"],
        "ease_factor_after": float(result.new_state.ease_factor),
        "interval_after": result.new_state.interval_days,
    }).execute()
    
    # Update scheduling state
    supabase.table("scheduling_states").update({
        "ease_factor": float(result.new_state.ease_factor),
        "interval_days": result.new_state.interval_days,
        "repetitions": result.new_state.repetitions,
        "status": result.new_state.status,
        "next_review_at": result.new_state.next_review_at.isoformat(),
        "last_review_at": result.new_state.last_review_at.isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }).eq("item_id", str(review.item_id)).eq("user_id", user["id"]).execute()
    
    return ReviewResponse(
        id=review_record.data[0]["id"],
        item_id=review.item_id,
        rating=review.rating,
        next_review_at=result.new_state.next_review_at,
        interval_days=result.new_state.interval_days
    )


@router.get("/forecast")
async def get_forecast(
    days: int = Query(default=30, le=90),
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Get forecast of upcoming reviews."""
    
    end_date = datetime.utcnow().replace(hour=23, minute=59, second=59)
    from datetime import timedelta
    end_date = end_date + timedelta(days=days)
    
    response = supabase.table("scheduling_states")\
        .select("next_review_at")\
        .eq("user_id", user["id"])\
        .lte("next_review_at", end_date.isoformat())\
        .execute()
    
    # Group by date
    from collections import defaultdict
    forecast = defaultdict(int)
    
    for item in response.data:
        date = item["next_review_at"][:10]  # Extract YYYY-MM-DD
        forecast[date] += 1
    
    return [{"date": k, "count": v} for k, v in sorted(forecast.items())]
```

### 6.7 API Endpoints Summary

```
Authentication (handled via Supabase client on frontend):
- Google OAuth flow managed by Supabase Auth

Collections:
GET    /api/collections              - List user's collections
POST   /api/collections              - Create collection
GET    /api/collections/{id}         - Get collection details
PATCH  /api/collections/{id}         - Update collection
DELETE /api/collections/{id}         - Delete collection

Items:
GET    /api/items                    - List items (filterable)
POST   /api/items                    - Create item
POST   /api/items/bulk               - Bulk import items
GET    /api/items/{id}               - Get item details
PATCH  /api/items/{id}               - Update item
DELETE /api/items/{id}               - Delete/archive item

Tags:
GET    /api/tags                     - List tags
POST   /api/tags                     - Create tag
PATCH  /api/tags/{id}                - Update tag
DELETE /api/tags/{id}                - Delete tag

Reviews & Scheduling:
GET    /api/reviews/due              - Get due items for review
POST   /api/reviews                  - Submit review rating
GET    /api/reviews/forecast         - Get upcoming review forecast
GET    /api/reviews/history          - Get review history

Analytics:
GET    /api/analytics/summary        - Dashboard summary stats
GET    /api/analytics/retention      - Retention rate over time
GET    /api/analytics/heatmap        - Activity heatmap data
GET    /api/analytics/topics         - Performance by topic

Presets:
GET    /api/presets                  - List available preset lists
GET    /api/presets/{name}           - Get preset list details
POST   /api/presets/{name}/import    - Import preset to user's collection

Settings:
GET    /api/settings                 - Get user settings
PATCH  /api/settings                 - Update settings
```

### 6.8 Frontend Auth Flow (Supabase Client)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Google OAuth sign in
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:5173/dashboard'
    }
  })
  return { data, error }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Get access token for API calls
export async function getAccessToken() {
  const session = await getSession()
  return session?.access_token
}
```

```typescript
// src/api/client.ts
import { getAccessToken } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return response.json()
}
```

### 6.9 Local Development Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Create .env with Supabase credentials
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Access
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

#### requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0
supabase==2.3.4
python-dotenv==1.0.0
```

---

## 7. User Flows

### 7.1 New User Onboarding

```
1. User lands on homepage
2. Clicks "Sign in with Google"
3. Completes Google OAuth flow
4. Redirected to dashboard (profile auto-created via trigger)
5. Sees welcome state with options:
   - "Import a preset list" (Blind 75, NeetCode 150, Grind 75)
   - "Add your first problem"
6. If preset: select list → items imported → dashboard populated
7. If manual: redirect to add item form
```

### 7.2 Adding a Problem

```
1. User clicks "Add Item" 
2. Form displayed:
   - LeetCode URL (paste)
   - Title
   - Difficulty (Easy/Medium/Hard)
   - Topics (multi-select)
   - Personal notes
3. User submits
4. Item created with scheduling_state (status: 'new', next_review: now)
5. Item appears in due list immediately
```

### 7.3 Daily Review Session

```
1. User visits dashboard, sees "12 items due today"
2. Clicks "Start Review"
3. Review screen loads first due item:
   - Problem title, difficulty, topics
   - Personal notes
   - "Open in LeetCode" button
   - Rating buttons: Forgot (1), Hard (2), Good (3), Easy (4)
4. User opens LeetCode, attempts problem
5. User returns, selects rating
6. System updates scheduling, shows "Next review: Jan 14"
7. Loads next due item
8. After last item: summary shown
9. Return to dashboard
```

---

## 8. Data: Preset Problem Lists

Stored as static JSON files in the backend:

```json
// backend/app/presets/data/blind75.json
{
  "name": "Blind 75",
  "description": "75 essential LeetCode problems for interview prep",
  "problems": [
    {
      "external_id": "1",
      "title": "Two Sum",
      "external_url": "https://leetcode.com/problems/two-sum/",
      "metadata": {
        "difficulty": "Easy",
        "topics": ["Array", "Hash Table"],
        "pattern": "Hash Map"
      }
    }
    // ... remaining problems
  ]
}
```

**Included Presets:**
- Blind 75
- NeetCode 150  
- Grind 75

---

## 9. Success Metrics

| Metric | Description | Target (3 months) |
|--------|-------------|-------------------|
| **Weekly Active Users** | Users completing ≥1 review/week | 100 (local/beta) |
| **Retention (D7)** | % users returning after 7 days | 40% |
| **Retention (D30)** | % users returning after 30 days | 25% |
| **Session Completion** | % of due items reviewed per session | 80% |
| **Streak Length** | Median consecutive review days | 5 days |
| **Self-Reported Retention** | % reviews rated ≥3 | 75% |

---

## 10. MVP Scope Summary

### Included

- Google OAuth authentication (Supabase)
- Collection management
- Item CRUD with LeetCode metadata
- Tag system
- SM-2 scheduling algorithm
- Review session interface
- Dashboard with due items and stats
- Analytics (retention, streak, heatmap, forecast)
- Preset list imports (Blind 75, NeetCode 150, Grind 75)
- CSV import
- User settings

### Excluded

- Browser extension
- Email/push notifications
- Mobile app
- AI features
- Social features
- Multiple algorithm options

---

## 11. Future Considerations

- Email digest notifications
- Browser extension for one-click add
- Additional content types (system design, flashcards)
- FSRS algorithm option
- Public/shared collections
- Calendar integration
- Mobile apps

---

## 12. Open Questions

1. Should we attempt to auto-fetch LeetCode metadata from URLs?
2. Include full data export in MVP for portability?
3. Allow users to see/modify scheduling parameters?
4. How to handle timezone changes mid-streak?

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 30, 2025 | Initial draft |
| 1.1 | Dec 30, 2025 | Updated to Supabase + FastAPI + Google Auth |
