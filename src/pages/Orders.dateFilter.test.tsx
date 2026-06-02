import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { Order } from "@/types/restaurant";
import Orders from "./Orders";
import { getOrderNumber } from "@/lib/orderNumber";

const storeState = vi.hoisted(() => {
  return {
    orders: [] as Order[],
  };
});

const updateOrderStatusMock = vi.hoisted(() => vi.fn());
const downloadInvoicePdfMock = vi.hoisted(() => vi.fn());

const toastFns = vi.hoisted(() => {
  return {
    success: vi.fn(),
    error: vi.fn(),
  };
});

vi.mock("@/store/useRestaurantStore", () => ({
  useRestaurantStore: () => ({
    orders: storeState.orders,
    tables: [],
    users: [],
    drivers: [],
    settings: { currency: "USD" },
    updateOrderStatus: updateOrderStatusMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: toastFns,
}));

vi.mock("@/lib/invoicePdf", () => ({
  downloadInvoicePdf: downloadInvoicePdfMock,
}));

function LocationSearch(): JSX.Element {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function makeOrder(id: string, createdAt: string): Order {
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
        price: 10,
        modifiers: [],
        notes: "",
        status: "pending",
        station: "general",
      },
    ],
    subtotal: 10,
    tax: 0,
    discount: 0,
    total: 10,
    paymentMethod: "cash",
    status: "pending",
    createdAt,
    updatedAt: createdAt,
    assignedTo: undefined,
    customerName: "Guest",
    customerPhone: "000",
    driverId: undefined,
  };
}

function makeOrderWithItems(id: string, createdAt: string, itemCount: number): Order {
  const items = Array.from({ length: itemCount }, (_, i) => {
    const idx = i + 1;
    return {
      id: `${id}-i${idx}`,
      menuItemId: `mi-${idx}`,
      name: `Item ${idx}`,
      qty: 1,
      price: 10,
      modifiers: [],
      notes: "",
      status: "pending" as const,
      station: "general" as const,
    };
  });

  return {
    ...makeOrder(id, createdAt),
    items,
    subtotal: itemCount * 10,
    total: itemCount * 10,
  };
}

function expectOrderVisible(id: string) {
  expect(screen.queryAllByText(`#${getOrderNumber(id)}`).length).toBeGreaterThan(0);
}

function expectOrderHidden(id: string) {
  expect(screen.queryAllByText(`#${getOrderNumber(id)}`).length).toBe(0);
}

async function openCalendar() {
  fireEvent.click(screen.getByRole("button", { name: /order date filter/i }));
  act(() => {
    vi.runOnlyPendingTimers();
  });
  expect(screen.getByRole("dialog", { name: /order date calendar/i })).toBeInTheDocument();
}

async function clickDay(dayOfMonth: number) {
  const dialog = screen.getByRole("dialog", { name: /order date calendar/i });
  const day = String(dayOfMonth).padStart(2, "0");
  const expectedPrefix = "2026-03-";

  const allButtons = Array.from(dialog.querySelectorAll("button")) as HTMLButtonElement[];
  const dayButtons = allButtons.filter((b) => b.getAttribute("name") === "day");

  const btn =
    dayButtons.find((b) => {
      const value = b.getAttribute("value") || "";
      return value.startsWith(expectedPrefix) && value.endsWith(`-${day}`);
    }) ??
    allButtons.find((b) => {
      const label = b.getAttribute("aria-label") || "";
      return label.includes("2026") && label.includes("March") && label.includes(String(dayOfMonth));
    }) ??
    allButtons.find((b) => (b.textContent || "").trim() === String(dayOfMonth));

  expect(btn).toBeTruthy();
  fireEvent.click(btn as HTMLElement);
}

