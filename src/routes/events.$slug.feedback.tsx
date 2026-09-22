import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/EventFeedback";

export const Route = createFileRoute("/events/$slug/feedback")({ component: Page });
