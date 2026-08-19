import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Folder,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AuthorCard } from "@/components/AuthorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/articles/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Alam M` },
      { name: "description", content: "গল্প, কবিতা, স্মৃতিকথা ও চিন্তাভাবনা — Alam M।" },
      { property: "og:title", content: `${params.slug} — Alam M` },
      { property: "og:description", content: "গল্প, কবিতা, স্মৃতিকথা ও চিন্তাভাবনা।" },
    ],
  }),
  component: ArticlePage,
});

interface CommentItem {
  id: string;
  name: string;
  comment: string;
  created_at: string;
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { t, lang } = usePrefs();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");

  const article = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, authors(id, name_bn, name_en), article_categories(categories(id, name_bn, name_en, slug))")
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

  const categoriesList = (a.article_categories ?? [])
    .map((ac: any) => ac.categories)
    .filter(Boolean);
  const authorName = a.authors ? (lang === "en" && a.authors.name_en ? a.authors.name_en : a.authors.name_bn) : null;

  const formattedDate = a.published_at
    ? new Date(a.published_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")
    : null;
  const dateSearchParam = a.published_at ? a.published_at.slice(0, 10) : "";

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) {
      toast.error(lang === "bn" ? "নাম এবং মন্তব্য উভয়ই পূরণ করুন" : "Please enter both name and comment");
      return;
    }
    const newEntry: CommentItem = {
      id: Date.now().toString(),
      name: commentName.trim(),
      comment: commentText.trim(),
      created_at: new Date().toISOString(),
    };
    setComments([newEntry, ...comments]);
    setCommentName("");
    setCommentText("");
    toast.success(lang === "bn" ? "মন্তব্য যোগ করা হয়েছে!" : "Comment added successfully!");
  };

  const isHtml = /<[a-z][\s\S]*>/i.test(content || "");

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link to="/articles" className="inline-flex items-center gap-1 text-sm text-primary">
        <ArrowLeft className="size-4" /> {t("backToArticles")}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold leading-snug">{title}</h1>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-border/40 pb-4">
        {formattedDate && (
          <p className="text-xs text-muted-foreground">
            {formattedDate}
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
          className="mt-6 w-full rounded-xl object-cover shadow-sm"
          loading="lazy"
        />
      )}

      <div className="prose-reader mt-8 text-base leading-relaxed text-foreground">
        {isHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: content || "" }}
            className="space-y-4 [&_*]:!bg-transparent [&_*]:!text-inherit [&_blockquote]:!border-l-4 [&_blockquote]:!border-primary [&_blockquote]:!pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
          />
        ) : (
          <div className="space-y-4">
            {(content ?? "").split(/\n{2,}/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border/40 pt-6">
        {authorName && (
          <Link
            to="/articles"
            search={{ q: authorName } as any}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
          >
            <User className="size-3.5 text-primary" />
            <span>{authorName}</span>
          </Link>
        )}

        {categoriesList.map((cat: any) => {
          const catName = lang === "en" && cat.name_en ? cat.name_en : cat.name_bn;
          return (
            <Link
              key={cat.id}
              to="/articles"
              search={{ q: catName } as any}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
            >
              <Folder className="size-3.5 text-primary" />
              <span>{catName}</span>
            </Link>
          );
        })}

        {formattedDate && (
          <Link
            to="/articles"
            search={{ q: dateSearchParam } as any}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
          >
            <Calendar className="size-3.5 text-primary" />
            <span>{formattedDate}</span>
          </Link>
        )}
      </div>

      {(newer || older) && (
        <nav className="mt-10 grid gap-4 sm:grid-cols-2">
          {newer ? (
            <Link
              to="/articles/$slug"
              params={{ slug: newer.slug }}
              className="card-soft group relative flex flex-col justify-between rounded-xl border border-input bg-background/50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="flex items-center gap-2 text-primary">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:-translate-x-1">
                  <ArrowLeft className="size-4 text-primary" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {lang === "bn" ? "পূর্ববর্তী পোস্ট" : "Previous Post"}
                </span>
              </div>
              <span className="mt-3 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {label(newer)}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {older && (
            <Link
              to="/articles/$slug"
              params={{ slug: older.slug }}
              className="card-soft group relative flex flex-col items-end justify-between rounded-xl border border-input bg-background/50 p-5 text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="flex items-center gap-2 text-primary">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {lang === "bn" ? "পরবর্তী পোস্ট" : "Next Post"}
                </span>
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:translate-x-1">
                  <ArrowRight className="size-4 text-primary" />
                </div>
              </div>
              <span className="mt-3 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {label(older)}
              </span>
            </Link>
          )}
        </nav>
      )}

      {a.author_id && (
        <div className="mt-10">
          <AuthorCard authorId={a.author_id} />
        </div>
      )}

      <section className="mt-12 rounded-xl border border-border bg-card/40 p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
          <MessageSquare className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {lang === "bn" ? "মন্তব্য সমূহ" : "Comments"} {comments.length > 0 && `(${comments.length})`}
          </h2>
        </div>

        <form onSubmit={handleCommentSubmit} className="mt-5 space-y-3">
          <div>
            <Input
              type="text"
              placeholder={lang === "bn" ? "আপনার নাম লিখুন *" : "Your Name *"}
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              className="bg-background"
            />
          </div>
          <div>
            <Textarea
              rows={3}
              placeholder={lang === "bn" ? "আপনার মন্তব্য লিখুন... *" : "Write your comment here... *"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-background"
            />
          </div>
          <Button type="submit" size="sm" className="gap-1.5">
            <Send className="size-3.5" />
            {lang === "bn" ? "মন্তব্য প্রকাশ করুন" : "Post Comment"}
          </Button>
        </form>

        <div className="mt-6 space-y-3 divide-y divide-border/30">
          {comments.length === 0 ? (
            <p className="pt-2 text-xs text-muted-foreground">
              {lang === "bn" ? "এখনও কোনো মন্তব্য করা হয়নি। প্রথম মন্তব্যটি আপনিই করুন!" : "No comments yet. Be the first to comment!"}
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}