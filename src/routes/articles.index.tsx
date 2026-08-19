import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/articles/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "লেখালেখি — Alam M" },
      {
        name: "description",
        content: "গল্প, কবিতা, স্মৃতিকথা ও ভাবনা নিয়ে নিয়মিত লেখালেখি।",
      },
      { property: "og:title", content: "লেখালেখি — Alam M" },
      {
        property: "og:description",
        content: "গল্প, কবিতা, স্মৃতিকথা ও ভাবনা নিয়ে নিয়মিত লেখালেখি।",
      },
    ],
  }),
  component: ArticlesPage,
});

function getAutoExcerpt(content?: string | null, maxLength = 180) {
  if (!content) return "";
  const plainText = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
}

const CATEGORY_MAP: Record<string, { bn: string; en: string }> = {
  golpo: { bn: "গল্প", en: "Stories" },
  story: { bn: "গল্প", en: "Stories" },
  stories: { bn: "গল্প", en: "Stories" },
  "গল্প": { bn: "গল্প", en: "Stories" },

  kobita: { bn: "কবিতা", en: "Poems" },
  poem: { bn: "কবিতা", en: "Poems" },
  poems: { bn: "কবিতা", en: "Poems" },
  poetry: { bn: "কবিতা", en: "Poems" },
  "কবিতা": { bn: "কবিতা", en: "Poems" },

  smritikotha: { bn: "স্মৃতিকথা", en: "Memories" },
  memory: { bn: "স্মৃতিকথা", en: "Memories" },
  memories: { bn: "স্মৃতিকথা", en: "Memories" },
  "স্মৃতিকথা": { bn: "স্মৃতিকথা", en: "Memories" },
};

function formatDisplayTitle(raw: string, lang: string): string {
  if (!raw) return lang === "bn" ? "সকল লেখা" : "All Posts";
  
  const clean = raw.replace(/^.*\?q=/, "").replace(/^\//, "").trim();
  const lower = clean.toLowerCase();

  if (CATEGORY_MAP[lower]) {
    return lang === "en" ? CATEGORY_MAP[lower].en : CATEGORY_MAP[lower].bn;
  }
  if (CATEGORY_MAP[clean]) {
    return lang === "en" ? CATEGORY_MAP[clean].en : CATEGORY_MAP[clean].bn;
  }

  return clean;
}

function ArticlesPage() {
  const { t, lang } = usePrefs();
  const search = useSearch({ from: "/articles/" });
  
  const rawQuery = search.q?.trim() || "";
  const cleanFilter = rawQuery.replace(/^.*\?q=/, "").replace(/^\//, "").trim();

  const articles = useQuery({
    queryKey: ["articles", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, published_at, cover_image_url, article_categories(categories(id, name_bn, name_en, slug))",
        )
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allArticles = articles.data ?? [];
  const filteredArticles = cleanFilter
    ? allArticles.filter((a) => {
        const matchesCategory = (a.article_categories ?? []).some((ac: any) => {
          const catBn = ac.categories?.name_bn || "";
          const catEn = ac.categories?.name_en || "";
          const catSlug = ac.categories?.slug || "";
          
          return (
            catBn.includes(cleanFilter) ||
            catEn.toLowerCase().includes(cleanFilter.toLowerCase()) ||
            catSlug.toLowerCase().includes(cleanFilter.toLowerCase()) ||
            (CATEGORY_MAP[cleanFilter.toLowerCase()] && (
              catBn.includes(CATEGORY_MAP[cleanFilter.toLowerCase()].bn) ||
              catEn.toLowerCase().includes(CATEGORY_MAP[cleanFilter.toLowerCase()].en.toLowerCase())
            ))
          );
        });

        const matchesTitle =
          a.title_bn?.includes(cleanFilter) ||
          a.title_en?.toLowerCase().includes(cleanFilter.toLowerCase());

        return matchesCategory || matchesTitle;
      })
    : allArticles;

  const isMobile = useIsMobile();
  const pageSize = isMobile ? 6 : 9;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(filteredArticles.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [pageSize, filteredArticles.length, cleanFilter]);

  const visible = filteredArticles.slice(page * pageSize, page * pageSize + pageSize);
  const pageTitle = formatDisplayTitle(cleanFilter, lang);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{pageTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {cleanFilter
          ? lang === "bn"
            ? `"${pageTitle}" বিভাগের প্রকাশনা সমূহ`
            : `Posts under "${pageTitle}"`
          : t("newsletterSub")}
      </p>

      {articles.isLoading && <p className="mt-8 text-sm text-muted-foreground">{t("loading")}</p>}

      {!articles.isLoading && filteredArticles.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          {lang === "bn" ? "এই বিভাগে এখনও কোনো লেখা প্রকাশিত হয়নি।" : "No posts found in this section."}
        </p>
      )}

      <div className="mt-8 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a: any) => {
          const title = lang === "en" && a.title_en ? a.title_en : a.title_bn;
          const rawExcerpt = lang === "en" && a.excerpt_en ? a.excerpt_en : a.excerpt_bn;
          const rawContent = lang === "en" && a.content_en ? a.content_en : a.content_bn;
          const excerpt = rawExcerpt || getAutoExcerpt(rawContent);

          return (
            <Link
              key={a.id}
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="card-soft group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="aspect-[16/10] w-full shrink-0 overflow-hidden bg-accent/40 relative">
                {a.cover_image_url ? (
                  <img
                    src={a.cover_image_url}
                    alt={title}
                    loading="lazy"
                    width={1600}
                    height={1000}
                    className="block size-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center p-6 text-center bg-gradient-to-br from-primary/5 via-accent/20 to-primary/10 transition-colors group-hover:from-primary/10 group-hover:to-primary/20">
                    <h3 className="line-clamp-3 text-lg font-semibold tracking-tight text-foreground/90 transition-colors group-hover:text-primary">
                      {title}
                    </h3>
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col p-5">
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  {a.article_categories?.map(
                    (ac: any) =>
                      ac.categories && (
                        <span
                          key={ac.categories.id}
                          className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                        >
                          {lang === "en" && ac.categories.name_en
                            ? ac.categories.name_en
                            : ac.categories.name_bn}
                        </span>
                      ),
                  )}
                  {a.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.published_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")}
                    </span>
                  )}
                </div>

                <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                  {excerpt}
                </p>

                <span className="mt-auto pt-4 text-xs font-semibold uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t("readMore")} →
                </span>
              </div>
            </Link>
          );
        })}
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