#!/bin/bash

# Database management script for EarthMood
# Requires env vars (never commit real values):
#   SUPABASE_DB_PASSWORD — from Supabase Dashboard → Settings → Database
# Optional:
#   SUPABASE_PROJECT_REF — if you use `supabase link` outside this script

set -e

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "Error: Set SUPABASE_DB_PASSWORD in your environment (e.g. export in shell or .env.local — do not commit)."
  exit 1
fi

# Function to show usage
show_usage() {
    echo "EarthMood Database Management Script"
    echo ""
    echo "Usage: SUPABASE_DB_PASSWORD=... ./scripts/db.sh [command]"
    echo ""
    echo "Commands:"
    echo "  push      - Apply migrations to production"
    echo "  reset     - Reset database (development only)"
    echo "  diff      - Show database changes"
    echo "  generate  - Create new migration"
    echo "  status    - Show migration status"
    echo "  help      - Show this help message"
}

if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

case $1 in
    "push")
        echo "Applying migrations to production..."
        supabase db push
        ;;
    "reset")
        echo "Resetting database (development only)..."
        supabase db reset
        ;;
    "diff")
        echo "Showing database changes..."
        supabase db diff
        ;;
    "generate")
        if [ -z "$2" ]; then
            echo "Error: Migration name required"
            echo "Usage: ./scripts/db.sh generate migration_name"
            exit 1
        fi
        echo "Creating new migration: $2"
        supabase migration new "$2"
        ;;
    "status")
        echo "Checking migration status..."
        supabase db push --dry-run
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
