import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/regional/Members";
import { RegionalSessionProvider } from "@/contexts/RegionalSessionContext";
import RegionalSessionRoute from "@/components/auth/RegionalSessionRoute";
import EnhancedRegionalAdminLayout from "@/components/admin/EnhancedRegionalAdminLayout";

function RoutePage() {
  return (<RegionalSessionProvider><RegionalSessionRoute><EnhancedRegionalAdminLayout><Page /></EnhancedRegionalAdminLayout></RegionalSessionRoute></RegionalSessionProvider>);
}

export const Route = createFileRoute("/admin/regional/members")({ component: RoutePage });
