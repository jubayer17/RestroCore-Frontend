export type TimePeriod = 'daily' | 'weekly' | '1m' | '6m' | '1y';

export const timePeriodOptions: Array<{ value: TimePeriod; label: string }> = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: '1m', label: '1 Month' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
];

export function periodStart(now: Date, period: TimePeriod): Date {
    const start = new Date(now);
    if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
        return start;
    }
    const days =
        period === 'weekly' ? 7
            : period === '1m' ? 30
                : period === '6m' ? 180
                    : 365;
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return start;
}

export function inPeriod(iso: string, period: TimePeriod, now: Date): boolean {
    const dt = new Date(iso);
    if (!Number.isFinite(dt.getTime())) return false;
    const start = periodStart(now, period);
    return dt.getTime() >= start.getTime() && dt.getTime() <= now.getTime();
}

