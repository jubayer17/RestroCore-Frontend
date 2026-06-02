import React from 'react';
import { Hash } from 'lucide-react';

interface POSHeaderProps {
  orderNumber?: string | null;
}

export const POSHeader: React.FC<POSHeaderProps> = ({ orderNumber }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-medium lg:text-3xl font-medium font-display ">Point of Sale</h1>
        <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">Select items to build an order</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
          <Hash className="h-3.5 w-3.5" />
          <span className="">Order {orderNumber ? `#${orderNumber}` : '—'}</span>
        </div>
      </div>
    </div>
  );
};
