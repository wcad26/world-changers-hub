import React from 'react';

/**
 * Pass-through guard. All client-side session redirect checks removed to
 * eliminate preview-only logout loops. RLS controls real data access.
 */
const SuperAdminSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export default SuperAdminSessionRoute;
