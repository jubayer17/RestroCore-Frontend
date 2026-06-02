import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useRestaurantStore } from "./store/useRestaurantStore";
import AppLayout from "./components/AppLayout";

// Lazy-loaded route components
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PointOfSale = lazy(() => import("./pages/PointOfSale"));
const FloorPlan = lazy(() => import("./pages/FloorPlan"));
const Reservations = lazy(() => import("./pages/Reservations"));
const KitchenKDS = lazy(() => import("./pages/KitchenKDS"));
const Delivery = lazy(() => import("./pages/Delivery"));
const MenuBuilder = lazy(() => import("./pages/MenuBuilder"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Orders = lazy(() => import("./pages/Orders"));
const Staff = lazy(() => import("./pages/Staff"));
const Customers = lazy(() => import("./pages/Customers"));
const Settings = lazy(() => import("./pages/Settings"));
const AnalyticsPage = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoutes() {
  const isAuthenticated = useRestaurantStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/point-of-sale" element={<PointOfSale />} />
              <Route path="/floor-plan" element={<FloorPlan />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/kitchen-kds" element={<KitchenKDS />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/menu-builder" element={<MenuBuilder />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/invoices" element={<Navigate to="/orders" replace />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<Navigate to="/analytics" replace />} />
              <Route path="/report" element={<Navigate to="/analytics" replace />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/pos" element={<Navigate to="/point-of-sale" replace />} />
              <Route path="/tables" element={<Navigate to="/floor-plan" replace />} />
              <Route path="/bookings" element={<Navigate to="/reservations" replace />} />
              <Route path="/kitchen" element={<Navigate to="/kitchen-kds" replace />} />
              <Route path="/menu" element={<Navigate to="/menu-builder" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Analytics />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
