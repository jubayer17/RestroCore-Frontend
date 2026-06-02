import type { Customer } from '@/types/restaurant';

// Seed from known customers in seed orders (name + phone only, no email/location)
export const seedCustomers: Customer[] = [
  { id: 'cust-1', name: 'John D.', phone: '', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'cust-2', name: 'Sarah M.', phone: '', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'cust-3', name: 'Mike R.', phone: '', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'cust-4', name: 'Lisa K.', phone: '', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'cust-5', name: 'Tom B.', phone: '', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];
