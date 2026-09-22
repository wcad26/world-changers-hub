import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MemberAuth";

export const Route = createFileRoute("/auth/member")({ component: Page });
