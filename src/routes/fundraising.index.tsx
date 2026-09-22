import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Fundraising";

export const Route = createFileRoute("/fundraising/")({ component: Page });
