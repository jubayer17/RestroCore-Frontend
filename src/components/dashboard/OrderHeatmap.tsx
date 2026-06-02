import React from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { fadeUp } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';

interface HeatmapCell {
  count: number;
  revenue: number;
  aov: number;
}

interface HeatmapData {
  hours: number[];
  days: string[];
  grid: Record<string, HeatmapCell>;
  max: number;
}

interface OrderHeatmapProps {
  orderHeatmapEnabled: boolean;
  heatmapCategory: string;
  setHeatmapCategory: (v: string) => void;
  heatmapSegment: 'all' | 'dine-in' | 'delivery' | 'new' | 'repeat';
  setHeatmapSegment: (v: 'all' | 'dine-in' | 'delivery' | 'new' | 'repeat') => void;
  heatmapView: 'time' | 'region';
  setHeatmapView: (v: 'time' | 'region') => void;
  categories: { id: string; name: string }[];
  timeHM: HeatmapData | null;
  regionHM: HeatmapData | null;
}

export const OrderHeatmap: React.FC<OrderHeatmapProps> = ({
  orderHeatmapEnabled,
  heatmapCategory,
  setHeatmapCategory,
  heatmapSegment,
  setHeatmapSegment,
  heatmapView,
  setHeatmapView,
  categories,
  timeHM,
  regionHM,
}) => {
  if (!orderHeatmapEnabled) return null;

  return (
    <motion.div {...fadeUp(0.5)} className="glass-card p-5 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className={dashboardTypography.heading}>Order Heatmap</h3>
          <p className={dashboardTypography.subheading}>Density by hour with filters</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[140px]">
            <Select value={heatmapCategory} onValueChange={setHeatmapCategory}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={heatmapSegment} onValueChange={(v) => setHeatmapSegment(v as 'all' | 'dine-in' | 'delivery' | 'new' | 'repeat')}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                <SelectItem value="dine-in">Dine‑in</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="repeat">Repeat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            <button onClick={() => setHeatmapView('time')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', heatmapView === 'time' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>By Time</button>
            <button onClick={() => setHeatmapView('region')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', heatmapView === 'region' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>By Region</button>
          </div>
        </div>
      </div>
      {(!timeHM || !regionHM) ? (
        <div className={dashboardTypography.errorState}>Error loading heatmap</div>
      ) : heatmapView === 'time' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid" style={{ gridTemplateColumns: `60px repeat(${timeHM.hours.length}, minmax(28px, 1fr))` }}>
              <div />
              {timeHM.hours.map(h => (
                <div key={`h-${h}`} className={cn(dashboardTypography.chartLabel, "text-center")}>{h}:00</div>
              ))}
              {timeHM.days.map(d => (
                <div key={`row-${d}`} className="contents">
                  <div className={cn(dashboardTypography.chartLabel, "flex items-center")}>{d}</div>
                  {timeHM.hours.map(h => {
                    const k = `${d}-${h}`;
                    const cell = timeHM.grid[k];
                    const v = cell?.count || 0;
                    const intensity = timeHM.max > 0 ? v / timeHM.max : 0;
                    const bg = `hsla(var(--primary-hue, 221) var(--primary-saturation, 83%) var(--primary-lightness, 53%) / ${Math.max(0.08, intensity * 0.8)})`;
                    return (
                      <UiTooltip key={k}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-7 rounded-sm border border-border/60 inline-flex items-center justify-center cursor-default"
                            style={{ background: v ? bg : 'hsl(var(--muted))' }}
                          >
                            <span className="text-[10px] font-semibold" style={{ color: v ? 'white' : 'hsl(var(--muted-foreground))' }}>{v || ''}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className={dashboardTypography.tooltip}>
                            <div className="font-bold">{d} {h}:00</div>
                            <div>{v} orders</div>
                            {cell && <div>${cell.revenue.toFixed(0)} · AOV ${cell.aov}</div>}
                          </div>
                        </TooltipContent>
                      </UiTooltip>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={cn(dashboardTypography.metricLabel, "opacity-70")}>Density</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(op => (
                  <div key={op} className="h-2 w-4 rounded-full" style={{ background: `hsla(var(--primary-hue, 221) var(--primary-saturation, 83%) var(--primary-lightness, 53%) / ${op})` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl font-medium">
          Regional heatmap coming soon...
        </div>
      )}
    </motion.div>
  );
};
