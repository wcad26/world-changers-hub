import { createFileRoute, redirect } from "@tanstack/react-router";
const target = '/admin/regional/dashboard';
export const Route = createFileRoute("/admin/")({ beforeLoad: () => { const [pathname, query] = target.split("?");
    const search = query ? Object.fromEntries(new URLSearchParams(query)) : undefined;
    throw redirect({ to: pathname, search: search as never, replace: true }); } });
