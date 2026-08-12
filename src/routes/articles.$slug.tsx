import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";


import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AuthorCard } from "@/components/AuthorCard";

export const Route = createFileRoute("/articles/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — কুরআন অন্বেষা` },
      { name: "description", content: "কুরআন ও বিজ্ঞান নিয়ে আর্টিকেল — কুরআন অন্বেষা।" },
      { property: "og:title", content: `${params.slug} — কুরআন অন্বেষা` },
      { property: "og:description", content: "কুরআন ও বিজ্ঞান নিয়ে আর্টিকেল।" },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { t, lang } = usePrefs();

  const article = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const siblings = useQuery({
    queryKey: ["articles", "nav-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("slug, title_bn, title_en, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  if (article.isLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!article.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-muted-foreground">{t("noArticles")}</p>
        <Link to="/articles" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="size-4" /> {t("backToArticles")}
        </Link>
      </div>
    );
  }

  const a = article.data;
  const title = lang === "en" && a.title_en ? a.title_en : a.title_bn;
  const content = lang === "en" && a.content_en ? a.content_en : a.content_bn;

  const list = siblings.data ?? [];
  const idx = list.findIndex((s) => s.slug === slug);
  const newer = idx > 0 ? list[idx - 1] : null;
  const older = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const label = (s: { title_bn: string; title_en: string | null }) =>
    lang === "en" && s.title_en ? s.title_en : s.title_bn;



  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link to="/articles" className="inline-flex items-center gap-1 text-sm text-primary">
        <ArrowLeft className="size-4" /> {t("backToArticles")}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold leading-snug">{title}</h1>
      <div className="mt-3 flex items-center justify-between gap-3">
        {a.published_at && (
          <p className="text-xs text-muted-foreground">
            {new Date(a.published_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")}
          </p>
        )}
        <BookmarkButton
          variant="outline"
          target={{ kind: "article", articleId: a.id, label: a.title_bn }}
        />
      </div>

      {a.cover_image_url && (
        <img
          src={a.cover_image_url}
          alt={title}
          className="mt-6 w-full rounded-xl object-cover"
          loading="lazy"
        />
      )}

      <div className="prose-reader mt-8 space-y-4 text-base leading-relaxed">
        {(content ?? "").split(/\n{2,}/).map((para, i) => (
          <p key={i} className="whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>

      {a.author_id && <AuthorCard authorId={a.author_id} />}
    </article>

  );
}
