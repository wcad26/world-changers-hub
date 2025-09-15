import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, UserCheck, Crown } from 'lucide-react';

interface RoleBadgeProps {
  roles: Array<{
    role: string;
    is_active: boolean;
  }>;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ roles, className }) => {
  const activeRoles = roles?.filter(r => r.is_active) || [];
  
  if (activeRoles.length === 0) {
    return (
      <Badge variant="secondary" className={className}>
        <Users className="w-3 h-3 mr-1" />
        Member
      </Badge>
    );
  }

  // Priority order: super_admin > regional_admin > dcg_admin > member
  const roleHierarchy = ['super_admin', 'regional_admin', 'dcg_admin', 'member'];
  const sortedRoles = activeRoles.sort((a, b) => 
    roleHierarchy.indexOf(a.role) - roleHierarchy.indexOf(b.role)
  );

  const primaryRole = sortedRoles[0];
  const hasMultipleRoles = sortedRoles.length > 1;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          variant: 'destructive' as const,
          icon: Crown,
        };
      case 'regional_admin':
        return {
          label: 'Regional Admin',
          variant: 'default' as const,
          icon: Shield,
        };
      case 'dcg_admin':
        return {
          label: 'DCG Leader',
          variant: 'secondary' as const,
          icon: UserCheck,
        };
      default:
        return {
          label: 'Member',
          variant: 'outline' as const,
          icon: Users,
        };
    }
  };

  const config = getRoleConfig(primaryRole.role);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1">
      <Badge variant={config.variant} className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
      {hasMultipleRoles && (
        <Badge variant="outline" className="text-xs">
          +{sortedRoles.length - 1}
        </Badge>
      )}
    </div>
  );
};

export default RoleBadge;