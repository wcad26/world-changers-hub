import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  RegionalSessionProvider,
  useRegionalSession,
} from '@/contexts/RegionalSessionContext';

/**
 * Simple, self-contained guard for the regional portal.
 *
 * Wraps its children in a dedicated RegionalSessionProvider so the regional
 * portal does NOT depend on the global AuthContext at all. Once the user is
 * signed in and has a region on their profile, they're in — period.
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
