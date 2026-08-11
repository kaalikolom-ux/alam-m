import { createFileRoute } from "@tanstack/react-router";

import { PageBody } from "@/components/PageBody";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমার পাতা — Alam M" },
      {
        name: "description",
        content: "আলম — শব্দের একজন লেখক, দৈনন্দিন মুহূর্তের গল্পের অনুসন্ধানী। লেখক পরিচিতি ও ভাবনা।",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "আমার পাতা — Alam M" },
      { property: "og:description", content: "লেখক আলমের পরিচিতি ও লেখালেখির গল্প।" },
    ],
  }),
  component: () => <PageBody slug="about" fallbackTitle="আমার পাতা" />,
});
