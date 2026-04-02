/**
 * Local-only API fixtures for README screenshots (no Supabase).
 * Set SCREENSHOT_MOCK=1 in frontend/.env.local
 */
import { EXTRA_LAND_ANCHORS } from './screenshotMockLandAnchors';

export function screenshotMockEnabled(): boolean {
  const v = process.env.SCREENSHOT_MOCK;
  return v === '1' || v === 'true';
}

const MOODS = ['joy', 'surprise', 'disgust', 'sadness', 'fear', 'anger'] as const;

/** Deterministic PRNG for stable screenshot layout */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const now = () => new Date().toISOString();

const MAP_POINT_COUNT = 1000;
const RECENT_MOOD_COUNT = 300;

/** Max offset from each land anchor (~13 km); keeps island / coastal hubs on land */
const LAND_JITTER_DEG = 0.12;

const CITY_SEEDS: {
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}[] = [
  { city: 'New York', state: 'NY', country: 'United States', lat: 40.7128, lng: -74.006 },
  { city: 'London', state: 'England', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { city: 'Tokyo', state: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { city: 'São Paulo', state: 'SP', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { city: 'Lagos', state: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Mumbai', state: 'MH', country: 'India', lat: 19.076, lng: 72.8777 },
  { city: 'Cairo', state: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { city: 'Mexico City', state: 'CMX', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
  { city: 'Beijing', state: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  { city: 'Sydney', state: 'NSW', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { city: 'Paris', state: 'Île-de-France', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Berlin', state: 'BE', country: 'Germany', lat: 52.52, lng: 13.405 },
  { city: 'Toronto', state: 'ON', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { city: 'Johannesburg', state: 'GP', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { city: 'Seoul', state: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  { city: 'Madrid', state: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { city: 'Buenos Aires', state: 'CABA', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { city: 'Istanbul', state: 'Istanbul', country: 'Türkiye', lat: 41.0082, lng: 28.9784 },
  { city: 'Kolkata', state: 'WB', country: 'India', lat: 22.5726, lng: 88.3639 },
  { city: 'Manila', state: 'NCR', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { city: 'Tianjin', state: 'Tianjin', country: 'China', lat: 39.3434, lng: 117.3616 },
  { city: 'Rio de Janeiro', state: 'RJ', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
  { city: 'Los Angeles', state: 'CA', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { city: 'Bangkok', state: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { city: 'Lima', state: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  { city: 'Chennai', state: 'TN', country: 'India', lat: 13.0827, lng: 80.2707 },
  { city: 'Chicago', state: 'IL', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { city: 'Bogotá', state: 'Bogotá', country: 'Colombia', lat: 4.711, lng: -74.0721 },
  { city: 'Ho Chi Minh City', state: 'SG', country: 'Vietnam', lat: 10.8231, lng: 106.6297 },
  { city: 'Hyderabad', state: 'TG', country: 'India', lat: 17.385, lng: 78.4867 },
  { city: 'Dubai', state: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { city: 'Singapore', state: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Melbourne', state: 'VIC', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { city: 'Riyadh', state: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { city: 'Warsaw', state: 'Masovian', country: 'Poland', lat: 52.2297, lng: 21.0122 },
  { city: 'Nairobi', state: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { city: 'Hanoi', state: 'HN', country: 'Vietnam', lat: 21.0285, lng: 105.8542 },
  { city: 'Ahmedabad', state: 'GJ', country: 'India', lat: 23.0225, lng: 72.5714 },
  { city: 'Kuala Lumpur', state: 'KL', country: 'Malaysia', lat: 3.139, lng: 101.6869 },
  { city: 'Hong Kong', state: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 },
  { city: 'Dallas', state: 'TX', country: 'United States', lat: 32.7767, lng: -96.797 },
  { city: 'Philadelphia', state: 'PA', country: 'United States', lat: 39.9526, lng: -75.1652 },
  { city: 'Barcelona', state: 'Catalonia', country: 'Spain', lat: 41.3874, lng: 2.1686 },
  { city: 'Athens', state: 'Attica', country: 'Greece', lat: 37.9838, lng: 23.7275 },
  { city: 'Auckland', state: 'Auckland', country: 'New Zealand', lat: -36.8509, lng: 174.7645 },
  { city: 'Stockholm', state: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  { city: 'Osaka', state: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023 },
  { city: 'Munich', state: 'BY', country: 'Germany', lat: 48.1351, lng: 11.582 },
  { city: 'Montreal', state: 'QC', country: 'Canada', lat: 45.5017, lng: -73.5673 },
  { city: 'Casablanca', state: 'Casablanca-Settat', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { city: 'Brussels', state: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
];

/** All mock map samples are jittered around these land coordinates only */
const LAND_ANCHORS: { lat: number; lng: number }[] = [
  ...CITY_SEEDS.map((c) => ({ lat: c.lat, lng: c.lng })),
  ...EXTRA_LAND_ANCHORS,
];

/** GET /api/mood shape — points only near known land anchors (no random ocean) */
export function mockMoodMapData() {
  const rand = mulberry32(0x65617274); // 'earth'
  const anchors = LAND_ANCHORS;
  const out: {
    grid_id: string;
    center_lat: number;
    center_lng: number;
    mood_type: string;
    count: number;
  }[] = [];

  for (let i = 0; i < MAP_POINT_COUNT; i++) {
    const a = anchors[Math.floor(rand() * anchors.length)];
    const lat = a.lat + (rand() - 0.5) * LAND_JITTER_DEG;
    const lng = a.lng + (rand() - 0.5) * LAND_JITTER_DEG;
    const mood = MOODS[Math.floor(rand() * MOODS.length)];
    out.push({
      grid_id: `mock-grid-${i}`,
      center_lat: Math.round(lat * 1e4) / 1e4,
      center_lng: Math.round(lng * 1e4) / 1e4,
      mood_type: mood,
      count: 1 + Math.floor(rand() * 48),
    });
  }
  return out;
}

/** GET /api/mood/global shape */
export function mockGlobalStats() {
  return {
    totalSubmissions: 1_284_000,
    uniqueLocations: 84_200,
    worldCoverage: {
      percentage: 38.6,
      coveredAreaKm2: 57_480_000,
      totalLandAreaKm2: 148_940_000,
    },
    moodDistribution: {
      joy: { count: 420_000, percentage: 13.2 },
      surprise: { count: 210_000, percentage: 6.6 },
      disgust: { count: 98_000, percentage: 3.1 },
      sadness: { count: 310_000, percentage: 9.7 },
      fear: { count: 150_000, percentage: 4.7 },
      anger: { count: 96_000, percentage: 3.0 },
    },
    timeRange: '1 year',
    lastUpdated: now(),
  };
}

/** GET /api/mood/recent — rows like get_recent_moods */
export function mockRecentMoods() {
  const rand = mulberry32(0x7265636e); // 'recn'
  const base = Date.now();
  const out: {
    id: string;
    mood_type: string;
    latitude: number;
    longitude: number;
    created_at: string;
    user_id: string;
    city_name: string;
    state_name: string;
    country_name: string;
  }[] = [];

  for (let i = 0; i < RECENT_MOOD_COUNT; i++) {
    const city = CITY_SEEDS[i % CITY_SEEDS.length];
    const jitter = () => (rand() - 0.5) * LAND_JITTER_DEG;
    const mood = MOODS[Math.floor(rand() * MOODS.length)];
    const created = new Date(base - i * 45_000 - Math.floor(rand() * 120_000)).toISOString();

    out.push({
      id: `mock-recent-${i}`,
      mood_type: mood,
      latitude: Math.round((city.lat + jitter()) * 1e4) / 1e4,
      longitude: Math.round((city.lng + jitter()) * 1e4) / 1e4,
      created_at: created,
      user_id: 'anonymous',
      city_name: city.city,
      state_name: city.state,
      country_name: city.country,
    });
  }
  return out;
}
