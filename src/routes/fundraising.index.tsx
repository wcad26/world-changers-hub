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
});
