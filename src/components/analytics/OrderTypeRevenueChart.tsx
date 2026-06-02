import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { UtensilsCrossed, Truck, ShoppingBag, Package, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { dashboardTypography } from '@/lib/typography';
import { fadeUp } from '@/components/dashboard/dashboard-types';
import { cn } from '@/lib/utils';

const TYPE_META: Record<string, { color: string; Icon: React.ElementType; iconBg: string; tone: string }> = {
  'Dine In':  { color: 'hsl(var(--primary))', Icon: UtensilsCrossed, iconBg: 'bg-primary/10 border-primary/20',        tone: 'text-primary' },
  Delivery:   { color: '#3b82f6',             Icon: Truck,           iconBg: 'bg-blue-500/10 border-blue-500/20',       tone: 'text-blue-500' },
  Takeaway:   { color: '#a855f7',             Icon: ShoppingBag,     iconBg: 'bg-violet-500/10 border-violet-500/20',   tone: 'text-violet-500' },
  Pickup:     { color: '#22c55e',             Icon: Package,         iconBg: 'bg-emerald-500/10 border-emerald-500/20', tone: 'text-emerald-500' },
};

interface OrderTypeRevenueChartProps {
  data: { name: string; revenue: number; orders: number }[];
  currency: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const OrderTypeRevenueChart: React.FC<OrderTypeRevenueChartProps> = ({ data, currency, isLoading, error, onRetry }) => {
  const [view, setView] = useState<'donut' | 'bar'>('donut');

  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const right = (
    <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/20 overflow-hidden p-0.5">
      <button type="button" onClick={() => setView('donut')}
        className={cn('p-1.5 rounded-lg transition-colors', view === 'donut' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        aria-label="Donut chart view">
        <PieChartIcon className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setView('bar')}
        className={cn('p-1.5 rounded-lg transition-colors', view === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        aria-label="Bar chart view">
        <BarChart2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <AnalyticsCard
      title="Revenue by Order Type"
      titleIcon={UtensilsCrossed}
      subtitle="Channel revenue distribution"
      right={right}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      {data.length === 0 ? (
        <div className={dashboardTypography.emptyState}>Complete at least one order to see channel mix.</div>
      ) : (
        <div className="space-y-4">

          {/* Donut view */}
          {view === 'donut' && (
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="revenue"
                    strokeWidth={3}
                    stroke="hsl(var(--card))"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={TYPE_META[entry.name]?.color ?? 'hsl(var(--muted-foreground))'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [fmt(v), 'Revenue']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className={dashboardTypography.chartLabel}>Total Revenue</p>
                <p className={cn(dashboardTypography.metricValue, 'text-primary leading-tight tabular-nums text-base')}>
                  {fmt(totalRev)}
                </p>
                <p className={cn(dashboardTypography.chartLabel, 'mt-0.5')}>{totalOrders} orders</p>
              </div>
            </div>
          )}

          {/* Bar view */}
          {view === 'bar' && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} layout="vertical" margin={{ left: 4, right: 64, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={fmt} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={72} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), 'Revenue']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }}
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={20}
                  label={{ position: 'right', formatter: (v: number) => fmt(v), fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={TYPE_META[entry.name]?.color ?? 'hsl(var(--muted-foreground))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Channel rows */}
          <div className="space-y-2">
            {data.map((d, i) => {
              const meta = TYPE_META[d.name];
              const Icon = meta?.Icon;
              const color = meta?.color ?? 'hsl(var(--muted-foreground))';
              const pct = totalRev > 0 ? (d.revenue / totalRev) * 100 : 0;
              return (
                <motion.div key={d.name} {...fadeUp(i * 0.07)} className="rounded-2xl border border-border/50 bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn('h-7 w-7 rounded-xl border flex items-center justify-center shrink-0', meta?.iconBg ?? 'bg-muted/30 border-border/50')}>
                        {Icon && <Icon className={cn('h-3.5 w-3.5', meta?.tone)} />}
                      </div>
                      <span className="text-sm font-medium">{d.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums" style={{ color }}>{fmt(d.revenue)}</p>
                      <p className={dashboardTypography.chartLabel}>{d.orders} orders</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
};
