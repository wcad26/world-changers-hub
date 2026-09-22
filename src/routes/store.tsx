import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Store";

export const Route = createFileRoute("/store")({ component: Page });
