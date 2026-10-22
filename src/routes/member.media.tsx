import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/Media";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  return (<MemberProtectedRoute><MemberLayout><Page /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/media")({
  head: () => ({ meta: [
    { title: 'Media Library | WCA Member Portal' },
    { name: 'description', content: 'Browse WCA videos, filter messages and return to your saved videos.' },
    { property: 'og:title', content: 'Media Library | WCA Member Portal' },
    { property: 'og:description', content: 'Browse WCA videos, filter messages and return to your saved videos.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: RoutePage,
});
