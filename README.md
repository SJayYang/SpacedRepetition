# SpaceRep

A spaced repetition application for mastering LeetCode problems using the scientifically-proven SM-2 algorithm.

> **Never forget a coding pattern again.** SpaceRep schedules reviews at optimal intervals to maximize long-term retention while minimizing study time.

## Quick Start

**Get up and running in 5 minutes →** [QUICKSTART.md](QUICKSTART.md)

## Features

### 🎯 SM-2 Spaced Repetition Engine
- **Personalized scheduling** based on your performance
- **4-level rating system**: Forgot, Hard, Good, Easy
- **Automatic interval adjustment**: Easy problems fade to months, hard ones stay daily
- **Proven algorithm**: Based on SuperMemo's SM-2, optimized for retention

### 📚 Smart Organization
- **Collections**: Group problems by topic, difficulty, or interview company
- **Preset lists**: Import Blind 75, NeetCode 150, or Grind 75 with one click
- **Rich metadata**: Difficulty, topics, patterns, time/space complexity
- **Personal notes**: Add your own insights and gotchas

### ✅ Clean Review Experience
- **Focused interface**: One problem at a time, no distractions
- **Progress tracking**: Visual progress bar through daily reviews
- **Direct LeetCode links**: Jump to the problem in one click
- **Session summaries**: See how many reviews completed

### 📊 Analytics & Insights
- **Retention rate**: Track success over time
- **Streak counter**: Build consistent study habits
- **Topic performance**: Identify weak areas (Arrays, DP, etc.)
- **Forecast**: See upcoming review load for next 30 days
- **Heatmap**: GitHub-style activity calendar

### 🔐 Simple Authentication
- **Google OAuth**: One-click sign in via Supabase
- **Secure**: Row-level security ensures data privacy
- **Multi-device**: Access from anywhere

## How It Works

The **SM-2 algorithm** powers the scheduling:

1. After reviewing a problem, you rate your recall (1-4)
2. The algorithm adjusts two parameters:
   - **Ease Factor**: How difficult this problem is for you personally
   - **Interval**: Days until the next review
3. Results:
   - **Easy recall** (4) → interval increases dramatically (weeks/months)
   - **Good recall** (3) → interval increases normally
   - **Hard recall** (2) → short interval (1-3 days)
   - **Forgot** (1) → resets to 1 day

Over time, you build a personalized schedule where:
- Problems you've mastered appear infrequently (monthly)
- Challenging problems appear frequently until solidified
- **You retain 80%+ of problems** with minimal time investment

## Tech Stack

### Backend
- **FastAPI** - Modern async Python framework
- **Prisma** - Type-safe database client with schema-as-code
- **Supabase** - PostgreSQL database with built-in auth
- **Pydantic** - Data validation and settings

### Frontend
- **React 18** + **TypeScript** - Type-safe component library
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing

### Database & Auth
- **PostgreSQL** via Supabase - Reliable, scalable SQL database
- **Google OAuth** via Supabase Auth - Secure authentication
- **Row Level Security** - User data isolation

## Project Architecture

```
┌─────────────────────────────────────────┐
│            FRONTEND (React)             │
│  - Dashboard with due items             │
│  - Review session interface             │
│  - Analytics & charts                   │
│  - Collections & items management       │
└─────────────────┬───────────────────────┘
                  │ HTTP + JWT
                  ▼
┌─────────────────────────────────────────┐
│          BACKEND (FastAPI)              │
│  - REST API endpoints                   │
│  - SM-2 scheduling algorithm            │
│  - Review history tracking              │
│  - Analytics calculations               │
└─────────────────┬───────────────────────┘
                  │ SQL + Prisma
                  ▼
┌─────────────────────────────────────────┐
│        DATABASE (Supabase/Postgres)     │
│  - User profiles                        │
│  - Items & collections                  │
│  - Scheduling states                    │
│  - Review history                       │
└─────────────────────────────────────────┘
```

## Database Schema

Powered by **Prisma** for type-safe, declarative schema management.

**Core Tables:**
- `profiles` - User settings and preferences
- `collections` - Problem groupings (Blind 75, Interview Prep, etc.)
- `items` - LeetCode problems with metadata
- `scheduling_states` - SM-2 algorithm state (ease factor, interval, next review date)
- `reviews` - Complete review history for analytics
- `tags` - Flexible tagging system

**Key Features:**
- Row-level security (RLS) - users can only access their own data
- Auto-profile creation on signup via database trigger
- Optimized indexes for fast due-item queries

