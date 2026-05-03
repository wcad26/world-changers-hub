import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useRegionalSession } from '@/contexts/RegionalSessionContext';
import { Button } from '@/components/ui/button';
import RegionalErrorBoundary from './RegionalErrorBoundary';

/**
 * Self-contained guard for the regional portal.
 *
 * The RegionalSessionProvider is mounted ONCE at the App level so navigating
 * between regional pages no longer recreates the session. This guard is light:
 * it only checks `status` and renders a loading/error/redirect state.
 *
 * Behaviour:
 *   - status `checking` (or not ready) → spinner. We never log anyone out for slowness.
 *   - status `unauthorized` → SPA redirect to /auth/regional.
 *   - status `error` → recoverable panel (Retry / Sign out). No redirect, no reload.
 *   - status `authorized` → render children inside an error boundary keyed by
 *     pathname so a per-page crash never blanks the whole portal.
 */
const RegionalSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, status, retry, signOut } = useRegionalSession();
  const location = useLocation();
  const navigate = useNavigate();

  if (!ready || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthorized') {
    // Only redirect when we are sure there is no Supabase session at all.
    // A transient profile read failure surfaces as `error` and is handled
    // below with a retry panel — never a forced redirect.
    return <Navigate to="/auth/regional" replace />;
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8">
          <div className="flex justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">We couldn't load your session</h2>
          <p className="text-sm text-muted-foreground">
            This is usually a temporary network issue. You can retry without losing your login.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={retry} variant="default">Retry</Button>
            <Button onClick={() => signOut()} variant="outline">Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RegionalErrorBoundary
      resetKey={location.pathname}
      onGoHome={() => navigate('/admin/regional/dashboard')}
    >
      {children}
    </RegionalErrorBoundary>
  );
};

export default RegionalSessionRoute;
