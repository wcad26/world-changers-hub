import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  RegionalSessionProvider,
  useRegionalSession,
} from '@/contexts/RegionalSessionContext';

/**
 * Self-contained guard for the regional portal.
 *
 * Behaviour:
 *   - While the regional session is still being checked, render a loading
 *     spinner. We intentionally do NOT use a wall-clock timeout here —
 *     a slow profile/region fetch must never log a real user out. The
 *     RegionalSessionProvider always flips `ready` to true after its
 *     check completes (success or failure), so the spinner is bounded
 *     by the actual network round-trip, not an arbitrary timer.
 *
 *   - Once `ready` is true, send unauthorized visitors to /auth/regional.
 *     Authorized visitors render the portal.
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

  return <>{children}</>;
};

const RegionalSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RegionalSessionProvider>
      <RegionalSessionGate>{children}</RegionalSessionGate>
    </RegionalSessionProvider>
  );
};

export default RegionalSessionRoute;
