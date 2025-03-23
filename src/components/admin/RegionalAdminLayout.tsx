
import React from "react";
import AdminLayout from "./AdminLayout";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  PiggyBank, 
  Home, 
  BarChart2, 
  MessageSquare 
} from "lucide-react";

interface RegionalAdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { title: "Dashboard", path: "/admin/regional/dashboard", icon: LayoutDashboard },
  { title: "Members", path: "/admin/regional/members", icon: Users },
  { title: "Events", path: "/admin/regional/events", icon: Calendar },
  { title: "Fundraising", path: "/admin/regional/fundraising", icon: DollarSign },
  { title: "Locations", path: "/admin/regional/locations", icon: MapPin },
  { title: "Finances", path: "/admin/regional/finances", icon: PiggyBank },
  { title: "DCG Management", path: "/admin/regional/dcg", icon: Home },
  { title: "Reports", path: "/admin/regional/reports", icon: BarChart2 },
  { title: "Communication", path: "/admin/regional/communication", icon: MessageSquare },
];

const RegionalAdminLayout: React.FC<RegionalAdminLayoutProps> = ({ children }) => {
  return (
    <AdminLayout title="Regional Admin" menuItems={menuItems}>
      {children}
    </AdminLayout>
  );
};

export default RegionalAdminLayout;
