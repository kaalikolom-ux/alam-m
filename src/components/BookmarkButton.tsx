import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";

type Target = {
  kind?: "article";
  articleId?: string;
  label: string;
};

export function BookmarkButton({
  target,
  size = "sm",
  variant = "ghost",
}: {
  target: Target;
  size?: "sm" | "icon";
  variant?: "ghost" | "outline";
}) {
  const { t } = usePrefs();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const key = ["bookmarks", user?.id];
  const { data: bookmarks } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("bookmarks").select("*");
      if (error) throw error;
      return data;
    },
  });

  const existing = bookmarks?.find(
    (b) => (b.article_id ?? null) === (target.articleId ?? null),
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (existing) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user!.id,
        kind: target.kind || "article",
        article_id: target.articleId ?? null,
        label: target.label,
      });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(result === "added" ? t("bookmarked") : t("removeBookmark"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user) {
    return (
      <Button asChild variant={variant} size={size} title={t("signInPrompt")}>
        <Link to="/auth">
          <Bookmark className="size-4" />
          {size !== "icon" && <span className="ml-1 hidden sm:inline">{t("bookmark")}</span>}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      title={existing ? t("removeBookmark") : t("bookmark")}
      className={existing ? "text-primary" : undefined}
    >
      {existing ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {size !== "icon" && (
        <span className="ml-1 hidden sm:inline">{existing ? t("bookmarked") : t("bookmark")}</span>
      )}
    </Button>
  );
}
