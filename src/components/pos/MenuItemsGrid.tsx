import React from 'react';
import { Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MenuItem, MenuCategory, OrderItem } from '@/types/restaurant';

interface MenuItemsGridProps {
  filteredItems: MenuItem[];
  categories: MenuCategory[];
  cart: OrderItem[];
  addToCart: (item: MenuItem) => void;
}

export const MenuItemsGrid: React.FC<MenuItemsGridProps> = ({
  filteredItems, categories, cart, addToCart
}) => {
  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <Search className="h-8 w-8 opacity-20 mb-2" />
        <p className="text-sm ">No items found</p>
        <p className="text-xs mt-1 opacity-60">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
      {filteredItems.map((item) => {
        const cat = categories.find((c) => c.id === item.categoryId);
        const inCart = cart.find((c) => c.menuItemId === item.id);
        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => addToCart(item)}
            className={cn(
              'glass-card rounded-2xl overflow-hidden text-left hover-lift group relative transition-all border-border/40',
              inCart && 'ring-2 ring-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.15)]'
            )}
          >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-4xl">{cat?.icon || '🍽️'}</span>
                </div>
              )}
              
              {/* Overlay for better readability of floating elements */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Prep Time Badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[10px] text-white font-medium border border-white/10">
                <Clock className="h-3 w-3" /> {item.prepTime}m
              </div>

              {/* Cart Qty Badge */}
              {inCart && (
                <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-background">
                  {inCart.qty}
                </div>
              )}

              {/* Category Icon Badge (if image exists) */}
              {item.image && (
                <div className="absolute top-2 left-2 h-7 w-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-sm border border-white/20 shadow-sm">
                  {cat?.icon || '🍽️'}
                </div>
              )}
            </div>

            {/* Content Container */}
            <div className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-semibold group-hover:text-primary transition-colors line-clamp-1 leading-tight mb-1">
                {item.name}
              </h3>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed h-8 mb-2">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-bold text-primary">
                  ${item.price.toFixed(2)}
                </span>
                {item.popularity && item.popularity > 9 && (
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Popular
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
