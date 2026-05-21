import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './state/auth';
import { AppPage } from './screens/AppPage';
import { LoginPage } from './screens/LoginPage';
import { RegisterPage } from './screens/RegisterPage';

// Redirects unauthenticated users to the login flow while preserving the
// protected path they originally tried to visit.
function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

// Prevents authenticated users from returning to login/register screens once a
// session is already available.
function PublicOnlyRoute() {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

/**
 * Defines the application's public and authenticated route tree.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppPage />} />
      </Route>
    </Routes>
  );
}

