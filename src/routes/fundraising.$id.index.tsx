import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FundraisingDetails";

export const Route = createFileRoute("/fundraising/$id/")({ component: Page });
