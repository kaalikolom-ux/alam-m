import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, FileText, ArrowRight, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { lang } = usePrefs();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["global-search", searchTerm, isAdmin],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];

      const term = searchTerm.trim().toLowerCase();

      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title_bn, title_en, excerpt_bn, content_bn, published_at, article_categories(categories(slug, name_bn, name_en))")
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;

      return (data || []).filter((art: any) => {
        const isDraft = (art.article_categories || []).some(
          (ac: any) => ac.categories?.slug === "draft" || ac.categories?.name_bn === "খসড়া"
        );

        if (!isAdmin && isDraft) return false;

        const titleBn = (art.title_bn || "").toLowerCase();
        const titleEn = (art.title_en || "").toLowerCase();
        const excerptBn = (art.excerpt_bn || "").toLowerCase();
        const contentBn = (art.content_bn || "").toLowerCase();

        return (
          titleBn.includes(term) ||
          titleEn.includes(term) ||
          excerptBn.includes(term) ||
          contentBn.includes(term)
        );
      });
    },
    enabled: searchTerm.trim().length > 0,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 backdrop-blur-md bg-background/80 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => onOpenChange(false)} 
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="size-5 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === "bn" ? "শিরোনাম, বিষয়বস্তু বা শব্দ দিয়ে খুঁজুন..." : "Search articles by title or keyword..."}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base sm:text-lg"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-border/40">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-sm">{lang === "bn" ? "অনুসন্ধান করা হচ্ছে..." : "Searching..."}</span>
            </div>
          )}

          {!isLoading && searchTerm.trim() && results.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {lang === "bn" ? `"${searchTerm}" দিয়ে কোনো লেখা খুঁজে পাওয়া যায়নি।` : `No articles found for "${searchTerm}"`}
            </div>
          )}

          {!isLoading && !searchTerm.trim() && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {lang === "bn" ? "কীবোর্ডে টাইপ করে অনুসন্ধান শুরু করুন। বন্ধ করতে ESC চাপুন।" : "Type to start searching. Press ESC to close."}
            </div>
          )}

          {results.map((art: any) => {
            const isDraft = (art.article_categories || []).some(
              (ac: any) => ac.categories?.slug === "draft" || ac.categories?.name_bn === "খসড়া"
            );
            const title = lang === "en" && art.title_en ? art.title_en : art.title_bn;

            return (
              <button
                key={art.id}
                onClick={() => {
                  onOpenChange(false);
                  navigate({
                    to: "/articles/$slug",
                    params: { slug: art.slug },
                  });
                }}
                className="w-full flex items-start gap-3 p-3.5 text-left rounded-xl hover:bg-muted/60 transition-colors group"
              >
                <FileText className="size-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {title}
                    </h4>
                    {isDraft && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        খসড়া
                      </span>
                    )}
                  </div>
                  {art.excerpt_bn && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {art.excerpt_bn}
                    </p>
                  )}
                </div>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
