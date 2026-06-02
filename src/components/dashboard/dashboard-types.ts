import React from 'react';

import { dashboardWidgets } from '@/data/config/dashboard';

export { COLORS, DASH_WIDGETS_STORAGE_KEY, dashboardWidgets } from '@/data/config/dashboard';
export const fadeUp = (delay: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.45 } });

export type DashboardWidgetKey = typeof dashboardWidgets[number]['key'];
export type DashboardDateRange = 'today' | '7d' | '30d' | '6m' | '1y' | 'all';
export type DashboardOrderType = 'all' | 'dinein' | 'takeaway' | 'delivery' | 'pickup';
export type DashboardOrderStatus = 'all' | 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type DashboardRefreshEvery = '15s' | '30s' | '60s' | '5m';

export type WidgetPrefs = {
  order: DashboardWidgetKey[];
  hidden: DashboardWidgetKey[];
};

export interface KpiFilter {
  key: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

export interface HeroKpi {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  trend?: string;
  up?: boolean;
  bg: string;
  border: string;
  iconColor: string;
  spark: "revenue" | "orders" | "aov";
  sparkData?: { v: number }[];
  stroke: string;
  filters?: KpiFilter[];
}
