import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Terms";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms of Service | World Changers Association" },
    { name: "description", content: "Read the terms governing use of World Changers Association services and websites." },
    { property: "og:title", content: "Terms of Service | World Changers Association" },
    { property: "og:description", content: "Read the terms governing use of World Changers Association services and websites." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
