import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area, Legend,
} from 'recharts';
import { CalendarDays, BarChart2, TrendingUp } from 'lucide-react';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { dashboardTypography } from '@/lib/typography';
import { fadeUp } from '@/components/dashboard/dashboard-types';
import { cn } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKENDS = new Set(['Sat', 'Sun']);

interface DayOfWeekChartProps {
  data: { day: string; revenue: number; orders: number }[];
  currency: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({ data, currency, isLoading, error, onRetry }) => {
  const [view, setView] = useState<'bar' | 'area'>('bar');

  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);

  const peakDay = data.length
    ? data.reduce((best, d) => (d.revenue > best.revenue ? d : best), data[0])
    : null;
  const avgOrders = data.length
    ? (data.reduce((s, d) => s + d.orders, 0) / data.length).toFixed(1)
    : '0';

  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 };

  const right = (
    <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/20 overflow-hidden p-0.5">
      <button type="button" onClick={() => setView('bar')}
        className={cn('p-1.5 rounded-lg transition-colors', view === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        aria-label="Bar chart view">
        <BarChart2 className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setView('area')}
        className={cn('p-1.5 rounded-lg transition-colors', view === 'area' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        aria-label="Area chart view">
        <TrendingUp className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <AnalyticsCard
      title="Day of Week Performance"
      titleIcon={CalendarDays}
      subtitle="Average revenue & orders by weekday"
      right={right}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className="lg:col-span-2"
    >
      {data.length === 0 ? (
        <div className={dashboardTypography.emptyState}>Complete at least one order to see weekday performance.</div>
      ) : (
        <div className="space-y-4">
          {/* Stat strip */}
          <motion.div {...fadeUp(0)} className="flex items-center gap-3 flex-wrap">
            <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest">
              Peak: {peakDay?.day ?? '–'} · {fmt(peakDay?.revenue ?? 0)}
            </div>
            <div className="rounded-xl bg-muted/30 border border-border/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest tabular-nums text-muted-foreground">
              Avg {avgOrders} orders / day
            </div>
          </motion.div>

          {/* Bar chart view */}
          {view === 'bar' && (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={data} barGap={3} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={8} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dx={-4} tickFormatter={fmt} />
                  <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dx={4} />
                  <Tooltip
                    formatter={(v: number, name: string) => name === 'revenue' ? [fmt(v), 'Avg Revenue'] : [v, 'Avg Orders']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  />
                  <Bar yAxisId="rev" dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {data.map((d) => (
                      <Cell key={d.day}
                        fill={d.day === peakDay?.day
                          ? 'hsl(var(--primary))'
                          : WEEKENDS.has(d.day)
                          ? 'hsl(var(--primary) / 0.6)'
                          : 'hsl(var(--primary) / 0.35)'}
                      />
                    ))}
                  </Bar>
                  <Bar yAxisId="ord" dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={14} fill="#3b82f6" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm bg-primary inline-block" />
                  <span className={dashboardTypography.chartLabel}>Revenue (peak)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm inline-block" style={{ background: 'hsl(var(--primary) / 0.35)' }} />
                  <span className={dashboardTypography.chartLabel}>Revenue (other)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm bg-blue-500 inline-block opacity-70" />
                  <span className={dashboardTypography.chartLabel}>Orders</span>
                </div>
              </div>
            </>
          )}

          {/* Area chart view */}
          {view === 'area' && (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={8} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dx={-4} tickFormatter={fmt} />
                  <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dx={4} />
                  <Tooltip
                    formatter={(v: number, name: string) => name === 'revenue' ? [fmt(v), 'Avg Revenue'] : [v, 'Avg Orders']}
                    contentStyle={tooltipStyle}
                  />
                  <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Area yAxisId="ord" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fill="url(#ordGrad)" strokeDasharray="4 3" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm bg-primary inline-block" />
                  <span className={dashboardTypography.chartLabel}>Avg Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm bg-blue-500 inline-block opacity-70" />
                  <span className={dashboardTypography.chartLabel}>Avg Orders</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AnalyticsCard>
  );
};

export { DAYS };
