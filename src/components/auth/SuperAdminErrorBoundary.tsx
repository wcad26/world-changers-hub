import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /**
   * Changing this key resets the boundary. The super admin layout passes the
   * current pathname so navigating to another super-admin page automatically
   * clears any stale error state from the previous page.
   */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render/runtime errors inside the super admin portal so a single
 * broken page or query no longer turns the whole app blank (which would
 * otherwise trigger Lovable's blank-page detector to reload the preview
 * and bounce the user back to the previous URL).
 *
 * IMPORTANT: never redirect from this component. Auth state is sticky
 * (see mem://constraints/portal-session-guards-must-be-sticky) — only the
 * page that errored should show the fallback, never the whole portal.
 */
class SuperAdminErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SuperPortal] render error:', error, info);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8">
          <div className="flex justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Something went wrong on this page</h2>
          <p className="text-sm text-muted-foreground">
            The page hit an unexpected error. You can try again or pick another page from the menu.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-muted-foreground/80 break-words">
              {this.state.error.message}
            </p>
          )}
          <div className="flex justify-center pt-2">
            <Button onClick={this.handleReset} variant="default">
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default SuperAdminErrorBoundary;
