import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/regional/EventReport";
import { RegionalSessionProvider } from "@/contexts/RegionalSessionContext";
import RegionalSessionRoute from "@/components/auth/RegionalSessionRoute";
import EnhancedRegionalAdminLayout from "@/components/admin/EnhancedRegionalAdminLayout";

function RoutePage() {
  return (<RegionalSessionProvider><RegionalSessionRoute><EnhancedRegionalAdminLayout><Page /></EnhancedRegionalAdminLayout></RegionalSessionRoute></RegionalSessionProvider>);
}

export const Route = createFileRoute("/admin/regional/events/$eventId/report")({
  head: () => ({
    meta: [
      { title: "Event Report — WCA Regional Admin" },
      { name: "description", content: "Review attendance, participants, and feedback for a regional event." },
      { property: "og:title", content: "Event Report — WCA Regional Admin" },
      { property: "og:description", content: "Review attendance, participants, and feedback for a regional event." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoutePage,
});
