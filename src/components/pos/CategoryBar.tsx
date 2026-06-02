import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/restaurant';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  showLeftArrow: boolean;
  showRightArrow: boolean;
  scrollCategories: (direction: 'left' | 'right') => void;
  categoryScrollRef: React.RefObject<HTMLDivElement>;
  checkScroll: () => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories, selectedCategory, setSelectedCategory,
  showLeftArrow, showRightArrow, scrollCategories,
  categoryScrollRef, checkScroll
}) => {
  return (
    <div className="relative border-b border-border/50 bg-card/20 shrink-0 group/cats">
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => scrollCategories('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-14 lg:w-16 bg-gradient-to-r from-background via-background/80 to-transparent flex items-center justify-start pl-2 lg:pl-3 text-muted-foreground hover:text-primary transition-all hidden sm:flex backdrop-blur-[2px]"
          >
            <div className="h-8 w-8 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ChevronLeft className="h-5 w-5" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <div 
        ref={categoryScrollRef}
        onScroll={checkScroll}
        className="flex gap-1.5 px-3 sm:px-4 lg:px-5 py-3 overflow-x-auto scrollbar-none"
      >
        <button
          onClick={() => setSelectedCategory('')}
          className={cn(
            'px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold whitespace-nowrap transition-all shrink-0',
            !selectedCategory
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 hover:bg-muted text-muted-foreground'
          )}
        >
          🍽️ All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold whitespace-nowrap transition-all shrink-0',
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            )}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={() => scrollCategories('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-14 lg:w-16 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-2 lg:pr-3 text-muted-foreground hover:text-primary transition-all hidden sm:flex backdrop-blur-[2px]"
          >
            <div className="h-8 w-8 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ChevronRight className="h-5 w-5" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
