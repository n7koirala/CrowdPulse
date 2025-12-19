import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    if (!MAPBOX_TOKEN) {
        return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
            `access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood&limit=5`
        );

        if (!response.ok) {
            throw new Error('Geocoding API request failed');
        }

        const data = await response.json();

        // Transform to simpler format
        const suggestions = data.features.map((feature: {
            id: string;
            place_name: string;
            center: [number, number];
            text: string;
        }) => ({
            id: feature.id,
            name: feature.text,
            fullName: feature.place_name,
            longitude: feature.center[0],
            latitude: feature.center[1],
        }));

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json({ error: 'Failed to fetch location suggestions' }, { status: 500 });
    }
}
