import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/auth/ForgotPasswordPage";

export const Route = createFileRoute("/auth/forgot-password")({ component: Page });
