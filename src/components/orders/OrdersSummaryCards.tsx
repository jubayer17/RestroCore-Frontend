import React from 'react';
import { Activity, CheckCircle2, Receipt, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrdersSummary } from "./orders-types";

interface OrdersSummaryCardsProps {
  summary: OrdersSummary;
}

export const OrdersSummaryCards: React.FC<OrdersSummaryCardsProps> = ({ summary }) => {
  const cards = [
    { label: "Total", value: summary.total.toLocaleString(), icon: Receipt, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", border: "border-blue-500/20" },
    { label: "Active", value: summary.active.toLocaleString(), icon: Activity, iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
    { label: "Completed", value: summary.completed.toLocaleString(), icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
    { label: "Cancelled", value: summary.cancelled.toLocaleString(), icon: XCircle, iconBg: "bg-destructive/10", iconColor: "text-destructive", border: "border-destructive/20" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((k) => (
        <div
          key={k.label}
          className={cn(
            "glass-card p-4 sm:p-5 flex items-center gap-4 border transition-all hover:shadow-md",
            k.border,
          )}
        >
          <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 border border-border", k.iconBg)}>
            <k.icon className={cn("h-5 w-5", k.iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-medium sm:text-3xl font-medium leading-tight">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
