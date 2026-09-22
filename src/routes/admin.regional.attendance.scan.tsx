import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AttendanceScan";
import { RegionalSessionProvider } from "@/contexts/RegionalSessionContext";
import RegionalSessionRoute from "@/components/auth/RegionalSessionRoute";
function RoutePage(){ return <RegionalSessionProvider><RegionalSessionRoute><Page /></RegionalSessionRoute></RegionalSessionProvider>; }
export const Route = createFileRoute("/admin/regional/attendance/scan")({ component: RoutePage });
