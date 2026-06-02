import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardTypography } from '@/lib/typography';

interface Driver {
  status: 'available' | 'busy' | 'offline';
}

interface DriversStatusProps {
  availableDrivers: number;
  drivers: Driver[];
}

export const DriversStatus: React.FC<DriversStatusProps> = ({
  availableDrivers,
  drivers,
}) => {
  const busy = drivers.filter(d => d.status === 'busy').length;
  const offline = drivers.filter(d => d.status === 'offline').length;
  const total = Math.max(1, drivers.length);
  const pctAvail = Math.round((availableDrivers / total) * 100);
  const pctBusy = Math.round((busy / total) * 100);
  const pctOff = Math.max(0, 100 - pctAvail - pctBusy);

  return (
    <div className="glass-card p-5 lg:p-6 border border-border/50">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={cn(dashboardTypography.heading, "flex items-center gap-2")}>
          <Truck className="h-5 w-5 text-emerald-500" /> Drivers Status
        </h3>
        <Link to="/delivery" className={cn('text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1')}>
          Manage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="h-2 rounded-full overflow-hidden bg-muted/40 border border-border/50 flex">
        <div className="h-full bg-emerald-500" style={{ width: `${pctAvail}%` }} />
        <div className="h-full bg-primary" style={{ width: `${pctBusy}%` }} />
        <div className="h-full bg-destructive" style={{ width: `${pctOff}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <p className={cn(dashboardTypography.metricValue, "text-emerald-600 dark:text-emerald-400 tabular-nums")}>{availableDrivers}</p>
          <p className={dashboardTypography.metricLabel}>Available</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-primary/10 border border-primary/20">
          <p className={cn(dashboardTypography.metricValue, "text-primary tabular-nums")}>{busy}</p>
          <p className={dashboardTypography.metricLabel}>Busy</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
          <p className={cn(dashboardTypography.metricValue, "text-destructive tabular-nums")}>{offline}</p>
          <p className={dashboardTypography.metricLabel}>Offline</p>
        </div>
      </div>
    </div>
  );
};
