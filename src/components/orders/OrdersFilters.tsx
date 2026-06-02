import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Clock, Flame, CheckCircle2, Package, XCircle, Utensils, ShoppingBag, Truck, Tag, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "./DateRangeFilter";
import type { OrdersStatusFilter, OrdersTypeFilter, SortKey, SortDir } from "./orders-types";
import { cn } from '@/lib/utils';

interface OrdersFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: OrdersStatusFilter;
  setStatusFilter: (v: OrdersStatusFilter) => void;
  typeFilter: OrdersTypeFilter;
  setTypeFilter: (v: OrdersTypeFilter) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
  sortDir: SortDir;
  setSortDir: (v: SortDir | ((prev: SortDir) => SortDir)) => void;
  dateStart: Date | null;
  dateEnd: Date | null;
  applyDateRange: (start: Date | null, end: Date | null) => void;
}

const statusIcons: { status: OrdersStatusFilter; icon: React.ElementType; label: string; color: string; bg: string }[] = [
  { status: 'pending', icon: Clock, label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { status: 'preparing', icon: Flame, label: 'Preparing', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { status: 'ready', icon: CheckCircle2, label: 'Ready', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { status: 'completed', icon: Package, label: 'Fulfilled', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { status: 'cancelled', icon: XCircle, label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10' },
];

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  search, setSearch, statusFilter, setStatusFilter, typeFilter, setTypeFilter,
  sortKey, setSortKey, sortDir, setSortDir, dateStart, dateEnd, applyDateRange
}) => {
  const handleStatusClick = (s: OrdersStatusFilter) => {
    setStatusFilter(prev => prev === s ? 'all' : s);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full flex-1 min-w-[200px]">
          <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, customer, table, staff…"
            className="pl-10 h-10 w-full bg-muted/40 border-border/50"
          />
        </div>
        <div className="w-full sm:w-[160px] shrink-0">
          <Select value={typeFilter} onValueChange={(v: OrdersTypeFilter) => setTypeFilter(v)}>
            <SelectTrigger className="h-10 bg-muted/40 border-border/50">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="dinein">Dine-in</SelectItem>
              <SelectItem value="takeaway">Takeaway</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <DateRangeFilter start={dateStart} end={dateEnd} onApply={applyDateRange} />
        </div>
      </div>

      <div className="lg:hidden">
        <Select value={statusFilter} onValueChange={(v: OrdersStatusFilter) => setStatusFilter(v)}>
          <SelectTrigger className="h-10 bg-muted/40 border-border/50 w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusIcons.map((s) => (
              <SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden lg:flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {statusIcons.map(s => (
          <button
            key={s.status}
            onClick={() => handleStatusClick(s.status)}
            title={s.label}
            className={cn(
              'px-4 py-2.5 rounded-none text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 border',
              s.bg,
              s.color,
              statusFilter === s.status
                ? 'shadow-sm'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
