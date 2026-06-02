import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import type { Order, OrderStatus } from "@/types/restaurant";
import type { OrdersStatusFilter, OrdersTypeFilter, SortKey, SortDir, OrdersSummary } from "./orders-types";

export function useOrders() {
  const { orders, tables, users, drivers, settings, updateOrderStatus } = useRestaurantStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrdersStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<OrdersTypeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState<Date | null>(null);
  const [dateEnd, setDateEnd] = useState<Date | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<OrderStatus | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<OrderStatus | null>(null);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setStatusUpdating(null);
    setOptimisticStatus(null);
  }, [selectedOrderId]);

  useEffect(() => {
    const parseYmd = (value: string | null): Date | null => {
      if (!value) return null;
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!m) return null;
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
      const dt = new Date(y, mo - 1, d);
      if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
      return dt;
    };

    const isSameYmd = (a: Date | null, b: Date | null): boolean => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    };

    const startParam = parseYmd(searchParams.get("start"));
    const endParam = parseYmd(searchParams.get("end")) ?? startParam;
    
    if (startParam && endParam && endParam.getTime() < startParam.getTime()) {
      const next = new URLSearchParams(searchParams);
      next.delete("start");
      next.delete("end");
      setSearchParams(next, { replace: true });
      return;
    }
    
    if (!isSameYmd(dateStart, startParam)) setDateStart(startParam);
    if (!isSameYmd(dateEnd, endParam)) setDateEnd(endParam);
  }, [dateEnd, dateStart, searchParams, setSearchParams]);

  const applyDateRange = (nextStart: Date | null, nextEnd: Date | null) => {
    const ymd = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    setDateStart(nextStart);
    setDateEnd(nextEnd);
    const next = new URLSearchParams(searchParams);
    if (!nextStart) {
      next.delete("start");
      next.delete("end");
    } else {
      const safeEnd = nextEnd ?? nextStart;
      next.set("start", ymd(nextStart));
      next.set("end", ymd(safeEnd));
    }
    setSearchParams(next, { replace: true });
  };

  const currencyFormatter = useMemo(() => {
    const currency = settings.currency || "USD";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }, [settings.currency]);

  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  const filtered = useMemo(() => {
    const parseOrderDateMs = (order: Order): number => {
      const ms = Date.parse(order.createdAt);
      return Number.isFinite(ms) ? ms : 0;
    };
    const dayStartMs = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
    const dayEndMs = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();

    if (!Array.isArray(orders)) return [];
    const normalizedSearch = search.trim().toLowerCase();

    const rows = orders
      .filter((o) => (statusFilter === "all" ? true : o.status === statusFilter))
      .filter((o) => (typeFilter === "all" ? true : o.type === typeFilter))
      .filter((o) => {
        if (!dateStart) return true;
        const t = parseOrderDateMs(o);
        if (!Number.isFinite(t) || t <= 0) return false;
        const startMs = dayStartMs(dateStart);
        const safeEnd = dateEnd ?? dateStart;
        const endMs = dayEndMs(safeEnd);
        return t >= startMs && t <= endMs;
      })
      .filter((o) => {
        if (!normalizedSearch) return true;
        const tableLabel = o.tableId ? tableById.get(o.tableId)?.label || "" : "";
        const userName = o.assignedTo ? userById.get(o.assignedTo)?.name || "" : "";
        const driverName = o.driverId ? driverById.get(o.driverId)?.name || "" : "";
        const haystack = [
          o.id,
          o.customerName || "",
          o.customerPhone || "",
          o.type,
          o.status,
          tableLabel,
          userName,
          driverName,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });

    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = parseOrderDateMs(a) - parseOrderDateMs(b);
      else if (sortKey === "total") cmp = a.total - b.total;
      else cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [
    driverById,
    dateEnd,
    dateStart,
    search,
    orders,
    sortDir,
    sortKey,
    statusFilter,
    tableById,
    typeFilter,
    userById,
  ]);

  const selectedOrder = useMemo(() => filtered.find((o) => o.id === selectedOrderId) || null, [filtered, selectedOrderId]);
  const effectiveStatus = (selectedOrder ? optimisticStatus ?? selectedOrder.status : null) as OrderStatus | null;

  useEffect(() => {
    if (!selectedOrder) return;
    if (!optimisticStatus) return;
    if (selectedOrder.status === optimisticStatus) setOptimisticStatus(null);
  }, [optimisticStatus, selectedOrder]);

  const summary = useMemo((): OrdersSummary => {
    const base = Array.isArray(orders) ? orders : [];
    const active = base.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
    const completed = base.filter((o) => o.status === "completed").length;
    const cancelled = base.filter((o) => o.status === "cancelled").length;
    return { active, completed, cancelled, total: base.length };
  }, [orders]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortKey("createdAt");
    setSortDir("desc");
  };

  return {
    orders,
    tables,
    users,
    drivers,
    settings,
    updateOrderStatus,
    mounted,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    selectedOrderId,
    setSelectedOrderId,
    dateStart,
    dateEnd,
    applyDateRange,
    statusUpdating,
    setStatusUpdating,
    optimisticStatus,
    setOptimisticStatus,
    invoiceDownloading,
    setInvoiceDownloading,
    filtered,
    selectedOrder,
    effectiveStatus,
    summary,
    resetFilters,
    currencyFormatter,
    tableById,
    userById,
    driverById,
  };
}
