import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SelfAttendance";

export const Route = createFileRoute("/attend/$eventId")({ component: Page });
