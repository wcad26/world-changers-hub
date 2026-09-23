import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/regional/SpecialEventReport";
import { RegionalSessionProvider } from "@/contexts/RegionalSessionContext";
import RegionalSessionRoute from "@/components/auth/RegionalSessionRoute";
import EnhancedRegionalAdminLayout from "@/components/admin/EnhancedRegionalAdminLayout";

function RoutePage() {
  return (
    <RegionalSessionProvider>
      <RegionalSessionRoute>
        <EnhancedRegionalAdminLayout><Page /></EnhancedRegionalAdminLayout>
      </RegionalSessionRoute>
    </RegionalSessionProvider>
  );
}

export const Route = createFileRoute("/admin/regional/events/$eventId/special-report")({
  head: () => ({
    meta: [
      { title: "Special Event Report — WCA Regional Admin" },
      { name: "description", content: "Review regional special-event registrations, lodging, health needs, and attendance." },
      { property: "og:title", content: "Special Event Report — WCA Regional Admin" },
      { property: "og:description", content: "Review regional special-event registrations, lodging, health needs, and attendance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoutePage,
});