import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Tag, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardTypography } from "@/lib/typography";
import { fadeUp } from "@/components/dashboard/dashboard-types";
import type { ComparativeMetric } from "@/components/analytics/ComparativeMetricsCard";

interface AnalyticsKpiCardsProps {
  metrics: ComparativeMetric[];
  currency: string;
}

const KPI_META = [
  { key: "gross",  label: "Gross Sales",  icon: DollarSign, bg: "bg-primary/5",        border: "border-primary/20",      iconBg: "bg-primary/10",        iconColor: "text-primary",      valueColor: "text-foreground" },
  { key: "orders", label: "Orders",       icon: ShoppingBag,bg: "bg-blue-500/5",       border: "border-blue-500/20",     iconBg: "bg-blue-500/10",       iconColor: "text-blue-500",     valueColor: "text-foreground" },
  { key: "aov",    label: "Avg Ticket",   icon: Tag,         bg: "bg-emerald-500/5",    border: "border-emerald-500/20",  iconBg: "bg-emerald-500/10",    iconColor: "text-emerald-500",  valueColor: "text-foreground" },
  { key: "net",    label: "Net Sales",    icon: Wallet,      bg: "bg-violet-500/5",     border: "border-violet-500/20",   iconBg: "bg-violet-500/10",     iconColor: "text-violet-500",   valueColor: "text-foreground" },
];

function pctChange(current: number, previous: number): number {
  if (!Number.isFinite(previous) || previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

export const AnalyticsKpiCards: React.FC<AnalyticsKpiCardsProps> = ({ metrics, currency }) => {
  const fmtMoney0 = useMemo(() => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    catch { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  }, [currency]);

  const fmtMoney2 = useMemo(() => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    catch { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  }, [currency]);

  const fmt = (m: ComparativeMetric) => {
    if (m.format === "money0") return fmtMoney0.format(m.current);
    if (m.format === "money2") return fmtMoney2.format(m.current);
    if (m.format === "percent1") return `${m.current.toFixed(1)}%`;
    return m.current.toLocaleString();
  };

  const fmtPrev = (m: ComparativeMetric) => {
    if (m.format === "money0") return fmtMoney0.format(m.previous);
    if (m.format === "money2") return fmtMoney2.format(m.previous);
    if (m.format === "percent1") return `${m.previous.toFixed(1)}%`;
    return m.previous.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {KPI_META.map((meta, i) => {
        const metric = metrics.find((m) => m.key === meta.key);
        if (!metric) return null;
        const delta = pctChange(metric.current, metric.previous);
        const up = delta >= 0;
        const Icon = meta.icon;
        return (
          <motion.div
            key={meta.key}
            {...fadeUp(i * 0.08)}
            className={cn("glass-card p-4 sm:p-5 lg:p-6 flex flex-col gap-4 border", meta.bg, meta.border)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center shrink-0 border border-border", meta.iconBg)}>
                  <Icon className={cn("h-5 w-5 lg:h-6 lg:w-6", meta.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className={cn(dashboardTypography.metricValue, "leading-tight truncate")}>{fmt(metric)}</p>
                  <p className={cn(dashboardTypography.metricLabel, "mt-0.5 truncate")}>{meta.label}</p>
                </div>
              </div>
              <span className={cn(
                "flex items-center gap-0.5 text-[10px] px-2 py-0.5 border font-semibold shrink-0",
                up ? "bg-emerald-500/10 text-emerald-600 border-emerald-100" : "text-muted-foreground border-border",
              )}>
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(delta).toFixed(1)}%
              </span>
            </div>
            <p className={cn(dashboardTypography.chartLabel, "opacity-70")}>
              Prev period: {fmtPrev(metric)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};