function openOrderDetails(id: string) {
  const buttons = screen.getAllByRole("button", { name: new RegExp(`open order #${getOrderNumber(id)} details`, "i") });
  fireEvent.click(buttons[0]);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0));
  toastFns.success.mockReset();
  toastFns.error.mockReset();
  updateOrderStatusMock.mockReset();
  downloadInvoicePdfMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Orders date range filter", () => {
  it("supports single-day mode (click one date then Enter) and updates URL", async () => {
    storeState.orders = [
      makeOrder("o-10", "2026-03-10T10:00:00"),
      makeOrder("o-11", "2026-03-11T10:00:00"),
      makeOrder("o-12", "2026-03-12T10:00:00"),
    ];

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
        <LocationSearch />
      </MemoryRouter>,
    );

    await act(async () => { });
    expectOrderVisible("o-10");
    expectOrderVisible("o-11");
    expectOrderVisible("o-12");

    await openCalendar();
    await clickDay(11);

    expectOrderVisible("o-10");
    expectOrderVisible("o-11");
    expectOrderVisible("o-12");

    fireEvent.keyUp(screen.getByRole("dialog", { name: /order date calendar/i }), { key: "Enter", code: "Enter" });

    await act(async () => { });
    expectOrderHidden("o-10");
    expectOrderVisible("o-11");
    expectOrderHidden("o-12");

    expect(screen.getByTestId("location-search").textContent).toBe("?start=2026-03-11&end=2026-03-11");
  });

  it("supports range mode (click two different dates) and filters inclusively", async () => {
    storeState.orders = [
      makeOrder("o-10", "2026-03-10T10:00:00"),
      makeOrder("o-11", "2026-03-11T10:00:00"),
      makeOrder("o-12", "2026-03-12T10:00:00"),
    ];

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
        <LocationSearch />
      </MemoryRouter>,
    );

    await act(async () => { });
    expectOrderVisible("o-10");
    expectOrderVisible("o-11");
    expectOrderVisible("o-12");

    await openCalendar();
    await clickDay(10);
    await clickDay(11);

    await act(async () => { });
    expectOrderVisible("o-10");
    expectOrderVisible("o-11");
    expectOrderHidden("o-12");

    expect(screen.getByTestId("location-search").textContent).toBe("?start=2026-03-10&end=2026-03-11");
  });

  it("rejects invalid ranges where end is earlier than start", async () => {
    storeState.orders = [
      makeOrder("o-10", "2026-03-10T10:00:00"),
      makeOrder("o-11", "2026-03-11T10:00:00"),
      makeOrder("o-12", "2026-03-12T10:00:00"),
    ];

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
        <LocationSearch />
      </MemoryRouter>,
    );

    await act(async () => { });
    expectOrderVisible("o-10");
    expectOrderVisible("o-11");
    expectOrderVisible("o-12");

    await openCalendar();
    await clickDay(11);
    await clickDay(10);

    expect(toastFns.error).toHaveBeenCalled();
    expect(screen.getByTestId("location-search").textContent).toBe("");

    expectOrderVisible("o-10");
    expectOrderVisible("o-11");
    expectOrderVisible("o-12");
  });

  it("synchronizes from URL query params on load", async () => {
    storeState.orders = [
      makeOrder("o-10", "2026-03-10T10:00:00"),
      makeOrder("o-11", "2026-03-11T10:00:00"),
      makeOrder("o-12", "2026-03-12T10:00:00"),
    ];

    render(
      <MemoryRouter initialEntries={["/orders?start=2026-03-10&end=2026-03-11"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
        <LocationSearch />
      </MemoryRouter>,
    );

    await act(async () => { });
    expectOrderVisible("o-10");
    expectOrderVisible("o-11");
    expectOrderHidden("o-12");

    expect(screen.getByTestId("location-search").textContent).toBe("?start=2026-03-10&end=2026-03-11");
  });
});

