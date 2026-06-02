import { useRestaurantStore } from '@/store/useRestaurantStore';
import { useMemo, useState } from 'react';
import { Users, Search, ShoppingCart, Phone, TrendingUp, Star, Download, Clock, User2, Mail, MapPin, CalendarDays, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { gravatarUrl } from '@/lib/gravatar';

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  createdAt: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  status: 'active' | 'inactive';
  totalSpent: number;
  orderCount: number;
  lastOrder: string;
  firstOrder: string;
  favoriteItems: string[];
  avgTicket: number;
}

export default function Customers() {
  const { orders, customers } = useRestaurantStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent' | 'name'>('spent');

  const formatShortDate = (dt: string) =>
    new Date(dt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });

  const formatDateTime = (dt: string) =>
    new Date(dt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const normalizePhoneForTel = (value: string) => value.replace(/[^\d+]/g, '');

  const timeSince = (dt: string) => {
    const days = Math.floor((Date.now() - new Date(dt).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const tierConfig: Record<CustomerRow['tier'], { label: string; badge: string; ring: string }> = {
    platinum: { label: 'Platinum', badge: 'bg-secondary/12 text-secondary border-secondary/20', ring: 'ring-1 ring-secondary/20' },
    gold: { label: 'Gold', badge: 'bg-gold/12 text-gold border-gold/20', ring: 'ring-1 ring-gold/20' },
    silver: { label: 'Silver', badge: 'bg-muted/60 text-muted-foreground border-border/50', ring: 'ring-1 ring-border/40' },
    bronze: { label: 'Bronze', badge: 'bg-warning/10 text-warning border-warning/20', ring: 'ring-1 ring-warning/20' },
  };

  const rows = useMemo<CustomerRow[]>(() => {
    // Build order stats keyed by customer name
    const orderStats: Record<string, { totalSpent: number; orderCount: number; lastOrder: string; firstOrder: string; favoriteItems: string[] }> = {};
    orders.filter((o) => o.customerName).forEach((o) => {
      const key = o.customerName!;
      if (!orderStats[key]) {
        orderStats[key] = { totalSpent: 0, orderCount: 0, lastOrder: o.createdAt, firstOrder: o.createdAt, favoriteItems: [] };
      }
      orderStats[key].totalSpent += o.total;
      orderStats[key].orderCount += 1;
      if (new Date(o.createdAt) > new Date(orderStats[key].lastOrder)) orderStats[key].lastOrder = o.createdAt;
      if (new Date(o.createdAt) < new Date(orderStats[key].firstOrder)) orderStats[key].firstOrder = o.createdAt;
      o.items.forEach((i) => { if (!orderStats[key].favoriteItems.includes(i.name)) orderStats[key].favoriteItems.push(i.name); });
    });

    // Start with store customers (have full profile data)
    const seen = new Set<string>();
    const result: CustomerRow[] = customers.map((c) => {
      seen.add(c.name);
      const stats = orderStats[c.name] ?? { totalSpent: 0, orderCount: 0, lastOrder: c.createdAt, firstOrder: c.createdAt, favoriteItems: [] };
      const totalSpent = stats.totalSpent;
      const orderCount = stats.orderCount;
      const avgTicket = totalSpent / Math.max(1, orderCount);
      const days = Math.floor((Date.now() - new Date(stats.lastOrder).getTime()) / 86400000);
      const status: CustomerRow['status'] = days <= 45 ? 'active' : 'inactive';
      let tier: CustomerRow['tier'] = 'bronze';
      if (totalSpent >= 1200) tier = 'platinum';
      else if (totalSpent >= 700) tier = 'gold';
      else if (totalSpent >= 300) tier = 'silver';
      return { id: c.id, name: c.name, phone: c.phone, email: c.email, location: c.location, createdAt: c.createdAt, tier, status, totalSpent, orderCount, lastOrder: stats.lastOrder, firstOrder: stats.firstOrder, favoriteItems: stats.favoriteItems, avgTicket };
    });

    // Also add any order-only customers not in the store (legacy walk-ins)
    Object.entries(orderStats).forEach(([name, stats]) => {
      if (seen.has(name)) return;
      const totalSpent = stats.totalSpent;
      const orderCount = stats.orderCount;
      const avgTicket = totalSpent / Math.max(1, orderCount);
      const days = Math.floor((Date.now() - new Date(stats.lastOrder).getTime()) / 86400000);
      const status: CustomerRow['status'] = days <= 45 ? 'active' : 'inactive';
      let tier: CustomerRow['tier'] = 'bronze';
      if (totalSpent >= 1200) tier = 'platinum';
      else if (totalSpent >= 700) tier = 'gold';
      else if (totalSpent >= 300) tier = 'silver';
      result.push({ id: `order-${name}`, name, phone: '', createdAt: stats.firstOrder, tier, status, totalSpent, orderCount, lastOrder: stats.lastOrder, firstOrder: stats.firstOrder, favoriteItems: stats.favoriteItems, avgTicket });
    });

    if (sortBy === 'spent') result.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sortBy === 'orders') result.sort((a, b) => b.orderCount - a.orderCount);
    if (sortBy === 'recent') result.sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [orders, customers, sortBy]);

  const filtered = rows.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalLifetimeValue = rows.reduce((s, c) => s + c.totalSpent, 0);
  const avgOrderValue = totalLifetimeValue / Math.max(1, rows.reduce((s, c) => s + c.orderCount, 0));
  const repeatCustomers = rows.filter((c) => c.orderCount > 1).length;

  const exportCustomers = () => {
    const csv = ['Name,Phone,Email,Location,Total Spent,Orders,Avg Ticket,Last Order',
      ...rows.map((c) => `${c.name},${c.phone},${c.email ?? ''},${c.location ?? ''},$${c.totalSpent.toFixed(2)},${c.orderCount},$${c.avgTicket.toFixed(2)},${new Date(c.lastOrder).toLocaleDateString()}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Customers exported!');
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-medium font-display">Customers</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">CRM &amp; customer insights</p>
          </div>
        </div>
        <button onClick={exportCustomers} className="flex items-center gap-1.5 glass-card px-3.5 py-2.5 rounded-xl text-xs hover:bg-muted/50 transition-colors self-start sm:self-auto">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Customers', value: rows.length.toString(), icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary', border: 'border-primary/20' },
          { label: 'Lifetime Value', value: `$${totalLifetimeValue.toFixed(0)}`, icon: TrendingUp, iconBg: 'bg-fresh/12', iconColor: 'text-fresh', border: 'border-fresh/20' },
          { label: 'Avg Order', value: `$${avgOrderValue.toFixed(2)}`, icon: ShoppingCart, iconBg: 'bg-secondary/12', iconColor: 'text-secondary', border: 'border-secondary/20' },
          { label: 'Repeat Customers', value: repeatCustomers.toString(), icon: Star, iconBg: 'bg-gold/12', iconColor: 'text-gold', border: 'border-gold/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('glass-card p-4 sm:p-5 flex items-center gap-4 border', stat.border)}>
            <div className={cn('h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-border flex items-center justify-center shrink-0 shadow-sm', stat.iconBg)}>
              <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-medium sm:text-3xl leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="space-y-4">
        <div className="relative w-full group">
          <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" strokeWidth={2.25} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email or location..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border/50 bg-card text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
            {([
              { key: 'spent' as const, label: 'Top Spenders', icon: TrendingUp },
              { key: 'orders' as const, label: 'Most Orders', icon: ShoppingCart },
              { key: 'recent' as const, label: 'Recent', icon: Clock },
              { key: 'name' as const, label: 'A–Z', icon: User2 },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                  sortBy === s.key ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-pressed={sortBy === s.key}
              >
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground glass-card">
          <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
            <Users className="h-8 w-8 opacity-20" />
          </div>
          <p className="text-base">No customers found</p>
          <p className="text-sm mt-1">Customers appear here after they place orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((customer, i) => {
            const tier = tierConfig[customer.tier];
            const tel = customer.phone ? normalizePhoneForTel(customer.phone) : '';
            const active = customer.status === 'active';
            const avatarUrl = customer.email ? gravatarUrl(customer.email) : null;

            return (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3 }}
                className={cn('glass-card rounded-2xl border border-border/50 p-4 sm:p-5 hover:shadow-xl transition-all overflow-hidden', tier.ring)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-border/50 shrink-0 bg-muted/20 flex items-center justify-center">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={customer.name}
                          loading="lazy"
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const t = e.currentTarget;
                            t.style.display = 'none';
                            t.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={cn('flex items-center justify-center h-full w-full', avatarUrl ? 'hidden' : '')}>
                        <User className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <div className={cn('absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-background', active ? 'bg-fresh' : 'bg-destructive')} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium truncate">{customer.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 min-w-0">
                        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border leading-none whitespace-nowrap', tier.badge)}>
                          {tier.label}
                        </span>
                        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border leading-none whitespace-nowrap', active ? 'bg-fresh/12 text-fresh border-fresh/20' : 'bg-destructive/10 text-destructive border-destructive/20')}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-none">
                    <a
                      href={tel ? `tel:${tel}` : undefined}
                      aria-label={`Call ${customer.name}`}
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center transition-colors border',
                        tel ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' : 'bg-muted/40 text-muted-foreground border-border/50 pointer-events-none opacity-50'
                      )}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                    <a
                      href={tel ? `sms:${tel}` : undefined}
                      aria-label={`Message ${customer.name}`}
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center transition-colors border',
                        tel ? 'bg-secondary/12 text-secondary border-secondary/20 hover:bg-secondary/15' : 'bg-muted/40 text-muted-foreground border-border/50 pointer-events-none opacity-50'
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Contact info — always render rows, show empty if missing */}
                <div className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{customer.phone || <span className="italic opacity-50">No phone</span>}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{customer.email || <span className="italic opacity-50">No email</span>}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{customer.location || <span className="italic opacity-50">No location</span>}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Purchases</p>
                    <p className="text-sm font-medium tabular-nums mt-0.5">{customer.orderCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Spent</p>
                    <p className="text-sm font-medium tabular-nums mt-0.5">${customer.totalSpent.toFixed(0)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg</p>
                    <p className="text-sm font-medium tabular-nums mt-0.5">${customer.avgTicket.toFixed(0)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground border-t border-border/30 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      <span className="truncate">Joined</span>
                    </span>
                    <span className="text-foreground/80 whitespace-nowrap">{formatShortDate(customer.firstOrder)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="truncate">Last interaction</span>
                    </span>
                    <span className="text-foreground/80 whitespace-nowrap" title={formatDateTime(customer.lastOrder)}>
                      {timeSince(customer.lastOrder)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
