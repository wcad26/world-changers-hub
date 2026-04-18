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
  '/admin/regional/dashboard':       LayoutDashboard,
  '/admin/regional/members':         Users,
  '/admin/regional/discipleship':    Heart,
  '/admin/regional/events':          Calendar,
  '/admin/regional/dcg':             Home,
  '/admin/regional/certificates':    Award,
  '/admin/regional/finances':        PiggyBank,
  '/admin/regional/fundraising':     HandCoins,
  '/admin/regional/reports':         BarChart3,
  '/admin/regional/communication':   MessageSquare,
  '/admin/regional/locations':       MapPin,
  '/admin/regional/branch-settings': Building2,
  '/admin/regional/user-roles':      KeyRound,
  '/admin/regional/settings':        Settings,
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
