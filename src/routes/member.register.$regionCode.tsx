import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MemberRegister";

export const Route = createFileRoute("/member/register/$regionCode")({ component: Page });