See `backend/prisma/schema.prisma` for complete schema definition.

## API Endpoints

FastAPI auto-generates interactive documentation at `http://localhost:8000/docs`

**Main Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/me` | GET | Get current user profile |
| `/api/collections` | GET, POST | List/create collections |
| `/api/items` | GET, POST | List/create items |
| `/api/items/bulk` | POST | Bulk import items |
| `/api/reviews/due` | GET | Get items due for review |
| `/api/reviews` | POST | Submit review rating |
| `/api/reviews/forecast` | GET | Upcoming review forecast |
| `/api/analytics/summary` | GET | Dashboard statistics |
| `/api/analytics/retention` | GET | Retention rate over time |
| `/api/analytics/topics` | GET | Performance by topic |
| `/api/presets` | GET | List available presets |
| `/api/presets/{name}/import` | POST | Import preset list |

## File Structure

```
SpacedRepetition/
├── backend/
│   ├── app/
│   │   ├── auth/              # Auth endpoints
│   │   ├── collections/       # Collections CRUD
│   │   ├── items/             # Items CRUD
│   │   ├── reviews/           # Review submission + SM-2 algorithm
│   │   ├── analytics/         # Stats & metrics
│   │   ├── presets/           # Preset list import
│   │   │   └── data/          # JSON files (Blind 75, etc.)
│   │   ├── main.py            # FastAPI app
│   │   ├── config.py          # Settings
│   │   └── database.py        # Prisma client
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── supabase_setup.sql     # RLS policies & triggers
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Dashboard, Review, Collections, etc.
│   │   ├── components/        # Layout, shared UI
│   │   ├── api/               # API client functions
│   │   ├── lib/               # Supabase client
│   │   └── types/             # TypeScript types
│   ├── package.json           # Node dependencies
│   └── vite.config.ts         # Vite configuration
│
├── QUICKSTART.md              # Setup guide
├── PRISMA_SETUP.md            # Database migration guide
└── README.md                  # This file
```

## Development

### Prerequisites
- Conda (Anaconda or Miniconda)
- Python 3.11+ (via conda)
- Node.js 18+
- Supabase account (free tier)

### Setup
See [QUICKSTART.md](QUICKSTART.md) for complete setup instructions.

### Running Locally

```bash
# Backend
cd backend
conda activate spacerep
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm run dev
```

Open http://localhost:5173

### Database Migrations

This project uses **Prisma** for schema management:

```bash
# Edit schema
vi backend/prisma/schema.prisma

# Push to database
prisma db push --schema=./prisma/schema.prisma

# Regenerate client
prisma generate --schema=./prisma/schema.prisma
```

See [PRISMA_SETUP.md](PRISMA_SETUP.md) for advanced usage.

## Usage

### Adding Problems

1. **Import a preset:** Collections → Import Preset → Select Blind 75/NeetCode 150/Grind 75
2. **Add manually:** Items → Add Item → Fill in title, URL, difficulty, topics, notes

### Reviewing

1. Dashboard shows due count
2. Click "Start Review Session"
3. For each problem:
   - Review metadata and your notes
   - Open in LeetCode
   - Rate your recall: Forgot (1), Hard (2), Good (3), Easy (4)
4. Algorithm automatically schedules next review

### Tracking Progress

- **Dashboard**: Due count, streak, retention rate
- **Analytics**: Retention over time, topic performance, heatmap
- **Items page**: See next review date for each problem

## Preset Lists

SpaceRep includes curated problem lists:

- **Blind 75**: 75 essential problems for FAANG interviews
- **NeetCode 150**: Comprehensive pattern coverage
- **Grind 75**: Balanced difficulty progression

Import with one click from the Collections page.

## Production Deployment

**Backend:**
- Deploy to Railway, Render, or Fly.io
- Use `prisma migrate` for production migrations
- Set environment variables securely

**Frontend:**
- Deploy to Vercel, Netlify, or Cloudflare Pages
- Run `npm run build` to generate `dist/` folder
- Update CORS origins in backend

**Database:**
- Supabase handles hosting and backups
- Enable connection pooling for production
- Monitor via Supabase dashboard

## License

MIT

## Acknowledgments

- **SM-2 Algorithm**: SuperMemo (Piotr Wozniak, 1987)
- **Problem Lists**: Blind, NeetCode, Grind communities
- **Tech Stack**: FastAPI, React, Prisma, Supabase teams
