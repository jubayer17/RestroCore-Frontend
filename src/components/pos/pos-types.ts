import type { Order, OrderType, MenuItem } from "@/types/restaurant";

export interface POSDiscount {
  amount: number;
  label: string;
}

export interface POSState {
  selectedCategory: string;
  search: string;
  cartOpen: boolean;
  discount: POSDiscount | null;
  itemNotes: Record<string, string>;
  editingNote: string | null;
  activeOrder: Order | null;
  isPreviewOpen: boolean;
  showLeftArrow: boolean;
  showRightArrow: boolean;
}
