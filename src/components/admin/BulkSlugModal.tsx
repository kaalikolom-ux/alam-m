import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, RefreshCw, Wand2, X, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { generatePhoneticSlug } from "@/lib/slugHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ArticleItem {
  id: string;
  title_bn: string;
  title_en?: string | null;
  slug: string;
}

interface BulkSlugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: ArticleItem[];
}

export function BulkSlugModal({ open, onOpenChange, articles }: BulkSlugModalProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [suggestedSlugs, setSuggestedSlugs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && articles.length > 0) {
      const suggestions: Record<string, string> = {};
      const selections: Record<string, boolean> = {};
      const usedSlugs: Record<string, number> = {};

      articles.forEach((art) => {
        let slug = generatePhoneticSlug(art.title_bn || art.title_en || "");
        if (!slug) slug = "post";

        // Collision detection
        if (usedSlugs[slug] !== undefined) {
          usedSlugs[slug]++;
          slug = `${slug}-${usedSlugs[slug]}`;
        } else {
          usedSlugs[slug] = 1;
        }

        suggestions[art.id] = slug;

        // Auto-select if current slug looks like an auto-import (e.g. import-..., post-...) or is different
        const isImportSlug = /^import-|^post-[a-z0-9]/.test(art.slug) || art.slug !== slug;
        if (isImportSlug) {
          selections[art.id] = true;
        }
      });

      setSuggestedSlugs(suggestions);
      setSelectedIds(selections);
    }
  }, [open, articles]);

  const updateSlugs = useMutation({
    mutationFn: async () => {
      const toUpdate = articles.filter((a) => selectedIds[a.id]);
      if (toUpdate.length === 0) return 0;

      let count = 0;
      for (const art of toUpdate) {
        const newSlug = suggestedSlugs[art.id]?.trim();
        if (newSlug && newSlug !== art.slug) {
          const { error } = await supabase
            .from("articles")
            .update({ slug: newSlug, updated_at: new Date().toISOString() })
            .eq("id", art.id);

          if (error) throw new Error(`Failed updating "${art.title_bn}": ${error.message}`);
          count++;
        }
      }
      return count;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success(`সফলভাবে ${count}টি পোস্টের পার্মালিঙ্ক/স্ল্যাগ আপডেট করা হয়েছে!`);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "স্ল্যাগ আপডেটে ত্রুটি হয়েছে");
    },
  });

  if (!open) return null;

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const handleSelectAll = (select: boolean) => {
    const next: Record<string, boolean> = {};
    articles.forEach((a) => {
      next[a.id] = select;
    });
    setSelectedIds(next);
  };

  const handleSelectOnlyChanged = () => {
    const next: Record<string, boolean> = {};
    articles.forEach((a) => {
      const sug = suggestedSlugs[a.id];
      if (sug && sug !== a.slug) {
        next[a.id] = true;
      }
    });
    setSelectedIds(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wand2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                পার্মালিঙ্ক / স্ল্যাগ বাল্ক জেনারেটর (SEO Slug Generator)
              </h3>
              <p className="text-xs text-muted-foreground">
                বাংলা শিরোনাম থেকে রোমানাইজড ইংরেজি ফ্রেন্ডলি পার্মালিঙ্ক তৈরি করুন।
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full size-8"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-border/60 bg-background/50 text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleSelectAll(true)}
            >
              সবগুলো নির্বাচন
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSelectOnlyChanged}
            >
              শুধুমাত্র পরিবর্তনযোগ্য ({articles.filter((a) => suggestedSlugs[a.id] !== a.slug).length}টি)
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => handleSelectAll(false)}
            >
              সব বাতিল
            </Button>
          </div>
          <span className="text-muted-foreground font-medium">
            নির্বাচিত: <strong className="text-primary">{selectedCount}</strong> / {articles.length} টি পোস্ট
          </span>
        </div>

        {/* Slugs Table List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-border/40">
          {articles.map((art) => {
            const currentSlug = art.slug;
            const sugSlug = suggestedSlugs[art.id] || "";
            const isDifferent = currentSlug !== sugSlug;
            const isImportSlug = /^import-|^post-[a-z0-9]/.test(currentSlug);
            const isChecked = Boolean(selectedIds[art.id]);

            return (
              <div
                key={art.id}
                className={`pt-3 flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-xl transition-colors ${
                  isChecked ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/40"
                }`}
              >
                {/* Checkbox & Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      setSelectedIds((prev) => ({ ...prev, [art.id]: e.target.checked }))
                    }
                    className="mt-1 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{art.title_bn}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">
                        /{currentSlug}
                      </code>
                      {isImportSlug && (
                        <span className="text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                          ইম্পোর্টকৃত
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="hidden md:block size-4 text-muted-foreground shrink-0" />

                {/* Suggested Input */}
                <div className="w-full md:w-72 shrink-0">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">
                      /
                    </span>
                    <Input
                      value={sugSlug}
                      onChange={(e) =>
                        setSuggestedSlugs((prev) => ({ ...prev, [art.id]: e.target.value }))
                      }
                      className="h-8 pl-5 text-xs font-mono bg-background border-border/80"
                      placeholder="custom-slug"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>

          <Button
            onClick={() => updateSlugs.mutate()}
            disabled={updateSlugs.isPending || selectedCount === 0}
            className="gap-2 bg-primary text-primary-foreground font-medium shadow-md"
          >
            {updateSlugs.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                আপডেট হচ্ছে...
              </>
            ) : (
              <>
                <Check className="size-4" />
                নির্বাচিত {selectedCount}টি স্ল্যাগ সেভ করুন
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
