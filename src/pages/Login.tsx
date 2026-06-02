import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ADMIN_CREDENTIALS } from '@/data/mocks/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useRestaurantStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');

    setLoading(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      login(email);
      toast.success('Welcome back, Maria! 👋');
      navigate('/', { replace: true });
    } else {
      toast.error('Invalid credentials', { description: 'Check email and password' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-medium font-display ">RestroCore</h1>
          <p className="text-sm text-muted-foreground mt-1 ">Restaurant Management System</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg ">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@restrocore.com"
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-border/60 bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm hover:bg-primary/90 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="border-t border-border/40 pt-4">
            <div className="bg-muted/50 rounded-xl p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Demo Credentials</p>
              <p className="text-xs text-foreground font-mono">admin@restrocore.com</p>
              <p className="text-xs text-foreground font-mono">admin123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 ">
          © 2026 RestroCore · Premium Restaurant Management
        </p>
      </motion.div>
    </div>
  );
}
