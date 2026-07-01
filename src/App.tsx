import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";

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

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminApprovals from "./pages/admin/AdminApprovals.tsx";
import AdminJobs from "./pages/admin/AdminJobs.tsx";
import AdminQuotes from "./pages/admin/AdminQuotes.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* Client */}
          <Route path="/client/signup" element={<ClientSignUp />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/bookings" element={<ClientBookings />} />
          <Route path="/client/bookings/:id" element={<BookingDetail />} />
          <Route path="/client/tracking/:id" element={<ClientTracking />} />
          <Route path="/client/map" element={<ClientMap />} />
          <Route path="/client/profile" element={<ClientProfile />} />
          <Route path="/client/profile/edit" element={<ClientProfileEdit />} />
          <Route path="/client/payments" element={<ClientPayments />} />
          <Route path="/client/membership" element={<ClientMembership />} />
          <Route path="/client/notifications" element={<ClientNotifications />} />
          <Route path="/client/support" element={<ClientSupport />} />
          <Route path="/client/request" element={<ServiceRequest />} />

          {/* Provider */}
          <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
          <Route path="/provider/map" element={<ProviderMap />} />
          <Route path="/provider/jobs" element={<ProviderJobs />} />
          <Route path="/provider/jobs/:id" element={<ProviderJobDetail />} />
          <Route path="/provider/earnings" element={<ProviderEarnings />} />
          <Route path="/provider/profile" element={<ProviderProfile />} />
          <Route path="/provider/profile/business" element={<ProviderBusinessInfo />} />
          <Route path="/provider/profile/documents" element={<ProviderDocuments />} />
          <Route path="/provider/profile/skills" element={<ProviderSkills />} />
          <Route path="/provider/profile/vehicle" element={<ProviderVehicle />} />
          <Route path="/provider/notifications" element={<ProviderNotifications />} />
          <Route path="/provider/support" element={<ProviderSupport />} />

          {/* Shared */}
          <Route path="/chat/:bookingId" element={<Chat />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/approvals" element={<AdminApprovals />} />
          <Route path="/admin/jobs" element={<AdminJobs />} />
          <Route path="/admin/quotes" element={<AdminQuotes />} />

          {/* 404 → Login */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
