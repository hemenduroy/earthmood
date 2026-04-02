import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import {
  mockRecentMoods,
  screenshotMockEnabled,
} from '../../../../../lib/screenshotMock';

export const revalidate = 0;
// GET /api/mood/recent - Get recent mood submissions
export async function GET(request: NextRequest) {
  try {
    if (screenshotMockEnabled()) {
      const data = mockRecentMoods();
      return NextResponse.json({ data, total: data.length });
    }
    // Use the optimized function to get recent moods
    const { data, error } = await supabase.rpc('get_recent_moods');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch recent moods' }, { status: 500 });
    }

    // Return newest entries first (no need to reverse since function already orders correctly)
    return NextResponse.json({
      data: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 