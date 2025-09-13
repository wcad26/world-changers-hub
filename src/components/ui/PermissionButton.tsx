import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import PermissionGate from '@/components/auth/PermissionGate';

interface PermissionButtonProps extends ButtonProps {
  permission: string;
  children: React.ReactNode;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({ 
  permission, 
  children, 
  ...buttonProps 
}) => {
  return (
    <PermissionGate permission={permission}>
      <Button {...buttonProps}>
        {children}
      </Button>
    </PermissionGate>
  );
};

export default PermissionButton;