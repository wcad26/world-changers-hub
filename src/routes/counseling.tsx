import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Counseling";

export const Route = createFileRoute("/counseling")({
  head: () => ({ meta: [
    { title: "Counseling | World Changers Association" },
    { name: "description", content: "Connect with World Changers Association for compassionate pastoral and family counseling." },
    { property: "og:title", content: "Counseling | World Changers Association" },
    { property: "og:description", content: "Connect with World Changers Association for compassionate pastoral and family counseling." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});
