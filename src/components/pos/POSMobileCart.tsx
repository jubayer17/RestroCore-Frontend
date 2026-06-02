import React from 'react';
import { ShoppingCart, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderItem, OrderType } from '@/types/restaurant';

interface POSMobileCartProps {
  cart: OrderItem[];
  total: number;
  totalItems: number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  cartOrderType: OrderType;
  orderNumber?: string | null;
  children: React.ReactNode;
}

export const POSMobileCart: React.FC<POSMobileCartProps> = ({
  cart, total, totalItems, cartOpen, setCartOpen, cartOrderType, orderNumber, children
}) => {
  return (
    <div className="lg:hidden">
      {!cartOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-2.5 bg-primary text-primary-foreground pl-4 pr-5 py-3.5 rounded-full shadow-xl text-sm active:scale-95 transition-transform"
        >
          <ShoppingCart className="h-5 w-5" />
          {cart.length > 0 ? (
            <>
              ${total.toFixed(2)}
              <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs">{totalItems}</span>
            </>
          ) : (
            'Cart'
          )}
          <ChevronUp className="h-4 w-4" />
        </motion.button>
      )}

      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-md z-40"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-xl border-t border-border/50 shadow-2xl max-h-[88vh] flex flex-col"
            >
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className=" text-sm">Current Order</h2>
                    <p className="text-[11px] text-muted-foreground capitalize">{cartOrderType}{cart.length > 0 ? ` • ${totalItems} items` : ''}</p>
                  </div>
                  <span className="text-[11px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm">{orderNumber ? `#${orderNumber}` : '—'}</span>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
