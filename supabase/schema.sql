-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'anonymous',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN ('joy', 'surprise', 'disgust', 'sadness', 'fear', 'anger')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    city_name TEXT,
    state_name TEXT,
    country_name TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mood_entries_timestamp ON mood_entries (timestamp);
CREATE INDEX IF NOT EXISTS idx_mood_entries_mood_type ON mood_entries (mood_type);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_timestamp ON mood_entries (user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_mood_entries_lat_lng ON mood_entries (latitude, longitude);


DROP FUNCTION IF EXISTS get_mood_map_data(TEXT, INTEGER, TEXT);

-- Function to get mood data for map view with aggregation
CREATE OR REPLACE FUNCTION get_mood_map_data(
    p_bounds TEXT,
    p_zoom INTEGER DEFAULT 10,
    p_time_range TEXT DEFAULT '24 hours'
) RETURNS TABLE(
    grid_id TEXT,
    center_lat DECIMAL(10, 8),
    center_lng DECIMAL(11, 8),
    mood_type TEXT,
    count INTEGER
) AS $$
DECLARE
    bounds_array TEXT[];
    min_lat DECIMAL(10, 8);
    max_lat DECIMAL(10, 8);
    min_lng DECIMAL(11, 8);
    max_lng DECIMAL(11, 8);
    grid_size DECIMAL;
    time_filter TIMESTAMPTZ;
BEGIN
    -- Parse bounds parameter (format: "min_lat,min_lng,max_lat,max_lng")
    bounds_array := string_to_array(p_bounds, ',');
    min_lat := bounds_array[1]::DECIMAL(10, 8);
    min_lng := bounds_array[2]::DECIMAL(11, 8);
    max_lat := bounds_array[3]::DECIMAL(10, 8);
    max_lng := bounds_array[4]::DECIMAL(11, 8);

    -- Calculate grid size based on zoom level
    grid_size := CASE
        WHEN p_zoom >= 15 THEN 0.001  -- Very detailed
        WHEN p_zoom >= 12 THEN 0.01   -- Detailed
        WHEN p_zoom >= 8 THEN 0.1     -- Medium
        ELSE 1.0                      -- Coarse
    END;

    -- Calculate time filter with support for '1 year' and 'all time'
    time_filter := CASE p_time_range
        WHEN '1 hour' THEN NOW() - INTERVAL '1 hour'
        WHEN '24 hours' THEN NOW() - INTERVAL '24 hours'
        WHEN '7 days' THEN NOW() - INTERVAL '7 days'
        WHEN '30 days' THEN NOW() - INTERVAL '30 days'
        WHEN '1 year' THEN NOW() - INTERVAL '1 year'
        WHEN 'all time' THEN '1970-01-01'::TIMESTAMPTZ  -- Very old date to include all entries
        ELSE NOW() - INTERVAL '24 hours'  -- Default fallback
    END;

    RETURN QUERY
    SELECT
        grid_cell as grid_id,
        center_lat,
        center_lng,
        mood_type,
        total_count as count
    FROM (
        SELECT
            CONCAT(
                FLOOR(entries.latitude / grid_size)::TEXT, '_',
                FLOOR(entries.longitude / grid_size)::TEXT
            ) as grid_cell,
            (FLOOR(entries.latitude / grid_size) * grid_size + grid_size / 2)::DECIMAL(10, 8) as center_lat,
            (FLOOR(entries.longitude / grid_size) * grid_size + grid_size / 2)::DECIMAL(11, 8) as center_lng,
            FIRST_VALUE(entries.mood_type) OVER w AS mood_type,
            COUNT(*) OVER w AS total_count,
            MAX(entries.timestamp) OVER w AS max_timestamp,
            ROW_NUMBER() OVER w AS rn
        FROM mood_entries entries
        WHERE
            entries.latitude BETWEEN min_lat AND max_lat
            AND entries.longitude BETWEEN min_lng AND max_lng
            AND entries.timestamp >= time_filter
        WINDOW w AS (
            PARTITION BY FLOOR(entries.latitude / grid_size), FLOOR(entries.longitude / grid_size)
            ORDER BY entries.timestamp DESC
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        )
    ) ranked
    WHERE rn = 1
    ORDER BY max_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Create recent_moods table for optimized recent moods access
CREATE TABLE IF NOT EXISTS recent_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mood_entry_id UUID NOT NULL REFERENCES mood_entries(id) ON DELETE CASCADE,
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

-- Create index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_recent_moods_created_at ON recent_moods(created_at DESC);

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_recent_moods_mood_entry_id ON recent_moods(mood_entry_id);

-- Function to maintain recent moods (keeps only the 5 most recent)
CREATE OR REPLACE FUNCTION maintain_recent_moods()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the new update
    INSERT INTO recent_moods (
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
    DELETE FROM recent_moods 
    WHERE id NOT IN (
        SELECT id FROM recent_moods 
        ORDER BY created_at DESC 
        LIMIT 5
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically maintain recent moods
DROP TRIGGER IF EXISTS trigger_maintain_recent_moods ON mood_entries;
CREATE TRIGGER trigger_maintain_recent_moods
    AFTER INSERT ON mood_entries
    FOR EACH ROW
    EXECUTE FUNCTION maintain_recent_moods();

-- Function to get recent moods (for API)
CREATE OR REPLACE FUNCTION get_recent_moods()
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
    FROM recent_moods ru
    ORDER BY ru.created_at DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to get global mood statistics (counts and percentages)
CREATE OR REPLACE FUNCTION get_global_mood_stats(p_time_range TEXT DEFAULT '24 hours')
RETURNS TABLE(mood_type TEXT, count BIGINT, percentage NUMERIC) AS $$
DECLARE
    time_filter TIMESTAMPTZ;
    total_count BIGINT;
BEGIN
    time_filter := CASE p_time_range
        WHEN '1 hour' THEN NOW() - INTERVAL '1 hour'
        WHEN '24 hours' THEN NOW() - INTERVAL '24 hours'
        WHEN '7 days' THEN NOW() - INTERVAL '7 days'
        WHEN '30 days' THEN NOW() - INTERVAL '30 days'
        WHEN '1 year' THEN NOW() - INTERVAL '1 year'
        WHEN 'all time' THEN '1970-01-01'::TIMESTAMPTZ
        ELSE NOW() - INTERVAL '24 hours'
    END;

    SELECT COUNT(*) INTO total_count FROM mood_entries WHERE timestamp >= time_filter;

    IF total_count = 0 THEN
        RETURN QUERY SELECT m.mood, 0::BIGINT, 0::NUMERIC FROM (VALUES ('joy'), ('surprise'), ('disgust'), ('sadness'), ('fear'), ('anger')) AS m(mood);
    ELSE
        RETURN QUERY
        SELECT
            me.mood_type,
            COUNT(me.id),
            (COUNT(me.id)::NUMERIC / total_count * 100)
        FROM mood_entries me
        WHERE me.timestamp >= time_filter
        GROUP BY me.mood_type;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive global stats (submissions, locations, etc.)
CREATE OR REPLACE FUNCTION get_comprehensive_global_stats(p_time_range TEXT DEFAULT '24 hours')
RETURNS TABLE(total_submissions BIGINT, unique_locations BIGINT, coverage_percentage NUMERIC, covered_area_km2 NUMERIC) AS $$
DECLARE
    time_filter TIMESTAMPTZ;
BEGIN
    time_filter := CASE p_time_range
        WHEN '1 hour' THEN NOW() - INTERVAL '1 hour'
        WHEN '24 hours' THEN NOW() - INTERVAL '24 hours'
        WHEN '7 days' THEN NOW() - INTERVAL '7 days'
        WHEN '30 days' THEN NOW() - INTERVAL '30 days'
        WHEN '1 year' THEN NOW() - INTERVAL '1 year'
        WHEN 'all time' THEN '1970-01-01'::TIMESTAMPTZ
        ELSE NOW() - INTERVAL '24 hours'
    END;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM mood_entries WHERE timestamp >= time_filter) AS total_submissions,
        (SELECT COUNT(DISTINCT (country_name, city_name)) FROM mood_entries WHERE timestamp >= time_filter) AS unique_locations,
        0::NUMERIC AS coverage_percentage, -- Placeholder
        0::NUMERIC AS covered_area_km2;    -- Placeholder
END;
$$ LANGUAGE plpgsql;


-- Enable Row Level Security (RLS)
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to mood_entries" ON mood_entries
    FOR SELECT USING (true);

-- Create policy for inserting mood entries (we'll update this later for auth)
CREATE POLICY "Allow public insert to mood_entries" ON mood_entries
    FOR INSERT WITH CHECK (true);

-- Grant all permissions to anon and authenticated users
GRANT ALL ON mood_entries TO anon;
GRANT ALL ON mood_entries TO authenticated;
GRANT ALL ON recent_moods TO anon;
GRANT ALL ON recent_moods TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_moods() TO anon;
GRANT EXECUTE ON FUNCTION get_recent_moods() TO authenticated; 
GRANT EXECUTE ON FUNCTION get_global_mood_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_global_mood_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comprehensive_global_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_comprehensive_global_stats(TEXT) TO authenticated; 