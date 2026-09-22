import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Media";

export const Route = createFileRoute("/media")({
  head: () => ({ meta: [
    { title: "Media & Sermons | World Changers Association" },
    { name: "description", content: "Explore sermons, teachings, and event recordings from World Changers Association." },
    { property: "og:title", content: "Media & Sermons | World Changers Association" },
    { property: "og:description", content: "Explore sermons, teachings, and event recordings from World Changers Association." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
