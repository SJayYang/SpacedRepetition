#!/bin/bash
# Complete database setup script for SpaceRep

set -e  # Exit on error

echo "======================================"
echo "SpaceRep Database Setup"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.example and add your Supabase credentials."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ Error: DATABASE_URL not found in .env"
    echo "Please add your Supabase database connection string to .env"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Step 1: Generate Prisma client
echo "📦 Step 1/3: Generating Prisma client..."
prisma generate --schema=./prisma/schema.prisma
echo "✅ Prisma client generated"
echo ""

# Step 2: Push schema to database
echo "🚀 Step 2/3: Pushing schema to Supabase..."
prisma db push --schema=./prisma/schema.prisma
echo "✅ Database schema pushed"
echo ""

# Step 3: Instructions for RLS setup
echo "⚙️  Step 3/3: Supabase-specific setup"
echo ""
echo "Please complete the following manual step:"
echo "1. Go to your Supabase dashboard"
echo "2. Open SQL Editor"
echo "3. Copy and run the contents of 'supabase_setup.sql'"
echo ""
echo "This sets up:"
echo "  - Row Level Security (RLS) policies"
echo "  - Auto-profile creation trigger"
echo "  - Validation constraints"
echo ""
echo "======================================"
echo "🎉 Database setup complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run the SQL from supabase_setup.sql in Supabase dashboard"
echo "2. Start the backend: uvicorn app.main:app --reload"
echo ""
