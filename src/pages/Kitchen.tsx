import { useRestaurantStore } from '@/store/useRestaurantStore';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { Clock, ChefHat, CheckCircle2, AlertTriangle, Bell, BellOff, Flame, ArrowUp, Filter, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { KDSStation, OrderStatus } from '@/types/restaurant';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const stations: { value: KDSStation | 'all'; label: string }[] = [
  { value: 'all', label: '🏪 All' },
  { value: 'grill', label: '🔥 Grill' },
  { value: 'fryer', label: '🍟 Fryer' },
  { value: 'salad', label: '🥗 Salad' },
  { value: 'drinks', label: '🥤 Drinks' },
  { value: 'dessert', label: '🍰 Dessert' },
  { value: 'general', label: '📦 General' },
];

const statusStyle: Record<string, string> = {
  pending: 'bg-primary/15 text-primary border-primary/30',
  preparing: 'bg-warning/15 text-warning border-warning/30',
  ready: 'bg-fresh/15 text-fresh border-fresh/30',
  served: 'bg-muted text-muted-foreground border-border',
};

const statusLabel: Record<string, string> = {
  pending: '⏳ Pending',
  preparing: '🔥 Cooking',
  ready: '✅ Ready',
  served: '🍽️ Served',
};

export default function Kitchen() {
  const { orders, updateOrderItemStatus, updateOrderStatus, menuItems } = useRestaurantStore();
  const [stationFilter, setStationFilter] = useState<KDSStation | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('time');
  const [, setTick] = useState(0);

  const menuItemById = useMemo(() => {
    const map: Record<string, (typeof menuItems)[number]> = {};
    menuItems.forEach((mi) => {
      map[mi.id] = mi;
    });
    return map;
  }, [menuItems]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleOrders = showCompleted ? orders : orders.filter((o) => !['completed', 'cancelled'].includes(o.status));

  const filteredOrders = visibleOrders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => stationFilter === 'all' || item.station === stationFilter),
    }))
    .filter((o) => o.items.length > 0)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const aPending = a.items.filter(i => i.status === 'pending').length;
        const bPending = b.items.filter(i => i.status === 'pending').length;
        if (aPending !== bPending) return bPending - aPending;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const nextItemStatus = (s: OrderStatus): OrderStatus => {
    const flow: Partial<Record<OrderStatus, OrderStatus>> = { pending: 'preparing', confirmed: 'preparing', preparing: 'ready', ready: 'served' };
    return flow[s] || s;
  };

  const handleItemClick = (orderId: string, itemId: string, currentStatus: OrderStatus) => {
    const next = nextItemStatus(currentStatus);
    if (next !== currentStatus) {
      updateOrderItemStatus(orderId, itemId, next);
      if (next === 'ready' && soundEnabled) {
        toast.success('Item ready!', { description: 'Ready for pickup' });
      }
    }
  };

  const handleCompleteOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'completed');
    toast.success('Order completed! 🎉');
  };

  const handleBumpAllReady = (orderId: string) => {
    const order = visibleOrders.find(o => o.id === orderId);
    if (!order) return;
    order.items.forEach(item => {
      if (item.status !== 'ready' && item.status !== 'served') {
        updateOrderItemStatus(orderId, item.id, 'ready');
      }
    });
    toast.success('All items bumped to ready');
  };

  const timeSince = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const totalPending = filteredOrders.reduce((s, o) => s + o.items.filter(i => i.status === 'pending').length, 0);
  const totalPreparing = filteredOrders.reduce((s, o) => s + o.items.filter(i => i.status === 'preparing').length, 0);
  const totalReady = filteredOrders.reduce((s, o) => s + o.items.filter(i => i.status === 'ready').length, 0);

  const orderStatusLabel: Partial<Record<OrderStatus, string>> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    served: 'Served',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const orderStatusStyle: Partial<Record<OrderStatus, string>> = {
    pending: 'bg-primary/10 text-primary border-primary/30',
    confirmed: 'bg-muted/30 text-foreground border-border/50',
    preparing: 'bg-warning/10 text-warning border-warning/30',
    ready: 'bg-fresh/10 text-fresh border-fresh/30',
    served: 'bg-muted/60 text-muted-foreground border-border/50',
    completed: 'bg-fresh/15 text-fresh border-fresh/30',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
              <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-medium font-display ">Kitchen Display</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Tap items to advance status</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSortBy(sortBy === 'time' ? 'priority' : 'time')}
            className={cn('flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs border transition-all',
              sortBy === 'priority' ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' : 'bg-card border-border/50 text-muted-foreground hover:bg-muted')}
          >
            {sortBy === 'priority' ? <Flame className="h-3.5 w-3.5" /> : <Filter className="h-3.5 w-3.5" />}
            {sortBy === 'priority' ? 'Priority' : 'By Time'}
          </button>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs border transition-all',
              showCompleted ? 'bg-muted/30 text-foreground border-border/50 shadow-sm' : 'bg-card border-border/50 text-muted-foreground hover:bg-muted'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {showCompleted ? 'Showing Completed' : 'Hide Completed'}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn('flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs border transition-all',
              soundEnabled ? 'bg-fresh/10 text-fresh border-fresh/30 shadow-sm' : 'bg-muted text-muted-foreground border-border/50')}
          >
            {soundEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-5 flex items-center gap-4 border border-primary/20">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 border border-border flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-medium sm:text-3xl font-medium leading-tight">{totalPending}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </div>
        </div>
        <div className="glass-card p-4 sm:p-5 flex items-center gap-4 border border-warning/20">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-warning/12 border border-border flex items-center justify-center shrink-0 shadow-sm">
            <Flame className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-medium sm:text-3xl font-medium leading-tight">{totalPreparing}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cooking</p>
          </div>
        </div>
        <div className="glass-card p-4 sm:p-5 flex items-center gap-4 border border-fresh/20">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-fresh/12 border border-border flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-fresh" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-medium sm:text-3xl font-medium leading-tight">{totalReady}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ready</p>
          </div>
        </div>
      </div>

      {/* Station Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {stations.map((s) => {
          const count = s.value === 'all'
            ? visibleOrders.reduce((sum, o) => sum + o.items.length, 0)
            : visibleOrders.reduce((sum, o) => sum + o.items.filter(i => i.station === s.value).length, 0);
          return (
            <button
              key={s.value}
              onClick={() => setStationFilter(s.value)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2',
                stationFilter === s.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'glass-card hover:bg-muted/30'
              )}
            >
              {s.label}
              <span className={cn('text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                stationFilter === s.value ? 'bg-white/20' : 'bg-muted text-muted-foreground')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KDS Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredOrders.map((order, idx) => {
          const allReady = order.items.every((i) => i.status === 'ready' || i.status === 'served');
          const allServed = order.items.every((i) => i.status === 'served');
          const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
          const isOverdue = elapsedMins > 20;
          const isUrgent = elapsedMins > 15 && !isOverdue;
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                'glass-card overflow-hidden',
                isOverdue && 'ring-2 ring-destructive/50 shadow-[0_0_20px_hsl(var(--destructive)/0.1)]',
                isUrgent && !isOverdue && 'ring-1 ring-warning/40'
              )}
            >
              {/* Card Header */}
              <div className={cn(
                'px-4 py-3 sm:py-3.5 flex items-center justify-between',
                isOverdue ? 'bg-destructive/10' : isUrgent ? 'bg-warning/10' : 'bg-muted/30'
              )}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className=" text-sm sm:text-base lg:text-lg">#{order.id.slice(-4)}</p>
                    {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
                    {isUrgent && !isOverdue && <ArrowUp className="h-3.5 w-3.5 text-warning" />}
                  </div>
                  <p className="text-[11px] sm:text-xs lg:text-sm text-muted-foreground capitalize mt-0.5">
                    {order.type}{order.tableId ? ` · ${order.tableId}` : ''} · {order.items.length} items
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'w-[180px] justify-between flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                          orderStatusStyle[order.status] || 'bg-muted/60 text-muted-foreground border-border/50'
                        )}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          {order.status === 'preparing' ? <Flame className="h-3.5 w-3.5 shrink-0" /> : null}
                          <span className="capitalize truncate">{orderStatusLabel[order.status] || order.status}</span>
                        </span>
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[180px]">
                      {(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'] as OrderStatus[]).map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onSelect={() => {
                            updateOrderStatus(order.id, s);
                            toast.success(`Order set to ${orderStatusLabel[s] || s}`);
                          }}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {s === 'preparing' ? <Flame className="h-4 w-4 shrink-0" /> : null}
                            <span className="capitalize truncate">{orderStatusLabel[s] || s}</span>
                          </span>
                          {order.status === s ? <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> : null}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className={cn(
                    'w-[180px] flex items-center justify-between gap-2 text-xs font-semibold px-3 py-1.5 rounded-full',
                    isOverdue ? 'bg-destructive/15 text-destructive' : isUrgent ? 'bg-warning/15 text-warning' : 'bg-muted/60 text-muted-foreground'
                  )}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Time
                    </span>
                    <span className="tabular-nums">{timeSince(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-border/30">
                {order.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(order.id, item.id, item.status)}
                    disabled={item.status === 'served'}
                    className={cn(
                      'w-full p-3 sm:p-4 text-left flex items-center gap-3 transition-all',
                      item.status === 'served' ? 'opacity-40' : 'hover:bg-muted/20 cursor-pointer active:bg-muted/40'
                    )}
                  >
                    {menuItemById[item.menuItemId]?.image ? (
                      <img
                        src={menuItemById[item.menuItemId]?.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 rounded-xl object-cover border border-border/50 bg-muted/30 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl border border-border/50 bg-muted/30 shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {item.name?.trim()?.[0] || '•'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm lg:text-base ">{item.qty}× {item.name}</p>
                      {item.notes && <p className="text-[11px] sm:text-xs text-muted-foreground italic mt-0.5">📝 {item.notes}</p>}
                    </div>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="p-3 border-t bg-muted/20 flex gap-2">
                {!allReady && !allServed && (
                  <button
                    onClick={() => handleBumpAllReady(order.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-warning/10 text-warning py-2.5 rounded-xl text-xs sm:text-sm hover:bg-warning/20 transition-colors"
                  >
                    <Zap className="h-4 w-4" /> Bump All Ready
                  </button>
                )}
                {(allReady || allServed) && (
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-fresh text-fresh-foreground py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity premium-shadow"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Complete Order
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <div className="h-20 w-20 mx-auto mb-5 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
              <ChefHat className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-lg sm:text-xl ">All caught up! 🎉</p>
            <p className="text-sm mt-1">No pending orders for this station.</p>
          </div>
        )}
      </div>
    </div>
  );
}
