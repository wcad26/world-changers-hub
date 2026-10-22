import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/FundraisingCampaign";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  const { campaignId } = Route.useParams();
  return (<MemberProtectedRoute><MemberLayout><Page campaignId={campaignId} /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/fundraising_/$campaignId")({
  head: () => ({ meta: [
    { title: "My Campaign | WCA Member Fundraising" },
    { name: "description", content: "Track your pledge and giving history for a World Changers Association campaign." },
    { property: "og:title", content: "My Campaign | WCA Member Fundraising" },
    { property: "og:description", content: "Track your pledge and giving history for a World Changers Association campaign." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RoutePage,
});
