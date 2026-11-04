import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Send,
  Users,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  X
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPublicSettings } from "@/lib/site";
import {
  renderArticleNewsletterHtml,
  type ArticleForNewsletter
} from "@/lib/newsletterMailer";

interface NewsletterBroadcastModalProps {
  article: any | null;
  onClose: () => void;
  authorsList?: { id: string; name_bn: string }[];
}

export function NewsletterBroadcastModal({
  article,
  onClose,
  authorsList = [],
}: NewsletterBroadcastModalProps) {
  const [testEmail, setTestEmail] = useState("newslater+notabene.inc@gmail.com");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    sentCount: number;
    totalSubscribers: number;
  } | null>(null);

  // Fetch subscriber count
  const countQuery = useQuery({
    queryKey: ["admin-newsletter-count"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "count" }),
        });
        const json = await res.json().catch(() => ({}));
        return json?.count ?? 0;
      } catch {
        return 0;
      }
    },
    enabled: !!article,
  });

  // Fetch newsletter settings for API key and sender info
  const settingsQuery = useQuery({
    queryKey: ["admin-newsletter-site-settings"],
    queryFn: async () => {
      try {
        const settings = await fetchPublicSettings();
        return (settings?.newsletter_settings ?? {}) as Record<string, any>;
      } catch {
        return {};
      }
    },
    enabled: !!article,
  });

  if (!article) return null;

  const authorObj = authorsList.find((a) => a.id === article.author_id);
  const authorName = authorObj?.name_bn || "আলম এম";

  const articlePayload: ArticleForNewsletter = {
    id: article.id,
    title_bn: article.title_bn,
    title_en: article.title_en,
    slug: article.slug,
    excerpt_bn: article.excerpt_bn,
    excerpt_en: article.excerpt_en,
    cover_image_url: article.cover_image_url,
    authorName,
    tags: Array.isArray(article.tags) ? article.tags : [],
  };

  const previewHtml = renderArticleNewsletterHtml(articlePayload, testEmail);

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("অনুগ্রহ করে একটি সঠিক টেস্ট ইমেইল ঠিকানা দিন");
      return;
    }

    setIsSendingTest(true);
    toast.loading("টেস্ট ইমেইল পাঠানো হচ্ছে...", { id: "test-broadcast" });

    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          api_key: settingsQuery.data?.resend_api_key || "",
          from_email: settingsQuery.data?.from_email || "",
          target_email: testEmail.trim().toLowerCase(),
          article: articlePayload,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        toast.success(`টেস্ট ইমেইল পাঠানো হয়েছে (${testEmail})!`, { id: "test-broadcast" });
      } else {
        const msg = json.error || json.message || "ইমেইল পাঠানো যায়নি";
        toast.error(`ব্যর্থ: ${msg}`, { id: "test-broadcast" });
      }
    } catch (err: any) {
      toast.error(`নেটওয়ার্ক ত্রুটি: ${err.message}`, { id: "test-broadcast" });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Broadcast to all active subscribers
  const handleBroadcast = async () => {
    const subscriberCount = countQuery.data ?? 0;
    if (
      !confirm(
        `আপনি কি নিশ্চিত যে এই আর্টিকেলের নোটিফিকেশন সকল নিউজলেটার গ্রাহকদের (${subscriberCount} জন) পাঠাতে চান?`
      )
    ) {
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);
    toast.loading("গ্রাহকদের নোটিফিকেশন ইমেইল পাঠানো হচ্ছে...", { id: "broadcast-email" });

    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          api_key: settingsQuery.data?.resend_api_key || "",
          from_email: settingsQuery.data?.from_email || "",
          article: articlePayload,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setBroadcastResult({
          sentCount: json.sentCount || 0,
          totalSubscribers: json.totalSubscribers || 0,
        });
        toast.success(
          `সফলভাবে ${json.sentCount || 0} জন গ্রাহকের কাছে নোটিফিকেশন ইমেইল পাঠানো হয়েছে!`,
          { id: "broadcast-email", duration: 6000 }
        );
      } else {
        const msg = json.error || json.message || "ব্রডকাস্ট ব্যর্থ হয়েছে";
        toast.error(`ত্রুটি: ${msg}`, { id: "broadcast-email" });
      }
    } catch (err: any) {
      toast.error(`নেটওয়ার্ক ত্রুটি: ${err.message}`, { id: "broadcast-email" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <Dialog open={!!article} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-xs">
                <Mail className="size-5 text-emerald-200" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  নিউজলেটার গ্রাহকদের ইমেইল নোটিফিকেশন পাঠান
                </DialogTitle>
                <DialogDescription className="text-xs text-emerald-200 mt-0.5">
                  নতুন প্রকাশিত গবেষণামূলক প্রবন্ধের সারসংক্ষেপ ও লিংক সকল সাবস্ক্রাইবারদের ইনবক্সে পৌঁছান
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/10 text-emerald-100 border-white/20 text-xs gap-1 py-1">
              <Users className="size-3.5" />
              {countQuery.data ?? 0} জন সক্রিয় গ্রাহক
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Article Info Card */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  প্রবন্ধ
                </span>
                <h3 className="font-bold text-sm text-foreground leading-snug">
                  {article.title_bn}
                </h3>
                {article.title_en && (
                  <p className="text-xs text-muted-foreground italic mt-0.5">{article.title_en}</p>
                )}
              </div>
              <a
                href={`https://www.quraan.bd/articles/${article.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium shrink-0 pt-1"
              >
                <span>ভিউ করুন</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
              <span>✍️ লেখক: <strong className="text-foreground font-medium">{authorName}</strong></span>
              <span>🔗 পার্মালিঙ্ক: <code className="text-[11px] bg-background px-1.5 py-0.5 rounded border">{article.slug}</code></span>
            </div>
          </div>

          {/* Success Banner if already broadcast */}
          {broadcastResult && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  ইমেইল ব্রডকাস্ট সম্পন্ন হয়েছে!
                </span>
                <p className="text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
                  মোট {broadcastResult.sentCount} জন গ্রাহকের কাছে ইমেইল পাঠানো হয়েছে।
                </p>
              </div>
            </div>
          )}

          {/* Test Email Box */}
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Send className="size-3.5 text-primary" /> টেস্ট নোটিফিকেশন পাঠান
              </label>
              <button
                type="button"
                onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Eye className="size-3.5" />
                {showHtmlPreview ? "প্রিভিউ লুকান" : "ইমেইল প্রিভিউ দেখুন"}
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="টেস্ট ইমেইল ঠিকানা (যেমন: your@email.com)"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-8 text-xs bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="h-8 text-xs gap-1.5 cursor-pointer shrink-0"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="size-3" /> টেস্ট পাঠান
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              সকল গ্রাহকদের পাঠানোর পূর্বে নিজের ইমেইলে পাঠিয়ে প্রিভিউ ও লেআউট যাচাই করে নিন।
            </p>
          </div>

          {/* Live Email HTML Preview Frame */}
          {showHtmlPreview && (
            <div className="rounded-xl border border-border overflow-hidden space-y-1.5">
              <div className="bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>ইনবক্স এইচটিএমএল প্রিভিউ (Mobile Responsive)</span>
                <button
                  type="button"
                  onClick={() => setShowHtmlPreview(false)}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-zinc-900 max-h-72 overflow-y-auto">
                <iframe
                  title="Newsletter Email Preview"
                  srcDoc={previewHtml}
                  className="w-full h-80 rounded border bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-border/70 bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer text-xs"
          >
            বন্ধ করুন
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleBroadcast}
            disabled={isBroadcasting || (countQuery.data ?? 0) === 0}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-2 cursor-pointer shadow-xs"
          >
            {isBroadcasting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> ব্রডকাস্ট হচ্ছে...
              </>
            ) : (
              <>
                <Mail className="size-3.5" /> সকল গ্রাহককে ইমেইল পাঠান ({countQuery.data ?? 0} জন)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
