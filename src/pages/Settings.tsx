import { useRestaurantStore } from '@/store/useRestaurantStore';
import { useMemo, useState } from 'react';
import { Settings as SettingsIcon, Save, Store, DollarSign, Moon, Sun, Bell, Shield, Palette, Receipt, FileText, IdCard, Image as ImageIcon, Printer, Database, Users, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RestaurantSettings } from '@/types/settings';

export default function Settings() {
  const { settings, updateSettings, darkMode, toggleDarkMode, orders, menuItems, users, inventory, bookings } = useRestaurantStore();
  const [form, setForm] = useState<RestaurantSettings>({ ...settings });
  const [activeSection, setActiveSection] = useState<'general' | 'invoices' | 'appearance' | 'notifications'>('general');
  const [logoMode, setLogoMode] = useState<'url' | 'upload'>('url');

  const handleSave = () => { updateSettings(form); toast.success('Settings saved successfully!'); };

  const sections = [
    { key: 'general' as const, label: 'General', icon: Store },
    { key: 'invoices' as const, label: 'Invoices', icon: Receipt },
    { key: 'appearance' as const, label: 'Appearance', icon: Palette },
    { key: 'notifications' as const, label: 'Alerts', icon: Bell },
  ];

  const dataSnapshot = useMemo(() => {
    const lowStock = inventory.filter(i => i.qtyOnHand <= i.reorderPoint).length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
    return {
      orders: orders.length,
      completedOrders,
      menuItems: menuItems.length,
      staff: users.length,
      inventory: inventory.length,
      lowStock,
      bookings: bookings.length,
      activeBookings,
    };
  }, [inventory, orders, menuItems, users, bookings]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-medium font-display ">Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Restaurant configuration &amp; preferences</p>
          </div>
        </div>
        <button onClick={handleSave} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all self-start sm:self-auto">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                activeSection === s.key ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={activeSection === s.key}
            >
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'general' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <Store className="h-4 w-4 text-primary" />
                <h2 className="text-sm sm:text-base font-medium">Restaurant Profile</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Logo</label>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 shrink-0">
                      {form.logoUrl ? (
                        <img
                          src={form.logoUrl}
                          alt="Logo preview"
                          loading="lazy"
                          decoding="async"
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=200';
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50 w-fit">
                        <button
                          type="button"
                          onClick={() => { setLogoMode('url'); setForm({ ...form, logoUrl: '' }); }}
                          className={cn(
                            'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                            logoMode === 'url' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                          )}
                          aria-pressed={logoMode === 'url'}
                        >
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLogoMode('upload'); setForm({ ...form, logoUrl: '' }); }}
                          className={cn(
                            'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                            logoMode === 'upload' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                          )}
                          aria-pressed={logoMode === 'upload'}
                        >
                          Upload
                        </button>
                      </div>

                      {logoMode === 'url' ? (
                        <input
                          value={form.logoUrl}
                          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20"
                          placeholder="https://..."
                        />
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2_000_000) return toast.error('Please upload an image under 2MB');
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result;
                              if (typeof result === 'string') setForm({ ...form, logoUrl: result });
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted/60 file:px-3 file:py-2 file:text-xs file:font-bold file:text-muted-foreground hover:file:bg-muted transition-all"
                        />
                      )}
                    </div>
                    {form.logoUrl ? (
                      <button
                        type="button"
                        onClick={() => { setForm({ ...form, logoUrl: '' }); setLogoMode('url'); }}
                        className="px-4 py-3 rounded-xl bg-muted/60 text-muted-foreground text-xs font-bold hover:bg-muted transition-colors"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Restaurant Name</label>
                  <input value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Address</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Website</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" placeholder="www.example.com" />
                </div>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="h-4 w-4 text-gold" />
                <h2 className="text-sm sm:text-base font-medium">Finance</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm">
                    {['USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'CAD', 'AUD'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tax Rate (%)</label>
                  <input type="number" min="0" step="0.1" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20 tabular-nums" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tax ID</label>
                  <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" placeholder="VAT-00000000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Timezone</label>
                  <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm">
                    {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <Package className="h-4 w-4 text-secondary" />
                <h2 className="text-sm sm:text-base font-medium">Operations</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Default Prep Time (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.defaultPrepTimeMinutes}
                      onChange={(e) => setForm({ ...form, defaultPrepTimeMinutes: parseInt(e.target.value) || 10 })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20 tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Inventory Target Multiplier</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.inventoryTargetMultiplier}
                    onChange={(e) => setForm({ ...form, inventoryTargetMultiplier: parseInt(e.target.value) || 3 })}
                    className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20 tabular-nums"
                  />
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-muted/20 border border-border/50 px-3 py-2 text-xs text-muted-foreground">
                Suggested restock uses Target − On Hand. Target defaults to Reorder Point × Multiplier.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-4 w-4 text-secondary" />
                <h2 className="text-sm sm:text-base font-medium">Data Snapshot</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Orders</p>
                  <p className="text-sm font-medium tabular-nums mt-0.5">{dataSnapshot.orders}</p>
                </div>
                <div className="rounded-xl bg-fresh/5 border border-fresh/10 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completed</p>
                  <p className="text-sm font-medium tabular-nums mt-0.5 text-fresh">{dataSnapshot.completedOrders}</p>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Menu Items</p>
                  <p className="text-sm font-medium tabular-nums mt-0.5">{dataSnapshot.menuItems}</p>
                </div>
                <div className="rounded-xl bg-secondary/5 border border-secondary/10 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Staff</p>
                  <p className="text-sm font-medium tabular-nums mt-0.5">{dataSnapshot.staff}</p>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inventory</p>
                  <p className="text-sm font-medium tabular-nums mt-0.5">{dataSnapshot.inventory}</p>
                </div>
                <div className="rounded-xl bg-destructive/5 border border-destructive/10 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Low Stock</p>
                  <p className="text-sm font-medium tabular-nums mt-0.5 text-destructive">{dataSnapshot.lowStock}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <h2 className="text-sm sm:text-base font-medium">System</h2>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'App Version', value: '1.0.0' },
                  { label: 'Platform', value: 'RestroCore Premium' },
                  { label: 'License', value: 'Active' },
                  { label: 'Last Backup', value: new Date().toLocaleDateString() },
                ].map(info => (
                  <div key={info.label} className="flex justify-between py-2.5 px-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground">{info.label}</span>
                    <span>{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'invoices' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <Receipt className="h-4 w-4 text-primary" />
                <h2 className="text-sm sm:text-base font-medium">Invoice &amp; Receipt</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Paper Size</label>
                  <select value={form.invoicePaperSize} onChange={(e) => setForm({ ...form, invoicePaperSize: e.target.value as RestaurantSettings['invoicePaperSize'] })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm">
                    <option value="a4">A4</option>
                    <option value="a5">A5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Compact (Less Ink)</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, invoiceCompact: !form.invoiceCompact })}
                    className={cn('relative w-14 h-7 rounded-full transition-colors shadow-inner', form.invoiceCompact ? 'bg-primary' : 'bg-muted')}
                  >
                    <div className={cn('absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform', form.invoiceCompact ? 'translate-x-7' : 'translate-x-1')} />
                  </button>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Footer Note</label>
                  <textarea value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20 min-h-[90px]" placeholder="Thank you for your business!" />
                </div>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <IdCard className="h-4 w-4 text-secondary" />
                <h2 className="text-sm sm:text-base font-medium">Billing Identity</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Invoice Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Website</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tax ID</label>
                  <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm sm:text-base font-medium">Preview</h2>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/10 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{form.restaurantName || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.address || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.phone || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest">
                    PDF
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Paper</p>
                    <p className="text-sm font-medium mt-0.5">{form.invoicePaperSize.toUpperCase()}</p>
                  </div>
                  <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compact</p>
                    <p className={cn('text-sm font-medium mt-0.5', form.invoiceCompact ? 'text-fresh' : 'text-muted-foreground')}>{form.invoiceCompact ? 'On' : 'Off'}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Footer</p>
                  <p className="text-xs text-foreground/80 mt-1 line-clamp-3">{form.receiptFooter || '—'}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Printer className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm sm:text-base font-medium">Print Tips</h2>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                  Keep compact mode enabled for lower ink usage.
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                  Prefer A5 for smaller invoices and faster printing.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <Palette className="h-4 w-4 text-primary" />
                <h2 className="text-sm sm:text-base font-medium">Theme</h2>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-warning" />}
                  <div>
                    <p className="text-sm sm:text-base font-medium">Dark Mode</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">A softer, premium dark theme</p>
                  </div>
                </div>
                <button onClick={toggleDarkMode} className={cn('relative w-14 h-7 rounded-full transition-colors shadow-inner', darkMode ? 'bg-primary' : 'bg-muted')}>
                  <div className={cn('absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform', darkMode ? 'translate-x-7' : 'translate-x-1')} />
                </button>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <ImageIcon className="h-4 w-4 text-secondary" />
                <h2 className="text-sm sm:text-base font-medium">Preview</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Background', cls: 'bg-background border border-border/50' },
                  { label: 'Card', cls: 'bg-card border border-border/50' },
                  { label: 'Primary', cls: 'bg-primary text-primary-foreground' },
                  { label: 'Accent', cls: 'bg-fresh text-fresh-foreground' },
                ].map(t => (
                  <div key={t.label} className={cn('h-20 sm:h-24 rounded-2xl flex items-center justify-center text-xs font-bold', t.cls)}>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm sm:text-base font-medium">Quick Links</h2>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  Theme changes apply instantly.
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  Adjust invoice settings for printing and PDF exports.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 sm:p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm sm:text-base font-medium">Alerts &amp; Notifications</h2>
          </div>
          {([
            { key: 'notifyNewOrders' as const, label: 'New Order Alerts', desc: 'Get notified when new orders arrive', accent: 'bg-primary' },
            { key: 'notifyLowStock' as const, label: 'Low Stock Warnings', desc: 'Alert when inventory falls below reorder point', accent: 'bg-destructive' },
            { key: 'notifyBookings' as const, label: 'Booking Reminders', desc: 'Upcoming reservation reminders', accent: 'bg-secondary' },
            { key: 'notifyKitchenOverdue' as const, label: 'Kitchen Overdue', desc: 'Alert for orders exceeding prep time', accent: 'bg-warning' },
            { key: 'notifyDailySummary' as const, label: 'Daily Summary', desc: 'End-of-day performance summary', accent: 'bg-gold' },
          ]).map((n) => (
            <div key={n.key} className="flex items-center justify-between py-4 border-b border-border/20 last:border-0">
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', n.accent)} />
                  {n.label}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{n.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, [n.key]: !form[n.key] })}
                className={cn('relative w-12 h-6 rounded-full transition-colors shadow-inner', form[n.key] ? 'bg-primary' : 'bg-muted')}
                aria-pressed={form[n.key]}
              >
                <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform', form[n.key] ? 'translate-x-6' : 'translate-x-0.5')} />
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
