import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { HeroKpi, fadeUp } from './dashboard-types';
import { dashboardTypography } from '@/lib/typography';

interface HeroKpiCardsProps {
  heroKpis: HeroKpi[];
  sparkRevenueData: { v: number }[];
  sparkOrdersData: { v: number }[];
  sparkAovData: { v: number }[];
}

export const HeroKpiCards: React.FC<HeroKpiCardsProps> = ({
  heroKpis,
  sparkRevenueData,
  sparkOrdersData,
  sparkAovData
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {heroKpis.map((kpi, i) => (
        <motion.div key={kpi.label} {...fadeUp(i * 0.08)} className={cn('glass-card p-4 sm:p-5 lg:p-6 flex flex-col gap-4 border', kpi.border)}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn('h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center shrink-0 border border-border', kpi.bg)}>
                <kpi.icon className={cn('h-5 w-5 lg:h-6 lg:w-6', kpi.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className={cn(dashboardTypography.metricValue, "leading-tight truncate")}>{kpi.value}</p>
                <p className={cn(dashboardTypography.metricLabel, "mt-0.5 truncate uppercase tracking-wider font-medium")}>{kpi.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {kpi.filters && (
                <div className="flex items-center gap-1.5">
                  {kpi.filters.map((filter) => (
                    <Select
                      key={filter.key}
                      value={filter.value}
                      onValueChange={filter.onChange}
                    >
                      <SelectTrigger className="h-7 px-2 text-[10px] bg-background/50 border-none shadow-none hover:bg-background transition-colors w-auto gap-1 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        {filter.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )}
              {kpi.trend !== undefined && (
                <span className={cn('flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-none bg-background border shadow-sm', kpi.up ? 'text-emerald-600 border-emerald-100' : 'text-muted-foreground border-border')}>
                  {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="font-semibold">{kpi.trend}</span>
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <p className={cn(dashboardTypography.chartLabel, "opacity-70 truncate")}>{kpi.sub}</p>
            <div className="h-8 opacity-60">
              <ResponsiveContainer width="100%" height={32}>
                <LineChart data={kpi.sparkData ? kpi.sparkData : (kpi.spark === "revenue" ? sparkRevenueData : kpi.spark === "orders" ? sparkOrdersData : sparkAovData)}>
                  <Line
                    dataKey="v"
                    type="monotone"
                    stroke={kpi.stroke}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
