import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from './ui';
import { useAuth } from '../auth/AuthContext';

/** Renders children only for authenticated users; otherwise redirects to login. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink-3">
        <Spinner className="h-4 w-4" />
      </div>
    );
  }

  if (!user) {
    // Remember where the user was headed so we can return them after login.
    const from = location.pathname + location.search;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return <>{children}</>;
}
