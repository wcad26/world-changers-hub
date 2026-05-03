import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useRegionalSession } from '@/contexts/RegionalSessionContext';
import { Button } from '@/components/ui/button';
import RegionalErrorBoundary from './RegionalErrorBoundary';

/**
 * Self-contained guard for the regional portal.
 *
 * NEVER auto-redirects. A transient null session shows a stable panel with
 * "Try again" / "Go to login" buttons. The user is the only one who can leave.
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

  if (status === 'unauthorized' || status === 'error') {
    const isUnauthorized = status === 'unauthorized';
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8">
          <div className="flex justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">
            {isUnauthorized
              ? "We couldn't find an active regional session"
              : "We couldn't load your session"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isUnauthorized
              ? 'Try again to restore your session, or sign in again.'
              : 'This is usually a temporary network issue. You can retry without losing your login.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={retry} variant="default">Try again</Button>
            <Button
              onClick={async () => {
                await signOut();
                navigate('/auth/regional', { replace: true });
              }}
              variant="outline"
            >
              Go to login
            </Button>
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
