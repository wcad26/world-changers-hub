import React from "react";
import AdminLayout from "./AdminLayout";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart2, 
  MessageSquare,
  UserCheck
} from "lucide-react";

interface DcgAdminLayoutProps {
  children: React.ReactNode;
}

// Create an array of menu items for DCG portal
const menuItems = [
  { title: "Dashboard", path: "/dcg/dashboard", icon: LayoutDashboard as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Members", path: "/dcg/members", icon: Users as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Attendance", path: "/dcg/attendance", icon: UserCheck as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Events", path: "/dcg/events", icon: Calendar as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Finances", path: "/dcg/finances", icon: DollarSign as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Reports", path: "/dcg/reports", icon: BarChart2 as React.ComponentType<{ className?: string; size?: number }> },
  { title: "Communication", path: "/dcg/communication", icon: MessageSquare as React.ComponentType<{ className?: string; size?: number }> },
];

const DcgAdminLayout: React.FC<DcgAdminLayoutProps> = ({ children }) => {
  return (
    <AdminLayout title="DCG Portal" menuItems={menuItems}>
      {children}
    </AdminLayout>
  );
};

export default DcgAdminLayout;