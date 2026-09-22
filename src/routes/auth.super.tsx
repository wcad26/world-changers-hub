import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SuperAuth";

export const Route = createFileRoute("/auth/super")({ component: Page });
