// Utility functions for the crowd density tracker

export function formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
}

export function getCurrentHour(): number {
    return new Date().getHours();
}

export function getDayName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

export function formatPriceLevel(level: number): string {
    return '$'.repeat(level);
}

// Debounce function for search
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Color interpolation for heatmap
export const HEATMAP_COLORS = [
    [0, 255, 0, 0],      // Transparent green (no crowd)
    [34, 197, 94, 100],   // Green (quiet)
    [234, 179, 8, 150],   // Yellow (moderate)
    [249, 115, 22, 200],  // Orange (busy)
    [239, 68, 68, 255],   // Red (very busy)
];

// Convert hex to RGB
export function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [0, 0, 0];
}
