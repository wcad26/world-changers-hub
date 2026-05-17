import React from 'react';

/**
 * STICKY PASS-THROUGH GUARD — DO NOT ADD AUTH CHECKS HERE.
 * See mem://constraints/portal-session-guards-must-be-sticky.
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default DcgSessionRoute;
