import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy | World Changers Association" },
    { name: "description", content: "Read how World Changers Association protects and handles personal information." },
    { property: "og:title", content: "Privacy Policy | World Changers Association" },
    { property: "og:description", content: "Read how World Changers Association protects and handles personal information." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
