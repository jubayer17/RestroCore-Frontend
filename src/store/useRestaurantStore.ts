import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Order, Table, Booking, MenuItem, MenuCategory, User, Driver, InventorySKU, AuditLog, OrderItem, OrderType, BookingStatus, Customer } from '@/types/restaurant';
import type { RestaurantSettings } from '@/types/settings';
import { seedOrders, seedTables, seedMenuItems, seedCategories, seedUsers, seedDrivers, seedBookings, seedInventory, seedCustomers } from '@/data/seed';

const memoryStorage = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (name: string) => (Object.prototype.hasOwnProperty.call(store, name) ? store[name] : null),
    setItem: (name: string, value: string) => {
      store[name] = value;
    },
    removeItem: (name: string) => {
      delete store[name];
    },
  };
})();

const defaultSettings: RestaurantSettings = {
  restaurantName: 'RestroCore',
  currency: 'USD',
  taxRate: 10,
  timezone: 'America/New_York',
  address: '123 Culinary Lane, New York, NY 10001',
  phone: '+1 (555) 123-4567',
  email: 'hello@restrocore.com',
  website: 'www.restrocore.com',
  taxId: 'VAT-00000000',
  logoUrl: '',
  receiptFooter: 'Thank you for your business!',
  invoicePaperSize: 'a4',
  invoiceCompact: true,
  defaultPrepTimeMinutes: 10,
  inventoryTargetMultiplier: 3,
  notifyNewOrders: true,
  notifyLowStock: true,
  notifyBookings: true,
  notifyKitchenOverdue: false,
  notifyDailySummary: false,
};

const computeNextOrderNumber = (orders: Order[]): number => {
  const base = 3154;
  let maxSeen = base - 1;
  for (const o of orders) {
    const m = /^o-(\d+)$/.exec(o.id);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n)) maxSeen = Math.max(maxSeen, n);
  }
  return Math.max(base, maxSeen + 1);
};

interface RestaurantStore {
  // Auth
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;

  // Data
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  users: User[];
  drivers: Driver[];
  bookings: Booking[];
  inventory: InventorySKU[];
  customers: Customer[];
  auditLogs: AuditLog[];
  zones: string[];
  settings: RestaurantSettings;
  nextOrderNumber: number;
  takeNextOrderNumber: () => number;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Cart (POS)
  cart: OrderItem[];
  cartOrderType: OrderType;
  cartTableId: string | null;
  cartCustomerName: string | null;
  cartCustomerPhone: string | null;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  setCartOrderType: (type: OrderType) => void;
  setCartTableId: (id: string | null) => void;
  setCartCustomer: (name: string | null, phone: string | null) => void;

  // Order Actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;

  // Table Actions
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  updateTablePosition: (tableId: string, x: number, y: number) => void;
  addTable: (table: Table) => void;
  deleteTable: (tableId: string) => void;
  updateTableProps: (tableId: string, updates: Partial<Table>) => void;
  setTables: (tables: Table[]) => void;
  addZone: (zoneName: string) => void;
  renameZone: (oldName: string, newName: string) => void;
  deleteZone: (zoneName: string) => void;

  // Booking Actions
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;

  // Menu Actions
  toggleMenuItemAvailability: (itemId: string) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;

  // Inventory Actions
  adjustStock: (itemId: string, qty: number) => void;
  addInventoryItem: (item: InventorySKU) => void;
  updateInventoryItem: (itemId: string, updates: Partial<InventorySKU>) => void;

  // Customer Actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;

  // Staff Actions
  addUser: (user: User) => void;
  toggleUserActive: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;

  // Driver Actions
  assignDriver: (orderId: string, driverId: string) => void;
  updateDriverStatus: (driverId: string, status: Driver['status']) => void;

  // Settings
  updateSettings: (updates: Partial<RestaurantSettings>) => void;

  // Audit
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

export const useRestaurantStore = create<RestaurantStore>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      userEmail: null,
      login: (email: string) => set({ isAuthenticated: true, userEmail: email }),
      logout: () => set({ isAuthenticated: false, userEmail: null }),

