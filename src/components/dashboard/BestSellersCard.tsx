import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, WidgetPrefs } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';
import type { Order } from '@/types/restaurant';
import { TimePeriodSelect } from './TimePeriodSelect';
import { inPeriod, type TimePeriod } from './time-period';

type BestSeller = {
  key: string;
  name: string;
  qty: number;
  revenue: number;
};

interface BestSellersCardProps {
  widgetPrefs: WidgetPrefs;
  completedOrders: Order[];
  currencyFormatter: Intl.NumberFormat;
}

export const BestSellersCard: React.FC<BestSellersCardProps> = ({
  widgetPrefs,
  completedOrders,
  currencyFormatter,
}) => {
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const filtered = useMemo(() => {
    const now = new Date();
    return completedOrders.filter((o) => inPeriod(o.createdAt, period, now));
  }, [completedOrders, period]);

  const bestSellers: BestSeller[] = useMemo(() => {
    const byItem = new Map<string, BestSeller>();
    filtered.forEach((o) => {
      o.items.forEach((it) => {
        const key = it.menuItemId || it.name;
        const prev = byItem.get(key) || { key, name: it.name, qty: 0, revenue: 0 };
        prev.qty += it.qty;
        prev.revenue += it.qty * it.price;
        prev.name = it.name;
        byItem.set(key, prev);
      });
    });
    return Array.from(byItem.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  }, [filtered]);

  const DUMMY_SELLERS: BestSeller[] = [
    { key: 'dummy-1', name: 'Grilled Ribeye Steak', qty: 84, revenue: 2436 },
    { key: 'dummy-2', name: 'Truffle Mushroom Pasta', qty: 67, revenue: 1474 },
    { key: 'dummy-3', name: 'Signature Lava Cake', qty: 112, revenue: 896 },
  ];

  const displaySellers = bestSellers.length > 0 ? bestSellers : DUMMY_SELLERS;
  const isDummy = bestSellers.length === 0;

  const maxRevenue = Math.max(...displaySellers.map((b) => b.revenue), 0);
  const totalItems = isDummy
    ? DUMMY_SELLERS.reduce((s, b) => s + b.qty, 0)
    : filtered.reduce((s, o) => s + o.items.reduce((x, it) => x + it.qty, 0), 0);

  if (widgetPrefs.hidden.includes('orderSummary')) return null;

  return (
    <motion.div {...fadeUp(0.52)} className="glass-card p-4 lg:p-5 border border-border/50 h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className={cn(dashboardTypography.heading, 'flex items-center gap-2')}>
            <Trophy className="h-4 w-4 text-primary" /> Best Sellers
          </h3>
          <p className={dashboardTypography.subheading}>Top items by revenue</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TimePeriodSelect value={period} onChange={setPeriod} className="w-[132px]" />
          <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest tabular-nums">
            {totalItems} sold
          </div>
        </div>
      </div>

      {isDummy && (
        <p className="text-[10px] text-muted-foreground/50 mb-2 italic">Sample data — no completed orders yet</p>
      )}
      <div className="space-y-2.5">
          {displaySellers.map((b, idx) => {
            const pct = maxRevenue > 0 ? Math.round((b.revenue / maxRevenue) * 100) : 0;
            const rankTone =
              idx === 0 ? 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20'
                : idx === 1 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : idx === 2 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-muted/40 text-muted-foreground border-border/50';
            const barTone =
              idx === 0 ? 'bg-fuchsia-500'
                : idx === 1 ? 'bg-blue-500'
                  : 'bg-emerald-500';
            return (
              <div key={b.key} className="rounded-2xl border border-border/50 bg-muted/10 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-7 w-7 rounded-xl border flex items-center justify-center text-[11px] font-bold tabular-nums', rankTone)}>
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium truncate">{b.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">{b.qty} sold • {currencyFormatter.format(b.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-muted-foreground tabular-nums">{pct}%</p>
                  </div>
                </div>
                <div className="mt-2.5 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', barTone)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-blue-500" />
          Tune items in Menu Builder
        </div>
        <Link to="/menu-builder" className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-500/80 transition-colors">
          Open <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
};
