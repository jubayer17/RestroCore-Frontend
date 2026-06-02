import { cn } from "@/lib/utils";

/**
 * Reusable typographic personality extracted from DailyDeliveryChart and OrderOverview
 * to maintain consistent metric-focused and data-driven tone.
 */
export const dashboardTypography = {
  // Headings - bold, data-driven, uppercase with tracking
  heading: "text-xs lg:text-sm font-semibold tracking-[0.22em] text-muted-foreground uppercase",

  // Page Title - prominent, tracking-tight
  title: "text-2xl font-medium sm:text-3xl lg:text-4xl tracking-tight",

  // Section Sub-heading - normal weight, subtle
  subheading: "text-[11px] lg:text-xs font-normal text-muted-foreground/80",

  // Body copy - clean, professional
  body: "text-sm text-muted-foreground",

  // Metric value - bold, prominent
  metricValue: "text-xl lg:text-2xl font-bold text-foreground tracking-tight",

  // Metric label - small, professional
  metricLabel: "text-[10px] lg:text-xs font-medium text-muted-foreground uppercase tracking-wide",

  // Chart axis / small labels
  chartLabel: "text-[10px] font-medium text-muted-foreground",

  // Tooltip content - compact
  tooltip: "text-xs font-medium space-y-0.5",

  // Empty states / Errors - clear, distinct
  emptyState: "p-4 rounded-none bg-muted/30 border border-border text-sm text-muted-foreground",
  errorState: "p-4 rounded-none bg-red-50 border border-red-200 text-sm text-red-700",

  // Emphasized metrics (e.g., "+5 new orders")
  emphasis: "text-primary font-semibold",

  // Button text - concise
  button: "text-sm font-medium",

  // Badge/Tag text - compact, uppercase
  badge: "text-[10px] lg:text-xs font-semibold uppercase tracking-wider",
};

/**
 * Utility to apply dashboard typography consistently
 */
export const getDashType = (key: keyof typeof dashboardTypography, className?: string) => {
  return cn(dashboardTypography[key], className);
};
