import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { dashboardTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';

type DeliveryChartPeriod = 'weekly' | 'biweekly' | 'monthly';

type DeliveryHeatmapCategory = { id: string; name: string };
type DeliveryHeatmapCell = { qty: number; orders: number; revenue: number };
type DeliveryHeatmapData = {
  period: DeliveryChartPeriod;
  dates: Date[];
  labels: string[];
  categories: DeliveryHeatmapCategory[];
  grid: Record<string, DeliveryHeatmapCell>;
  max: number;
  deliveredOrdersToday: number;
};

const CATEGORY_ROWS = 7;
const CELL_SIZE_PX = 24;
const WEEKLY_CELL_MIN_PX = 20;
const WEEKLY_CELL_MAX_PX = 28;
const MIN_ALPHA = 0.12;
const MAX_ALPHA = 0.9;
const ZERO_ALPHA = 0.06;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45 },
});

const pad2 = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const rangeDates = (period: DeliveryChartPeriod): Date[] => {
  const now = new Date();
  const today = startOfDay(now);
  if (period === 'weekly') {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  const days = period === 'biweekly' ? 14 : 30;
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return Array.from({ length: days }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};

const cellKey = (categoryId: string, d: Date) => `${categoryId}|${dateKey(d)}`;

export default function DailyDeliveryChart({ onPeriodChange }: { onPeriodChange?: (period: DeliveryChartPeriod) => void }) {
  const { orders, menuItems, categories } = useRestaurantStore();
  const [period, setPeriod] = useState<DeliveryChartPeriod>('weekly');
  const [loading, setLoading] = useState(true);

  const data: DeliveryHeatmapData | null = useMemo(() => {
    try {
      const dates = rangeDates(period);
      const dateKeys = new Set(dates.map(dateKey));
      const categoryNameById = new Map<string, string>(categories.map((c) => [c.id, c.name]));
      const menuItemById = new Map(menuItems.map((m) => [m.id, m]));

      const todayKey = dateKey(new Date());
      const deliveredOrdersToday = orders.filter((o) => {
        if (o.type !== 'delivery') return false;
        if (o.status !== 'completed') return false;
        return dateKey(new Date(o.createdAt)) === todayKey;
      }).length;

      const cellByKey = new Map<string, { qty: number; revenue: number; orderIds: Set<string> }>();
      const totalsByCategory = new Map<string, number>();

      orders.forEach((o) => {
        if (o.type !== 'delivery') return;
        if (o.status === 'cancelled') return;
        const dk = dateKey(new Date(o.createdAt));
        if (!dateKeys.has(dk)) return;

        o.items.forEach((it) => {
          const categoryId = menuItemById.get(it.menuItemId)?.categoryId || 'cat-other';
          const qty = Number.isFinite(it.qty) ? it.qty : 0;
          const revenue = (Number.isFinite(it.price) ? it.price : 0) * qty;
          const key = `${categoryId}|${dk}`;
          const current = cellByKey.get(key) || { qty: 0, revenue: 0, orderIds: new Set<string>() };
          current.qty += qty;
          current.revenue += revenue;
          current.orderIds.add(o.id);
          cellByKey.set(key, current);

          totalsByCategory.set(categoryId, (totalsByCategory.get(categoryId) || 0) + qty);
        });
      });

      const ranked = Array.from(totalsByCategory.entries()).sort((a, b) => b[1] - a[1]);
      const picked = new Set<string>();
      const topCategories: DeliveryHeatmapCategory[] = [];

      ranked.forEach(([id]) => {
        if (topCategories.length >= CATEGORY_ROWS) return;
        picked.add(id);
        topCategories.push({ id, name: categoryNameById.get(id) || (id === 'cat-other' ? 'Other' : id) });
      });

      categories.forEach((c) => {
        if (topCategories.length >= CATEGORY_ROWS) return;
        if (picked.has(c.id)) return;
        picked.add(c.id);
        topCategories.push({ id: c.id, name: c.name });
      });

      if (topCategories.length < CATEGORY_ROWS && !picked.has('cat-other')) {
        topCategories.push({ id: 'cat-other', name: 'Other' });
      }

      const labels = dates.map((d) => {
        if (period === 'weekly') return d.toLocaleDateString(undefined, { weekday: 'short' });
        if (period === 'biweekly') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return String(d.getDate());
      });

      const grid: Record<string, DeliveryHeatmapCell> = {};
      let max = 0;

      topCategories.forEach((c) => {
        dates.forEach((d) => {
          const k = cellKey(c.id, d);
          const cell = cellByKey.get(k);
          const qty = cell?.qty || 0;
          const ordersCount = cell?.orderIds.size || 0;
          const revenue = cell?.revenue || 0;
          grid[k] = { qty, orders: ordersCount, revenue };
          if (ordersCount > max) max = ordersCount;
        });
      });

      return { period, dates, labels, categories: topCategories, grid, max, deliveredOrdersToday };
    } catch {
      return null;
    }
  }, [period, orders, menuItems, categories]);

  const ranks = useMemo(() => {
    if (!data) return { rankByKey: {} as Record<string, number>, maxRank: 0 };
    const entries = Object.entries(data.grid)
      .map(([k, v]) => ({ k, orders: v.orders }))
      .filter((e) => e.orders > 0)
      .sort((a, b) => a.orders - b.orders);

    const rankByKey: Record<string, number> = {};
    let rank = 0;
    let lastOrders = -1;
    entries.forEach((e) => {
      if (e.orders !== lastOrders) {
        rank += 1;
        lastOrders = e.orders;
      }
      rankByKey[e.k] = rank;
    });

    return { rankByKey, maxRank: rank };
  }, [data]);

  useEffect(() => {
    setLoading(true);
    const delayMs = import.meta.env.MODE === 'test' ? 0 : 280;
    if (delayMs === 0) {
      setLoading(false);
      return;
    }
    const id = window.setTimeout(() => setLoading(false), delayMs);
    return () => window.clearTimeout(id);
  }, [period]);

  const weeklyLayout = period === 'weekly';

  return (
    <motion.div {...fadeUp(0.49)} className="bg-card rounded-xl border shadow-sm p-5 lg:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className={dashboardTypography.heading}>Daily Deliveries</h3>
          <p className={dashboardTypography.subheading}>Trends & status by channel</p>
        </div>
        <div className="w-[140px]">
          <Select
            value={period}
            onValueChange={(v) => {
              const next = v as DeliveryChartPeriod;
              setPeriod(next);
              onPeriodChange?.(next);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Weekly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Yeah! You have delivered <span className="text-primary font-semibold">{data?.deliveredOrdersToday ?? 0}</span> orders today
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <div className={weeklyLayout ? 'min-w-0' : 'min-w-[620px]'}>
            <div
              className="grid gap-1.5 animate-pulse"
              style={{
                gridTemplateColumns: weeklyLayout
                  ? `110px repeat(7, minmax(${WEEKLY_CELL_MIN_PX}px, ${WEEKLY_CELL_MAX_PX}px))`
                  : `110px repeat(${period === 'biweekly' ? 14 : 30}, ${CELL_SIZE_PX}px)`,
              }}
            >
              {Array.from({ length: 7 }).map((_, row) => (
                <div key={`dl-skel-row-${row}`} className="contents">
                  <div className="h-7 rounded-md bg-muted/50" />
                  {Array.from({ length: period === 'weekly' ? 7 : period === 'biweekly' ? 14 : 30 }).map((__, col) => (
                    <div
                      key={`dl-skel-${row}-${col}`}
                      className={weeklyLayout ? 'bg-muted/40 border border-border/50 rounded-none aspect-square w-full' : 'bg-muted/40 border border-border/50 rounded-none'}
                      style={weeklyLayout ? undefined : { width: CELL_SIZE_PX, height: CELL_SIZE_PX }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !data ? (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">Error loading delivery chart</div>
      ) : data.max === 0 ? (
        <div className="p-4 rounded-md bg-muted/30 border border-border text-sm text-muted-foreground">No delivery data for this period</div>
      ) : (
        <div className="overflow-x-auto">
          <div className={weeklyLayout ? 'min-w-0' : 'min-w-[620px]'}>
            <div
              className="grid gap-1.5"
              role="grid"
              aria-label="Daily delivery heatmap"
              aria-rowcount={data.categories.length}
              aria-colcount={data.labels.length}
              style={{
                gridTemplateColumns: weeklyLayout
                  ? `110px repeat(${data.labels.length}, minmax(${WEEKLY_CELL_MIN_PX}px, ${WEEKLY_CELL_MAX_PX}px))`
                  : `110px repeat(${data.labels.length}, ${CELL_SIZE_PX}px)`,
              }}
            >
              {data.categories.map((cat) => (
                <div key={`dl-row-${cat.id}`} className="contents">
                  <div className="text-xs font-medium text-muted-foreground flex items-center pr-2 truncate" role="rowheader">
                    {cat.name}
                  </div>
                  {data.dates.map((d) => {
                    const k = cellKey(cat.id, d);
                    const cell = data.grid[k];
                    const ordersCount = cell?.orders || 0;
                    const rank = ordersCount > 0 ? (ranks.rankByKey[k] || 0) : 0;
                    const t = rank > 0 && ranks.maxRank > 0 ? rank / ranks.maxRank : 0;
                    const alpha = Math.min(MAX_ALPHA, Math.max(MIN_ALPHA, MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * t));
                    const bg = `hsl(var(--primary) / ${alpha})`;
                    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    const aria = `${cat.name}, ${label}. Order number ${rank}. ${ordersCount} orders.`;
                    return (
                      <UiTooltip key={k} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={aria}
                            className={weeklyLayout
                              ? 'border border-border/60 rounded-none cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background aspect-square w-full'
                              : 'border border-border/60 rounded-none cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'}
                            role="gridcell"
                            style={weeklyLayout
                              ? { background: ordersCount ? bg : `hsl(var(--primary) / ${ZERO_ALPHA})` }
                              : { width: CELL_SIZE_PX, height: CELL_SIZE_PX, background: ordersCount ? bg : `hsl(var(--primary) / ${ZERO_ALPHA})` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-0.5">
                            <div className="font-medium">Order #{rank}</div>
                          </div>
                        </TooltipContent>
                      </UiTooltip>
                    );
                  })}
                </div>
              ))}
            </div>
            <div
              className="grid mt-2"
              style={{
                gridTemplateColumns: weeklyLayout
                  ? `110px repeat(${data.labels.length}, minmax(${WEEKLY_CELL_MIN_PX}px, ${WEEKLY_CELL_MAX_PX}px))`
                  : `110px repeat(${data.labels.length}, ${CELL_SIZE_PX}px)`,
              }}
            >
              <div />
              {data.labels.map((l, idx) => {
                const show = data.period === 'weekly'
                  ? true
                  : data.period === 'biweekly'
                    ? idx % 2 === 0 || idx === data.labels.length - 1
                    : idx % 3 === 0 || idx === data.labels.length - 1;
                return (
                  <div key={`dl-x-${idx}`} className="text-[10px] text-muted-foreground text-center font-medium">
                    {show ? l : ''}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] text-muted-foreground font-medium">Low</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `hsl(var(--primary) / ${ZERO_ALPHA})` }}>
                <div
                  className="h-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(var(--primary) / ${ZERO_ALPHA}) 0%, hsl(var(--primary) / 0.25) 25%, hsl(var(--primary) / 0.55) 55%, hsl(var(--primary) / ${MAX_ALPHA}) 100%)`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">High</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
