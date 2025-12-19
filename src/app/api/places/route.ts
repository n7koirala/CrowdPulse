import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const BESTTIME_API_KEY = process.env.BESTTIME_API_KEY_PRIVATE;

// POI category mappings
const categoryMap: Record<string, string[]> = {
    bar: ['bar', 'pub', 'nightlife'],
    restaurant: ['restaurant', 'food'],
    cafe: ['cafe', 'coffee'],
    club: ['nightclub', 'club'],
    gym: ['gym', 'fitness', 'sports'],
    shopping: ['shop', 'mall', 'store', 'shopping'],
};

// Generate peak hours based on type
const peakHoursMap: Record<string, number[]> = {
    bar: [21, 22, 23, 0, 1],
    restaurant: [12, 13, 18, 19, 20],
    cafe: [7, 8, 9, 10, 11],
    club: [23, 0, 1, 2, 3],
    gym: [6, 7, 17, 18, 19],
    shopping: [12, 13, 14, 15, 16],
};

type PlaceType = 'bar' | 'restaurant' | 'cafe' | 'club' | 'gym' | 'shopping';

interface Place {
    id: string;
    name: string;
    type: PlaceType;
    latitude: number;
    longitude: number;
    address: string;
    rating: number;
    priceLevel: number;
    peakHours: number[];
    basePopularity: number;
    liveData?: {
        liveBusyness: number | null;
        forecastedBusyness: number | null;
        isLiveDataAvailable: boolean;
    };
}

// Fetch live busyness from BestTime.app
async function fetchLiveBusyness(venueName: string, venueAddress: string): Promise<{
    liveBusyness: number | null;
    forecastedBusyness: number | null;
    isLiveDataAvailable: boolean;
} | null> {
    if (!BESTTIME_API_KEY) return null;

    try {
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
            console.log(`BestTime: No data for ${venueName}`);
            return null;
        }

        const data = await response.json();

        if (data.status === 'OK' && data.analysis) {
            return {
                liveBusyness: data.analysis.venue_live_busyness ?? null,
                forecastedBusyness: data.analysis.venue_forecasted_busyness ?? null,
                isLiveDataAvailable: data.analysis.venue_live_busyness_available || false,
            };
        }
        return null;
    } catch (error) {
        console.error(`BestTime error for ${venueName}:`, error);
        return null;
    }
}

