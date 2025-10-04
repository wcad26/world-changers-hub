import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Locations from "./pages/Locations";
import RegionalBranchHome from "./pages/RegionalBranchHome";
import Events from "./pages/Events";
import Media from "./pages/Media";
import Store from "./pages/Store";
import Blog from "./pages/Blog";
import Counseling from "./pages/Counseling";
import Fundraising from "./pages/Fundraising";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import RegionalAuth from "./pages/RegionalAuth";
import SuperAuth from "./pages/SuperAuth";
import DcgAuth from "./pages/DcgAuth";
import RegionSelect from "./pages/RegionSelect";
import RegionSpecificAuth from "./components/auth/RegionSpecificAuth";
import RegionalRegister from "./pages/auth/RegionalRegister";
import RegionSpecificRegister from "./pages/auth/RegionSpecificRegister";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PortalSelector from "./components/auth/PortalSelector";
import MultiRoleProtectedRoute from "./components/auth/MultiRoleProtectedRoute";

// Admin Portal Routes
import RegionalDashboard from "./pages/admin/regional/Dashboard";
import RegionalMembers from "./pages/admin/regional/Members";
import RegionalMemberProfile from "./pages/admin/regional/MemberProfile";
import RegionalEvents from "./pages/admin/regional/Events";
import RegionalFundraising from "./pages/admin/regional/Fundraising";
import RegionalLocations from "./pages/admin/regional/Locations";
import RegionalFinances from "./pages/admin/regional/Finances";
import RegionalDCG from "./pages/admin/regional/DCG";
import DcgProfile from "./pages/admin/regional/DcgProfile";
import RegionalReports from "./pages/admin/regional/Reports";
import RegionalCommunication from "./pages/admin/regional/Communication";
import RegionalSettings from "./pages/admin/regional/Settings";
import RegionalBranchSettings from "./pages/admin/regional/BranchSettings";
import UserRoles from "./pages/admin/regional/UserRoles";

// Super Admin Portal Routes
// Super Admin Portal Routes
import SuperDashboard from "./pages/admin/super/Dashboard";
import SuperMembers from "./pages/admin/super/Members";
import SuperEvents from "./pages/admin/super/Events";
import SuperFundraising from "./pages/admin/super/Fundraising";
import SuperLocations from "./pages/admin/super/Locations";
import SuperFinances from "./pages/admin/super/Finances";
import SuperRegions from "./pages/admin/super/Regions";
import SuperCurrencies from "./pages/admin/super/Currencies";
import SuperReports from "./pages/admin/super/Reports";
import SuperCommunication from "./pages/admin/super/Communication";
import AboutUsSettings from "./pages/admin/super/AboutUsSettings";
import HomepageSettings from "./pages/admin/super/HomepageSettings";
import SuperUserManagement from "./pages/admin/super/UserManagement";

// DCG Portal Routes
import DcgDashboard from "./pages/dcg/Dashboard";
import DcgMembers from "./pages/dcg/Members";

import DcgEvents from "./pages/dcg/Events";
import DcgFinances from "./pages/dcg/Finances";
import DcgReports from "./pages/dcg/Reports";
import DcgCommunication from "./pages/dcg/Communication";

