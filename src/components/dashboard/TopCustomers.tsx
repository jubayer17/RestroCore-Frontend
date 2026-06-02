import React, { useMemo, useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardTypography } from '@/lib/typography';
import { Link } from 'react-router-dom';
import type { Order } from '@/types/restaurant';
import { TimePeriodSelect } from './TimePeriodSelect';
import { inPeriod, type TimePeriod } from './time-period';

interface CustomerData {
  name: string;
  total: number;
  orders: number;
}

interface TopCustomersProps {
  completedOrders: Order[];
  currencyFormatter: Intl.NumberFormat;
}

export const TopCustomers: React.FC<TopCustomersProps> = ({
  completedOrders,
  currencyFormatter,
}) => {
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const topCustomers = useMemo((): CustomerData[] => {
    const now = new Date();
    const filtered = completedOrders.filter((o) => inPeriod(o.createdAt, period, now));
    const byName = new Map<string, CustomerData>();
    filtered.forEach((o) => {
      const name = o.customerName?.trim() || 'Walk-in';
      const prev = byName.get(name) || { name, total: 0, orders: 0 };
      prev.total += Number.isFinite(o.total) ? o.total : 0;
      prev.orders += 1;
      byName.set(name, prev);
    });
    return Array.from(byName.values()).sort((a, b) => b.total - a.total);
  }, [completedOrders, period]);

  const DUMMY_CUSTOMERS: CustomerData[] = [
    { name: 'Sophie Hartwell',  total: 1840, orders: 12 },
    { name: 'James Okafor',     total: 1430, orders: 9  },
    { name: 'Mei Lin Chen',     total: 1190, orders: 8  },
    { name: 'Rafael Moreno',    total:  870, orders: 6  },
    { name: 'Aisha Nkemdirim', total:  610, orders: 5  },
  ];

  const isDummy = topCustomers.length === 0;
  const displayCustomers = isDummy ? DUMMY_CUSTOMERS : topCustomers;
  const max = Math.max(...displayCustomers.map((c) => c.total), 0);

  return (
    <div className="glass-card p-5 lg:p-6 border border-border/50">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={cn(dashboardTypography.heading, "flex items-center gap-2")}>
          <Users className="h-5 w-5 text-blue-500" /> Top Customers
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <TimePeriodSelect value={period} onChange={setPeriod} className="w-[132px]" />
          <Link to="/customers" className={cn('text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1')}>
            View <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {isDummy && (
        <p className="text-[10px] text-muted-foreground/50 mb-2 italic">Sample data — no completed orders yet</p>
      )}
        <div className="space-y-3">
          {displayCustomers.slice(0, 5).map((customer, i) => {
            const pct = max > 0 ? Math.round((customer.total / max) * 100) : 0;
            const avatarTone =
              i === 0 ? 'bg-primary/10 text-primary border-primary/20'
                : i === 1 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : i === 2 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-muted/40 text-muted-foreground border-border/50';
            return (
              <div key={customer.name} className="rounded-2xl border border-border/50 bg-muted/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn('h-10 w-10 rounded-2xl border flex items-center justify-center text-sm font-bold shrink-0', avatarTone)}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{customer.name}</p>
                      <p className={cn(dashboardTypography.chartLabel, "mt-0.5 tabular-nums")}>
                        {customer.orders} orders • Avg {currencyFormatter.format(customer.total / Math.max(1, customer.orders))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{currencyFormatter.format(customer.total)}</p>
                    <p className="text-[11px] text-muted-foreground font-bold tabular-nums">{pct}%</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
};
