import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /**
   * Changing this key resets the boundary. The regional layout passes the
   * current pathname, so navigating to another regional page automatically
   * clears any stale error state from the previous page.
   */
  resetKey?: string;
  onGoHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render/runtime errors inside the regional portal so a single
 * broken page or query no longer turns the whole app blank (which would
 * otherwise trigger Lovable's blank-page detector to reload the preview
 * in a loop).
 */
class RegionalErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RegionalPortal] render error:', error, info);

    // Auto-recover from transient context-not-yet-available errors. This can
    // happen during HMR or a quick provider remount; the next render almost
    // always has the provider, so blanking the portal would be wrong.
    if (
      error?.message &&
      /useRegionalSession must be used within/.test(error.message)
    ) {
      // Defer to the next tick so React can finish the current commit first.
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 0);
    }
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
            The page hit an unexpected error. You can try again or return to the dashboard.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-muted-foreground/80 break-words">
              {this.state.error.message}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={this.handleReset} variant="default">
              Try again
            </Button>
            {this.props.onGoHome && (
              <Button onClick={this.props.onGoHome} variant="outline">
                Go to dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default RegionalErrorBoundary;
