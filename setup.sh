#!/usr/bin/env bash
# InsureIQ Setup Script
# Run this after cloning to initialize the development environment
set -e

echo "=== InsureIQ Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required"; exit 1; }

echo "1. Installing dependencies..."
npm install

echo ""
echo "2. Generating Prisma client..."
npx prisma generate

echo ""
echo "3. Pushing database schema..."
npx prisma db push

echo ""
echo "4. Seeding demo data..."
npx tsx prisma/seed.ts

echo ""
echo "=== Setup Complete ==="
echo "Run 'npm run dev' to start the development server."
echo "Visit http://localhost:3000 to access the app."
echo ""
echo "Demo credentials:"
echo "  Email:    demo@insureiq.com"
echo "  Password: password123"
echo ""