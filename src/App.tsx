
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
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

// Admin Portal Routes
import RegionalDashboard from "./pages/admin/regional/Dashboard";
import RegionalMembers from "./pages/admin/regional/Members";
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
            
            {/* Admin Redirects - For easier navigation */}
            <Route path="/admin" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/regional" element={<Navigate to="/admin/regional/dashboard" replace />} />
            <Route path="/admin/super" element={<Navigate to="/admin/super/dashboard" replace />} />
            
            {/* Regional Admin Portal Routes */}
            <Route path="/admin/regional/dashboard" element={<RegionalDashboard />} />
            <Route path="/admin/regional/members" element={<RegionalMembers />} />
            <Route path="/admin/regional/events" element={<RegionalEvents />} />
            <Route path="/admin/regional/fundraising" element={<RegionalFundraising />} />
            <Route path="/admin/regional/locations" element={<RegionalLocations />} />
            <Route path="/admin/regional/finances" element={<RegionalFinances />} />
            <Route path="/admin/regional/dcg" element={<RegionalDCG />} />
            <Route path="/admin/regional/reports" element={<RegionalReports />} />
            <Route path="/admin/regional/communication" element={<RegionalCommunication />} />
            
            {/* Super Admin Portal Routes */}
            <Route path="/admin/super/dashboard" element={<SuperDashboard />} />
            <Route path="/admin/super/members" element={<SuperMembers />} />
            <Route path="/admin/super/events" element={<SuperEvents />} />
            <Route path="/admin/super/fundraising" element={<SuperFundraising />} />
            <Route path="/admin/super/locations" element={<SuperLocations />} />
            <Route path="/admin/super/finances" element={<SuperFinances />} />
            <Route path="/admin/super/regions" element={<SuperRegions />} />
            <Route path="/admin/super/reports" element={<SuperReports />} />
            <Route path="/admin/super/communication" element={<SuperCommunication />} />
            
            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
