import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Unauthorized";

export const Route = createFileRoute("/unauthorized")({ component: Page });
