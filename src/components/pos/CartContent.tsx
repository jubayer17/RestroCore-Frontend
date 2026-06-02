import React from 'react';
import { ShoppingCart, Minus, Plus, StickyNote, Trash2, Banknote, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import DiscountPanel from '@/components/DiscountPanel';
import type { OrderItem } from '@/types/restaurant';
import type { POSDiscount } from './pos-types';

interface CartContentProps {
  cart: OrderItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  totalItems: number;
  discount: POSDiscount | null;
  setDiscount: (d: POSDiscount | null) => void;
  updateCartItemQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  handlePlaceOrder: (method: 'cash' | 'card') => void;
  itemNotes: Record<string, string>;
  setItemNotes: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  editingNote: string | null;
  setEditingNote: (id: string | null) => void;
}

export const CartContent: React.FC<CartContentProps> = ({
  cart, subtotal, discountAmount, tax, total, totalItems,
  discount, setDiscount, updateCartItemQty, removeFromCart, clearCart,
  handlePlaceOrder, itemNotes, setItemNotes, editingNote, setEditingNote
}) => {
  const { menuItems, settings } = useRestaurantStore();

  return (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 lg:h-full text-muted-foreground p-8">
            <div className="h-16 w-16 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
              <ShoppingCart className="h-7 w-7 opacity-30" />
            </div>
            <p className="text-sm ">No items yet</p>
            <p className="text-xs mt-1 opacity-60">Tap menu items to start an order</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            <AnimatePresence>
              {cart.map((item, index) => {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    className="px-4 py-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-border/50">
                        {menuItem?.image ? (
                          <img
                            src={menuItem.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center text-lg">
                            🍽️
                          </div>
                        )}
                        <div className="absolute top-0 left-0 bg-black/40 text-[9px] text-white px-1 font-mono">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">${item.price.toFixed(2)} each</p>
                        {itemNotes[item.id] && (
                          <p className="text-[11px] text-primary/80 mt-1 italic">📝 {itemNotes[item.id]}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                          <button
                            onClick={() => updateCartItemQty(item.id, item.qty - 1)}
                            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-destructive/15 hover:text-destructive transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs w-6 text-center tabular-nums font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateCartItemQty(item.id, item.qty + 1)}
                            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-primary/15 hover:text-primary transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">${(item.price * item.qty).toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Actions row */}
                    <div className="flex items-center gap-2 mt-2 ml-[60px]">
                      {editingNote === item.id ? (
                        <div className="flex gap-1.5 flex-1">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Add a note..."
                            value={itemNotes[item.id] || ''}
                            onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingNote(null)}
                            className="flex-1 px-2 py-1 rounded-md border border-border/50 bg-muted/20 text-[11px] focus:ring-1 focus:ring-primary/30"
                          />
                          <button onClick={() => setEditingNote(null)} className="text-[11px] text-primary font-medium">Done</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingNote(item.id)}
                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 uppercase tracking-wider font-bold"
                          >
                            <StickyNote className="h-3 w-3" /> Note
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 ml-auto uppercase tracking-wider font-bold"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
        }</div>

      {/* Totals & Pay */}
      <div className="border-t border-border/50 bg-card shrink-0">
        {cart.length > 0 && (
          <div className="px-4 pt-3">
            <DiscountPanel
              subtotal={subtotal}
              onApplyDiscount={(amount, label) => setDiscount({ amount, label })}
              onClearDiscount={() => setDiscount(null)}
              activeDiscount={discount}
            />
          </div>
        )}
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal ({totalItems} items)</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-fresh ">
              <span>Discount</span>
              <span className="tabular-nums">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax ({settings.taxRate}%)</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg border-t border-border/50 pt-2.5 mt-2">
            <span>Total</span>
            <span className="text-gradient-gold tabular-nums">${total.toFixed(2)}</span>
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handlePlaceOrder('cash')}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-2.5 bg-fresh text-fresh-foreground py-3.5 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-40 premium-shadow active:scale-[0.98]"
            >
              <Banknote className="h-5 w-5" /> Pay Cash
            </button>
            <button
              onClick={() => handlePlaceOrder('card')}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-2.5 bg-primary text-primary-foreground py-3.5 rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-40 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <CreditCard className="h-5 w-5" /> Pay Card
            </button>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => { clearCart(); setDiscount(null); setItemNotes({}); }}
              className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1.5 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3 w-3" /> Clear entire order
            </button>
          )}
        </div>
      </div>
    </>
  );
};
