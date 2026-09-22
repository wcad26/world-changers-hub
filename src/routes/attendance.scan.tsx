import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AttendanceScan";

export const Route = createFileRoute("/attendance/scan")({ component: Page });
