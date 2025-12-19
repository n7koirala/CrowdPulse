# CrowdPulse - Current State & Limitations

**Last Updated:** December 19, 2025

---

## Current State

The CrowdPulse app is **functional** with the following features working:
- ✅ Interactive Mapbox map with dark theme
- ✅ Location search (geocoding)
- ✅ Place markers with color-coded crowd density
- ✅ Filter by place type (bars, restaurants, cafes, clubs, gyms, shopping)
- ✅ Click markers to view place details
- ✅ Responsive design

**However, the app currently uses demo/simulated data for places and crowd density.**

---

## Why Demo Data?

### Problem: Foursquare API Deprecated

We initially integrated the **Foursquare Places API (v3)** for POI data. However:

1. **Foursquare deprecated their v3 API** in June 2025
2. New developer accounts (created after June 17, 2025) **cannot access legacy endpoints**
3. The deprecated endpoint returns: `"This endpoint is no longer supported"`
4. Migration to the new API requires a **Service Key** with **Bearer token** auth
5. Even with the correct Service Key, the new API structure is unclear and documentation is incomplete

### Problem: Mapbox POI Search Limited

We attempted to use **Mapbox Geocoding API** as an alternative:

1. Mapbox's POI search returns **empty results** for many categories
2. Their POI database is limited compared to dedicated services
3. Works for address geocoding but not reliable for restaurant/bar discovery

### Current Solution

The app generates **demo places** around the user's searched location:
- Realistic place names by category (e.g., "The Blue Room" for bars)
- Random positions within ~1.5km radius
- Simulated ratings, price levels, and crowd density
- Peak hours based on establishment type

---

## Solutions for Real-Time Data

### Option 1: Google Places API (Recommended)

**What it provides:**
- Comprehensive POI database
- **Google Popular Times** - actual crowdedness data based on historical visits
- Real-time "busy-ness" indicators

**Requirements:**
- Google Cloud account with billing enabled
- Places API (New) enabled
- Pricing: ~$17 per 1,000 requests (after free tier)

**Implementation:**
```typescript
// Example API call
const response = await fetch(
  `https://places.googleapis.com/v1/places:searchNearby`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.currentOpeningHours,places.regularOpeningHours'
    },
    body: JSON.stringify({
      locationRestriction: { circle: { center: { latitude, longitude }, radius: 2000 } },
      includedTypes: ['restaurant', 'bar', 'cafe']
    })
  }
);
```

---

### Option 2: Yelp Fusion API

**What it provides:**
- Large POI database
- Ratings and reviews
- Business hours

**Limitations:**
- No real-time crowd data
- Would still need simulated crowd density

**Requirements:**
- Free tier: 5,000 requests/day
- API key from Yelp Developers

---

### Option 3: SafeGraph / Placer.ai

**What it provides:**
- Actual foot traffic data
- Historical patterns
- Real-time occupancy estimates

**Limitations:**
- Enterprise-level pricing
- Requires business agreement
- Better for B2B applications

---

### Option 4: BestTime.app API

**What it provides:**
- Crowd predictions for venues
- Peak hour analysis
- Live busyness data for some venues

**Pricing:**
- Free tier: 100 requests/month
- Paid plans from $49/month

---

## Recommended Next Steps

1. **For Demo/Portfolio:** Current demo data is sufficient to showcase functionality

2. **For Production MVP:**
   - Integrate **Google Places API** for POI data
   - Use **Google Popular Times** for crowd density
   - Estimated cost: ~$50-100/month for moderate usage

3. **For Enterprise:**
   - Partner with **SafeGraph** or **Placer.ai** for accurate foot traffic
   - Consider crowd-sourcing data from app users

---

## Files Modified for Demo Data

| File | Description |
|------|-------------|
| `src/app/api/places/route.ts` | Generates demo places when Mapbox returns empty |
| `src/utils/utils.ts` | `calculateCrowdDensity()` simulates crowd levels |

---

## API Keys Status

| Service | Status | Notes |
|---------|--------|-------|
| Mapbox | ✅ Working | Used for map rendering & geocoding |
| Foursquare | ❌ Deprecated | v3 API no longer accessible |
| Google Places | Not configured | Requires setup for real data |
