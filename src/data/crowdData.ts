// Simulated crowd density data for popular places
// In a production app, this would come from an API like BestTime or your own data sources

export interface Place {
  id: string;
  name: string;
  type: 'bar' | 'restaurant' | 'cafe' | 'club' | 'gym' | 'shopping';
  latitude: number;
  longitude: number;
  address: string;
  rating: number;
  priceLevel: number; // 1-4
  peakHours: number[]; // Hours when typically busiest (0-23)
  basePopularity: number; // 0-100
}

export interface CrowdDataPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

// Sample places in a popular urban area (using NYC as example)
export const places: Place[] = [
  // Bars
  {
    id: 'bar-1',
    name: 'The Rusty Nail',
    type: 'bar',
    latitude: 40.7282,
    longitude: -73.9942,
    address: '123 E 7th St, New York, NY',
    rating: 4.5,
    priceLevel: 2,
    peakHours: [21, 22, 23, 0, 1],
    basePopularity: 85,
  },
  {
    id: 'bar-2',
    name: 'Midnight Lounge',
    type: 'bar',
    latitude: 40.7298,
    longitude: -73.9898,
    address: '45 Avenue A, New York, NY',
    rating: 4.3,
    priceLevel: 3,
    peakHours: [22, 23, 0, 1, 2],
    basePopularity: 78,
  },
  {
    id: 'bar-3',
    name: 'The Tipsy Fox',
    type: 'bar',
    latitude: 40.7265,
    longitude: -73.9865,
    address: '89 E 4th St, New York, NY',
    rating: 4.6,
    priceLevel: 2,
    peakHours: [20, 21, 22, 23],
    basePopularity: 90,
  },
  // Restaurants
  {
    id: 'rest-1',
    name: 'Nonna\'s Kitchen',
    type: 'restaurant',
    latitude: 40.7305,
    longitude: -73.9912,
    address: '200 E 10th St, New York, NY',
    rating: 4.7,
    priceLevel: 3,
    peakHours: [12, 13, 19, 20, 21],
    basePopularity: 88,
  },
  {
    id: 'rest-2',
    name: 'Sakura Sushi',
    type: 'restaurant',
    latitude: 40.7275,
    longitude: -73.9925,
    address: '55 St Marks Pl, New York, NY',
    rating: 4.4,
    priceLevel: 2,
    peakHours: [12, 13, 18, 19, 20],
    basePopularity: 75,
  },
  {
    id: 'rest-3',
    name: 'Burger Palace',
    type: 'restaurant',
    latitude: 40.7312,
    longitude: -73.9878,
    address: '167 1st Ave, New York, NY',
    rating: 4.2,
    priceLevel: 1,
    peakHours: [12, 13, 18, 19, 20, 21],
    basePopularity: 82,
  },
  // Cafes
  {
    id: 'cafe-1',
    name: 'Morning Brew',
    type: 'cafe',
    latitude: 40.7258,
    longitude: -73.9918,
    address: '78 E 3rd St, New York, NY',
    rating: 4.6,
    priceLevel: 2,
    peakHours: [7, 8, 9, 10, 11],
    basePopularity: 70,
  },
  {
    id: 'cafe-2',
    name: 'Bean & Gone',
    type: 'cafe',
    latitude: 40.7295,
    longitude: -73.9958,
    address: '34 E 9th St, New York, NY',
    rating: 4.5,
    priceLevel: 2,
    peakHours: [8, 9, 10, 14, 15],
    basePopularity: 65,
  },
  // Clubs
  {
    id: 'club-1',
    name: 'Neon Nights',
    type: 'club',
    latitude: 40.7245,
    longitude: -73.9885,
    address: '99 E 2nd St, New York, NY',
    rating: 4.1,
    priceLevel: 3,
    peakHours: [23, 0, 1, 2, 3],
    basePopularity: 92,
  },
  {
    id: 'club-2',
    name: 'Electric Avenue',
    type: 'club',
    latitude: 40.7238,
    longitude: -73.9912,
    address: '150 Houston St, New York, NY',
    rating: 4.3,
    priceLevel: 4,
    peakHours: [0, 1, 2, 3],
    basePopularity: 88,
  },
  // Gyms
  {
    id: 'gym-1',
    name: 'Iron Temple',
    type: 'gym',
    latitude: 40.7318,
    longitude: -73.9932,
    address: '250 E 11th St, New York, NY',
    rating: 4.4,
    priceLevel: 2,
    peakHours: [6, 7, 17, 18, 19],
    basePopularity: 60,
  },
  // Shopping
  {
    id: 'shop-1',
    name: 'Village Vintage',
    type: 'shopping',
    latitude: 40.7288,
    longitude: -73.9968,
    address: '12 E 8th St, New York, NY',
    rating: 4.5,
    priceLevel: 2,
    peakHours: [12, 13, 14, 15, 16],
    basePopularity: 55,
  },
];

// Generate random crowd points around a place
export function generateCrowdPoints(places: Place[], currentHour: number): CrowdDataPoint[] {
  const points: CrowdDataPoint[] = [];
  
  places.forEach(place => {
    const crowdLevel = calculateCrowdLevel(place, currentHour);
    const numPoints = Math.floor(crowdLevel / 10) + 3;
    
    for (let i = 0; i < numPoints; i++) {
      // Random offset within ~50 meters
      const latOffset = (Math.random() - 0.5) * 0.0008;
      const lngOffset = (Math.random() - 0.5) * 0.0008;
      
      points.push({
        latitude: place.latitude + latOffset,
        longitude: place.longitude + lngOffset,
        weight: crowdLevel * (0.5 + Math.random() * 0.5),
      });
    }
  });
  
  return points;
}

// Calculate crowd level based on time of day
export function calculateCrowdLevel(place: Place, currentHour: number): number {
  const isPeakHour = place.peakHours.includes(currentHour);
  const isNearPeak = place.peakHours.some(h => Math.abs(h - currentHour) <= 1);
  
  let multiplier = 0.3; // Base crowd level
  
  if (isPeakHour) {
    multiplier = 0.8 + Math.random() * 0.2; // 80-100%
  } else if (isNearPeak) {
    multiplier = 0.5 + Math.random() * 0.2; // 50-70%
  }
  
  // Weekend boost for entertainment venues
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
  
  if (isWeekend && ['bar', 'club', 'restaurant'].includes(place.type)) {
    multiplier *= 1.2;
  }
  
  return Math.min(100, Math.floor(place.basePopularity * multiplier));
}

// Get crowd level description
export function getCrowdDescription(level: number): { text: string; color: string } {
  if (level >= 80) return { text: 'Very Busy', color: '#ef4444' };
  if (level >= 60) return { text: 'Busy', color: '#f97316' };
  if (level >= 40) return { text: 'Moderate', color: '#eab308' };
  if (level >= 20) return { text: 'Quiet', color: '#22c55e' };
  return { text: 'Very Quiet', color: '#10b981' };
}

// Icon for place type
export function getPlaceIcon(type: Place['type']): string {
  const icons: Record<Place['type'], string> = {
    bar: '🍺',
    restaurant: '🍽️',
    cafe: '☕',
    club: '🎵',
    gym: '💪',
    shopping: '🛍️',
  };
  return icons[type];
}