// Member Portal Routes
import MemberAuth from "./pages/MemberAuth";
import MemberLayout from "./components/layout/MemberLayout";
import MemberProtectedRoute from "./components/auth/MemberProtectedRoute";
import MemberDashboard from "./pages/member/Dashboard";
import MemberEvents from "./pages/member/Events";
import MemberProfile from "./pages/member/Profile";
import MemberFinances from "./pages/member/Finances";
import MemberDiscipleship from "./pages/member/Discipleship";
import MemberAttendance from "./pages/member/Attendance";
import MemberFundraising from "./pages/member/Fundraising";
import MemberMedia from "./pages/member/Media";
import MemberCounseling from "./pages/member/Counseling";
import MemberStore from "./pages/member/Store";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href')?.substring(1);
        if (targetId) {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:slug" element={<RegionalBranchHome />} />
            <Route path="/events" element={<Events />} />
            <Route path="/media" element={<Media />} />
            <Route path="/store" element={<Store />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/counseling" element={<Counseling />} />
            <Route path="/fundraising" element={<Fundraising />} />
            
            {/* Authentication Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/regional" element={<RegionalAuth />} />
            <Route path="/auth/regions" element={<RegionSelect />} />
            <Route path="/auth/regions/:regionSlug" element={<RegionSpecificAuth />} />
            <Route path="/register/regional" element={<RegionalRegister />} />
            <Route path="/register/regions/:regionCode" element={<RegionSpecificRegister />} />
            <Route path="/auth/super" element={<SuperAuth />} />
            <Route path="/dcg-auth" element={<DcgAuth />} />
            <Route path="/member/auth" element={<MemberAuth />} />
            
            {/* Admin Redirects - For easier navigation */}
            <Route path="/admin" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/regional" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/super" element={<Navigate to="/admin/super/dashboard" replace />} />
            
            {/* Regional Admin Portal Routes - Allow super admins access */}
            <Route 
              path="/admin/regional/dashboard" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalDashboard />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/members" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalMembers />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/members/:memberId" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalMemberProfile />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/events" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalEvents />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/fundraising" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalFundraising />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/locations" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalLocations />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/finances" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalFinances />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/dcg" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalDCG />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/dcg/:dcgId" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <DcgProfile />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/reports" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalReports />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/communication" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalCommunication />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/branch-settings" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalBranchSettings />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/user-roles" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <UserRoles />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/settings" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['regional_admin', 'super_admin']} redirectTo="/auth/regions">
                  <RegionalSettings />
                </MultiRoleProtectedRoute>
              } 
            />
            
            {/* Super Admin Portal Routes */}
            <Route 
              path="/admin/super/dashboard" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/members" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperMembers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/events" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperEvents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/fundraising" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperFundraising />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/locations" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperLocations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/finances" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperFinances />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/regions" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperRegions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/currencies" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperCurrencies />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/reports" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/communication" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperCommunication />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/user-management" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <SuperUserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/homepage-settings" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <HomepageSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/super/about-settings" 
              element={
                <ProtectedRoute requiredRole="super_admin" redirectTo="/auth/super">
                  <AboutUsSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* Member Portal Routes */}
            <Route path="/member" element={<Navigate to="/member/dashboard" replace />} />
            <Route 
              path="/member/dashboard" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberDashboard />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/events" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberEvents />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/profile" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberProfile />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/finances" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberFinances />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/discipleship" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberDiscipleship />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/attendance" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberAttendance />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/fundraising" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberFundraising />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/media" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberMedia />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/counseling" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberCounseling />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            <Route 
              path="/member/store" 
              element={
                <MemberProtectedRoute>
                  <MemberLayout>
                    <MemberStore />
                  </MemberLayout>
                </MemberProtectedRoute>
              } 
            />
            
            {/* DCG Portal Routes - Allow regional admins and super admins access */}
            <Route path="/dcg" element={<Navigate to="/dcg/dashboard" replace />} />
            <Route 
              path="/dcg/dashboard" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['dcg_admin', 'regional_admin', 'super_admin']}>
                  <DcgDashboard />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/dcg/members" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['dcg_admin', 'regional_admin', 'super_admin']}>
                  <DcgMembers />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/dcg/events" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['dcg_admin', 'regional_admin', 'super_admin']}>
                  <DcgEvents />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/dcg/finances" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['dcg_admin', 'regional_admin', 'super_admin']}>
                  <DcgFinances />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/dcg/reports" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['dcg_admin', 'regional_admin', 'super_admin']}>
                  <DcgReports />
                </MultiRoleProtectedRoute>
              } 
            />
            <Route 
              path="/dcg/communication" 
              element={
                <MultiRoleProtectedRoute allowedRoles={['dcg_admin', 'regional_admin', 'super_admin']}>
                  <DcgCommunication />
                </MultiRoleProtectedRoute>
              } 
            />
            
            {/* Portal Selector Route */}
            <Route path="/portal-selector" element={<PortalSelector />} />
            
            {/* Unauthorized Route */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
                  <p className="text-muted-foreground mb-4">You don't have permission to access this resource.</p>
                  <Button onClick={() => window.history.back()}>Go Back</Button>
                </div>
              </div>
            } />
            
            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
