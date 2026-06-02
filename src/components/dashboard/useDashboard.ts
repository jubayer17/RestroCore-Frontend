import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { buildTimeHeatmap, buildRegionHeatmap } from '@/lib/heatmap';
import {
  DashboardDateRange,
  DashboardOrderType,
  DashboardOrderStatus,
  DashboardRefreshEvery,
  WidgetPrefs,
  DashboardWidgetKey,
  DASH_WIDGETS_STORAGE_KEY,
  dashboardWidgets,
  COLORS,
} from './dashboard-types';

const defaultWidgetPrefs: WidgetPrefs = {
  order: dashboardWidgets.map((w) => w.key),
  hidden: dashboardWidgets.filter((w) => !w.defaultVisible).map((w) => w.key),
};

const coerceWidgetPrefs = (value: unknown): WidgetPrefs => {
  if (!value || typeof value !== 'object') return defaultWidgetPrefs;
  const record = value as Partial<WidgetPrefs>;
  const knownKeys = new Set<DashboardWidgetKey>(dashboardWidgets.map((w) => w.key));

  const order = Array.isArray(record.order) ? record.order.filter((k): k is DashboardWidgetKey => typeof k === 'string' && knownKeys.has(k as DashboardWidgetKey)) : [];
  const hidden = Array.isArray(record.hidden) ? record.hidden.filter((k): k is DashboardWidgetKey => typeof k === 'string' && knownKeys.has(k as DashboardWidgetKey)) : [];

  const normalizedOrder = order.length > 0 ? order : defaultWidgetPrefs.order;
  const orderSet = new Set(normalizedOrder);
  const withMissing = [...normalizedOrder, ...defaultWidgetPrefs.order.filter((k) => !orderSet.has(k))];

  return { order: withMissing, hidden };
};

