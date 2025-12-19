'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    generateCrowdPoints,
    calculateCrowdLevel,
    getCrowdDescription,
    getPlaceIcon,
    type Place,
    type CrowdDataPoint
} from '@/data/crowdData';
import { getCurrentHour } from '@/utils/utils';
import PlaceCard from './PlaceCard';
import styles from './Map.module.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

interface CrowdMapProps {
    searchQuery: string;
    filterType: string;
    location: {
        latitude: number;
        longitude: number;
        name: string;
    };
}

export default function CrowdMap({ searchQuery, filterType, location }: CrowdMapProps) {
    const [viewState, setViewState] = useState({
        latitude: location.latitude,
        longitude: location.longitude,
        zoom: 14,
        pitch: 45,
        bearing: 0,
    });

    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [currentHour, setCurrentHour] = useState(getCurrentHour());
    const [crowdPoints, setCrowdPoints] = useState<CrowdDataPoint[]>([]);
    const [deckOverlay, setDeckOverlay] = useState<MapboxOverlay | null>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
    const [placesError, setPlacesError] = useState<string | null>(null);

    // Fetch places when location or filter changes
    useEffect(() => {
        const fetchPlaces = async () => {
            setIsLoadingPlaces(true);
            setPlacesError(null);

            try {
                const response = await fetch(
                    `/api/places?lat=${location.latitude}&lng=${location.longitude}&type=${filterType}`
                );
                const data = await response.json();

                if (data.error) {
                    // If API not configured, use a friendly message
                    if (data.error.includes('not configured')) {
                        setPlacesError('Foursquare API key not configured. Add FOURSQUARE_API_KEY to .env.local');
                    } else {
                        setPlacesError(data.error);
                    }
                    setPlaces([]);
                } else {
                    setPlaces(data.places || []);
                }
            } catch (error) {
                console.error('Failed to fetch places:', error);
                setPlacesError('Failed to load places');
                setPlaces([]);
            } finally {
                setIsLoadingPlaces(false);
            }
        };

        fetchPlaces();
    }, [location.latitude, location.longitude, filterType]);

    // Fly to new location when it changes
    useEffect(() => {
        setViewState(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
            zoom: 14,
        }));
        setSelectedPlace(null);
    }, [location.latitude, location.longitude]);

    // Update crowd data periodically
    useEffect(() => {
        const updateCrowdData = () => {
            setCurrentHour(getCurrentHour());
            if (places.length > 0) {
                setCrowdPoints(generateCrowdPoints(places, getCurrentHour()));
            }
        };

        updateCrowdData();
        const interval = setInterval(updateCrowdData, 60000);

        return () => clearInterval(interval);
    }, [places]);

    // Filter places based on search query
    const filteredPlaces = useMemo(() => {
        if (!searchQuery) return places;
        return places.filter(place =>
            place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [places, searchQuery]);

    // Create heatmap layer
    const heatmapLayer = useMemo(() => {
        return new HeatmapLayer<CrowdDataPoint>({
            id: 'crowd-heatmap',
            data: crowdPoints,
            getPosition: (d: CrowdDataPoint) => [d.longitude, d.latitude],
            getWeight: (d: CrowdDataPoint) => d.weight,
            radiusPixels: 60,
            intensity: 1,
            threshold: 0.1,
            colorRange: [
                [0, 255, 0, 0],
                [34, 197, 94, 150],
                [234, 179, 8, 180],
                [249, 115, 22, 210],
                [239, 68, 68, 255],
            ],
        });
    }, [crowdPoints]);

    // Update deck overlay when layer changes
    useEffect(() => {
        if (deckOverlay) {
            deckOverlay.setProps({ layers: [heatmapLayer] });
        }
    }, [heatmapLayer, deckOverlay]);

    // Initialize deck overlay
    const onMapLoad = useCallback((event: { target: mapboxgl.Map }) => {
        const map = event.target;
        const overlay = new MapboxOverlay({
            interleaved: true,
            layers: [heatmapLayer],
        });
        map.addControl(overlay);
        setDeckOverlay(overlay);
    }, [heatmapLayer]);

    const handleMarkerClick = (place: Place) => {
        setSelectedPlace(place);
        setViewState(prev => ({
            ...prev,
            latitude: place.latitude,
            longitude: place.longitude,
            zoom: 16,
        }));
    };

    return (
        <div className={styles.mapContainer}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                onLoad={onMapLoad}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
            >
                <NavigationControl position="top-right" />

                {/* Loading indicator */}
                {isLoadingPlaces && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingSpinner} />
                        <span>Loading places...</span>
                    </div>
                )}

                {/* Error message */}
                {placesError && (
                    <div className={styles.errorOverlay}>
                        <span>⚠️ {placesError}</span>
                    </div>
                )}

                {/* No places message */}
                {!isLoadingPlaces && !placesError && filteredPlaces.length === 0 && (
                    <div className={styles.noPlacesOverlay}>
                        <span>No places found in this area</span>
                    </div>
                )}

                {/* Place markers */}
                {filteredPlaces.map(place => {
                    const crowdLevel = calculateCrowdLevel(place, currentHour);
                    const { color } = getCrowdDescription(crowdLevel);

                    return (
                        <Marker
                            key={place.id}
                            latitude={place.latitude}
                            longitude={place.longitude}
                            anchor="bottom"
                            onClick={() => handleMarkerClick(place)}
                        >
                            <div
                                className={styles.marker}
                                style={{
                                    '--marker-glow': color,
                                    borderColor: color,
                                } as React.CSSProperties}
                            >
                                <span className={styles.markerIcon}>{getPlaceIcon(place.type)}</span>
                            </div>
                        </Marker>
                    );
                })}

                {/* Place popup */}
                {selectedPlace && (
                    <Popup
                        latitude={selectedPlace.latitude}
                        longitude={selectedPlace.longitude}
                        anchor="bottom"
                        offset={40}
                        closeOnClick={false}
                        onClose={() => setSelectedPlace(null)}
                        className={styles.popup}
                    >
                        <PlaceCard
                            place={selectedPlace}
                            currentHour={currentHour}
                        />
                    </Popup>
                )}
            </Map>
        </div>
    );
}
