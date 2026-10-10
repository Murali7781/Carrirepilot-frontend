import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AppErrorBoundary from './components/AppErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute, RoleRoute } from './routes/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ResumesPage = lazy(() => import('./pages/ResumesPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const SkillsPage = lazy(() => import('./pages/SkillsPage'));
const InterviewsPage = lazy(() => import('./pages/InterviewsPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const SavedJobsPage = lazy(() => import('./pages/SavedJobsPage'));
const InterviewPracticePage = lazy(() => import('./pages/InterviewPracticePage'));

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Suspense fallback={<div className="page-loading" role="status">Loading page...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<AuthProvider><Outlet /></AuthProvider>}>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<RoleRoute allowedRoles={['candidate', 'admin']} />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/resumes" element={<ResumesPage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/jobs/:id" element={<JobDetailPage />} />
                  <Route path="/applications" element={<ApplicationsPage />} />
                  <Route path="/saved-jobs" element={<SavedJobsPage />} />
                  <Route path="/skills" element={<SkillsPage />} />
                  <Route path="/interviews" element={<InterviewsPage />} />
                  <Route path="/interviews/:id" element={<InterviewPracticePage />} />
                </Route>
                <Route path="/ai" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
