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
import EventDetail from "./pages/EventDetail";
import Media from "./pages/Media";
import Store from "./pages/Store";
import Blog from "./pages/Blog";
import Counseling from "./pages/Counseling";
import Fundraising from "./pages/Fundraising";
import CertificateVerify from "./pages/CertificateVerify";
import NotFound from "./pages/NotFound";

import RegionalAuth from "./pages/RegionalAuth";
import SuperAuth from "./pages/SuperAuth";
import DcgAuth from "./pages/DcgAuth";
import RegionSelect from "./pages/RegionSelect";
import RegionSpecificAuth from "./components/auth/RegionSpecificAuth";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VisitorRegister from "./pages/VisitorRegister";
import MemberRegister from "./pages/MemberRegister";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PortalSelector from "./components/auth/PortalSelector";
import MultiRoleProtectedRoute from "./components/auth/MultiRoleProtectedRoute";
import DcgSessionRoute from "./components/auth/DcgSessionRoute";
import { AuthProvider } from "@/contexts/AuthContext";

// Layout Components
import EnhancedRegionalAdminLayout from "./components/admin/EnhancedRegionalAdminLayout";
import RegionalSessionRoute from "./components/auth/RegionalSessionRoute";
import SuperAdminLayout from "./components/admin/SuperAdminLayout";
import SuperAdminSessionRoute from "./components/auth/SuperAdminSessionRoute";
import MemberLayout from "./components/layout/MemberLayout";
import MemberProtectedRoute from "./components/auth/MemberProtectedRoute";

// Admin Portal Routes
import RegionalDashboard from "./pages/admin/regional/Dashboard";
import RegionalMembers from "./pages/admin/regional/Members";
import RegionalMemberProfile from "./pages/admin/regional/MemberProfile";
import RegionalEvents from "./pages/admin/regional/Events";
import RegionalEventReport from "./pages/admin/regional/EventReport";

import RegionalFinances from "./pages/admin/regional/Finances";
import RegionalDCG from "./pages/admin/regional/DCG";
import DcgProfile from "./pages/admin/regional/DcgProfile";
import RegionalReports from "./pages/admin/regional/Reports";
import RegionalCommunication from "./pages/admin/regional/Communication";
import RegionalSettings from "./pages/admin/regional/Settings";
import RegionalBranchSettings from "./pages/admin/regional/BranchSettings";
import UserRoles from "./pages/admin/regional/UserRoles";
import RegionalDiscipleship from "./pages/admin/regional/Discipleship";

import RegionalCertificates from "./pages/admin/regional/Certificates";

// Super Admin Portal Routes
import SuperDashboard from "./pages/admin/super/Dashboard";
import SuperMembers from "./pages/admin/super/Members";
import SuperMemberProfile from "./pages/admin/super/MemberProfile";
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
import SuperCertificates from "./pages/admin/super/Certificates";
import SelfAttendance from "./pages/SelfAttendance";

// DCG Portal Routes
import DcgDashboard from "./pages/dcg/Dashboard";
import DcgMembers from "./pages/dcg/Members";
import DcgMemberProfile from "./pages/dcg/MemberProfile";
import DcgEvents from "./pages/dcg/Events";
import DcgFinances from "./pages/dcg/Finances";
import DcgReports from "./pages/dcg/Reports";
import DcgCommunication from "./pages/dcg/Communication";

