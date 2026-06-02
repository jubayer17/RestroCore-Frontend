import React from 'react';
import { cn } from '@/lib/utils';
import type { OrderType } from '@/types/restaurant';

interface OrderTypeSelectorProps {
  orderTypes: Array<{ value: OrderType; label: string; icon: React.ReactNode }>;
  cartOrderType: OrderType;
  setCartOrderType: (v: OrderType) => void;
}

export const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  orderTypes, cartOrderType, setCartOrderType
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
      {orderTypes.map((ot) => (
        <button
          key={ot.value}
          onClick={() => setCartOrderType(ot.value)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all whitespace-nowrap shrink-0 border',
            cartOrderType === ot.value
              ? 'bg-primary text-primary-foreground shadow-sm border-transparent'
              : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          {ot.icon}
          {ot.label}
        </button>
      ))}
    </div>
  );
};
