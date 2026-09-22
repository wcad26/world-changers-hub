import { createFileRoute, redirect } from "@tanstack/react-router";
const target = '/admin/super/settings?tab=currency';
export const Route = createFileRoute("/admin/super/currencies")({ beforeLoad: () => { const [pathname, query] = target.split("?");
    const search = query ? Object.fromEntries(new URLSearchParams(query)) : undefined;
    throw redirect({ to: pathname, search: search as never, replace: true }); } });
