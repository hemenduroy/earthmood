# Supabase Configuration and Migrations

This directory contains all Supabase-related configuration and database migrations for the EarthMood project.

## Structure

- `config.toml` - Supabase project configuration
- `migrations/` - Database migrations (proper Supabase format)
- `schema.sql` - Main schema file (moved from database/supabase-schema.sql)
- `setup_complete.sql` - Complete setup script with sample data (for local development)

## Migration System

We use the proper Supabase migration system with timestamped migration files.

### Current Migration Files:
- `20240711000000_global_stats_functions.sql` - Global mood statistics functions
- `20241219000000_fix_time_range_support.sql` - Fixed time range support in get_mood_map_data

### Migration History
The Supabase CLI tracks which migrations have been applied. If you see migration history mismatches, you can repair them:

```bash
# Check migration status
supabase migration list

# Repair specific migrations if needed
supabase migration repair --status applied 20240711000000
supabase migration repair --status applied 20241219000000
```

## Deployment

The GitHub Action automatically applies migrations using:
1. `supabase link --project-ref <your-project-ref>` (see `.github/workflows/deploy.yml`)
2. `supabase db pull` - Gets current schema
3. `supabase db push` - Applies new migrations

## Local Development

### Setup
```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Pull current schema
supabase db pull

# Apply migrations
supabase db push
```

### Creating New Migrations
```bash
# Create a new migration
supabase migration new migration_name

# This creates a file like: 20241219120000_migration_name.sql
```

### Manual Setup (Alternative)
```bash
# Apply the complete setup (includes sample data)
psql -f supabase/setup_complete.sql

# Or apply individual migrations
psql -f supabase/migrations/20240711000000_global_stats_functions.sql
psql -f supabase/migrations/20241219000000_fix_time_range_support.sql
```

## Schema Overview

### Tables
- `mood_entries` - Main table for mood submissions
- `recent_moods` - Optimized table for recent mood access
- `mood_aggregations` - Aggregated mood data for map rendering

### Functions
- `get_mood_map_data()` - Get grouped mood data for map display
- `get_recent_moods()` - Get recent mood submissions
- `get_global_mood_stats()` - Get global mood distribution
- `get_world_coverage()` - Calculate world coverage percentage
- `get_comprehensive_global_stats()` - Get comprehensive global statistics
- `maintain_recent_moods()` - Trigger function to maintain recent moods

## Project Configuration

Do **not** commit real passwords or connection strings. Use Supabase Dashboard → **Settings → Database** for your project’s password and pooler URL, or GitHub Actions secrets (`SUPABASE_DB_PASSWORD`, etc.).

- **Project Reference**: set in `.github/workflows/deploy.yml` (`supabase link --project-ref …`) or replace with your own project ref locally.

## Notes

- All database-related files are now consolidated in this `supabase/` directory
- The old `database/` directory has been removed to avoid confusion
- Use `supabase db push` for applying migrations, not manual SQL execution
- The `schema.sql` file is kept for reference but migrations are the authoritative source 