import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/regional/events")({
  component: Outlet,
});