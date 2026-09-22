import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fundraising")({
  component: Outlet,
});