import React from 'react';

/**
 * STICKY PASS-THROUGH GUARD — DO NOT ADD AUTH CHECKS HERE.
 *
 * The Lovable development preview emits spurious SIGNED_OUT and null
 * INITIAL_SESSION/TOKEN_REFRESHED events that previously blanked the
 * portal and bounced users back to /auth/super. RLS is the source of
 * truth for protected data access — never redirect from this guard.
 * See mem://constraints/portal-session-guards-must-be-sticky.
 */
const SuperAdminSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default SuperAdminSessionRoute;
