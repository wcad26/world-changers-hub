import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Locations";
import { publicLocationsQueryOptions } from "@/lib/public-site.functions";

export const Route = createFileRoute("/locations/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicLocationsQueryOptions()),
  head: () => ({ meta: [
    { title: "Locations | World Changers Association" },
    { name: "description", content: "Find a World Changers Association regional fellowship or community near you." },
    { property: "og:title", content: "Locations | World Changers Association" },
    { property: "og:description", content: "Find a World Changers Association regional fellowship or community near you." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
  errorComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><div><h1 className="text-2xl font-semibold">Locations</h1><p className="mt-3 text-muted-foreground">Locations are temporarily unavailable. Please try again.</p><a href="/locations" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Try again</a></div></main>,
});
