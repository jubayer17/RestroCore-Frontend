import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import NotificationBell from './NotificationBell';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode, logout } = useRestaurantStore();

  const handleNavClick = () => setSidebarOpen(false);

  return (
  <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
     className="fixed inset-0 bg-foreground/20 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed, own scroll */}
   <div className={cn(
        'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <AppSidebar onNavClick={handleNavClick} />
      </div>

      {/* Main content - independent scroll */}
   <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - sticky */}
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl shrink-0 z-10">
     <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
       className="lg:hidden h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
            >
       <Menu className="h-5 w-5" />
            </button>
      <div className="flex items-center gap-2 lg:hidden">
       <span className="text-lg">🍽️</span>
       <span className=" text-sm">RestroCore</span>
            </div>
          </div>
     <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
       className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
       {darkMode ? <Sun className="h-4 w-4 text-foreground/70" /> : <Moon className="h-4 w-4 text-foreground/70" />}
            </button>
            <NotificationBell />
            <button
              onClick={logout}
       className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Sign out"
            >
       <LogOut className="h-4 w-4 text-foreground/70" />
            </button>
          </div>
        </header>

        {/* Scrollable main area */}
    <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