// Generate demo places around a location
function generateDemoPlaces(lat: number, lng: number, filterType: string): Place[] {
    const placeNames: Record<PlaceType, string[]> = {
        bar: ['The Blue Room', 'Whiskey Den', 'Night Owl Bar', 'The Rusty Nail', 'Moonlight Lounge'],
        restaurant: ['Bella Italia', 'Golden Dragon', 'The Corner Bistro', 'Farm Table', 'Spice Garden'],
        cafe: ['Morning Brew', 'The Bean Counter', 'Café Latte', 'Urban Grind', 'Sunrise Coffee'],
        club: ['Electric Dreams', 'Club Pulse', 'The Underground', 'Velvet Room', 'Bass Drop'],
        gym: ['FitLife Studio', 'Iron Works Gym', 'Peak Performance', 'CrossFit Central', 'Yoga Haven'],
        shopping: ['City Center Mall', 'Fashion District', 'Market Square', 'The Galleria', 'Main Street Shops'],
    };

    const places: Place[] = [];
    const types: PlaceType[] = filterType === 'all'
        ? ['bar', 'restaurant', 'cafe', 'club', 'gym', 'shopping']
        : [filterType as PlaceType];

    for (const type of types) {
        const names = placeNames[type] || placeNames.restaurant;
        const count = filterType === 'all' ? 3 : 5;

        for (let i = 0; i < count && i < names.length; i++) {
            const latOffset = (Math.random() - 0.5) * 0.025;
            const lngOffset = (Math.random() - 0.5) * 0.025;

            places.push({
                id: `demo-${type}-${i}-${Date.now()}`,
                name: names[i],
                type: type,
                latitude: lat + latOffset,
                longitude: lng + lngOffset,
                address: `${Math.floor(Math.random() * 999) + 1} ${['Main St', 'Oak Ave', 'Park Blvd', 'Market St', '5th Ave'][Math.floor(Math.random() * 5)]}`,
                rating: 3.5 + Math.random() * 1.5,
                priceLevel: Math.floor(Math.random() * 3) + 1,
                peakHours: peakHoursMap[type],
                basePopularity: 50 + Math.floor(Math.random() * 40),
            });
        }
    }

    return places;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const type = searchParams.get('type') || 'all';
    const useBestTime = searchParams.get('live') === 'true';

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat and lng parameters required' }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Generate demo places first (these will be enriched with live data)
    let places = generateDemoPlaces(latitude, longitude, type);

    // If BestTime API key is available and live data is requested, try to get real data
    if (BESTTIME_API_KEY && useBestTime) {
        console.log('Fetching live busyness data from BestTime.app...');

        // Fetch live data for first few places (to conserve API credits)
        const placesToEnrich = places.slice(0, 5);
        const enrichedPlaces = await Promise.all(
            placesToEnrich.map(async (place) => {
                // Use the general area as address context
                const cityContext = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                const liveData = await fetchLiveBusyness(place.name, cityContext);

                if (liveData) {
                    return {
                        ...place,
                        liveData,
                        // Update basePopularity if we have live data
                        basePopularity: liveData.liveBusyness ?? liveData.forecastedBusyness ?? place.basePopularity,
                    };
                }
                return place;
            })
        );

        // Replace enriched places
        places = [...enrichedPlaces, ...places.slice(5)];
    }

    // Also try BestTime venue search for real venues
    if (BESTTIME_API_KEY) {
        try {
            const searchQuery = type === 'all' ? 'popular places' : type;
            const params = new URLSearchParams({
                'api_key_private': BESTTIME_API_KEY,
                'q': `${searchQuery} near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                'num': '10',
                'format': 'raw',
            });

            const response = await fetch(
                `https://besttime.app/api/v1/venues/search?${params}`,
                { method: 'POST' }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('BestTime venue search response:', data.status);

                // If we got venues from BestTime, add them to our list
                if (data.venues && Array.isArray(data.venues)) {
                    const bestTimePlaces: Place[] = data.venues.map((venue: {
                        venue_id: string;
                        venue_name: string;
                        venue_address: string;
                        venue_lat?: number;
                        venue_lng?: number;
                        day_info?: { day_int: number; venue_open: number; venue_closed: number };
                        venue_foot_traffic_forecast?: number;
                    }) => {
                        // Determine type from venue name/category
                        let placeType: PlaceType = 'restaurant';
                        const nameLower = venue.venue_name.toLowerCase();
                        if (nameLower.includes('bar') || nameLower.includes('pub')) placeType = 'bar';
                        else if (nameLower.includes('coffee') || nameLower.includes('cafe')) placeType = 'cafe';
                        else if (nameLower.includes('gym') || nameLower.includes('fitness')) placeType = 'gym';
                        else if (nameLower.includes('mall') || nameLower.includes('shop')) placeType = 'shopping';
                        else if (nameLower.includes('club')) placeType = 'club';

                        return {
                            id: venue.venue_id || `bt-${Date.now()}-${Math.random()}`,
                            name: venue.venue_name,
                            type: placeType,
                            latitude: venue.venue_lat || latitude + (Math.random() - 0.5) * 0.01,
                            longitude: venue.venue_lng || longitude + (Math.random() - 0.5) * 0.01,
                            address: venue.venue_address || 'Address not available',
                            rating: 3.5 + Math.random() * 1.5,
                            priceLevel: Math.floor(Math.random() * 3) + 1,
                            peakHours: peakHoursMap[placeType],
                            basePopularity: venue.venue_foot_traffic_forecast || (50 + Math.floor(Math.random() * 40)),
                            liveData: {
                                liveBusyness: null,
                                forecastedBusyness: venue.venue_foot_traffic_forecast || null,
                                isLiveDataAvailable: false,
                            }
                        };
                    });

                    // Prepend BestTime venues (real data) before demo places
                    places = [...bestTimePlaces, ...places];
                }
            }
        } catch (error) {
            console.error('BestTime venue search error:', error);
            // Continue with demo places on error
        }
    }

    // Filter by type if needed and limit results
    let filteredPlaces = places;
    if (type !== 'all') {
        filteredPlaces = places.filter(place => place.type === type);
    }

    return NextResponse.json({
        places: filteredPlaces.slice(0, 20),
        hasBestTimeData: !!BESTTIME_API_KEY,
    });
}
