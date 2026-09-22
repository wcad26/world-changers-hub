import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SpecialEventRegister";

export const Route = createFileRoute("/events/$slug/register")({ component: Page });
