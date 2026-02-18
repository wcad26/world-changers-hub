
import React from "react";
import AdminLayout from "./AdminLayout";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  PiggyBank, 
  Globe, 
  BarChart2, 
  MessageSquare,
  Info,
  UserPlus,
  Home,
  Coins,
  Award
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

// Create an array of menu items with properly typed icons
const menuItems = [
  { title: "Dashboard", path: "/admin/super/dashboard", icon: LayoutDashboard as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Members", path: "/admin/super/members", icon: Users as React.ComponentType<{ className?: string; size?: number }> },
  { title: "User Management", path: "/admin/super/user-management", icon: UserPlus as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Events", path: "/admin/super/events", icon: Calendar as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Fundraising", path: "/admin/super/fundraising", icon: DollarSign as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Locations", path: "/admin/super/locations", icon: MapPin as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Finances", path: "/admin/super/finances", icon: PiggyBank as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Currency Management", path: "/admin/super/currencies", icon: Coins as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Regions", path: "/admin/super/regions", icon: Globe as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Reports", path: "/admin/super/reports", icon: BarChart2 as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Communication", path: "/admin/super/communication", icon: MessageSquare as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Homepage Settings", path: "/admin/super/homepage-settings", icon: Home as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Certificates", path: "/admin/super/certificates", icon: Award as React.ComponentType<{ className?: string; size?: number }> },
  { title: "About Us", path: "/admin/super/about-settings", icon: Info as React.ComponentType<{ className?: string; size?: number }> },
];

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  return (
    <AdminLayout menuItems={menuItems}>
      {children}
    </AdminLayout>
  );
};

export default SuperAdminLayout;
