import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, WalletCards, Banknote, Smartphone, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, WidgetPrefs } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';
import type { Order, PaymentMethod } from '@/types/restaurant';
import { TimePeriodSelect } from './TimePeriodSelect';
import { inPeriod, type TimePeriod } from './time-period';

type MixRow = { key: PaymentMethod | 'unknown'; label: string; count: number; total: number; tone: string; bar: string };

interface PaymentMixCardProps {
  widgetPrefs: WidgetPrefs;
  completedOrders: Order[];
  currencyFormatter: Intl.NumberFormat;
}

export const PaymentMixCard: React.FC<PaymentMixCardProps> = ({
  widgetPrefs,
  completedOrders,
  currencyFormatter,
}) => {
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const filtered = useMemo(() => {
    const now = new Date();
    return completedOrders.filter((o) => inPeriod(o.createdAt, period, now));
  }, [completedOrders, period]);

  const rows: MixRow[] = useMemo(() => {
    const by = new Map<MixRow['key'], MixRow>();
    const ensure = (key: MixRow['key'], label: string, tone: string, bar: string) => {
      const prev = by.get(key);
      if (prev) return prev;
      const next: MixRow = { key, label, count: 0, total: 0, tone, bar };
      by.set(key, next);
      return next;
    };

    filtered.forEach((o) => {
      const k = (o.paymentMethod || 'unknown') as MixRow['key'];
      const row =
        k === 'cash' ? ensure('cash', 'Cash', 'text-emerald-500', 'bg-emerald-500')
          : k === 'card' ? ensure('card', 'Card', 'text-blue-500', 'bg-blue-500')
            : k === 'wallet' ? ensure('wallet', 'Wallet', 'text-fuchsia-500', 'bg-fuchsia-500')
              : k === 'mixed' ? ensure('mixed', 'Mixed', 'text-muted-foreground', 'bg-muted-foreground')
                : ensure('unknown', 'Unknown', 'text-muted-foreground', 'bg-muted-foreground');

      row.count += 1;
      row.total += Number.isFinite(o.total) ? o.total : 0;
    });

    return Array.from(by.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const DUMMY_ROWS: MixRow[] = [
    { key: 'card',    label: 'Card',   count: 148, total: 7240, tone: 'text-blue-500',    bar: 'bg-blue-500' },
    { key: 'cash',    label: 'Cash',   count: 93,  total: 3860, tone: 'text-emerald-500', bar: 'bg-emerald-500' },
    { key: 'wallet',  label: 'Wallet', count: 41,  total: 1980, tone: 'text-fuchsia-500', bar: 'bg-fuchsia-500' },
    { key: 'mixed',   label: 'Mixed',  count: 18,  total:  720, tone: 'text-muted-foreground', bar: 'bg-muted-foreground' },
  ];

  const isDummy = filtered.length === 0;
  const displayRows = isDummy ? DUMMY_ROWS : rows;
  const total = displayRows.reduce((s, r) => s + r.total, 0);
  const top = displayRows.slice(0, 4);

  if (widgetPrefs.hidden.includes('orderSummary')) return null;

  return (
    <motion.div {...fadeUp(0.53)} className="glass-card p-4 lg:p-5 border border-border/50 h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className={cn(dashboardTypography.heading, 'flex items-center gap-2')}>
            <WalletCards className="h-4 w-4 text-primary" /> Payment Mix
          </h3>
          <p className={dashboardTypography.subheading}>Share by method</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TimePeriodSelect value={period} onChange={setPeriod} className="w-[132px]" />
          <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest tabular-nums">
            {currencyFormatter.format(total)}
          </div>
        </div>
      </div>

      {isDummy && (
        <p className="text-[10px] text-muted-foreground/50 mb-2 italic">Sample data — no completed orders yet</p>
      )}
      <>
          <div className="h-2 rounded-full overflow-hidden bg-muted/40 border border-border/50 flex">
            {top.map((r) => {
              const pct = total > 0 ? (r.total / total) * 100 : 0;
              return <div key={r.key} className={cn('h-full', r.bar)} style={{ width: `${pct}%` }} />;
            })}
          </div>

          <div className="mt-4 space-y-2">
            {top.map((r) => {
              const pct = total > 0 ? Math.round((r.total / total) * 100) : 0;
              const Icon =
                r.key === 'cash' ? Banknote
                  : r.key === 'wallet' ? Smartphone
                    : r.key === 'mixed' ? Layers
                      : CreditCard;
              return (
                <div key={r.key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('h-8 w-8 rounded-xl border border-border/50 bg-muted/10 flex items-center justify-center shrink-0', r.key === 'card' && 'bg-blue-500/10', r.key === 'cash' && 'bg-emerald-500/10', r.key === 'wallet' && 'bg-fuchsia-500/10', r.key === 'mixed' && 'bg-muted/30')}>
                      <Icon className={cn('h-4 w-4', r.tone)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.label}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">{r.count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{pct}%</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{currencyFormatter.format(r.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
      </>
    </motion.div>
  );
};
