import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Locations";

export const Route = createFileRoute("/locations/")({
  head: () => ({ meta: [
    { title: "Locations | World Changers Association" },
    { name: "description", content: "Find a World Changers Association regional fellowship or community near you." },
    { property: "og:title", content: "Locations | World Changers Association" },
    { property: "og:description", content: "Find a World Changers Association regional fellowship or community near you." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
