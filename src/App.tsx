import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import InstallPrompt from "@/components/InstallPrompt";
import RealtimeNotifier from "@/components/RealtimeNotifier";
import { isCapacitorBuild } from "@/lib/platform";

const Router = isCapacitorBuild() ? HashRouter : BrowserRouter;

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import AccountDeletion from "./pages/AccountDeletion.tsx";
import Install from "./pages/Install.tsx";

// Client
import ClientSignUp from "./pages/client/ClientSignUp.tsx";
import ClientDashboard from "./pages/client/ClientDashboard.tsx";
import ClientBookings from "./pages/client/ClientBookings.tsx";
import BookingDetail from "./pages/client/BookingDetail.tsx";
import ClientTracking from "./pages/client/ClientTracking.tsx";
import ClientMap from "./pages/client/ClientMap.tsx";
import ClientProfile from "./pages/client/ClientProfile.tsx";
import ClientProfileEdit from "./pages/client/ClientProfileEdit.tsx";
import ClientPayments from "./pages/client/ClientPayments.tsx";
import ClientMembership from "./pages/client/ClientMembership.tsx";
import ClientNotifications from "./pages/client/ClientNotifications.tsx";
import ClientSupport from "./pages/client/ClientSupport.tsx";
import ServiceRequest from "./pages/client/ServiceRequest.tsx";

// Provider
import ProviderOnboarding from "./pages/provider/ProviderOnboarding.tsx";
import ProviderDashboard from "./pages/provider/ProviderDashboard.tsx";
import ProviderMap from "./pages/provider/ProviderMap.tsx";
import ProviderJobs from "./pages/provider/ProviderJobs.tsx";
import ProviderJobDetail from "./pages/provider/ProviderJobDetail.tsx";
import ProviderEarnings from "./pages/provider/ProviderEarnings.tsx";
import ProviderProfile from "./pages/provider/ProviderProfile.tsx";
import ProviderBusinessInfo from "./pages/provider/ProviderBusinessInfo.tsx";
import ProviderDocuments from "./pages/provider/ProviderDocuments.tsx";
import ProviderSkills from "./pages/provider/ProviderSkillsPage.tsx";
import ProviderVehicle from "./pages/provider/ProviderVehiclePage.tsx";
import ProviderNotifications from "./pages/provider/ProviderNotifications.tsx";
import ProviderSupport from "./pages/provider/ProviderSupport.tsx";

// Shared
import Chat from "./pages/shared/Chat.tsx";

// Admin — lazy-loaded so Recharts + admin CRUD chunks don't ship in the
// initial bundle for client/provider users (they never navigate there).
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.tsx"));
const AdminApprovals = lazy(() => import("./pages/admin/AdminApprovals.tsx"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs.tsx"));
const AdminQuotes = lazy(() => import("./pages/admin/AdminQuotes.tsx"));
const AdminServiceTypes = lazy(() => import("./pages/admin/AdminServiceTypes.tsx"));

const AdminFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-accent" />
  </div>
);

const queryClient = new QueryClient();

const client = (el: JSX.Element) => <ProtectedRoute allow="client">{el}</ProtectedRoute>;
const provider = (el: JSX.Element) => <ProtectedRoute allow="provider">{el}</ProtectedRoute>;
const admin = (el: JSX.Element) => (
  <ProtectedRoute allow="admin">
    <Suspense fallback={<AdminFallback />}>{el}</Suspense>
  </ProtectedRoute>
);
const anyAuth = (el: JSX.Element) => <ProtectedRoute>{el}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <AuthProvider>
          <InstallPrompt />
          <RealtimeNotifier />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/account-deletion" element={<AccountDeletion />} />
            <Route path="/install" element={<Install />} />

            {/* Client */}
            <Route path="/client/signup" element={<ClientSignUp />} />
            <Route path="/client/dashboard" element={client(<ClientDashboard />)} />
            <Route path="/client/bookings" element={client(<ClientBookings />)} />
            <Route path="/client/bookings/:id" element={client(<BookingDetail />)} />
            <Route path="/client/tracking/:id" element={client(<ClientTracking />)} />
            <Route path="/client/map" element={client(<ClientMap />)} />
            <Route path="/client/profile" element={client(<ClientProfile />)} />
            <Route path="/client/profile/edit" element={client(<ClientProfileEdit />)} />
            <Route path="/client/payments" element={client(<ClientPayments />)} />
            <Route path="/client/membership" element={client(<ClientMembership />)} />
            <Route path="/client/notifications" element={client(<ClientNotifications />)} />
            <Route path="/client/support" element={client(<ClientSupport />)} />
            <Route path="/client/request" element={client(<ServiceRequest />)} />

            {/* Provider */}
            <Route path="/provider/onboarding" element={anyAuth(<ProviderOnboarding />)} />
            <Route path="/provider/dashboard" element={provider(<ProviderDashboard />)} />
            <Route path="/provider/map" element={provider(<ProviderMap />)} />
            <Route path="/provider/jobs" element={provider(<ProviderJobs />)} />
            <Route path="/provider/jobs/:id" element={provider(<ProviderJobDetail />)} />
            <Route path="/provider/earnings" element={provider(<ProviderEarnings />)} />
            <Route path="/provider/profile" element={provider(<ProviderProfile />)} />
            <Route path="/provider/profile/business" element={provider(<ProviderBusinessInfo />)} />
            <Route path="/provider/profile/documents" element={provider(<ProviderDocuments />)} />
            <Route path="/provider/profile/skills" element={provider(<ProviderSkills />)} />
            <Route path="/provider/profile/vehicle" element={provider(<ProviderVehicle />)} />
            <Route path="/provider/notifications" element={provider(<ProviderNotifications />)} />
            <Route path="/provider/support" element={provider(<ProviderSupport />)} />

            {/* Shared */}
            <Route path="/chat/:bookingId" element={anyAuth(<Chat />)} />

            {/* Admin */}
            <Route path="/admin" element={admin(<AdminDashboard />)} />
            <Route path="/admin/users" element={admin(<AdminUsers />)} />
            <Route path="/admin/approvals" element={admin(<AdminApprovals />)} />
            <Route path="/admin/jobs" element={admin(<AdminJobs />)} />
            <Route path="/admin/quotes" element={admin(<AdminQuotes />)} />
            <Route path="/admin/service-types" element={admin(<AdminServiceTypes />)} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
