import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsKpiCards } from "@/components/analytics/AnalyticsKpiCards";
import { type ComparativeMetric } from "@/components/analytics/ComparativeMetricsCard";
import { HourlySalesHeatmapCard } from "@/components/analytics/HourlySalesHeatmapCard";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { OrderTypeRevenueChart } from "@/components/analytics/OrderTypeRevenueChart";
import { DayOfWeekChart } from "@/components/analytics/DayOfWeekChart";
import { ReservationAnalyticsCard } from "@/components/analytics/ReservationAnalyticsCard";
import { DiscountAnalysisCard } from "@/components/analytics/DiscountAnalysisCard";
import { MenuHealthCard } from "@/components/analytics/MenuHealthCard";
import type { Order } from "@/types/restaurant";

const MS_DAY = 864e5;

function periodMs(period: string): number | null {
  if (period === "7d") return 7 * MS_DAY;
  if (period === "30d") return 30 * MS_DAY;
  if (period === "6m") return 183 * MS_DAY;
  if (period === "1y") return 365 * MS_DAY;
  return null;
}

function isRevenueOrder(o: Order): boolean {
  return o.status !== "cancelled" && !!o.paymentMethod;
}

function filterOrders(orders: Order[], startMs: number, endMs: number): Order[] {
  return orders.filter((o) => {
    if (!isRevenueOrder(o)) return false;
    const t = new Date(o.createdAt).getTime();
    return t >= startMs && t < endMs;
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function Analytics() {
  const { orders, menuItems, categories, bookings, settings } = useRestaurantStore();
  const [period, setPeriod] = useState("30d");
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("loading");
    setError(null);
    const t = window.setTimeout(() => {
      setStatus("ready");
    }, 260);
    return () => window.clearTimeout(t);
  }, [period, refreshKey]);

  const derived = useMemo(() => {
    try {
      const now = Date.now();
      const dur = periodMs(period);
      const curEnd = now;
      const curStart = dur == null ? 0 : now - dur;
      const prevEnd = curStart;
      const prevStart = dur == null ? 0 : curStart - dur;

      const curOrders = dur == null ? orders.filter(isRevenueOrder) : filterOrders(orders, curStart, curEnd);
      const prevOrders = dur == null ? [] : filterOrders(orders, prevStart, prevEnd);

      const curTotals = {
        orders: curOrders.length,
        gross: round2(curOrders.reduce((s, o) => s + o.total, 0)),
        subtotal: round2(curOrders.reduce((s, o) => s + o.subtotal, 0)),
        discount: round2(curOrders.reduce((s, o) => s + o.discount, 0)),
        tax: round2(curOrders.reduce((s, o) => s + o.tax, 0)),
      };
      const curNet = round2(curTotals.subtotal - curTotals.discount);
      const curAov = curTotals.orders > 0 ? round2(curTotals.gross / curTotals.orders) : 0;
      const curDiscountRate = curTotals.subtotal > 0 ? (curTotals.discount / curTotals.subtotal) * 100 : 0;

      const prevTotals = {
        orders: prevOrders.length,
        gross: round2(prevOrders.reduce((s, o) => s + o.total, 0)),
        subtotal: round2(prevOrders.reduce((s, o) => s + o.subtotal, 0)),
        discount: round2(prevOrders.reduce((s, o) => s + o.discount, 0)),
        tax: round2(prevOrders.reduce((s, o) => s + o.tax, 0)),
      };
      const prevNet = round2(prevTotals.subtotal - prevTotals.discount);
      const prevAov = prevTotals.orders > 0 ? round2(prevTotals.gross / prevTotals.orders) : 0;
      const prevDiscountRate = prevTotals.subtotal > 0 ? (prevTotals.discount / prevTotals.subtotal) * 100 : 0;

      const metrics: ComparativeMetric[] = [
        { key: "gross", label: "Gross Sales", current: curTotals.gross, previous: prevTotals.gross, format: "money0" },
        { key: "net", label: "Net Sales", current: curNet, previous: prevNet, format: "money0" },
        { key: "orders", label: "Orders", current: curTotals.orders, previous: prevTotals.orders, format: "number" },
        { key: "aov", label: "Avg Ticket", current: curAov, previous: prevAov, format: "money2" },
        { key: "discountRate", label: "Discount Rate", current: curDiscountRate, previous: prevDiscountRate, format: "percent1" },
        { key: "tax", label: "Tax Collected", current: curTotals.tax, previous: prevTotals.tax, format: "money0" },
      ];

      const topItemsMap: Record<string, { qty: number; revenue: number }> = {};
      curOrders.forEach((o) => {
        o.items.forEach((it) => {
          const key = it.name;
          if (!topItemsMap[key]) topItemsMap[key] = { qty: 0, revenue: 0 };
          topItemsMap[key].qty += it.qty;
          topItemsMap[key].revenue += it.price * it.qty;
        });
      });
      const topItems = Object.entries(topItemsMap)
        .map(([name, v]) => ({ name, qty: v.qty, revenue: round2(v.revenue) }))
        .sort((a, b) => b.revenue - a.revenue);

      const paymentMap: Record<string, { revenue: number; orders: number }> = {};
      curOrders.forEach((o) => {
        const key = o.paymentMethod || "unknown";
        if (!paymentMap[key]) paymentMap[key] = { revenue: 0, orders: 0 };
        paymentMap[key].revenue += o.total;
        paymentMap[key].orders += 1;
      });
      const paymentData = Object.entries(paymentMap).map(([method, v]) => ({
        method: method === "cash" ? "Cash" : method === "card" ? "Card" : "Other",
        revenue: round2(v.revenue),
        orders: v.orders,
      }));

      const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, orders: 0 }));
      curOrders.forEach((o) => {
        const h = new Date(o.createdAt).getHours();
        hours[h].revenue += o.total;
        hours[h].orders += 1;
      });
      const hourly = hours.map((h) => ({ ...h, revenue: round2(h.revenue) }));

      const catName: Record<string, string> = {};
      categories.forEach((c) => {
        catName[c.id] = c.name;
      });
      const itemCat: Record<string, string> = {};
      menuItems.forEach((m) => {
        itemCat[m.id] = catName[m.categoryId] ?? "Other";
      });
      const catTotals: Record<string, number> = {};
      curOrders.forEach((o) =>
        o.items.forEach((it) => {
          const cat = itemCat[it.menuItemId] ?? "Other";
          catTotals[cat] = (catTotals[cat] ?? 0) + it.price * it.qty;
        }),
      );
      const categoryData = Object.entries(catTotals)
        .map(([name, revenue]) => ({ name, revenue: round2(revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      const orderTypeMap: Record<string, { revenue: number; orders: number }> = {
        dinein: { revenue: 0, orders: 0 },
        takeaway: { revenue: 0, orders: 0 },
        delivery: { revenue: 0, orders: 0 },
        pickup: { revenue: 0, orders: 0 },
      };
      curOrders.forEach((o) => {
        orderTypeMap[o.type].revenue += o.total;
        orderTypeMap[o.type].orders += 1;
      });
      const orderTypeData = [
        { name: "Dine In", ...orderTypeMap.dinein },
        { name: "Delivery", ...orderTypeMap.delivery },
        { name: "Takeaway", ...orderTypeMap.takeaway },
        { name: "Pickup", ...orderTypeMap.pickup },
      ]
        .map((d) => ({ ...d, revenue: round2(d.revenue) }))
        .filter((d) => d.revenue > 0);

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dowBuckets: Record<number, { revenue: number; orders: number; days: Set<string> }> = {};
      for (let i = 0; i < 7; i++) dowBuckets[i] = { revenue: 0, orders: 0, days: new Set() };
      curOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        const dow = d.getDay();
        dowBuckets[dow].revenue += o.total;
        dowBuckets[dow].orders += 1;
        dowBuckets[dow].days.add(d.toDateString());
      });
      const dayOfWeekData = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
        const b = dowBuckets[dow];
        const denom = Math.max(b.days.size, 1);
        return {
          day: dayNames[dow],
          revenue: round2(b.revenue / denom),
          orders: round2(b.orders / denom),
        };
      });

      const customerCount: Record<string, number> = {};
      curOrders.forEach((o) => {
        const key = o.customerPhone || o.customerName || "__walkin__";
        customerCount[key] = (customerCount[key] ?? 0) + 1;
      });
      const customerKeys = Object.keys(customerCount).filter((k) => k !== "__walkin__");
      const returning = customerKeys.filter((k) => customerCount[k] > 1);
      const newCust = customerKeys.filter((k) => customerCount[k] === 1);
      const avgOrdersReturning = returning.length > 0 ? returning.reduce((s, k) => s + customerCount[k], 0) / returning.length : 0;

      const discountOrders = curOrders.filter((o) => o.discount > 0);
      const totalDiscount = round2(discountOrders.reduce((s, o) => s + o.discount, 0));
      const avgDiscountPct = discountOrders.length > 0 ? discountOrders.reduce((s, o) => s + (o.discount / Math.max(o.subtotal, 1)) * 100, 0) / discountOrders.length : 0;
      const maxDiscount = discountOrders.length > 0 ? Math.max(...discountOrders.map((o) => o.discount)) : 0;

      const byCat: Record<string, { available: number; unavailable: number }> = {};
      menuItems.forEach((m) => {
        const cat = catName[m.categoryId] ?? "Other";
        if (!byCat[cat]) byCat[cat] = { available: 0, unavailable: 0 };
        if (m.available) byCat[cat].available++;
        else byCat[cat].unavailable++;
      });

      const bookingDur = dur;
      const bookingCur = bookingDur == null
        ? bookings
        : bookings.filter((b) => {
            const t = new Date(b.datetime).getTime();
            return t >= curStart && t < curEnd;
          });
      const totalBookings = bookingCur.length;
      const confirmed = bookingCur.filter((b) => b.status === "confirmed").length;
      const completed = bookingCur.filter((b) => b.status === "completed").length;
      const cancelled = bookingCur.filter((b) => b.status === "cancelled").length;
      const noShow = bookingCur.filter((b) => b.status === "no-show").length;
      const noShowRate = totalBookings > 0 ? Math.round((noShow / totalBookings) * 100) : 0;
      const avgPartySize = totalBookings > 0 ? bookingCur.reduce((s, b) => s + b.partySize, 0) / totalBookings : 0;

      const bookingByDayMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      bookingCur.forEach((b) => {
        const dow = new Date(b.datetime).getDay();
        bookingByDayMap[dow] = (bookingByDayMap[dow] ?? 0) + 1;
      });
      const bookingsByDay = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({ day: dayNames[dow], bookings: bookingByDayMap[dow] }));

      const reservationStats = [
        { label: "Total Bookings", value: totalBookings },
        { label: "Confirmed", value: confirmed, color: "text-fresh" },
        { label: "Completed", value: completed, color: "text-primary" },
        { label: "No-Show Rate", value: `${noShowRate}%`, color: "text-destructive" },
        { label: "Cancelled", value: cancelled, color: "text-warning" },
        { label: "Avg Party Size", value: avgPartySize.toFixed(1) },
      ];

      const points = (() => {
        if (period === "7d") return { n: 7, stepMs: MS_DAY, labelFmt: "EEE" as const };
        if (period === "30d") return { n: 30, stepMs: MS_DAY, labelFmt: "MM/dd" as const };
        if (period === "6m") return { n: 26, stepMs: 7 * MS_DAY, labelFmt: "MM/dd" as const };
        return { n: 12, stepMs: 30 * MS_DAY, labelFmt: "MMM" as const };
      })();

      const series = Array.from({ length: points.n }, (_, i) => {
        const end = curEnd - (points.n - 1 - i) * points.stepMs;
        const start = end - points.stepMs;
        const pEnd = prevEnd - (points.n - 1 - i) * points.stepMs;
        const pStart = pEnd - points.stepMs;
        const curBucket = filterOrders(orders, start, end);
        const prevBucket = dur == null ? [] : filterOrders(orders, pStart, pEnd);
        return {
          label: format(new Date(end - 1), points.labelFmt),
          revenue: round2(curBucket.reduce((s, o) => s + o.total, 0)),
          orders: curBucket.length,
          prevRevenue: round2(prevBucket.reduce((s, o) => s + o.total, 0)),
          prevOrders: prevBucket.length,
        };
      });

      const exportJson = {
        generatedAt: new Date().toISOString(),
        period,
        current: { start: curStart, end: curEnd, ...curTotals, net: curNet, aov: curAov, discountRate: round2(curDiscountRate) },
        previous: { start: prevStart, end: prevEnd, ...prevTotals, net: prevNet, aov: prevAov, discountRate: round2(prevDiscountRate) },
        series,
        payment: paymentData,
        topItems: topItems.slice(0, 50),
        category: categoryData,
      };

      const exportCsvRows: Array<Record<string, unknown>> = [
        { section: "kpi", metric: "Gross Sales", value: curTotals.gross },
        { section: "kpi", metric: "Net Sales", value: curNet },
        { section: "kpi", metric: "Orders", value: curTotals.orders },
        { section: "kpi", metric: "Avg Ticket", value: curAov },
        { section: "kpi", metric: "Discount Rate %", value: round2(curDiscountRate) },
        { section: "kpi", metric: "Tax Collected", value: curTotals.tax },
        ...series.map((s) => ({
          section: "trend",
          label: s.label,
          revenue: s.revenue,
          orders: s.orders,
          previousRevenue: s.prevRevenue,
          previousOrders: s.prevOrders,
        })),
      ];

      return {
        curOrders,
        metrics,
        series,
        paymentData,
        hourly,
        topItems,
        categoryData,
        orderTypeData,
        dayOfWeekData,
        retention: {
          newCustomers: newCust.length,
          returningCustomers: returning.length,
          totalCustomers: customerKeys.length,
          avgOrdersPerReturning: avgOrdersReturning,
        },
        discount: {
          totalDiscount,
          discountedOrders: discountOrders.length,
          totalOrders: curOrders.length,
          avgDiscountPct,
          maxDiscount,
        },
        menuHealth: {
          totalItems: menuItems.length,
          availableItems: menuItems.filter((m) => m.available).length,
          byCategory: Object.entries(byCat).map(([name, v]) => ({ name, ...v })),
        },
        reservations: {
          stats: reservationStats,
          byDay: bookingsByDay,
        },
        exportJson,
        exportCsvRows,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Unknown error" } as const;
    }
  }, [orders, menuItems, categories, bookings, period]);

  useEffect(() => {
    if (!("error" in derived)) return;
    setError(derived.error);
    setStatus("error");
  }, [derived]);

  const isLoading = status === "loading";
  const isError = status === "error";

  const retry = () => setRefreshKey((k) => k + 1);

  if ("error" in derived) {
    return (
      <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
        <AnalyticsHeader
          period={period}
          setPeriod={setPeriod}
          onRefresh={retry}
          exportJson={{ period, error: derived.error }}
          exportCsvRows={[]}
        />
        <ComparativeMetricsCard
          currency={settings.currency}
          metrics={[]}
          isLoading={false}
          error={derived.error}
          onRetry={retry}
        />
      </div>
    );
  }

  const shared = { isLoading, error: isError ? error : null, onRetry: retry };

  return (
    <div className="flex-1 flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
      <AnalyticsHeader
        period={period}
        setPeriod={setPeriod}
        onRefresh={retry}
        exportJson={derived.exportJson}
        exportCsvRows={derived.exportCsvRows}
      />

      {/* ── Section 1: KPI Overview ── */}
      <AnalyticsKpiCards metrics={derived.metrics} currency={settings.currency} />

      {/* ── Section 2: Menu & Channel Breakdown ── */}
      <section aria-label="Menu and Channel Breakdown" className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">Menu &amp; Channels</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <SalesByCategoryChart data={derived.categoryData} currency={settings.currency} {...shared} />
          <OrderTypeRevenueChart data={derived.orderTypeData} currency={settings.currency} {...shared} />
        </div>
      </section>

      {/* ── Section 3: Temporal Patterns ── */}
      <section aria-label="Temporal Patterns" className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">Temporal Patterns</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <DayOfWeekChart data={derived.dayOfWeekData} currency={settings.currency} {...shared} />
          <HourlySalesHeatmapCard data={derived.hourly} currency={settings.currency} {...shared} />
        </div>
      </section>

      {/* ── Section 4: Operations ── */}
      <section aria-label="Operations" className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">Operations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          <ReservationAnalyticsCard stats={derived.reservations.stats} byDay={derived.reservations.byDay} {...shared} />
          <DiscountAnalysisCard currency={settings.currency} {...derived.discount} {...shared} />
          <MenuHealthCard {...derived.menuHealth} {...shared} />
        </div>
      </section>
    </div>
  );
}
