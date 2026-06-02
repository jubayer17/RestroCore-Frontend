import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, ShoppingBag, DollarSign, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboardTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';

type OrderOverviewPeriod = 'daily' | 'weekly' | 'monthly' | '6m' | '1y';

type Bucket = { label: string; count: number };
type OverviewData = {
  period: OrderOverviewPeriod;
  buckets: Bucket[];
  tickMax: number;
  tickStep: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  revenue: number;
  newOrdersToday: number;
  trendPct: number;
};

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22 },
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const startOfWeek = (d: Date) => addDays(startOfDay(d), -startOfDay(d).getDay());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, months: number) => new Date(d.getFullYear(), d.getMonth() + months, 1);

const computeAxis = (maxValue: number) => {
  const tickStep = maxValue <= 30 ? 5 : 10;
  const tickMax = Math.max(tickStep * 2, Math.ceil(maxValue / tickStep) * tickStep);
  return { tickMax, tickStep };
};

export default function OrderOverview({ onPeriodChange }: { onPeriodChange?: (period: OrderOverviewPeriod) => void }) {
  const { orders, settings } = useRestaurantStore();
  const [period, setPeriod] = useState<OrderOverviewPeriod>('weekly');
  const [loading, setLoading] = useState(true);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: settings.currency || 'USD', maximumFractionDigits: 0 });
    } catch {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    }
  }, [settings.currency]);

  const data: OverviewData | null = useMemo(() => {
    try {
      const now = new Date();

      const todayStart = startOfDay(now);
      const todayEnd = addDays(todayStart, 1);
      const newOrdersToday = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        if (!Number.isFinite(t)) return false;
        if (t < todayStart.getTime() || t >= todayEnd.getTime()) return false;
        return o.status !== 'cancelled';
      }).length;

      const getRange = (): { start: Date; end: Date; prevStart: Date; prevEnd: Date } => {
        if (period === 'daily') {
          const start = todayStart;
          const end = todayEnd;
          const prevStart = addDays(start, -1);
          const prevEnd = start;
          return { start, end, prevStart, prevEnd };
        }
        if (period === 'weekly') {
          const start = startOfWeek(now);
          const end = addDays(start, 7);
          const prevStart = addDays(start, -7);
          const prevEnd = start;
          return { start, end, prevStart, prevEnd };
        }
        if (period === 'monthly') {
          const start = startOfMonth(now);
          const end = addMonths(start, 1);
          const prevStart = addMonths(start, -1);
          const prevEnd = start;
          return { start, end, prevStart, prevEnd };
        }
        if (period === '6m') {
          const start = addMonths(startOfMonth(now), -5);
          const end = addMonths(startOfMonth(now), 1);
          const prevStart = addMonths(start, -6);
          const prevEnd = start;
          return { start, end, prevStart, prevEnd };
        }
        const start = addMonths(startOfMonth(now), -11);
        const end = addMonths(startOfMonth(now), 1);
        const prevStart = addMonths(start, -12);
        const prevEnd = start;
        return { start, end, prevStart, prevEnd };
      };

      const { start, end, prevStart, prevEnd } = getRange();
      const startMs = start.getTime();
      const endMs = end.getTime();
      const prevStartMs = prevStart.getTime();
      const prevEndMs = prevEnd.getTime();

      const inRange = (ms: number) => ms >= startMs && ms < endMs;
      const inPrev = (ms: number) => ms >= prevStartMs && ms < prevEndMs;

      const ordersInRange = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        if (!Number.isFinite(t)) return false;
        return inRange(t);
      });

      const ordersInPrev = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        if (!Number.isFinite(t)) return false;
        return inPrev(t);
      });

      const totalOrders = ordersInRange.length;
      const completedOrders = ordersInRange.filter((o) => o.status === 'completed').length;
      const cancelledOrders = ordersInRange.filter((o) => o.status === 'cancelled').length;
      const activeOrders = ordersInRange.filter((o) => !['completed', 'cancelled'].includes(o.status)).length;
      const revenue = ordersInRange.reduce((s, o) => (o.status === 'completed' ? s + (Number.isFinite(o.total) ? o.total : 0) : s), 0);

      const prevTotal = ordersInPrev.length;
      const trendPct = prevTotal > 0 ? ((totalOrders - prevTotal) / prevTotal) * 100 : totalOrders > 0 ? 100 : 0;

      const buckets: Bucket[] = (() => {
        if (period === 'daily') {
          const labels = ['00-03', '04-07', '08-11', '12-15', '16-19', '20-23'];
          const counts = new Array(labels.length).fill(0);
          ordersInRange.forEach((o) => {
            if (o.status === 'cancelled') return;
            const d = new Date(o.createdAt);
            const idx = Math.min(labels.length - 1, Math.max(0, Math.floor(d.getHours() / 4)));
            counts[idx] += 1;
          });
          return labels.map((label, i) => ({ label, count: counts[i] }));
        }

        if (period === 'weekly') {
          const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const counts = new Array(labels.length).fill(0);
          ordersInRange.forEach((o) => {
            if (o.status === 'cancelled') return;
            const idx = new Date(o.createdAt).getDay();
            counts[idx] += 1;
          });
          return labels.map((label, i) => ({ label, count: counts[i] }));
        }

        if (period === 'monthly') {
          const labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
          const counts = new Array(labels.length).fill(0);
          ordersInRange.forEach((o) => {
            if (o.status === 'cancelled') return;
            const d = new Date(o.createdAt);
            const dayIdx = Math.floor((startOfDay(d).getTime() - startMs) / (24 * 60 * 60 * 1000));
            const weekIdx = Math.min(labels.length - 1, Math.max(0, Math.floor(dayIdx / 7)));
            counts[weekIdx] += 1;
          });
          return labels.map((label, i) => ({ label, count: counts[i] }));
        }

        if (period === '6m') {
          const labels = Array.from({ length: 6 }, (_, i) => {
            const d = addMonths(startOfMonth(now), -(5 - i));
            return d.toLocaleDateString(undefined, { month: 'short' });
          });
          const counts = new Array(labels.length).fill(0);
          ordersInRange.forEach((o) => {
            if (o.status === 'cancelled') return;
            const d = new Date(o.createdAt);
            const idx = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
            if (idx >= 0 && idx < counts.length) counts[idx] += 1;
          });
          return labels.map((label, i) => ({ label, count: counts[i] }));
        }

        const labels = Array.from({ length: 12 }, (_, i) => {
          const d = addMonths(startOfMonth(now), -(11 - i));
          return d.toLocaleDateString(undefined, { month: 'short' });
        });
        const counts = new Array(labels.length).fill(0);
        ordersInRange.forEach((o) => {
          if (o.status === 'cancelled') return;
          const d = new Date(o.createdAt);
          const idx = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
          if (idx >= 0 && idx < counts.length) counts[idx] += 1;
        });
        return labels.map((label, i) => ({ label, count: counts[i] }));
      })();

      const maxValue = Math.max(...buckets.map((b) => b.count), 0);
      const { tickMax, tickStep } = computeAxis(maxValue);

      return {
        period,
        buckets,
        tickMax,
        tickStep,
        totalOrders,
        completedOrders,
        cancelledOrders,
        activeOrders,
        revenue,
        newOrdersToday,
        trendPct,
      };
    } catch {
      return null;
    }
  }, [orders, period]);

  useEffect(() => {
    setLoading(true);
    const delayMs = import.meta.env.MODE === 'test' ? 0 : 240;
    if (delayMs === 0) {
      setLoading(false);
      return;
    }
    const id = window.setTimeout(() => setLoading(false), delayMs);
    return () => window.clearTimeout(id);
  }, [period]);

  const trendUp = (data?.trendPct ?? 0) >= 0;
  const trendText = `${trendUp ? '+' : ''}${Math.abs(data?.trendPct ?? 0).toFixed(1)}%`;
  const weeklyLayout = period === 'weekly';

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="glass-card p-4 lg:p-5 border border-border/50 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className={dashboardTypography.heading}>Order Distribution</h3>
          <p className={dashboardTypography.subheading}>Volume by status</p>
        </div>
        <div className="w-[140px]">
          <Select
            value={period}
            onValueChange={(v) => {
              const next = v as OrderOverviewPeriod;
              setPeriod(next);
              onPeriodChange?.(next);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Weekly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="6m">6-month</SelectItem>
              <SelectItem value="1y">1-year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mb-3">
        <span className="truncate">New today: <span className="text-fuchsia-500 font-semibold tabular-nums">+{data?.newOrdersToday ?? 0}</span></span>
        <span className="truncate">Active: <span className="text-foreground/80 font-semibold tabular-nums">{data?.activeOrders ?? 0}</span></span>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded-lg bg-muted/50" />
            <div className="h-12 rounded-lg bg-muted/50" />
            <div className="h-12 rounded-lg bg-muted/50" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`oo-skel-${i}`} className="flex items-center gap-3">
                <div className="w-9 h-3 rounded-none bg-muted/50" />
                <div className={cn('flex-1 rounded-none bg-muted/40', weeklyLayout ? 'h-7' : 'h-6')} />
                <div className="w-10 h-3 rounded-none bg-muted/50" />
              </div>
            ))}
          </div>
        </div>
      ) : !data ? (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">Error loading overview</div>
      ) : data.totalOrders === 0 ? (
        <div className="p-4 rounded-md bg-muted/30 border border-border text-sm text-muted-foreground">No orders for this period</div>
      ) : (
        <motion.div key={period} {...fade}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total', value: data.totalOrders.toString(), icon: ShoppingBag, tone: 'text-primary' },
              { label: 'Revenue', value: currencyFormatter.format(data.revenue), icon: DollarSign, tone: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Trend', value: trendText, icon: trendUp ? TrendingUp : TrendingDown, tone: trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border/50 bg-muted/10 px-3 py-2 flex items-center gap-2 hover:bg-muted/20 transition-colors">
                <m.icon className={cn('h-4 w-4 shrink-0', m.tone)} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-none truncate">{m.value}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-1">{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {data.completedOrders}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              {data.activeOrders}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              {data.cancelledOrders}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
              {Math.max(0, data.totalOrders - data.cancelledOrders)}
            </div>
          </div>

          <div className="space-y-2">
            {data.buckets.map((b) => {
              const pct = data.tickMax > 0 ? Math.min(1, b.count / data.tickMax) : 0;
              return (
                <div key={b.label} className="flex items-center gap-3 group">
                  <div className={cn('text-xs text-muted-foreground font-medium', weeklyLayout ? 'w-11' : 'w-10')}>{b.label}</div>
                  <div className={cn('flex-1 bg-muted/35 border border-border/70 rounded-none overflow-hidden', weeklyLayout ? 'h-5' : 'h-4')}>
                    <div
                      className="h-full bg-primary/80 group-hover:bg-primary transition-colors"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-semibold text-foreground">{b.count}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
