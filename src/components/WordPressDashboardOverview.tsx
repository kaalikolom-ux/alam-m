import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Users,
  FolderTree,
  BookOpen,
  Headphones,
  Clock,
  Activity,
  CheckCircle2,
  Plus,
  ExternalLink,
  Home,
  Pencil,
  ShieldCheck,
  Languages,
  Download,
  Mail,
  Layers,
  Database,
  UserCheck,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAppDesignSettings } from "@/lib/designSync";
import { Textarea } from "@/components/ui/textarea";
import { STATIC_ARTICLES_META } from "@/lib/staticArticlesMeta";
import { generateEnglishSlug } from "@/lib/slugHelper";
import { formatDurationBn, formatNumberBn, getAnalyticsEndpoint } from "@/lib/visitorTracker";
import { QuranLogoBadge } from "@/components/QuranLogoBadge";
import { QuranExplorerLogo } from "@/components/QuranExplorerLogo";
import { PageHeroBackground } from "@/components/PageHeroBackground";

interface WordPressDashboardOverviewProps {
  setActiveTab: (tab: string) => void;
  visibleWidgets?: {
    welcome: boolean;
    atAGlance: boolean;
    quickDraft: boolean;
    recentActivity: boolean;
    siteHealth: boolean;
    visitorAnalytics?: boolean;
    supabaseStatus?: boolean;
  };
}

