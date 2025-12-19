'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from '@/utils/utils';
import styles from './SearchBar.module.css';

interface LocationSuggestion {
    id: string;
    name: string;
    fullName: string;
    latitude: number;
    longitude: number;
}

interface SearchBarProps {
    onSearch: (query: string) => void;
    onFilterChange: (type: string) => void;
    onLocationChange: (location: { latitude: number; longitude: number; name: string }) => void;
    activeFilter: string;
    currentLocation: string;
}

const placeTypes = [
    { id: 'all', label: 'All', icon: '🗺️' },
    { id: 'bar', label: 'Bars', icon: '🍺' },
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { id: 'cafe', label: 'Cafes', icon: '☕' },
    { id: 'club', label: 'Clubs', icon: '🎵' },
    { id: 'gym', label: 'Gyms', icon: '💪' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
];

export default function SearchBar({
    onSearch,
    onFilterChange,
    onLocationChange,
    activeFilter,
    currentLocation
}: SearchBarProps) {
    const [inputValue, setInputValue] = useState('');
    const [cityInput, setCityInput] = useState('');
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch location suggestions
    const fetchSuggestions = useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        []
    );

    const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCityInput(value);
        fetchSuggestions(value);
    };

    const handleSelectLocation = (suggestion: LocationSuggestion) => {
        setCityInput(suggestion.name);
        setShowSuggestions(false);
        setSuggestions([]);
        onLocationChange({
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            name: suggestion.name,
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((value: string) => onSearch(value), 300),
        [onSearch]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        debouncedSearch(value);
    };

    return (
        <div className={styles.container}>
            {/* City Search */}
            <div className={styles.citySearchWrapper} ref={suggestionsRef}>
                <div className={styles.searchWrapper}>
                    <div className={styles.searchIcon}>📍</div>
                    <input
                        type="text"
                        placeholder="Search city (e.g., Chicago, Los Angeles...)"
                        value={cityInput}
                        onChange={handleCityInputChange}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        className={styles.searchInput}
                    />
                    {isLoading && <div className={styles.loadingSpinner} />}
                    {cityInput && !isLoading && (
                        <button
                            className={styles.clearButton}
                            onClick={() => {
                                setCityInput('');
                                setSuggestions([]);
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.suggestionsDropdown}>
                        {suggestions.map(suggestion => (
                            <button
                                key={suggestion.id}
                                className={styles.suggestionItem}
                                onClick={() => handleSelectLocation(suggestion)}
                            >
                                <span className={styles.suggestionIcon}>📍</span>
                                <div className={styles.suggestionText}>
                                    <span className={styles.suggestionName}>{suggestion.name}</span>
                                    <span className={styles.suggestionFullName}>{suggestion.fullName}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Location Badge */}
            <div className={styles.currentLocation}>
                <span className={styles.locationBadge}>
                    📍 {currentLocation}
                </span>
            </div>

            {/* Place name filter */}
            <div className={styles.searchWrapper}>
                <div className={styles.searchIcon}>🔍</div>
                <input
                    type="text"
                    placeholder="Filter places by name..."
                    value={inputValue}
                    onChange={handleInputChange}
                    className={styles.searchInput}
                />
                {inputValue && (
                    <button
                        className={styles.clearButton}
                        onClick={() => {
                            setInputValue('');
                            onSearch('');
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Category filters */}
            <div className={styles.filters}>
                {placeTypes.map(type => (
                    <button
                        key={type.id}
                        className={`${styles.filterButton} ${activeFilter === type.id ? styles.active : ''}`}
                        onClick={() => onFilterChange(type.id)}
                    >
                        <span className={styles.filterIcon}>{type.icon}</span>
                        <span className={styles.filterLabel}>{type.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
