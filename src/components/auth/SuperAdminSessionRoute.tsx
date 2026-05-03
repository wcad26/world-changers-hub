import React from 'react';

/** Pass-through guard. All access checks removed. */
const SuperAdminSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export default SuperAdminSessionRoute;