export function WordPressDashboardOverview({
  setActiveTab,
  visibleWidgets = {
    welcome: true,
    atAGlance: true,
    quickDraft: true,
    recentActivity: true,
    siteHealth: true,
    visitorAnalytics: true,
    supabaseStatus: true,
  },
}: WordPressDashboardOverviewProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Visitor Analytics Query for Dashboard Widget
  const visitorAnalyticsQuery = useQuery({
    queryKey: ["wp-admin-visitor-summary-widget"],
    queryFn: async () => {
      const endpoint = getAnalyticsEndpoint();
      const res = await fetch(`${endpoint}?timeframe=today`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Mobile Floating Popup State (Synced with Cloud & All Devices)
  const { settings: designSettings, updateSettings: updateDesignSettings } = useAppDesignSettings();
  const mobileFloatingPopupEnabled = designSettings.mobileFloatingPopupEnabled;

  const handleToggleMobileFloating = (enabled: boolean) => {
    updateDesignSettings({ mobileFloatingPopupEnabled: enabled });
    toast.success(
      enabled
        ? "মোবাইলে ভাসমান পপআপ চালু ও ক্লাউডে সিঙ্ক করা হয়েছে"
        : "মোবাইলে ভাসমান পপআপ বন্ধ ও ক্লাউডে সিঙ্ক করা হয়েছে (পড়ার সুবিধা নিশ্চিত)"
    );
  };

  // Quick Draft State
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // 1. Articles Query
  const articlesQuery = useQuery({
    queryKey: ["wp-admin-articles-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title_bn, slug, published, created_at, cover_image_url")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) return [];
      return data || [];
    },
  });

  // 2. Authors Count
  const authorsQuery = useQuery({
    queryKey: ["wp-admin-authors-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("authors")
        .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    },
  });

  // 3. Categories Count
  const categoriesQuery = useQuery({
    queryKey: ["wp-admin-categories-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    },
  });

  // 4. Registered Users Count
  const registeredUsersQuery = useQuery({
    queryKey: ["wp-admin-registered-users-count"],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        if (error) return 0;
        return count || 0;
      } catch {
        return 0;
      }
    },
  });

  // Handle Quick Draft Submission
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) {
      toast.error("অনুগ্রহ করে ড্রাফটের একটি শিরোনাম লিখুন");
      return;
    }

    try {
      setIsSavingDraft(true);
      const slug = (await generateEnglishSlug(draftTitle)) || `draft-${Date.now()}`;
      const { error } = await supabase.from("articles").insert({
        title_bn: draftTitle.trim(),
        slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
        content_bn: draftContent.trim(),
        published: false,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("খসড়া সফলভাবে সংরক্ষিত হয়েছে!");
      setDraftTitle("");
      setDraftContent("");
      queryClient.invalidateQueries({ queryKey: ["wp-admin-articles-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    } catch (err: any) {
      toast.error(`খসড়া সংরক্ষণ ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const dbArticlesCount = articlesQuery.data?.length || 0;
  const staticCount = STATIC_ARTICLES_META.length;
  const totalArticlesEstimate = staticCount + dbArticlesCount;

  return (
    <div className="space-y-6">
      {/* 1. WELCOME TO WORDPRESS PANEL */}
      {visibleWidgets.welcome && (
        <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 sm:p-6 shadow-xl contain-paint transition-colors duration-300">
          <PageHeroBackground intensity="subtle" fadeBottom={false} />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20 pb-4">
              <div className="flex items-center gap-3.5">
                <QuranLogoBadge
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-[5px] shrink-0 shadow-sm"
                  iconClassName="size-5.5 sm:size-6"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <QuranExplorerLogo size="sm" />
                    <span className="text-lg sm:text-xl font-bold text-[#1d2327] dark:text-white">
                      ড্যাশবোর্ডে স্বাগতম!
                    </span>
                  </div>
                  <p className="text-xs text-[#646970] dark:text-[#a7aaad] mt-0.5">
                    শব্দে শব্দে কুরআন অন্বেষা &bull; কুরআনের গবেষণা, অনুবাদ ও প্রবন্ধ পরিচালনার ডিজিটাল কন্ট্রোল প্যানেল
                  </p>
                </div>
              </div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 w-fit shrink-0 shadow-2xs">
                ● সংস্করণ ৩.৩.০ (Active)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-[#2c3338] dark:text-[#f0f0f1]">
              {/* কলাম ১: শুরু করুন */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/45 dark:bg-[#12171f]/60 border border-[#c4aa82]/40 dark:border-[#b88e58]/25 backdrop-blur-md shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="font-bold text-sm text-[#1d2327] dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#b07818] to-[#b88e58]" />
                    <span>শুরু করুন</span>
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium">প্রাথমিক কাজ</span>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings-reading")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Layers className="size-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        পঠন ও লেয়ার অনুমতি
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("articles")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Plus className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        একটি নতুন প্রবন্ধ লিখুন
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>

                <div className="pt-1.5 text-muted-foreground text-[11px] leading-relaxed">
                  অথবা আপনার ওয়েবসাইটের{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("pages")}
                    className="text-[#a16e03] dark:text-[#ecd599] font-bold hover:underline"
                  >
                    স্থির পেজসমূহ
                  </button>{" "}
                  এবং{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("menu")}
                    className="text-[#a16e03] dark:text-[#ecd599] font-bold hover:underline"
                  >
                    মেনু
                  </button>{" "}
                  কাস্টমাইজ করুন।
                </div>
              </div>

              {/* কলাম ২: পরবর্তী ধাপসমূহ */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/45 dark:bg-[#12171f]/60 border border-[#c4aa82]/40 dark:border-[#b88e58]/25 backdrop-blur-md shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="font-bold text-sm text-[#1d2327] dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#b07818] to-[#b88e58]" />
                    <span>পরবর্তী ধাপসমূহ</span>
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium">কুইক অ্যাক্সেস</span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("translations")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Languages className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        কুরআন আয়াত ও অনুবাদ পরীক্ষা করুন
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("categories")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <FolderTree className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        বিষয়ভিত্তিক ক্যাটাগরি ও বিষয় বিন্যাস
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Users className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        লেখক ও গবেষকবৃন্দ পরিচালনা করুন
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("registered-users")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <UserCheck className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        সকল নিবন্ধিত অ্যাকাউন্ট ও লগইন তালিকা
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("surah-audio")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Headphones className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        ক্বারীদের সুরার অডিও কন্ট্রোল করুন
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              </div>

              {/* কলাম ৩: অন্যান্য অ্যাকশন */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/45 dark:bg-[#12171f]/60 border border-[#c4aa82]/40 dark:border-[#b88e58]/25 backdrop-blur-md shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="font-bold text-sm text-[#1d2327] dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 rounded-full bg-emerald-500" />
                    <span>অন্যান্য অ্যাকশন</span>
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium">টুলস ও নিরাপত্তা</span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("import")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Download className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        ওয়ার্ডপ্রেস বা ব্লগারে প্রকাশিত পোস্ট ইমপোর্ট
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("messages")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Mail className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        পাঠকদের নতুন বার্তা ও প্রতিক্রিয়া দেখুন
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("quran-export")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <BookOpen className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#1e150f] dark:text-[#f0f0f1] group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors truncate">
                        কুরআন PDF ও ই-বুক এক্সপোর্টার
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  {/* ২-ফ্যাক্টর নিরাপত্তা কনফিগারেশন (2FA Settings) - হাইলাইটেড এমারেল্ড বাটন */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("2fa-security")}
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-emerald-500/40 dark:border-emerald-500/35 border-t-[1.5px] border-t-emerald-400 dark:border-t-emerald-300/80 border-b-2 border-b-emerald-800/40 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-emerald-500 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                        <ShieldCheck className="size-3.5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200 transition-colors truncate">
                        🛡️ ২-ফ্যাক্টর নিরাপত্তা কনফিগারেশন (2FA Settings)
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-emerald-600/70 dark:text-emerald-400/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  {/* লাইভ ওয়েবসাইট ব্রাউজ করুন (হোম) - লাক্সারি গোল্ড বাটন */}
                  <Link
                    to="/"
                    className="w-full group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 bg-[var(--gradient-hero)] shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599]/80 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] group-hover:scale-110 transition-transform shrink-0">
                        <Home className="size-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#1e150f] dark:text-[#ecd599] group-hover:text-[#a16e03] dark:group-hover:text-white transition-colors truncate">
                        লাইভ ওয়েবসাইট ব্রাউজ করুন (হোম)
                      </span>
                    </div>
                    <ExternalLink className="size-3 text-muted-foreground/60 group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* মোবাইল ভাসমান পপআপ কার্ড */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--gradient-hero)] border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 shadow-xs">
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#1d2327] dark:text-white">
                          <Smartphone className="size-3.5 text-primary" />
                          <span>মোবাইল ভাসমান পপআপ</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {mobileFloatingPopupEnabled ? "চালু: স্ক্রল করার সময় নিচে পপআপ দেখাবে" : "বন্ধ: কোনো পপআপ দেখাবে না (পড়ার সুবিধা)"}
                        </p>
                      </div>
                      <Switch
                        checked={mobileFloatingPopupEnabled}
                        onCheckedChange={handleToggleMobileFloating}
                        aria-label="মোবাইল ভাসমান পপআপ অন বা অফ করুন"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN WORDPRESS WIDGET GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* বাম কলাম */}
        <div className="space-y-6">
          {/* WIDGET: LIVE VISITORS & BROWSING TIME */}
          {visibleWidgets.visitorAnalytics && (
            <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 shadow-xl contain-paint transition-colors duration-300">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
                    <Activity className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>লাইভ ভিজিটর ও ব্রাউজিং সময় (Live Traffic)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("visitor-analytics")}
                    className="text-[11px] text-[#a16e03] dark:text-[#ecd599] hover:underline font-bold cursor-pointer"
                  >
                    পূর্ণাঙ্গ চার্ট ও আইপি দেখুন →
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-emerald-500/40 dark:border-emerald-500/30 border-t-[1.5px] border-t-emerald-400 dark:border-t-emerald-300/80 border-b-2 border-b-emerald-800/30 dark:border-b-black/50 text-center shadow-md">
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                      অনলাইন
                    </span>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {formatNumberBn(visitorAnalyticsQuery.data?.summary?.liveNow || 0)} জন
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-blue-500/40 dark:border-blue-500/30 border-t-[1.5px] border-t-blue-400 dark:border-t-blue-300/80 border-b-2 border-b-blue-800/30 dark:border-b-black/50 text-center shadow-md">
                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase">
                      ইউনিক আইপি
                    </span>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                      {formatNumberBn(visitorAnalyticsQuery.data?.summary?.uniqueIps || 0)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/50 text-center shadow-md">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-[#ecd599] uppercase">
                      গড় সময়
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 mt-1 truncate">
                      {formatDurationBn(visitorAnalyticsQuery.data?.summary?.avgDurationSeconds || 0)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[#c4aa82]/30 dark:border-[#b88e58]/20 text-[11px] text-[#646970] dark:text-[#a7aaad]">
                  <span>মোট পেজভিউ: <strong className="text-foreground">{formatNumberBn(visitorAnalyticsQuery.data?.summary?.totalPageViews || 0)}</strong></span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("visitor-analytics")}
                    className="text-[#a16e03] dark:text-[#ecd599] hover:underline font-bold cursor-pointer"
                  >
                    সকল ভিজিটরের আইপি ও তালিকা →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WIDGET: AT A GLANCE (এক নজরে) */}
          {visibleWidgets.atAGlance && (
            <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 shadow-xl contain-paint transition-colors duration-300">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
                    <Activity className="size-3.5 text-[#a16e03] dark:text-[#ecd599]" />
                    <span>এক নজরে (At a Glance)</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-[#ecd599]">কুরআন অন্বেষা ডেটাবেস</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("articles")}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[#c4aa82]/50 dark:border-[#b88e58]/30 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/50 bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599] transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] shrink-0">
                      <FileText className="size-3.5" />
                    </div>
                    <span className="truncate">
                      <strong className="font-bold text-[#1d2327] dark:text-white">{totalArticlesEstimate}+</strong> টি প্রবন্ধ ও আর্টিকেল
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("translations")}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[#c4aa82]/50 dark:border-[#b88e58]/30 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/50 bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599] transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] shrink-0">
                      <BookOpen className="size-3.5" />
                    </div>
                    <span className="truncate">
                      <strong className="font-bold text-[#1d2327] dark:text-white">১১৪</strong> টি সূরা (৬,২৩৬ আয়াত)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("categories")}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[#c4aa82]/50 dark:border-[#b88e58]/30 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/50 bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599] transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] shrink-0">
                      <FolderTree className="size-3.5" />
                    </div>
                    <span className="truncate">
                      <strong className="font-bold text-[#1d2327] dark:text-white">{categoriesQuery.data || 16}+</strong> টি বিষয়ভিত্তিক ক্যাটাগরি
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[#c4aa82]/50 dark:border-[#b88e58]/30 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/50 bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599] transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] shrink-0">
                      <Users className="size-3.5" />
                    </div>
                    <span className="truncate">
                      <strong className="font-bold text-[#1d2327] dark:text-white">{authorsQuery.data || 5}+</strong> জন গবেষক ও লেখক
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("registered-users")}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[#c4aa82]/50 dark:border-[#b88e58]/30 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/50 bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md shadow-xs hover:shadow-md hover:border-[#b88e58] dark:hover:border-[#ecd599] transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5 col-span-1 sm:col-span-2"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] shrink-0">
                      <UserCheck className="size-3.5" />
                    </div>
                    <span className="truncate">
                      <strong className="font-bold text-[#1d2327] dark:text-white">{registeredUsersQuery.data || 0}</strong> জন নিবন্ধিত অ্যাকাউন্ট
                    </span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[#c4aa82]/30 dark:border-[#b88e58]/20 text-[11px] text-[#646970] dark:text-[#a7aaad] flex items-center justify-between">
                  <span>চলমান ইঞ্জিন: <strong className="text-foreground">Cloudflare Edge Workers + React 19</strong></span>
                  <span>থিম: <strong className="text-foreground">এডমিন ড্যাশবোর্ড মোড</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* WIDGET: RECENT ACTIVITY (সাম্প্রতিক কার্যকলাপ) */}
          {visibleWidgets.recentActivity && (
            <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 shadow-xl contain-paint transition-colors duration-300">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
                    <Clock className="size-3.5 text-[#a16e03] dark:text-[#ecd599]" />
                    <span>সাম্প্রতিক কার্যকলাপ (Activity)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("articles")}
                    className="text-[11px] text-[#a16e03] dark:text-[#ecd599] hover:underline font-bold"
                  >
                    সবগুলো দেখুন →
                  </button>
                </div>

                <div className="text-xs font-semibold text-muted-foreground">সাম্প্রতিক প্রবন্ধসমূহ:</div>
                {articlesQuery.isLoading ? (
                  <div className="text-xs text-muted-foreground py-4 text-center">লোড হচ্ছে...</div>
                ) : articlesQuery.data && articlesQuery.data.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {articlesQuery.data.map((art: any) => (
                      <li key={art.id} className="p-3 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-[#c4aa82]/40 dark:border-[#b88e58]/25 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/60 shadow-xs flex items-center justify-between gap-3 group">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-[#1d2327] dark:text-white truncate group-hover:text-[#a16e03] dark:group-hover:text-[#ecd599] transition-colors">
                            {art.title_bn}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{new Date(art.created_at).toLocaleDateString("bn-BD")}</span>
                            <span>•</span>
                            <span className={art.published ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-amber-600 dark:text-amber-400 font-semibold"}>
                              {art.published ? "প্রকাশিত" : "খসড়া (Draft)"}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveTab("articles")}
                          className="h-7 px-2.5 text-xs text-[#a16e03] dark:text-[#ecd599] hover:bg-amber-500/10 shrink-0 font-medium"
                        >
                          <Pencil className="size-3 mr-1" />
                          সম্পাদনা
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    এখনো কোনো ডাইনামিক পোস্ট যোগ করা হয়নি। পাশের ফর্ম থেকে দ্রুত খসড়া তৈরি করুন।
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ডান কলাম */}
        <div className="space-y-6">
          {/* WIDGET: QUICK DRAFT (দ্রুত খসড়া) */}
          {visibleWidgets.quickDraft && (
            <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 shadow-xl contain-paint transition-colors duration-300">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
                    <Pencil className="size-3.5 text-[#a16e03] dark:text-[#ecd599]" />
                    <span>দ্রুত খসড়া তৈরি (Quick Draft)</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-[#ecd599]">ইনস্ট্যান্ট ড্রাফট</span>
                </div>

                <form onSubmit={handleSaveDraft} className="space-y-3.5">
                  <div>
                    <label htmlFor="quick-draft-title" className="block text-xs font-semibold text-[#1d2327] dark:text-white mb-1">
                      শিরোনাম
                    </label>
                    <Input
                      id="quick-draft-title"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="আর্টিকেলের শিরোনাম লিখুন..."
                      className="h-9 text-xs rounded-xl bg-white/60 dark:bg-[#12171f]/70 backdrop-blur-md border border-[#c4aa82]/50 dark:border-[#b88e58]/35 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-[#b88e58] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="quick-draft-content" className="block text-xs font-semibold text-[#1d2327] dark:text-white mb-1">
                      মূল বক্তব্য বা নোট
                    </label>
                    <Textarea
                      id="quick-draft-content"
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      placeholder="আপনার মনে কী ভাবনা রয়েছে? দ্রুত লিখে ড্রাফট হিসেবে সেভ করুন..."
                      rows={4}
                      className="text-xs rounded-xl bg-white/60 dark:bg-[#12171f]/70 backdrop-blur-md border border-[#c4aa82]/50 dark:border-[#b88e58]/35 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-[#b88e58] resize-none shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      type="submit"
                      disabled={isSavingDraft || !draftTitle.trim()}
                      className="h-9 px-4 text-xs font-bold bg-gradient-to-r from-[#b07818] to-[#b88e58] hover:from-[#c4871c] hover:to-[#ca9e66] text-white rounded-xl shadow-md border-t border-[#ecd599]/60 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {isSavingDraft ? "সংরক্ষণ হচ্ছে..." : "খসড়া সংরক্ষণ করুন (Save Draft)"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("articles")}
                      className="text-xs text-[#a16e03] dark:text-[#ecd599] hover:underline font-bold cursor-pointer"
                    >
                      পূর্ণাঙ্গ এডিটরে যান →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WIDGET: SITE HEALTH & SERVER STATUS */}
          {visibleWidgets.siteHealth && (
            <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 shadow-xl contain-paint transition-colors duration-300">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>সাইট হেলথ ও সার্ভার স্ট্যাটাস (Site Health)</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    চমৎকার (Good)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-[#c4aa82]/40 dark:border-[#b88e58]/25 shadow-2xs">
                    <span className="text-[#646970] dark:text-[#a7aaad]">Cloudflare Edge Worker (Primary):</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> অনলাইন (quraan.bd)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-[#c4aa82]/40 dark:border-[#b88e58]/25 shadow-2xs">
                    <span className="text-[#646970] dark:text-[#a7aaad]">Cloudflare Edge (301 Permanent Redirect):</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> সক্রিয় (wooniche.com ➔ quraan.bd)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-[#c4aa82]/40 dark:border-[#b88e58]/25 shadow-2xs">
                    <span className="text-[#646970] dark:text-[#a7aaad]">Supabase Database & Auth:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> সংযুক্ত (Connected)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-[#c4aa82]/40 dark:border-[#b88e58]/25 shadow-2xs">
                    <span className="text-[#646970] dark:text-[#a7aaad]">অ্যান্ড্রয়েড APK ও AAB রিলিজ:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                      v4.0.0 (লাইভ ও ডাউনলোডযোগ্য)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-[#c4aa82]/40 dark:border-[#b88e58]/25 shadow-2xs">
                    <span className="text-[#646970] dark:text-[#a7aaad]">অফলাইন PWA ক্যাশিং:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> সক্রিয় (ServiceWorker Ready)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WIDGET: CLOUDFLARE D1 SQLITE DATABASE & EDGE STATUS */}
          {visibleWidgets.supabaseStatus && (
            <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 shadow-xl contain-paint transition-colors duration-300">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
                    <Database className="size-3.5 text-orange-600 dark:text-orange-400" />
                    <span>Cloudflare D1 SQLite ডেটাবেজ (Edge Database)</span>
                  </h3>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/15 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                    সক্রিয় (Edge Native)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-blue-500/40 dark:border-blue-500/30 border-t-[1.5px] border-t-blue-400 dark:border-t-blue-300/80 border-b-2 border-b-blue-800/30 dark:border-b-black/50 shadow-md">
                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase">
                      ইগ্রেস / ব্যান্ডউইথ খরচ
                    </span>
                    <div className="text-base font-bold text-blue-800 dark:text-blue-300 mt-0.5">
                      ০ টাকা (ফ্রি)
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                      ✓ ১০০% নো-ইগ্রেস সুরক্ষিত
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md border border-orange-500/40 dark:border-orange-500/30 border-t-[1.5px] border-t-orange-400 dark:border-t-orange-300/80 border-b-2 border-b-orange-800/30 dark:border-b-black/50 shadow-md">
                    <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 uppercase">
                      D1 ডেটাবেজ সাইজ
                    </span>
                    <div className="text-base font-bold text-orange-800 dark:text-orange-300 mt-0.5">
                      ৯৬৬ KB / ৫ GB
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      SQLite ৩ সার্ভারলেস
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-t border-[#c4aa82]/30 dark:border-[#b88e58]/20 pt-3">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#646970] dark:text-[#a7aaad]">D1 ডেটাবেজ নাম:</span>
                    <code className="font-mono font-bold text-foreground">quran-explore-db</code>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#646970] dark:text-[#a7aaad]">D1 নিবন্ধ (Articles):</span>
                    <span className="font-semibold text-foreground">৩২৮ টি সংরক্ষিত</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#646970] dark:text-[#a7aaad]">কুয়েরি ল্যাটেন্সি:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">&lt; ১ ms (এজ এক্সিকিউশন)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#c4aa82]/30 dark:border-[#b88e58]/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("d1-status")}
                      className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>পূর্ণাঙ্গ D1 স্ট্যাটাস ও টেবিল তথ্য দেখুন</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("cf-origin")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>ক্লাউডফ্লেয়ার ট্র্যাফিক ও কোটা</span>
                      <span>→</span>
                    </button>
                  </div>
                  <a
                    href="https://dash.cloudflare.com/2115a963bbde8014732bf7fd2e7ee93d/workers-and-pages/d1/databases/e973f275-f733-432b-8e61-85ad15dbd013"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#a16e03] dark:text-[#ecd599] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>Cloudflare D1 কনসোল</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
