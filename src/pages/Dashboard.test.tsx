import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Order } from "@/types/restaurant";
import Dashboard from "./Dashboard";
import AppSidebar from "@/components/AppSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("recharts", () => {
  const Mock = () => <div />;
  return {
    ResponsiveContainer: Mock,
    LineChart: Mock,
    Line: Mock,
    AreaChart: Mock,
    Area: Mock,
    BarChart: Mock,
    Bar: Mock,
    PieChart: Mock,
    Pie: Mock,
    Cell: Mock,
    XAxis: Mock,
    YAxis: Mock,
    CartesianGrid: Mock,
    Tooltip: Mock,
  };
});

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children?: unknown }) => <div>{children as never}</div>,
  },
}));

const storeState = vi.hoisted(() => {
  return {
    orders: [] as Order[],
  };
});

vi.mock("@/store/useRestaurantStore", () => ({
  useRestaurantStore: () => ({
    orders: storeState.orders,
    tables: [],
    bookings: [],
    drivers: [],
    inventory: [],
    users: [],
    menuItems: [],
    categories: [],
    settings: { currency: "USD" },
  }),
}));

function makeCompletedOrder(id: string, total: number, createdAt: string): Order {
  return {
    id,
    type: "dinein",
    tableId: undefined,
    items: [
      {
        id: `${id}-i1`,
        menuItemId: "mi-1",
        name: "Item",
        qty: 1,
        price: total,
        modifiers: [],
        notes: "",
        status: "completed",
        station: "general",
      },
    ],
    subtotal: total,
    tax: 0,
    discount: 0,
    total,
    paymentMethod: "cash",
    status: "completed",
    createdAt,
    updatedAt: createdAt,
    assignedTo: undefined,
    customerName: "Guest",
    customerPhone: "000",
    driverId: undefined,
  };
}

describe("Dashboard KPI cards", () => {
  it("replaces the least valuable KPI with a Total Sales card", () => {
    storeState.orders = [
      makeCompletedOrder("o-1", 25, "2026-03-10T10:00:00Z"),
      makeCompletedOrder("o-2", 30, "2026-03-11T11:00:00Z"),
    ];

    render(
      <MemoryRouter>
        <TooltipProvider>
          <Dashboard />
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Total Sales")).toBeInTheDocument();
    expect(screen.queryByText("Avg Ticket Size")).not.toBeInTheDocument();
  });
});

describe("Navigation links smoke test", () => {
  it("renders all sidebar navigation items with valid routes", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppSidebar />
      </MemoryRouter>,
    );

    const expectedLinks: Array<{ label: string; to: string }> = [
      { label: "Dashboard", to: "/" },
      { label: "Analytics", to: "/analytics" },
      { label: "Point of Sale", to: "/point-of-sale" },
      { label: "Orders", to: "/orders" },
      { label: "Floor Plan", to: "/floor-plan" },
      { label: "Kitchen (KDS)", to: "/kitchen-kds" },
      { label: "Delivery", to: "/delivery" },
      { label: "Reservations", to: "/reservations" },
      { label: "Menu Builder", to: "/menu-builder" },
      { label: "Inventory", to: "/inventory" },
      { label: "Customers", to: "/customers" },
      { label: "Staff", to: "/staff" },
      { label: "Settings", to: "/settings" },
    ];

    expectedLinks.forEach(({ label, to }) => {
      const el = screen.getByText(label);
      const a = el.closest("a");
      expect(a).toBeTruthy();
      expect(a?.getAttribute("href")).toBe(to);
    });
  });
});