      orders: seedOrders,
      tables: seedTables,
      menuItems: seedMenuItems,
      categories: seedCategories,
      users: seedUsers,
      drivers: seedDrivers,
      bookings: seedBookings,
      inventory: seedInventory,
      customers: seedCustomers,
      auditLogs: [],
      zones: [...new Set(seedTables.map(t => t.zone))],
      settings: defaultSettings,
      nextOrderNumber: computeNextOrderNumber(seedOrders),
      takeNextOrderNumber: () => {
        const n = get().nextOrderNumber;
        set({ nextOrderNumber: n + 1 });
        return n;
      },

      darkMode: false,
      toggleDarkMode: () => {
        set((s) => {
          const next = !s.darkMode;
          document.documentElement.classList.toggle('dark', next);
          return { darkMode: next };
        });
      },

      cart: [],
      cartOrderType: 'dinein',
      cartTableId: null,
      cartCustomerName: null,
      cartCustomerPhone: null,

      addToCart: (item) => {
        const existing = get().cart.find((c) => c.menuItemId === item.id);
        if (existing) {
          set((s) => ({
            cart: s.cart.map((c) => c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c),
          }));
        } else {
          const orderItem: OrderItem = {
            id: `ci-${Date.now()}`,
            menuItemId: item.id,
            name: item.name,
            qty: 1,
            price: item.price,
            modifiers: [],
            notes: '',
            status: 'pending',
            station: item.stations[0] || 'general',
          };
          set((s) => ({ cart: [...s.cart, orderItem] }));
        }
      },

      removeFromCart: (itemId) => set((s) => ({ cart: s.cart.filter((c) => c.id !== itemId) })),

      updateCartItemQty: (itemId, qty) => {
        if (qty <= 0) return get().removeFromCart(itemId);
        set((s) => ({ cart: s.cart.map((c) => c.id === itemId ? { ...c, qty } : c) }));
      },

      clearCart: () => set({ cart: [], cartTableId: null, cartCustomerName: null, cartCustomerPhone: null }),

