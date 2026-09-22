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
});
