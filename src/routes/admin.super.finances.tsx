import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/super/finances")({
  component: Outlet,
});