export const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

export const dashboardWidgets = [
  { key: 'kpis', title: 'Key Metrics', description: 'Revenue, orders, occupancy, and averages', defaultVisible: true },
  { key: 'operations', title: 'Operations', description: 'Kitchen, deliveries, reservations, and stock', defaultVisible: true },
  { key: 'revenue', title: 'Revenue Trend', description: 'Revenue and order volume over time', defaultVisible: true },
  { key: 'hotspots', title: 'Customer Hotspots', description: 'Order distribution by zone', defaultVisible: true },
  { key: 'orderSummary', title: 'Order Summary', description: 'Status breakdown and totals', defaultVisible: true },
  { key: 'trending', title: 'Trending Foods', description: 'Most ordered items by quantity', defaultVisible: true },
  { key: 'customers', title: 'Customer Insights', description: 'Top spenders and loyal customers', defaultVisible: true },
  { key: 'recentOrders', title: 'Recent Orders', description: 'Latest activity and statuses', defaultVisible: true },
  { key: 'drivers', title: 'Drivers', description: 'Availability snapshot', defaultVisible: true },
  { key: 'quickActions', title: 'Quick Actions', description: 'Common shortcuts', defaultVisible: true },
  { key: 'orderSources', title: 'Order Sources', description: 'Order mix by channel', defaultVisible: false },
  { key: 'payments', title: 'Payment Methods', description: 'Revenue split by payment method', defaultVisible: false },
  { key: 'revenueBySource', title: 'Revenue by Source', description: 'Channel performance', defaultVisible: false },
  { key: 'categories', title: 'Category Performance', description: 'Top categories by revenue', defaultVisible: false },
] as const;

export const DASH_WIDGETS_STORAGE_KEY = 'dash-widgets-v1';
