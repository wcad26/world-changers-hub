
import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import PortalSwitcher from "../layout/PortalSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children?: React.ReactNode;
  title?: string;
  menuItems: {
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
  }[];
}

const AdminLayoutInner: React.FC<AdminLayoutProps> = ({ children, title, menuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile, userRegion, signOut } = useAuth();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const getPageTitle = () => {
    if (title) return title;
    
    const routeTitleMap: Record<string, string> = {
      '/admin/regional/dashboard': 'Dashboard',
      '/admin/regional/finances': 'Finance Management',
      '/admin/regional/members': 'Member Management',
      '/admin/regional/events': 'Event Management',
      '/admin/regional/communication': 'Communication Mgmt',
      '/admin/regional/dcg': 'DCG Management',
      '/admin/regional/reports': 'Reports & Analytics',
      '/admin/regional/certificates': 'Certificate Management',
      '/admin/regional/branch-settings': 'Regional Website Information',
      '/admin/regional/user-roles': 'Access Management',
      '/admin/regional/discipleship': 'Discipleship Management',
      '/admin/regional/settings': 'Settings',
      '/admin/super/dashboard': 'Super Admin Dashboard',
      '/admin/super/regions': 'Regional Branches Management',
      '/admin/super/members': 'Global Member Management',
      '/admin/super/user-management': 'User Management',
      '/admin/super/events': 'Global Event Management',
      '/admin/super/finances': 'Global Financial Management',
      '/admin/super/communication': 'Global Communication Center',
      '/admin/super/fundraising': 'Global Fundraising Management',
      '/admin/super/locations': 'Global Location Management',
      '/admin/super/reports': 'Global Reports & Analytics',
      '/admin/super/currencies': 'Currency Management',
      '/admin/super/homepage-settings': 'Homepage Settings',
      '/admin/super/about-settings': 'About Us Settings',
      '/admin/super/certificates': 'Certificate Management',
    };

    return routeTitleMap[location.pathname] || 'Admin Dashboard';
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-950">
      <Sidebar collapsible="icon" className="border-r border-gray-200 dark:border-gray-800">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between w-full">
            {!isCollapsed && (
              <Link to="/" className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  {userRegion?.name?.toUpperCase() || 'PORTAL'}
                </span>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className={`shrink-0 h-8 w-8 ${isCollapsed ? "mx-auto" : ""}`}>
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <div className="py-2">
            <nav className="mt-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const linkContent = (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
                      isCollapsed ? "justify-center px-2" : ""
                    } ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </nav>
          </div>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto space-y-2">
          {!isCollapsed && <PortalSwitcher />}
          <Button
            variant="outline"
            className={`w-full flex items-center gap-2 ${isCollapsed ? "justify-center px-2" : ""}`}
            onClick={signOut}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 bg-white dark:bg-gray-900 shadow z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
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
        <main className={cn(
          "flex-1 h-[calc(100vh-56px)]",
          location.pathname === '/admin/regional/dashboard'
            ? "overflow-hidden p-0"
            : "overflow-y-auto p-4 md:p-6"
        )}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

const AdminLayout: React.FC<AdminLayoutProps> = (props) => {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <AdminLayoutInner {...props} />
    </SidebarProvider>
  );
};

export default AdminLayout;
