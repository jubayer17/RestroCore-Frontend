import React from 'react';
import { UtensilsCrossed, CheckCircle2, XCircle } from 'lucide-react';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { dashboardTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';

interface CategoryHealth { name: string; available: number; unavailable: number; }

interface MenuHealthCardProps {
  totalItems: number;
  availableItems: number;
  byCategory: CategoryHealth[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Each category row is ~62px tall + 8px gap; 5 rows = ~338px
const VISIBLE_ROWS = 5;
const ROW_H = 62;
const GAP = 8;
const SCROLL_MAX_H = VISIBLE_ROWS * ROW_H + (VISIBLE_ROWS - 1) * GAP; // 338px

export const MenuHealthCard: React.FC<MenuHealthCardProps> = ({
  totalItems, availableItems, byCategory, isLoading, error, onRetry,
}) => {
  const availPct = totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0;
  const unavailableItems = totalItems - availableItems;
  const needsScroll = byCategory.length > VISIBLE_ROWS;

  return (
    <AnalyticsCard
      title="Menu Health"
      titleIcon={UtensilsCrossed}
      subtitle="Item availability across categories"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      {totalItems === 0 ? (
        <div className={dashboardTypography.emptyState}>Add menu items to track availability.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Summary badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest tabular-nums">
              {availPct}% Available
            </div>
            <div className="rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest tabular-nums">
              {availableItems} On
            </div>
            {unavailableItems > 0 && (
              <div className="rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest tabular-nums">
                {unavailableItems} Off
              </div>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="rounded-2xl border border-border/50 bg-muted/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className={cn(dashboardTypography.chartLabel, "uppercase tracking-wider")}>Overall Availability</span>
              <span className="text-sm font-bold tabular-nums">{availableItems}/{totalItems}</span>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden border border-border/50">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  availPct >= 80 ? "bg-emerald-500" : availPct >= 50 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${availPct}%` }}
              />
            </div>
          </div>

          {/* Category list — scrollable if > 5 */}
          <div
            className={cn("flex flex-col gap-2", needsScroll && "overflow-y-auto pr-1")}
            style={needsScroll ? { maxHeight: SCROLL_MAX_H } : undefined}
          >
            {byCategory.map((cat) => {
              const catTotal = cat.available + cat.unavailable;
              const pct = catTotal > 0 ? Math.round((cat.available / catTotal) * 100) : 0;
              const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
              const toneClass = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500';
              const bgClass = pct >= 80
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : pct >= 50
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-red-500/10 border-red-500/20';
              return (
                <div key={cat.name} className="rounded-2xl border border-border/50 bg-muted/10 p-3 shrink-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("h-6 w-6 rounded-xl border flex items-center justify-center shrink-0", bgClass)}>
                        {pct >= 50
                          ? <CheckCircle2 className={cn("h-3.5 w-3.5", toneClass)} />
                          : <XCircle className={cn("h-3.5 w-3.5", toneClass)} />}
                      </div>
                      <span className="text-xs font-medium truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-emerald-500 font-semibold tabular-nums">{cat.available} on</span>
                      {cat.unavailable > 0 && (
                        <span className="text-[10px] text-red-500 font-semibold tabular-nums">{cat.unavailable} off</span>
                      )}
                      <span className={cn("text-[10px] font-bold w-7 text-right tabular-nums", toneClass)}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {needsScroll && (
            <p className={cn(dashboardTypography.chartLabel, "text-center")}>
              Showing all {byCategory.length} categories · scroll to view
            </p>
          )}
        </div>
      )}
    </AnalyticsCard>
  );
};
