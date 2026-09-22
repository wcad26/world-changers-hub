import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Media";

export const Route = createFileRoute("/media")({ component: Page });
