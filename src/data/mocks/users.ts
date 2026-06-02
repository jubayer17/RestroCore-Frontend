import type { User } from '@/types/restaurant';

export const seedUsers: User[] = [
  { id: 'user-1', name: 'Maria Santos', email: 'maria@resto.com', phone: '+1234567890', role: 'admin', hourlyRate: 35, active: true },
  { id: 'user-2', name: 'Chef Antonio', email: 'antonio@resto.com', phone: '+1234567891', role: 'chef', hourlyRate: 30, active: true },
  { id: 'user-3', name: 'James Wilson', email: 'james@resto.com', phone: '+1234567892', role: 'manager', hourlyRate: 28, active: true },
  { id: 'user-4', name: 'Emily Chen', email: 'emily@resto.com', phone: '+1234567893', role: 'cashier', hourlyRate: 18, active: true },
  { id: 'user-5', name: 'Alex Rivera', email: 'alex@resto.com', phone: '+1234567894', role: 'waiter', hourlyRate: 16, active: true },
  { id: 'user-6', name: 'Sam Johnson', email: 'sam@resto.com', phone: '+1234567895', role: 'waiter', hourlyRate: 16, active: true },
];
