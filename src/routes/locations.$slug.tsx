import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/RegionalBranchHome";

export const Route = createFileRoute("/locations/$slug")({ component: Page });
