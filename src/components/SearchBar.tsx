'use client';

import { useState, useCallback } from 'react';
import { debounce } from '@/utils/utils';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onFilterChange: (type: string) => void;
    activeFilter: string;
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

export default function SearchBar({ onSearch, onFilterChange, activeFilter }: SearchBarProps) {
    const [inputValue, setInputValue] = useState('');

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
            <div className={styles.searchWrapper}>
                <div className={styles.searchIcon}>🔍</div>
                <input
                    type="text"
                    placeholder="Search places..."
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
