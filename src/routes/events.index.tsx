import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Events";

export const Route = createFileRoute("/events/")({ component: Page });
