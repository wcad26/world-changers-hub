import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/AttendanceLogin";

export const Route = createFileRoute("/attendance/login")({ component: Page });
