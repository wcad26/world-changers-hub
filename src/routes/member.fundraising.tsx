import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/Fundraising";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  return (<MemberProtectedRoute><MemberLayout><Page /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/fundraising")({ component: RoutePage });
