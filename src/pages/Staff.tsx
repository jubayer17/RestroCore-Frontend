import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Users, Shield, Mail, Phone, Plus, X, Power, Search, Edit3, Check, DollarSign, Filter, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { UserRole, User } from '@/types/restaurant';

const roleBadge: Record<UserRole, { chip: string; ring: string; avatar: string }> = {
  admin: { chip: 'bg-primary/10 text-primary border-primary/20', ring: 'ring-1 ring-primary/15', avatar: 'bg-primary/10 text-primary border-primary/20' },
  manager: { chip: 'bg-secondary/10 text-secondary border-secondary/20', ring: 'ring-1 ring-secondary/15', avatar: 'bg-secondary/10 text-secondary border-secondary/20' },
  cashier: { chip: 'bg-accent/10 text-accent border-accent/20', ring: 'ring-1 ring-accent/15', avatar: 'bg-accent/10 text-accent border-accent/20' },
  chef: { chip: 'bg-warning/10 text-warning border-warning/20', ring: 'ring-1 ring-warning/15', avatar: 'bg-warning/10 text-warning border-warning/20' },
  waiter: { chip: 'bg-fresh/10 text-fresh border-fresh/20', ring: 'ring-1 ring-fresh/15', avatar: 'bg-fresh/10 text-fresh border-fresh/20' },
  driver: { chip: 'bg-muted/40 text-muted-foreground border-border/50', ring: 'ring-1 ring-border/40', avatar: 'bg-muted/40 text-muted-foreground border-border/50' },
  accountant: { chip: 'bg-gold/10 text-gold border-gold/20', ring: 'ring-1 ring-gold/15', avatar: 'bg-gold/10 text-gold border-gold/20' },
};

const roles: UserRole[] = ['admin', 'manager', 'cashier', 'chef', 'waiter', 'driver', 'accountant'];

type NewUserForm = { name: string; email: string; phone: string; role: UserRole; hourlyRate: string };
type EditUserForm = { name: string; email: string; phone: string; role: UserRole; hourlyRate: string; avatar: string };
type BaseFieldKey = 'name' | 'email' | 'phone';

