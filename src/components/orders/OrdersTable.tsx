import React from 'react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderStatus, OrderType, Table as TableType, User, Driver } from "@/types/restaurant";
import { Hash, User as UserIcon, Utensils, ShoppingBag, Truck, CreditCard, Clock, Flame, CheckCircle2, Package, XCircle, Bot } from 'lucide-react';
import { getOrderNumber } from '@/lib/orderNumber';

interface OrdersTableProps {
  filtered: Order[];
  tableById: Map<string, TableType>;
  userById: Map<string, User>;
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

export const OrdersTable: React.FC<OrdersTableProps> = ({
  filtered, tableById, userById, driverById, currencyFormatter, onSelectOrder
}) => {
  return (
    <div className="hidden lg:block rounded-none border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap min-w-[120px]"><div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-muted-foreground" /><span>Order</span></div></TableHead>
            <TableHead className="min-w-[180px]"><div className="flex items-center gap-2"><UserIcon className="h-3.5 w-3.5 text-muted-foreground" /><span>Customer</span></div></TableHead>
            <TableHead className="whitespace-nowrap min-w-[120px]"><div className="flex items-center gap-2"><Utensils className="h-3.5 w-3.5 text-muted-foreground" /><span>Type</span></div></TableHead>
            <TableHead className="whitespace-nowrap min-w-[140px]"><div className="flex items-center gap-2"><Bot className="h-3.5 w-3.5 text-muted-foreground" /><span>Context</span></div></TableHead>
            <TableHead className="whitespace-nowrap min-w-[160px]"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span>Created</span></div></TableHead>
            <TableHead className="whitespace-nowrap min-w-[100px]"><div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-muted-foreground" /><span>Total</span></div></TableHead>
            <TableHead className="whitespace-nowrap min-w-[120px]"><div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" /><span>Status</span></div></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.slice(0, 60).map((o) => {
            const tableLabel = o.tableId ? tableById.get(o.tableId)?.label : undefined;
            const staffName = o.assignedTo ? userById.get(o.assignedTo)?.name : undefined;
            const driverName = o.driverId ? driverById.get(o.driverId)?.name : undefined;
            const status = statusConfig[o.status];
            const type = typeConfig[o.type];
            const ms = Date.parse(o.createdAt);
            const orderDate = Number.isFinite(ms) ? ms : 0;

            return (
              <TableRow
                key={o.id}
                role="button"
                tabIndex={0}
                aria-label={`Open order #${getOrderNumber(o.id)} details`}
                onClick={() => onSelectOrder(o.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOrder(o.id);
                  }
                }}
                className="hover:bg-muted/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <TableCell className="font-medium">#{getOrderNumber(o.id)}</TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="text-sm truncate font-medium">{o.customerName || "Walk-in"}</p>
                    <p className="text-xs text-muted-foreground truncate">{o.customerPhone || "—"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{type.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{tableLabel ? `Table ${tableLabel}` : driverName ? `Driver ${driverName}` : "—"}</p>
                  <p className="text-xs text-muted-foreground">{staffName ? `Staff ${staffName}` : ""}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(orderDate), "PP p")}
                </TableCell>
                <TableCell className="font-medium pl-4">{currencyFormatter.format(o.total)}</TableCell>
                <TableCell>
                  <div className={cn("flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-none w-fit", status.bg, status.color)}>
                    <status.icon className="h-3 w-3" />
                    <span>{status.label}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
