import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface NewCustomerData {
  name: string;
  phone: string;
  email?: string;
  location?: string;
}

interface NewCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: NewCustomerData) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ open, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const reset = () => {
    setName(''); setPhone(''); setEmail(''); setLocation('');
    setErrors({});
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onConfirm({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      location: location.trim() || undefined,
    });
    reset();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Add Customer</h2>
              <p className="text-[11px] text-muted-foreground">Name &amp; phone are required</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="e.g. John Smith"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                className={cn(
                  'w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow',
                  errors.name ? 'border-destructive' : 'border-border/50'
                )}
              />
            </div>
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Phone <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="tel"
                placeholder="e.g. +1 555 000 0000"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
                className={cn(
                  'w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow',
                  errors.phone ? 'border-destructive' : 'border-border/50'
                )}
              />
            </div>
            {errors.phone && <p className="text-[11px] text-destructive">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border/50 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Location <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border/50 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
