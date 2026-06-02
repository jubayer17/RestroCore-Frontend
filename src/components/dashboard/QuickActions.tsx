import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, UserCheck, Receipt, Heart, ArrowRight, CalendarDays, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardTypography } from '@/lib/typography';

export const QuickActions: React.FC = () => {
  const actions = [
    { label: 'Add Menu Item', desc: 'Update menu', icon: Utensils, link: '/menu-builder', tone: 'bg-primary/10 text-primary border-primary/20' },
    { label: 'Add Staff', desc: 'Hire & roles', icon: UserCheck, link: '/staff', tone: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { label: 'Orders', desc: 'Receipts & history', icon: Receipt, link: '/orders', tone: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20' },
    { label: 'Settings', desc: 'Customize', icon: Heart, link: '/settings', tone: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { label: 'Reservations', desc: 'Manage tables', icon: CalendarDays, link: '/reservations', tone: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { label: 'Inventory', desc: 'Restock items', icon: Package, link: '/inventory', tone: 'bg-destructive/10 text-destructive border-destructive/20' },
  ];

  return (
    <div className="glass-card p-5 lg:p-6 border border-border/50">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={cn(dashboardTypography.heading)}>Quick Actions</h3>
        <Link to="/settings" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          Customize <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.link}
            className="rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors p-4 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={cn('h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105', action.tone)}>
                <action.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium leading-tight">{action.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
