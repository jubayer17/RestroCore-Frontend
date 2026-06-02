import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';

interface CustomerRetentionCardProps {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  avgOrdersPerReturning: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const CustomerRetentionCard: React.FC<CustomerRetentionCardProps> = ({
  newCustomers,
  returningCustomers,
  totalCustomers,
  avgOrdersPerReturning,
  isLoading,
  error,
  onRetry,
}) => {
  const data = [
    { name: 'Returning', value: returningCustomers, color: 'hsl(var(--primary))' },
    { name: 'New',       value: newCustomers,        color: 'hsl(var(--accent))' },
  ].filter((d) => d.value > 0);

  const retentionRate = totalCustomers > 0
    ? Math.round((returningCustomers / totalCustomers) * 100)
    : 0;

  const stats = [
    { label: 'Total Customers',      value: totalCustomers.toLocaleString() },
    { label: 'Returning',            value: returningCustomers.toLocaleString(), color: 'text-primary' },
    { label: 'New',                  value: newCustomers.toLocaleString(),        color: 'text-accent' },
    { label: 'Avg Orders / Returning', value: avgOrdersPerReturning.toFixed(1) },
  ];

  return (
    <AnalyticsCard
      title="Customer Retention"
      subtitle="New vs returning in period"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      right={<Users2 className="h-4 w-4 text-primary" />}
    >
      {totalCustomers === 0 ? (
        <div className="rounded-xl border bg-muted/20 p-6 text-center">
          <p className="text-sm font-medium">No customer history</p>
          <p className="text-sm text-muted-foreground mt-1">Add orders with customer details to track retention.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground tabular-nums">{retentionRate}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Retention Rate</span>
            </div>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/20 border border-border/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className={cn('text-base font-bold tabular-nums mt-0.5', s.color ?? 'text-foreground')}>{s.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </AnalyticsCard>
  );
};
