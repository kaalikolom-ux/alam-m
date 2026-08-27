import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "আমার বুকমার্ক — Alam M" },
      { name: "description", content: "আপনার সংরক্ষিত আর্টিকেল ও প্রিয় লেখা এক জায়গায়।" },
      { property: "og:title", content: "আমার বুকমার্ক — Alam M" },
      { property: "og:description", content: "সংরক্ষিত আর্টিকেল ও প্রিয় লেখা।" },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { t, lang } = usePrefs();
  const { user, loading } = useSession();
  const queryClient = useQueryClient();

  const bookmarks = useQuery({
    queryKey: ["bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*, articles(id, slug, title_bn, title_en)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookmarks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(t("removeBookmark"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{t("signInPrompt")}</p>
        <Button asChild className="mt-4">
          <Link to="/auth">{t("signIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("myBookmarks")}</h1>

      {bookmarks.data && bookmarks.data.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">{t("emptyBookmarks")}</p>
      )}

      <div className="mt-8 space-y-3">
        {bookmarks.data?.map((b: any) => {
          const articleSlug = b.articles?.slug;
          const title =
            lang === "en" && b.articles?.title_en
              ? b.articles.title_en
              : b.articles?.title_bn || b.label;

          return (
            <div key={b.id} className="card-soft flex items-center gap-3 p-4">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {t("article")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{title}</p>
              </div>
              {articleSlug ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/articles/$slug" params={{ slug: articleSlug }}>
                    <BookOpen className="size-3.5 mr-1" />
                    {t("readMore")}
                  </Link>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate(b.id)}
                aria-label={t("delete")}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
