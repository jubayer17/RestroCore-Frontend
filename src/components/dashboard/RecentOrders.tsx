import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, CreditCard, Hash, User2, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';
import { TimePeriodSelect } from './TimePeriodSelect';
import { inPeriod, type TimePeriod } from './time-period';

interface RecentOrdersProps {
  orders: Array<{
    id: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
    type: 'dinein' | 'takeaway' | 'delivery' | 'pickup';
    total: number;
    createdAt: string;
    customerName?: string;
    customerPhone?: string;
    tableId?: string;
    paymentMethod?: 'cash' | 'card' | 'wallet' | 'mixed';
    items: Array<{ name: string; qty: number }>;
  }>;
  timeSince: (dateStr: string) => string;
  currencyFormatter: Intl.NumberFormat;
  targetHeight?: number;
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({
  orders,
  timeSince,
  currencyFormatter,
  targetHeight,
}) => {
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const shortId = (id: string) => `#${id.slice(-6)}`;
  const bodyClassName = targetHeight ? 'flex-1 min-h-0 overflow-y-auto' : 'max-h-[360px] overflow-y-auto';

  const filtered = useMemo(() => {
    const now = new Date();
    return [...orders]
      .filter((o) => inPeriod(o.createdAt, period, now))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, period]);
  const visible = filtered.slice(0, 10);

  const typeChip = (t: RecentOrdersProps['orders'][number]['type']) => {
    if (t === 'delivery') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (t === 'dinein') return 'bg-primary/10 text-primary border-primary/20';
    if (t === 'takeaway') return 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  const statusChip = (s: RecentOrdersProps['orders'][number]['status']) => {
    if (s === 'completed') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (s === 'cancelled') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (s === 'ready') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (s === 'preparing') return 'bg-primary/10 text-primary border-primary/20';
    return 'bg-muted/40 text-muted-foreground border-border/50';
  };

  return (
    <motion.div
      {...fadeUp(0.66)}
      className={cn('glass-card overflow-hidden border border-border/50', targetHeight && 'flex flex-col')}
      style={targetHeight ? { height: targetHeight } : undefined}
    >
      <div className="px-4 sm:px-5 lg:px-6 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <h3 className={cn(dashboardTypography.heading, "text-base sm:text-lg")}>Recent Orders</h3>
            <span className="text-[10px] px-2.5 py-1 rounded-full border border-border/50 bg-muted/10 text-muted-foreground font-bold tracking-wider tabular-nums">
              {Math.min(10, filtered.length)}
            </span>
          </div>
          <p className={cn(dashboardTypography.subheading, "mt-1 text-xs sm:text-sm")}>Most recent activity across all channels</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          <TimePeriodSelect value={period} onChange={setPeriod} className="w-full sm:w-[132px]" />
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <Link to="/orders" className={cn('w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold border transition-colors text-center', 'bg-muted/10 text-muted-foreground border-border/50 hover:bg-muted/20 hover:text-foreground')}>
              Orders
            </Link>
            <Link to="/kitchen-kds" className={cn('w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold border transition-colors text-center', 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15')}>
              Kitchen <ArrowRight className="h-4 w-4 inline-block ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">
          No orders in this period.
        </div>
      ) : (
        <div className={cn(bodyClassName, 'scrollbar-hide overflow-x-hidden')}>
          <div className="hidden lg:grid grid-cols-[140px_170px_150px_180px_150px] gap-3 px-5 lg:pl-6 lg:pr-10 py-3 bg-muted/20 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            <span className="flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Order</span>
            <span className="flex items-center gap-2"><User2 className="h-3.5 w-3.5" /> Customer</span>
            <span className="flex items-center gap-2"><UtensilsCrossed className="h-3.5 w-3.5" /> Type</span>
            <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Status</span>
            <span className="flex items-center gap-2 justify-end pr-4"><CreditCard className="h-3.5 w-3.5" /> Total</span>
          </div>

          {visible.map((order) => {
            const customer =
              order.customerName
              || (order.tableId ? `Table ${order.tableId}` : 'Walk-in');
            const itemsCount = order.items.reduce((s, it) => s + (it.qty || 0), 0);
            return (
              <div
                key={order.id}
                className="px-5 lg:pl-6 lg:pr-10 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/15 transition-colors"
              >
                <div className="lg:hidden">
                  <div className="rounded-2xl border border-border/50 bg-muted/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{shortId(order.id)}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">{customer}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{currencyFormatter.format(order.total)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={cn('text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-widest', statusChip(order.status))}>{order.status}</span>
                      <span className={cn('text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-widest', typeChip(order.type))}>{order.type}</span>
                      <span className="text-[10px] px-2.5 py-1 rounded-full border border-border/50 bg-muted/10 text-muted-foreground font-bold tracking-widest tabular-nums">
                        {itemsCount} items
                      </span>
                      <span className="text-[10px] px-2.5 py-1 rounded-full border border-border/50 bg-muted/10 text-muted-foreground font-bold tracking-widest">
                        {timeSince(order.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2 flex items-center justify-between gap-2">
                        <span className="font-bold tracking-widest uppercase text-[10px]">Time</span>
                        <span className="tabular-nums text-foreground/80">
                          {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2 flex items-center justify-between gap-2">
                        <span className="font-bold tracking-widest uppercase text-[10px]">Date</span>
                        <span className="tabular-nums text-foreground/80">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-[140px_170px_150px_180px_150px] gap-3 items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium tabular-nums">{shortId(order.id)}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{timeSince(order.createdAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{customer}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {itemsCount} items{order.customerPhone ? ` • ${order.customerPhone}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-widest', typeChip(order.type))}>{order.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-widest', statusChip(order.status))}>{order.status}</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full border border-border/50 bg-muted/10 text-muted-foreground font-bold tracking-widest tabular-nums">
                      {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-right pr-4">
                    <p className="text-sm font-medium tabular-nums">{currencyFormatter.format(order.total)}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" /> {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
