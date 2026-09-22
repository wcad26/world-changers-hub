import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Blog";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [
    { title: "News & Blog | World Changers Association" },
    { name: "description", content: "Read news, testimonies, and insights from the World Changers Association community." },
    { property: "og:title", content: "News & Blog | World Changers Association" },
    { property: "og:description", content: "Read news, testimonies, and insights from the World Changers Association community." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