export default function Staff() {
  const { users, addUser, toggleUserActive, updateUser } = useRestaurantStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ name: '', email: '', phone: '', role: 'waiter' as UserRole, hourlyRate: '', avatar: '' });
  const [editAvatarMode, setEditAvatarMode] = useState<'url' | 'upload'>('url');
  const [editAvatarObjectUrl, setEditAvatarObjectUrl] = useState<string>('');
  const [form, setForm] = useState<NewUserForm>({ name: '', email: '', phone: '', role: 'waiter' as UserRole, hourlyRate: '16' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const setFormField = (key: BaseFieldKey, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Fill required fields');
    const user: User = { id: `user-${Date.now()}`, name: form.name, email: form.email, phone: form.phone, role: form.role, hourlyRate: parseFloat(form.hourlyRate) || 16, active: true };
    addUser(user);
    toast.success(`${form.name} added to team!`);
    setForm({ name: '', email: '', phone: '', role: 'waiter', hourlyRate: '16' });
    setShowAdd(false);
  };

  const startEdit = (user: User) => {
    if (editAvatarObjectUrl) URL.revokeObjectURL(editAvatarObjectUrl);
    setEditAvatarObjectUrl('');
    setEditAvatarMode('url');
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, phone: user.phone, role: user.role, hourlyRate: user.hourlyRate.toString(), avatar: user.avatar || '' });
  };
  const closeEdit = useCallback(() => {
    if (editAvatarObjectUrl) URL.revokeObjectURL(editAvatarObjectUrl);
    setEditAvatarObjectUrl('');
    setEditAvatarMode('url');
    setEditingId(null);
  }, [editAvatarObjectUrl]);
  const saveEdit = (userId: string) => {
    updateUser(userId, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      role: editForm.role,
      hourlyRate: parseFloat(editForm.hourlyRate) || 16,
      avatar: editForm.avatar || undefined,
    });
    closeEdit();
    toast.success('Staff member updated!');
  };

  const filtered = useMemo(() => users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.active : !u.active);
    return matchRole && matchSearch && matchStatus;
  }), [users, filterRole, search, statusFilter]);

  const activeCount = users.filter(u => u.active).length;
  const totalPayroll = users.filter(u => u.active).reduce((s, u) => s + u.hourlyRate * 8, 0);

  const editingUser = editingId ? users.find(u => u.id === editingId) : null;

  useEffect(() => {
    return () => {
      if (editAvatarObjectUrl) URL.revokeObjectURL(editAvatarObjectUrl);
    };
  }, [editAvatarObjectUrl]);

  useEffect(() => {
    if (!editingUser) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEdit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingUser, closeEdit]);

  const hashString = (value: string) => {
    let h = 0;
    for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
    return Math.abs(h);
  };

  const avatarUrl = (u: User) => {
    const seed = u.email || u.name || u.id;
    const h = hashString(seed);
    const gender = h % 2 === 0 ? 'men' : 'women';
    const idx = (h % 99) + 1;
    return `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-medium sm:text-3xl font-medium font-display ">Staff</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{users.length} members · {activeCount} active</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all self-start sm:self-auto">
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total Staff', value: users.length, icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary', border: 'border-primary/20' },
          { label: 'On Duty', value: activeCount, icon: Check, iconBg: 'bg-fresh/12', iconColor: 'text-fresh', border: 'border-fresh/20' },
          { label: 'Est. Daily Pay', value: `$${totalPayroll.toFixed(0)}`, icon: DollarSign, iconBg: 'bg-secondary/12', iconColor: 'text-secondary', border: 'border-secondary/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('glass-card p-4 sm:p-5 flex items-center gap-4 border', stat.border)}>
            <div className={cn('h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-border flex items-center justify-center shrink-0 shadow-sm', stat.iconBg)}>
              <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-medium sm:text-3xl font-medium leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="relative w-full group">
          <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" strokeWidth={2.25} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border/50 bg-card text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 capitalize whitespace-nowrap',
                    statusFilter === s ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-pressed={statusFilter === s}
                >
                  <Filter className="h-3.5 w-3.5" /> {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide md:ml-auto">
            <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50">
              <button
                onClick={() => setFilterRole('all')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                  filterRole === 'all' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-pressed={filterRole === 'all'}
              >
                <User2 className="h-3.5 w-3.5" /> All ({users.length})
              </button>
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap capitalize',
                    filterRole === role ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-pressed={filterRole === role}
                >
                  {role} ({users.filter(u => u.role === role).length})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd} className="glass-card p-5 sm:p-6 space-y-4 overflow-hidden">
            <h3 className=" text-sm sm:text-base lg:text-lg">New Staff Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: 'name', label: 'Full Name *', placeholder: 'John Smith', required: true },
                { key: 'email', label: 'Email *', placeholder: 'john@restrocore.com', type: 'email', required: true },
                { key: 'phone', label: 'Phone', placeholder: '+1 555-0123' },
              ] as const).map((f: { key: BaseFieldKey; label: string; placeholder: string; type?: string; required?: boolean }) => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</label>
                  <input placeholder={f.placeholder} type={f.type || 'text'} value={form[f.key]} onChange={(e) => setFormField(f.key, e.target.value)} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20" required={f.required} />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm">
                  {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Hourly Rate ($)</label>
                <input placeholder="16" type="number" step="0.5" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all">Add to Team</button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((user, i) => {
          const badge = roleBadge[user.role];
          return (
            <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn('glass-card rounded-2xl border border-border/50 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all', badge.ring, !user.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn('relative h-14 w-14 rounded-2xl overflow-hidden border shrink-0 shadow-sm', badge.avatar)}>
                    <img
                      src={user.avatar || avatarUrl(user)}
                      alt={`${user.name} profile`}
                      loading="lazy"
                      decoding="async"
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200';
                      }}
                    />
                    <div className={cn('absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-background', user.active ? 'bg-fresh' : 'bg-destructive')} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-medium truncate">{user.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={cn('inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full capitalize border font-bold tracking-wider', badge.chip)}>
                        <Shield className="h-3.5 w-3.5" /> {user.role}
                      </span>
                      <span className={cn('inline-flex items-center gap-2 text-[10px] px-3 py-1 rounded-full border font-bold tracking-wider uppercase', user.active ? 'bg-fresh/10 text-fresh border-fresh/20' : 'bg-destructive/10 text-destructive border-destructive/20')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', user.active ? 'bg-fresh' : 'bg-destructive')} />
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{user.email}</span>
                  </p>
                  <a
                    href={`mailto:${user.email}`}
                    className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Email
                  </a>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/50 px-3 py-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 shrink-0 text-secondary" />
                    <span className="truncate">{user.phone || '—'}</span>
                  </p>
                  {user.phone ? (
                    <a
                      href={`tel:${user.phone.replace(/[^\d+]/g, '')}`}
                      className="text-[11px] font-bold text-muted-foreground hover:text-secondary transition-colors"
                    >
                      Call
                    </a>
                  ) : (
                    <span className="text-[11px] font-bold text-muted-foreground/60">Call</span>
                  )}
                </div>
                <div className="rounded-xl bg-gold/5 border border-gold/10 px-3 py-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-2 min-w-0">
                    <DollarSign className="h-4 w-4 shrink-0 text-gold" />
                    <span className="truncate">Hourly Rate</span>
                  </p>
                  <p className="text-sm font-medium tabular-nums text-foreground/90">${user.hourlyRate}/hr</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/30 flex gap-2">
                <button
                  onClick={() => startEdit(user)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => { toggleUserActive(user.id); toast.success(`${user.name} ${user.active ? 'deactivated' : 'activated'}`); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-colors',
                    user.active ? 'bg-destructive/10 text-destructive hover:bg-destructive/15' : 'bg-fresh/10 text-fresh hover:bg-fresh/15'
                  )}
                >
                  <Power className="h-4 w-4" /> {user.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={closeEdit} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="relative w-full max-w-2xl glass-card p-6 space-y-6 rounded-3xl max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label={`Edit ${editingUser.name}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-xl font-medium truncate">Edit Staff Member</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{editingUser.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Close staff edit modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Profile Image</label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 shrink-0">
                      <img
                        src={editForm.avatar || avatarUrl(editingUser)}
                        alt="Profile preview"
                        loading="lazy"
                        decoding="async"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/50 w-fit">
                        <button
                          type="button"
                          onClick={() => {
                            setEditAvatarMode('url');
                            if (editAvatarObjectUrl) URL.revokeObjectURL(editAvatarObjectUrl);
                            setEditAvatarObjectUrl('');
                            setEditForm((s) => ({ ...s, avatar: '' }));
                          }}
                          className={cn(
                            'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                            editAvatarMode === 'url' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                          )}
                          aria-pressed={editAvatarMode === 'url'}
                        >
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditAvatarMode('upload');
                            setEditForm((s) => ({ ...s, avatar: '' }));
                          }}
                          className={cn(
                            'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                            editAvatarMode === 'upload' ? 'bg-card text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                          )}
                          aria-pressed={editAvatarMode === 'upload'}
                        >
                          Upload
                        </button>
                      </div>

                      {editAvatarMode === 'url' ? (
                        <input
                          value={editForm.avatar}
                          onChange={(e) => {
                            if (editAvatarObjectUrl) URL.revokeObjectURL(editAvatarObjectUrl);
                            setEditAvatarObjectUrl('');
                            setEditForm({ ...editForm, avatar: e.target.value });
                          }}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card text-sm focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (editAvatarObjectUrl) URL.revokeObjectURL(editAvatarObjectUrl);
                            const url = URL.createObjectURL(file);
                            setEditAvatarObjectUrl(url);
                            setEditForm({ ...editForm, avatar: url });
                          }}
                          className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted/60 file:px-3 file:py-2 file:text-xs file:font-bold file:text-muted-foreground hover:file:bg-muted transition-all"
                        />
                      )}

                      {editForm.avatar ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (editAvatarObjectUrl) URL.revokeObjectURL(editAvatarObjectUrl);
                            setEditAvatarObjectUrl('');
                            setEditAvatarMode('url');
                            setEditForm((s) => ({ ...s, avatar: '' }));
                          }}
                          className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
                        >
                          Remove image
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
                  <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })} className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card text-sm">
                    {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Hourly Rate ($)</label>
                  <input value={editForm.hourlyRate} onChange={e => setEditForm({ ...editForm, hourlyRate: e.target.value })} type="number" step="0.5" className="w-full px-4 py-3 border border-border/50 rounded-xl bg-card text-sm focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit} className="px-6 py-3 rounded-xl text-sm font-bold bg-muted/60 hover:bg-muted transition-colors">Cancel</button>
                <button type="button" onClick={() => saveEdit(editingUser.id)} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
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
