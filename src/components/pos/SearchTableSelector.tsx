import React from 'react';
import { Search, X, Armchair, ChevronDown } from 'lucide-react';
import type { OrderType, Table } from '@/types/restaurant';
import { CustomerSelector } from './CustomerSelector';

interface SearchTableSelectorProps {
  cartOrderType: OrderType;
  cartTableId: string | null;
  setCartTableId: (id: string | null) => void;
  freeTables: Table[];
  search: string;
  setSearch: (v: string) => void;
  customerName: string | null;
  customerPhone: string | null;
  onSelectCustomer: (name: string | null, phone: string | null) => void;
}

export const SearchTableSelector: React.FC<SearchTableSelectorProps> = ({
  cartOrderType, cartTableId, setCartTableId, freeTables, search, setSearch,
  customerName, customerPhone, onSelectCustomer,
}) => {
  return (
    <div className="flex flex-wrap gap-2.5">
      {cartOrderType === 'dinein' && (
        <div className="relative w-[160px] lg:w-[180px] shrink-0">
          <Armchair className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={cartTableId || ''}
            onChange={(e) => setCartTableId(e.target.value || null)}
            className="w-full appearance-none pl-10 pr-8 py-2.5 rounded-xl border border-border/50 bg-card text-xs lg:text-sm focus:ring-2 focus:ring-primary/20 transition-shadow"
          >
            <option value="">Assign table...</option>
            {freeTables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.seats} seats
              </option>
            ))}
          </select>
        </div>
      )}

      <CustomerSelector
        customerName={customerName}
        customerPhone={customerPhone}
        onSelect={onSelectCustomer}
      />

      <div className="relative flex-1 min-w-[140px]">
        <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-card text-xs lg:text-sm focus:ring-2 focus:ring-primary/20 transition-shadow"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
