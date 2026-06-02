import React from 'react';
import { RefreshCw, Receipt, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface OrdersHeaderProps {
  onReset: () => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({ onReset }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm border border-border shrink-0">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight truncate">Orders</h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
              Search, filter, and track orders across dine-in and delivery workflows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="h-9 w-9 p-0 sm:w-auto sm:px-3"
            onClick={() => {
              toast.success("Orders refreshed");
            }}
            aria-label="Refresh orders"
          >
            <RefreshCw className={cn("h-4 w-4", "sm:mr-2")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 sm:w-auto sm:px-3"
            onClick={onReset}
            aria-label="Reset filters"
          >
            <X className={cn("h-4 w-4", "sm:mr-2")} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground sm:hidden">
        Search, filter, and track orders across dine-in and delivery workflows.
      </p>
    </div>
  );
};
