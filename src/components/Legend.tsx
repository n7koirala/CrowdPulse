'use client';

import styles from './Legend.module.css';

export default function Legend() {
    return (
        <div className={styles.legend}>
            <h4 className={styles.title}>Crowd Density</h4>
            <div className={styles.scale}>
                <div className={styles.gradient} />
                <div className={styles.labels}>
                    <span>Quiet</span>
                    <span>Moderate</span>
                    <span>Busy</span>
                </div>
            </div>
        </div>
    );
}
