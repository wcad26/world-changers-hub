import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RegionalErrorBoundary from './RegionalErrorBoundary';

/**
 * Pass-through guard. All client-side access checks have been removed
 * to eliminate blank/logout loops. RLS is the source of truth for data.
 */
const RegionalSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
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
