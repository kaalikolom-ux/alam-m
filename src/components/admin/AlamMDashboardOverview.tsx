import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PenTool,
  BookOpen,
  FolderTree,
  Mail,
  Users,
  Eye,
  Plus,
  ExternalLink,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Clock,
  ArrowRight,
  Send,
  Zap,
  Globe,
  Tag,
  CheckCircle2,
  FileText
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatFullDateTimeBn } from "@/lib/dateUtils";
import { generateEnglishSlug } from "@/lib/slugHelper";
import { STATIC_ARTICLES_META } from "@/lib/staticArticlesMeta";
import { QuranExplorerLogo } from "@/components/QuranExplorerLogo";

interface AlamMDashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

export function AlamMDashboardOverview({ setActiveTab }: AlamMDashboardOverviewProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Quick Draft State
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPurgingCache, setIsPurgingCache] = useState(false);

  // 1. Articles Query (Live from D1/Supabase)
  const articlesQuery = useQuery({
    queryKey: ["admin-dashboard-articles-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title_bn, slug, published, published_at, created_at, cover_image_url")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(6);
      if (error) return [];
      return data || [];
    },
  });

  // 1.1 Articles Count (Published & Drafts)
  const articlesCountQuery = useQuery({
    queryKey: ["admin-dashboard-articles-count"],
    queryFn: async () => {
      const [pubRes, draftRes] = await Promise.all([
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("published", true),
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("published", false),
      ]);

      const dbPubCount = pubRes.count ?? 0;
      const dbDraftCount = draftRes.count ?? 0;
      const staticCount = STATIC_ARTICLES_META.length;

      return {
        published: dbPubCount > 0 ? dbPubCount : staticCount,
        draft: dbDraftCount,
        total: (dbPubCount > 0 ? dbPubCount : staticCount) + dbDraftCount,
      };
    },
  });

  // 2. Categories Query & Count
  const categoriesQuery = useQuery({
    queryKey: ["admin-dashboard-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name_bn, name_en")
        .order("name_bn", { ascending: true });
      if (error) return [];
      return data || [];
    },
  });

  // 3. Contact Messages Query & Unread Count
  const messagesQuery = useQuery({
    queryKey: ["admin-dashboard-messages-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, subject, message, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) return [];
      return data || [];
    },
  });

  const unreadMessagesCountQuery = useQuery({
    queryKey: ["admin-dashboard-unread-messages-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) return 0;
      return count ?? 0;
    },
  });

  // 4. Newsletter Subscribers Count
  const subscribersQuery = useQuery({
    queryKey: ["admin-dashboard-subscribers-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true });
      if (error) return 0;
      return count ?? 0;
    },
  });

  // 5. Visitor Analytics Summary Query
  const visitorAnalyticsQuery = useQuery({
    queryKey: ["admin-dashboard-visitor-summary"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/analytics?timeframe=today");
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  // Handle Quick Literary Draft Save
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) {
      toast.error("অনুগ্রহ করে লেখার শিরোনাম লিখুন");
      return;
    }

    try {
      setIsSavingDraft(true);
      const autoSlug = (await generateEnglishSlug(draftTitle)) || `draft-${Date.now()}`;
      const uniqueSlug = `${autoSlug}-${Math.floor(Math.random() * 1000)}`;

      const { error } = await supabase.from("articles").insert({
        title_bn: draftTitle.trim(),
        slug: uniqueSlug,
        content_bn: draftContent.trim(),
        published: false,
        created_by: user?.id,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("সাহিত্য ভাবনা সফলভাবে খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে!");
      setDraftTitle("");
      setDraftContent("");
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-articles-recent"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-articles-count"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    } catch (err: any) {
      toast.error(`খসড়া সংরক্ষণ ব্যর্থ হয়েছে: ${err.message || err}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Edge & App Cache Purge
  const handlePurgeCache = async () => {
    if (isPurgingCache) return;
    setIsPurgingCache(true);
    try {
      try {
        await fetch("/api/admin/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cloudflare_purge" }),
        });
      } catch {
        // Fallback
      }
      queryClient.clear();
      await queryClient.invalidateQueries();
      toast.success("ক্লাউডফ্লেয়ার এজ ও অ্যাপ্লিকেশনের ক্যাশ সফলভাবে রিফ্রেশ হয়েছে!");
    } catch (err: any) {
      toast.error(`ক্যাশ রিফ্রেশ ব্যর্থ হয়েছে: ${err.message || err}`);
    } finally {
      setIsPurgingCache(false);
    }
  };

  const counts = articlesCountQuery.data || {
    published: STATIC_ARTICLES_META.length,
    draft: 0,
    total: STATIC_ARTICLES_META.length,
  };
  const unreadCount = unreadMessagesCountQuery.data || 0;
  const subscribersCount = subscribersQuery.data || 0;
  const categoriesList = categoriesQuery.data || [];
  const recentArticles = articlesQuery.data || [];
  const recentMessages = messagesQuery.data || [];
  const liveVisitors = visitorAnalyticsQuery.data?.summary?.liveNow || 0;
  const todayPageViews = visitorAnalyticsQuery.data?.summary?.totalPageViews || 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. WELCOME HERO SECTION */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/70 backdrop-blur-md p-6 sm:p-7 shadow-lg">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 size-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <QuranExplorerLogo size="md" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3" /> সাহিত্য ও চিন্তন পোর্টাল
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              স্বাগতম, আলম এম.!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              গল্প, কবিতা, স্মৃতিকথা, চিন্তাভাবনা ও সাহিত্যকর্ম প্রকাশের ডিজিটাল ড্যাশবোর্ড। এখান থেকে সাইটের প্রতিটি লেখা, পাঠক প্রতিক্রিয়া এবং পাঠক তথ্য পরিচালনা করুন।
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              onClick={() => setActiveTab("articles")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-md hover:shadow-lg transition-all"
            >
              <PenTool className="size-3.5" />
              নতুন লেখা লিখুন
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePurgeCache}
              disabled={isPurgingCache}
              className="text-xs gap-1.5 border-border hover:bg-primary/10 hover:text-primary transition-all"
              title="ক্লাউডফ্লেয়ার এজ ক্যাশ ও ডেটাবেজ ক্যাশ তাৎক্ষণিক পরিষ্কার করুন"
            >
              <RefreshCw className={`size-3.5 ${isPurgingCache ? "animate-spin text-primary" : ""}`} />
              ক্যাশ ক্লিয়ার
            </Button>
            <Button
              type="button"
              variant="ghost"
              asChild
              className="text-xs gap-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Link to="/" target="_blank" rel="noreferrer">
                <span>ওয়েবসাইট দেখুন</span>
                <ExternalLink className="size-3 opacity-70" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KEY LITERARY METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* প্রকাশিত লেখা */}
        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">প্রকাশিত রচনা</span>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {counts.published}
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            লাইভ প্রকাশিত
          </p>
        </button>

        {/* খসড়া পোস্ট */}
        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">খসড়া লেখা</span>
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {counts.draft}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            অপ্রকাশিত ড্রাফট
          </p>
        </button>

        {/* সাহিত্য বিভাগ */}
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">সাহিত্য বিভাগ</span>
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderTree className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {categoriesList.length || 5}
          </p>
          <p className="mt-0.5 text-[10px] text-primary font-medium">
            গল্প, কবিতা ইত্যাদি
          </p>
        </button>

        {/* পাঠকের বার্তা */}
        <button
          type="button"
          onClick={() => setActiveTab("messages")}
          className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">পাঠকের বার্তা</span>
            <div className="size-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono flex items-center gap-1.5">
            {recentMessages.length}
            {unreadCount > 0 && (
              <span className="text-[10px] bg-red-600 text-white rounded-full px-1.5 py-0.5 font-bold leading-none animate-pulse">
                +{unreadCount}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-medium truncate">
            {unreadCount > 0 ? `${unreadCount}টি নতুন অপঠিত` : "সব পঠিত"}
          </p>
        </button>

        {/* নিউজলেটার গ্রাহক */}
        <button
          type="button"
          onClick={() => setActiveTab("subs")}
          className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">নিউজলেটার</span>
            <div className="size-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {subscribersCount}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            নিবন্ধিত পাঠক
          </p>
        </button>

        {/* লাইভ ভিজিটর */}
        <button
          type="button"
          onClick={() => setActiveTab("visitor-analytics")}
          className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">লাইভ ভিজিটর</span>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            {liveVisitors}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">
            আজ ভিউ: {todayPageViews}
          </p>
        </button>
      </div>

      {/* 3. LITERARY HUB: 2-COLUMN MAIN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: RECENT ARTICLES & CATEGORY SHORTCUTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* RECENT ARTICLES CARD */}
          <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    সর্বশেষ প্রকাশিত ও প্রস্তুতকৃত সাহিত্যকর্ম
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    সাম্প্রতিক গল্প, কবিতা ও প্রবন্ধের তালিকা
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("articles")}
                className="text-xs text-primary gap-1 hover:underline"
              >
                সকল লেখা ({counts.total}) <ArrowRight className="size-3" />
              </Button>
            </div>

            {/* List */}
            <div className="divide-y divide-border/40">
              {recentArticles.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  কোনো পোস্ট পাওয়া যায়নি।{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("articles")}
                    className="text-primary hover:underline font-medium"
                  >
                    নতুন একটি লেখা তৈরি করুন
                  </button>
                </div>
              ) : (
                recentArticles.map((article) => {
                  const displayDate = article.published_at || article.created_at;
                  return (
                    <div
                      key={article.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              article.published ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            title={article.published ? "প্রকাশিত" : "খসড়া"}
                          />
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {article.title_bn}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-4">
                          <span className="font-mono text-primary/80 truncate max-w-[150px]">
                            /{article.slug}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground/70" />
                            {formatFullDateTimeBn(displayDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-4 sm:pl-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Link to="/articles/$slug" params={{ slug: article.slug }} target="_blank">
                            <ExternalLink className="size-3 mr-1" /> দেখুন
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveTab("articles")}
                          className="h-7 px-2.5 text-xs"
                        >
                          সম্পাদনা
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LITERARY CATEGORIES OVERVIEW */}
          <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="size-4 text-primary" />
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  সাহিত্য বিভাগসমূহ (Categories)
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("categories")}
                className="text-xs text-primary gap-1 hover:underline h-7"
              >
                বিভাগ পরিচালনা <ArrowRight className="size-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {[
                { name: "গল্প", slug: "golpo", icon: "📖", desc: "ছোটগল্প ও আখ্যান" },
                { name: "কবিতা", slug: "kobita", icon: "✒️", desc: "কাব্য ও অন্ত্যমিল" },
                { name: "স্মৃতিকথা", slug: "smritikotha", icon: "🕰️", desc: "জীবনের স্মৃতি" },
                { name: "প্রবন্ধ", slug: "provondho", icon: "📜", desc: "চিন্তা ও বিশ্লেষণ" },
                { name: "ধারাবাহিক", slug: "dharabahik", icon: "🔖", desc: "ধারাবাহিক রচনা" },
              ].map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveTab("categories")}
                  className="rounded-xl border border-border/60 bg-muted/40 p-3 text-left hover:border-primary/40 hover:bg-muted/70 transition-all cursor-pointer group"
                >
                  <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </span>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK DRAFT & RECENT MESSAGES */}
        <div className="space-y-6">
          {/* QUICK LITERARY DRAFT / NOTEPAD */}
          <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <PenTool className="size-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  তাৎক্ষণিক সাহিত্য ভাবনা (Quick Draft)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  হঠাৎ মনে আসা গল্প বা কবিতার চরণ ড্রাফট হিসেবে সেভ করুন
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDraft} className="space-y-3">
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="লেখার শিরোনাম..."
                className="h-9 text-xs bg-background"
                disabled={isSavingDraft}
              />
              <Textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="আপনার ভাবনা, গল্পের প্রাথমিক প্লট বা কবিতার চরণগুলো এখানে লিখুন..."
                rows={4}
                className="text-xs bg-background resize-none leading-relaxed"
                disabled={isSavingDraft}
              />
              <Button
                type="submit"
                disabled={isSavingDraft || !draftTitle.trim()}
                className="w-full text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Send className="size-3" />
                {isSavingDraft ? "সংরক্ষণ হচ্ছে..." : "খসড়া হিসেবে সংরক্ষণ করুন"}
              </Button>
            </form>
          </div>

          {/* RECENT READER MESSAGES */}
          <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  পাঠকদের সাম্প্রতিক বার্তা
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("messages")}
                className="text-xs text-primary gap-1 hover:underline h-7"
              >
                সকল বার্তা <ArrowRight className="size-3" />
              </Button>
            </div>

            <div className="space-y-2.5">
              {recentMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  নতুন কোনো পাঠক বার্তা নেই।
                </p>
              ) : (
                recentMessages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-border/50 bg-muted/30 space-y-1 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(m.created_at).toLocaleDateString("bn-BD")}
                      </span>
                    </div>
                    {m.subject && (
                      <p className="text-[11px] font-medium text-primary truncate">
                        {m.subject}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {m.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
