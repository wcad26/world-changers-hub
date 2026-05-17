import React from 'react';
import { useLocation } from 'react-router-dom';
import RegionalErrorBoundary from './RegionalErrorBoundary';

/**
 * Pass-through guard. All client-side access checks have been removed
 * to eliminate blank/logout loops. RLS is the source of truth for data.
 *
 * The error boundary is reset on pathname change and intentionally does
 * NOT navigate the user away — failed pages stay on their own URL so
 * sidebar navigation never silently bounces back to the dashboard.
 */
const RegionalSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <RegionalErrorBoundary resetKey={location.pathname}>
      {children}
    </RegionalErrorBoundary>
  );
};

export default RegionalSessionRoute;
