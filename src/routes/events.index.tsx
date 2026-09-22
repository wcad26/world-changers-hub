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
  errorComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><div><h1 className="text-2xl font-semibold">Events</h1><p className="mt-3 text-muted-foreground">Events are temporarily unavailable. Please try again.</p><a href="/events" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Try again</a></div></main>,
  notFoundComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><h1 className="text-2xl font-semibold">No events found</h1></main>,
});
