import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
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
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Fundraising from "./pages/Fundraising";
import FundraisingDetails from "./pages/FundraisingDetails";
import FundraisingPledge from "./pages/FundraisingPledge";
import FundraisingDonate from "./pages/FundraisingDonate";
import CertificateVerify from "./pages/CertificateVerify";
import NotFound from "./pages/NotFound";

import RegionalAuth from "./pages/RegionalAuth";
import SuperAuth from "./pages/SuperAuth";
import DcgAuth from "./pages/DcgAuth";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VisitorRegister from "./pages/VisitorRegister";
import SpecialEventRegister from "./pages/SpecialEventRegister";
import EventFeedback from "./pages/EventFeedback";
import MemberRegister from "./pages/MemberRegister";
import UpdateProfile from "./pages/UpdateProfile";
import PortalSelector from "./components/auth/PortalSelector";
import DcgSessionRoute from "./components/auth/DcgSessionRoute";
import { AuthProvider } from "@/contexts/AuthProvider";

// Layout Components
import EnhancedRegionalAdminLayout from "./components/admin/EnhancedRegionalAdminLayout";
import RegionalSessionRoute from "./components/auth/RegionalSessionRoute";
import { RegionalSessionProvider } from "./contexts/RegionalSessionContext";
import SuperAdminLayout from "./components/admin/SuperAdminLayout";
import SuperAdminSessionRoute from "./components/auth/SuperAdminSessionRoute";
import SuperAdminErrorBoundary from "./components/auth/SuperAdminErrorBoundary";
import MemberLayout from "./components/layout/MemberLayout";
import MemberProtectedRoute from "./components/auth/MemberProtectedRoute";

// Admin Portal Routes
import RegionalDashboard from "./pages/admin/regional/Dashboard";
import RegionalMembers from "./pages/admin/regional/Members";
import RegionalMemberProfile from "./pages/admin/regional/MemberProfile";
import RegionalEvents from "./pages/admin/regional/Events";
import RegionalEventReport from "./pages/admin/regional/EventReport";

import RegionalFinances from "./pages/admin/regional/Finances";
import FundraisingCampaignReport from "./pages/admin/regional/FundraisingCampaignReport";
import RegionalDCG from "./pages/admin/regional/DCG";
import DcgProfile from "./pages/admin/regional/DcgProfile";

import RegionalCommunication from "./pages/admin/regional/Communication";
import RegionalPlanning from "./pages/admin/regional/Planning";
import RegionalSettings from "./pages/admin/regional/Settings";
import RegionalBranchSettings from "./pages/admin/regional/BranchSettings";

import RegionalDiscipleship from "./pages/admin/regional/Discipleship";

import RegionalCertificates from "./pages/admin/regional/Certificates";

// Super Admin Portal Routes
import SuperDashboard from "./pages/admin/super/Dashboard";
import SuperMembers from "./pages/admin/super/Members";
import SuperMemberProfile from "./pages/admin/super/MemberProfile";
import SuperEvents from "./pages/admin/super/Events";

import SuperLocations from "./pages/admin/super/Locations";
import SuperFinances from "./pages/admin/super/Finances";
import SuperRegions from "./pages/admin/super/Regions";
import SuperRegionReport from "./pages/admin/super/RegionReport";
import SuperSettings from "./pages/admin/super/Settings";
import SuperReports from "./pages/admin/super/Reports";
import SuperCommunication from "./pages/admin/super/Communication";
import AboutUsSettings from "./pages/admin/super/AboutUsSettings";
import HomepageSettings from "./pages/admin/super/HomepageSettings";

import SuperCertificates from "./pages/admin/super/Certificates";
import SuperSpecialEventReport from "./pages/admin/super/SpecialEventReport";
import SuperEventReport from "./pages/admin/super/EventReport";

import SuperFundraisingCampaignReport from "./pages/admin/super/FundraisingCampaignReport";
import SelfAttendance from "./pages/SelfAttendance";
import AttendanceScan from "./pages/admin/AttendanceScan";
import AttendanceLogin from "./pages/AttendanceLogin";

