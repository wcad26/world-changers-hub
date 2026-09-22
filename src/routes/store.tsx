import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Store";

export const Route = createFileRoute("/store")({
  head: () => ({ meta: [
    { title: "Store & Library | World Changers Association" },
    { name: "description", content: "Discover World Changers Association books, teachings, courses, and resources." },
    { property: "og:title", content: "Store & Library | World Changers Association" },
    { property: "og:description", content: "Discover World Changers Association books, teachings, courses, and resources." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
