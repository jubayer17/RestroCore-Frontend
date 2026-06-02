import type { Order } from '@/types/restaurant';

const now = new Date();
const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();

export const seedOrders: Order[] = [
  { id: 'ord-1', type: 'dinein', tableId: 't-2', items: [
    { id: 'oi-1', menuItemId: 'item-4', name: 'Grilled Ribeye', qty: 1, price: 34.99, modifiers: [], notes: 'Medium rare', status: 'preparing', station: 'grill' },
    { id: 'oi-2', menuItemId: 'item-1', name: 'Caesar Salad', qty: 1, price: 12.99, modifiers: [], notes: '', status: 'ready', station: 'salad' },
  ], subtotal: 47.98, tax: 4.80, discount: 0, total: 52.78, status: 'preparing', createdAt: h(0.5), updatedAt: h(0.2), assignedTo: 'user-5' },
  { id: 'ord-2', type: 'dinein', tableId: 't-7', items: [
    { id: 'oi-3', menuItemId: 'item-7', name: 'Margherita Pizza', qty: 2, price: 16.99, modifiers: [], notes: '', status: 'pending', station: 'grill' },
    { id: 'oi-4', menuItemId: 'item-18', name: 'Craft Lemonade', qty: 2, price: 5.99, modifiers: [], notes: '', status: 'ready', station: 'drinks' },
  ], subtotal: 45.96, tax: 4.60, discount: 0, total: 50.56, status: 'pending', createdAt: h(0.2), updatedAt: h(0.1), assignedTo: 'user-5' },
  { id: 'ord-3', type: 'takeaway', items: [
    { id: 'oi-5', menuItemId: 'item-10', name: 'Classic Burger', qty: 2, price: 15.99, modifiers: [], notes: 'No onions', status: 'preparing', station: 'grill' },
    { id: 'oi-6', menuItemId: 'item-20', name: 'Truffle Fries', qty: 2, price: 8.99, modifiers: [], notes: '', status: 'pending', station: 'fryer' },
  ], subtotal: 49.96, tax: 5.00, discount: 0, total: 54.96, status: 'preparing', createdAt: h(0.3), updatedAt: h(0.15), customerName: 'John D.' },
  { id: 'ord-4', type: 'delivery', items: [
    { id: 'oi-7', menuItemId: 'item-8', name: 'Pepperoni Pizza', qty: 1, price: 18.99, modifiers: [], notes: '', status: 'ready', station: 'grill' },
    { id: 'oi-8', menuItemId: 'item-16', name: 'Tiramisu', qty: 1, price: 10.99, modifiers: [], notes: '', status: 'ready', station: 'dessert' },
  ], subtotal: 29.98, tax: 3.00, discount: 0, total: 32.98, status: 'ready', createdAt: h(1), updatedAt: h(0.4), customerName: 'Sarah M.', driverId: 'drv-1' },
  { id: 'ord-5', type: 'dinein', tableId: 't-2', items: [
    { id: 'oi-9', menuItemId: 'item-13', name: 'Spaghetti Bolognese', qty: 1, price: 16.99, modifiers: [], notes: '', status: 'completed', station: 'general' },
  ], subtotal: 16.99, tax: 1.70, discount: 0, total: 18.69, paymentMethod: 'card', status: 'completed', createdAt: h(3), updatedAt: h(2.5) },
  { id: 'ord-6', type: 'takeaway', items: [
    { id: 'oi-10', menuItemId: 'item-11', name: 'Bacon Cheeseburger', qty: 1, price: 17.99, modifiers: [], notes: '', status: 'completed', station: 'grill' },
    { id: 'oi-11', menuItemId: 'item-19', name: 'Espresso', qty: 2, price: 3.99, modifiers: [], notes: '', status: 'completed', station: 'drinks' },
  ], subtotal: 25.97, tax: 2.60, discount: 0, total: 28.57, paymentMethod: 'cash', status: 'completed', createdAt: h(4), updatedAt: h(3.5), customerName: 'Mike R.' },
  { id: 'ord-7', type: 'delivery', items: [
    { id: 'oi-12', menuItemId: 'item-14', name: 'Fettuccine Alfredo', qty: 1, price: 18.99, modifiers: [], notes: '', status: 'completed', station: 'general' },
    { id: 'oi-13', menuItemId: 'item-17', name: 'Chocolate Lava Cake', qty: 1, price: 11.99, modifiers: [], notes: '', status: 'completed', station: 'dessert' },
  ], subtotal: 30.98, tax: 3.10, discount: 5.00, total: 29.08, paymentMethod: 'card', status: 'completed', createdAt: h(5), updatedAt: h(4), customerName: 'Lisa K.', driverId: 'drv-2' },
  { id: 'ord-8', type: 'dinein', items: [
    { id: 'oi-14', menuItemId: 'item-5', name: 'Pan-Seared Salmon', qty: 2, price: 28.99, modifiers: [], notes: '', status: 'completed', station: 'grill' },
    { id: 'oi-15', menuItemId: 'item-2', name: 'Bruschetta', qty: 1, price: 9.99, modifiers: [], notes: '', status: 'completed', station: 'salad' },
  ], subtotal: 67.97, tax: 6.80, discount: 0, total: 74.77, paymentMethod: 'card', status: 'completed', createdAt: h(6), updatedAt: h(5) },
  { id: 'ord-9', type: 'takeaway', items: [
    { id: 'oi-16', menuItemId: 'item-9', name: 'BBQ Chicken Pizza', qty: 1, price: 19.99, modifiers: [], notes: '', status: 'completed', station: 'grill' },
  ], subtotal: 19.99, tax: 2.00, discount: 0, total: 21.99, paymentMethod: 'cash', status: 'completed', createdAt: h(7), updatedAt: h(6.5), customerName: 'Tom B.' },
  { id: 'ord-10', type: 'dinein', items: [
    { id: 'oi-17', menuItemId: 'item-6', name: 'Chicken Parmesan', qty: 1, price: 22.99, modifiers: [], notes: '', status: 'completed', station: 'grill' },
    { id: 'oi-18', menuItemId: 'item-22', name: 'Garlic Bread', qty: 1, price: 5.99, modifiers: [], notes: '', status: 'completed', station: 'grill' },
    { id: 'oi-19', menuItemId: 'item-18', name: 'Craft Lemonade', qty: 1, price: 5.99, modifiers: [], notes: '', status: 'completed', station: 'drinks' },
  ], subtotal: 34.97, tax: 3.50, discount: 0, total: 38.47, paymentMethod: 'card', status: 'completed', createdAt: h(8), updatedAt: h(7) },
];
