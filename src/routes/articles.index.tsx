import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { useIsMobile } from "@/hooks/use-mobile";


export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "আর্টিকেল — কুরআন অন্বেষা" },
      {
        name: "description",
        content: "কুরআন, বিজ্ঞান ও চিন্তাভাবনা নিয়ে নিয়মিত বাংলা ও ইংরেজি আর্টিকেল।",
      },
      { property: "og:title", content: "আর্টিকেল — কুরআন অন্বেষা" },
      {
        property: "og:description",
        content: "কুরআন ও বিজ্ঞান নিয়ে বাংলা ও ইংরেজি লেখা।",
      },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const { t, lang } = usePrefs();
  const articles = useQuery({
    queryKey: ["articles", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, slug, title_bn, title_en, excerpt_bn, excerpt_en, published_at, cover_image_url, article_categories(categories(id, name_bn, name_en))",
        )
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const isMobile = useIsMobile();
  const pageSize = isMobile ? 6 : 9;
  const [page, setPage] = useState(0);
  const items = articles.data ?? [];
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [pageSize, items.length]);

  const visible = items.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("articles")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("newsletterSub")}</p>

      {articles.isLoading && <p className="mt-8 text-sm text-muted-foreground">{t("loading")}</p>}

      {articles.data && articles.data.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">{t("noArticles")}</p>
      )}

      <div className="mt-8 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <Link
            key={a.id}

            to="/articles/$slug"
            params={{ slug: a.slug }}
            className="card-soft group flex h-full flex-col overflow-hidden border border-border/70 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-lift)]"
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-accent/50">
              {a.cover_image_url ? (
                <img
                  src={a.cover_image_url}
                  alt={lang === "en" && a.title_en ? a.title_en : a.title_bn}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center font-display text-3xl text-primary/40">
                  ﷽
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-5">
              {a.article_categories.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {a.article_categories.map(
                    (ac) =>
                      ac.categories && (
                        <span
                          key={ac.categories.id}
                          className="rounded-full border border-primary/40 px-2 py-0.5 text-[11px] text-primary"
                        >
                          {lang === "en" && ac.categories.name_en
                            ? ac.categories.name_en
                            : ac.categories.name_bn}
                        </span>
                      ),
                  )}
                </div>
              )}
              <h2 className="text-lg font-semibold transition-colors group-hover:text-primary">
                {lang === "en" && a.title_en ? a.title_en : a.title_bn}
              </h2>
              {a.published_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.published_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")}
                </p>
              )}
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {lang === "en" && a.excerpt_en ? a.excerpt_en : a.excerpt_bn}
              </p>
              <span className="mt-auto pt-4 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                {t("readMore")} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {lang === "bn" ? "পূর্ববর্তী" : "Previous"}
          </button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
          >
            {lang === "bn" ? "পরবর্তী" : "Next"}
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}


