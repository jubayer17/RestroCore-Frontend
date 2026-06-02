import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { fadeUp, WidgetPrefs } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RevenueTrendProps {
  widgetPrefs: WidgetPrefs;
  chartType: 'area' | 'bar';
  setChartType: (v: 'area' | 'bar') => void;
  hourlyData: { hour: string; revenue: number; orders: number }[];
  dateRange: string;
  setDateRange: (v: string) => void;
}

export const RevenueTrend: React.FC<RevenueTrendProps> = ({
  widgetPrefs,
  chartType,
  setChartType,
  hourlyData,
  dateRange,
  setDateRange,
}) => {
  if (widgetPrefs.hidden.includes('revenue')) return null;

  const rangeLabels: Record<string, string> = {
    today: 'Revenue Today',
    '7d': 'Revenue Last 7 Days',
    '30d': 'Revenue Last 30 Days',
    '6m': 'Revenue Last 6 Months',
    '1y': 'Revenue Last Year',
    all: 'Total Revenue',
  };

  return (
    <motion.div {...fadeUp(0.4)} className="lg:col-span-2 glass-card p-5 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className={dashboardTypography.heading}>{rangeLabels[dateRange] || 'Revenue Trend'}</h3>
          <p className={dashboardTypography.subheading}>
            {dateRange === 'today' ? 'Hourly breakdown' : 'Daily performance'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9 w-[140px] text-xs font-medium">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Daily</SelectItem>
              <SelectItem value="7d">Weekly</SelectItem>
              <SelectItem value="30d">Monthly</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">12 Months</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setChartType('area')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', chartType === 'area' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Area</button>
            <button onClick={() => setChartType('bar')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', chartType === 'bar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Bar</button>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'area' ? (
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="revenueGrad_top" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 500 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 10, fontWeight: 500 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dx={-10} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGrad_top)" />
          </AreaChart>
        ) : (
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 500 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 10, fontWeight: 500 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dx={-10} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={0} maxBarSize={40} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
};
