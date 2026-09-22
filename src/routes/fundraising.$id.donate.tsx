import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FundraisingDonate";

export const Route = createFileRoute("/fundraising/$id/donate")({ component: Page });
