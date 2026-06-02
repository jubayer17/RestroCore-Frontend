import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell,
} from 'recharts';
import { LayoutGrid, BarChart2, BarChartHorizontalBig } from 'lucide-react';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { dashboardTypography } from '@/lib/typography';
import { fadeUp } from '@/components/dashboard/dashboard-types';
import { cn } from '@/lib/utils';

const PALETTE = [
  'hsl(var(--primary))',
  '#3b82f6',
  '#a855f7',
  '#22c55e',
  '#22d3ee',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
];

interface SalesByCategoryChartProps {
  data: { name: string; revenue: number }[];
  currency: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const SalesByCategoryChart: React.FC<SalesByCategoryChartProps> = ({ data, currency, isLoading, error, onRetry }) => {
  const [view, setView] = useState<'horizontal' | 'vertical'>('horizontal');

  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);

  const total = data.reduce((s, d) => s + d.revenue, 0);

  const right = (
    <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/20 overflow-hidden p-0.5">
      <button type="button" onClick={() => setView('horizontal')}
        className={cn('p-1.5 rounded-lg transition-colors', view === 'horizontal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        aria-label="Horizontal bar view">
        <BarChartHorizontalBig className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setView('vertical')}
        className={cn('p-1.5 rounded-lg transition-colors', view === 'vertical' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        aria-label="Vertical bar view">
        <BarChart2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <AnalyticsCard
      title="Sales by Category"
      titleIcon={LayoutGrid}
      subtitle="Revenue breakdown per menu category"
      right={right}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className="lg:col-span-2"
    >
      {data.length === 0 ? (
        <div className={dashboardTypography.emptyState}>Complete at least one order to see category revenue.</div>
      ) : (
        <div className="flex flex-col h-full gap-4">
          {/* Legend pills */}
          <div className="flex flex-wrap gap-2">
            {data.map((d, idx) => {
              const color = PALETTE[idx % PALETTE.length];
              const pct = total > 0 ? ((d.revenue / total) * 100).toFixed(0) : '0';
              return (
                <motion.div key={d.name} {...fadeUp(idx * 0.05)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border/50 bg-muted/20 text-[10px] font-semibold text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                  {d.name}
                  <span className="text-foreground/70">{pct}%</span>
                </motion.div>
              );
            })}
          </div>

          {/* Chart — grows to fill remaining card height */}
          <div className="flex-1 min-h-[200px]">
            {view === 'horizontal' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 4, right: 56, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={fmt} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={88} />
                  <Tooltip
                    formatter={(v: number) => [fmt(v), 'Revenue']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }}
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={18}
                    label={{ position: 'right', formatter: (v: number) => fmt(v), fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}>
                    {data.map((_, idx) => <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {view === 'vertical' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: 4, right: 4, top: 12, bottom: data.length > 4 ? 40 : 20 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fontWeight: 600 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    dy={6}
                    interval={0}
                    angle={data.length > 4 ? -30 : 0}
                    textAnchor={data.length > 4 ? 'end' : 'middle'}
                  />
                  <YAxis
                    tick={{ fontSize: 9 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={fmt}
                    width={56}
                  />
                  <Tooltip
                    formatter={(v: number) => [fmt(v), 'Revenue']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }}
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {data.map((_, idx) => <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Total badge */}
          <div className="flex items-center justify-end">
            <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest tabular-nums">
              Total {fmt(total)}
            </div>
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
};
