import { createFileRoute } from "@tanstack/react-router";
import PublicDonate from "@/pages/PublicDonate";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Give | World Changers Association" },
      {
        name: "description",
        content:
          "Support World Changers Association regions worldwide with secure direct regional giving.",
      },
      { property: "og:title", content: "Give | World Changers Association" },
      {
        property: "og:description",
        content:
          "Support World Changers Association regions worldwide with secure direct regional giving.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PublicDonate,
});
