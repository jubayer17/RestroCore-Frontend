import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, CalendarDays, ChefHat,
  Truck, UtensilsCrossed, Users,
  Package, X, Sparkles, UserCircle, Settings, Receipt, BarChart2
} from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onNavClick?: () => void;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/point-of-sale', icon: ShoppingCart, label: 'Point of Sale' },
      { to: '/orders', icon: Receipt, label: 'Orders' },
      { to: '/floor-plan', icon: Grid3X3, label: 'Floor Plan' },
      { to: '/kitchen-kds', icon: ChefHat, label: 'Kitchen (KDS)' },
      { to: '/delivery', icon: Truck, label: 'Delivery' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/reservations', icon: CalendarDays, label: 'Reservations' },
      { to: '/menu-builder', icon: UtensilsCrossed, label: 'Menu Builder' },
      { to: '/inventory', icon: Package, label: 'Inventory' },
      { to: '/customers', icon: UserCircle, label: 'Customers' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/staff', icon: Users, label: 'Staff' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function AppSidebar({ onNavClick }: AppSidebarProps) {
  const location = useLocation();
  const { orders, settings } = useRestaurantStore();
  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length;

  return (
    <aside className="w-[260px] h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gold-gradient flex items-center justify-center shadow-md overflow-hidden border border-white/10">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={`${settings.restaurantName} logo`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=200';
                }}
              />
            ) : (
              <Sparkles className="h-4 w-4 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-base text-sidebar-foreground tracking-tight leading-none">
              {settings.restaurantName}
            </h1>
            <p className="text-[9px] text-sidebar-foreground/40 mt-0.5 tracking-[0.2em] uppercase">Premium</p>
          </div>
        </div>
        <button onClick={onNavClick} className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation - scrollable with hidden scrollbar */}
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/30">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = location.pathname === item.to;
                const showBadge = item.to === '/point-of-sale' && activeOrders > 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20'
                        : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground rounded-full px-1">
                        {activeOrders}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-8 w-8 rounded-xl gold-gradient flex items-center justify-center text-[11px] text-white shadow-sm">
            MS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-sidebar-foreground truncate">Maria Santos</p>
            <p className="text-[9px] text-sidebar-foreground/35 ">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
