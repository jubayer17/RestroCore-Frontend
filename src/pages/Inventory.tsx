import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Package, AlertTriangle, TrendingDown, CheckCircle2, Plus, Minus, X, Search, ArrowUpDown, Download, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { InventorySKU } from '@/types/restaurant';

export default function Inventory() {
  const { inventory, adjustStock, addInventoryItem, updateInventoryItem, settings } = useRestaurantStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'status'>('name');
  const [restockAmounts, setRestockAmounts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: '', unit: '', qtyOnHand: '', reorderPoint: '', image: '' });
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editImageMode, setEditImageMode] = useState<'url' | 'upload'>('url');
  const [editImage, setEditImage] = useState('');
  const [editLocalImageObjectUrl, setEditLocalImageObjectUrl] = useState('');
  const [editReorderPoint, setEditReorderPoint] = useState('');
  const [editTargetLevel, setEditTargetLevel] = useState('');
  const [editSuggestedRestock, setEditSuggestedRestock] = useState('');
  const [editRestockQty, setEditRestockQty] = useState('');

  const multiplier = Math.max(1, settings.inventoryTargetMultiplier || 3);

  const lowStockCount = inventory.filter(i => i.qtyOnHand <= i.reorderPoint).length;
  const outOfStockCount = inventory.filter(i => i.qtyOnHand === 0).length;
  const totalUnitsOnHand = inventory.reduce((s, i) => s + i.qtyOnHand, 0);
  const totalSuggestedRestock = inventory.reduce((s, i) => {
    const target = i.targetLevel ?? i.reorderPoint * multiplier;
    const suggested = i.suggestedRestock ?? Math.max(0, target - i.qtyOnHand);
    return s + suggested;
  }, 0);

  const filtered = useMemo(() => {
    const result = inventory.filter(i => {
      const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
      const isLow = i.qtyOnHand <= i.reorderPoint;
      const matchFilter = stockFilter === 'all' || (stockFilter === 'low' ? isLow : !isLow);
      return matchSearch && matchFilter;
    });
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'qty') return a.qtyOnHand - b.qtyOnHand;
      if (sortBy === 'status') return (a.qtyOnHand <= a.reorderPoint ? 0 : 1) - (b.qtyOnHand <= b.reorderPoint ? 0 : 1);
      return 0;
    });
    return result;
  }, [inventory, search, stockFilter, sortBy]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unit) return toast.error('Fill required fields');
    const reorderPoint = parseInt(form.reorderPoint) || 5;
    const qtyOnHand = parseInt(form.qtyOnHand) || 0;
    const targetLevel = reorderPoint * multiplier;
    addInventoryItem({
      id: `inv-${Date.now()}`,
      name: form.name,
      unit: form.unit,
      qtyOnHand,
      reorderPoint,
      targetLevel,
      suggestedRestock: Math.max(0, targetLevel - qtyOnHand),
      image: form.image || undefined,
    });
    toast.success(`${form.name} added to inventory`);
    setForm({ name: '', unit: '', qtyOnHand: '', reorderPoint: '', image: '' });
    setShowAdd(false);
  };

  useEffect(() => {
    return () => {
      if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
    };
  }, [editLocalImageObjectUrl]);

  const closeEditModal = () => {
    if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
    setEditLocalImageObjectUrl('');
    setEditItemId(null);
    setEditImageMode('url');
    setEditImage('');
    setEditReorderPoint('');
    setEditTargetLevel('');
    setEditSuggestedRestock('');
    setEditRestockQty('');
  };

  const openEditModal = (item: InventorySKU) => {
    if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
    setEditLocalImageObjectUrl('');
    setEditItemId(item.id);
    setEditImageMode('url');
    setEditImage(item.image || '');
    setEditReorderPoint(String(item.reorderPoint));
    setEditTargetLevel(String(item.targetLevel ?? item.reorderPoint * multiplier));
    setEditSuggestedRestock(String(item.suggestedRestock ?? Math.max(0, (item.targetLevel ?? item.reorderPoint * multiplier) - item.qtyOnHand)));
    setEditRestockQty('');
  };

  const saveEditModal = () => {
    if (!editItemId) return;
    const rp = Math.max(0, Math.floor(Number(editReorderPoint || 0)));
    const tl = Math.max(0, Math.floor(Number(editTargetLevel || 0)));
    const sr = Math.max(0, Math.floor(Number(editSuggestedRestock || 0)));
    if (!Number.isFinite(rp) || !Number.isFinite(tl) || !Number.isFinite(sr)) return toast.error('Enter valid numbers');
    updateInventoryItem(editItemId, { reorderPoint: rp, targetLevel: tl, suggestedRestock: sr, image: editImage || undefined });
    toast.success('Item updated');
    closeEditModal();
  };

  const restockFromModal = () => {
    if (!editItemId) return;
    const qty = parseInt(editRestockQty || '0');
    if (qty <= 0) return toast.error('Enter a valid quantity');
    adjustStock(editItemId, qty);
    toast.success(`Restocked +${qty}`);
    setEditRestockQty('');
  };

  const handleCustomRestock = (itemId: string) => {
    const qty = parseInt(restockAmounts[itemId] || '0');
    if (qty <= 0) return toast.error('Enter a valid quantity');
    adjustStock(itemId, qty);
    toast.success(`Restocked +${qty}`);
    setRestockAmounts(prev => ({ ...prev, [itemId]: '' }));
  };

  const exportInventory = () => {
    const csv = ['Name,Unit,On Hand,Reorder Point,Status', ...inventory.map(i => `${i.name},${i.unit},${i.qtyOnHand},${i.reorderPoint},${i.qtyOnHand <= i.reorderPoint ? 'Low' : 'OK'}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'inventory-report.csv'; a.click(); URL.revokeObjectURL(url);
    toast.success('Inventory exported!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-medium sm:text-3xl font-medium font-display ">Inventory</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{lowStockCount} low stock</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2.5 rounded-xl text-xs ">
              <AlertTriangle className="h-3.5 w-3.5" /> {lowStockCount} low stock
            </div>
          )}
          <button onClick={exportInventory} className="flex items-center gap-1.5 glass-card px-3.5 py-2.5 rounded-xl text-xs hover:bg-muted/50 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Items', value: inventory.length, icon: Package, tone: 'bg-primary/10 text-primary border-primary/20' },
          { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, tone: 'bg-warning/10 text-warning border-warning/20' },
          { label: 'Out of Stock', value: outOfStockCount, icon: TrendingDown, tone: 'bg-destructive/10 text-destructive border-destructive/20' },
          { label: 'Suggested Restock', value: totalSuggestedRestock, icon: CheckCircle2, tone: 'bg-fresh/10 text-fresh border-fresh/20' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-4 sm:p-5 border border-border/50">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0', kpi.tone)}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-medium tabular-nums leading-tight">{kpi.value}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 truncate">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/50 bg-muted/10 px-4 py-3 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="tabular-nums">Units on hand: <span className="text-foreground/80 font-semibold">{totalUnitsOnHand}</span></span>
        <span className="tabular-nums">Target multiplier: <span className="text-foreground/80 font-semibold">×{multiplier}</span></span>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search - Full Width */}
        <div className="relative w-full group">
          <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" strokeWidth={2.25} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory items..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border/50 bg-card text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm"
            aria-label="Search inventory"
          />
        </div>
        {/* Segmented Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
              {(['all', 'low', 'ok'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStockFilter(f)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 capitalize whitespace-nowrap',
                    stockFilter === f ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-pressed={stockFilter === f}
                >
                  {f === 'all' ? 'All Items' : f === 'low' ? `Low (${lowStockCount})` : `OK (${inventory.length - lowStockCount})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <span className="text-xs text-muted-foreground">Sort</span>
            <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
              {(['name', 'qty', 'status'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 capitalize',
                    sortBy === s ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-pressed={sortBy === s}
                >
                  <ArrowUpDown className="h-3 w-3" /> {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground glass-card">
          <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
            <TrendingDown className="h-8 w-8 opacity-20" />
          </div>
          <p className=" text-base">No items found</p>
          <p className="text-sm mt-1">Try adjusting filters or add a new item</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((item, i) => {
            const low = item.qtyOnHand <= item.reorderPoint;
            const target = item.targetLevel ?? item.reorderPoint * multiplier;
            const pct = Math.min(100, (item.qtyOnHand / Math.max(1, target)) * 100);
            const suggested = item.suggestedRestock ?? Math.max(0, target - item.qtyOnHand);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn('glass-card rounded-2xl border border-border/50 p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center', low && 'ring-1 ring-destructive/30')}
              >
                <div className="relative h-40 w-full md:h-52 md:w-52 lg:h-60 lg:w-60 rounded-2xl overflow-hidden border border-border/50 shrink-0 bg-muted/20">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={240}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/40 flex items-center justify-center">
                      <Package className="h-7 w-7 text-muted/40" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="absolute top-2 left-2 h-9 w-9 rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-black/50 transition-colors"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0 w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base sm:text-base font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Unit: {item.unit} • Reorder at {item.reorderPoint} • Target {target}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider', low ? 'bg-destructive/10 text-destructive' : 'bg-fresh/10 text-fresh')}>
                        {low ? 'Low Stock' : 'In Stock'}
                      </span>
                      <span className={cn('text-xl sm:text-2xl font-medium tabular-nums leading-none', low ? 'text-destructive' : 'text-foreground')}>
                        {item.qtyOnHand}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className={cn('font-medium tabular-nums', low ? 'text-destructive' : 'text-muted-foreground')}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', low ? 'bg-destructive' : 'bg-fresh')} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suggested</p>
                        <p className="text-sm font-medium tabular-nums mt-0.5">{suggested}</p>
                      </div>
                      <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Threshold</p>
                        <p className="text-sm font-medium tabular-nums mt-0.5">{item.reorderPoint}</p>
                      </div>
                      <div className="hidden sm:block rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target</p>
                        <p className="text-sm font-medium tabular-nums mt-0.5">{target}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-border/30 pt-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => { adjustStock(item.id, -1); }}
                        aria-label={`Decrease ${item.name} by 1`}
                        className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/15 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { adjustStock(item.id, 1); }}
                        aria-label={`Increase ${item.name} by 1`}
                        className="h-9 w-9 rounded-xl bg-fresh/10 text-fresh flex items-center justify-center hover:bg-fresh/15 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                      <input
                        inputMode="numeric"
                        aria-label={`Custom restock for ${item.name}`}
                        value={restockAmounts[item.id] || ''}
                        onChange={(e) => setRestockAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Custom qty"
                        className="w-full sm:flex-1 px-3 py-2 rounded-xl border bg-card text-sm sm:text-xs focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={() => handleCustomRestock(item.id)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-fresh/10 text-fresh text-xs font-bold hover:bg-fresh/15 transition-colors flex items-center justify-center gap-2"
                        aria-label={`Apply custom restock for ${item.name}`}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Restock
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editItemId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={closeEditModal} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="relative w-full max-w-2xl glass-card p-6 space-y-6 rounded-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-xl font-medium truncate">Edit Inventory Item</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Update image, suggested, threshold, target, and restock
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Close edit inventory modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Image</label>
                <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50 w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setEditImageMode('url');
                      if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                      setEditLocalImageObjectUrl('');
                      setEditImage('');
                    }}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                      editImageMode === 'url' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={editImageMode === 'url'}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditImageMode('upload');
                      setEditImage('');
                    }}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                      editImageMode === 'upload' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={editImageMode === 'upload'}
                  >
                    Upload
                  </button>
                </div>

                {editImageMode === 'url' ? (
                  <input
                    value={editImage}
                    onChange={(e) => {
                      if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                      setEditLocalImageObjectUrl('');
                      setEditImage(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                      const url = URL.createObjectURL(file);
                      setEditLocalImageObjectUrl(url);
                      setEditImage(url);
                    }}
                    className="w-full px-4 py-3 rounded-xl border bg-card text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted/60 file:px-3 file:py-2 file:text-xs file:font-bold file:text-muted-foreground hover:file:bg-muted transition-all"
                  />
                )}

                {editImage && (
                  <div className="rounded-2xl border border-border/50 bg-muted/10 overflow-hidden">
                    <div className="p-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground truncate">Preview</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                          setEditLocalImageObjectUrl('');
                          setEditImage('');
                          setEditImageMode('url');
                        }}
                        className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="relative aspect-[16/9] bg-muted/30">
                      <img
                        src={editImage}
                        alt="Inventory image preview"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Suggested</label>
                  <input
                    inputMode="numeric"
                    value={editSuggestedRestock}
                    onChange={(e) => setEditSuggestedRestock(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Threshold</label>
                  <input
                    inputMode="numeric"
                    value={editReorderPoint}
                    onChange={(e) => setEditReorderPoint(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Target</label>
                  <input
                    inputMode="numeric"
                    value={editTargetLevel}
                    onChange={(e) => setEditTargetLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 tabular-nums"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-muted/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Restock</p>
                  <button
                    type="button"
                    onClick={() => setEditRestockQty(editSuggestedRestock)}
                    className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Use Suggested
                  </button>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRestockQty(String(Math.max(0, parseInt(editRestockQty || '0') - 1)))}
                      className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/15 transition-colors"
                      aria-label="Decrease restock quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRestockQty(String(parseInt(editRestockQty || '0') + 1))}
                      className="h-9 w-9 rounded-xl bg-fresh/10 text-fresh flex items-center justify-center hover:bg-fresh/15 transition-colors"
                      aria-label="Increase restock quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    inputMode="numeric"
                    value={editRestockQty}
                    onChange={(e) => setEditRestockQty(e.target.value)}
                    placeholder="Qty"
                    className="flex-1 px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={restockFromModal}
                    className="px-5 py-3 rounded-xl bg-fresh/10 text-fresh text-sm font-bold hover:bg-fresh/15 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Restock
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-muted/60 hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditModal}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onSubmit={handleAdd}
            className="glass-card p-6 space-y-4 rounded-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg">Add Inventory Item</h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close add inventory form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Unit</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Image URL</label>
                <input placeholder="https://images.unsplash.com/..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">On Hand</label>
                <input value={form.qtyOnHand} onChange={(e) => setForm({ ...form, qtyOnHand: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Reorder Point</label>
                <input value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all">
                Add Item
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
