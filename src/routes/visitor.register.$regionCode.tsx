import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/VisitorRegister";

export const Route = createFileRoute("/visitor/register/$regionCode")({ component: Page });
