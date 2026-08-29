import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "পাতা খুঁজে পাওয়া যায়নি — Alam M" },
      { name: "description", content: "আপনি যে পাতাটি খুঁজছেন সেটি পাওয়া যায়নি।" },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "পাতা খুঁজে পাওয়া যায়নি — Alam M" },
      { property: "og:description", content: "আপনি যে পাতাটি খুঁজছেন সেটি পাওয়া যায়নি।" },
    ],
  }),
  component: CatchAllResolver,
});

function CatchAllResolver() {
  const { _splat } = Route.useParams();
  const raw = (_splat ?? "").split("/")[0] ?? "";
  const slug = decodeURIComponent(raw);

  const resolved = useQuery({
    queryKey: ["resolve-slug", slug],
    enabled: slug.length > 0,
    queryFn: async () => {
      const [cat, page] = await Promise.all([
        supabase
          .from("categories")
          .select("slug")
          .or(`slug.eq.${slug},name_bn.eq.${slug},name_en.eq.${slug}`)
          .maybeSingle(),
        supabase.from("pages").select("slug").eq("slug", slug).maybeSingle(),
      ]);
      if (cat.data?.slug) return { type: "category" as const, slug: cat.data.slug };
      if (page.data?.slug) return { type: "page" as const, slug: page.data.slug };
      return null;
    },
  });

  if (slug && (resolved.isLoading || resolved.isFetching)) {
    return <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm text-muted-foreground">লোড হচ্ছে…</div>;
  }

  if (resolved.data?.type === "category") {
    return <Navigate to="/c/$slug" params={{ slug: resolved.data.slug }} replace />;
  }
  if (resolved.data?.type === "page") {
    return <Navigate to="/p/$slug" params={{ slug: resolved.data.slug }} replace />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-lg font-semibold">পাতাটি খুঁজে পাওয়া যায়নি</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Page not found — the page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        হোমে ফিরুন
      </Link>
    </div>
  );
}
