
import React from "react";
import AdminLayout from "./AdminLayout";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  PiggyBank,
  Globe,
  BarChart2,
  MessageSquare,
  Info,
  Home,
  Award,
  Settings as SettingsIcon,
} from "lucide-react";
import { useSuperAdminPermissions } from "@/hooks/useSuperAdminPermissions";

interface SuperAdminLayoutProps {
  children?: React.ReactNode;
}

type IconType = React.ComponentType<{ className?: string; size?: number }>;

interface MenuItem {
  title: string;
  path: string;
  icon: IconType;
  /** Permission required to view this menu item. */
  permission: string;
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { title: "Dashboard",          path: "/admin/super/dashboard",         icon: LayoutDashboard as IconType, permission: "super_dashboard_view" },
  { title: "Members",            path: "/admin/super/members",           icon: Users as IconType,           permission: "super_members_view" },
  { title: "Events",             path: "/admin/super/events",            icon: Calendar as IconType,        permission: "super_events_view" },
  { title: "Locations",          path: "/admin/super/locations",         icon: MapPin as IconType,          permission: "super_locations_manage" },
  { title: "Finances",           path: "/admin/super/finances",          icon: PiggyBank as IconType,       permission: "super_finances_view" },
  { title: "Regions",            path: "/admin/super/regions",           icon: Globe as IconType,           permission: "super_regions_view" },
  { title: "Reports",            path: "/admin/super/reports",           icon: BarChart2 as IconType,       permission: "super_reports_view" },
  { title: "Communication",      path: "/admin/super/communication",     icon: MessageSquare as IconType,   permission: "super_communication_view" },
  { title: "Homepage Settings",  path: "/admin/super/homepage-settings", icon: Home as IconType,            permission: "super_homepage_manage" },
  { title: "Certificates",       path: "/admin/super/certificates",      icon: Award as IconType,           permission: "super_certificates_view" },
  { title: "About Us",           path: "/admin/super/about-settings",    icon: Info as IconType,            permission: "super_homepage_manage" },
  { title: "Settings",           path: "/admin/super/settings",          icon: SettingsIcon as IconType,    permission: "super_settings_view" },
];

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const { has, isReady, isPrincipal } = useSuperAdminPermissions();

  // While we don't yet know the permissions, show only the dashboard + settings
  // so the layout never blocks the user from reaching settings/access to fix
  // their own access. Principals always see everything.
  const items = !isReady
    ? ALL_MENU_ITEMS.filter((m) => ['/admin/super/dashboard', '/admin/super/settings'].includes(m.path))
    : isPrincipal
    ? ALL_MENU_ITEMS
    : ALL_MENU_ITEMS.filter((m) => has(m.permission));

  // Always include Dashboard and Settings to avoid trapping users with no roles.
  const ensured = [...items];
  for (const path of ['/admin/super/dashboard', '/admin/super/settings']) {
    if (!ensured.find((m) => m.path === path)) {
      const fallback = ALL_MENU_ITEMS.find((m) => m.path === path);
      if (fallback) ensured.push(fallback);
    }
  }

  return <AdminLayout menuItems={ensured}>{children}</AdminLayout>;
};

export default SuperAdminLayout;
