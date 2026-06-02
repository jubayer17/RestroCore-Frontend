import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Flame, BarChart2, LayoutGrid } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { dashboardTypography } from "@/lib/typography";
import { fadeUp } from "@/components/dashboard/dashboard-types";
import { cn } from "@/lib/utils";

type HourBucket = { hour: number; revenue: number; orders: number };

interface HourlySalesHeatmapCardProps {
  data: HourBucket[];
  currency: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ZONES = [
  { label: "Night",     hours: [0,1,2,3,4,5],        dot: "bg-violet-500" },
  { label: "Morning",   hours: [6,7,8,9,10,11],       dot: "bg-amber-500" },
  { label: "Afternoon", hours: [12,13,14,15,16,17],   dot: "bg-primary" },
  { label: "Evening",   hours: [18,19,20,21,22,23],   dot: "bg-blue-500" },
];

export function HourlySalesHeatmapCard({ data, currency, isLoading, error, onRetry }: HourlySalesHeatmapCardProps) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [view, setView]     = useState<"heatmap" | "bar">("heatmap");

  const fmtMoney = useMemo(() => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    catch { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  }, [currency]);

  const max = useMemo(() =>
    Math.max(1, ...data.map((d) => metric === "revenue" ? d.revenue : d.orders)),
    [data, metric]);

  const peakHour = useMemo(() =>
    data.reduce((p, d) => {
      const v  = metric === "revenue" ? d.revenue : d.orders;
      const pv = metric === "revenue" ? data[p]?.revenue ?? 0 : data[p]?.orders ?? 0;
      return v > pv ? d.hour : p;
    }, 0),
    [data, metric]);

  // Bar chart needs labelled data
  const barData = data.map((d) => ({
    label: `${String(d.hour).padStart(2, "0")}h`,
    value: metric === "revenue" ? d.revenue : d.orders,
    hour: d.hour,
  }));

  const right = (
    <div className="flex items-center gap-1.5">
      {/* metric toggle */}
      <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/20 overflow-hidden p-0.5">
        {(["revenue", "orders"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMetric(m)}
            className={cn("px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors rounded-lg",
              metric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            aria-pressed={metric === m}>
            {m}
          </button>
        ))}
      </div>
      {/* view toggle */}
      <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/20 overflow-hidden p-0.5">
        <button type="button" onClick={() => setView("heatmap")}
          className={cn("p-1.5 rounded-lg transition-colors", view === "heatmap" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          aria-label="Heatmap view">
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => setView("bar")}
          className={cn("p-1.5 rounded-lg transition-colors", view === "bar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          aria-label="Bar chart view">
          <BarChart2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <AnalyticsCard title="Hourly Demand" titleIcon={Clock} subtitle="Sales volume by hour of day" right={right} isLoading={isLoading} error={error} onRetry={onRetry}>
      {data.length === 0 ? (
        <div className={dashboardTypography.emptyState}>Add completed orders to see demand patterns.</div>
      ) : (
        <div className="space-y-4">
          {/* Peak badge + zone legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Peak {String(peakHour).padStart(2, "0")}:00
              </span>
            </div>
            <div className="flex items-center gap-3">
              {ZONES.map((z) => (
                <div key={z.label} className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", z.dot)} />
                  <span className={dashboardTypography.chartLabel}>{z.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap view */}
          {view === "heatmap" && (
            <>
              <div className="space-y-3">
                {ZONES.map((zone) => (
                  <div key={zone.label}>
                    <div className="grid grid-cols-6 gap-1.5">
                      {zone.hours.map((h) => {
                        const bucket = data[h];
                        const v = bucket ? (metric === "revenue" ? bucket.revenue : bucket.orders) : 0;
                        const intensity = v / max;
                        const isPeak = h === peakHour;
                        const detail = metric === "revenue" ? fmtMoney.format(v) : `${v} orders`;
                        return (
                          <motion.div key={h} {...fadeUp(h * 0.01)} className="space-y-1 group" title={`${String(h).padStart(2, "0")}:00 · ${detail}`}>
                            <div
                              className={cn("h-9 border transition-all", isPeak ? "border-primary/60" : "border-border/30 group-hover:border-primary/30")}
                              style={{ background: `hsl(var(--primary) / ${isPeak ? 0.3 + intensity * 0.6 : 0.06 + intensity * 0.42})` }}
                            />
                            <p className={cn("text-[9px] text-center tabular-nums font-medium", isPeak ? "text-primary" : "text-muted-foreground")}>
                              {String(h).padStart(2, "0")}h
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <div className="flex gap-0.5">
                  {[0.08, 0.22, 0.38, 0.55, 0.75].map((o) => (
                    <div key={o} className="h-2.5 w-5" style={{ background: `hsl(var(--primary) / ${o})` }} />
                  ))}
                </div>
                <span className={dashboardTypography.chartLabel}>Low → High intensity</span>
              </div>
            </>
          )}

          {/* Bar chart view */}
          {view === "bar" && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ left: 0, right: 4, top: 4, bottom: 4 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 8 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={metric === "revenue" ? (v: number) => fmtMoney.format(v) : undefined}
                  width={metric === "revenue" ? 52 : 28}
                />
                <Tooltip
                  formatter={(v: number) => [metric === "revenue" ? fmtMoney.format(v) : `${v} orders`, String(peakHour).padStart(2,"0") + ":00"]}
                  labelFormatter={(label) => `Hour ${label}`}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {barData.map((d) => (
                    <Cell
                      key={d.hour}
                      fill={d.hour === peakHour
                        ? "hsl(var(--primary))"
                        : `hsl(var(--primary) / ${0.25 + (d.value / max) * 0.5})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </AnalyticsCard>
  );
}
