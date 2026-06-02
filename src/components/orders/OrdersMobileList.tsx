import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderStatus, OrderType, Table as TableType, Driver } from "@/types/restaurant";
import { Hash, User as UserIcon, Utensils, ShoppingBag, Truck, CreditCard, Clock, Flame, CheckCircle2, Package, XCircle, Bot } from 'lucide-react';
import { getOrderNumber } from '@/lib/orderNumber';

interface OrdersMobileListProps {
  filtered: Order[];
  tableById: Map<string, TableType>;
  driverById: Map<string, Driver>;
  currencyFormatter: Intl.NumberFormat;
  onSelectOrder: (id: string) => void;
}

const statusConfig: Record<OrderStatus, { icon: React.ElementType, label: string, color: string, bg: string }> = {
  pending: { icon: Clock, label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  confirmed: { icon: Clock, label: 'Confirmed', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  preparing: { icon: Flame, label: 'Preparing', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ready: { icon: CheckCircle2, label: 'Ready', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  served: { icon: CheckCircle2, label: 'Served', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  completed: { icon: Package, label: 'Fulfilled', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10' },
};

const typeConfig: Record<OrderType, { icon: React.ElementType, label: string }> = {
  dinein: { icon: Utensils, label: 'Dine-in' },
  takeaway: { icon: ShoppingBag, label: 'Takeaway' },
  delivery: { icon: Truck, label: 'Delivery' },
  pickup: { icon: ShoppingBag, label: 'Pickup' },
};

export const OrdersMobileList: React.FC<OrdersMobileListProps> = ({
  filtered, tableById, driverById, currencyFormatter, onSelectOrder
}) => {
  return (
    <div className="lg:hidden space-y-3">
      {filtered.slice(0, 60).map((o) => {
        const tableLabel = o.tableId ? tableById.get(o.tableId)?.label : undefined;
        const driverName = o.driverId ? driverById.get(o.driverId)?.name : undefined;
        const status = statusConfig[o.status];
        const type = typeConfig[o.type];
        return (
          <button
            key={o.id}
            type="button"
            aria-label={`Open order #${getOrderNumber(o.id)} details`}
            onClick={() => onSelectOrder(o.id)}
            className="w-full text-left rounded-none border bg-card shadow-sm p-4 transition-all hover:shadow-md hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{o.customerName || "Walk-in"}</p>
                <p className="text-xs text-muted-foreground truncate">#{getOrderNumber(o.id)}</p>
              </div>
              <div className={cn("flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-none w-fit shrink-0", status.bg, status.color)}>
                <status.icon className="h-3 w-3" />
                <span>{status.label}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <type.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{type.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">{currencyFormatter.format(o.total)}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{tableLabel ? `Table ${tableLabel}` : driverName ? `Driver ${driverName}` : "—"}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
