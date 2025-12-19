import { NextRequest, NextResponse } from 'next/server';

const BESTTIME_API_KEY = process.env.BESTTIME_API_KEY_PRIVATE;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const venueName = searchParams.get('venue_name');
    const venueAddress = searchParams.get('venue_address');

    if (!venueName || !venueAddress) {
        return NextResponse.json({ error: 'venue_name and venue_address parameters required' }, { status: 400 });
    }

    if (!BESTTIME_API_KEY) {
        return NextResponse.json({ error: 'BestTime API key not configured' }, { status: 500 });
    }

    try {
        // Get live foot traffic data from BestTime.app
        const params = new URLSearchParams({
            'api_key_private': BESTTIME_API_KEY,
            'venue_name': venueName,
            'venue_address': venueAddress,
        });

        const response = await fetch(
            `https://besttime.app/api/v1/forecasts/live?${params}`,
            { method: 'POST' }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('BestTime API error:', errorText);
            return NextResponse.json({
                error: 'Failed to fetch live data',
                details: errorText
            }, { status: response.status });
        }

        const data = await response.json();

        // Transform BestTime response to our format
        const result = {
            venue_id: data.venue_info?.venue_id,
            venue_name: data.venue_info?.venue_name,
            venue_address: data.venue_info?.venue_address,
            live_busyness: data.analysis?.venue_live_busyness,
            live_busyness_available: data.analysis?.venue_live_busyness_available,
            forecasted_busyness: data.analysis?.venue_forecasted_busyness,
            day_info: data.analysis?.day_info,
            hour_info: data.analysis?.hour_analysis,
            raw_data: data
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('BestTime API error:', error);
        return NextResponse.json({ error: 'Failed to fetch live traffic data' }, { status: 500 });
    }
}

// POST endpoint for batch venue search
export async function POST(request: NextRequest) {
    if (!BESTTIME_API_KEY) {
        return NextResponse.json({ error: 'BestTime API key not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { query, lat, lng, radius = 2000 } = body;

        if (!query) {
            return NextResponse.json({ error: 'query parameter required' }, { status: 400 });
        }

        // Build search query with location context
        let searchQuery = query;
        if (lat && lng) {
            // BestTime can use natural language queries
            searchQuery = `${query}`;
        }

        const params = new URLSearchParams({
            'api_key_private': BESTTIME_API_KEY,
            'q': searchQuery,
            'num': '20',
            'format': 'raw',
        });

        // Add geographical filters if provided
        if (lat && lng) {
            params.append('lat', lat.toString());
            params.append('lng', lng.toString());
            params.append('radius', radius.toString());
        }

        const response = await fetch(
            `https://besttime.app/api/v1/venues/search?${params}`,
            { method: 'POST' }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('BestTime venue search error:', errorText);
            return NextResponse.json({
                error: 'Venue search failed',
                details: errorText
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('BestTime search error:', error);
        return NextResponse.json({ error: 'Failed to search venues' }, { status: 500 });
    }
}
