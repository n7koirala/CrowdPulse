# Environment Variables Setup

To use this application, you need a Mapbox API token.

## Getting a Mapbox Token

1. Go to [https://mapbox.com](https://mapbox.com)
2. Create a free account
3. Go to your Account page → Tokens
4. Copy your default public token (or create a new one)

## Configuration

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

The free tier includes 50,000 map loads per month.
