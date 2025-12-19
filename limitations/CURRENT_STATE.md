# CrowdPulse - Current State & Limitations

**Last Updated:** December 19, 2025

---

## Current State

The CrowdPulse app is **functional** with the following features:
- ✅ Interactive Mapbox map with dark theme
- ✅ Location search (geocoding)
- ✅ Place markers with color-coded crowd density
- ✅ Filter by place type (bars, restaurants, cafes, clubs, gyms, shopping)
- ✅ Click markers to view place details
- ✅ Responsive design
- ✅ Rating display fixed (shows 2 decimal places)
- ⚠️ BestTime.app API integrated (but venues are demo data)

---

## BestTime.app Integration Status

### What's Implemented
- API keys configured in `.env.local`
- `/api/besttime` endpoint for venue queries
- Venue search integration in `/api/places`

### Why Places Are Still Demo Data

BestTime.app's API works **asynchronously**:

1. **Venue Search** (`POST /v1/venues/search`) starts a **background job**
2. The job forecasts venues in the area (uses **2 credits per venue**)
3. Results must be retrieved via **polling** or **callback URL**
4. Free tier only provides **100 credits** (~50 venues total)

**Current Behavior:**
- App calls BestTime venue search API
- API returns `job_id` (not instant results)
- App falls back to demo data while job processes
- Demo data has realistic names but random positions

### Credit Usage Warning
⚠️ Each venue forecast uses **2 credits** from your 100 free credits. Use sparingly!

---

## Solutions for Real Places

### Option 1: Foursquare Places API (Recommended)
- **Free tier:** 99,000 calls/month
- **Provides:** Real venue names, addresses, categories
- **Implementation:** Add `FOURSQUARE_API_KEY` to `.env.local`

### Option 2: Google Places API
- **Cost:** ~$17 per 1,000 requests
- **Provides:** Comprehensive POI + Google Popular Times
- **Best for:** Production apps with budget

### Option 3: Hybrid Approach
- Use **Foursquare** for venue discovery (free, instant)
- Use **BestTime** for crowd predictions (pre-forecast venues)

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/besttime/route.ts` | BestTime API endpoint |
| `src/app/api/places/route.ts` | BestTime integration + demo fallback |
| `src/components/PlaceCard.tsx` | Fixed rating to 2 decimal places |
| `.env.local` | Added BestTime API keys |

---

## API Keys Status

| Service | Status | Notes |
|---------|--------|-------|
| Mapbox | ✅ Working | Map rendering & geocoding |
| BestTime | ⚠️ Partial | Async venue search, limited credits |
| Foursquare | ❌ Not configured | Recommended for real venues |
| Google Places | ❌ Not configured | Best for production |

---

## Known Issues

1. **Demo places** - Venue names are realistic but positions are random
2. **BestTime async** - Venue search doesn't return instant results
3. **Credit limit** - Free tier only allows ~50 venue forecasts

---

## Recommended Next Steps

1. **For real venues:** Integrate Foursquare Places API (free, instant results)
2. **For crowd data:** Pre-forecast popular venues with BestTime
3. **For production:** Consider Google Places + Popular Times

