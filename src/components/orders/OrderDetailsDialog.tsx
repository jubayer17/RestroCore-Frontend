import React from 'react';
import { format } from "date-fns";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { downloadInvoicePdf } from "@/lib/invoicePdf";
import { getOrderNumber } from "@/lib/orderNumber";
import type { Order, OrderStatus, OrderType, Table as TableType, User, Driver } from "@/types/restaurant";
import type { RestaurantSettings } from "@/types/settings";

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  tableById: Map<string, TableType>;
  currencyFormatter: Intl.NumberFormat;
  statusUpdating: OrderStatus | null;
  setStatusUpdating: (s: OrderStatus | null) => void;
  optimisticStatus: OrderStatus | null;
  setOptimisticStatus: (s: OrderStatus | null) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  invoiceDownloading: boolean;
  setInvoiceDownloading: (v: boolean) => void;
  settings: RestaurantSettings;
}

const statusTone = (status: OrderStatus): { badge: string; dot: string } => {
  if (status === "completed") return { badge: "bg-emerald-500/10 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
  if (status === "cancelled") return { badge: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" };
  if (status === "ready") return { badge: "bg-blue-500/10 text-blue-700 border-blue-200", dot: "bg-blue-500" };
  if (status === "preparing") return { badge: "bg-orange-500/10 text-orange-700 border-orange-200", dot: "bg-orange-500" };
  if (status === "served") return { badge: "bg-violet-500/10 text-violet-700 border-violet-200", dot: "bg-violet-500" };
  if (status === "confirmed") return { badge: "bg-amber-500/10 text-amber-700 border-amber-200", dot: "bg-amber-500" };
  return { badge: "bg-muted text-foreground border-border", dot: "bg-muted-foreground" };
};

const prettyType = (type: OrderType): string => {
  if (type === "dinein") return "Dine-in";
  if (type === "takeaway") return "Takeaway";
  if (type === "delivery") return "Delivery";
  return "Pickup";
};

const statusProgress = (status: OrderStatus): { label: string; pct: number } => {
  const ORDER_STEPS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "served", "completed"];
  if (status === "cancelled") return { label: "Cancelled", pct: 0 };
  const idx = ORDER_STEPS.indexOf(status);
  if (idx < 0) return { label: "Pending", pct: 0 };
  const pct = Math.round(((idx + 1) / ORDER_STEPS.length) * 100);
  return { label: status, pct };
};

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  isOpen, onClose, order, tableById, currencyFormatter,
  statusUpdating, setStatusUpdating, optimisticStatus, setOptimisticStatus,
  updateOrderStatus, invoiceDownloading, setInvoiceDownloading, settings
}) => {
  const effectiveStatus = (order ? optimisticStatus ?? order.status : null) as OrderStatus | null;
  const orderDate = order ? Number.isFinite(Date.parse(order.createdAt)) ? Date.parse(order.createdAt) : 0 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0"
        data-testid="order-details-content"
      >
        <div className="px-6 pt-6 pb-3">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
            <DialogDescription className="text-sm">
              {order ? `#${getOrderNumber(order.id)} · ${format(new Date(orderDate), "PP p")}` : ""}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6" data-testid="order-details-body">
          {!order ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border bg-card shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</p>
                    <p className="mt-1 text-base font-semibold truncate">{order.customerName || "Walk-in"}</p>
                    <p className="text-sm text-muted-foreground truncate">{order.customerPhone || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {prettyType(order.type)}
                    </Badge>
                    <Badge variant="outline" className={cn("capitalize", statusTone(effectiveStatus ?? order.status).badge)}>
                      {effectiveStatus ?? order.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border bg-card shadow-sm p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="mt-1 text-sm font-semibold">{currencyFormatter.format(order.total)}</p>
                  </div>
                  <div className="rounded-xl border bg-card shadow-sm p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Payment</p>
                    <p className="mt-1 text-sm font-semibold capitalize">{order.paymentMethod || "—"}</p>
                  </div>
                  <div className="rounded-xl border bg-card shadow-sm p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Items</p>
                    <p className="mt-1 text-sm font-semibold">{order.items.length}</p>
                  </div>
                  <div className="rounded-xl border bg-card shadow-sm p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Context</p>
                    <p className="mt-1 text-sm font-semibold truncate">
                      {order.tableId ? `Table ${tableById.get(order.tableId)?.label || "—"}` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Status tracking</p>
                    <p className="text-xs text-muted-foreground">Track progress across the fulfillment pipeline.</p>
                  </div>
                </div>
                <div className="mt-3">
                  {(() => {
                    const p = statusProgress(effectiveStatus ?? order.status);
                    return (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="capitalize">{p.label}</span>
                          <span>{p.pct}%</span>
                        </div>
                        <Progress value={p.pct} className="mt-2 h-2" />
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground">Change status</p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {(["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"] as OrderStatus[]).map((s) => {
                              const isActive = (effectiveStatus ?? order.status) === s;
                              const tone = statusTone(s);
                              const isBusy = statusUpdating !== null;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  aria-label={`Set order status to ${s}`}
                                  aria-pressed={isActive}
                                  disabled={isBusy || isActive}
                                  onClick={async () => {
                                    if (statusUpdating !== null) return;
                                    if (s === (effectiveStatus ?? order.status)) return;

                                    const prev = effectiveStatus ?? order.status;
                                    setStatusUpdating(s);
                                    setOptimisticStatus(s);

                                    try {
                                      await Promise.resolve(updateOrderStatus(order.id, s) as unknown);
                                      toast.success(`Order updated: ${s}`);
                                    } catch {
                                      setOptimisticStatus(prev);
                                      toast.error("Failed to update order status.");
                                    } finally {
                                      setStatusUpdating(null);
                                    }
                                  }}
                                  className={cn(
                                    "rounded-xl border px-3 py-3 text-left transition-colors",
                                    isActive ? "bg-primary/10 border-primary/25" : "bg-background hover:bg-muted/30",
                                    isBusy && !isActive && "opacity-70",
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className={cn("text-sm font-medium capitalize", isActive ? "text-foreground" : "text-foreground")}>
                                        {s}
                                      </p>
                                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className={cn("inline-block h-2 w-2 rounded-full", tone.dot)} />
                                        <span className="truncate">{isActive ? "Current" : "Click to set"}</span>
                                      </div>
                                    </div>
                                    {statusUpdating === s ? (
                                      <div
                                        aria-label="Updating status"
                                        className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin"
                                      />
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Order items</p>
                    <p className="text-xs text-muted-foreground truncate">Itemized summary for this order</p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{order.items.length} items</div>
                </div>

                <div className="max-h-[320px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-[70px] text-right">Qty</TableHead>
                        <TableHead className="w-[110px] text-right">Unit</TableHead>
                        <TableHead className="w-[130px] text-right">Line</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((it) => {
                        const lineTotal = it.qty * it.price + (it.modifiers?.reduce((s, m) => s + (m.price || 0), 0) || 0);
                        const hasDetails = (it.modifiers?.length || 0) > 0 || (it.notes || "").trim().length > 0;
                        return (
                          <TableRow key={it.id}>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{it.name}</p>
                                {hasDetails ? (
                                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                    {(it.modifiers || []).map((m) => (
                                      <p key={`${it.id}-${m.name}-${m.choice}`} className="truncate">
                                        {m.name}: {m.choice}
                                        {m.price ? ` (${currencyFormatter.format(m.price)})` : ""}
                                      </p>
                                    ))}
                                    {(it.notes || "").trim().length > 0 ? <p className="truncate">{it.notes}</p> : null}
                                  </div>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{it.qty}</TableCell>
                            <TableCell className="text-right">{currencyFormatter.format(it.price)}</TableCell>
                            <TableCell className="text-right font-medium">{currencyFormatter.format(lineTotal)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t px-4 sm:px-5 py-4 bg-muted/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Totals</p>
                      <div className="mt-2 space-y-1.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">{currencyFormatter.format(order.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span className="font-medium">{currencyFormatter.format(order.tax)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium">{currencyFormatter.format(order.discount)}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t flex items-center justify-between text-base font-semibold">
                          <span>Total</span>
                          <span>{currencyFormatter.format(order.total)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Download a corporate-formatted PDF invoice for accounting and customer records.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {settings.currency}
                        </Badge>
                        <Badge variant="outline">Tax {settings.taxRate}%</Badge>
                        <Badge variant="outline">{settings.timezone}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 px-6 py-3 flex items-center justify-between gap-3"
          data-testid="order-details-footer"
        >
          <div className="text-xs text-muted-foreground truncate">
            {order ? `#${getOrderNumber(order.id)}` : ""}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              className="h-9"
              disabled={!order || invoiceDownloading}
              data-testid="download-invoice"
              onClick={async () => {
                if (!order || invoiceDownloading) return;
                setInvoiceDownloading(true);
                try {
                  await downloadInvoicePdf({ order, settings });
                  toast.success("Invoice downloaded.");
                } catch {
                  toast.error("Failed to generate invoice PDF.");
                } finally {
                  setInvoiceDownloading(false);
                }
              }}
            >
              {invoiceDownloading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download invoice
            </Button>
            <Button variant="outline" className="h-9" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
