import type { InventorySKU } from '@/types/restaurant';

export const seedInventory: InventorySKU[] = [
  { id: 'inv-1', name: 'Beef Ribeye', unit: 'kg', qtyOnHand: 15, reorderPoint: 5, targetLevel: 15, suggestedRestock: 0, image: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-2', name: 'Salmon Fillet', unit: 'kg', qtyOnHand: 8, reorderPoint: 3, targetLevel: 9, suggestedRestock: 1, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-3', name: 'Pizza Dough', unit: 'balls', qtyOnHand: 30, reorderPoint: 10, targetLevel: 30, suggestedRestock: 0, image: 'https://images.unsplash.com/photo-1542837359-68d5b2be96b9?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-4', name: 'Mozzarella', unit: 'kg', qtyOnHand: 12, reorderPoint: 4, targetLevel: 12, suggestedRestock: 0, image: 'https://images.unsplash.com/photo-1604909052591-8b1b2c718376?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-5', name: 'Burger Buns', unit: 'pcs', qtyOnHand: 3, reorderPoint: 15, targetLevel: 45, suggestedRestock: 42, image: 'https://images.unsplash.com/photo-1617196034336-85ad5e2ad653?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-6', name: 'Romaine Lettuce', unit: 'heads', qtyOnHand: 20, reorderPoint: 8, targetLevel: 24, suggestedRestock: 4, image: 'https://images.unsplash.com/photo-1540411025311-1129d7baf3b6?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-7', name: 'Espresso Beans', unit: 'kg', qtyOnHand: 5, reorderPoint: 2, targetLevel: 6, suggestedRestock: 1, image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-8', name: 'Truffle Oil', unit: 'bottles', qtyOnHand: 2, reorderPoint: 3, targetLevel: 9, suggestedRestock: 7, image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-9', name: 'Heavy Cream', unit: 'liters', qtyOnHand: 10, reorderPoint: 4, targetLevel: 12, suggestedRestock: 2, image: 'https://images.unsplash.com/photo-1514846160150-2cfb9af4f7f4?auto=format&fit=crop&q=80&w=640' },
  { id: 'inv-10', name: 'Parmesan Block', unit: 'kg', qtyOnHand: 6, reorderPoint: 2, targetLevel: 6, suggestedRestock: 0, image: 'https://images.unsplash.com/photo-1512058564366-c9e3e046d4e2?auto=format&fit=crop&q=80&w=640' },
];
