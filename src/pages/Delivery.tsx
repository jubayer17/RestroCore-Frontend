import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Truck, Phone, User, Package, MapPin, Search, Clock, CheckCircle2, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const orderStatusFlow = [
  { status: 'pending', label: 'Placed', icon: Clock },
  { status: 'preparing', label: 'Cooking', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'completed', label: 'Delivered', icon: CheckCircle2 },
];

export default function Delivery() {
  const { orders, drivers, assignDriver, updateDriverStatus, updateOrderStatus } = useRestaurantStore();
  const deliveryOrders = orders.filter((o) => o.type === 'delivery');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'active' | 'completed' | 'all'>('active');

  const driverStatusStyle: Record<string, { bg: string; text: string; dot: string }> = {
    available: { bg: 'bg-fresh/12', text: 'text-fresh', dot: 'bg-fresh' },
    busy: { bg: 'bg-warning/12', text: 'text-warning', dot: 'bg-warning' },
    offline: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  };

  const handleAssignDriver = (orderId: string, driverId: string) => {
    assignDriver(orderId, driverId);
    const driver = drivers.find(d => d.id === driverId);
    toast.success(`${driver?.name} assigned to order`);
  };

  const handleMarkDelivered = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.driverId) updateDriverStatus(order.driverId, 'available');
    updateOrderStatus(orderId, 'completed');
    toast.success('Order marked as delivered!');
  };

  const availableDrivers = drivers.filter(d => d.status === 'available');

  const filteredOrders = useMemo(() => {
    let result = deliveryOrders;
    if (statusTab === 'active') result = result.filter(o => !['completed', 'cancelled'].includes(o.status));
    if (statusTab === 'completed') result = result.filter(o => o.status === 'completed');
    if (search) result = result.filter(o =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone?.includes(search)
    );
    return result;
  }, [deliveryOrders, statusTab, search]);

  const activeCount = deliveryOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
  const completedCount = deliveryOrders.filter(o => o.status === 'completed').length;
  const avgDeliveryValue = deliveryOrders.length > 0 ? deliveryOrders.reduce((s, o) => s + o.total, 0) / deliveryOrders.length : 0;

  const getStatusStep = (status: string) => {
    const idx = orderStatusFlow.findIndex(s => s.status === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
          <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-medium font-display ">Delivery Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{deliveryOrders.length} total orders · {availableDrivers.length} drivers available</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Active Deliveries', value: activeCount, icon: Package, iconBg: 'bg-primary/10', iconColor: 'text-primary', border: 'border-primary/20' },
          { label: 'Drivers Available', value: availableDrivers.length, icon: User, iconBg: 'bg-fresh/12', iconColor: 'text-fresh', border: 'border-fresh/20' },
          { label: 'Completed Today', value: completedCount, icon: CheckCircle2, iconBg: 'bg-accent/12', iconColor: 'text-accent', border: 'border-accent/20' },
          { label: 'Avg Order Value', value: `$${avgDeliveryValue.toFixed(0)}`, icon: MapPin, iconBg: 'bg-secondary/12', iconColor: 'text-secondary', border: 'border-secondary/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('glass-card p-4 sm:p-5 flex items-center gap-4 border', stat.border)}>
            <div className={cn('h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-border flex items-center justify-center shrink-0 shadow-sm', stat.iconBg)}>
              <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-medium sm:text-3xl font-medium leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Drivers Panel */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Driver Roster
          </h2>
          <div className="space-y-2">
            {drivers.map((d, i) => {
              const style = driverStatusStyle[d.status];
              return (
                <motion.div key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center gap-3">
                  <div className={cn('h-11 w-11 rounded-xl border border-border flex items-center justify-center text-sm shadow-sm',
                    d.status === 'available' ? 'bg-fresh/12 text-fresh' : d.status === 'busy' ? 'bg-warning/12 text-warning' : 'bg-muted text-muted-foreground')}>
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className=" text-sm lg:text-base truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {d.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn('text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full capitalize flex items-center gap-1.5', style.bg, style.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
                      {d.status}
                    </span>
                    <button
                      onClick={() => {
                        const newStatus = d.status === 'offline' ? 'available' : d.status === 'available' ? 'offline' : 'available';
                        updateDriverStatus(d.id, newStatus);
                        toast.info(`${d.name} is now ${newStatus}`);
                      }}
                      className="text-[10px] sm:text-xs px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted transition-colors"
                    >
                      {d.status === 'offline' ? 'Go Online' : d.status === 'available' ? 'Go Offline' : 'Free Up'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Orders Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Delivery Orders
            </h2>
            <div className="flex gap-1.5 sm:ml-auto">
              {(['active', 'completed', 'all'] as const).map(tab => (
                <button key={tab} onClick={() => setStatusTab(tab)}
                  className={cn('px-3.5 py-2 rounded-xl text-xs transition-all capitalize',
                    statusTab === tab ? 'bg-primary text-primary-foreground shadow-md' : 'glass-card')}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders, customers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 transition-shadow" />
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground glass-card">
                <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
                  <Truck className="h-8 w-8 opacity-20" />
                </div>
                <p className=" text-base">No delivery orders</p>
                <p className="text-sm mt-1">Orders will appear here when placed</p>
              </div>
            ) : filteredOrders.map((order, i) => {
              const driver = drivers.find((d) => d.id === order.driverId);
              const isActive = !['completed', 'cancelled'].includes(order.status);
              const currentStep = getStatusStep(order.status);
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className=" text-base sm:text-lg">#{order.id.slice(-4)}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {order.customerName || 'Walk-in'} {order.customerPhone && `· ${order.customerPhone}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-xl text-primary">${order.total.toFixed(2)}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{order.items.length} items</p>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="flex items-center gap-1.5 mb-2 px-2">
                    {orderStatusFlow.map((step, idx) => (
                      <div key={step.status} className="flex items-center flex-1">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm',
                          idx <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          <step.icon className="h-3.5 w-3.5" />
                        </div>
                        {idx < orderStatusFlow.length - 1 && (
                          <div className={cn('h-1 flex-1 mx-1.5 rounded-full transition-all',
                            idx < currentStep ? 'bg-primary' : 'bg-muted')} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground mb-3 px-1">
                    {orderStatusFlow.map(s => <span key={s.status} className="text-center">{s.label}</span>)}
                  </div>

                  {driver && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 bg-muted/30 border border-border px-4 py-2.5 rounded-xl">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px]">
                        {driver.name.charAt(0)}
                      </div>
                      <span className=" text-foreground">{driver.name}</span>
                      <Phone className="h-3 w-3 ml-auto" />
                      <span>{driver.phone}</span>
                    </div>
                  )}

                  {isActive && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                      {!order.driverId && availableDrivers.length > 0 && (
                        <select onChange={(e) => { if (e.target.value) handleAssignDriver(order.id, e.target.value); e.target.value = ''; }}
                          className="px-3 py-2 rounded-xl border border-border/50 bg-background text-xs focus:ring-2 focus:ring-primary/20" defaultValue="">
                          <option value="" disabled>Assign Driver...</option>
                          {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      )}
                      {order.status === 'ready' && order.driverId && (
                        <button onClick={() => handleMarkDelivered(order.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fresh text-fresh-foreground text-xs hover:opacity-90 transition-all premium-shadow">
                          <CheckCircle2 className="h-4 w-4" /> Mark Delivered
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
