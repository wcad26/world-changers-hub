import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dcg/Dashboard";
import DcgSessionRoute from "@/components/auth/DcgSessionRoute";

function RoutePage() {
  return (<DcgSessionRoute><Page /></DcgSessionRoute>);
}

export const Route = createFileRoute("/dcg/dashboard")({ component: RoutePage });
