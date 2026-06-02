import { useRestaurantStore } from '@/store/useRestaurantStore';
import { UtensilsCrossed, Search, Clock, Plus, X, Power, Trash2, Edit3, Check, LayoutGrid, List, LayoutList, TrendingUp, Star, Flame, Info, Leaf, Droplets, Wheat } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { MenuItem, KDSStation } from '@/types/restaurant';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MenuBuilder() {
  const { menuItems, categories, toggleMenuItemAvailability, addMenuItem, deleteMenuItem, updateMenuItem } = useRestaurantStore();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', prepTime: '', image: '', ingredients: [] as string[] });
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', price: '', prepTime: '10', image: '' });
  const [localImageObjectUrl, setLocalImageObjectUrl] = useState<string>('');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [editImageMode, setEditImageMode] = useState<'url' | 'upload'>('url');
  const [editLocalImageObjectUrl, setEditLocalImageObjectUrl] = useState<string>('');

  const [availFilter, setAvailFilter] = useState<'all' | 'live' | 'off'>('all');

  useEffect(() => {
    return () => {
      if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl);
    };
  }, [localImageObjectUrl]);

  useEffect(() => {
    return () => {
      if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
    };
  }, [editLocalImageObjectUrl]);

  useEffect(() => {
    if (isMobile && view !== 'grid') setView('grid');
  }, [isMobile, view]);

  const filtered = useMemo(() => menuItems.filter((item) => {
    const matchCat = !activeCat || item.categoryId === activeCat;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchAvail = availFilter === 'all' || (availFilter === 'live' ? item.available : !item.available);
    return matchCat && matchSearch && matchAvail;
  }), [menuItems, activeCat, search, availFilter]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.price) return toast.error('Fill required fields');
    addMenuItem({
      id: `item-${Date.now()}`,
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      price: parseFloat(form.price),
      image: form.image || undefined,
      prepTime: parseInt(form.prepTime) || 10,
      stations: ['general'] as KDSStation[],
      available: true,
      modifiers: [],
      dietary: [],
      popularity: 0
    });
    toast.success(`${form.name} added to menu!`);
    setForm({ name: '', description: '', categoryId: '', price: '', prepTime: '10', image: '' });
    if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl);
    setLocalImageObjectUrl('');
    setImageMode('url');
    setShowAdd(false);
  };

  const openAdd = () => {
    const defaultCategoryId = form.categoryId || activeCat || categories[0]?.id || '';
    setEditingId(null);
    if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl);
    setLocalImageObjectUrl('');
    setImageMode('url');
    setForm({ name: '', description: '', categoryId: defaultCategoryId, price: '', prepTime: '10', image: '' });
    setShowAdd(true);
  };

  const startEdit = (item: MenuItem) => {
    setShowAdd(false);
    setEditingId(item.id);
    if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
    setEditLocalImageObjectUrl('');
    setEditImageMode('url');
    setEditForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      prepTime: item.prepTime.toString(),
      image: item.image || '',
      ingredients: item.ingredients?.length ? item.ingredients : [],
    });
  };
  const saveEdit = (itemId: string) => {
    const nextIngredients = editForm.ingredients.map((v) => v.trim()).filter(Boolean);
    updateMenuItem(itemId, {
      name: editForm.name,
      description: editForm.description,
      price: parseFloat(editForm.price) || 0,
      prepTime: parseInt(editForm.prepTime) || 10,
      image: editForm.image || undefined,
      ingredients: nextIngredients.length ? nextIngredients : undefined,
    });
    if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
    setEditLocalImageObjectUrl('');
    setEditImageMode('url');
    setEditingId(null);
    toast.success('Item updated!');
  };

  const closeEdit = () => {
    if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
    setEditLocalImageObjectUrl('');
    setEditImageMode('url');
    setEditingId(null);
  };

  const liveCount = menuItems.filter(i => i.available).length;
  const offCount = menuItems.filter(i => !i.available).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
            <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-medium sm:text-3xl font-medium font-display ">Menu Builder</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{menuItems.length} items · {liveCount} live · {offCount} disabled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-muted/50 p-1 rounded-xl mr-2">
            <button
              onClick={() => setView('grid')}
              className={cn("p-1.5 rounded-lg transition-all", view === 'grid' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn("p-1.5 rounded-lg transition-all", view === 'list' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          <button type="button" onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-4">
        {/* Search Row - Full Width */}
        <div className="relative w-full group">
          <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" strokeWidth={2.25} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by dish name, description, or ingredients..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border/50 bg-card text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm"
          />
        </div>

        {/* Status & Category Rows */}
        <div className="flex flex-col gap-4">
          {/* Availability Filters Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
              <button
                onClick={() => setAvailFilter('all')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2',
                  availFilter === 'all' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> ALL ITEMS
              </button>
              <button
                onClick={() => setAvailFilter('live')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2',
                  availFilter === 'live' ? 'bg-fresh text-fresh-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> LIVE
              </button>
              <button
                onClick={() => setAvailFilter('off')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2',
                  availFilter === 'off' ? 'bg-destructive text-destructive-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Power className="h-3.5 w-3.5" /> DISABLED
              </button>
            </div>
          </div>

          {/* Categories Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCat(null)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border',
                !activeCat
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-primary'
              )}
            >
              🍽️ ALL CATEGORIES
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border',
                  activeCat === c.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-primary'
                )}
              >
                <span className="text-sm">{c.icon}</span> {c.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <AnimatePresence mode="wait">
        {view === 'grid' || isMobile ? (
          <motion.div layout key="grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filtered.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card rounded-2xl overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1.5 border-border/50 relative"
              >
                {/* Image Section */}
                <div
                  className="relative h-48 overflow-hidden cursor-pointer select-none"
                  onDoubleClick={() => {
                    toggleMenuItemAvailability(item.id);
                    toast(item.available ? `${item.name} disabled` : `${item.name} enabled`, {
                      icon: item.available ? '🔴' : '🟢',
                    });
                  }}
                  title="Double-click to toggle availability"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width:1536px) 25vw, (min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw"
                      className={cn("w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", !item.available && "brightness-50")}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                  ) : (
                    <div className={cn("w-full h-full bg-muted/40 flex items-center justify-center", !item.available && "brightness-50")}>
                      <UtensilsCrossed className="h-10 w-10 text-muted/30" />
                    </div>
                  )}
                  {!item.available && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1.5">
                        <Power className="h-3.5 w-3.5" /> Unavailable
                      </span>
                    </div>
                  )}

                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {item.dietary?.map(d => (
                      <span key={d} className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[10px] text-white font-bold border border-white/10 uppercase tracking-wider">
                        {d === 'vegetarian' && <Leaf className="h-2.5 w-2.5 inline mr-1" />}
                        {d === 'vegan' && <Leaf className="h-2.5 w-2.5 inline mr-1" />}
                        {d === 'gluten-free' && <Wheat className="h-2.5 w-2.5 inline mr-1" />}
                        {d}
                      </span>
                    ))}
                  </div>

                  {item.popularity && item.popularity > 9 && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-bold shadow-lg flex items-center gap-1 uppercase tracking-wider">
                      <TrendingUp className="h-3 w-3" /> Best Seller
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                    <Clock className="h-3 w-3 inline mr-1" /> {item.prepTime}m
                  </div>

                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleMenuItemAvailability(item.id)}
                    className={cn(
                      "absolute bottom-3 left-3 h-8 w-8 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-lg",
                      item.available ? "bg-fresh/80 text-white" : "bg-destructive/80 text-white"
                    )}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center text-gold">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-xs font-bold ml-1 text-foreground/80">{item.rating || '4.5'}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">({item.reviewCount || '50'}+ reviews)</span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-foreground/90">${item.price.toFixed(2)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic h-8">
                    "{item.description}"
                  </p>

                  {/* Rich Data Tabs (Ingredients/Nutrition) */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Info className="h-3 w-3" /> Ingredients
                      </p>
                      <p className="text-[10px] leading-tight text-foreground/80 line-clamp-2">
                        {item.ingredients?.join(', ') || 'Fresh daily ingredients selected by our chef.'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Flame className="h-3 w-3" /> Nutrition
                      </p>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-medium">
                        <span className="text-foreground/90">{item.nutrition?.calories || '350'} kcal</span>
                        <span className="text-foreground/70">P: {item.nutrition?.protein || '12'}g</span>
                        <span className="text-foreground/70">C: {item.nutrition?.carbs || '45'}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Overlay on Hover */}
                  <div className="pt-4 flex items-center justify-between border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary text-xs font-medium transition-all"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => deleteMenuItem(item.id)}
                        className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-primary/20 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div layout key="list" className="space-y-4">
            {filtered.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-2xl p-4 flex items-center gap-6 group hover:shadow-lg transition-all border-border/50"
              >
                {/* Image Section */}
                <div
                  className="h-24 w-24 rounded-xl overflow-hidden shrink-0 border border-border/30 relative cursor-pointer select-none"
                  onDoubleClick={() => {
                    toggleMenuItemAvailability(item.id);
                    toast(item.available ? `${item.name} disabled` : `${item.name} enabled`, {
                      icon: item.available ? '🔴' : '🟢',
                    });
                  }}
                  title="Double-click to toggle availability"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      width={96}
                      height={96}
                      className={cn("h-full w-full object-cover transition-transform group-hover:scale-110", !item.available && "brightness-50")}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                  ) : (
                    <div className={cn("h-full w-full bg-muted/40 flex items-center justify-center", !item.available && "brightness-50")}>
                      <UtensilsCrossed className="h-6 w-6 text-muted/30" />
                    </div>
                  )}
                  {!item.available ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Power className="h-4 w-4 text-destructive" />
                    </div>
                  ) : (
                    <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-fresh shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  )}
                </div>

                {/* Main Content Info */}
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="text-base font-bold truncate group-hover:text-primary transition-colors mb-1">{item.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-3 italic">
                    "{item.description}"
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg text-muted-foreground">
                      <Clock className="h-3 w-3" /> {item.prepTime} MIN
                    </span>
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg text-muted-foreground">
                      <Flame className="h-3 w-3" /> {item.nutrition?.calories || '350'} KCAL
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.dietary?.map(d => (
                        <span key={d} className="bg-primary/5 text-primary px-2 py-1 rounded-lg">{d}</span>
                      ))}
                    </div>
                    {item.popularity > 9 && (
                      <span className="flex items-center gap-1 text-orange-500 bg-orange-500/5 px-2 py-1 rounded-lg">
                        <TrendingUp className="h-3 w-3" /> Popular
                      </span>
                    )}
                  </div>
                </div>

                {/* Ingredients (fills the visual gap before price/rating) */}
                <div className="hidden lg:block flex-1 min-w-0 max-w-[360px] px-2">
                  <div className="rounded-2xl bg-muted/20 border border-border/50 px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ingredients</p>
                    <p className="text-xs text-foreground/80 leading-snug line-clamp-3">
                      {item.ingredients?.length ? item.ingredients.join(', ') : '—'}
                    </p>
                  </div>
                </div>

                {/* Pricing & Rating Section - Better Alignment */}
                <div className="hidden sm:flex flex-col items-end gap-2 px-6 border-l border-border/50">
                  <span className="text-xl font-bold text-foreground/90 tabular-nums">
                    ${item.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-gold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-bold ml-1 text-foreground/80">{item.rating || '4.5'}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground hidden lg:block">({item.reviewCount || '50'})</span>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-2 shrink-0 border-l border-border/50 pl-6 ml-2">
                  <button
                    onClick={() => toggleMenuItemAvailability(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                      item.available ? "bg-fresh/10 text-fresh" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Power className="h-3.5 w-3.5" /> {item.available ? 'LIVE' : 'OFF'}
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Dialogs (Simplified for brevity but keeping structure) */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowAdd(false)} />
            <motion.form
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onSubmit={handleAdd}
              className="relative w-full max-w-xl glass-card p-6 space-y-6 rounded-3xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">New Menu Item</h3>
                  <p className="text-xs text-muted-foreground">Add a fresh dish to your restaurant's digital menu</p>
                </div>
                <button type="button" onClick={() => { setShowAdd(false); if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl); setLocalImageObjectUrl(''); setImageMode('url'); setForm({ name: '', description: '', categoryId: '', price: '', prepTime: '10', image: '' }); }} className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Dish Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g. Grilled Truffle Salmon" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 transition-all" required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Price ($)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="0.00" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Image</label>
                  <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50 w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setImageMode('url');
                        if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl);
                        setLocalImageObjectUrl('');
                        setForm({ ...form, image: '' });
                      }}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                        imageMode === 'url' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-pressed={imageMode === 'url'}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageMode('upload');
                        setForm({ ...form, image: '' });
                      }}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                        imageMode === 'upload' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-pressed={imageMode === 'upload'}
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {imageMode === 'url' ? (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Image URL</label>
                    <input
                      value={form.image}
                      onChange={(e) => {
                        if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl);
                        setLocalImageObjectUrl('');
                        setForm({ ...form, image: e.target.value });
                      }}
                      className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Choose File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl);
                        const url = URL.createObjectURL(file);
                        setLocalImageObjectUrl(url);
                        setForm({ ...form, image: url });
                      }}
                      className="w-full px-4 py-3 rounded-xl border bg-card text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted/60 file:px-3 file:py-2 file:text-xs file:font-bold file:text-muted-foreground hover:file:bg-muted transition-all"
                    />
                  </div>
                )}
                {form.image && (
                  <div className="sm:col-span-2">
                    <div className="rounded-2xl border border-border/50 bg-muted/10 overflow-hidden">
                      <div className="p-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground truncate">Preview</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl);
                            setLocalImageObjectUrl('');
                            if (imageMode === 'upload') setImageMode('url');
                            setForm({ ...form, image: '' });
                          }}
                          className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative aspect-[16/9] bg-muted/30">
                        <img
                          src={form.image}
                          alt="Selected dish image preview"
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
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Short Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]" placeholder="Briefly describe the dish's flavor and highlights..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); if (localImageObjectUrl) URL.revokeObjectURL(localImageObjectUrl); setLocalImageObjectUrl(''); setImageMode('url'); setForm({ name: '', description: '', categoryId: '', price: '', prepTime: '10', image: '' }); }} className="px-6 py-3 rounded-xl text-sm font-bold bg-muted/60 hover:bg-muted transition-all">Discard</button>
                <button type="submit" className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all">
                  Create Item
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {editingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={closeEdit} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="relative w-full max-w-2xl glass-card p-6 space-y-6 rounded-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Edit Dish Details</h3>
                  <p className="text-xs text-muted-foreground">Modify the information for this menu item</p>
                </div>
                <button type="button" onClick={closeEdit} className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Image</label>
                  <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50 w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setEditImageMode('url');
                        if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                        setEditLocalImageObjectUrl('');
                        setEditForm({ ...editForm, image: '' });
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
                        setEditForm({ ...editForm, image: '' });
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
                </div>

                {editImageMode === 'url' ? (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Image URL</label>
                    <input
                      value={editForm.image}
                      onChange={(e) => {
                        if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                        setEditLocalImageObjectUrl('');
                        setEditForm({ ...editForm, image: e.target.value });
                      }}
                      className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Choose File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                        const url = URL.createObjectURL(file);
                        setEditLocalImageObjectUrl(url);
                        setEditForm({ ...editForm, image: url });
                      }}
                      className="w-full px-4 py-3 rounded-xl border bg-card text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted/60 file:px-3 file:py-2 file:text-xs file:font-bold file:text-muted-foreground hover:file:bg-muted transition-all"
                    />
                  </div>
                )}

                {editForm.image && (
                  <div className="sm:col-span-2">
                    <div className="rounded-2xl border border-border/50 bg-muted/10 overflow-hidden">
                      <div className="p-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground truncate">Preview</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (editLocalImageObjectUrl) URL.revokeObjectURL(editLocalImageObjectUrl);
                            setEditLocalImageObjectUrl('');
                            if (editImageMode === 'upload') setEditImageMode('url');
                            setEditForm({ ...editForm, image: '' });
                          }}
                          className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative aspect-[16/9] bg-muted/30">
                        <img
                          src={editForm.image}
                          alt="Selected dish image preview"
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
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Dish Name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20 min-h-[80px]" />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Ingredients</label>
                    <button
                      type="button"
                      onClick={() => setEditForm((s) => ({ ...s, ingredients: [...(s.ingredients?.length ? s.ingredients : ['']), ''] }))}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Ingredient
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(editForm.ingredients?.length ? editForm.ingredients : ['']).map((val, idx) => (
                      <div key={`${idx}`} className="relative">
                        <input
                          value={val}
                          onChange={(e) => {
                            const next = [...(editForm.ingredients?.length ? editForm.ingredients : [''])];
                            next[idx] = e.target.value;
                            setEditForm({ ...editForm, ingredients: next });
                          }}
                          className="w-full pl-4 pr-12 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20"
                          placeholder="e.g. Basil"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = editForm.ingredients?.length ? editForm.ingredients : [''];
                            const next = current.filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, ingredients: next.length ? next : [] });
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
                          aria-label="Remove ingredient"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Price ($)</label>
                  <input type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Prep Time (min)</label>
                  <input type="number" min="1" step="1" value={editForm.prepTime} onChange={(e) => setEditForm({ ...editForm, prepTime: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit} className="px-6 py-3 rounded-xl text-sm font-bold bg-muted/60 hover:bg-muted transition-all">Cancel</button>
                <button type="button" onClick={() => { if (editingId) saveEdit(editingId); }} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
                  <Check className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
