import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, WidgetPrefs } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';
import type { Order } from '@/types/restaurant';
import { TimePeriodSelect } from './TimePeriodSelect';
import { inPeriod, type TimePeriod } from './time-period';

interface SalesSummaryProps {
  widgetPrefs: WidgetPrefs;
  completedOrders: Order[];
  currencyFormatter: Intl.NumberFormat;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({
  widgetPrefs,
  completedOrders,
  currencyFormatter,
}) => {
  const [period, setPeriod] = useState<TimePeriod>('weekly');

  const summary = useMemo(() => {
    const now = new Date();
    const orders = completedOrders.filter((o) => inPeriod(o.createdAt, period, now));
    const money = (n: number) => currencyFormatter.format(n);

    const subtotal = orders.reduce((s, o) => {
      const computed = o.items.reduce((x, it) => x + it.qty * it.price, 0);
      const v = Number.isFinite(o.subtotal) ? o.subtotal : computed;
      return s + v;
    }, 0);
    const tax = orders.reduce((s, o) => s + (Number.isFinite(o.tax) ? o.tax : 0), 0);
    const discounts = orders.reduce((s, o) => s + (Number.isFinite(o.discount) ? o.discount : 0), 0);
    const netSales = orders.reduce((s, o) => {
      const computedSubtotal = o.items.reduce((x, it) => x + it.qty * it.price, 0);
      const computedTotal = computedSubtotal + (Number.isFinite(o.tax) ? o.tax : 0) - (Number.isFinite(o.discount) ? o.discount : 0);
      const v = Number.isFinite(o.total) ? o.total : computedTotal;
      return s + v;
    }, 0);
    const grossSales = subtotal + tax;
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? netSales / totalOrders : 0;

    return {
      grossSales,
      discounts,
      tax,
      netSales,
      totalOrders,
      avgOrderValue,
      money,
    };
  }, [completedOrders, currencyFormatter, period]);

  if (widgetPrefs.hidden.includes('orderSummary')) return null;

  return (
    <motion.div {...fadeUp(0.45)} className="glass-card p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className={cn(dashboardTypography.heading, "flex items-center gap-2")}>
          <Receipt className="h-4 w-4 text-primary" /> Sales Summary
        </h3>
        <TimePeriodSelect value={period} onChange={setPeriod} className="w-[132px]" />
      </div>
      <div className="space-y-4">
        {[
          { label: 'Gross Sales', value: summary.money(summary.grossSales), bold: true },
          { label: 'Discounts', value: `-${summary.money(summary.discounts)}`, color: 'text-red-500' },
          { label: 'Tax', value: summary.money(summary.tax) },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className={dashboardTypography.subheading}>{row.label}</span>
            <span className={cn('text-sm lg:text-base font-medium', row.color, row.bold && 'text-foreground')}>{row.value}</span>
          </div>
        ))}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Net Sales</span>
            <span className={dashboardTypography.metricValue}>{summary.money(summary.netSales)}</span>
          </div>
        </div>
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={dashboardTypography.metricLabel}>Total Orders</span>
            <span className="text-sm font-semibold">{summary.totalOrders}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={dashboardTypography.metricLabel}>Avg Order Value</span>
            <span className="text-sm font-semibold">{summary.money(summary.avgOrderValue)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
