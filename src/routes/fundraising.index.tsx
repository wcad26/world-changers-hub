import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Fundraising";
import { publicFundraisingCampaignsQueryOptions } from "@/lib/public-site.functions";

export const Route = createFileRoute("/fundraising/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicFundraisingCampaignsQueryOptions()),
  head: () => ({ meta: [
    { title: "Fundraising | World Changers Association" },
    { name: "description", content: "Support World Changers Association projects transforming people and communities." },
    { property: "og:title", content: "Fundraising | World Changers Association" },
    { property: "og:description", content: "Support World Changers Association projects transforming people and communities." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
  errorComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><div><h1 className="text-2xl font-semibold">Fundraising</h1><p className="mt-3 text-muted-foreground">Fundraising projects are temporarily unavailable. Please try again.</p><a href="/fundraising" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Try again</a></div></main>,
  notFoundComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><h1 className="text-2xl font-semibold">No fundraising projects found</h1></main>,
});
