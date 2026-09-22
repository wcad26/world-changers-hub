import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dcg/MemberProfile";
import DcgSessionRoute from "@/components/auth/DcgSessionRoute";

function RoutePage() {
  return (<DcgSessionRoute><Page /></DcgSessionRoute>);
}

export const Route = createFileRoute("/dcg/member/$memberId")({ component: RoutePage });
