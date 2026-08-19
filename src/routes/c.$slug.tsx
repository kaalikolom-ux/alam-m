import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/c/$slug")({
  component: CategoryPostsPage,
});

function getAutoExcerpt(content?: string | null, maxLength = 180) {
  if (!content) return "";
  const plainText = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
}

function CategoryPostsPage() {
  const { slug } = Route.useParams();
  const { t, lang } = usePrefs();

  // ক্যাটাগরি তথ্য আনা
  const categoryQuery = useQuery({
    queryKey: ["category-info", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`slug.eq.${slug},name_bn.eq.${slug},name_en.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // ক্যাটাগরি ভিত্তিক পোস্ট আনা
  const postsQuery = useQuery({
    queryKey: ["category-posts", slug, categoryQuery.data?.id],
    enabled: !!categoryQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_categories")
        .select("articles(*, article_categories(categories(id, name_bn, name_en)))")
        .eq("category_id", categoryQuery.data!.id);
      if (error) throw error;
      return (data || []).map((item) => item.articles).filter((a): a is any => !!a && a.published);
    },
  });

  const categoryName = categoryQuery.data
    ? lang === "en" && categoryQuery.data.name_en
      ? categoryQuery.data.name_en
      : categoryQuery.data.name_bn
    : decodeURIComponent(slug);

  const isMobile = useIsMobile();
  const pageSize = isMobile ? 6 : 9;
  const [page, setPage] = useState(0);
  const items = postsQuery.data ?? [];
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [pageSize, items.length]);

  const visible = items.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{categoryName}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {lang === "bn" ? `"${categoryName}" বিভাগের সকল লেখা` : `All posts under "${categoryName}"`}
      </p>

      {postsQuery.isLoading && <p className="mt-8 text-sm text-muted-foreground">{t("loading")}</p>}

      {!postsQuery.isLoading && items.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          {lang === "bn" ? "এই বিভাগে এখনও কোনো লেখা প্রকাশিত হয়নি।" : "No posts found in this category."}
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