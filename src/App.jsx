import UserManagement from './pages/UserManagement';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import VendorVerification from './pages/VendorVerification';
import WorkerVerification from './pages/WorkerVerification';
import VendorDetails from './pages/VendorDetails';
import WorkerDetail from './pages/WorkerDetail';
import UserDetail from './pages/UserDetail';
import VerificationOverview from './pages/VerificationOverview';
import RequirementsDashboard from './pages/Requirements';
import JobRequirements from './pages/JobRequirements';
import UserProfilePage from './pages/UserProfilePage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SystemMonitoring from './pages/SystemMonitoring';
import AdminSettings from './pages/AdminSettings';
import PlatformSettings from './pages/PlatformSettings';
import RevenuePage from './pages/RevenuePage'
import SupportPage from './pages/SupportPage'
import CreatePost from './pages/CreatePost'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('adminUser');
  return token ? children : <Navigate to="/admin/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requirements"
          element={
            <ProtectedRoute>
              <RequirementsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requirements/:id"
          element={
            <ProtectedRoute>
              <JobRequirements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-management"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-profile/:id"
          element={
            <ProtectedRoute>
              <UserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/revenue"
          element={
            <ProtectedRoute>
              <RevenuePage/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workers"
          element={
            <ProtectedRoute>
              <WorkerVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vendors"
          element={
            <ProtectedRoute>
              <VendorVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vendors/:id"
          element={
            <ProtectedRoute>
              <VendorDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workers/:id"
          element={
            <ProtectedRoute>
              <WorkerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verifications"
          element={
            <ProtectedRoute>
              <VerificationOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute>
              <RequirementsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute>
              <PlatformSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system-monitoring"
          element={
            <ProtectedRoute>
              <SystemMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/platform-settings"
          element={
            <ProtectedRoute>
              <PlatformSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-post"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute>
              <SupportPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
