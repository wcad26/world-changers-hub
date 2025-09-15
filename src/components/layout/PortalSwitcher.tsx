import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Crown, Users, MessageSquare, UserCheck, ChevronDown } from 'lucide-react';

const PortalSwitcher = () => {
  const { hasRole, getAvailablePortals } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const portals = [
    {
      id: 'super',
      title: 'Super Admin',
      icon: Crown,
      path: '/admin/super/dashboard',
      requiredRole: 'super_admin',
    },
    {
      id: 'regional',
      title: 'Regional Admin',
      icon: Users,
      path: '/admin/regional/dashboard',
      requiredRole: 'regional_admin',
    },
    {
      id: 'dcg',
      title: 'DCG Portal',
      icon: MessageSquare,
      path: '/dcg/dashboard',
      requiredRole: 'dcg_admin',
    },
    {
      id: 'member',
      title: 'Member Portal',
      icon: UserCheck,
      path: '/member/dashboard',
      requiredRole: 'member',
    }
  ];

  const availablePortals = portals.filter(portal => hasRole(portal.requiredRole as 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin'));

  // Don't show switcher if user only has access to one portal
  if (availablePortals.length <= 1) {
    return null;
  }

  // Determine current portal based on path
  const getCurrentPortal = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/super')) return portals.find(p => p.id === 'super');
    if (path.startsWith('/admin/regional')) return portals.find(p => p.id === 'regional');
    if (path.startsWith('/dcg')) return portals.find(p => p.id === 'dcg');
    if (path.startsWith('/member')) return portals.find(p => p.id === 'member');
    return availablePortals[0];
  };

  const currentPortal = getCurrentPortal();
  const CurrentIcon = currentPortal?.icon || Users;

  const handlePortalSwitch = (portalPath: string) => {
    navigate(portalPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentPortal?.title}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availablePortals.map((portal) => {
          const Icon = portal.icon;
          const isCurrent = portal.path === currentPortal?.path;
          
          return (
            <DropdownMenuItem
              key={portal.id}
              onClick={() => handlePortalSwitch(portal.path)}
              className={`gap-2 ${isCurrent ? 'bg-muted' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {portal.title}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/portal-selector')} className="gap-2">
          <Users className="h-4 w-4" />
          All Portals
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PortalSwitcher;