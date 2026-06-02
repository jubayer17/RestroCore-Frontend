import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import OrderOverview from '@/components/OrderOverview';
import { useDashboard } from '@/components/dashboard/useDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { HeroKpiCards } from '@/components/dashboard/HeroKpiCards';
import { OperationalCards } from '@/components/dashboard/OperationalCards';
import { RevenueTrend } from '@/components/dashboard/RevenueTrend';
import { SalesSummary } from '@/components/dashboard/SalesSummary';
import { OrderHeatmap } from '@/components/dashboard/OrderHeatmap';
import { PerformanceSummaryStrip } from '@/components/dashboard/PerformanceSummaryStrip';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TopCustomers } from '@/components/dashboard/TopCustomers';
import { DriversStatus } from '@/components/dashboard/DriversStatus';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { BestSellersCard } from '@/components/dashboard/BestSellersCard';
import { PaymentMixCard } from '@/components/dashboard/PaymentMixCard';
import { LowStockWatchlist } from '@/components/dashboard/LowStockWatchlist';
import { ShoppingCart, DollarSign, Grid3X3 } from 'lucide-react';

export default function Dashboard() {
  const rightStackRef = useRef<HTMLDivElement | null>(null);
  const [rightStackHeight, setRightStackHeight] = useState<number | null>(null);
  const [matchLg, setMatchLg] = useState(false);

  const {
    orders, tables, drivers, inventory, categories,
    chartType, setChartType,
    dateRange, setDateRange,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    orderSearch, setOrderSearch,
    widgetPrefs, setWidgetPrefs,
    refreshNow,
    autoRefresh, setAutoRefresh,
    refreshEvery, setRefreshEvery,
    lastRefreshedAt,
    currencyFormatter,
    activeOrders,
    completedOrders,
    kpi1Revenue,
    kpi4Revenue,
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
    setOrdersOverviewPeriod,
    heatmapView, setHeatmapView,
    heatmapCategory, setHeatmapCategory,
    heatmapSegment, setHeatmapSegment,
    orderHeatmapEnabled,
    ordersOverviewExpanded,
    stackedDashboardWidgets,
    resetWidgetPrefs,
  } = useDashboard();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setMatchLg(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!matchLg) return;
    const el = rightStackRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setRightStackHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [matchLg]);

  const heroKpis = useMemo(() => [
    {
      label: "Today's Revenue",
      value: currencyFormatter.format(kpi1Revenue),
      sub: `${completedOrders.length} orders completed`,
      icon: DollarSign,
      bg: "bg-primary/5",
      border: "border-primary/20",
      iconColor: "text-primary",
      spark: "revenue" as const,
      sparkData: kpi1SparkData,
      stroke: "#f59e0b",
      filters: [
        {
          key: 'type',
          value: todayKpiType,
          onChange: setTodayKpiType,
          options: [
            { label: 'All Types', value: 'all' },
            { label: 'Dine-in', value: 'dinein' },
            { label: 'Delivery', value: 'delivery' },
            { label: 'Takeaway', value: 'takeaway' },
            { label: 'Pickup', value: 'pickup' },
          ]
        }
      ]
    },
    {
      label: "Active Orders",
      value: activeOrders.length.toString(),
      sub: `${kitchenBacklog} in kitchen queue`,
      icon: ShoppingCart,
      trend: "Live",
      up: true,
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      iconColor: "text-blue-500",
      spark: "orders" as const,
      stroke: "#3b82f6",
    },
    {
      label: "Table Occupancy",
      value: `${tables.length > 0 ? Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100) : 0}%`,
      sub: `${tables.length - tables.filter(t => t.status === 'occupied').length} of ${tables.length} tables free`,
      icon: Grid3X3,
      trend: `${tables.filter(t => t.status === 'occupied').length} seated`,
      up: tables.filter(t => t.status === 'occupied').length > 0,
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-500",
      spark: "orders" as const,
      stroke: "#3b82f6",
    },
    {
      label: "Total Sales",
      value: currencyFormatter.format(kpi4Revenue),
      sub: "Completed orders",
      icon: DollarSign,
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-500",
      spark: "revenue" as const,
      sparkData: kpi4SparkData,
      stroke: "#10b981",
      filters: [
        {
          key: 'range',
          value: totalKpiRange,
          onChange: setTotalKpiRange,
          options: [
            { label: 'All Time', value: 'all' },
            { label: 'Today', value: 'today' },
            { label: 'Last 7 Days', value: '7d' },
            { label: 'Last 30 Days', value: '30d' },
          ]
        },
        /*
        {
          key: 'type',
          value: totalKpiType,
          onChange: setTotalKpiType,
          options: [
            { label: 'All Types', value: 'all' },
            { label: 'Dine-in', value: 'dinein' },
            { label: 'Delivery', value: 'delivery' },
            { label: 'Takeaway', value: 'takeaway' },
            { label: 'Pickup', value: 'pickup' },
          ]
        }
        */
      ]
    },
  ], [currencyFormatter, kpi1Revenue, completedOrders.length, kpi1SparkData, todayKpiType, setTodayKpiType, activeOrders, kitchenBacklog, tables, kpi4Revenue, kpi4SparkData, totalKpiRange, setTotalKpiRange, totalKpiType, setTotalKpiType]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <DashboardHeader />

      {/* Filters are optional based on commented state in original code, but we provide the component */}
      {/* <DashboardFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        orderSearch={orderSearch}
        setOrderSearch={setOrderSearch}
        refreshNow={refreshNow}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        refreshEvery={refreshEvery}
        setRefreshEvery={setRefreshEvery}
        widgetPrefs={widgetPrefs}
        setWidgetPrefs={setWidgetPrefs}
        showAnalytics={showAnalytics}
        setShowAnalytics={setShowAnalytics}
        lastRefreshedAt={lastRefreshedAt}
        resetWidgetPrefs={resetWidgetPrefs}
      /> */}

      {!widgetPrefs.hidden.includes('kpis') && (
        <HeroKpiCards
          heroKpis={heroKpis}
          sparkRevenueData={sparkRevenueData}
          sparkOrdersData={sparkOrdersData}
          sparkAovData={sparkAovData}
        />
      )}

      <OperationalCards
        widgetPrefs={widgetPrefs}
        kitchenBacklog={kitchenBacklog}
        deliveryActive={deliveryActive}
        upcomingBookingsCount={upcomingBookings.length}
        lowStockItemsCount={lowStockItems.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <RevenueTrend
          widgetPrefs={widgetPrefs}
          chartType={chartType}
          setChartType={setChartType}
          hourlyData={hourlyData}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
        <SalesSummary
          widgetPrefs={widgetPrefs}
          completedOrders={completedOrders}
          currencyFormatter={currencyFormatter}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch">
        <motion.div layout transition={{ duration: 0.28 }} className="min-w-0">
          <OrderOverview onPeriodChange={setOrdersOverviewPeriod} />
        </motion.div>
        <BestSellersCard
          widgetPrefs={widgetPrefs}
          completedOrders={completedOrders}
          currencyFormatter={currencyFormatter}
        />
        <PaymentMixCard
          widgetPrefs={widgetPrefs}
          completedOrders={completedOrders}
          currencyFormatter={currencyFormatter}
        />
      </div>

      <OrderHeatmap
        orderHeatmapEnabled={orderHeatmapEnabled}
        heatmapCategory={heatmapCategory}
        setHeatmapCategory={setHeatmapCategory}
        heatmapSegment={heatmapSegment}
        setHeatmapSegment={setHeatmapSegment}
        heatmapView={heatmapView}
        setHeatmapView={setHeatmapView}
        categories={categories}
        timeHM={heatmapTime}
        regionHM={heatmapRegion}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        <div className="lg:col-span-8 min-w-0 h-full">
          <RecentOrders
            orders={orders}
            timeSince={timeSince}
            currencyFormatter={currencyFormatter}
            targetHeight={matchLg ? rightStackHeight ?? undefined : undefined}
          />
        </div>

        <div ref={rightStackRef} className="lg:col-span-4 min-w-0 space-y-4 lg:space-y-6 h-full">
          <QuickActions />
          <DriversStatus
            availableDrivers={availableDrivers}
            drivers={drivers}
          />
        </div>

        <div className="lg:col-span-6 min-w-0">
          <TopCustomers completedOrders={completedOrders} currencyFormatter={currencyFormatter} />
        </div>
        <div className="lg:col-span-6 min-w-0">
          <LowStockWatchlist lowStockItems={lowStockItems} />
        </div>
      </div>
    </div>
  );
}
