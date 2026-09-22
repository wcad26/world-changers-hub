import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dcg/Members";
import DcgSessionRoute from "@/components/auth/DcgSessionRoute";

function RoutePage() {
  return (<DcgSessionRoute><Page /></DcgSessionRoute>);
}

export const Route = createFileRoute("/dcg/members")({ component: RoutePage });
