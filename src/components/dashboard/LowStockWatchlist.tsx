import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardTypography } from '@/lib/typography';
import type { InventorySKU } from '@/types/restaurant';

interface LowStockWatchlistProps {
  lowStockItems: InventorySKU[];
}

export const LowStockWatchlist: React.FC<LowStockWatchlistProps> = ({ lowStockItems }) => {
  const sorted = [...lowStockItems].sort((a, b) => (a.qtyOnHand - a.reorderPoint) - (b.qtyOnHand - b.reorderPoint));
  const top = sorted.slice(0, 6);

  return (
    <div className="glass-card p-5 lg:p-6 border border-border/50">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={cn(dashboardTypography.heading, 'flex items-center gap-2')}>
          <AlertTriangle className="h-5 w-5 text-primary" /> Low Stock
        </h3>
        <Link to="/inventory" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
          Inventory <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {top.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          All good — no low stock items.
        </div>
      ) : (
        <div className="space-y-2.5">
          {top.map((it) => {
            const deficit = Math.max(0, it.reorderPoint - it.qtyOnHand);
            const pct = Math.min(100, Math.round((it.qtyOnHand / Math.max(1, it.reorderPoint)) * 100));
            return (
              <div key={it.id} className="rounded-2xl border border-border/50 bg-muted/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                      {it.qtyOnHand} {it.unit} on hand • Reorder at {it.reorderPoint}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-primary">-{deficit}</p>
                    <p className="text-[11px] text-muted-foreground font-bold tabular-nums">{pct}%</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

