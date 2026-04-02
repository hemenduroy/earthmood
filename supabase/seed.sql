-- supabase/seed.sql
-- This script is used to seed the database with initial data for development.
-- It is automatically run by `supabase db reset`.

-- 1. WIPE all previous 'system' user entries to ensure a clean slate
DELETE FROM public.mood_entries WHERE user_id = 'system';

-- 2. Use a Common Table Expression (CTE) to define locations and insert new data
WITH sample_locations (latitude, longitude, city_name, state_name, country_name) AS (
    VALUES
        -- 20 entries in the United States
        (40.7128, -74.0060, 'New York City', 'New York', 'United States'),
        (34.0522, -118.2437, 'Los Angeles', 'California', 'United States'),
        (41.8781, -87.6298, 'Chicago', 'Illinois', 'United States'),
        (29.7604, -95.3698, 'Houston', 'Texas', 'United States'),
        (33.4484, -112.0740, 'Phoenix', 'Arizona', 'United States'),
        (39.9526, -75.1652, 'Philadelphia', 'Pennsylvania', 'United States'),
        (29.4241, -98.4936, 'San Antonio', 'Texas', 'United States'),
        (32.7157, -117.1611, 'San Diego', 'California', 'United States'),
        (32.7767, -96.7970, 'Dallas', 'Texas', 'United States'),
        (37.3382, -121.8863, 'San Jose', 'California', 'United States'),
        (47.6062, -122.3321, 'Seattle', 'Washington', 'United States'),
        (39.7392, -104.9903, 'Denver', 'Colorado', 'United States'),
        (38.9072, -77.0369, 'Washington', 'D.C.', 'United States'),
        (42.3601, -71.0589, 'Boston', 'Massachusetts', 'United States'),
        (25.7617, -80.1918, 'Miami', 'Florida', 'United States'),
        (33.7490, -84.3880, 'Atlanta', 'Georgia', 'United States'),
        (39.2904, -76.6122, 'Baltimore', 'Maryland', 'United States'),
        (44.9778, -93.2650, 'Minneapolis', 'Minnesota', 'United States'),
        (36.1627, -86.7816, 'Nashville', 'Tennessee', 'United States'),
        (30.2672, -97.7431, 'Austin', 'Texas', 'United States'),
        
        -- 15 entries in other large countries
        (19.0760, 72.8777, 'Mumbai', 'Maharashtra', 'India'),
        (28.7041, 77.1025, 'Delhi', 'Delhi', 'India'),
        (12.9716, 77.5946, 'Bangalore', 'Karnataka', 'India'),
        (39.9042, 116.4074, 'Beijing', 'Beijing', 'China'),
        (31.2304, 121.4737, 'Shanghai', 'Shanghai', 'China'),
        (-23.5505, -46.6333, 'São Paulo', 'São Paulo', 'Brazil'),
        (-22.9068, -43.1729, 'Rio de Janeiro', 'Rio de Janeiro', 'Brazil'),
        (55.7558, 37.6173, 'Moscow', 'Moscow', 'Russia'),
        (59.9343, 30.3351, 'Saint Petersburg', 'Leningrad Oblast', 'Russia'),
        (6.5244, 3.3792, 'Lagos', 'Lagos', 'Nigeria'),
        (35.6895, 139.6917, 'Tokyo', 'Tokyo', 'Japan'),
        (52.5200, 13.4050, 'Berlin', 'Berlin', 'Germany'),
        (51.5074, -0.1278, 'London', 'England', 'United Kingdom'),
        (48.8566, 2.3522, 'Paris', 'Île-de-France', 'France'),
        (43.6532, -79.3832, 'Toronto', 'Ontario', 'Canada'),

        -- 15 entries from all over the world
        (-33.8688, 151.2093, 'Sydney', 'New South Wales', 'Australia'),
        (-34.6037, -58.3816, 'Buenos Aires', 'Buenos Aires', 'Argentina'),
        (30.0444, 31.2357, 'Cairo', 'Cairo', 'Egypt'),
        (40.4168, -3.7038, 'Madrid', 'Community of Madrid', 'Spain'),
        (-26.2041, 28.0473, 'Johannesburg', 'Gauteng', 'South Africa'),
        (59.9139, 10.7522, 'Oslo', 'Oslo', 'Norway'),
        (46.8182, 8.2275, 'Bern', 'Canton of Bern', 'Switzerland'),
        (35.6892, 51.3890, 'Tehran', 'Tehran', 'Iran'),
        (-33.9249, 18.4241, 'Cape Town', 'Western Cape', 'South Africa'),
        (3.1390, 101.6869, 'Kuala Lumpur', 'Kuala Lumpur', 'Malaysia'),
        (60.1699, 24.9384, 'Helsinki', 'Uusimaa', 'Finland'),
        (-1.2921, 36.8219, 'Nairobi', 'Nairobi', 'Kenya'),
        (-12.0464, -77.0428, 'Lima', 'Lima', 'Peru'),
        (13.7563, 100.5018, 'Bangkok', 'Bangkok', 'Thailand'),
        (52.3676, 4.9041, 'Amsterdam', 'North Holland', 'Netherlands')
),
numbered_locations AS (
    SELECT *, ROW_NUMBER() OVER () as rn
    FROM sample_locations
)
INSERT INTO public.mood_entries (user_id, timestamp, latitude, longitude, mood_type, city_name, state_name, country_name)
SELECT
    'system',
    (NOW() - INTERVAL '1 day') + (rn * INTERVAL '28.8 minutes'),
    sl.latitude,
    sl.longitude,
    (ARRAY['joy', 'surprise', 'disgust', 'sadness', 'fear', 'anger'])[floor(random() * 6) + 1],
    sl.city_name,
    sl.state_name,
    sl.country_name
FROM numbered_locations sl; 