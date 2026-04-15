import React from "react";
import AdminLayout from "./AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  PiggyBank, 
  Home, 
   
  MessageSquare,
  Settings,
  Building2,
  Shield,
  Award
} from "lucide-react";

interface EnhancedRegionalAdminLayoutProps {
  children: React.ReactNode;
}

const EnhancedRegionalAdminLayout: React.FC<EnhancedRegionalAdminLayoutProps> = ({ children }) => {
  const { hasRegionalPermission } = useAuth();

  // Define all possible menu items with their required permissions
  const allMenuItems = [
    { 
      title: "Dashboard", 
      path: "/admin/regional/dashboard", 
      icon: LayoutDashboard as React.ComponentType<{ className?: string; size?: number }>,
      permission: "dashboard_view"
    },
    { 
      title: "Members", 
      path: "/admin/regional/members", 
      icon: Users as React.ComponentType<{ className?: string; size?: number }>,
      permission: "members_view"
    },
    { 
      title: "Events", 
      path: "/admin/regional/events", 
      icon: Calendar as React.ComponentType<{ className?: string; size?: number }>,
      permission: "events_view"
    },
    { 
      title: "Fundraising", 
      path: "/admin/regional/fundraising", 
      icon: DollarSign as React.ComponentType<{ className?: string; size?: number }>,
      permission: "fundraising_view"
    },
    { 
      title: "Locations", 
      path: "/admin/regional/locations", 
      icon: MapPin as React.ComponentType<{ className?: string; size?: number }>,
      permission: "locations_view"
    },
    { 
      title: "Finances", 
      path: "/admin/regional/finances", 
      icon: PiggyBank as React.ComponentType<{ className?: string; size?: number }>,
      permission: "finances_view"
    },
    { 
      title: "DCG Management", 
      path: "/admin/regional/dcg", 
      icon: Home as React.ComponentType<{ className?: string; size?: number }>,
      permission: "dcg_view"
    },
    { 
      title: "Certificates", 
      path: "/admin/regional/certificates", 
      icon: Award as React.ComponentType<{ className?: string; size?: number }>,
      permission: "members_view"
    },
    { 
      title: "Communication", 
      path: "/admin/regional/communication", 
      icon: MessageSquare as React.ComponentType<{ className?: string; size?: number }>,
      permission: "communication_view"
    },
    { 
      title: "Branch Settings", 
      path: "/admin/regional/branch-settings", 
      icon: Building2 as React.ComponentType<{ className?: string; size?: number }>,
      permission: "settings_view"
    },
    { 
      title: "User Roles", 
      path: "/admin/regional/user-roles", 
      icon: Shield as React.ComponentType<{ className?: string; size?: number }>,
      permission: "settings_edit"  // Only users who can edit settings can manage roles
    },
    { 
      title: "Settings", 
      path: "/admin/regional/settings", 
      icon: Settings as React.ComponentType<{ className?: string; size?: number }>,
      permission: "settings_view"
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => hasRegionalPermission(item.permission));

  return (
    <AdminLayout menuItems={menuItems}>
      {children}
    </AdminLayout>
  );
};

export default EnhancedRegionalAdminLayout;