describe("Orders status cards", () => {
  it("clicking a status card triggers status update and shows success toast", async () => {
    storeState.orders = [makeOrder("o-11", "2026-03-11T10:00:00")];
    updateOrderStatusMock.mockReturnValue(Promise.resolve());

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => { });
    openOrderDetails("o-11");

    act(() => {
      vi.runOnlyPendingTimers();
    });
    const card = screen.getByRole("button", { name: /set order status to confirmed/i });
    fireEvent.click(card);

    await act(async () => { });
    expect(updateOrderStatusMock).toHaveBeenCalledWith("o-11", "confirmed");
    expect(toastFns.success).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /set order status to confirmed/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows loading feedback during status update and handles errors with toast", async () => {
    storeState.orders = [makeOrder("o-11", "2026-03-11T10:00:00")];

    let resolveFirst: (() => void) | null = null;
    const first = new Promise<void>((r) => {
      resolveFirst = r;
    });

    updateOrderStatusMock.mockReturnValueOnce(first);

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => { });
    openOrderDetails("o-11");

    act(() => {
      vi.runOnlyPendingTimers();
    });
    const confirmed = screen.getByRole("button", { name: /set order status to confirmed/i });
    fireEvent.click(confirmed);
    await act(async () => { });

    expect(screen.getByLabelText(/updating status/i)).toBeInTheDocument();

    await act(async () => {
      resolveFirst?.();
    });

    expect(toastFns.success).toHaveBeenCalled();

    updateOrderStatusMock.mockImplementationOnce(() => Promise.reject(new Error("fail")));
    updateOrderStatusMock.mockImplementationOnce(() => Promise.resolve());

    const cancelled = screen.getByRole("button", { name: /set order status to cancelled/i });
    fireEvent.click(cancelled);
    await act(async () => { });

    expect(toastFns.error).toHaveBeenCalled();
    expect(updateOrderStatusMock).toHaveBeenCalledWith("o-11", "cancelled");
  });
});

describe("Orders invoice modal layout", () => {
  it("constrains modal size and keeps footer visible while content scrolls", async () => {
    storeState.orders = [makeOrderWithItems("o-11", "2026-03-11T10:00:00", 2)];

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => { });
    openOrderDetails("o-11");

    act(() => {
      vi.runOnlyPendingTimers();
    });

    const content = screen.getByTestId("order-details-content");
    const body = screen.getByTestId("order-details-body");
    const footer = screen.getByTestId("order-details-footer");

    expect(content).toHaveClass("max-w-[95vw]");
    expect(content).toHaveClass("max-h-[90vh]");
    expect(body).toHaveClass("overflow-auto");
    expect(body.contains(footer)).toBe(false);

    expect(screen.getByTestId("download-invoice")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /invoice/i })).not.toBeInTheDocument();
  });

  it("renders large orders (50+ items) with internal scrolling and closes on backdrop click", async () => {
    storeState.orders = [makeOrderWithItems("o-55", "2026-03-11T10:00:00", 55)];

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => { });
    openOrderDetails("o-55");

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 55")).toBeInTheDocument();
    expect(screen.getByTestId("download-invoice")).toBeInTheDocument();

    const overlay = document.querySelector('div[data-state="open"].fixed.inset-0') as HTMLElement | null;
    expect(overlay).toBeTruthy();
    if (overlay) {
      fireEvent.pointerDown(overlay);
      fireEvent.pointerUp(overlay);
      fireEvent.click(overlay);
    }

    await act(async () => { });
    expect(screen.queryByTestId("order-details-content")).not.toBeInTheDocument();
  });

  it("downloads a PDF invoice for the selected order", async () => {
    storeState.orders = [makeOrder("o-77", "2026-03-11T10:00:00")];
    downloadInvoicePdfMock.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => { });
    openOrderDetails("o-77");

    act(() => {
      vi.runOnlyPendingTimers();
    });

    fireEvent.click(screen.getByTestId("download-invoice"));
    await act(async () => { });

    expect(downloadInvoicePdfMock).toHaveBeenCalled();
    const call = downloadInvoicePdfMock.mock.calls[0]?.[0] as { order?: { id?: string } } | undefined;
    expect(call?.order?.id).toBe("o-77");
  });

  it("makes order rows/cards keyboard-activatable (Enter and Space) and removes legacy View button", async () => {
    storeState.orders = [makeOrder("o-99", "2026-03-11T10:00:00")];

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => { });

    const btn = screen.getAllByRole("button", { name: /open order #99 details/i })[0];
    fireEvent.keyDown(btn, { key: "Enter", code: "Enter" });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const overlay = document.querySelector('div[data-state="open"].fixed.inset-0') as HTMLElement | null;
    if (overlay) {
      fireEvent.pointerDown(overlay);
      fireEvent.pointerUp(overlay);
      fireEvent.click(overlay);
    }
    await act(async () => { });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.keyDown(btn, { key: " ", code: "Space", charCode: 32 });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /view/i })).not.toBeInTheDocument();
  });
});
