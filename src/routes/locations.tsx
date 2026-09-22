import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Locations";

export const Route = createFileRoute("/locations")({ component: Page });
