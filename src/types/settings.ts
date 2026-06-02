export interface RestaurantSettings {
  restaurantName: string;
  currency: string;
  taxRate: number;
  timezone: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logoUrl: string;
  receiptFooter: string;
  invoicePaperSize: 'a4' | 'a5';
  invoiceCompact: boolean;
  defaultPrepTimeMinutes: number;
  inventoryTargetMultiplier: number;
  notifyNewOrders: boolean;
  notifyLowStock: boolean;
  notifyBookings: boolean;
  notifyKitchenOverdue: boolean;
  notifyDailySummary: boolean;
}
