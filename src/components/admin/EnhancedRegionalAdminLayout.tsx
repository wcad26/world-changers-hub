import React from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Calendar,
  PiggyBank,
  Home,
  Heart,
  MessageSquare,
  Settings,
  Building2,
  KeyRound,
  Award,
  HandCoins,
  BarChart3,
  MapPin,
} from 'lucide-react';
import { REGIONAL_PAGES } from '@/config/regionalPermissions';

type IconType = React.ComponentType<{ className?: string; size?: number }>;

const ICON_BY_PATH: Record<string, IconType> = {
  '/admin/regional/dashboard':       LayoutDashboard as IconType,
  '/admin/regional/members':         Users as IconType,
  '/admin/regional/discipleship':    Heart as IconType,
  '/admin/regional/events':          Calendar as IconType,
  '/admin/regional/dcg':             Home as IconType,
  '/admin/regional/certificates':    Award as IconType,
  '/admin/regional/finances':        PiggyBank as IconType,
  '/admin/regional/fundraising':     HandCoins as IconType,
  '/admin/regional/reports':         BarChart3 as IconType,
  '/admin/regional/communication':   MessageSquare as IconType,
  '/admin/regional/locations':       MapPin as IconType,
  '/admin/regional/branch-settings': Building2 as IconType,
  '/admin/regional/user-roles':      KeyRound as IconType,
  '/admin/regional/settings':        Settings as IconType,
};

interface EnhancedRegionalAdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * Permission-aware regional admin layout.
 * The sidebar only shows pages the current user has access to.
 */
const EnhancedRegionalAdminLayout: React.FC<EnhancedRegionalAdminLayoutProps> = ({ children }) => {
  const { hasRole, hasRegionalPermission } = useAuth();
  const isPrivileged = hasRole('super_admin') || hasRole('regional_admin');

  const menuItems = REGIONAL_PAGES
    .filter((page) => isPrivileged || hasRegionalPermission(page.permission))
    .map((page) => ({
      title: page.title,
      path: page.path,
      icon: ICON_BY_PATH[page.path] ?? LayoutDashboard,
    }));

  return <AdminLayout menuItems={menuItems}>{children}</AdminLayout>;
};

export default EnhancedRegionalAdminLayout;
