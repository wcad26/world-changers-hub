import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/RegionalAuth";

export const Route = createFileRoute("/auth/regional")({ component: Page });
