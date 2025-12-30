# SpaceRep - Setup Guide

Complete setup instructions to get SpaceRep running locally.

## Prerequisites

- **Conda** (Anaconda or Miniconda)
- **Python 3.11+** (installed via conda)
- **Node.js 18+**
- **Supabase account** (free tier)
- **Google Cloud Console project** (for OAuth)

---

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned (takes ~2 minutes)
3. Note your project credentials:

**From Settings → API:**
- Project URL (e.g., `https://xxxxx.supabase.co`)
- Anon/Public key (starts with `eyJhbGc...`)
- Service role key (starts with `eyJhbGc...` - keep this secret!)

**From Settings → Database:**
- Connection String → URI format
- Should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- Replace `[YOUR-PASSWORD]` with your actual database password

### 1.2 Configure Google OAuth

1. Go to **Authentication → Providers → Google** in Supabase dashboard
2. Enable Google provider
3. Note the **Callback URL** (e.g., `https://your-project.supabase.co/auth/v1/callback`)

4. Go to [Google Cloud Console](https://console.cloud.google.com)
5. Create a new project or select an existing one
6. Enable **Google+ API** (or Identity Platform)
7. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
8. Configure consent screen if prompted
9. Add **Authorized redirect URIs**:
   - `http://localhost:5173` (for local development)
   - Your Supabase callback URL from step 3
10. Copy **Client ID** and **Client Secret**
11. Paste them into Supabase Google provider settings

---

## Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd backend

# Create conda environment with Python 3.11
conda create -n spacerep python=3.11 -y

# Activate conda environment
conda activate spacerep

# Install all dependencies
pip3 install -r requirements.txt
```

### 2.2 Configure Environment

**Navigate to project root and create .env file:**

```bash
cd ..  # Go back to project root
cp .env.example .env
```

Edit `.env` in the project root with your Supabase credentials:

```env
# Database connection
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Supabase API credentials
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Frontend environment variables (required by Vite)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:8000
```

**Important:**
- Replace placeholders with actual values from Step 1.1
- This single .env file is used by both backend and frontend
- VITE_ prefixed vars are for the frontend (Vite requirement)

### 2.3 Set Up Database

**Option A: Automated Setup (Recommended)**

```bash
# Run the setup script
chmod +x setup_db.sh
./setup_db.sh
```

**Option B: Manual Setup**

```bash
# Generate Prisma client
prisma generate --schema=./prisma/schema.prisma

# Push schema to Supabase database
prisma db push --schema=./prisma/schema.prisma
```

### 2.4 Configure Supabase Features

Go to **SQL Editor** in your Supabase dashboard and run the contents of `backend/supabase_setup.sql`.

**What this does:**
- ✅ Enables Row Level Security (RLS) on all tables
- ✅ Creates policies so users can only access their own data
- ✅ Sets up auto-profile creation trigger on user signup
- ✅ Adds validation constraints for status and rating fields

**To run:**
1. Open Supabase dashboard
2. Click **SQL Editor** in sidebar
3. Copy all contents from `backend/supabase_setup.sql`
4. Paste into editor and click **Run**

### 2.5 Start Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

**Verify it's working:**
- Open http://localhost:8000/docs
- You should see the FastAPI interactive docs

---

## Step 3: Frontend Setup

### 3.1 Install Dependencies

```bash
cd frontend  # From project root

# Install npm packages
npm install
```

### 3.2 Start Frontend Server

**Note:** Frontend uses the root `.env` file automatically (Vite reads VITE_ prefixed variables)

```bash
npm run dev
```

**Verify it's working:**
- Open http://localhost:5173
- You should see the SpaceRep login page

---

## Step 4: Test the Application

### 4.1 Sign In

1. Open http://localhost:5173
2. Click **"Continue with Google"**
3. Complete Google OAuth flow
4. You'll be redirected to the dashboard

### 4.2 Import Problems

**Option 1: Import a Preset List**
1. Go to **Collections** page
2. Click **"Create Collection"**
3. Name it (e.g., "Interview Prep")
4. Click **"Import Preset"**
5. Select **Blind 75**, **NeetCode 150**, or **Grind 75**
6. Choose your collection
7. Click **Import**

**Option 2: Add Problems Manually**
1. Go to **Items** page
2. Click **"Add Item"**
3. Fill in problem details:
   - Title: "Two Sum"
   - LeetCode URL: `https://leetcode.com/problems/two-sum/`
   - Difficulty: Easy/Medium/Hard
   - Topics: Array, Hash Table (comma-separated)
   - Pattern: Hash Map Lookup
   - Notes: Your personal notes
4. Click **"Add Problem"**

### 4.3 Start Reviewing

1. Go to **Dashboard**
2. You should see problems in "Due Today"
3. Click **"Start Review Session"**
4. For each problem:
   - Review the details and your notes
   - Click **"Open in LeetCode"** to attempt it
   - Come back and rate your recall:
     - **Forgot (1)**: Couldn't recall at all → resets to 1 day
     - **Hard (2)**: Recalled with significant struggle → short interval
     - **Good (3)**: Recalled with moderate effort → normal progression
     - **Easy (4)**: Instant recall → longer interval
5. Complete the session and view your stats!

---

## Common Issues & Troubleshooting

### Environment Variable Errors

**Error:** `Environment variable not found: DATABASE_URL`

**Solution:**
- Ensure `.env` exists in the **project root** (not backend/ or frontend/)
- Check there are no typos in the variable names
- Verify all required variables are present (see `.env.example`)

### Database Connection Errors

**Error:** `Error connecting to database` or `Connection refused`

**Solution:**
- Check your Supabase project is active (not paused)
- Verify database password in `DATABASE_URL` is correct
- Test connection string in Supabase dashboard → Database → Connection pooler
- Ensure you're using the **URI** format, not the session pooler string

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd backend
prisma generate --schema=./prisma/schema.prisma
```

### Google OAuth Errors

**Error:** `redirect_uri_mismatch` or auth errors

**Solution:**
- Verify `http://localhost:5173` is in Google OAuth redirect URIs
- Check Supabase callback URL is also in redirect URIs
- Ensure Google OAuth is enabled in Supabase dashboard
- Wait a few minutes after saving Google OAuth settings

### No Due Items After Import

**Issue:** Imported problems but dashboard shows 0 due

**Solution:**
- Items are scheduled for "now" by default, so they should appear
- Try refreshing the page
- Check **Items** page to verify problems were imported
- Verify you're signed in with the same account

### Port Already in Use

**Error:** `Address already in use` (port 8000 or 5173)

**Solution:**
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## Running the App (Daily Use)

Once set up, you only need two commands:

**Terminal 1 - Backend:**
```bash
cd backend
conda activate spacerep
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173

---

## Helpful Commands

### Backend Commands

```bash
# Start server with hot reload
uvicorn app.main:app --reload

# View API documentation
open http://localhost:8000/docs

# Open Prisma Studio (visual database browser)
prisma studio --schema=./prisma/schema.prisma

# Update database schema after editing prisma/schema.prisma
prisma db push --schema=./prisma/schema.prisma
prisma generate --schema=./prisma/schema.prisma

# Format Prisma schema file
prisma format --schema=./prisma/schema.prisma
```

### Frontend Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check  # if configured
```

---

## File Structure

```
SpacedRepetition/
├── .env                       # ⭐ Single config for entire project
├── .env.example               # Template with all required variables
├── .gitignore                 # Git ignore rules
│
├── backend/
│   ├── app/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── collections/       # Collection management
│   │   ├── items/             # LeetCode problems CRUD
│   │   ├── reviews/           # Review submission & SM-2 algorithm
│   │   ├── analytics/         # Dashboard stats & metrics
│   │   ├── presets/           # Preset list import
│   │   │   └── data/          # JSON preset files
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py          # Reads from root .env
│   │   ├── dependencies.py    # Auth middleware
│   │   └── database.py        # Prisma client manager
│   │
│   ├── prisma/
│   │   └── schema.prisma      # Database schema definition
│   │
│   ├── supabase_setup.sql     # RLS policies & triggers
│   ├── setup_db.sh            # Automated database setup
│   └── requirements.txt       # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── api/               # API client functions
    │   ├── components/        # Reusable UI components
    │   ├── pages/             # Page components
    │   ├── lib/               # Supabase client (reads VITE_ vars)
    │   ├── types/             # TypeScript types
    │   ├── App.tsx            # Root component
    │   └── main.tsx           # Entry point
    │
    ├── package.json           # Node dependencies
    ├── vite.config.ts         # Vite config (auto-loads root .env)
    └── tailwind.config.js     # Tailwind config
```

---

## Database Migrations with Prisma

This project uses **Prisma** for type-safe database management. Here's what you need to know:

### Making Schema Changes

1. Edit `backend/prisma/schema.prisma`
2. Push changes to database:
   ```bash
   cd backend
   prisma db push --schema=./prisma/schema.prisma
   ```
3. Regenerate client:
   ```bash
   prisma generate --schema=./prisma/schema.prisma
   ```
4. Restart your backend server

### Useful Prisma Commands

```bash
# Visual database browser
prisma studio --schema=./prisma/schema.prisma

# Validate schema file
prisma validate --schema=./prisma/schema.prisma

# Format schema file
prisma format --schema=./prisma/schema.prisma

# For production: create migration files
prisma migrate dev --name your_migration_name --schema=./prisma/schema.prisma
prisma migrate deploy --schema=./prisma/schema.prisma  # Deploy to prod
```

### Why Prisma?

- **Type-safe**: Auto-generated Python client with full type hints
- **Declarative**: Define schema in code, not SQL
- **Easy migrations**: One command to update database
- **Version controlled**: Schema is in git, not just in the database

---

## Next Steps

- **Learn more:** Read [README.md](README.md) for features and architecture
- **API reference:** Visit http://localhost:8000/docs for interactive API docs
- **Customize:** Edit `backend/prisma/schema.prisma` to modify database schema

---

## Production Deployment

For production deployment:

1. **Database:** Use `prisma migrate` instead of `prisma db push` for migration history
2. **Environment:** Set production environment variables
3. **CORS:** Update allowed origins in `backend/app/main.py`
4. **Build:** Run `npm run build` in frontend and serve `dist/` folder
5. **Secrets:** Use environment variable management (e.g., Vercel, Railway, Render)

See deployment guides for:
- Backend: [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io)
- Frontend: [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com)

---

**Happy studying with SpaceRep! 🎉**

For issues or questions, check the [README.md](README.md) or open an issue on GitHub.
