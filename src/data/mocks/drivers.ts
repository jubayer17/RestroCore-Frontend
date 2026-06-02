import type { Driver } from '@/types/restaurant';

export const seedDrivers: Driver[] = [
  { id: 'drv-1', name: 'Carlos Mendez', phone: '+1234567900', status: 'busy', currentOrderId: 'ord-4' },
  { id: 'drv-2', name: 'Diana Park', phone: '+1234567901', status: 'available' },
  { id: 'drv-3', name: 'Ryan O\'Brien', phone: '+1234567902', status: 'available' },
  { id: 'drv-4', name: 'Nina Patel', phone: '+1234567903', status: 'offline' },
  { id: 'drv-5', name: 'Leo Kim', phone: '+1234567904', status: 'available' },
];
