// src/components/admin/ArticleDateTimeModal.tsx
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Check, Loader2, X, RefreshCw, Zap, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  toDateTimeLocalString,
  fromDateTimeLocalString,
  formatFullDateTimeBn,
} from "@/lib/dateUtils";

export interface ArticleDateTimeTarget {
  id: string;
  title_bn: string;
  title_en?: string | null;
  slug: string;
  published_at?: string | null;
  created_at?: string | null;
  published?: boolean;
}

interface ArticleDateTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleDateTimeTarget | null;
  onSuccess?: (newPublishedAt: string) => void;
}

export function ArticleDateTimeModal({
  open,
  onOpenChange,
  article,
  onSuccess,
}: ArticleDateTimeModalProps) {
  const queryClient = useQueryClient();
  const [dateTimeLocal, setDateTimeLocal] = useState<string>("");

  useEffect(() => {
    if (open && article) {
      const initialDate = article.published_at || article.created_at || new Date().toISOString();
      setDateTimeLocal(toDateTimeLocalString(initialDate));
    }
  }, [open, article]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!article) return;
      const newIso = fromDateTimeLocalString(dateTimeLocal);
      if (!newIso) {
        throw new Error("অনুগ্রহ করে একটি সঠিক তারিখ ও সময় নির্বাচন করুন");
      }

      const { error } = await supabase
        .from("articles")
        .update({
          published_at: newIso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", article.id);

      if (error) throw error;
      return newIso;
    },
    onSuccess: (newIso) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-single"] });
      if (article?.slug) {
        queryClient.invalidateQueries({ queryKey: ["article-single", article.slug] });
      }
      toast.success("পোস্টের প্রকাশের সময় ও তারিখ সফলভাবে আপডেট হয়েছে!");
      if (newIso) onSuccess?.(newIso);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(`তারিখ পরিবর্তন ব্যর্থ হয়েছে: ${err?.message || err}`);
    },
  });

  if (!open || !article) return null;

  const originalDate = article.published_at || article.created_at;

  // Preset helpers
  const applyPresetNow = () => {
    setDateTimeLocal(toDateTimeLocalString(new Date()));
  };

  const applyPresetTodayMorning = () => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    setDateTimeLocal(toDateTimeLocalString(d));
  };

  const applyPresetTodayEvening = () => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    setDateTimeLocal(toDateTimeLocalString(d));
  };

  const applyPresetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDateTimeLocal(toDateTimeLocalString(d));
  };

  const applyPresetOneWeekAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setDateTimeLocal(toDateTimeLocalString(d));
  };

  const applyPresetOriginal = () => {
    if (originalDate) {
      setDateTimeLocal(toDateTimeLocalString(originalDate));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <h3 id="date-modal-title" className="text-base sm:text-lg font-semibold text-foreground">
                পোস্টের সময় ও তারিখ পরিবর্তন
              </h3>
              <p className="text-xs text-muted-foreground">
                যেকোনো অতীতের বা ভবিষ্যতের প্রকাশের সময় নির্ধারণ করুন
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full size-8"
            aria-label="বন্ধ করুন"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Target Article Info */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">নির্বাচিত পোস্ট:</span>
            <span className="text-[10px] font-mono text-primary truncate max-w-[180px]">
              /{article.slug}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground line-clamp-1">
            {article.title_bn || article.title_en}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
            <Clock className="size-3 text-primary" />
            <span>বর্তমান সময়:</span>
            <span className="font-medium text-foreground">
              {formatFullDateTimeBn(originalDate)}
            </span>
          </div>
        </div>

        {/* Input & Live Preview */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="article-datetime-input" className="text-xs font-semibold text-foreground">
              নতুন প্রকাশের তারিখ ও সময় নির্বাচন করুন:
            </Label>
            <Input
              id="article-datetime-input"
              type="datetime-local"
              value={dateTimeLocal}
              onChange={(e) => setDateTimeLocal(e.target.value)}
              className="h-10 text-sm font-medium bg-background"
            />
          </div>

          {/* Live Bengali Preview Pill */}
          {dateTimeLocal && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs border border-border/60">
              <span className="text-muted-foreground shrink-0 font-medium">প্রদর্শিত হবে:</span>
              <span className="font-semibold text-primary truncate">
                {formatFullDateTimeBn(fromDateTimeLocalString(dateTimeLocal))}
              </span>
            </div>
          )}
        </div>

        {/* Quick Presets Bar */}
        <div className="space-y-2 pt-1 border-t border-border/40">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            দ্রুত নির্বাচন (Quick Presets):
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetNow}
              className="h-7 text-xs gap-1 bg-background hover:bg-primary/10 hover:text-primary"
            >
              <Zap className="size-3 text-amber-500" />
              বর্তমান সময় (এখন)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetTodayMorning}
              className="h-7 text-xs bg-background hover:bg-primary/10 hover:text-primary"
            >
              আজ সকাল ৯:০০
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetTodayEvening}
              className="h-7 text-xs bg-background hover:bg-primary/10 hover:text-primary"
            >
              আজ রাত ৮:০০
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetYesterday}
              className="h-7 text-xs bg-background hover:bg-primary/10 hover:text-primary"
            >
              গতকাল এই সময়ে
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetOneWeekAgo}
              className="h-7 text-xs bg-background hover:bg-primary/10 hover:text-primary"
            >
              ১ সপ্তাহ আগে
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={applyPresetOriginal}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RefreshCw className="size-3" />
              আসল তারিখ
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            বাতিল
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dateTimeLocal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] gap-1.5"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                সংরক্ষণ হচ্ছে...
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                তারিখ সংরক্ষণ করুন
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
