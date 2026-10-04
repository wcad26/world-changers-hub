import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/Translation";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  return (<MemberProtectedRoute><MemberLayout><Page /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/translation")({
  head: () => ({ meta: [{ title: "Live Translation — WCA Member Portal" }, { name: "description", content: "Real-time meeting translation in your language." }] }),
  component: RoutePage,
});
