
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
  MessageSquare 
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { title: "Dashboard", path: "/admin/super/dashboard", icon: LayoutDashboard },
  { title: "Members", path: "/admin/super/members", icon: Users },
  { title: "Events", path: "/admin/super/events", icon: Calendar },
  { title: "Fundraising", path: "/admin/super/fundraising", icon: DollarSign },
  { title: "Locations", path: "/admin/super/locations", icon: MapPin },
  { title: "Finances", path: "/admin/super/finances", icon: PiggyBank },
  { title: "Regions", path: "/admin/super/regions", icon: Globe },
  { title: "Reports", path: "/admin/super/reports", icon: BarChart2 },
  { title: "Communication", path: "/admin/super/communication", icon: MessageSquare },
];

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  return (
    <AdminLayout title="Super Admin" menuItems={menuItems}>
      {children}
    </AdminLayout>
  );
};

export default SuperAdminLayout;
