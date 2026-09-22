import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Events";
import { publicEventsQueryOptions } from "@/lib/public-site.functions";

export const Route = createFileRoute("/events/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicEventsQueryOptions()),
  head: () => ({ meta: [
    { title: "Events | World Changers Association" },
    { name: "description", content: "Discover upcoming WCA gatherings, conferences, training, worship, outreach, and community events." },
    { property: "og:title", content: "Events | World Changers Association" },
    { property: "og:description", content: "Discover upcoming WCA gatherings, conferences, training, worship, outreach, and community events." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
