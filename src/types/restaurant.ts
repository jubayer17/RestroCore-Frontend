// Restaurant Management System - Core Data Models

export type OrderType = 'dinein' | 'takeaway' | 'delivery' | 'pickup';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type TableStatus = 'free' | 'reserved' | 'occupied' | 'dirty' | 'cleaning';
export type TableShape = 'round' | 'square' | 'rectangular';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'mixed';
export type UserRole = 'admin' | 'manager' | 'cashier' | 'chef' | 'waiter' | 'driver' | 'accountant';
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'no-show' | 'completed';
export type DriverStatus = 'available' | 'busy' | 'offline';
export type KDSStation = 'grill' | 'fryer' | 'salad' | 'drinks' | 'dessert' | 'general';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  hourlyRate: number;
  active: boolean;
}

export interface ModifierChoice {
  id: string;
  label: string;
  price: number;
}

export interface Modifier {
  id: string;
  name: string;
  choices: ModifierChoice[];
  required: boolean;
  maxSelect: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  image?: string;
  prepTime: number;
  stations: KDSStation[];
  available: boolean;
  modifiers: string[]; // modifier IDs
  dietary?: string[];
  popularity?: number;
  ingredients?: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  rating?: number;
  reviewCount?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  qty: number;
  price: number;
  modifiers: { name: string; choice: string; price: number }[];
  notes: string;
  status: OrderStatus;
  station: KDSStation;
}

export interface Order {
  id: string;
  type: OrderType;
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  customerName?: string;
  customerPhone?: string;
  driverId?: string;
}

export interface Table {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
  shape: TableShape;
  x: number;
  y: number;
  zone: string;
  currentOrderId?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  tableIds: string[];
  datetime: string;
  partySize: number;
  status: BookingStatus;
  notes: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  currentOrderId?: string;
}

export interface InventorySKU {
  id: string;
  name: string;
  unit: string;
  qtyOnHand: number;
  reorderPoint: number;
  image?: string;
  targetLevel?: number;
  suggestedRestock?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