export const useDashboard = () => {
  const { orders, tables, bookings, drivers, inventory, users, menuItems, categories, settings } = useRestaurantStore();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [customerTab, setCustomerTab] = useState<'top' | 'loyal'>('top');

  const [dateRange, setDateRange] = useState<DashboardDateRange>('today');
  const [typeFilter, setTypeFilter] = useState<DashboardOrderType>('all');
  const [statusFilter, setStatusFilter] = useState<DashboardOrderStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');

  const [widgetPrefs, setWidgetPrefs] = useState<WidgetPrefs>(() => {
    try {
      const raw = localStorage.getItem(DASH_WIDGETS_STORAGE_KEY);
      if (!raw) return defaultWidgetPrefs;
      return coerceWidgetPrefs(JSON.parse(raw));
    } catch {
      return defaultWidgetPrefs;
    }
  });

  const [todayKpiType, setTodayKpiType] = useState<DashboardOrderType>('all');
  const [totalKpiType, setTotalKpiType] = useState<DashboardOrderType>('all');
  const [totalKpiRange, setTotalKpiRange] = useState<DashboardDateRange>('all');

  const [deliveryChartPeriod, setDeliveryChartPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [ordersOverviewPeriod, setOrdersOverviewPeriod] = useState<'weekly' | '1y'>('weekly');

  const [heatmapView, setHeatmapView] = useState<'time' | 'region'>('time');
  const [heatmapCategory, setHeatmapCategory] = useState<string>('all');
  const [heatmapSegment, setHeatmapSegment] = useState<'all' | 'dine-in' | 'delivery' | 'new' | 'repeat'>('all');

  const repeatIds = useMemo(() => {
    const m = new Map<string, number>();
    orders.forEach(o => {
      const k = o.customerPhone || o.customerName || o.id;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }, [orders]);

  const heatmapOrders = useMemo(() => {
    const setStart = () => {
      const now = new Date();
      if (dateRange === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      if (dateRange === '7d') return now.getTime() - 7 * 24 * 60 * 60 * 1000;
      if (dateRange === '30d') return now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return null;
    };
    const start = setStart();
    return orders.filter(o => {
      if (o.status === 'cancelled') return false;
      const t = new Date(o.createdAt).getTime();
      if (start !== null && t < start) return false;
      if (heatmapSegment !== 'all') {
        if (heatmapSegment === 'dine-in' && o.type !== 'dinein') return false;
        if (heatmapSegment === 'delivery' && o.type !== 'delivery') return false;
        if (heatmapSegment === 'new') {
          const k = o.customerPhone || o.customerName || o.id;
          if ((repeatIds.get(k) || 0) > 1) return false;
        }
        if (heatmapSegment === 'repeat') {
          const k = o.customerPhone || o.customerName || o.id;
          if ((repeatIds.get(k) || 0) < 2) return false;
        }
      }
      if (heatmapCategory !== 'all') {
        const match = o.items?.some(it => {
          const mi = menuItems.find(m => m.id === it.menuItemId);
          return mi?.categoryId === heatmapCategory;
        });
        if (!match) return false;
      }
      return true;
    });
  }, [orders, dateRange, heatmapCategory, heatmapSegment, menuItems, repeatIds]);

  const timeHM = useMemo(() => {
    try {
      return buildTimeHeatmap(heatmapOrders);
    } catch {
      return null;
    }
  }, [heatmapOrders]);

  const regionHM = useMemo(() => {
    try {
      return buildRegionHeatmap(heatmapOrders);
    } catch {
      return null;
    }
  }, [heatmapOrders]);

  const orderHeatmapEnabled = import.meta.env.VITE_ENABLE_ORDER_HEATMAP === 'true';
  const deliveryChartExpanded = deliveryChartPeriod === 'monthly';
  const ordersOverviewExpanded = ordersOverviewPeriod === '1y';
  const stackedDashboardWidgets = deliveryChartExpanded || ordersOverviewExpanded;

  const [refreshNonce, setRefreshNonce] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshEvery, setRefreshEvery] = useState<DashboardRefreshEvery>('30s');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());

  useEffect(() => {
    try {
      localStorage.setItem(DASH_WIDGETS_STORAGE_KEY, JSON.stringify(widgetPrefs));
    } catch {
      // ignore
    }
  }, [widgetPrefs]);

  const refreshNow = useCallback(() => {
    setRefreshNonce((n) => n + 1);
    setLastRefreshedAt(new Date());
  }, []);

  const resetWidgetPrefs = useCallback(() => {
    setWidgetPrefs(defaultWidgetPrefs);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const ms = refreshEvery === '15s' ? 15000 : refreshEvery === '30s' ? 30000 : refreshEvery === '60s' ? 60000 : 300000;
    const id = window.setInterval(() => refreshNow(), ms);
    return () => window.clearInterval(id);
  }, [autoRefresh, refreshEvery, refreshNow]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startMs =
      dateRange === 'today' ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        : dateRange === '7d' ? now.getTime() - 7 * 24 * 60 * 60 * 1000
          : dateRange === '30d' ? now.getTime() - 30 * 24 * 60 * 60 * 1000
            : dateRange === '6m' ? now.getTime() - 180 * 24 * 60 * 60 * 1000
              : dateRange === '1y' ? now.getTime() - 365 * 24 * 60 * 60 * 1000
                : null;

    return orders.filter((o) => {
      const createdAtMs = new Date(o.createdAt).getTime();
      const matchDate = startMs === null ? true : createdAtMs >= startMs;
      const matchType = typeFilter === 'all' ? true : o.type === typeFilter;
      const matchStatus = statusFilter === 'all' ? true : o.status === statusFilter;
      const q = orderSearch.trim().toLowerCase();
      const matchSearch = !q ? true : (
        o.id.toLowerCase().includes(q)
        || (o.customerName ? o.customerName.toLowerCase().includes(q) : false)
        || (o.customerPhone ? o.customerPhone.toLowerCase().includes(q) : false)
      );
      return matchDate && matchType && matchStatus && matchSearch;
    });
  }, [orders, dateRange, typeFilter, statusFilter, orderSearch, refreshNonce]);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: settings.currency || 'USD', maximumFractionDigits: 2 });
    } catch {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
    }
  }, [settings.currency]);

  // Core metrics
  const activeOrders = filteredOrders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');

  const kpi1Revenue = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return orders.reduce((sum, o) => {
      if (o.status !== 'completed') return sum;
      if (new Date(o.createdAt).getTime() < startOfToday) return sum;
      if (todayKpiType !== 'all' && o.type !== todayKpiType) return sum;
      return sum + o.total;
    }, 0);
  }, [orders, todayKpiType]);

  const kpi1Trend = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const sumCompletedInRange = (startMs: number, endMs: number) =>
      orders.reduce((sum, o) => {
        if (o.status !== "completed") return sum;
        const createdAtMs = new Date(o.createdAt).getTime();
        if (createdAtMs < startMs || createdAtMs >= endMs) return sum;
        if (todayKpiType !== 'all' && o.type !== todayKpiType) return sum;
        return sum + o.total;
      }, 0);

    const todayVal = sumCompletedInRange(startOfToday, now.getTime());
    const yesterdayVal = sumCompletedInRange(startOfYesterday, startOfToday);
    const pct = yesterdayVal > 0 ? ((todayVal - yesterdayVal) / yesterdayVal) * 100 : todayVal > 0 ? 100 : 0;

    return {
      up: pct >= 0,
      text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    };
  }, [orders, todayKpiType]);

  const kpi4Revenue = useMemo(() => {
    const now = new Date();
    const startMs =
      totalKpiRange === 'today' ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        : totalKpiRange === '7d' ? now.getTime() - 7 * 24 * 60 * 60 * 1000
          : totalKpiRange === '30d' ? now.getTime() - 30 * 24 * 60 * 60 * 1000
            : null;

    return orders.reduce((sum, o) => {
      if (o.status !== 'completed') return sum;
      if (startMs !== null && new Date(o.createdAt).getTime() < startMs) return sum;
      if (totalKpiType !== 'all' && o.type !== totalKpiType) return sum;
      return sum + o.total;
    }, 0);
  }, [orders, totalKpiRange, totalKpiType]);

  const todayRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = completedOrders.length > 0 ? todayRevenue / completedOrders.length : 0;
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const freeTables = tables.filter((t) => t.status === 'free').length;
  const kitchenBacklog = activeOrders.filter((o) => o.status === 'preparing' || o.status === 'pending').length;
  const deliveryActive = activeOrders.filter((o) => o.type === 'delivery').length;
  const lowStockItems = inventory.filter((i) => i.qtyOnHand <= i.reorderPoint);
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  const availableDrivers = drivers.filter((d) => d.status === 'available').length;
  const totalDiscount = completedOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalTax = completedOrders.reduce((sum, o) => sum + o.tax, 0);
  const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
  const fulfillmentRate = filteredOrders.length > 0 ? Math.round(((filteredOrders.length - cancelledOrders) / filteredOrders.length) * 100) : 100;
  const activeStaff = users.filter(u => u.active);

  const totalSalesTrend = useMemo(() => {
    const now = new Date();
    const end = now.getTime();
    const rangeDays = totalKpiRange === 'today' ? 1 : totalKpiRange === '7d' ? 7 : totalKpiRange === '30d' ? 30 : 7;
    const start = end - rangeDays * 24 * 60 * 60 * 1000;
    const prevEnd = start;
    const prevStart = prevEnd - rangeDays * 24 * 60 * 60 * 1000;

    const sumCompletedInRange = (startMs: number, endMs: number) =>
      orders.reduce((sum, o) => {
        if (o.status !== "completed") return sum;
        const createdAtMs = new Date(o.createdAt).getTime();
        if (!Number.isFinite(createdAtMs)) return sum;
        if (createdAtMs < startMs || createdAtMs >= endMs) return sum;
        if (totalKpiType !== 'all' && o.type !== totalKpiType) return sum;
        if (!Number.isFinite(o.total)) return sum;
        return sum + o.total;
      }, 0);

    const current = sumCompletedInRange(start, end);
    const previous = sumCompletedInRange(prevStart, prevEnd);
    const pct = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

    return {
      up: pct >= 0,
      text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    };
  }, [orders, totalKpiRange, totalKpiType]);

  // Top customers / loyal customers
  const customerSpend: Record<string, { name: string; orders: number; total: number }> = {};
  completedOrders.forEach((o) => {
    const name = o.customerName || (o.tableId ? `Table ${o.tableId}` : 'Walk-in');
    if (!customerSpend[name]) customerSpend[name] = { name, orders: 0, total: 0 };
    customerSpend[name].orders += 1;
    customerSpend[name].total += o.total;
  });
  const topCustomers = Object.values(customerSpend).sort((a, b) => b.total - a.total).slice(0, 5);

  const trendData = useMemo(() => {
    const now = new Date();

    if (dateRange === 'today') {
      const startHour = 10;
      const hours = Array.from({ length: 12 }, (_, i) => startHour + i);
      const isSameDay = (d: Date) => d.toDateString() === now.toDateString();
      return hours.map((h) => {
        const ordersThisHour = completedOrders.filter((o) => {
          const d = new Date(o.createdAt);
          return isSameDay(d) && d.getHours() === h;
        });
        const revenue = ordersThisHour.reduce((s, o) => s + o.total, 0);
        return {
          label: `${String(h).padStart(2, '0')}:00`,
          revenue: Math.round(revenue),
          orders: ordersThisHour.length,
        };
      });
    }

    if (dateRange === '6m' || dateRange === '1y') {
      const monthsCount = dateRange === '6m' ? 6 : 12;
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setMonth(start.getMonth() - (monthsCount - 1));

      const byMonth = new Map<string, { revenue: number; orders: number }>();
      for (let i = 0; i < monthsCount; i += 1) {
        const d = new Date(start);
        d.setMonth(start.getMonth() + i);
        const key = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        byMonth.set(key, { revenue: 0, orders: 0 });
      }

      completedOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        const key = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        const bucket = byMonth.get(key);
        if (!bucket) return;
        bucket.revenue += o.total;
        bucket.orders += 1;
      });

      return Array.from(byMonth.entries()).map(([k, v]) => ({
        label: k,
        revenue: Math.round(v.revenue),
        orders: v.orders,
      }));
    }

    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 14;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - (days - 1));

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      byDay.set(d.toDateString(), { revenue: 0, orders: 0 });
    }

    completedOrders.forEach((o) => {
      const key = new Date(o.createdAt).toDateString();
      const bucket = byDay.get(key);
      if (!bucket) return;
      bucket.revenue += o.total;
      bucket.orders += 1;
    });

    return Array.from(byDay.entries()).map(([k, v]) => {
      const d = new Date(k);
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      return { label, revenue: Math.round(v.revenue), orders: v.orders };
    });
  }, [completedOrders, dateRange]);

  // Sales summary
  const salesSummary = {
    grossSales: todayRevenue + totalDiscount,
    discounts: totalDiscount,
    tax: totalTax,
    netSales: todayRevenue,
    avgOrderValue: avgTicket,
    totalOrders: completedOrders.length,
  };

  const hourlyData = useMemo(() => trendData.map(d => ({ hour: d.label, revenue: d.revenue, orders: d.orders })), [trendData]);

  const timeSince = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  };

  const sparkRevenueData = useMemo(() => trendData.map(d => ({ v: d.revenue })), [trendData]);
  const sparkOrdersData = useMemo(() => trendData.map(d => ({ v: d.orders })), [trendData]);
  const sparkAovData = useMemo(() => trendData.map(d => ({ v: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0 })), [trendData]);

  const kpi1SparkData = useMemo(() => {
    const now = new Date();
    const startHour = 10;
    const hours = Array.from({ length: 12 }, (_, i) => startHour + i);
    const isSameDay = (d: Date) => d.toDateString() === now.toDateString();
    return hours.map((h) => {
      const ordersThisHour = orders.filter((o) => {
        const d = new Date(o.createdAt);
        if (o.status !== 'completed') return false;
        if (todayKpiType !== 'all' && o.type !== todayKpiType) return false;
        return isSameDay(d) && d.getHours() === h;
      });
      const revenue = ordersThisHour.reduce((s, o) => s + o.total, 0);
      return { v: Math.round(revenue) };
    });
  }, [orders, todayKpiType]);

  const kpi4SparkData = useMemo(() => {
    const days = totalKpiRange === 'today' ? 1 : totalKpiRange === '7d' ? 7 : totalKpiRange === '30d' ? 30 : 14;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - (days - 1));

    const byDay = new Map<string, number>();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      byDay.set(d.toDateString(), 0);
    }

    orders.forEach((o) => {
      if (o.status !== 'completed') return;
      if (totalKpiType !== 'all' && o.type !== totalKpiType) return;
      const key = new Date(o.createdAt).toDateString();
      if (byDay.has(key)) {
        byDay.set(key, byDay.get(key)! + o.total);
      }
    });

    return Array.from(byDay.values()).map(v => ({ v: Math.round(v) }));
  }, [orders, totalKpiRange, totalKpiType]);

  const heatmapTime = timeHM;
  const heatmapRegion = regionHM;

  return {
    orders, tables, bookings, drivers, inventory, users, menuItems, categories, settings,
    chartType, setChartType,
    customerTab, setCustomerTab,
    dateRange, setDateRange,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    orderSearch, setOrderSearch,
    widgetPrefs, setWidgetPrefs,
    refreshNonce, refreshNow,
    autoRefresh, setAutoRefresh,
    refreshEvery, setRefreshEvery,
    lastRefreshedAt,
    filteredOrders,
    currencyFormatter,
    activeOrders,
    completedOrders,
    kpi1Revenue,
    kpi1Trend,
    kpi4Revenue,
    todayRevenue,
    avgTicket,
    occupiedTables,
    freeTables,
    kitchenBacklog,
    deliveryActive,
    lowStockItems,
    upcomingBookings,
    availableDrivers,
    totalDiscount,
    totalTax,
    totalItemsSold,
    fulfillmentRate,
    activeStaff,
    totalSalesTrend,
    topCustomers,
    salesSummary,
    hourlyData,
    timeSince,
    sparkRevenueData,
    sparkOrdersData,
    sparkAovData,
    kpi1SparkData,
    kpi4SparkData,
    heatmapTime,
    heatmapRegion,
    todayKpiType, setTodayKpiType,
    totalKpiType, setTotalKpiType,
    totalKpiRange, setTotalKpiRange,
    deliveryChartPeriod, setDeliveryChartPeriod,
    ordersOverviewPeriod, setOrdersOverviewPeriod,
    heatmapView, setHeatmapView,
    heatmapCategory, setHeatmapCategory,
    heatmapSegment, setHeatmapSegment,
    orderHeatmapEnabled,
    deliveryChartExpanded,
    ordersOverviewExpanded,
    stackedDashboardWidgets,
    resetWidgetPrefs,
  };
};
