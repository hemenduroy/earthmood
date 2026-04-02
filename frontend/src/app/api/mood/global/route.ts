export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import {
  mockGlobalStats,
  screenshotMockEnabled,
} from '../../../../../lib/screenshotMock';

// GET /api/mood/global - Get global mood statistics and world coverage
export async function GET(request: NextRequest) {
  console.log(`API Route Hit: /api/mood/global. Commit: ${process.env.VERCEL_GIT_COMMIT_SHA || 'N/A'}`);
  try {
    if (screenshotMockEnabled()) {
      const { searchParams } = new URL(request.url);
      const timeRange = searchParams.get('timeRange') || '24 hours';
      return NextResponse.json({ ...mockGlobalStats(), timeRange });
    }
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24 hours';

    // Get comprehensive global statistics
    const { data: globalStats, error: statsError } = await supabase.rpc('get_comprehensive_global_stats', {
      p_time_range: timeRange
    });

    if (statsError) {
      console.error("Database Error in /api/mood/global (stats):", JSON.stringify(statsError, null, 2));
      return NextResponse.json({ error: 'Failed to fetch global statistics' }, { status: 500 });
    }

    // Get individual mood distribution for detailed breakdown
    const { data: moodDistribution, error: distributionError } = await supabase.rpc('get_global_mood_stats', {
      p_time_range: timeRange
    });

    if (distributionError) {
      console.error("Database Error in /api/mood/global (distribution):", JSON.stringify(distributionError, null, 2));
      return NextResponse.json({ error: 'Failed to fetch mood distribution' }, { status: 500 });
    }

    // Format the response
    const stats = globalStats?.[0] || {};
    const totalCoveragePercentage = stats.o_coverage_percentage || 0;
    
    const detailedMoodDistribution: { [key: string]: { count: number; percentage: number } } = {
      joy: { count: 0, percentage: 0 },
      surprise: { count: 0, percentage: 0 },
      disgust: { count: 0, percentage: 0 },
      sadness: { count: 0, percentage: 0 },
      fear: { count: 0, percentage: 0 },
      anger: { count: 0, percentage: 0 }
    };

    if (moodDistribution) {
      moodDistribution.forEach((mood: any) => {
        if (detailedMoodDistribution[mood.o_mood_type]) {
          const submissionPercentage = mood.o_percentage; // Percentage of total submissions
          const worldCoveragePercentage = (submissionPercentage / 100) * totalCoveragePercentage; // Percentage of world coverage
          
          detailedMoodDistribution[mood.o_mood_type] = {
            count: mood.o_count,
            percentage: Math.round(worldCoveragePercentage * 1000) / 1000 // Round to 3 decimal places
          };
        }
      });
    }

    return NextResponse.json({
      totalSubmissions: stats.o_total_submissions || 0,
      uniqueLocations: stats.o_unique_locations || 0,
      worldCoverage: {
        percentage: stats.o_coverage_percentage || 0,
        coveredAreaKm2: stats.o_covered_area_km2 || 0,
        totalLandAreaKm2: 148940000 // Approximate world land area
      },
      moodDistribution: detailedMoodDistribution,
      timeRange,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Catastrophic API Error in /api/mood/global:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 