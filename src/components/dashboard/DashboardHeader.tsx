import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Zap } from 'lucide-react';
import { dashboardTypography } from '@/lib/typography';

export const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <p className={dashboardTypography.body}>Welcome back, Maria 👋</p>
        <h1 className={dashboardTypography.title}>Dashboard</h1>
      </div>
      <div className="flex gap-2">
        <Link to="/reservations" className="flex items-center gap-2 border border-border bg-background text-foreground px-4 py-2.5 rounded-xl text-sm hover:bg-muted/50 transition-colors shadow-sm">
          <CalendarDays className="h-4 w-4" /> <span className={dashboardTypography.button}>Book Table</span>
        </Link>
        <Link to="/point-of-sale" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm">
          <Zap className="h-4 w-4" /> <span className={dashboardTypography.button}>New Order</span>
        </Link>
      </div>
    </div>
  );
};
