'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import Legend from '@/components/Legend';
import styles from './page.module.css';
import { getDayName, formatTime, getCurrentHour } from '@/utils/utils';

// Import Map dynamically to avoid SSR issues with Mapbox
const CrowdMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoading}>
      <div className={styles.loader} />
      <p>Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [dayName, setDayName] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('');

  // Only run on client side after mount
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setDayName(getDayName());
      setTimeDisplay(formatTime(getCurrentHour()));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📍</span>
          <div className={styles.logoText}>
            <h1>CrowdPulse</h1>
            <p className={styles.tagline}>Real-time crowd density tracker</p>
          </div>
        </div>
        <div className={styles.timeInfo} suppressHydrationWarning>
          <span className={styles.day}>{dayName || '\u00A0'}</span>
          <span className={styles.time}>{timeDisplay || '\u00A0'}</span>
        </div>
      </header>

      {/* Search & Filters */}
      <div className={styles.controls}>
        <SearchBar
          onSearch={setSearchQuery}
          onFilterChange={setFilterType}
          activeFilter={filterType}
        />
      </div>

      {/* Map - only render after client mount */}
      <div className={styles.mapWrapper}>
        {mounted ? (
          <CrowdMap searchQuery={searchQuery} filterType={filterType} />
        ) : (
          <div className={styles.mapLoading}>
            <div className={styles.loader} />
            <p>Loading map...</p>
          </div>
        )}

        {/* Legend */}
        <div className={styles.legendWrapper}>
          <Legend />
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p>🖱️ Click markers for details • Scroll to zoom • Drag to pan</p>
        </div>
      </div>
    </main>
  );
}