// DCG Portal Routes
import DcgDashboard from "./pages/dcg/Dashboard";
import DcgMembers from "./pages/dcg/Members";
import DcgMemberProfile from "./pages/dcg/MemberProfile";
import DcgEvents from "./pages/dcg/Events";
import DcgFinances from "./pages/dcg/Finances";

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
      // Retry transient network errors (TypeError: Failed to fetch) up to 3
      // times with exponential backoff before surfacing as an error.
      retry: (failureCount, error: any) => {
        if (failureCount >= 3) return false;
        const msg = (error?.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
          return true;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      staleTime: 60 * 1000,
    },
  },
});

// Wrap each Super Admin page in an error boundary keyed by pathname so a
// single page error never blanks the portal and triggers the preview's
// reload-to-previous-route loop. Auth is untouched — RLS controls access.
const SuperAdminPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <SuperAdminErrorBoundary resetKey={location.pathname}>
      {children}
    </SuperAdminErrorBoundary>
  );
};

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
            {/* Regional portal keeps a regional bootstrap, while the global AuthProvider stays mounted once. */}
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
                <Route path="finances/fundraising/:campaignId" element={<FundraisingCampaignReport />} />
                <Route path="dcg" element={<RegionalDCG />} />
                <Route path="dcg/:dcgId" element={<DcgProfile />} />
                <Route path="certificates" element={<RegionalCertificates />} />

                
                <Route path="communication" element={<RegionalCommunication />} />
                <Route path="planning" element={<RegionalPlanning />} />
                <Route path="branch-settings" element={<RegionalBranchSettings />} />
                <Route path="discipleship" element={<RegionalDiscipleship />} />
                
                <Route path="settings" element={<RegionalSettings />} />
                <Route path="user-roles" element={<Navigate to="/admin/regional/settings?tab=access" replace />} />
                <Route path="user-management" element={<Navigate to="/admin/regional/settings?tab=access" replace />} />
              </Route>
              {/* Scanner route: no admin layout, no bottom bar — mobile-first standalone page. */}
              <Route
                path="attendance/scan"
                element={
                  <RegionalSessionRoute>
                    <AttendanceScan />
                  </RegionalSessionRoute>
                }
              />

            </Route>

            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:slug" element={<RegionalBranchHome />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/events/:slug/register" element={<SpecialEventRegister />} />
            <Route path="/events/:slug/feedback" element={<EventFeedback />} />
            <Route path="/media" element={<Media />} />
            <Route path="/store" element={<Store />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/counseling" element={<Counseling />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/fundraising" element={<Fundraising />} />
            <Route path="/fundraising/:id" element={<FundraisingDetails />} />
            <Route path="/fundraising/:id/pledge" element={<FundraisingPledge />} />
            <Route path="/fundraising/:id/donate" element={<FundraisingDonate />} />
            <Route path="/verify/:verificationCode" element={<CertificateVerify />} />
            <Route path="/attend/:eventId" element={<SelfAttendance />} />
            <Route path="/attendance/login" element={<AttendanceLogin />} />
            <Route path="/attendance/scan" element={<AttendanceScan />} />

            {/* Auth (login) pages */}
            <Route path="/visitor/register/:regionCode" element={<VisitorRegister />} />
            <Route path="/profile/update" element={<UpdateProfile />} />
            <Route path="/member/register/:regionCode" element={<MemberRegister />} />
            <Route path="/auth/super" element={<SuperAuth />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/dcg-auth" element={<DcgAuth />} />
            <Route path="/auth/member" element={<MemberAuth />} />
            <Route path="/member/auth" element={<Navigate to="/auth/member" replace />} />
            <Route path="/auth/admin" element={<Navigate to="/auth/regional" replace />} />

            {/* Admin redirects */}
            <Route path="/admin" element={<Navigate to="/admin/regional/dashboard" replace />} />

            {/* Super Admin Portal */}
            <Route
              path="/admin/super"
              element={<Outlet />}
            >
              <Route index element={<Navigate to="/admin/super/dashboard" replace />} />
              <Route element={<SuperAdminSessionRoute><SuperAdminLayout /></SuperAdminSessionRoute>}>
                <Route path="dashboard" element={<SuperAdminPage><SuperDashboard /></SuperAdminPage>} />
                <Route path="members" element={<SuperAdminPage><SuperMembers /></SuperAdminPage>} />
                <Route path="members/:memberId" element={<SuperAdminPage><SuperMemberProfile /></SuperAdminPage>} />
                <Route path="events" element={<SuperAdminPage><SuperEvents /></SuperAdminPage>} />
                <Route path="events/:eventId/report" element={<SuperAdminPage><SuperEventReport /></SuperAdminPage>} />
                <Route path="events/:eventId/special-report" element={<SuperAdminPage><SuperSpecialEventReport /></SuperAdminPage>} />

                <Route path="fundraising" element={<Navigate to="/admin/super/finances" replace />} />
                <Route path="locations" element={<SuperAdminPage><SuperLocations /></SuperAdminPage>} />
                <Route path="finances" element={<SuperAdminPage><SuperFinances /></SuperAdminPage>} />
                <Route path="finances/fundraising/:campaignId" element={<SuperAdminPage><SuperFundraisingCampaignReport /></SuperAdminPage>} />
                <Route path="regions" element={<SuperAdminPage><SuperRegions /></SuperAdminPage>} />
                <Route path="regions/:regionId/report" element={<SuperAdminPage><SuperRegionReport /></SuperAdminPage>} />
                <Route path="currencies" element={<Navigate to="/admin/super/settings?tab=currency" replace />} />
                <Route path="settings" element={<SuperAdminPage><SuperSettings /></SuperAdminPage>} />
                <Route path="reports" element={<SuperAdminPage><SuperReports /></SuperAdminPage>} />
                <Route path="communication" element={<SuperAdminPage><SuperCommunication /></SuperAdminPage>} />
                <Route path="user-management" element={<Navigate to="/admin/super/settings?tab=access" replace />} />
                <Route path="homepage-settings" element={<SuperAdminPage><HomepageSettings /></SuperAdminPage>} />
                <Route path="certificates" element={<SuperAdminPage><SuperCertificates /></SuperAdminPage>} />
                <Route path="about-settings" element={<SuperAdminPage><AboutUsSettings /></SuperAdminPage>} />
              </Route>
              {/* Scanner route: no admin layout, no bottom bar — mobile-first standalone page. */}
              <Route
                path="attendance/scan"
                element={
                  <SuperAdminSessionRoute>
                    <SuperAdminPage><AttendanceScan /></SuperAdminPage>
                  </SuperAdminSessionRoute>
                }
              />

            </Route>


            {/* Member Portal */}
            <Route
              path="/member"
              element={
                <MemberProtectedRoute>
                  <MemberLayout />
                </MemberProtectedRoute>
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

            {/* DCG Portal */}
            <Route
              path="/dcg"
              element={<Outlet />}
            >
              <Route index element={<Navigate to="/dcg/dashboard" replace />} />
              <Route path="dashboard" element={<DcgSessionRoute><DcgDashboard /></DcgSessionRoute>} />
              <Route path="members" element={<DcgSessionRoute><DcgMembers /></DcgSessionRoute>} />
              <Route path="member/:memberId" element={<DcgSessionRoute><DcgMemberProfile /></DcgSessionRoute>} />
              <Route path="events" element={<DcgSessionRoute><DcgEvents /></DcgSessionRoute>} />
              <Route path="finances" element={<DcgSessionRoute><DcgFinances /></DcgSessionRoute>} />
              
              <Route path="communication" element={<DcgSessionRoute><DcgCommunication /></DcgSessionRoute>} />
            </Route>

            {/* Portal selector (rare, shown after multi-role login) */}
            <Route
              path="/portal-selector"
              element={<PortalSelector />}
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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>;
};
export default App;
