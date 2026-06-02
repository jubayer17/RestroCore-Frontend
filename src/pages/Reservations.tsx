import { useRestaurantStore } from '@/store/useRestaurantStore';
import { useState, useMemo } from 'react';
import { CalendarDays, Plus, Clock, Users, X, Check, Ban, AlertTriangle, CheckCircle2, Search, Phone, StickyNote, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Booking, BookingStatus } from '@/types/restaurant';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusBadge: Record<BookingStatus, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-primary/12', text: 'text-primary' },
  pending: { bg: 'bg-warning/12', text: 'text-warning' },
  cancelled: { bg: 'bg-destructive/12', text: 'text-destructive' },
  'no-show': { bg: 'bg-muted', text: 'text-muted-foreground' },
  completed: { bg: 'bg-fresh/12', text: 'text-fresh' },
};

const statusActions: { status: BookingStatus; label: string; icon: typeof Check; style: string }[] = [
  { status: 'confirmed', label: 'Confirm', icon: Check, style: 'bg-primary text-primary-foreground hover:bg-primary/90' },
  { status: 'completed', label: 'Complete', icon: CheckCircle2, style: 'bg-fresh text-fresh-foreground hover:bg-fresh/90' },
  { status: 'no-show', label: 'No-show', icon: AlertTriangle, style: 'bg-warning text-warning-foreground hover:bg-warning/90' },
  { status: 'cancelled', label: 'Cancel', icon: Ban, style: 'bg-destructive text-destructive-foreground hover:bg-destructive/90' },
];

