import type { Order } from "@/types/restaurant";

export type TimeCell = { key: string; day: string; hour: number; count: number; revenue: number; aov: number };
export type RegionCell = { key: string; region: string; hour: number; count: number; revenue: number; aov: number };

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function deriveRegion(o: Order): string {
  const addrValue = (o as unknown as { address?: unknown }).address;
  const addr = typeof addrValue === "string" ? addrValue.toLowerCase() : "";
  if (!addr) return "Other";
  if (addr.includes("downtown")) return "Downtown";
  if (addr.includes("midtown")) return "Midtown";
  if (addr.includes("uptown")) return "Uptown";
  if (addr.includes("suburb") || addr.includes("suburbs")) return "Suburbs";
  return "Other";
}

export function buildTimeHeatmap(orders: Order[], startHour = 10, endHour = 22) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const grid: Record<string, TimeCell> = {};
  let max = 0;
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const day = days[d.getDay()];
    const h = d.getHours();
    if (h < startHour || h >= endHour) return;
    const key = `${day}-${h}`;
    if (!grid[key]) grid[key] = { key, day, hour: h, count: 0, revenue: 0, aov: 0 };
    grid[key].count += 1;
    grid[key].revenue += o.total || 0;
    if (grid[key].count > max) max = grid[key].count;
  });
  Object.values(grid).forEach((c) => {
    c.aov = c.count ? Math.round(c.revenue / c.count) : 0;
  });
  return { days, hours, grid, max };
}

export function buildRegionHeatmap(orders: Order[], startHour = 10, endHour = 22) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const regions = ["Downtown", "Midtown", "Uptown", "Suburbs", "Other"];
  const grid: Record<string, RegionCell> = {};
  let max = 0;
  orders.forEach((o) => {
    const region = deriveRegion(o);
    const d = new Date(o.createdAt);
    const h = d.getHours();
    if (h < startHour || h >= endHour) return;
    const key = `${region}-${h}`;
    if (!grid[key]) grid[key] = { key, region, hour: h, count: 0, revenue: 0, aov: 0 };
    grid[key].count += 1;
    grid[key].revenue += o.total || 0;
    if (grid[key].count > max) max = grid[key].count;
  });
  Object.values(grid).forEach((c) => {
    c.aov = c.count ? Math.round(c.revenue / c.count) : 0;
  });
  return { regions, hours, grid, max };
}
