import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext.jsx';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import { SyncProvider } from '@/contexts/SyncContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import Layout from '@/components/Layout.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import DevChecklist from '@/components/DevChecklist.jsx';
import SoundStateSync from '@/components/SoundStateSync.jsx';

import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import TicketCreationPage from '@/pages/TicketCreationPage.jsx';
import DisplayScreen from '@/pages/DisplayScreen.jsx';
import TrackingPage from '@/pages/TrackingPage.jsx';
import StaffDashboard from '@/pages/StaffDashboard.jsx';
import CounterSelectPage from '@/pages/CounterSelectPage.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import AdminUsersPage from '@/pages/AdminUsersPage.jsx';
import ActivityLogPage from '@/pages/ActivityLogPage.jsx';
import ReportsPage from '@/pages/ReportsPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';

import { Toaster } from 'sonner';

const routerBasename = import.meta.env.BASE_URL === '/'
  ? undefined
  : import.meta.env.BASE_URL.replace(/\/$/, '');

const NotFoundPage = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-7xl font-black text-primary mb-4 font-display">404</h1>
    <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
    <a href={import.meta.env.BASE_URL} className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold shadow-lg">Return Home</a>
  </div>
);

const RootRedirect = () => {
  const { isAuthenticated, selectedCounter, initialLoading, isAdmin } = useAuth();

  if (initialLoading) return null;

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (selectedCounter) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/counter-select" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    const handleBeforeUnload = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <SoundStateSync />
          <SyncProvider>
            <Router basename={routerBasename}>
              <ScrollToTop />
              <DevChecklist />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<RootRedirect />} />

                  <Route path="/home" element={<Layout><HomePage /></Layout>} />
                  <Route path="/login" element={<Layout><LoginPage /></Layout>} />
                  <Route path="/create-ticket" element={<Layout><TicketCreationPage /></Layout>} />
                  <Route path="/track" element={<Layout><TrackingPage /></Layout>} />

                  <Route path="/display" element={<DisplayScreen />} />

                  <Route path="/counter-select" element={
                    <ProtectedRoute>
                      <Layout><CounterSelectPage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard" element={
                    <ProtectedRoute requireCounter={true}>
                      <Layout><StaffDashboard /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <Layout><ReportsPage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout><SettingsPage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Layout><AdminDashboard /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/users" element={
                    <ProtectedRoute>
                      <Layout><AdminUsersPage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/reports" element={
                    <ProtectedRoute>
                      <Layout><ReportsPage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/activity-log" element={
                    <ProtectedRoute>
                      <Layout><ActivityLogPage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/settings" element={
                    <ProtectedRoute>
                      <Layout><SettingsPage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                </Routes>
              </ErrorBoundary>
              <Toaster richColors position="top-center" />
            </Router>
          </SyncProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
