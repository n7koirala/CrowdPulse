import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// POI category mappings for Mapbox
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
}

// Generate demo places around a location
function generateDemoPlaces(lat: number, lng: number, filterType: string): Place[] {
    // Popular establishment names by type
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
            // Generate random offset within ~1.5km radius
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

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat and lng parameters required' }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Try Mapbox API first if token is available
    if (MAPBOX_TOKEN) {
        try {
            const allPlaces: Place[] = [];

            // Build search queries based on type
            let searchQueries: string[] = [];
            if (type === 'all') {
                searchQueries = ['bar', 'restaurant', 'coffee'];
            } else if (categoryMap[type]) {
                searchQueries = categoryMap[type];
            } else {
                searchQueries = [type];
            }

            // Function to determine place type from Mapbox category
            const getPlaceType = (cats: string[], searchQuery: string): PlaceType => {
                const categoryStr = cats.join(' ').toLowerCase();
                if (categoryStr.includes('bar') || categoryStr.includes('pub') || searchQuery.includes('bar')) return 'bar';
                if (categoryStr.includes('coffee') || categoryStr.includes('cafe') || searchQuery.includes('coffee')) return 'cafe';
                if (categoryStr.includes('nightclub') || categoryStr.includes('club') || searchQuery.includes('club')) return 'club';
                if (categoryStr.includes('gym') || categoryStr.includes('fitness') || searchQuery.includes('gym')) return 'gym';
                if (categoryStr.includes('shop') || categoryStr.includes('mall') || searchQuery.includes('shop')) return 'shopping';
                return 'restaurant';
            };

            // Limit to 3 queries to avoid rate limits
            const queriesToRun = searchQueries.slice(0, 3);

            for (const query of queriesToRun) {
                try {
                    const response = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
                        `proximity=${longitude},${latitude}&types=poi&limit=7&access_token=${MAPBOX_TOKEN}`
                    );

                    if (!response.ok) {
                        console.error(`Mapbox API error for query "${query}":`, await response.text());
                        continue;
                    }

                    const data = await response.json();

                    // Transform Mapbox features to our Place format
                    for (const feature of data.features || []) {
                        // Skip if we already have this place (by ID)
                        if (allPlaces.some(p => p.id === feature.id)) continue;

                        const categories = feature.properties?.category?.split(',') || [];
                        const placeType = getPlaceType(categories, query);

                        allPlaces.push({
                            id: feature.id,
                            name: feature.text || feature.place_name?.split(',')[0] || 'Unknown Place',
                            type: placeType,
                            latitude: feature.center[1],
                            longitude: feature.center[0],
                            address: feature.place_name || 'Address not available',
                            rating: 3.5 + Math.random() * 1.5,
                            priceLevel: Math.floor(Math.random() * 3) + 1,
                            peakHours: peakHoursMap[placeType],
                            basePopularity: 50 + Math.floor(Math.random() * 40),
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching "${query}":`, error);
                }
            }

            // If we got places from Mapbox, return them
            if (allPlaces.length > 0) {
                // If filtering by specific type, filter the results
                let filteredPlaces = allPlaces;
                if (type !== 'all') {
                    filteredPlaces = allPlaces.filter(place => place.type === type);
                }
                return NextResponse.json({ places: filteredPlaces.slice(0, 20) });
            }
        } catch (error) {
            console.error('Mapbox API error:', error);
        }
    }

    // Fallback to demo data if Mapbox returns no results or isn't configured
    console.log('Using demo data for places (Mapbox returned no POI results)');
    const demoPlaces = generateDemoPlaces(latitude, longitude, type);
    return NextResponse.json({ places: demoPlaces });
}
