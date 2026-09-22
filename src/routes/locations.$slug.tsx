import { createFileRoute, notFound } from "@tanstack/react-router";
import Page from "@/pages/RegionalBranchHome";
import { publicRegionPageQueryOptions, type PublicRegionPage } from "@/lib/public-site.functions";

type Slide = { url?: unknown };

function firstAbsoluteHero(region: PublicRegionPage["region"] | undefined): string | undefined {
  const slides = region?.hero_slide_images;
  if (!Array.isArray(slides)) return undefined;
  for (const slide of slides as Slide[]) {
    const url = slide && typeof slide === "object" ? slide.url : undefined;
    if (typeof url === "string" && url.startsWith("https://")) return url;
  }
  return undefined;
}

export const Route = createFileRoute("/locations/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(publicRegionPageQueryOptions(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const region = loaderData?.region;
    const title = region ? `${region.name} | World Changers Association` : "Regional Fellowship | World Changers Association";
    const description = (region?.description?.trim() || "Discover this World Changers Association regional fellowship — meeting places, DCG homes, upcoming events, and how to visit.").slice(0, 200);
    const image = firstAbsoluteHero(region);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  component: Page,
  errorComponent: () => (
    <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground">
      <div>
        <h1 className="text-2xl font-semibold">Regional page</h1>
        <p className="mt-3 text-muted-foreground">This regional page is temporarily unavailable. Please try again.</p>
        <a href="/locations" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Back to Locations</a>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground">
      <div>
        <h1 className="text-2xl font-semibold">Region not found</h1>
        <p className="mt-3 text-muted-foreground">The regional branch you're looking for doesn't exist or has been moved.</p>
        <a href="/locations" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Back to Locations</a>
      </div>
    </main>
  ),
});
