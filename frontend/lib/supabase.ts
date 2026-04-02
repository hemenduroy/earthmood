import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface MoodEntry {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  mood_type: 'joy' | 'surprise' | 'disgust' | 'sadness' | 'fear' | 'anger';
  timestamp: string;
}

export interface MoodMapData {
  grid_id: string;
  center_lat: number;
  center_lng: number;
  mood_type: string;
  count: number;
}

export interface MapDataParams {
  bounds: string; // "north,south,east,west"
  zoom: number;
  timeRange?: string;
} 