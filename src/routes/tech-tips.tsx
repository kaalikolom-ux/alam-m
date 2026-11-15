import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tech-tips")({
  beforeLoad: () => {
    throw redirect({
      to: "/c/$slug",
      params: { slug: "tech-tips" },
    });
  },
  component: () => null,
});
