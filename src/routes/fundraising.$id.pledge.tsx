import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FundraisingPledge";

export const Route = createFileRoute("/fundraising/$id/pledge")({ component: Page });
