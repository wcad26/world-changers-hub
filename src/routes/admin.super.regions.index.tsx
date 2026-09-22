import { createFileRoute, useLocation } from "@tanstack/react-router";
import Page from "@/pages/admin/super/Regions";
import SuperAdminSessionRoute from "@/components/auth/SuperAdminSessionRoute";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import SuperAdminErrorBoundary from "@/components/auth/SuperAdminErrorBoundary";

function RoutePage() {
  const location = useLocation();
  return (<SuperAdminSessionRoute><SuperAdminLayout><SuperAdminErrorBoundary resetKey={location.pathname}><Page /></SuperAdminErrorBoundary></SuperAdminLayout></SuperAdminSessionRoute>);
}

export const Route = createFileRoute("/admin/super/regions/")({ component: RoutePage });
