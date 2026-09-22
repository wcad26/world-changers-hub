import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/regional/members")({
  component: Outlet,
});