      setCartOrderType: (type) => set({ cartOrderType: type }),
      setCartTableId: (id) => set({ cartTableId: id }),
      setCartCustomer: (name, phone) => set({ cartCustomerName: name, cartCustomerPhone: phone }),

      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),

      updateOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o),
        })),

      updateOrderItemStatus: (orderId, itemId, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, items: o.items.map((i) => i.id === itemId ? { ...i, status } : i), updatedAt: new Date().toISOString() }
              : o
          ),
        })),

      updateTableStatus: (tableId, status) =>
        set((s) => ({
          tables: s.tables.map((t) => t.id === tableId ? { ...t, status } : t),
        })),

      updateTablePosition: (tableId, x, y) =>
        set((s) => ({
          tables: s.tables.map((t) => t.id === tableId ? { ...t, x, y } : t),
        })),

      addTable: (table) => set((s) => ({ tables: [...s.tables, table] })),

      deleteTable: (tableId) => set((s) => ({ tables: s.tables.filter((t) => t.id !== tableId) })),

      updateTableProps: (tableId, updates) =>
        set((s) => ({
          tables: s.tables.map((t) => t.id === tableId ? { ...t, ...updates } : t),
        })),

      setTables: (tables) => set({ tables }),

      addZone: (zoneName) =>
        set((s) => ({
          zones: [...new Set([...s.zones, zoneName])],
        })),

      renameZone: (oldName, newName) =>
        set((s) => ({
          zones: s.zones.map((z) => (z === oldName ? newName : z)),
          tables: s.tables.map((t) => (t.zone === oldName ? { ...t, zone: newName } : t)),
        })),

      deleteZone: (zoneName) =>
        set((s) => ({
          zones: s.zones.filter((z) => z !== zoneName),
          tables: s.tables.filter((t) => t.zone !== zoneName),
        })),

      addBooking: (booking) => set((s) => ({ bookings: [...s.bookings, booking] })),

      updateBookingStatus: (bookingId, status) =>
        set((s) => ({
          bookings: s.bookings.map((b) => b.id === bookingId ? { ...b, status } : b),
        })),

      toggleMenuItemAvailability: (itemId) =>
        set((s) => ({
          menuItems: s.menuItems.map((i) => i.id === itemId ? { ...i, available: !i.available } : i),
        })),

      addMenuItem: (item) => set((s) => ({ menuItems: [...s.menuItems, item] })),

      updateMenuItem: (itemId, updates) =>
        set((s) => ({
          menuItems: s.menuItems.map((i) => i.id === itemId ? { ...i, ...updates } : i),
        })),

      deleteMenuItem: (itemId) =>
        set((s) => ({ menuItems: s.menuItems.filter((i) => i.id !== itemId) })),

      adjustStock: (itemId, qty) =>
        set((s) => ({
          inventory: s.inventory.map((i) => i.id === itemId ? { ...i, qtyOnHand: Math.max(0, i.qtyOnHand + qty) } : i),
        })),

      addInventoryItem: (item) => set((s) => ({ inventory: [...s.inventory, item] })),

      updateInventoryItem: (itemId, updates) =>
        set((s) => ({
          inventory: s.inventory.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
        })),

      addCustomer: (customer) => set((s) => ({ customers: [...s.customers, customer] })),
      updateCustomer: (customerId, updates) =>
        set((s) => ({
          customers: s.customers.map((c) => c.id === customerId ? { ...c, ...updates } : c),
        })),

      addUser: (user) => set((s) => ({ users: [...s.users, user] })),

      toggleUserActive: (userId) =>
        set((s) => ({
          users: s.users.map((u) => u.id === userId ? { ...u, active: !u.active } : u),
        })),

      updateUser: (userId, updates) =>
        set((s) => ({
          users: s.users.map((u) => u.id === userId ? { ...u, ...updates } : u),
        })),

      assignDriver: (orderId, driverId) =>
        set((s) => ({
          orders: s.orders.map((o) => o.id === orderId ? { ...o, driverId } : o),
          drivers: s.drivers.map((d) => d.id === driverId ? { ...d, status: 'busy' as const, currentOrderId: orderId } : d),
        })),

      updateDriverStatus: (driverId, status) =>
        set((s) => ({
          drivers: s.drivers.map((d) => d.id === driverId ? { ...d, status, currentOrderId: status === 'available' ? undefined : d.currentOrderId } : d),
        })),

      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      addAuditLog: (log) =>
        set((s) => ({
          auditLogs: [{ ...log, id: `log-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.auditLogs],
        })),
    }),
    {
      name: 'restrocore-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : memoryStorage)),
      partialize: (s) => ({ isAuthenticated: s.isAuthenticated, userEmail: s.userEmail, darkMode: s.darkMode, settings: s.settings, orders: s.orders, nextOrderNumber: s.nextOrderNumber, customers: s.customers }),
      version: 5,
      migrate: (persisted, version) => {
        if (version === 1) {
          const p = persisted as { isAuthenticated?: boolean; userEmail?: string | null };
          const orders = seedOrders;
          return { ...p, darkMode: false, settings: defaultSettings, orders, nextOrderNumber: computeNextOrderNumber(orders), customers: seedCustomers };
        }
        const p = persisted as { darkMode?: boolean; settings?: Partial<RestaurantSettings>; orders?: typeof seedOrders; nextOrderNumber?: number; customers?: typeof seedCustomers } | undefined;
        const orders = p?.orders?.length ? p.orders : seedOrders;
        const customers = p?.customers?.length ? p.customers : seedCustomers;
        const persistedNextRaw = Number(p?.nextOrderNumber);
        const persistedOk = Number.isFinite(persistedNextRaw) && persistedNextRaw >= 3154 && persistedNextRaw <= 999999;
        const nextOrderNumber = persistedOk ? Math.max(persistedNextRaw, computeNextOrderNumber(orders)) : computeNextOrderNumber(orders);
        return { ...p, settings: { ...defaultSettings, ...(p?.settings || {}) }, darkMode: !!p?.darkMode, orders, nextOrderNumber, customers };
      },
      onRehydrateStorage: () => (state) => {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('dark', !!state?.darkMode);
      },
    }
  )
);
