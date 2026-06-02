import React from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { dashboardTypography } from '@/lib/typography';
import { ExportAnalyticsMenu } from '@/components/analytics/ExportAnalyticsMenu';

const PERIOD_LABELS: Record<string, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '6m': 'Last 6 Months',
  '1y': 'Last Year',
  all: 'All Time',
};

interface AnalyticsHeaderProps {
  period: string;
  setPeriod: (v: string) => void;
  onRefresh: () => void;
  exportJson: Record<string, unknown>;
  exportCsvRows: Array<Record<string, unknown>>;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ period, setPeriod, onRefresh, exportJson, exportCsvRows }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  >
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center shadow-md border border-white/10 shrink-0">
        <TrendingUp className="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 className={dashboardTypography.title}>Analytics</h1>
        <p className={dashboardTypography.subheading}>
          {PERIOD_LABELS[period] ?? 'All Time'} · Deep-dive insights
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onRefresh}
        className="h-9 w-9 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors flex items-center justify-center"
        aria-label="Refresh analytics"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <ExportAnalyticsMenu filenamePrefix={`restrocore-analytics-${period}`} json={exportJson} csvRows={exportCsvRows} />
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="h-9 w-[160px] text-xs font-medium rounded-xl">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="6m">Last 6 Months</SelectItem>
          <SelectItem value="1y">Last Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </motion.div>
);
