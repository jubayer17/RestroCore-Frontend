import { useState, useEffect } from 'react';
import { Bell, X, ShoppingCart, AlertTriangle, ChefHat, CheckCircle2 } from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'kitchen' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationBell() {
  const { orders, inventory } = useRestaurantStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const notifs: Notification[] = [];

    // Active order alerts
    const pendingOrders = orders.filter(o => o.status === 'pending');
    pendingOrders.slice(0, 2).forEach(o => {
      notifs.push({
        id: `order-${o.id}`,
        type: 'order',
        title: 'New Order',
        message: `${o.id} — ${o.items.length} items ($${o.total.toFixed(2)})`,
        time: new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      });
    });

    // Low stock alerts
    const lowStock = inventory.filter(i => i.qtyOnHand <= i.reorderPoint);
    lowStock.slice(0, 3).forEach(item => {
      notifs.push({
        id: `stock-${item.id}`,
        type: 'stock',
        title: 'Low Stock Alert',
        message: `${item.name}: ${item.qtyOnHand} ${item.unit} remaining`,
        time: 'Now',
        read: false,
      });
    });

    // Kitchen backlog
    const preparing = orders.filter(o => o.status === 'preparing');
    if (preparing.length > 3) {
      notifs.push({
        id: 'kitchen-backlog',
        type: 'kitchen',
        title: 'Kitchen Backlog',
        message: `${preparing.length} orders in preparation queue`,
        time: 'Now',
        read: false,
      });
    }

    // Completed orders
    const completed = orders.filter(o => o.status === 'completed').slice(0, 1);
    completed.forEach(o => {
      notifs.push({
        id: `done-${o.id}`,
        type: 'success',
        title: 'Order Completed',
        message: `${o.id} has been fulfilled`,
        time: new Date(o.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: true,
      });
    });

    setNotifications(notifs);
  }, [orders, inventory]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const iconMap = {
    order: ShoppingCart,
    stock: AlertTriangle,
    kitchen: ChefHat,
    success: CheckCircle2,
  };

  const colorMap = {
    order: 'text-primary bg-primary/10',
    stock: 'text-destructive bg-destructive/10',
    kitchen: 'text-warning bg-warning/10',
    success: 'text-fresh bg-fresh/10',
  };

  return (
  <div className="relative">
      <button
        onClick={() => setOpen(!open)}
    className="relative h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
      >
    <Bell className="h-4 w-4 text-foreground/70" />
        {unreadCount > 0 && (
     <span className="absolute -top-1 -right-1 h-4.5 w-4.5 min-w-[18px] flex items-center justify-center text-[9px] bg-destructive text-destructive-foreground rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
       className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
       className="absolute right-0 top-12 z-50 w-[min(340px,90vw)] glass-card rounded-2xl overflow-hidden"
            >
       <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="text-sm ">Notifications</h3>
                {unreadCount > 0 && (
         <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

       <div className="max-h-[360px] overflow-y-auto divide-y divide-border/30">
                {notifications.length === 0 ? (
         <div className="p-8 text-center text-muted-foreground">
          <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
          <p className="text-xs ">All caught up!</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const Icon = iconMap[notif.type];
                    return (
                      <div
                        key={notif.id}
            className={cn(
                          'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
                          !notif.read && 'bg-primary/[0.03]'
                        )}
                      >
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', colorMap[notif.type])}>
             <Icon className="h-3.5 w-3.5" />
                        </div>
            <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
              <p className="text-[12px] ">{notif.title}</p>
              {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
             <p className="text-[11px] text-muted-foreground mt-0.5">{notif.message}</p>
             <p className="text-[9px] text-muted-foreground/60 mt-1 ">{notif.time}</p>
                        </div>
            <button onClick={() => dismiss(notif.id)} className="text-muted-foreground/40 hover:text-foreground mt-0.5">
             <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