// Member Portal Routes
import MemberAuth from "./pages/MemberAuth";
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
import MemberBible from "./pages/member/Bible";

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
  return <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:slug" element={<RegionalBranchHome />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/media" element={<Media />} />
            <Route path="/store" element={<Store />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/counseling" element={<Counseling />} />
            <Route path="/fundraising" element={<Fundraising />} />
            <Route path="/verify/:verificationCode" element={<CertificateVerify />} />
            <Route path="/attend/:eventId" element={<SelfAttendance />} />
            
            {/* Authentication Routes */}
            <Route path="/auth/regional" element={<RegionalAuth />} />
            <Route path="/auth/regions" element={<RegionSelect />} />
            <Route path="/auth/regions/:regionSlug" element={<RegionSpecificAuth />} />
            <Route path="/visitor/register/:regionCode" element={<VisitorRegister />} />
            <Route path="/member/register/:regionCode" element={<MemberRegister />} />
            <Route path="/auth/super" element={<SuperAuth />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/dcg-auth" element={<DcgAuth />} />
            <Route path="/auth/member" element={<MemberAuth />} />
            <Route path="/member/auth" element={<Navigate to="/auth/member" replace />} />
            
            {/* Admin Redirects */}
            <Route path="/admin" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/regional" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/super" element={<Navigate to="/admin/super/dashboard" replace />} />
            
            {/* Regional Admin Portal - single simple guard: signed in + belongs to a region */}
            <Route path="/admin/regional" element={
              <RegionalSessionRoute>
                <EnhancedRegionalAdminLayout />
              </RegionalSessionRoute>
            }>
              <Route path="dashboard" element={<RegionalDashboard />} />
              <Route path="members" element={<RegionalMembers />} />
              <Route path="members/:memberId" element={<RegionalMemberProfile />} />
              <Route path="events" element={<RegionalEvents />} />
              <Route path="events/:eventId/report" element={<RegionalEventReport />} />
              <Route path="finances" element={<RegionalFinances />} />
              <Route path="dcg" element={<RegionalDCG />} />
              <Route path="dcg/:dcgId" element={<DcgProfile />} />
              <Route path="certificates" element={<RegionalCertificates />} />
              <Route path="reports" element={<RegionalReports />} />
              <Route path="communication" element={<RegionalCommunication />} />
              <Route path="branch-settings" element={<RegionalBranchSettings />} />
              <Route path="discipleship" element={<RegionalDiscipleship />} />
              <Route path="user-roles" element={<UserRoles />} />
              <Route path="settings" element={<RegionalSettings />} />
            </Route>
            
            {/* Super Admin Portal - single simple guard: signed in + super_admin role */}
            <Route path="/admin/super" element={
              <SuperAdminSessionRoute>
                <SuperAdminLayout />
              </SuperAdminSessionRoute>
            }>
              <Route path="dashboard" element={<SuperDashboard />} />
              <Route path="members" element={<SuperMembers />} />
              <Route path="members/:memberId" element={<SuperMemberProfile />} />
              <Route path="events" element={<SuperEvents />} />
              <Route path="fundraising" element={<SuperFundraising />} />
              <Route path="locations" element={<SuperLocations />} />
              <Route path="finances" element={<SuperFinances />} />
              <Route path="regions" element={<SuperRegions />} />
              <Route path="currencies" element={<SuperCurrencies />} />
              <Route path="reports" element={<SuperReports />} />
              <Route path="communication" element={<SuperCommunication />} />
              <Route path="user-management" element={<SuperUserManagement />} />
              <Route path="homepage-settings" element={<HomepageSettings />} />
              <Route path="certificates" element={<SuperCertificates />} />
              <Route path="about-settings" element={<AboutUsSettings />} />
            </Route>
            
            {/* Member Portal - Nested Routes with shared layout */}
            <Route path="/member" element={
              <MemberProtectedRoute>
                <MemberLayout />
              </MemberProtectedRoute>
            }>
              <Route index element={<Navigate to="/member/dashboard" replace />} />
              <Route path="dashboard" element={<MemberDashboard />} />
              <Route path="events" element={<MemberEvents />} />
              <Route path="profile" element={<MemberProfile />} />
              <Route path="finances" element={<MemberFinances />} />
              <Route path="discipleship" element={<MemberDiscipleship />} />
              <Route path="bible" element={<MemberBible />} />
              <Route path="attendance" element={<MemberAttendance />} />
              <Route path="fundraising" element={<MemberFundraising />} />
              <Route path="media" element={<MemberMedia />} />
              <Route path="counseling" element={<MemberCounseling />} />
              <Route path="store" element={<MemberStore />} />
            </Route>
            
            {/* DCG Portal Routes - single simple guard: signed in + DCG associated */}
            <Route path="/dcg" element={<Navigate to="/dcg/dashboard" replace />} />
            <Route path="/dcg/dashboard" element={<DcgSessionRoute><DcgDashboard /></DcgSessionRoute>} />
            <Route path="/dcg/members" element={<DcgSessionRoute><DcgMembers /></DcgSessionRoute>} />
            <Route path="/dcg/member/:memberId" element={<DcgSessionRoute><DcgMemberProfile /></DcgSessionRoute>} />
            <Route path="/dcg/events" element={<DcgSessionRoute><DcgEvents /></DcgSessionRoute>} />
            <Route path="/dcg/finances" element={<DcgSessionRoute><DcgFinances /></DcgSessionRoute>} />
            <Route path="/dcg/reports" element={<DcgSessionRoute><DcgReports /></DcgSessionRoute>} />
            <Route path="/dcg/communication" element={<DcgSessionRoute><DcgCommunication /></DcgSessionRoute>} />
            
            {/* Portal Selector Route */}
            <Route path="/portal-selector" element={<PortalSelector />} />
            
            {/* Unauthorized Route */}
            <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
                  <p className="text-muted-foreground mb-4">You don't have permission to access this resource.</p>
                  <Button onClick={() => window.history.back()}>Go Back</Button>
                </div>
              </div>} />
            
            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>;
};
export default App;
