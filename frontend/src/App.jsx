import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';

// AUTH
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegisterBusiness from './pages/auth/RegisterBusiness';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import AcceptInvite from './pages/auth/AcceptInvite';

// PUBLIC
import HomePage from './pages/public/HomePage';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import BookingWizard from './pages/public/BookingWizard';
import BookingSuccess from './pages/public/BookingSuccess';

// ADMIN
import Dashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/Companies';
import Services from './pages/admin/Services';
import Bookings from './pages/admin/Booking';
import Products from './pages/admin/Products';
import Customers from './pages/admin/Customers';
import Team from './pages/admin/Team';
import WorkingHours from './pages/admin/WorkingHours';
import Holidays from './pages/admin/Holidays';
import Discounts from './pages/admin/Discounts';
import Settings from './pages/admin/Settings';
import HappyHours from './pages/admin/HappyHours';
import Shifts from './pages/admin/Shifts';
import Schedule from './pages/admin/Schedule';
import Gallery from './pages/admin/Gallery';
import Reviews from './pages/admin/Reviews';

// STAFF
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffSchedule from './pages/staff/StaffSchedule';
import StaffBookings from './pages/staff/StaffBookings';
import StaffProfile from './pages/staff/StaffProfile';

// PORTAL
import MyBookings from './pages/portal/MyBookings';
import Profile from './pages/portal/Profile';

// PROTECTION
import ProtectedPage from './components/ProtectedPage';
import ProtectedPortal from './components/ProtectedPortal';
import StaffLayout from './components/StaffLayout';

import Invoices from './pages/admin/Invoices';

import CustomerDetail from './pages/admin/CustomerDetail';
import InvoiceView from './pages/admin/InvoiceView';
import Calendar from './pages/admin/Calendar';
import Invoices from './pages/admin/Invoices';
import SuperAdminDashboard from './pages/admin/superadmin/SuperAdminDashboard';


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300">404</h1>
        <p className="text-slate-500 mt-2">Page not found</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/book/:slug" element={<BookingWizard />} />
            <Route path="/booking-success/:id" element={<BookingSuccess />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-business" element={<RegisterBusiness />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={<ProtectedPage><Dashboard /></ProtectedPage>}
            />
            <Route
              path="/admin/companies"
              element={<ProtectedPage allowed={['owner', 'admin']}><Companies /></ProtectedPage>}
            />
            <Route
              path="/admin/calendar"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Calendar /></ProtectedPage>}
            />
            <Route
              path="/admin/services"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Services /></ProtectedPage>}
            />
            <Route
              path="/admin/bookings"
              element={<ProtectedPage><Bookings /></ProtectedPage>}
            />
            <Route
              path="/admin/products"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Products /></ProtectedPage>}
            />
            <Route
              path="/admin/customers"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Customers /></ProtectedPage>}
            />
            <Route
              path="/admin/team"
              element={<ProtectedPage allowed={['owner', 'admin']}><Team /></ProtectedPage>}
            />
            <Route
              path="/admin/working-hours"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><WorkingHours /></ProtectedPage>}
            />
            <Route
              path="/admin/holidays"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Holidays /></ProtectedPage>}
            />
            <Route
              path="/admin/discounts"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Discounts /></ProtectedPage>}
            />
            <Route
            path="/admin/superadmin"
            element={<ProtectedPage allowed={['superadmin']}><SuperAdminDashboard /></ProtectedPage>}
          />
            <Route
              path="/admin/gallery"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Gallery /></ProtectedPage>}
            />
            <Route
              path="/admin/reviews"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Reviews /></ProtectedPage>}
            />
            <Route
              path="/admin/happy-hours"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><HappyHours /></ProtectedPage>}
            />
            <Route
              path="/admin/shifts"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Shifts /></ProtectedPage>}
            />
            <Route
              path="/admin/schedule"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Schedule /></ProtectedPage>}
            />
            <Route
              path="/admin/settings"
              element={<ProtectedPage allowed={['owner', 'admin']}><Settings /></ProtectedPage>}
            />

            <Route
              path="/admin/invoices"
              element={<ProtectedPage allowed={['owner', 'admin', 'manager']}><Invoices /></ProtectedPage>}
            />

      <Route path="/admin/customers/:id" element={<CustomerDetail />} />

    <Route path="/admin/invoices/:id" element={<InvoiceView />} />
            {/* CUSTOMER PORTAL */}
            <Route
              path="/portal"
              element={
                <ProtectedPortal>
                  <MyBookings />
                </ProtectedPortal>
              }
            />
            <Route
              path="/portal/profile"
              element={
                <ProtectedPortal>
                  <Profile />
                </ProtectedPortal>
              }
            />

            {/* STAFF PORTAL */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <StaffLayout>
                    <StaffDashboard />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/schedule"
              element={
                <ProtectedRoute>
                  <StaffLayout>
                    <StaffSchedule />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/bookings"
              element={
                <ProtectedRoute>
                  <StaffLayout>
                    <StaffBookings />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/profile"
              element={
                <ProtectedRoute>
                  <StaffLayout>
                    <StaffProfile />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  );
}