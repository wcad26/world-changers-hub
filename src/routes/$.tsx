import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/NotFound";

export const Route = createFileRoute("/$")({ component: Page });
