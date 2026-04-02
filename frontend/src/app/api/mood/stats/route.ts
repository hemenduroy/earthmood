export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

// GET /api/mood/stats - Get mood statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24 hours';

    // Get mood distribution
    const { data: moodDistribution, error: distributionError } = await supabase
      .from('mood_entries')
      .select('mood_type')
      .gte('timestamp', new Date(Date.now() - getTimeRangeInMs(timeRange)).toISOString());

    if (distributionError) {
      console.error('Database error:', distributionError);
      return NextResponse.json({ error: 'Failed to fetch mood distribution' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      totalEntries: moodDistribution?.length || 0,
      moodDistribution: {
        joy: 0,
        surprise: 0,
        disgust: 0,
        sadness: 0,
        fear: 0,
        anger: 0
      },
      timeRange
    };

    // Process mood distribution
    if (moodDistribution) {
      moodDistribution.forEach(entry => {
        stats.moodDistribution[entry.mood_type as keyof typeof stats.moodDistribution]++;
      });
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to convert time range string to milliseconds
function getTimeRangeInMs(timeRange: string): number {
  const now = Date.now();
  
  switch (timeRange) {
    case '1 hour':
      return 60 * 60 * 1000;
    case '24 hours':
      return 24 * 60 * 60 * 1000;
    case '7 days':
      return 7 * 24 * 60 * 60 * 1000;
    case '30 days':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
} 