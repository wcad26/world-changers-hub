import { useEffect, type ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import "@/styles.css";

type RouterContext = { queryClient: QueryClient };

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    const onError = (event: ErrorEvent) => console.error("[GlobalError]", event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => console.error("[UnhandledRejection]", event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <RootDocument>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider><Outlet /></AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </RootDocument>
  );
}

function RootError({ error }: { error: unknown }) {
  useEffect(() => reportLovableError(error), [error]);
  return (
    <RootDocument>
      <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">This page didn't load</h1>
          <p className="mt-3 text-muted-foreground">Something went wrong. Please refresh or return home.</p>
          <a className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/">Go home</a>
        </div>
      </main>
    </RootDocument>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "World Changers Association" },
      { name: "description", content: "Building spiritually, intellectually and economically empowered communities that transform lives." },
      { property: "og:title", content: "World Changers Association" },
      { property: "og:description", content: "Building spiritually, intellectually and economically empowered communities that transform lives." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap" },
    ],
    scripts: [{ src: "https://cdn.gpteng.co/gptengineer.js", type: "module" }],
  }),
  component: RootComponent,
  errorComponent: RootError,
});