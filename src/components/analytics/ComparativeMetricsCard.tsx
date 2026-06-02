import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingBag, Tag, Percent, Landmark, Wallet,
  TrendingDown, TrendingUp, BarChart2,
} from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { dashboardTypography } from "@/lib/typography";
import { fadeUp } from "@/components/dashboard/dashboard-types";
import { cn } from "@/lib/utils";

export type ComparativeMetric = {
  key: string;
  label: string;
  current: number;
  previous: number;
  format: "money0" | "money2" | "number" | "percent1";
};

interface ComparativeMetricsCardProps {
  title?: string;
  subtitle?: string;
  metrics: ComparativeMetric[];
  currency: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

type MetricCfg = { icon: React.ElementType; iconColor: string; iconBg: string; valueColor: string };

const METRIC_CFG: Record<string, MetricCfg> = {
  gross:        { icon: DollarSign,  iconColor: "text-primary",     iconBg: "bg-primary/10 border-primary/20",        valueColor: "text-primary" },
  net:          { icon: Wallet,      iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10 border-emerald-500/20", valueColor: "text-emerald-500" },
  orders:       { icon: ShoppingBag, iconColor: "text-blue-500",    iconBg: "bg-blue-500/10 border-blue-500/20",       valueColor: "text-blue-500" },
  aov:          { icon: Tag,         iconColor: "text-fuchsia-500", iconBg: "bg-fuchsia-500/10 border-fuchsia-500/20", valueColor: "text-fuchsia-500" },
  discountRate: { icon: Percent,     iconColor: "text-amber-500",   iconBg: "bg-amber-500/10 border-amber-500/20",     valueColor: "text-amber-500" },
  tax:          { icon: Landmark,    iconColor: "text-violet-500",  iconBg: "bg-violet-500/10 border-violet-500/20",   valueColor: "text-violet-500" },
};
const FALLBACK_CFG: MetricCfg = {
  icon: DollarSign, iconColor: "text-muted-foreground",
  iconBg: "bg-muted/30 border-border/50", valueColor: "text-foreground",
};

function pctChange(current: number, previous: number): number {
  if (!Number.isFinite(previous) || previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function ComparativeMetricsCard({
  title = "Performance Breakdown",
  subtitle = "Current period vs previous period",
  metrics,
  currency,
  isLoading,
  error,
  onRetry,
  className,
}: ComparativeMetricsCardProps) {
  const fmtMoney0 = useMemo(() => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    catch { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  }, [currency]);

  const fmtMoney2 = useMemo(() => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    catch { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  }, [currency]);

  const fmt = (v: number, kind: ComparativeMetric["format"]) => {
    if (kind === "money0") return fmtMoney0.format(v);
    if (kind === "money2") return fmtMoney2.format(v);
    if (kind === "percent1") return `${v.toFixed(1)}%`;
    return v.toLocaleString();
  };

  return (
    <AnalyticsCard
      title={title}
      titleIcon={BarChart2}
      subtitle={subtitle}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {metrics.length === 0 ? (
        <div className={dashboardTypography.emptyState}>No metrics available. Add completed orders to populate analytics.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.map((m, i) => {
            const delta = pctChange(m.current, m.previous);
            const up = delta >= 0;
            const cfg = METRIC_CFG[m.key] ?? FALLBACK_CFG;
            const Icon = cfg.icon;
            return (
              <motion.div key={m.key} {...fadeUp(i * 0.06)} className="rounded-2xl border border-border/50 bg-muted/10 p-3.5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={cn("h-8 w-8 rounded-xl border flex items-center justify-center shrink-0", cfg.iconBg)}>
                    <Icon className={cn("h-4 w-4", cfg.iconColor)} />
                  </div>
                  <span className={cn(
                    "flex items-center gap-0.5 text-[10px] px-2 py-0.5 border font-semibold",
                    up
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20",
                  )}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(delta).toFixed(1)}%
                  </span>
                </div>
                <p className={cn(dashboardTypography.metricLabel, "mb-1")}>{m.label}</p>
                <p className={cn(dashboardTypography.metricValue, cfg.valueColor)}>{fmt(m.current, m.format)}</p>
                <p className={cn(dashboardTypography.chartLabel, "mt-1")}>
                  Prev: {fmt(m.previous, m.format)}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </AnalyticsCard>
  );
}
