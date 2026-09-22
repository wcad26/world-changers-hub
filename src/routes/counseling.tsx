import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Counseling";

export const Route = createFileRoute("/counseling")({ component: Page });
