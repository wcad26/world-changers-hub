import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/About";

export const Route = createFileRoute("/about")({ component: Page });
