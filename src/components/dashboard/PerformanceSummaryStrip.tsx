import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Activity, Percent, Receipt, UserCheck, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';

interface PerformanceSummaryStripProps {
  totalItemsSold: number;
  fulfillmentRate: number;
  totalDiscount: number;
  totalTax: number;
  activeStaffCount: number;
  availableDriversCount: number;
}

export const PerformanceSummaryStrip: React.FC<PerformanceSummaryStripProps> = ({
  totalItemsSold,
  fulfillmentRate,
  totalDiscount,
  totalTax,
  activeStaffCount,
  availableDriversCount,
}) => {
  const metrics = [
    { label: 'Items Sold', value: totalItemsSold.toString(), icon: Utensils, color: 'text-primary' },
    { label: 'Fulfillment', value: `${fulfillmentRate}%`, icon: Activity, color: 'text-emerald-500' },
    { label: 'Discounts', value: `$${totalDiscount.toFixed(0)}`, icon: Percent, color: 'text-orange-500' },
    { label: 'Tax Collected', value: `$${totalTax.toFixed(0)}`, icon: Receipt, color: 'text-blue-500' },
    { label: 'Staff On Duty', value: activeStaffCount.toString(), icon: UserCheck, color: 'text-purple-500' },
    { label: 'Drivers Ready', value: availableDriversCount.toString(), icon: Truck, color: 'text-emerald-500' },
  ];

  return (
    <motion.div {...fadeUp(0.37)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="glass-card p-4 lg:p-5 flex items-center gap-4 border border-border/50">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border">
            <metric.icon className={cn('h-5 w-5', metric.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-medium lg:text-2xl font-medium leading-tight truncate">{metric.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium truncate">{metric.label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
};
