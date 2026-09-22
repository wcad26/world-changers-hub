import { createFileRoute, useLocation } from "@tanstack/react-router";
import Page from "@/pages/admin/AttendanceScan";
import SuperAdminSessionRoute from "@/components/auth/SuperAdminSessionRoute";
import SuperAdminErrorBoundary from "@/components/auth/SuperAdminErrorBoundary";
function RoutePage(){ const l=useLocation(); return <SuperAdminSessionRoute><SuperAdminErrorBoundary resetKey={l.pathname}><Page /></SuperAdminErrorBoundary></SuperAdminSessionRoute>; }
export const Route = createFileRoute("/admin/super/attendance/scan")({ component: RoutePage });
