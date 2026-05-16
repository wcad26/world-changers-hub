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
  Award,
  Target,
} from 'lucide-react';

type IconType = React.ComponentType<{ className?: string; size?: number }>;

/**
 * Regional admin layout — fully static menu.
 *
 * No permission catalog, no role checks. Anyone signed into the regional
 * portal sees the full sidebar. RLS on the database is the source of truth
 * for what data they can actually read or write.
 */
const REGIONAL_MENU: { title: string; path: string; icon: IconType }[] = [
  { title: 'Dashboard',     path: '/admin/regional/dashboard',        icon: LayoutDashboard as IconType },
  { title: 'Members',       path: '/admin/regional/members',          icon: Users as IconType },
  { title: 'Discipleship',  path: '/admin/regional/discipleship',     icon: Heart as IconType },
  { title: 'Events',        path: '/admin/regional/events',           icon: Calendar as IconType },
  { title: 'DCG',           path: '/admin/regional/dcg',              icon: Home as IconType },
  { title: 'Certificate',   path: '/admin/regional/certificates',     icon: Award as IconType },
  { title: 'Finance',       path: '/admin/regional/finances',         icon: PiggyBank as IconType },
  { title: 'Communication', path: '/admin/regional/communication',    icon: MessageSquare as IconType },
  { title: 'Planning',      path: '/admin/regional/planning',         icon: Target as IconType },
  { title: 'Website',       path: '/admin/regional/branch-settings',  icon: Building2 as IconType },
  { title: 'Settings',      path: '/admin/regional/settings',         icon: Settings as IconType },
];

interface EnhancedRegionalAdminLayoutProps {
  children?: React.ReactNode;
}

const EnhancedRegionalAdminLayout: React.FC<EnhancedRegionalAdminLayoutProps> = ({ children }) => {
  return <RegionalAdminShell menuItems={REGIONAL_MENU}>{children}</RegionalAdminShell>;
};

export default EnhancedRegionalAdminLayout;
