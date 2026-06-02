import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { usePOS } from '@/components/pos/usePOS';
import { POSHeader } from '@/components/pos/POSHeader';
import { OrderTypeSelector } from '@/components/pos/OrderTypeSelector';
import { SearchTableSelector } from '@/components/pos/SearchTableSelector';
import { CategoryBar } from '@/components/pos/CategoryBar';
import { MenuItemsGrid } from '@/components/pos/MenuItemsGrid';
import { CartContent } from '@/components/pos/CartContent';
import { POSMobileCart } from '@/components/pos/POSMobileCart';
import { orderTypes } from '@/data/config/pos';

export default function POS() {
  const {
    categories,
    cart,
    cartOrderType,
    updateCartItemQty,
    addToCart,
    removeFromCart,
    clearCart,
    setCartOrderType,
    tables,
    setCartTableId,
    cartTableId,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    cartOpen,
    setCartOpen,
    discount,
    setDiscount,
    itemNotes,
    setItemNotes,
    editingNote,
    setEditingNote,
    displayOrderNumber,
    showLeftArrow,
    showRightArrow,
    categoryScrollRef,
    checkScroll,
    scrollCategories,
    filteredItems,
    subtotal,
    discountAmount,
    tax,
    total,
    totalItems,
    freeTables,
    handlePlaceOrder,
    cartCustomerName,
    cartCustomerPhone,
    setCartCustomer,
  } = usePOS();

  const cartContent = (
    <CartContent
      cart={cart}
      subtotal={subtotal}
      discountAmount={discountAmount}
      tax={tax}
      total={total}
      totalItems={totalItems}
      discount={discount}
      setDiscount={setDiscount}
      updateCartItemQty={updateCartItemQty}
      removeFromCart={removeFromCart}
      clearCart={clearCart}
      handlePlaceOrder={handlePlaceOrder}
      itemNotes={itemNotes}
      setItemNotes={setItemNotes}
      editingNote={editingNote}
      setEditingNote={setEditingNote}
    />
  );

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header Bar */}
        <div className="p-3 sm:p-4 lg:p-5 border-b border-border/50 space-y-3 shrink-0 bg-card/40 backdrop-blur-sm">
          <POSHeader orderNumber={displayOrderNumber} />

          <OrderTypeSelector
            orderTypes={orderTypes}
            cartOrderType={cartOrderType}
            setCartOrderType={setCartOrderType}
          />

          <SearchTableSelector
            cartOrderType={cartOrderType}
            cartTableId={cartTableId}
            setCartTableId={setCartTableId}
            freeTables={freeTables}
            search={search}
            setSearch={setSearch}
            customerName={cartCustomerName}
            customerPhone={cartCustomerPhone}
            onSelectCustomer={setCartCustomer}
          />
        </div>

        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          showLeftArrow={showLeftArrow}
          showRightArrow={showRightArrow}
          scrollCategories={scrollCategories}
          categoryScrollRef={categoryScrollRef}
          checkScroll={checkScroll}
        />

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4 lg:p-5 pb-24 lg:pb-5">
          <MenuItemsGrid
            filteredItems={filteredItems}
            categories={categories}
            cart={cart}
            addToCart={addToCart}
          />
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:flex w-[360px] xl:w-[400px] border-l border-border/50 bg-card flex-col">
        <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className=" text-sm lg:text-base">Current Order</h2>
            <p className="text-[11px] lg:text-xs text-muted-foreground capitalize truncate">
              {cartOrderType} {cartTableId && `• ${tables.find(t => t.id === cartTableId)?.label}`} {cartCustomerName && `• ${cartCustomerName}`} {cart.length > 0 ? `• ${totalItems} items` : ''}
            </p>
          </div>
          <span className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-sm">
            {displayOrderNumber ? `#${displayOrderNumber}` : '—'}
          </span>
        </div>
        {cartContent}
      </div>

      {/* Mobile Cart FAB + Drawer */}
      <POSMobileCart
        cart={cart}
        total={total}
        totalItems={totalItems}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        cartOrderType={cartOrderType}
        orderNumber={displayOrderNumber}
      >
        {cartContent}
      </POSMobileCart>
    </div>
  );
}
