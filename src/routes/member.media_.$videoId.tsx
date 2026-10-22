import { createFileRoute, notFound } from "@tanstack/react-router";
import Page from "@/pages/member/MediaVideo";
import MemberProtectedRoute from "@/components/auth/MemberProtectedRoute";
import MemberLayout from "@/components/layout/MemberLayout";
import { isValidVideoId } from "@/lib/media.functions";

function RoutePage() {
  const { videoId } = Route.useParams();
  return (<MemberProtectedRoute><MemberLayout><Page videoId={videoId} /></MemberLayout></MemberProtectedRoute>);
}

export const Route = createFileRoute("/member/media_/$videoId")({
  beforeLoad: ({ params }) => { if (!isValidVideoId(params.videoId)) throw notFound(); },
  head: () => ({ meta: [
    { title: "Watch | WCA Member Media" },
    { name: "description", content: "Watch World Changers Association sermons and teachings in the member portal." },
    { property: "og:title", content: "Watch | WCA Member Media" },
    { property: "og:description", content: "Watch World Changers Association sermons and teachings in the member portal." },
    { property: "og:type", content: "video.other" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RoutePage,
});
