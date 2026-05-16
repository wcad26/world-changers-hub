import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VisitorRegister from "./pages/VisitorRegister";
import MemberRegister from "./pages/MemberRegister";
import PortalSelector from "./components/auth/PortalSelector";
import DcgSessionRoute from "./components/auth/DcgSessionRoute";
import { AuthProvider } from "@/contexts/AuthProvider";

// Layout Components
import EnhancedRegionalAdminLayout from "./components/admin/EnhancedRegionalAdminLayout";
import RegionalSessionRoute from "./components/auth/RegionalSessionRoute";
import { RegionalSessionProvider } from "./contexts/RegionalSessionContext";
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

import RegionalCommunication from "./pages/admin/regional/Communication";
import RegionalSettings from "./pages/admin/regional/Settings";
import RegionalBranchSettings from "./pages/admin/regional/BranchSettings";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch protected portal data when the user briefly tabs away
      // and returns — that was causing the "page blanks then reloads" feel
      // after a few minutes inside the regional portal.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});
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
          <Routes>
            {/* ---------------------------------------------------------------
                REGIONAL PORTAL — fully isolated from the global AuthProvider.
                Its login pages and its admin shell run under their own
                RegionalSessionProvider only (installed by RegionalSessionRoute
                for /admin/regional/*). The login pages themselves don't need
                any provider; the regional sign-in only checks region match.
                --------------------------------------------------------------- */}
            <Route path="/auth/regional" element={<RegionalAuth />} />

            <Route
              path="/admin/regional"
              element={
                <RegionalSessionProvider>
                  <Outlet />
                </RegionalSessionProvider>
              }
            >
              <Route index element={<Navigate to="/admin/regional/dashboard" replace />} />
              <Route
                element={
                  <RegionalSessionRoute>
                    <EnhancedRegionalAdminLayout />
                  </RegionalSessionRoute>
                }
              >
                <Route path="dashboard" element={<RegionalDashboard />} />
                <Route path="members" element={<RegionalMembers />} />
                <Route path="members/:memberId" element={<RegionalMemberProfile />} />
                <Route path="events" element={<RegionalEvents />} />
                <Route path="events/:eventId/report" element={<RegionalEventReport />} />
                <Route path="finances" element={<RegionalFinances />} />
                <Route path="dcg" element={<RegionalDCG />} />
                <Route path="dcg/:dcgId" element={<DcgProfile />} />
                <Route path="certificates" element={<RegionalCertificates />} />
                
                <Route path="communication" element={<RegionalCommunication />} />
                <Route path="branch-settings" element={<RegionalBranchSettings />} />
                <Route path="discipleship" element={<RegionalDiscipleship />} />
                
                <Route path="settings" element={<RegionalSettings />} />
              </Route>
            </Route>

            {/* Public routes — NO auth provider mounted. */}
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

            {/* Auth (login) pages — NO provider. */}
            <Route path="/visitor/register/:regionCode" element={<VisitorRegister />} />
            <Route path="/member/register/:regionCode" element={<MemberRegister />} />
            <Route path="/auth/super" element={<SuperAuth />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/dcg-auth" element={<DcgAuth />} />
            <Route path="/auth/member" element={<MemberAuth />} />
            <Route path="/member/auth" element={<Navigate to="/auth/member" replace />} />
            <Route path="/auth/admin" element={<Navigate to="/auth/regional" replace />} />

            {/* Admin redirects */}
            <Route path="/admin" element={<Navigate to="/admin/regional/dashboard" replace />} />

            {/* Super Admin Portal — own AuthProvider, isolated from others. */}
            <Route
              path="/admin/super"
              element={
                <AuthProvider>
                  <Outlet />
                </AuthProvider>
              }
            >
              <Route index element={<Navigate to="/admin/super/dashboard" replace />} />
              <Route element={<SuperAdminSessionRoute><SuperAdminLayout /></SuperAdminSessionRoute>}>
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
            </Route>

            {/* Member Portal — own AuthProvider. */}
            <Route
              path="/member"
              element={
                <AuthProvider>
                  <MemberProtectedRoute>
                    <MemberLayout />
                  </MemberProtectedRoute>
                </AuthProvider>
              }
            >
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

            {/* DCG Portal — own AuthProvider, isolated. */}
            <Route
              path="/dcg"
              element={
                <AuthProvider>
                  <Outlet />
                </AuthProvider>
              }
            >
              <Route index element={<Navigate to="/dcg/dashboard" replace />} />
              <Route path="dashboard" element={<DcgSessionRoute><DcgDashboard /></DcgSessionRoute>} />
              <Route path="members" element={<DcgSessionRoute><DcgMembers /></DcgSessionRoute>} />
              <Route path="member/:memberId" element={<DcgSessionRoute><DcgMemberProfile /></DcgSessionRoute>} />
              <Route path="events" element={<DcgSessionRoute><DcgEvents /></DcgSessionRoute>} />
              <Route path="finances" element={<DcgSessionRoute><DcgFinances /></DcgSessionRoute>} />
              <Route path="reports" element={<DcgSessionRoute><DcgReports /></DcgSessionRoute>} />
              <Route path="communication" element={<DcgSessionRoute><DcgCommunication /></DcgSessionRoute>} />
            </Route>

            {/* Portal selector (rare, shown after multi-role login) */}
            <Route
              path="/portal-selector"
              element={
                <AuthProvider>
                  <PortalSelector />
                </AuthProvider>
              }
            />

            {/* Unauthorized + 404 */}
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
                    <p className="text-muted-foreground mb-4">You don't have permission to access this resource.</p>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
                  </div>
                </div>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>;
};
export default App;