export default function Reservations() {
  const { bookings, addBooking, updateBookingStatus, tables } = useRestaurantStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [form, setForm] = useState({ customerName: '', customerPhone: '', tableId: '', datetime: '', partySize: '2', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.datetime) return toast.error('Fill required fields');
    if (new Date(form.datetime) < new Date()) return toast.error('Cannot book in the past');
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      tableIds: form.tableId ? [form.tableId] : [],
      datetime: new Date(form.datetime).toISOString(),
      partySize: parseInt(form.partySize),
      status: 'confirmed',
      notes: form.notes,
    };
    addBooking(booking);
    toast.success('Reservation confirmed!');
    setShowForm(false);
    setForm({ customerName: '', customerPhone: '', tableId: '', datetime: '', partySize: '2', notes: '' });
  };

  const formatDate = (dt: string) => new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatDay = (dt: string) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const filtered = useMemo(() => {
    let result = bookings;
    if (filter !== 'all') result = result.filter(b => b.status === filter);
    if (search) result = result.filter(b => b.customerName.toLowerCase().includes(search.toLowerCase()) || b.customerPhone.includes(search));
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 86400000);
      if (dateFilter === 'today') result = result.filter(b => { const d = new Date(b.datetime); return d >= todayStart && d < todayEnd; });
      if (dateFilter === 'upcoming') result = result.filter(b => new Date(b.datetime) >= now);
      if (dateFilter === 'past') result = result.filter(b => new Date(b.datetime) < now);
    }
    return result.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  }, [bookings, filter, search, dateFilter]);

  const statusCounts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const todayCount = bookings.filter(b => {
    const d = new Date(b.datetime);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }).length;
  const totalGuests = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').reduce((s, b) => s + b.partySize, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-medium sm:text-3xl font-medium font-display ">Reservations</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{bookings.length} bookings · {todayCount} today · {totalGuests} guests expected</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto h-12 sm:h-auto flex items-center justify-center sm:justify-start gap-2 bg-primary text-primary-foreground px-5 py-3 sm:py-2.5 rounded-2xl text-sm font-semibold hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Booking'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Today', value: todayCount, icon: CalendarDays, iconBg: 'bg-primary/10', iconColor: 'text-primary', border: 'border-primary/20' },
          { label: 'Confirmed', value: statusCounts['confirmed'] || 0, icon: Check, iconBg: 'bg-fresh/12', iconColor: 'text-fresh', border: 'border-fresh/20' },
          { label: 'Expected Guests', value: totalGuests, icon: Users, iconBg: 'bg-secondary/12', iconColor: 'text-secondary', border: 'border-secondary/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('glass-card p-4 sm:p-5 flex items-center gap-4 border border-border/50', stat.border)}>
            <div className={cn('h-10 w-10 sm:h-12 sm:w-12 rounded-xl border border-border flex items-center justify-center shadow-sm', stat.iconBg)}>
              <stat.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', stat.iconColor)} />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-medium leading-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Date Filter */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full group">
          <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" strokeWidth={2.25} />
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border/50 bg-card text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm" />
        </div>
        <div className="md:hidden space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="h-12 w-full rounded-2xl bg-card border border-border/50 px-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium capitalize truncate">{dateFilter === 'all' ? 'All dates' : dateFilter}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              {([
                { key: 'all' as const, label: 'All dates', icon: CalendarDays },
                { key: 'today' as const, label: 'Today', icon: CalendarDays },
                { key: 'upcoming' as const, label: 'Upcoming', icon: Clock },
                { key: 'past' as const, label: 'Past', icon: Ban },
              ]).map((opt) => (
                <DropdownMenuItem key={opt.key} onSelect={() => setDateFilter(opt.key)} className="flex items-center gap-2">
                  <opt.icon className="h-4 w-4" />
                  <span className="text-sm">{opt.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
            {(['all', 'today', 'upcoming', 'past'] as const).map(d => (
              <button key={d} onClick={() => setDateFilter(d)}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 capitalize whitespace-nowrap',
                  dateFilter === d ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                )}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="h-12 w-full rounded-2xl bg-card border border-border/50 px-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium capitalize truncate">{filter === 'all' ? 'All statuses' : filter}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
            <DropdownMenuItem onSelect={() => setFilter('all')} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm">All</span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">({bookings.length})</span>
            </DropdownMenuItem>
            {([
              { status: 'confirmed' as const, icon: CheckCircle2, label: 'Confirmed' },
              { status: 'pending' as const, icon: Clock, label: 'Pending' },
              { status: 'completed' as const, icon: Check, label: 'Completed' },
              { status: 'no-show' as const, icon: AlertTriangle, label: 'No-show' },
              { status: 'cancelled' as const, icon: Ban, label: 'Cancelled' },
            ]).map((s) => (
              <DropdownMenuItem key={s.status} onSelect={() => setFilter(s.status)} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  <s.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm truncate">{s.label}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">({statusCounts[s.status] || 0})</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden md:flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={cn('px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all', filter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'glass-card')}>
          All ({bookings.length})
        </button>
        {(['confirmed', 'pending', 'completed', 'no-show', 'cancelled'] as BookingStatus[]).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all capitalize', filter === s ? 'bg-primary text-primary-foreground shadow-md' : 'glass-card')}>
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit} className="glass-card p-5 sm:p-6 space-y-4 overflow-hidden">
            <h3 className=" text-sm sm:text-base lg:text-lg">New Reservation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Guest Name *</label>
                <input placeholder="John Smith" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Phone</label>
                <input placeholder="+1 555-0123" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Date & Time *</label>
                <input type="datetime-local" value={form.datetime} onChange={(e) => setForm({ ...form, datetime: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Party Size</label>
                <input type="number" placeholder="2" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20" min="1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Table</label>
                <select value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm">
                  <option value="">Auto-assign table</option>
                  {tables.map((t) => <option key={t.id} value={t.id}>{t.label} ({t.seats} seats)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Notes</label>
                <input placeholder="Special requests, allergies..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all">
              Confirm Reservation
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground glass-card">
          <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-muted/40 border border-border flex items-center justify-center">
            <CalendarDays className="h-8 w-8 opacity-20" />
          </div>
          <p className=" text-base">No reservations found</p>
          <p className="text-sm mt-1">Try adjusting filters or create a new booking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((b, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              key={b.id} className="glass-card p-4 sm:p-5 flex flex-col space-y-4 border border-border/50 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate">{b.customerName}</p>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" /> {b.customerPhone || "—"}
                  </p>
                </div>
                <div className={cn("text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 capitalize", statusBadge[b.status].bg, statusBadge[b.status].text)}>
                  {b.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground border-t border-border/40 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider">Date</p>
                  <p className="text-sm text-foreground font-medium">{formatDay(b.datetime)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider">Time</p>
                  <p className="text-sm text-foreground font-medium">{new Date(b.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider">Guests</p>
                  <p className="text-sm text-foreground font-medium flex items-center gap-2"><Users className="h-4 w-4" /> {b.partySize}</p>
                </div>
              </div>

              {b.notes && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <StickyNote className="h-4 w-4" /> {b.notes}
                  </p>
                </div>
              )}

              <div className="flex-1"></div>

              {!['completed', 'cancelled'].includes(b.status) && (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 border-t border-border pt-4">
                  {statusActions.filter(a => a.status !== b.status).map(action => (
                    <button key={action.status} onClick={() => { updateBookingStatus(b.id, action.status); toast.success(`Booking ${action.label.toLowerCase()}ed`); }}
                      className={cn("flex-1 flex items-center justify-center gap-2 text-sm md:text-xs px-3 py-3 md:py-2 rounded-xl transition-colors", action.style)}>
                      <action.icon className="h-4 w-4" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
