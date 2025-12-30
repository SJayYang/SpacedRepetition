#!/bin/bash
# Generate Prisma client

echo "Generating Prisma client..."
prisma generate --schema=./prisma/schema.prisma

echo "Prisma client generated successfully!"
