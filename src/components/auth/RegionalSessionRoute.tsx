import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  RegionalSessionProvider,
  useRegionalSession,
} from '@/contexts/RegionalSessionContext';
import RegionalErrorBoundary from './RegionalErrorBoundary';

/**
 * Self-contained guard for the regional portal.
 *
 * Behaviour:
 *   - While the regional session is still being checked, render a loading
 *     spinner. We intentionally do NOT use a wall-clock timeout here —
 *     a slow profile/region fetch must never log a real user out.
 *
 *   - Once `ready` is true, send unauthorized visitors to /auth/regional.
 *     Authorized visitors render the portal, wrapped in an error boundary
 *     so a single page crash cannot blank the entire portal (which would
 *     otherwise trigger the preview blank-page reload loop).
 */
const RegionalSessionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, authorized } = useRegionalSession();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/auth/regional" state={{ from: location }} replace />;
  }

  return <RegionalErrorBoundary>{children}</RegionalErrorBoundary>;
};

const RegionalSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RegionalSessionProvider>
      <RegionalSessionGate>{children}</RegionalSessionGate>
    </RegionalSessionProvider>
  );
};

export default RegionalSessionRoute;
