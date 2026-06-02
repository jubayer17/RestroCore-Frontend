import type { Booking } from '@/types/restaurant';

const now = new Date();

export const seedBookings: Booking[] = [
  { id: 'bk-1', customerName: 'Thompson Party', customerPhone: '+1555000001', tableIds: ['t-4'], datetime: new Date(now.getTime() + 3600000).toISOString(), partySize: 6, status: 'confirmed', notes: 'Birthday celebration' },
  { id: 'bk-2', customerName: 'Williams', customerPhone: '+1555000002', tableIds: ['t-1'], datetime: new Date(now.getTime() + 7200000).toISOString(), partySize: 2, status: 'confirmed', notes: 'Anniversary dinner' },
  { id: 'bk-3', customerName: 'Garcia Group', customerPhone: '+1555000003', tableIds: ['t-6'], datetime: new Date(now.getTime() + 10800000).toISOString(), partySize: 8, status: 'pending', notes: 'Business dinner' },
];
