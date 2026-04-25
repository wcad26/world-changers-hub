import React from 'react';
import RegionalAdminShell from './RegionalAdminShell';
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
 * Regional admin layout.
 *
 * No more permission filtering — once a user has logged into the regional
 * portal (via the regional session guard) the full sidebar is shown. This is
 * intentional: the regional portal is now standalone and does not consult
 * user_roles / regional_user_roles to render.
 */
const EnhancedRegionalAdminLayout: React.FC<EnhancedRegionalAdminLayoutProps> = ({ children }) => {
  const menuItems = REGIONAL_PAGES.map((page) => ({
    title: page.title,
    path: page.path,
    icon: ICON_BY_PATH[page.path] ?? (LayoutDashboard as IconType),
  }));

  return <RegionalAdminShell menuItems={menuItems}>{children}</RegionalAdminShell>;
};

export default EnhancedRegionalAdminLayout;
