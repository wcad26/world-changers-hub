
import React from "react";
import AdminLayout from "./AdminLayout";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  PiggyBank, 
  Home, 
   
  MessageSquare,
  Settings,
  Building2,
  Award
} from "lucide-react";

interface RegionalAdminLayoutProps {
  children: React.ReactNode;
}

// Create an array of menu items with properly typed icons
const menuItems = [
  { title: "Dashboard", path: "/admin/regional/dashboard", icon: LayoutDashboard as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Members", path: "/admin/regional/members", icon: Users as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Events", path: "/admin/regional/events", icon: Calendar as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Fundraising", path: "/admin/regional/fundraising", icon: DollarSign as React.ComponentType<{ className?: string; size?: number }> },
  
  { title: "Finances", path: "/admin/regional/finances", icon: PiggyBank as React.ComponentType<{ className?: string; size?: number }> },
  { title: "DCG Management", path: "/admin/regional/dcg", icon: Home as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Certificates", path: "/admin/regional/certificates", icon: Award as React.ComponentType<{ className?: string; size?: number }> },
  
  { title: "Communication", path: "/admin/regional/communication", icon: MessageSquare as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Regional Website Info", path: "/admin/regional/branch-settings", icon: Building2 as React.ComponentType<{ className?: string; size?: number }> },
  { title: "User Roles", path: "/admin/regional/user-roles", icon: Settings as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Settings", path: "/admin/regional/settings", icon: Settings as React.ComponentType<{ className?: string; size?: number }> },
];

const RegionalAdminLayout: React.FC<RegionalAdminLayoutProps> = ({ children }) => {
  return (
    <AdminLayout menuItems={menuItems}>
      {children}
    </AdminLayout>
  );
};

export default RegionalAdminLayout;
