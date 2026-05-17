import React from 'react';

/**
 * Pass-through guard. All client-side session redirect checks removed —
 * they were bouncing freshly logged-in users back to /dcg-auth in the
 * Lovable development preview. RLS is the source of truth for data access,
 * and pages already render their own loading states.
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export default DcgSessionRoute;
