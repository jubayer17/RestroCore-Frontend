import { useState } from 'react';
import { Percent, Tag, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const PROMO_CODES: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
  'WELCOME10': { type: 'percent', value: 10, label: '10% Welcome Discount' },
  'SAVE5': { type: 'fixed', value: 5, label: '$5 Off' },
  'VIP20': { type: 'percent', value: 20, label: '20% VIP Discount' },
  'LUNCH15': { type: 'percent', value: 15, label: '15% Lunch Special' },
};

interface DiscountPanelProps {
  subtotal: number;
  onApplyDiscount: (amount: number, label: string) => void;
  onClearDiscount: () => void;
  activeDiscount: { amount: number; label: string } | null;
}

export default function DiscountPanel({ subtotal, onApplyDiscount, onClearDiscount, activeDiscount }: DiscountPanelProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [tab, setTab] = useState<'quick' | 'code'>('quick');

  const quickDiscounts = [
    { label: '5%', type: 'percent' as const, value: 5 },
    { label: '10%', type: 'percent' as const, value: 10 },
    { label: '15%', type: 'percent' as const, value: 15 },
    { label: '$5', type: 'fixed' as const, value: 5 },
    { label: '$10', type: 'fixed' as const, value: 10 },
    { label: '$20', type: 'fixed' as const, value: 20 },
  ];

  const applyQuick = (type: 'percent' | 'fixed', value: number, label: string) => {
    const amount = type === 'percent' ? subtotal * (value / 100) : value;
    onApplyDiscount(Math.min(amount, subtotal), `${label} discount`);
    setOpen(false);
  };

  const applyCode = () => {
    const promo = PROMO_CODES[code.toUpperCase().trim()];
    if (!promo) {
      setCodeError('Invalid promo code');
      return;
    }
    const amount = promo.type === 'percent' ? subtotal * (promo.value / 100) : promo.value;
    onApplyDiscount(Math.min(amount, subtotal), promo.label);
    setCode('');
    setCodeError('');
    setOpen(false);
  };

  return (
  <div className="relative">
      {activeDiscount ? (
    <div className="flex items-center justify-between bg-fresh/10 rounded-lg px-3 py-2">
     <div className="flex items-center gap-2">
      <Check className="h-3.5 w-3.5 text-fresh" />
      <span className="text-[11px] text-fresh">{activeDiscount.label}</span>
          </div>
     <div className="flex items-center gap-2">
      <span className="text-[12px] text-fresh">-${activeDiscount.amount.toFixed(2)}</span>
      <button onClick={onClearDiscount} className="text-muted-foreground hover:text-destructive">
       <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
     className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors"
        >
     <Tag className="h-3 w-3" /> Apply discount or coupon
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
      className="absolute bottom-full left-0 right-0 mb-2 glass-card rounded-xl p-3 z-20 space-y-3"
          >
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setTab('quick')}
        className={cn('flex-1 px-2 py-1.5 rounded-md text-[10px] transition-all', tab === 'quick' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                Quick Discount
              </button>
              <button
                onClick={() => setTab('code')}
        className={cn('flex-1 px-2 py-1.5 rounded-md text-[10px] transition-all', tab === 'code' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                Promo Code
              </button>
            </div>

            {tab === 'quick' ? (
       <div className="grid grid-cols-3 gap-1.5">
                {quickDiscounts.map(d => (
                  <button
                    key={d.label}
                    onClick={() => applyQuick(d.type, d.value, d.label)}
          className="py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-xs transition-colors"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            ) : (
       <div className="space-y-2">
        <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter promo code..."
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setCodeError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && applyCode()}
          className="flex-1 px-3 py-2 rounded-lg border bg-background text-xs "
                  />
         <button onClick={applyCode} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs hover:opacity-90 transition-opacity">
                    Apply
                  </button>
                </div>
        {codeError && <p className="text-[10px] text-destructive ">{codeError}</p>}
        <p className="text-[9px] text-muted-foreground">Try: WELCOME10, SAVE5, VIP20, LUNCH15</p>
              </div>
            )}

      <button onClick={() => setOpen(false)} className="w-full text-[10px] text-muted-foreground hover:text-foreground py-1">
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
