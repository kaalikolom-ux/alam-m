import { createFileRoute } from "@tanstack/react-router";

import { PageBody } from "@/components/PageBody";

export const Route = createFileRoute("/p/$slug")({
  head: () => ({
    meta: [
      { title: "পেইজ — Alam M" },
      { name: "description", content: "Alam M সাইটের একটি পেইজ।" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "পেইজ — Alam M" },
      { property: "og:description", content: "Alam M সাইটের একটি পেইজ।" },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const { slug } = Route.useParams();
  return <PageBody slug={slug} fallbackTitle={slug} showNotFound={true} />;
}
