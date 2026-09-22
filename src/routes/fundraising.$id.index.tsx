import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FundraisingDetails";
import { publicCampaignDonationsQueryOptions, publicFundraisingCampaignQueryOptions } from "@/lib/public-site.functions";

export const Route = createFileRoute("/fundraising/$id/")({
  loader: ({ context, params }) => Promise.all([
    context.queryClient.ensureQueryData(publicFundraisingCampaignQueryOptions(params.id)),
    context.queryClient.ensureQueryData(publicCampaignDonationsQueryOptions(params.id, 10)),
  ]),
  head: () => ({ meta: [
    { title: "Fundraising Project | World Changers Association" },
    { name: "description", content: "Learn about and support a World Changers Association fundraising project." },
    { property: "og:title", content: "Fundraising Project | World Changers Association" },
    { property: "og:description", content: "Learn about and support a World Changers Association fundraising project." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
  errorComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><div><h1 className="text-2xl font-semibold">Fundraising project</h1><p className="mt-3 text-muted-foreground">This project is temporarily unavailable. Please try again.</p><a href="/fundraising" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">View all projects</a></div></main>,
  notFoundComponent: () => <main className="grid min-h-[70vh] place-items-center bg-background p-6 text-center text-foreground"><h1 className="text-2xl font-semibold">Project not found</h1></main>,
});
