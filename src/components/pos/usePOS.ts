import { useState, useMemo, useRef, useEffect } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { toast } from 'sonner';
import type { Order, OrderType } from '@/types/restaurant';
import type { POSDiscount } from './pos-types';

export function usePOS() {
  const { menuItems, categories, cart, cartOrderType, addToCart, removeFromCart, updateCartItemQty, clearCart, setCartOrderType, addOrder, tables, setCartTableId, cartTableId, cartCustomerName, cartCustomerPhone, setCartCustomer, addAuditLog, updateTableStatus, settings, nextOrderNumber, takeNextOrderNumber, orders } = useRestaurantStore();

  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [discount, setDiscount] = useState<POSDiscount | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 4);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const filteredItems = useMemo(() => menuItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  }), [menuItems, selectedCategory, search]);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const subtotalRaw = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const subtotal = round2(subtotalRaw);
  const discountAmountRaw = discount?.amount || 0;
  const discountAmount = round2(Math.max(0, Math.min(subtotal, discountAmountRaw)));
  const taxableAmount = round2(subtotal - discountAmount);
  const taxRatePct = Number.isFinite(settings.taxRate) ? settings.taxRate : 10;
  const tax = round2(taxableAmount * (taxRatePct / 100));
  const total = round2(taxableAmount + tax);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const freeTables = tables.filter(t => t.status === 'free');

  const handlePlaceOrder = (paymentMethod: 'cash' | 'card') => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (cartOrderType === 'dinein' && !cartTableId) return toast.error('Please select a table for dine-in');

    const itemsWithNotes = cart.map((it) => ({
      ...it,
      notes: (itemNotes[it.id] ?? it.notes ?? '').trim(),
    }));

    const orderNumber = takeNextOrderNumber();
    const order: Order = {
      id: `o-${orderNumber}`,
      type: cartOrderType,
      tableId: cartTableId || undefined,
      items: itemsWithNotes,
      subtotal,
      tax,
      discount: discountAmount,
      total,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(cartCustomerName ? { customerName: cartCustomerName } : {}),
      ...(cartCustomerPhone ? { customerPhone: cartCustomerPhone } : {}),
    };
    addOrder(order);
    if (cartTableId) updateTableStatus(cartTableId, 'occupied');
    addAuditLog({ actorId: 'user-4', actorName: 'Emily Chen', action: 'order_created', target: order.id });

    clearCart();
    setDiscount(null);
    setItemNotes({});
    setCartOpen(false);
    toast.success(`Order #${orderNumber} placed!`, {
      description: `Total: $${total.toFixed(2)} • Sent to kitchen`,
    });
  };

  return {
    menuItems,
    categories,
    cart,
    cartOrderType,
    addToCart,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    setCartOrderType,
    addOrder,
    tables,
    setCartTableId,
    cartTableId,
    cartCustomerName,
    cartCustomerPhone,
    setCartCustomer,
    orders,
    addAuditLog,
    updateTableStatus,
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
    displayOrderNumber: cart.length > 0 ? String(nextOrderNumber) : null,
    showLeftArrow,
    showRightArrow,
    categoryScrollRef,
    checkScroll,
    scrollCategories,
    filteredItems,
    subtotal,
    discountAmount,
    taxableAmount,
    tax,
    total,
    totalItems,
    freeTables,
    handlePlaceOrder,
  };
}
