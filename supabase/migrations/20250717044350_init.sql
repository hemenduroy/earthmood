--  This is the single, definitive, idempotent initial schema for the project.

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create all tables first, ensuring they exist before we try to drop objects on them.
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'anonymous',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN ('joy', 'surprise', 'disgust', 'sadness', 'fear', 'anger')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    city_name TEXT,
    state_name TEXT,
    country_name TEXT,
    location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED
);

CREATE TABLE IF NOT EXISTS public.recent_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mood_entry_id UUID NOT NULL REFERENCES public.mood_entries(id) ON DELETE CASCADE,
    mood_type TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    user_id TEXT NOT NULL,
    city_name TEXT,
    state_name TEXT,
    country_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Drop all dependent objects and old functions to ensure a clean slate.
DROP TRIGGER IF EXISTS trigger_maintain_recent_moods ON public.mood_entries;
DROP FUNCTION IF EXISTS public.maintain_recent_moods();
DROP FUNCTION IF EXISTS public.get_mood_map_data(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.get_global_mood_stats(TEXT);
DROP FUNCTION IF EXISTS public.get_comprehensive_global_stats(TEXT);
DROP FUNCTION IF EXISTS public.get_recent_moods();

-- 3. Recreate all indexes and functions with the corrected, robust, and idempotent code.
CREATE INDEX IF NOT EXISTS idx_mood_entries_timestamp ON public.mood_entries (timestamp);
CREATE INDEX IF NOT EXISTS idx_mood_entries_mood_type ON public.mood_entries (mood_type);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_timestamp ON public.mood_entries (user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_mood_entries_lat_lng ON public.mood_entries (latitude, longitude);

CREATE OR REPLACE FUNCTION public.get_mood_map_data(
    p_bounds TEXT,
    p_zoom INTEGER DEFAULT 10,
    p_time_range TEXT DEFAULT '24 hours'
) RETURNS TABLE(
    o_grid_id TEXT,
    o_center_lat DECIMAL(10, 8),
    o_center_lng DECIMAL(11, 8),
    o_mood_type VARCHAR(20),
    o_count INTEGER
) AS $$
DECLARE
    v_bounds_array TEXT[];
    v_min_lat DECIMAL(10, 8);
    v_max_lat DECIMAL(10, 8);
    v_min_lng DECIMAL(11, 8);
    v_max_lng DECIMAL(11, 8);
    v_grid_size DECIMAL;
    v_time_filter TIMESTAMPTZ;
BEGIN
    -- Parse bounds parameter
    v_bounds_array := string_to_array(p_bounds, ',');
    v_min_lat := v_bounds_array[1]::DECIMAL(10, 8);
    v_min_lng := v_bounds_array[2]::DECIMAL(11, 8);
    v_max_lat := v_bounds_array[3]::DECIMAL(10, 8);
    v_max_lng := v_bounds_array[4]::DECIMAL(11, 8);

    -- Calculate grid size based on zoom level
    v_grid_size := CASE
        WHEN p_zoom >= 15 THEN 0.001
        WHEN p_zoom >= 12 THEN 0.01
        WHEN p_zoom >= 8 THEN 0.1
        ELSE 1.0
    END;

    -- Calculate time filter
    v_time_filter := CASE p_time_range
        WHEN '1 hour' THEN NOW() - INTERVAL '1 hour'
        WHEN '24 hours' THEN NOW() - INTERVAL '24 hours'
        WHEN '7 days' THEN NOW() - INTERVAL '7 days'
        WHEN '30 days' THEN NOW() - INTERVAL '30 days'
        WHEN '1 year' THEN NOW() - INTERVAL '1 year'
        WHEN 'all time' THEN '1970-01-01'::TIMESTAMPTZ
        ELSE NOW() - INTERVAL '24 hours'
    END;

    RETURN QUERY
    WITH gridded_entries AS (
        SELECT
            *,
            FLOOR(latitude / v_grid_size) as lat_grid,
            FLOOR(longitude / v_grid_size) as lng_grid
        FROM public.mood_entries
        WHERE
            latitude BETWEEN v_min_lat AND v_max_lat
            AND longitude BETWEEN v_min_lng AND v_max_lng
            AND timestamp >= v_time_filter
    ),
    aggregated_grids AS (
        SELECT
            lat_grid,
            lng_grid,
            COUNT(*) as mood_count,
            (array_agg(mood_type ORDER BY timestamp DESC))[1] as most_recent_mood
        FROM gridded_entries
        GROUP BY lat_grid, lng_grid
    )
    SELECT
        CONCAT(ag.lat_grid::TEXT, '_', ag.lng_grid::TEXT),
        (ag.lat_grid * v_grid_size + v_grid_size / 2)::DECIMAL(10, 8),
        (ag.lng_grid * v_grid_size + v_grid_size / 2)::DECIMAL(11, 8),
        ag.most_recent_mood,
        ag.mood_count::INTEGER
    FROM aggregated_grids ag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_recent_moods_created_at ON public.recent_moods(created_at DESC);

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_recent_moods_mood_entry_id ON public.recent_moods(mood_entry_id);

-- Function to maintain recent moods (keeps only the 5 most recent)
CREATE OR REPLACE FUNCTION public.maintain_recent_moods()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the new update
    INSERT INTO public.recent_moods (
        mood_entry_id,
        mood_type,
        latitude,
        longitude,
        user_id,
        city_name,
        state_name,
        country_name,
        created_at
    ) VALUES (
        NEW.id,
        NEW.mood_type,
        NEW.latitude,
        NEW.longitude,
        NEW.user_id,
        NEW.city_name,
        NEW.state_name,
        NEW.country_name,
        NEW.timestamp
    );
    
    -- Remove oldest entries if we have more than 5
    DELETE FROM public.recent_moods 
    WHERE id NOT IN (
        SELECT id FROM public.recent_moods 
        ORDER BY created_at DESC 
        LIMIT 5
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically maintain recent moods
DROP TRIGGER IF EXISTS trigger_maintain_recent_moods ON public.mood_entries;
CREATE TRIGGER trigger_maintain_recent_moods
    AFTER INSERT ON public.mood_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_recent_moods();

-- Function to get recent moods (for API)
CREATE OR REPLACE FUNCTION public.get_recent_moods()
RETURNS TABLE (
    id UUID,
    mood_type TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    user_id TEXT,
    city_name TEXT,
    state_name TEXT,
    country_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ru.id,
        ru.mood_type,
        ru.latitude,
        ru.longitude,
        ru.user_id,
        ru.city_name,
        ru.state_name,
        ru.country_name,
        ru.created_at
    FROM public.recent_moods ru
    ORDER BY ru.created_at DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to get global mood statistics (counts and percentages)
CREATE OR REPLACE FUNCTION public.get_global_mood_stats(p_time_range TEXT DEFAULT '24 hours')
RETURNS TABLE(o_mood_type TEXT, o_count BIGINT, o_percentage NUMERIC) AS $$
DECLARE
    v_time_filter TIMESTAMPTZ;
BEGIN
    v_time_filter := CASE p_time_range
        WHEN '1 hour' THEN NOW() - INTERVAL '1 hour'
        WHEN '24 hours' THEN NOW() - INTERVAL '24 hours'
        WHEN '7 days' THEN NOW() - INTERVAL '7 days'
        WHEN '30 days' THEN NOW() - INTERVAL '30 days'
        WHEN '1 year' THEN NOW() - INTERVAL '1 year'
        WHEN 'all time' THEN '1970-01-01'::TIMESTAMPTZ
        ELSE NOW() - INTERVAL '24 hours'
    END;

    RETURN QUERY
    WITH filtered_entries AS (
        SELECT me.mood_type
        FROM public.mood_entries me
        WHERE me.timestamp >= v_time_filter
    ),
    total AS (
        SELECT count(*) AS ct FROM filtered_entries
    )
    SELECT
        mood.type,
        count(fe.mood_type),
        CASE
            WHEN total.ct = 0 THEN 0
            ELSE round(count(fe.mood_type)::numeric * 100 / total.ct, 2)
        END AS percentage
    FROM (
        VALUES ('joy'), ('surprise'), ('disgust'), ('sadness'), ('fear'), ('anger')
    ) AS mood(type)
    LEFT JOIN filtered_entries fe ON fe.mood_type = mood.type
    CROSS JOIN total
    GROUP BY mood.type, total.ct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive global stats (submissions, locations, etc.)
CREATE OR REPLACE FUNCTION public.get_comprehensive_global_stats(p_time_range TEXT DEFAULT '24 hours')
RETURNS TABLE(o_total_submissions BIGINT, o_unique_locations BIGINT, o_coverage_percentage NUMERIC, o_covered_area_km2 NUMERIC) AS $$
DECLARE
    v_time_filter TIMESTAMPTZ;
    v_total_land_area_km2 NUMERIC := 148940000; -- Approximate world land area in km²
    v_covered_area GEOMETRY;
BEGIN
    v_time_filter := CASE p_time_range
        WHEN '1 hour' THEN NOW() - INTERVAL '1 hour'
        WHEN '24 hours' THEN NOW() - INTERVAL '24 hours'
        WHEN '7 days' THEN NOW() - INTERVAL '7 days'
        WHEN '30 days' THEN NOW() - INTERVAL '30 days'
        WHEN '1 year' THEN NOW() - INTERVAL '1 year'
        WHEN 'all time' THEN '1970-01-01'::TIMESTAMPTZ
        ELSE NOW() - INTERVAL '24 hours'
    END;

    -- Calculate the union of all mood entry locations to get the total covered area
    SELECT ST_Union(ST_Buffer(location::geography, 10000)::geometry) INTO v_covered_area
    FROM public.mood_entries
    WHERE timestamp >= v_time_filter;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.mood_entries WHERE timestamp >= v_time_filter) AS total_submissions,
        (SELECT COUNT(DISTINCT (country_name, city_name)) FROM public.mood_entries WHERE timestamp >= v_time_filter) AS unique_locations,
        CASE
            WHEN v_covered_area IS NULL THEN 0::NUMERIC
            ELSE (ST_Area(v_covered_area::geography) / 1000000) / v_total_land_area_km2 * 100
        END::NUMERIC AS coverage_percentage,
        CASE
            WHEN v_covered_area IS NULL THEN 0::NUMERIC
            ELSE (ST_Area(v_covered_area::geography) / 1000000)
        END::NUMERIC AS covered_area_km2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable Row Level Security (RLS)
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access to mood_entries" ON public.mood_entries;
CREATE POLICY "Allow public read access to mood_entries" ON public.mood_entries
    FOR SELECT USING (true);

-- Create policy for inserting mood entries (we'll update this later for auth)
DROP POLICY IF EXISTS "Allow public insert to mood_entries" ON public.mood_entries;
CREATE POLICY "Allow public insert to mood_entries" ON public.mood_entries
    FOR INSERT WITH CHECK (true);

-- Grant all permissions to anon and authenticated users
GRANT ALL ON TABLE public.mood_entries TO anon, authenticated;
GRANT ALL ON TABLE public.recent_moods TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_moods() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_mood_stats(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_comprehensive_global_stats(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.maintain_recent_moods() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_mood_map_data(TEXT, INTEGER, TEXT) TO anon, authenticated; 