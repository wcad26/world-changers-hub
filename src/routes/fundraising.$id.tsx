import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fundraising/$id")({
  component: Outlet,
});