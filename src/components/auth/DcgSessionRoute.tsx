import React from 'react';

/** Pass-through guard. All access checks removed. */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export default DcgSessionRoute;
