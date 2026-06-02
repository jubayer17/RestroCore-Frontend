import React from 'react';
import { Utensils, Package, Truck, Store } from 'lucide-react';
import type { OrderType } from '@/types/restaurant';

export const orderTypes: { value: OrderType; label: string; icon: React.ReactNode }[] = [
  { value: 'dinein', label: 'Dine In', icon: <Utensils className="h-4 w-4" /> },
  { value: 'takeaway', label: 'Takeaway', icon: <Package className="h-4 w-4" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="h-4 w-4" /> },
  { value: 'pickup', label: 'Pickup', icon: <Store className="h-4 w-4" /> },
];
