import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { dashboardTypography } from '@/lib/typography';
import { fadeUp } from '@/components/dashboard/dashboard-types';
import { cn } from '@/lib/utils';

interface ReservationStat { label: string; value: string | number; color?: string; }
interface DayBucket { day: string; bookings: number; }

interface ReservationAnalyticsCardProps {
  stats: ReservationStat[];
  byDay: DayBucket[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ReservationAnalyticsCard: React.FC<ReservationAnalyticsCardProps> = ({ stats, byDay, isLoading, error, onRetry }) => {
  const maxBookings = Math.max(1, ...byDay.map((d) => d.bookings));
  const peakDay = byDay.length ? byDay.reduce((b, d) => (d.bookings > b.bookings ? d : b), byDay[0]) : null;

  return (
    <AnalyticsCard
      title="Reservation Analytics"
      titleIcon={CalendarDays}
      subtitle="Booking completion & distribution"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      {stats.length === 0 && byDay.length === 0 ? (
        <div className={dashboardTypography.emptyState}>Create bookings to populate reservation analytics.</div>
      ) : (
        <div className="space-y-4">
          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.05)} className="rounded-2xl border border-border/50 bg-muted/10 p-3">
                <p className={cn(dashboardTypography.chartLabel, "uppercase tracking-wider leading-tight mb-1")}>{s.label}</p>
                <p className={cn("text-sm font-bold tabular-nums", s.color ?? 'text-foreground')}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Bookings by day */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={cn(dashboardTypography.chartLabel, "uppercase tracking-wider")}>Bookings by Day</p>
              {peakDay && (
                <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest tabular-nums">
                  Peak: {peakDay.day} ({peakDay.bookings})
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={byDay} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={6} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number) => [v, 'Bookings']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 11 }}
                />
                <Bar dataKey="bookings" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {byDay.map((d) => (
                    <Cell key={d.day}
                      fill={d.day === peakDay?.day
                        ? 'hsl(var(--primary))'
                        : `hsl(var(--primary) / ${0.28 + (d.bookings / maxBookings) * 0.42})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
};
