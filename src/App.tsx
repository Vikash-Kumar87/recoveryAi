// ============================================================
// RecoverAI — Application Router
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Suspense, lazy } from 'react';
import { LoadingState } from './components/ui';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Payments = lazy(() => import('./pages/Payments'));
const RecoveryAgent = lazy(() => import('./pages/RecoveryAgent'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Activity = lazy(() => import('./pages/Activity'));
const Settings = lazy(() => import('./pages/Settings'));

const PageLoader = () => <LoadingState />;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/payments"
            element={
              <Suspense fallback={<PageLoader />}>
                <Payments />
              </Suspense>
            }
          />
          <Route
            path="/recovery"
            element={
              <Suspense fallback={<PageLoader />}>
                <RecoveryAgent />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            }
          />
          <Route
            path="/activity"
            element={
              <Suspense fallback={<PageLoader />}>
                <Activity />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
