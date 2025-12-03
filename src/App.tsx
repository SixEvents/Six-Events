import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import PartyBuilder from './pages/PartyBuilder';
import CheckoutEvent from './pages/CheckoutEvent';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaymentProof from './pages/PaymentProof';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import Profile from './pages/Profile';
import MyReservations from './pages/MyReservations';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminPartyBuilderRequests from './pages/admin/PartyBuilderRequests';
import AdminPartyBuilderOptions from './pages/admin/PartyBuilderOptions';
import ReservationsList from './pages/admin/ReservationsList';
import AdminSettings from './pages/admin/Settings';
import ModernQRScanner from './pages/admin/ModernQRScanner';
import SelectEventToScan from './pages/admin/SelectEventToScan';
import RecoverReservation from './pages/admin/RecoverReservation';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />

            {/* Protected Routes */}
            <Route
              path="/party-builder"
              element={
                <ProtectedRoute>
                  <PartyBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/event"
              element={<CheckoutEvent />}
            />
            <Route
              path="/payment-proof"
              element={
                <ProtectedRoute>
                  <PaymentProof />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/reservations"
              element={
                <ProtectedRoute>
                  <MyReservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <AdminRoute>
                  <AdminEvents />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <AdminRoute>
                  <ReservationsList />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/party-builder-requests"
              element={
                <AdminRoute>
                  <AdminPartyBuilderRequests />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/party-builder-options"
              element={
                <AdminRoute>
                  <AdminPartyBuilderOptions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/select-event-scan"
              element={
                <AdminRoute>
                  <SelectEventToScan />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/qr-scanner"
              element={
                <AdminRoute>
                  <ModernQRScanner />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/recover-reservation"
              element={
                <AdminRoute>
                  <RecoverReservation />
                </AdminRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;
