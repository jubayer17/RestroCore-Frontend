import React from 'react';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { dashboardTypography } from '@/lib/typography';
import { fadeUp } from '@/components/dashboard/dashboard-types';
import { cn } from '@/lib/utils';

interface DiscountAnalysisCardProps {
  totalDiscount: number;
  discountedOrders: number;
  totalOrders: number;
  avgDiscountPct: number;
  maxDiscount: number;
  currency: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const DiscountAnalysisCard: React.FC<DiscountAnalysisCardProps> = ({
  totalDiscount, discountedOrders, totalOrders, avgDiscountPct, maxDiscount, currency, isLoading, error, onRetry,
}) => {
  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);

  const usageRate = totalOrders > 0 ? Math.round((discountedOrders / totalOrders) * 100) : 0;

  const rows = [
    { label: 'Total Discounts Given', value: fmt(totalDiscount) },
    { label: 'Orders with Discount',  value: `${discountedOrders} / ${totalOrders}` },
    { label: 'Discount Usage Rate',   value: `${usageRate}%` },
    { label: 'Avg Discount %',        value: `${avgDiscountPct.toFixed(1)}%` },
    { label: 'Largest Discount',      value: fmt(maxDiscount) },
  ];

  return (
    <AnalyticsCard
      title="Discount Analysis"
      titleIcon={Tag}
      subtitle="How discounts are being applied"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      {totalOrders === 0 ? (
        <div className={dashboardTypography.emptyState}>Select a wider range to analyze discounts.</div>
      ) : (
        <div className="space-y-4">
          {/* Usage rate bar */}
          <motion.div {...fadeUp(0)} className="rounded-2xl border border-border/50 bg-muted/10 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className={cn(dashboardTypography.chartLabel, "uppercase tracking-wider")}>Usage Rate</span>
              <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest tabular-nums">
                {usageRate}%
              </div>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${Math.min(usageRate, 100)}%` }}
              />
            </div>
          </motion.div>

          {/* Stat rows */}
          <div className="space-y-2">
            {rows.map((r, i) => (
              <motion.div key={r.label} {...fadeUp(i * 0.05)} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                <span className={dashboardTypography.chartLabel}>{r.label}</span>
                <span className="text-sm font-bold tabular-nums text-foreground">{r.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
};
