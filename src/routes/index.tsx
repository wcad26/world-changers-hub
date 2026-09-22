import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Index";
import { featuredEventsQueryOptions, homepageContentQueryOptions } from "@/lib/public-site.functions";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.allSettled([
      context.queryClient.ensureQueryData(homepageContentQueryOptions()),
      context.queryClient.ensureQueryData(featuredEventsQueryOptions()),
    ]);
  },
  head: () => ({ meta: [
    { title: "World Changers Association | Transforming Lives and Communities" },
    { name: "description", content: "Join World Changers Association in building spiritually, intellectually, and economically empowered communities." },
    { property: "og:title", content: "World Changers Association | Transforming Lives and Communities" },
    { property: "og:description", content: "Join World Changers Association in building spiritually, intellectually, and economically empowered communities." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
