import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface DcgAdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { title: "Dashboard", path: "/dcg/dashboard", icon: LayoutDashboard },
  { title: "Members", path: "/dcg/members", icon: Users },
  { title: "Events", path: "/dcg/events", icon: Calendar },
  { title: "Finances", path: "/dcg/finances", icon: DollarSign },
  
];

const bottomTabs = menuItems;

const pageInfo: Record<string, { title: string; icon: LucideIcon }> = {
  "/dcg/dashboard": { title: "DCG Dashboard", icon: LayoutDashboard },
  "/dcg/members": { title: "DCG Members", icon: Users },
  "/dcg/events": { title: "DCG Events", icon: Calendar },
  "/dcg/finances": { title: "DCG Finances", icon: DollarSign },
  
};

const DcgAdminLayout: React.FC<DcgAdminLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, userDcg, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const useMobileLayout = isMobile || isTablet;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[DcgAdminLayout] signOut error', err);
    } finally {
      navigate('/dcg-auth', { replace: true });
    }
  };

  // Desktop layout
  if (!useMobileLayout) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Fixed Sidebar */}
        <div
          className={cn(
            "fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-30",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex items-center justify-between border-b border-border bg-primary p-4 text-primary-foreground">
            <div
              className={cn(
                "transition-opacity duration-300 overflow-hidden",
                isCollapsed ? "opacity-0 w-0" : "opacity-100"
              )}
            >
              <h2 className="font-heading truncate text-lg font-bold">
                {userDcg?.name || "DCG Portal"}
              </h2>
              <p className="mt-1 truncate text-xs text-primary-foreground/70">
                Welcome, {profile?.first_name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="shrink-0"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center p-3" : "px-3 py-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3")}
                  />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}

            {/* Sign Out in nav panel */}
            <div className="pt-4 mt-4 border-t border-border space-y-1">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className={cn(
                  "w-full text-muted-foreground hover:text-foreground",
                  isCollapsed ? "justify-center p-3" : "justify-start px-3 py-2"
                )}
              >
                <LogOut
                  className={cn(isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3")}
                />
                {!isCollapsed && "Sign Out"}
              </Button>
            </div>
          </nav>
        </div>

        {/* Main content with margin for fixed sidebar */}
        <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/90 px-6 py-3 shadow-xs backdrop-blur-xl">
            <h1 className="text-xl font-semibold text-foreground">
              {pageInfo[location.pathname]?.title || "DCG Portal"}
            </h1>
            <div className="flex items-center gap-2"><ThemeToggle /><span className="text-sm text-muted-foreground">{user?.email}</span></div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    );
  }

  // Mobile/Tablet layout
  const currentPage = pageInfo[location.pathname] || {
    title: "DCG Portal",
    icon: LayoutDashboard,
  };
  const PageIcon = currentPage.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed top header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <PageIcon className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-base font-semibold text-foreground truncate">
            {currentPage.title}
          </h1>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="bg-primary text-primary-foreground shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-card">
             <div className="border-b border-border bg-primary p-6 text-primary-foreground">
               <h2 className="font-heading text-lg font-bold">
                {userDcg?.name || "DCG Portal"}
              </h2>
               <p className="mt-1 text-sm text-primary-foreground/70">
                Welcome, {profile?.first_name}
              </p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.title}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-border mt-4 space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full justify-start px-3 py-2.5 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 pb-24">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
         <div className="rounded-md bg-primary shadow-regal">
          <div className="flex justify-around items-center py-2 px-1">
            {bottomTabs.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                     "relative flex flex-col items-center rounded-md px-3 py-2 transition-colors",
                     isActive ? "bg-primary-foreground" : "hover:bg-primary-foreground/10"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors duration-300",
                       isActive ? "text-primary" : "text-primary-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium mt-0.5 transition-colors duration-300",
                       isActive ? "text-primary" : "text-primary-foreground"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default DcgAdminLayout;
