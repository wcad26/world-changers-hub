
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  menuItems: {
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
  }[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, menuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const { user, profile, userRegion, signOut } = useAuth();

  // Create route-to-title mapping
  const getPageTitle = () => {
    if (title) return title;
    
    const routeTitleMap: Record<string, string> = {
      '/admin/regional/dashboard': 'Dashboard',
      '/admin/regional/finances': 'Financial Management',
      '/admin/regional/members': 'Member Management',
      '/admin/regional/events': 'Event Management',
      '/admin/regional/communication': 'Communication Center',
      '/admin/regional/dcg': 'DCG Management',
      '/admin/regional/fundraising': 'Fundraising Management',
      '/admin/regional/locations': 'Location Management',
      '/admin/regional/reports': 'Reports & Analytics',
      '/admin/super/dashboard': 'Dashboard',
      '/admin/super/regions': 'Region Management',
      '/admin/super/members': 'Global Member Management',
      '/admin/super/events': 'Global Event Management',
      '/admin/super/finances': 'Global Financial Management',
      '/admin/super/communication': 'Global Communication',
      '/admin/super/fundraising': 'Global Fundraising',
      '/admin/super/locations': 'Global Location Management',
      '/admin/super/reports': 'Global Reports & Analytics',
    };

    return routeTitleMap[location.pathname] || 'Admin Dashboard';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  console.log("Current location:", location.pathname);
  console.log("Menu items:", menuItems);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-950">
        <Sidebar className="border-r border-gray-200 dark:border-gray-800">
          <SidebarHeader className="p-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                WCA
              </span>
            </Link>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <ChevronLeft size={20} />
              </Button>
            )}
          </SidebarHeader>
          <SidebarContent className="px-2">
            <div className="py-2">
              <nav className="mt-2 space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
                        isActive
                          ? "bg-wca-purple text-white"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto">
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={signOut}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 bg-white dark:bg-gray-900 shadow z-20">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="p-1">
                  <Menu size={22} />
                </SidebarTrigger>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {getPageTitle()}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
