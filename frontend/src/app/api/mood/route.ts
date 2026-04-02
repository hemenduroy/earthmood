export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { getLocationName } from '../../../utils/geocoding';
import {
  mockMoodMapData,
  screenshotMockEnabled,
} from '../../../../lib/screenshotMock';

// GET /api/mood - Get mood data for map
export async function GET(request: NextRequest) {
  console.log(`API Route Hit: /api/mood. Commit: ${process.env.VERCEL_GIT_COMMIT_SHA || 'N/A'}`);
  try {
    if (screenshotMockEnabled()) {
      const { searchParams } = new URL(request.url);
      const timeRange = searchParams.get('timeRange') || '24 hours';
      const formattedData = mockMoodMapData();
      return NextResponse.json({
        data: formattedData,
        totalPoints: formattedData.length,
        timeRange,
      });
    }
    const { searchParams } = new URL(request.url);
    const bounds = searchParams.get('bounds');
    const zoomStr = searchParams.get('zoom');
    const timeRange = searchParams.get('timeRange') || '24 hours';

    console.log(`Received params: bounds=${bounds}, zoom=${zoomStr}, timeRange=${timeRange}`);

    if (!bounds) {
      console.error("Validation Error: Bounds parameter is required.");
      return NextResponse.json({ error: 'Bounds parameter is required' }, { status: 400 });
    }

    const zoom = parseInt(zoomStr || '10');
    if (isNaN(zoom)) {
        console.error(`Validation Error: Invalid zoom parameter provided: ${zoomStr}`);
        return NextResponse.json({ error: `Invalid zoom parameter: ${zoomStr}` }, { status: 400 });
    }
    
    console.log("Validation successful. Calling database...");

    const { data, error } = await supabase.rpc('get_mood_map_data', {
      p_bounds: bounds,
      p_zoom: zoom,
      p_time_range: timeRange
    });

    console.log("Database call complete.");

    if (error) {
      console.error("Database Error in /api/mood:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Failed to fetch mood data' }, { status: 500 });
    }

    console.log("Successfully fetched data from database.");

    const formattedData = (data || []).map((item: any) => ({
      grid_id: item.o_grid_id,
      center_lat: item.o_center_lat,
      center_lng: item.o_center_lng,
      mood_type: item.o_mood_type,
      count: item.o_count
    }));

    return NextResponse.json({
      data: formattedData,
      totalPoints: formattedData.length || 0,
      timeRange
    });

  } catch (error: any) {
    console.error("Catastrophic API Error in /api/mood:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// POST /api/mood - Submit new mood entry
export async function POST(request: NextRequest) {
  try {
    if (screenshotMockEnabled()) {
      const body = await request.json();
      return NextResponse.json(
        {
          success: true,
          data: {
            id: 'mock-submission',
            ...body,
            created_at: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }
    const body = await request.json();
    const { latitude, longitude, moodType, userId } = body;

    // Validate required fields
    if (!latitude || !longitude || !moodType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate mood type
    const validMoodTypes = ['joy', 'surprise', 'disgust', 'sadness', 'fear', 'anger'];
    if (!validMoodTypes.includes(moodType)) {
      return NextResponse.json({ error: 'Invalid mood type' }, { status: 400 });
    }

    // Get location name and country name
    let cityName = null;
    let stateName = null;
    let countryName = null;
    
    try {
      const fullLocationName = await getLocationName(latitude, longitude);
      const locationParts = fullLocationName.split(', ');
      
      // Handle the new format where parts might be missing
      if (locationParts.length >= 3) {
        cityName = locationParts[0] || null; // City/town name
        stateName = locationParts[1] || null; // State/province name
        countryName = locationParts[2] || null; // Country name
      } else if (locationParts.length >= 2) {
        cityName = locationParts[0] || null; // City/town name
        countryName = locationParts[1] || null; // Country name
      } else if (locationParts.length >= 1) {
        countryName = locationParts[0] || null; // Just country name
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Continue without location data if geocoding fails
    }

    // Insert mood entry with location data
    const { data, error } = await supabase
      .from('mood_entries')
      .insert({
        user_id: userId || 'anonymous',
        latitude,
        longitude,
        mood_type: moodType,
        city_name: cityName,
        state_name: stateName,
        country_name: countryName
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to submit mood' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 