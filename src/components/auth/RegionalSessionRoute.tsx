import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Simple guard for the regional portal.
 *
 * Rules (intentionally minimal):
 *   1. Wait for auth to be ready.
 *   2. If no user → redirect to /auth/regional.
 *   3. If user has no region on their profile → redirect to /auth/regional.
 *   4. Otherwise → render the dashboard.
 *
 * No granular permission checks, no role lookups, no portal cross-checks.
 * Once a user is in, the entire regional portal is open to them.
 */
const RegionalSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, authReady, loading } = useAuth();
  const location = useLocation();

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile?.region_id) {
    return <Navigate to="/auth/regional" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RegionalSessionRoute;
