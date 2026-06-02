import type { Table } from '@/types/restaurant';

export const seedTables: Table[] = [
  { id: 't-1', label: 'T1', seats: 2, status: 'free', shape: 'square', x: 50, y: 50, zone: 'Main Floor' },
  { id: 't-2', label: 'T2', seats: 4, status: 'occupied', shape: 'square', x: 200, y: 50, zone: 'Main Floor' },
  { id: 't-3', label: 'T3', seats: 4, status: 'free', shape: 'rectangular', x: 350, y: 50, zone: 'Main Floor' },
  { id: 't-4', label: 'T4', seats: 6, status: 'reserved', shape: 'rectangular', x: 50, y: 200, zone: 'Main Floor' },
  { id: 't-5', label: 'T5', seats: 2, status: 'dirty', shape: 'round', x: 200, y: 200, zone: 'Main Floor' },
  { id: 't-6', label: 'T6', seats: 8, status: 'free', shape: 'rectangular', x: 350, y: 200, zone: 'Main Floor' },
  { id: 't-7', label: 'T7', seats: 2, status: 'occupied', shape: 'round', x: 50, y: 350, zone: 'Patio' },
  { id: 't-8', label: 'T8', seats: 4, status: 'free', shape: 'square', x: 200, y: 350, zone: 'Patio' },
  { id: 't-9', label: 'T9', seats: 6, status: 'cleaning', shape: 'rectangular', x: 350, y: 350, zone: 'Patio' },
  { id: 't-10', label: 'T10', seats: 4, status: 'free', shape: 'round', x: 500, y: 200, zone: 'Bar' },
];
