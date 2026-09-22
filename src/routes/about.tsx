import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/About";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About Us | World Changers Association" },
    { name: "description", content: "Learn about World Changers Association, our mission, leadership, and global community." },
    { property: "og:title", content: "About Us | World Changers Association" },
    { property: "og:description", content: "Learn about World Changers Association, our mission, leadership, and global community." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
