'use client';

import { Place, calculateCrowdLevel, getCrowdDescription, getPlaceIcon } from '@/data/crowdData';
import { formatPriceLevel, formatTime } from '@/utils/utils';
import styles from './PlaceCard.module.css';

interface PlaceCardProps {
    place: Place;
    currentHour: number;
}

export default function PlaceCard({ place, currentHour }: PlaceCardProps) {
    const crowdLevel = calculateCrowdLevel(place, currentHour);
    const { text: crowdText, color: crowdColor } = getCrowdDescription(crowdLevel);

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span className={styles.icon}>{getPlaceIcon(place.type)}</span>
                <div className={styles.headerInfo}>
                    <h3 className={styles.name}>{place.name}</h3>
                    <p className={styles.address}>{place.address}</p>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Rating</span>
                    <span className={styles.statValue}>
                        ⭐ {place.rating}
                    </span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Price</span>
                    <span className={styles.statValue}>
                        {formatPriceLevel(place.priceLevel)}
                    </span>
                </div>
            </div>

            <div className={styles.crowdSection}>
                <div className={styles.crowdHeader}>
                    <span className={styles.crowdLabel}>Current Crowd Level</span>
                    <span
                        className={styles.crowdBadge}
                        style={{ backgroundColor: crowdColor }}
                    >
                        {crowdText}
                    </span>
                </div>

                <div className={styles.crowdBar}>
                    <div
                        className={styles.crowdFill}
                        style={{
                            width: `${crowdLevel}%`,
                            background: `linear-gradient(90deg, #22c55e, ${crowdColor})`,
                        }}
                    />
                </div>
                <span className={styles.crowdPercent}>{crowdLevel}% capacity</span>
            </div>

            <div className={styles.peakTimes}>
                <span className={styles.peakLabel}>Usually busy:</span>
                <span className={styles.peakValue}>
                    {place.peakHours.slice(0, 3).map(h => formatTime(h)).join(', ')}
                </span>
            </div>
        </div>
    );
}
