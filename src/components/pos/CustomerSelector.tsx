import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, X, Phone, ChevronDown, Search } from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { NewCustomerModal, type NewCustomerData } from './NewCustomerModal';

interface CustomerSelectorProps {
  customerName: string | null;
  customerPhone: string | null;
  onSelect: (name: string | null, phone: string | null) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customerName,
  customerPhone,
  onSelect,
}) => {
  const { customers, addCustomer } = useRestaurantStore();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search by name OR phone number
  const filtered = useMemo(() => {
    if (!query) return customers;
    const q = query.toLowerCase().replace(/\s/g, '');
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.replace(/\s/g, '').includes(q)
    );
  }, [customers, query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      const dd = document.getElementById('cust-dd');
      if (dd?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const openDropdown = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setQuery('');
    setOpen(true);
  };

  const pick = (name: string, phone: string) => {
    onSelect(name, phone || null);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null, null);
  };

  const handleNewCustomer = (data: NewCustomerData) => {
    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      location: data.location,
      createdAt: new Date().toISOString(),
    };
    addCustomer(newCustomer);
    onSelect(data.name, data.phone || null);
    setModalOpen(false);
    setOpen(false);
  };

  const dropdown = open && dropdownPos ? createPortal(
    <div
      id="cust-dd"
      style={{ position: 'fixed', top: dropdownPos.top, left: Math.min(dropdownPos.left, window.innerWidth - 280), width: Math.min(272, window.innerWidth - 16), zIndex: 9999 }}
      className="bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Name or phone number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/60"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Customer list */}
      <div className="max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-5 text-center text-xs text-muted-foreground">No customers found</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.name, c.phone)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5 shrink-0" />
                  <span>{c.phone || '—'}</span>
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Add new */}
      <div className="border-t border-border/40 p-2">
        <button
          onClick={() => { setOpen(false); setModalOpen(true); }}
          className="w-full py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/8 transition-colors"
        >
          + Add New Customer
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={wrapperRef} className="relative w-[160px] lg:w-[200px] shrink-0">
      {/* Trigger — exactly matches the table selector style */}
      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />

      {customerName ? (
        // Selected state: show name + clear button
        <div
          onClick={openDropdown}
          className="w-full flex items-center pl-10 pr-8 py-2.5 rounded-xl border border-primary/30 bg-card text-xs lg:text-sm cursor-pointer focus:ring-2 focus:ring-primary/20 transition-shadow select-none"
        >
          <span className="flex-1 truncate text-foreground">{customerName}</span>
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        // Empty state: matches table <select> exactly
        <>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <button
            type="button"
            onClick={openDropdown}
            className="w-full appearance-none pl-10 pr-8 py-2.5 rounded-xl border border-border/50 bg-card text-xs lg:text-sm text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-shadow text-left"
          >
            Customer...
          </button>
        </>
      )}

      {dropdown}

      <NewCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleNewCustomer}
      />
    </div>
  );
};
