#!/bin/bash
# Push Prisma schema to Supabase database

echo "Pushing schema to database..."
prisma db push --schema=./prisma/schema.prisma

echo "Database schema updated successfully!"
echo "Don't forget to set up RLS policies and triggers in Supabase dashboard."
