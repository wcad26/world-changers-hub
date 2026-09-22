import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/Events";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  return (<MemberProtectedRoute><MemberLayout><Page /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/events")({ component: RoutePage });
