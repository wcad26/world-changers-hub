import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/About";
import { aboutContentQueryOptions } from "@/lib/public-site.functions";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(aboutContentQueryOptions()),
  head: () => ({ meta: [
    { title: "About Us | World Changers Association" },
    { name: "description", content: "Learn about World Changers Association, our mission, leadership, and global community." },
    { property: "og:title", content: "About Us | World Changers Association" },
    { property: "og:description", content: "Learn about World Changers Association, our mission, leadership, and global community." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
  errorComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><div><h1 className="text-2xl font-semibold">About WCA</h1><p className="mt-3 text-muted-foreground">This page is temporarily unavailable. Please try again.</p><a href="/about" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Try again</a></div></main>,
  notFoundComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><h1 className="text-2xl font-semibold">About WCA</h1></main>,
});
