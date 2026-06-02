import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Truck, CalendarDays, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetPrefs, fadeUp } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';

interface OperationalCardsProps {
  widgetPrefs: WidgetPrefs;
  kitchenBacklog: number;
  deliveryActive: number;
  upcomingBookingsCount: number;
  lowStockItemsCount: number;
}

export const OperationalCards: React.FC<OperationalCardsProps> = ({
  widgetPrefs,
  kitchenBacklog,
  deliveryActive,
  upcomingBookingsCount,
  lowStockItemsCount,
}) => {
  if (widgetPrefs.hidden.includes('operations')) return null;

  const cards = [
    { label: 'Kitchen Queue', value: kitchenBacklog, icon: ChefHat, link: '/kitchen-kds', color: 'text-orange-500', bg: 'bg-orange-500/10', alert: kitchenBacklog > 3 },
    { label: 'Deliveries', value: deliveryActive, icon: Truck, link: '/delivery', color: 'text-blue-500', bg: 'bg-blue-500/10', alert: false },
    { label: 'Reservations', value: upcomingBookingsCount, icon: CalendarDays, link: '/reservations', color: 'text-purple-500', bg: 'bg-purple-500/10', alert: false },
    { label: 'Low Stock', value: lowStockItemsCount, icon: AlertTriangle, link: '/inventory', color: 'text-red-500', bg: 'bg-red-500/10', alert: lowStockItemsCount > 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div key={card.label} {...fadeUp(0.3 + i * 0.05)}>
          <Link to={card.link} className={cn('glass-card flex items-center gap-4 p-4 sm:p-5 border border-border/50 group transition-all hover:shadow-md', card.alert && 'border-red-200 bg-red-50/50')}>
            <div className={cn('h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 border border-border shadow-sm', card.bg)}>
              <card.icon className={cn('h-5 w-5', card.color)} />
            </div>
            <div className="min-w-0">
              <p className={cn(dashboardTypography.metricValue, "leading-tight truncate")}>{card.value}</p>
              <p className={cn(dashboardTypography.metricLabel, "mt-0.5 truncate uppercase tracking-wider font-medium")}>{card.label}</p>
            </div>
            {card.alert && <span className="ml-auto h-2 w-2 rounded-none bg-red-500 animate-pulse" />}
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
