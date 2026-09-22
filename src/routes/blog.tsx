import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Blog";

export const Route = createFileRoute("/blog")({ component: Page });
