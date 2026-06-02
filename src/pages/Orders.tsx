import React from 'react';
import { useOrders } from "@/components/orders/useOrders";
import { OrdersHeader } from "@/components/orders/OrdersHeader";
import { OrdersSummaryCards } from "@/components/orders/OrdersSummaryCards";
import { OrdersFilters } from "@/components/orders/OrdersFilters";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrdersMobileList } from "@/components/orders/OrdersMobileList";
import { OrderDetailsDialog } from "@/components/orders/OrderDetailsDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Orders() {
  const {
    orders,
    mounted,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    selectedOrderId,
    setSelectedOrderId,
    dateStart,
    dateEnd,
    applyDateRange,
    statusUpdating,
    setStatusUpdating,
    optimisticStatus,
    setOptimisticStatus,
    updateOrderStatus,
    invoiceDownloading,
    setInvoiceDownloading,
    filtered,
    selectedOrder,
    summary,
    resetFilters,
    currencyFormatter,
    tableById,
    userById,
    driverById,
    settings,
  } = useOrders();

  if (!Array.isArray(orders)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="glass-card p-5 lg:p-6">
          <p className="text-sm font-medium">Orders failed to load</p>
          <p className="text-sm text-muted-foreground mt-1">
            The orders data source returned an unexpected shape. Refresh the page or check the store initialization.
          </p>
        </div>
      </div>
    );
  }

  const showEmpty = mounted && filtered.length === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <OrdersHeader onReset={resetFilters} />

      <OrdersSummaryCards summary={summary} />

      <div className="glass-card p-5 lg:p-6">
        <OrdersFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDir={sortDir}
          setSortDir={setSortDir}
          dateStart={dateStart}
          dateEnd={dateEnd}
          applyDateRange={applyDateRange}
        />

        <div className="mt-4">
          {!mounted ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : showEmpty ? (
            <div className="glass-card p-6 text-center">
              <p className="text-sm font-medium">No matching orders</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or search terms.</p>
            </div>
          ) : (
            <>
              <OrdersTable
                filtered={filtered}
                tableById={tableById}
                userById={userById}
                driverById={driverById}
                currencyFormatter={currencyFormatter}
                onSelectOrder={setSelectedOrderId}
              />

              <OrdersMobileList
                filtered={filtered}
                tableById={tableById}
                driverById={driverById}
                currencyFormatter={currencyFormatter}
                onSelectOrder={setSelectedOrderId}
              />

              {filtered.length > 60 ? (
                <p className="mt-3 text-xs text-muted-foreground">Showing the first 60 orders. Refine filters to narrow results.</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <OrderDetailsDialog
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        order={selectedOrder}
        tableById={tableById}
        currencyFormatter={currencyFormatter}
        statusUpdating={statusUpdating}
        setStatusUpdating={setStatusUpdating}
        optimisticStatus={optimisticStatus}
        setOptimisticStatus={setOptimisticStatus}
        updateOrderStatus={updateOrderStatus}
        invoiceDownloading={invoiceDownloading}
        setInvoiceDownloading={setInvoiceDownloading}
        settings={settings}
      />
    </div>
  );
}
