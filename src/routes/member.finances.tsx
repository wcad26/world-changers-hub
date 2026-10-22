import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/Finances";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  return (<MemberProtectedRoute><MemberLayout><Page /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/finances")({
  head: () => ({ meta: [
    { title: "My Giving | WCA Member Portal" },
    { name: "description", content: "View your WCA giving history and give securely to your chosen region." },
    { property: "og:title", content: "My Giving | WCA Member Portal" },
    { property: "og:description", content: "View your WCA giving history and give securely to your chosen region." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RoutePage,
});
