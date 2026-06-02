import type { Order, OrderStatus, OrderType } from "@/types/restaurant";

export type OrdersStatusFilter = "all" | OrderStatus;
export type OrdersTypeFilter = "all" | OrderType;
export type SortKey = "createdAt" | "total" | "status";
export type SortDir = "asc" | "desc";

export interface OrdersSummary {
    active: number;
    completed: number;
    cancelled: number;
    total: number;
}
