import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { localNumber } from "@/lib/quran";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "আমার বুকমার্ক — কুরআন অন্বেষা" },
      { name: "description", content: "আপনার সংরক্ষিত সুরা, আয়াত ও আর্টিকেল এক জায়গায়।" },
      { property: "og:title", content: "আমার বুকমার্ক — কুরআন অন্বেষা" },
      { property: "og:description", content: "সংরক্ষিত সুরা, আয়াত ও আর্টিকেল।" },
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
        .select("*")
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
        {bookmarks.data?.map((b) => (
          <div key={b.id} className="card-soft flex items-center gap-3 p-4">
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
              {b.kind === "article" ? t("article") : b.kind === "ayah" ? t("ayah") : t("surahs")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{b.label}</p>
              {b.surah && (
                <p className="text-xs text-muted-foreground">
                  {localNumber(b.surah, lang)}
                  {b.ayah ? `:${localNumber(b.ayah, lang)}` : ""}
                </p>
              )}
            </div>
            {b.surah ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  to="/surah/$id"
                  params={{ id: String(b.surah) }}
                  {...(b.ayah ? { hash: `ayah-${b.ayah}` } : {})}
                >
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
        ))}
      </div>
    </div>
  );
}
