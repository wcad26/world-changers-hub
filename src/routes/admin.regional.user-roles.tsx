import { createFileRoute, redirect } from "@tanstack/react-router";
const target = '/admin/regional/settings?tab=access';
export const Route = createFileRoute("/admin/regional/user-roles")({ beforeLoad: () => { const [pathname, query] = target.split("?");
    const search = query ? Object.fromEntries(new URLSearchParams(query)) : undefined;
    throw redirect({ to: pathname, search: search as never, replace: true }); } });
