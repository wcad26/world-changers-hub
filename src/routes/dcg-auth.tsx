import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/DcgAuth";

export const Route = createFileRoute("/dcg-auth")({ component: Page });
