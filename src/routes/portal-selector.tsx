import { createFileRoute } from "@tanstack/react-router";
import Page from "@/components/auth/PortalSelector";

export const Route = createFileRoute("/portal-selector")({ component: Page });
