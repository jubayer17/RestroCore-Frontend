import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { dashboardTypography } from "@/lib/typography";

interface AnalyticsCardProps {
    title: string;
    titleIcon?: React.ElementType;
    titleIconColor?: string;
    subtitle?: string;
    right?: React.ReactNode;
    children?: React.ReactNode;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    className?: string;
}

export function AnalyticsCard({
    title,
    titleIcon: TitleIcon,
    titleIconColor = "text-primary",
    subtitle,
    right,
    children,
    isLoading,
    error,
    onRetry,
    className,
}: AnalyticsCardProps) {
    return (
        <section className={cn("glass-card p-4 lg:p-5 border border-border/50 h-full flex flex-col", className)} aria-label={title}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <h3 className={cn(dashboardTypography.heading, "flex items-center gap-2")}>
                        {TitleIcon && <TitleIcon className={cn("h-4 w-4", titleIconColor)} />}
                        {title}
                    </h3>
                    {subtitle ? <p className={dashboardTypography.subheading}>{subtitle}</p> : null}
                </div>
                {right ? <div className="shrink-0">{right}</div> : null}
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-36 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center gap-3 rounded-none border bg-muted/30 p-6 text-center">
                    <AlertCircle className="h-7 w-7 text-muted-foreground/50" />
                    <div>
                        <p className="text-sm font-medium">Failed to load</p>
                        <p className="text-xs text-muted-foreground mt-1">{error}</p>
                    </div>
                    {onRetry ? (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="inline-flex items-center gap-2 border border-border/50 bg-card px-3 py-2 text-xs font-semibold hover:bg-muted/30 transition-colors"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry
                        </button>
                    ) : null}
                </div>
            ) : (
                <div className="flex-1 min-h-0">{children}</div>
            )}
        </section>
    );
}
