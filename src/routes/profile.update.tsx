import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/UpdateProfile";

export const Route = createFileRoute("/profile/update")({ component: Page });
