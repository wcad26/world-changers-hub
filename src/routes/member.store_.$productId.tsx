import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/member/StoreProduct";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";

function RoutePage() {
  const { productId } = Route.useParams();
  return (<MemberProtectedRoute><MemberLayout><Page productId={productId} /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/store_/$productId")({
  head: () => ({
    meta: [
      { title: "Product details · WCA Store" },
      { name: "description", content: "Product details, price and checkout in the WCA member store." },
      { property: "og:title", content: "Product details · WCA Store" },
      { property: "og:description", content: "Product details, price and checkout in the WCA member store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoutePage,
});
