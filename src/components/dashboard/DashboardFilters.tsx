import React from 'react';
import { Search, RefreshCw, LayoutGrid, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DashboardDateRange,
  DashboardOrderType,
  DashboardOrderStatus,
  DashboardRefreshEvery,
  WidgetPrefs,
  DashboardWidgetKey,
  dashboardWidgets,
} from './dashboard-types';

interface DashboardFiltersProps {
  dateRange: DashboardDateRange;
  setDateRange: (v: DashboardDateRange) => void;
  typeFilter: DashboardOrderType;
  setTypeFilter: (v: DashboardOrderType) => void;
  statusFilter: DashboardOrderStatus;
  setStatusFilter: (v: DashboardOrderStatus) => void;
  orderSearch: string;
  setOrderSearch: (v: string) => void;
  refreshNow: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  refreshEvery: DashboardRefreshEvery;
  setRefreshEvery: (v: DashboardRefreshEvery) => void;
  widgetPrefs: WidgetPrefs;
  setWidgetPrefs: React.Dispatch<React.SetStateAction<WidgetPrefs>>;
  showAnalytics: boolean;
  setShowAnalytics: (v: boolean) => void;
  lastRefreshedAt: Date;
  resetWidgetPrefs: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  dateRange, setDateRange,
  typeFilter, setTypeFilter,
  statusFilter, setStatusFilter,
  orderSearch, setOrderSearch,
  refreshNow,
  autoRefresh, setAutoRefresh,
  refreshEvery, setRefreshEvery,
  widgetPrefs, setWidgetPrefs,
  showAnalytics, setShowAnalytics,
  lastRefreshedAt,
  resetWidgetPrefs
}) => {
  return (
    <div className="bg-card border rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="w-[135px]">
            <Select value={dateRange} onValueChange={(v: DashboardDateRange) => setDateRange(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={typeFilter} onValueChange={(v: DashboardOrderType) => setTypeFilter(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Order type" />
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
          <div className="w-[150px]">
            <Select value={statusFilter} onValueChange={(v: DashboardOrderStatus) => setStatusFilter(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="served">Served</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search orders…" className="pl-10 h-9 w-[220px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9" onClick={refreshNow}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border">
            <span className="text-xs text-muted-foreground">Auto</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <div className="w-[110px]">
              <Select value={refreshEvery} onValueChange={(v: DashboardRefreshEvery) => setRefreshEvery(v)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Every" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15s">15s</SelectItem>
                  <SelectItem value="30s">30s</SelectItem>
                  <SelectItem value="60s">60s</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-9">
                <LayoutGrid className="h-4 w-4 mr-2" /> Customize
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dashboard widgets</DialogTitle>
                <DialogHeader>
                  <DialogDescription>Toggle visibility and personalize your dashboard.</DialogDescription>
                </DialogHeader>
              </DialogHeader>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {dashboardWidgets.map((w) => {
                  const checked = !widgetPrefs.hidden.includes(w.key);
                  return (
                    <div key={w.key} className="flex items-center justify-between p-2.5 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">{w.title}</p>
                          <p className="text-xs text-muted-foreground">{w.description}</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const nextHidden = new Set(widgetPrefs.hidden);
                          if (v) nextHidden.delete(w.key);
                          else nextHidden.add(w.key);
                          setWidgetPrefs((p) => ({ ...p, hidden: Array.from(nextHidden) as DashboardWidgetKey[] }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <DialogFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Last refreshed {lastRefreshedAt.toLocaleTimeString()}</div>
                <Button
                  variant="ghost"
                  onClick={resetWidgetPrefs}
                >
                  Reset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-lg border">
            <span className="text-xs text-muted-foreground">Analytics</span>
            <Switch checked={showAnalytics} onCheckedChange={setShowAnalytics} />
          </div>
        </div>
      </div>
    </div>
  );
};
