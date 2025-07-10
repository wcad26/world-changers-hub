import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Admin Portal Routes
import RegionalDashboard from "./pages/admin/regional/Dashboard";
import RegionalMembers from "./pages/admin/regional/Members";
import RegionalMemberProfile from "./pages/admin/regional/MemberProfile";
import RegionalEvents from "./pages/admin/regional/Events";
import RegionalFundraising from "./pages/admin/regional/Fundraising";
import RegionalLocations from "./pages/admin/regional/Locations";
import RegionalFinances from "./pages/admin/regional/Finances";
import RegionalDCG from "./pages/admin/regional/DCG";
import RegionalReports from "./pages/admin/regional/Reports";
import RegionalCommunication from "./pages/admin/regional/Communication";

// Super Admin Portal Routes
import SuperDashboard from "./pages/admin/super/Dashboard";
import SuperMembers from "./pages/admin/super/Members";
import SuperEvents from "./pages/admin/super/Events";
import SuperFundraising from "./pages/admin/super/Fundraising";
import SuperLocations from "./pages/admin/super/Locations";
import SuperFinances from "./pages/admin/super/Finances";
import SuperRegions from "./pages/admin/super/Regions";
import SuperReports from "./pages/admin/super/Reports";
import SuperCommunication from "./pages/admin/super/Communication";

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
            <Route path="/locations/:region" element={<RegionalBranchHome />} />
            <Route path="/events" element={<Events />} />
            <Route path="/media" element={<Media />} />
            <Route path="/store" element={<Store />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/counseling" element={<Counseling />} />
            <Route path="/fundraising" element={<Fundraising />} />
            
            {/* Authentication Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/regional" element={<RegionalAuth />} />
            <Route path="/auth/super" element={<SuperAuth />} />
            
            {/* Admin Redirects - For easier navigation */}
            <Route path="/admin" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/regional" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/super" element={<Navigate to="/admin/super/dashboard" replace />} />
            
            {/* Regional Admin Portal Routes */}
            <Route 
              path="/admin/regional/dashboard" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/members" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalMembers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/members/:memberId" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalMemberProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/events" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalEvents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/fundraising" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalFundraising />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/locations" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalLocations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/finances" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalFinances />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/dcg" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalDCG />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/reports" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/regional/communication" 
              element={
                <ProtectedRoute requiredRole="regional_admin" redirectTo="/auth/regional">
                  <RegionalCommunication />
                </ProtectedRoute>
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
            
            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
