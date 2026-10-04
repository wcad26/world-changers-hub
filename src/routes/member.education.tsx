import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/Education";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  return (<MemberProtectedRoute><MemberLayout><Page /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/education")({
  head: () => ({ meta: [{ title: "Education — WCA Member Portal" }, { name: "description", content: "Enroll and study courses with WCA School." }] }),
  component: RoutePage,
});
