import { GoogleSearchConsolePerformance } from "@/components/GoogleSearchConsolePerformance";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Calendar,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  Shield,
  ShieldCheck,
  UserX,
  Bold,
  Italic,
  List,
  Quote,
  Copy,
  Check,
  Users,
  FolderTree,
  Menu as MenuIcon,
  Globe,
  Mail,
  RefreshCw,
  ExternalLink,
  LogOut,
  ChevronRight,
  Save,
  Download,
  Upload,
  FileCode,
  CheckCircle2,
  X,
  Loader2,
  CheckSquare,
  Square,
  RotateCcw,
  SlidersHorizontal,
  Sliders,
  Tag as TagIcon,
  Sparkles,
  BookOpen,
  Gauge,
  Pin,
  Palette,
  Wrench,
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ArrowLeft,
  Home,
  Layers,
  Activity,
  Smartphone,
  Cloud,
  Database,
  PenTool,
  Lock,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { bnToEnSlug, generateEnglishSlug, cleanEnglishSlug } from "@/lib/slugHelper";
import { generateTagSlug } from "@/lib/tagHelper";
import { formatArticleContent } from "@/lib/contentFormatter";
import { translateFullArticle } from "@/lib/articleTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession, signOutFast, getStoredAuthToken } from "@/lib/auth";
import { STATIC_ARTICLES_META } from "@/lib/staticArticlesMeta";
import { PRECOMPILED_DB_SLUG_MAP } from "@/lib/precompiledDbSlugMap";
import { useCategories } from "@/lib/menu";
import { queuePendingSync, cacheDynamicArticles, getCachedDynamicArticles } from "@/lib/dualSupportSync";
import { useAppDesignSettings } from "@/lib/designSync";
import {
  getPermanentlyDeletedKeys,
  getTrashedArticleKeys,
  moveArticleToTrash,
  restoreArticleFromTrash,
  permanentlyDeleteArticle,
} from "@/lib/articleDeletion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { OfflineSyncAdmin } from "@/components/OfflineSyncAdmin";
import { AuthorsAdmin } from "@/components/AuthorsAdmin";
import { CategoriesAdmin } from "@/components/CategoriesAdmin";
import { TagsAdmin } from "@/components/TagsAdmin";
import { MenuAdmin } from "@/components/MenuAdmin";
import { PagesAdmin } from "@/components/PagesAdmin";
import { SocialLinksAdmin } from "@/components/SocialLinksAdmin";
import { NewsletterBroadcastModal } from "@/components/NewsletterBroadcastModal";
import { MessagesAdmin } from "@/components/MessagesAdmin";
import { AlamMDashboardOverview } from "@/components/admin/AlamMDashboardOverview";
import { WordPressSettingsAdmin } from "@/components/WordPressSettingsAdmin";
import { VisitorAnalyticsAdmin } from "@/components/VisitorAnalyticsAdmin";
import { SeoCenterAdmin } from "@/components/SeoCenterAdmin";
import { CloudflareD1StatusAdmin } from "@/components/CloudflareD1StatusAdmin";
import { CloudflareAnalyticsAdmin } from "@/components/CloudflareAnalyticsAdmin";
import { RegisteredUsersAdmin } from "@/components/RegisteredUsersAdmin";
import { PostsExportImportAdmin } from "@/components/PostsExportImportAdmin";
import { TwoFactorAdmin } from "@/components/TwoFactorAdmin";
import { QuranExplorerLogo } from "@/components/QuranExplorerLogo";
import { PageHeroBackground } from "@/components/PageHeroBackground";
import { ArticleDateTimeModal } from "@/components/admin/ArticleDateTimeModal";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminTabErrorBoundary } from "@/components/admin/AdminTabErrorBoundary";
import {
  toDateTimeLocalString,
  fromDateTimeLocalString,
  formatFullDateTimeBn,
} from "@/lib/dateUtils";
import {
  exportToWordPressXml,
  exportToJson,
  exportToCsv,
  exportToMarkdownZip,
  downloadFile,
  downloadBlob,
} from "@/lib/postExportImportEngine";
import {
  BANGLA_DISCLAIMER,
  ENGLISH_DISCLAIMER,
  parseArticleDisclaimer,
  injectArticleDisclaimer,
  stripArticleDisclaimerComment,
} from "@/components/ArticleDisclaimerBox";


function AdminRouteErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center shadow-lg space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-base font-bold text-foreground">অ্যাডমিন প্যানেলে সাময়িক সমস্যা হয়েছে</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {error?.message || "পোস্ট এডিটর বা প্যানেলটি লোড করতে সমস্যা হয়েছে। দয়া করে ক্যাশ ক্লিয়ার করে পুনরায় চেষ্টা করুন।"}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button size="sm" onClick={() => reset()} className="text-xs">
            পুনরায় চেষ্টা করুন
          </Button>
          <Button size="sm" variant="outline" asChild className="text-xs">
            <a href="/admin">ড্যাশবোর্ডে ফিরুন</a>
          </Button>
          <Button size="sm" variant="ghost" asChild className="text-xs">
            <a href="/">ওয়েবসাইটে যান</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: typeof search.tab === "string" ? search.tab : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "অ্যাডমিন ড্যাশবোর্ড — Alam M" },
      { name: "description", content: "সাহিত্যকর্ম ও কনটেন্ট ব্যবস্থাপনা প্যানেল।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: AdminRouteErrorComponent,
  component: AdminPage,
});

/* ========================================================================== */
/* ADVANCED IMPORT MODAL WITH AUTO-CREATE AUTHORS & CATEGORIES                */
/* ========================================================================== */
function InlineImportModal({
  type,
  onClose,
}: {
  type: "wordpress" | "blogger";
  onClose: () => void;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const categories = useCategories();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [importOptions, setImportOptions] = useState({
    keepPermalink: true,
    keepAuthor: true,
    keepCategory: true,
    keepTags: true,
    keepCoverImage: true,
    keepDateAndStatus: true,
  });

  const [fallbackAuthorId, setFallbackAuthorId] = useState<string>("");
  const [fallbackCategoryId, setFallbackCategoryId] = useState<string>("");

  const authors = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/authors");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            return json;
          }
        }
      } catch {}
      const { data, error } = await supabase.from("authors").select("id, name_bn, name_en").order("name_bn");
      if (error) return [];
      return data || [];
    },
  });

  const generateSlug = (title: string, fallback: string) => {
    return bnToEnSlug(title, fallback);
  };

  const extractFirstImage = (htmlContent: string) => {
    const match = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("অনুগ্রহ করে একটি XML ফাইল নির্বাচন করুন");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) throw new Error("XML ফাইলটি সঠিক নয় বা ক্ষতিগ্রস্থ।");

      const dbAuthors = authors.data || [];
      const dbCategories = categories.data || [];

      // ১. ক্যাটাগরি ও লেখক সংগ্রহ
      const detectedCategories = new Set<string>();
      const detectedAuthors = new Set<string>();

      if (type === "wordpress") {
        xmlDoc.querySelectorAll("item").forEach((item) => {
          item.querySelectorAll('category[domain="category"]').forEach((el) => {
            const val = el.textContent?.trim();
            if (val && val !== "Uncategorized") detectedCategories.add(val);
          });
          const creator = item.getElementsByTagNameNS("*", "creator")[0]?.textContent?.trim();
          if (creator) detectedAuthors.add(creator);
        });
      } else if (type === "blogger") {
        xmlDoc.querySelectorAll("entry").forEach((entry) => {
          entry.querySelectorAll('category[scheme="http://www.blogger.com/atom/ns#"]').forEach((el) => {
            const term = el.getAttribute("term");
            if (term && !term.includes("#")) detectedCategories.add(term.trim());
          });
          const aName = entry.querySelector("author > name")?.textContent?.trim();
          if (aName) detectedAuthors.add(aName);
        });
      }

      // ২. ক্যাটাগরি ম্যাপিং ও অটো-ইনসার্ট
      const categoryMap = new Map<string, string>();
      dbCategories.forEach((c) => {
        categoryMap.set(c.name_bn.toLowerCase(), c.id);
        if (c.name_en) categoryMap.set(c.name_en.toLowerCase(), c.id);
      });

      if (importOptions.keepCategory && detectedCategories.size > 0) {
        for (const catName of detectedCategories) {
          if (!categoryMap.has(catName.toLowerCase())) {
            const catSlug = generateSlug(catName, "cat");
            const { data: newCat } = await supabase
              .from("categories")
              .insert({
                name_bn: catName,
                name_en: catName,
                slug: catSlug,
                show_in_menu: false,
                sort_order: 10,
              })
              .select("id, name_bn")
              .maybeSingle();

            if (newCat) {
              categoryMap.set(newCat.name_bn.toLowerCase(), newCat.id);
            }
          }
        }
      }

      // ৩. লেখক ম্যাপিং ও অটো-ইনসার্ট
      const authorMap = new Map<string, string>();
      dbAuthors.forEach((a) => {
        authorMap.set(a.name_bn.toLowerCase(), a.id);
        if (a.name_en) authorMap.set(a.name_en.toLowerCase(), a.id);
      });

      if (importOptions.keepAuthor && detectedAuthors.size > 0) {
        for (const authName of detectedAuthors) {
          if (!authorMap.has(authName.toLowerCase())) {
            const { data: newAuth } = await supabase
              .from("authors")
              .insert({
                name_bn: authName,
                name_en: authName,
                bio_bn: "লেখক ও গবেষক",
                bio_en: "Author & Contributor",
              })
              .select("id, name_bn")
              .maybeSingle();

            if (newAuth) {
              authorMap.set(newAuth.name_bn.toLowerCase(), newAuth.id);
            }
          }
        }
      }

      // ৪. আর্টিকেল প্রসেস ও ইনসার্ট
      const articlesToInsert: any[] = [];

      if (type === "wordpress") {
        const items = xmlDoc.querySelectorAll("item");
        items.forEach((item, index) => {
          const postType = item.querySelector("post_type")?.textContent || "post";
          const status = item.querySelector("status")?.textContent || "publish";

          if (postType === "post" || postType === "") {
            const title = item.querySelector("title")?.textContent || "শিরোনামহীন পোস্ট";
            const content =
              item.getElementsByTagNameNS("*", "encoded")[0]?.textContent ||
              item.querySelector("content")?.textContent ||
              "";
            const postDate = item.querySelector("post_date")?.textContent || new Date().toISOString();
            const postName = item.querySelector("post_name")?.textContent;
            const creator = item.getElementsByTagNameNS("*", "creator")[0]?.textContent?.trim() || "";

            const categoryElements = item.querySelectorAll('category[domain="category"]');
            const tagElements = item.querySelectorAll('category[domain="post_tag"]');

            const rawCategory = categoryElements.length > 0 ? categoryElements[0].textContent?.trim() : "";
            const rawTags: string[] = [];
            tagElements.forEach((t) => {
              if (t.textContent) rawTags.push(t.textContent.trim());
            });

            let resolvedAuthorId = fallbackAuthorId || null;
            if (importOptions.keepAuthor && creator && authorMap.has(creator.toLowerCase())) {
              resolvedAuthorId = authorMap.get(creator.toLowerCase()) || null;
            }

            let resolvedCategoryId = fallbackCategoryId || null;
            if (importOptions.keepCategory && rawCategory && categoryMap.has(rawCategory.toLowerCase())) {
              resolvedCategoryId = categoryMap.get(rawCategory.toLowerCase()) || null;
            }

            const cleanExcerpt = content.replace(/<[^>]*>?/gm, "").slice(0, 160);

            articlesToInsert.push({
              title_bn: title,
              title_en: title,
              slug: importOptions.keepPermalink && postName ? postName : generateSlug(title, String(index)),
              content_bn: content,
              content_en: content,
              excerpt_bn: cleanExcerpt.trim(),
              excerpt_en: cleanExcerpt.trim(),
              cover_image_url: importOptions.keepCoverImage ? extractFirstImage(content) : null,
              author_id: resolvedAuthorId,
              category_id: resolvedCategoryId,
              tags: importOptions.keepTags ? rawTags : [],
              published: importOptions.keepDateAndStatus ? status === "publish" : true,
              published_at: importOptions.keepDateAndStatus ? new Date(postDate).toISOString() : new Date().toISOString(),
              created_by: user!.id,
              deleted_at: null,
            });
          }
        });
      } else if (type === "blogger") {
        const entries = xmlDoc.querySelectorAll("entry");
        entries.forEach((entry, index) => {
          const idText = entry.querySelector("id")?.textContent || "";
          if (idText.includes(".post-") || entry.querySelector('category[term*="#post"]')) {
            const title = entry.querySelector("title")?.textContent || "শিরোনামহীন পোস্ট";
            const content = entry.querySelector("content")?.textContent || "";
            const publishedAt = entry.querySelector("published")?.textContent || new Date().toISOString();
            const authorName = entry.querySelector("author > name")?.textContent?.trim() || "";
            const draftElement = entry.querySelector("app\\:control > app\\:draft, draft");
            const isDraft = draftElement?.textContent === "yes";

            const categoryElements = entry.querySelectorAll('category[scheme="http://www.blogger.com/atom/ns#"]');
            const rawTags: string[] = [];
            categoryElements.forEach((cat) => {
              const term = cat.getAttribute("term");
              if (term && !term.includes("#")) rawTags.push(term.trim());
            });

            let resolvedCategoryId = fallbackCategoryId || null;
            if (importOptions.keepCategory && rawTags.length > 0) {
              const firstLabel = rawTags[0];
              if (categoryMap.has(firstLabel.toLowerCase())) {
                resolvedCategoryId = categoryMap.get(firstLabel.toLowerCase()) || null;
              }
            }

            let resolvedAuthorId = fallbackAuthorId || null;
            if (importOptions.keepAuthor && authorName && authorMap.has(authorName.toLowerCase())) {
              resolvedAuthorId = authorMap.get(authorName.toLowerCase()) || null;
            }

            const cleanExcerpt = content.replace(/<[^>]*>?/gm, "").slice(0, 160);

            articlesToInsert.push({
              title_bn: title,
              title_en: title,
              slug: generateSlug(title, String(index)),
              content_bn: content,
              content_en: content,
              excerpt_bn: cleanExcerpt.trim(),
              excerpt_en: cleanExcerpt.trim(),
              cover_image_url: importOptions.keepCoverImage ? extractFirstImage(content) : null,
              author_id: resolvedAuthorId,
              category_id: resolvedCategoryId,
              tags: importOptions.keepTags ? rawTags : [],
              published: importOptions.keepDateAndStatus ? !isDraft : true,
              published_at: importOptions.keepDateAndStatus ? new Date(publishedAt).toISOString() : new Date().toISOString(),
              created_by: user!.id,
              deleted_at: null,
            });
          }
        });
      }

      if (articlesToInsert.length === 0) throw new Error("ফাইলটিতে কোনো পোস্ট পাওয়া যায়নি।");

      // ১. Cloudflare D1 এজ-এ সংরক্ষণ (Edge-First)
      const token = getStoredAuthToken();
      for (const item of articlesToInsert) {
        try {
          await fetch("/api/public/articles", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({
              action: "save",
              ...item,
            }),
          });
        } catch {}
      }

      // ২. সুপাবেস মিরর (ঐচ্ছিক ব্যাকআপ)
      try {
        await supabase.from("articles").insert(articlesToInsert);
      } catch {}

      setImportedCount(articlesToInsert.length);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["authors-all"] });
      queryClient.invalidateQueries({ queryKey: ["authors-directory-list"] });
      toast.success(`${articlesToInsert.length}টি পোস্ট, লেখক ও ক্যাটাগরি সফলভাবে ইমপোর্ট হয়েছে!`);
    } catch (err: any) {
      setErrorMsg(err.message || "ইমপোর্ট করার সময় সমস্যা হয়েছে");
      toast.error(err.message || "ইমপোর্ট ব্যর্থ হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="size-5 text-[#2271b1]" />
            <h3 className="font-bold text-sm text-foreground">
              {type === "wordpress" ? "ওয়ার্ডপ্রেস (WordPress) থেকে পোস্ট ইমপোর্ট" : "ব্লগার (Blogger) থেকে পোস্ট ইমপোর্ট"}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        {importedCount !== null ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
            <p className="font-semibold text-sm text-foreground">
              {importedCount} টি পোস্ট সফলভাবে ইমপোর্ট করা হয়েছে!
            </p>
            <Button onClick={onClose} className="bg-[#2271b1] text-white text-xs cursor-pointer">
              ঠিক আছে
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-border p-5 text-center bg-muted/20">
              <Upload className="mx-auto size-7 text-muted-foreground/60 mb-2" />
              <label htmlFor="xml-upload-modal" className="cursor-pointer block text-xs font-semibold text-[#2271b1] hover:underline">
                XML ফাইল সিলেক্ট করুন
              </label>
              <input
                id="xml-upload-modal"
                type="file"
                accept=".xml"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {file ? file.name : type === "wordpress" ? "WordPress Export .xml ফাইল" : "Blogger Backup .xml ফাইল"}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-4 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground border-b border-border/40 pb-1.5">
                <SlidersHorizontal className="size-3.5 text-[#2271b1]" />
                <span>ইমপোর্ট সেটিংস ও ফিল্ড নির্বাচন:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.keepPermalink}
                    onChange={(e) => setImportOptions({ ...importOptions, keepPermalink: e.target.checked })}
                    className="rounded accent-[#2271b1] size-3.5"
                  />
                  <span>আসল পার্মালিঙ্ক / স্লাগ রাখুন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.keepAuthor}
                    onChange={(e) => setImportOptions({ ...importOptions, keepAuthor: e.target.checked })}
                    className="rounded accent-[#2271b1] size-3.5"
                  />
                  <span>লেখক স্বয়ংক্রিয় তৈরি ও ম্যাচ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.keepCategory}
                    onChange={(e) => setImportOptions({ ...importOptions, keepCategory: e.target.checked })}
                    className="rounded accent-[#2271b1] size-3.5"
                  />
                  <span>ক্যাটাগরি স্বয়ংক্রিয় তৈরি ও ম্যাচ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.keepTags}
                    onChange={(e) => setImportOptions({ ...importOptions, keepTags: e.target.checked })}
                    className="rounded accent-[#2271b1] size-3.5"
                  />
                  <span>ট্যাগসমূহ (Tags) ইমপোর্ট করুন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.keepCoverImage}
                    onChange={(e) => setImportOptions({ ...importOptions, keepCoverImage: e.target.checked })}
                    className="rounded accent-[#2271b1] size-3.5"
                  />
                  <span>প্রথম ছবি কভার হিসেবে নিন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.keepDateAndStatus}
                    onChange={(e) => setImportOptions({ ...importOptions, keepDateAndStatus: e.target.checked })}
                    className="rounded accent-[#2271b1] size-3.5"
                  />
                  <span>আসল প্রকাশের তারিখ ও স্ট্যাটাস</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">ডিফল্ট লেখক (যদি না মিলে):</label>
                  <select
                    value={fallbackAuthorId}
                    onChange={(e) => setFallbackAuthorId(e.target.value)}
                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                  >
                    <option value="">কোনো নির্দিষ্ট লেখক নেই</option>
                    {authors.data?.map((a) => (
                      <option key={a.id} value={a.id}>{a.name_bn}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">ডিফল্ট ক্যাটাগরি (যদি না মিলে):</label>
                  <select
                    value={fallbackCategoryId}
                    onChange={(e) => setFallbackCategoryId(e.target.value)}
                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                  >
                    <option value="">কোনো ক্যাটাগরি নেই</option>
                    {categories.data?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_bn}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
                বাতিল
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!file || isProcessing}
                onClick={handleImport}
                className="bg-[#2271b1] hover:bg-[#135e96] text-white text-xs cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" /> ইমপোর্ট হচ্ছে...
                  </>
                ) : (
                  "ইমপোর্ট শুরু করুন"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* DUAL-MODE RICH TEXT EDITOR (DIRECTLY IMPORTED)                             */
/* ========================================================================== */



/* ========================================================================== */

/* ========================================================================== */
/* MAIN ALAM M LITERARY ADMIN DASHBOARD PAGE                                 */
/* ========================================================================== */
function AdminPage() {
  const { user, loading } = useSession();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(search?.tab || "dashboard");
  const [importModalType, setImportModalType] = useState<"wordpress" | "blogger" | null>(null);

  // Safety fallback: prevent admin loading spinner from hanging indefinitely
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimedOut(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      setUserDropdown(false);
      await signOutFast(queryClient);
      toast.success("লগআউট সফল হয়েছে");
      navigate({ to: "/auth" });
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/auth";
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("alam_admin_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [purgingCfHeader, setPurgingCfHeader] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("alam_admin_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const handleHeaderPurgeCloudflare = async () => {
    if (purgingCfHeader) return;
    setPurgingCfHeader(true);
    try {
      let responseMessage = "ক্লাউডফ্লেয়ার এজ ও অ্যাপ ক্যাশ সফলভাবে ক্লিয়ার হয়েছে!";
      try {
        const res = await fetch("/api/admin/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cloudflare_purge" }),
        });
        const data = await res.json();
        if (data?.message) {
          responseMessage = data.message;
        }
      } catch {
        // Fallback
      }
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        } catch {}
      }
      await queryClient.invalidateQueries();
      toast.success(responseMessage);
    } catch (err: any) {
      toast.error(err?.message || "ক্যাশ ক্লিয়ার ব্যর্থ হয়েছে");
    } finally {
      setPurgingCfHeader(false);
    }
  };

  useEffect(() => {
    if (search?.tab) {
      setActiveTab(search.tab);
    }
  }, [search?.tab]);

  // Unread messages count for Top Bar badge
  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ["admin-unread-messages-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  // Live visitors count for Navigation Menu badge
  const { data: liveVisitorsCount = 0 } = useQuery({
    queryKey: ["admin-live-visitors-count"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/analytics?timeframe=today");
        if (!res.ok) return 0;
        const data = await res.json();
        return data?.summary?.liveNow || 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 20000,
  });

  // Articles count for sidebar badge
  const { data: articlesCount = 0 } = useQuery({
    queryKey: ["admin-sidebar-articles-count"],
    queryFn: async () => {
      const { count } = await supabase.from("articles").select("id", { count: "exact", head: true });
      const dbCount = count ?? 0;
      return dbCount > 0 ? dbCount : STATIC_ARTICLES_META.length;
    },
  });

  // Tailored, Clean Navigation Groups for Alam M (Personal Literary Blog)
  const adminNavSections = [
    {
      group: "ওভারভিউ ও ট্রাফিক",
      items: [
        {
          id: "dashboard",
          title: "ড্যাশবোর্ড",
          icon: Gauge,
          defaultTab: "dashboard",
          subItems: [
            { tab: "dashboard", label: "প্রধান ড্যাশবোর্ড" },
            { tab: "d1-status", label: "Cloudflare D1 ডেটাবেজ" },
            { tab: "offline", label: "অফলাইন সিঙ্ক ও ক্যাশ" },
          ],
        },
        {
          id: "analytics",
          title: "ভিজিটর ট্র্যাকিং",
          icon: Activity,
          defaultTab: "visitor-analytics",
          badge: liveVisitorsCount > 0 ? liveVisitorsCount : undefined,
          subItems: [
            { tab: "visitor-analytics", label: "লাইভ ভিজিটর ট্র্যাকিং" },
          ],
        },
        {
          id: "cloudflare",
          title: "ক্লাউড ট্রাফিক",
          icon: Cloud,
          defaultTab: "cloudflare-analytics",
          subItems: [
            { tab: "cloudflare-analytics", label: "এজ ট্রাফিক ও পারফরম্যান্স" },
          ],
        },
        {
          id: "seo",
          title: "এসইও ও সার্চ ইঞ্জিন",
          icon: Globe,
          defaultTab: "seo-center",
          subItems: [
            { tab: "seo-center", label: "সার্চ কনসোল ও সাইটম্যাপ" },
            { tab: "seo-gsc", label: "গুগল সার্চ পারফরম্যান্স" },
          ],
        },
      ],
    },
    {
      group: "সাহিত্য ও লেখালেখি",
      items: [
        {
          id: "articles-new",
          title: "নতুন পোস্ট লিখুন",
          icon: PenTool,
          defaultTab: "articles-new",
          subItems: [
            { tab: "articles-new", label: "নতুন সাহিত্যকর্ম তৈরি" },
          ],
        },
        {
          id: "articles",
          title: "সকল সাহিত্যকর্ম",
          icon: BookOpen,
          defaultTab: "articles",
          badge: articlesCount > 0 ? articlesCount : undefined,
          subItems: [
            { tab: "articles", label: "সকল লেখা ও ড্রাফট" },
            { tab: "categories", label: "সাহিত্য বিভাগসমূহ" },
            { tab: "tags", label: "ট্যাগসমূহ" },
          ],
        },
        {
          id: "categories",
          title: "সাহিত্য বিভাগ",
          icon: FolderTree,
          defaultTab: "categories",
          subItems: [
            { tab: "categories", label: "গল্প, কবিতা, স্মৃতিকথা" },
          ],
        },
        {
          id: "tags",
          title: "ট্যাগসমূহ",
          icon: TagIcon,
          defaultTab: "tags",
          subItems: [
            { tab: "tags", label: "সকল ট্যাগ" },
          ],
        },
        {
          id: "pages",
          title: "স্থির পেজসমূহ",
          icon: FileCode,
          defaultTab: "pages",
          subItems: [
            { tab: "pages", label: "আমার পাতা (About Me)" },
          ],
        },
      ],
    },
    {
      group: "পাঠক ও সংযোগ",
      items: [
        {
          id: "messages",
          title: "পাঠকদের বার্তা",
          icon: MessageSquare,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
          defaultTab: "messages",
          subItems: [
            { tab: "messages", label: "সকল বার্তা ও প্রতিক্রিয়া" },
          ],
        },
        {
          id: "subscribers",
          title: "নিউজলেটার গ্রাহক",
          icon: Mail,
          defaultTab: "subs",
          subItems: [
            { tab: "subs", label: "গ্রাহক তালিকা ও ব্রডকাস্ট" },
          ],
        },
        {
          id: "authors",
          title: "লেখক পরিচিতি",
          icon: Users,
          defaultTab: "authors",
          subItems: [
            { tab: "authors", label: "আলম এম. প্রোফাইল ও বায়ো" },
          ],
        },
      ],
    },
    {
      group: "সেটিংস ও সিস্টেম",
      items: [
        {
          id: "menu",
          title: "নেভিগেশন মেনু",
          icon: Palette,
          defaultTab: "menu",
          subItems: [
            { tab: "menu", label: "হেডার ও ফুটার মেনু" },
          ],
        },
        {
          id: "settings",
          title: "সাইট সেটিংস",
          icon: Settings,
          defaultTab: "settings-general",
          subItems: [
            { tab: "settings-general", label: "সাধারণ সেটিংস" },
            { tab: "settings-header-footer", label: "হেডার ও ফুটার কনফিগারেশন" },
            { tab: "settings-social", label: "সোশ্যাল শেয়ার সেটিংস" },
            { tab: "settings-offline", label: "ক্যাশ ও এজ কন্ট্রোল" },
            { tab: "2fa-security", label: "২-ফ্যাক্টর নিরাপত্তা" },
          ],
        },
        {
          id: "social",
          title: "সোশ্যাল মিডিয়া",
          icon: Share2,
          defaultTab: "social",
          subItems: [
            { tab: "social", label: "সামাজিক যোগাযোগ লিংক" },
          ],
        },
        {
          id: "import-export",
          title: "পোস্ট ব্যাকআপ",
          icon: Download,
          defaultTab: "import",
          subItems: [
            { tab: "import", label: "ইমপোর্ট ও এক্সপোর্ট" },
          ],
        },
        {
          id: "users",
          title: "ব্যবহারকারী ও রোল",
          icon: UserCheck,
          defaultTab: "registered-users",
          subItems: [
            { tab: "registered-users", label: "অ্যাকাউন্ট তালিকা" },
            { tab: "roles", label: "এডমিন রোল ও পারমিশন" },
          ],
        },
      ],
    },
  ];

  const tabTitleMap: Record<string, string> = {
    dashboard: "এডমিন ড্যাশবোর্ড ওভারভিউ",
    "visitor-analytics": "ভিজিটর ট্র্যাকিং ও অ্যানালিটিক্স",
    "cloudflare-analytics": "ক্লাউডফ্লেয়ার ট্রাফিক ও এজ পারফরম্যান্স",
    "cf-requests": "ক্লাউডফ্লেয়ার ট্রাফিক",
    "cf-visitors": "ক্লাউডফ্লেয়ার ভিজিটর অবস্থান",
    "cf-performance": "ক্লাউডফ্লেয়ার পারফরম্যান্স",
    "cf-security": "ক্লাউডফ্লেয়ার নিরাপত্তা",
    "cf-cache": "ক্লাউডফ্লেয়ার ক্যাশ ও ব্যান্ডউইথ",
    "cf-origin": "ক্লাউডফ্লেয়ার অরিজিন ও D1",
    "cf-dns": "ক্লাউডফ্লেয়ার ডিএনএস",
    "seo-center": "এসইও ও সার্চ ইঞ্জিন ম্যানেজমেন্ট",
    "seo-gsc": "গুগল সার্চ কনসোল পারফরম্যান্স",
    "articles-new": "নতুন সাহিত্যকর্ম লিখুন (Create New Post)",
    articles: "সাহিত্যকর্ম ও পোস্ট পরিচালনা",
    categories: "সাহিত্য বিভাগসমূহ (Categories)",
    tags: "ট্যাগসমূহ (Tags)",
    pages: "স্থির পেজসমূহ (Pages)",
    messages: "পাঠকদের বার্তা ও প্রতিক্রিয়া (Messages)",
    subs: "নিউজলেটার গ্রাহকবৃন্দ (Subscribers)",
    authors: "লেখক পরিচিতি ও প্রোফাইল (Authors)",
    posts: "লেখক পরিচিতি ও প্রোফাইল (Authors)",
    menu: "হেডার ও ফুটার মেনু (Menus)",
    social: "সোশ্যাল মিডিয়া প্রোফাইল লিংক",
    "settings-general": "সাধারণ সেটিংস (General Settings)",
    "settings-header-footer": "হেডার ও ফুটার সেটিংস (Header & Footer)",
    "settings-social": "সোশ্যাল মিডিয়া ও শেয়ার সেটিংস",
    "settings-reading": "পঠন ও রিডিং সেটিংস",
    "settings-offline": "ক্যাশ ও অফলাইন সেটিংস",
    "settings-discussion": "মন্তব্য ও যোগাযোগ সেটিংস",
    turnstile: "টার্নস্টাইল সিকিউরিটি কী",
    "2fa-security": "২-ফ্যাক্টর নিরাপত্তা (Google Authenticator)",
    "registered-users": "নিবন্ধিত অ্যাকাউন্ট তালিকা",
    roles: "অ্যাডমিন ও ইউজার রোল",
    "d1-status": "Cloudflare D1 ডেটাবেজ ও এজ স্ট্যাটাস",
    "supabase-status": "Cloudflare D1 ডেটাবেজ ও এজ স্ট্যাটাস",
    import: "পোস্ট ইমপোর্ট ও ব্যাকআপ",
    export: "পোস্ট এক্সপোর্ট",
    offline: "অফলাইন ডেটা সিঙ্ক ও ক্যাশ স্ট্যাটাস",
  };

  if (!authTimedOut && (loading || (user && roleLoading))) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">এডমিন ড্যাশবোর্ড লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Lock className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">অ্যাডমিন প্রবেশাধিকার সংরক্ষিত</h2>
            <p className="mt-1 text-xs text-muted-foreground">শুধুমাত্র অনুমোদিত অ্যাডমিন এই প্যানেলে প্রবেশ করতে পারবেন।</p>
          </div>
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/auth" search={{ redirect: "/admin" }}>লগইন করুন (Log In)</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased w-full max-w-full overflow-x-hidden">
      {importModalType && (
        <InlineImportModal type={importModalType} onClose={() => setImportModalType(null)} />
      )}

      {/* 1. TOP HEADER BAR */}
      <header className="sticky top-0 z-40 h-14 w-full border-b border-border/50 bg-card/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center size-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="মেনু টগল"
          >
            <MenuIcon className="size-5" />
          </button>

          {/* Logo & Brand */}
          <Link
            to="/admin"
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2 group select-none cursor-pointer"
            title="Alam M — এডমিন ড্যাশবোর্ড"
          >
            <QuranExplorerLogo size="xs" />
            <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ml-1">
              এডমিন কন্ট্রোল
            </span>
          </Link>

          {/* Visit Live Website */}
          <Link
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition-all hover:text-primary ml-2"
          >
            <Globe className="size-3.5 text-primary" />
            <span>ওয়েবসাইট দেখুন</span>
            <ExternalLink className="size-3 opacity-60" />
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Write Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveTab("articles-new")}
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <PenTool className="size-3.5" />
            <span className="hidden sm:inline">নতুন পোস্ট লিখুন</span>
          </Button>

          {/* Quick Purge Cache */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleHeaderPurgeCloudflare}
            disabled={purgingCfHeader}
            className="h-8 text-xs gap-1.5 border-border hover:bg-primary/10 hover:text-primary transition-all hidden md:inline-flex"
            title="ক্লাউডফ্লেয়ার এজ ও অ্যাপ ক্যাশ তাৎক্ষণিক ক্লিয়ার করুন"
          >
            <RefreshCw className={`size-3.5 ${purgingCfHeader ? "animate-spin text-primary" : ""}`} />
            <span>ক্যাশ ক্লিয়ার</span>
          </Button>

          {/* Messages icon with badge */}
          <button
            type="button"
            onClick={() => setActiveTab("messages")}
            className="relative size-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="পাঠকদের বার্তা"
          >
            <MessageSquare className="size-4" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-muted text-left transition-colors cursor-pointer"
            >
              <div className="size-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {user?.email?.split("@")[0] || "আলম এম."}
                </p>
                <p className="text-[10px] text-primary font-medium">অ্যাডমিন</p>
              </div>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>

            {userDropdown && (
              <div
                className="absolute right-0 top-10 w-56 rounded-xl border border-border bg-card p-2 shadow-xl z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setUserDropdown(false)}
              >
                <div className="p-2 border-b border-border/60">
                  <p className="font-semibold text-foreground truncate">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground">এডমিনিস্ট্রেটর অ্যাক্সেস</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("authors");
                    setUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors text-left"
                >
                  <Users className="size-3.5 text-primary" />
                  <span>লেখক প্রোফাইল</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("settings-general");
                    setUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors text-left"
                >
                  <Settings className="size-3.5 text-primary" />
                  <span>সাইট সেটিংস</span>
                </button>
                <div className="border-t border-border/60 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left font-medium"
                  >
                    <LogOut className="size-3.5" />
                    <span>লগআউট (Log Out)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: SIDEBAR + BODY */}
      <div className="flex min-h-[calc(100vh-56px)] w-full">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`shrink-0 border-r border-border/50 bg-card/60 backdrop-blur-md hidden md:flex flex-col justify-between transition-all duration-200 select-none ${
            isSidebarCollapsed ? "w-16 p-2" : "w-64 p-3"
          }`}
        >
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
            {adminNavSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 py-1">
                    {sec.group}
                  </p>
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isCurrent =
                    item.subItems.some((s) => s.tab === activeTab) ||
                    item.defaultTab === activeTab;
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setActiveTab(item.defaultTab)}
                        className={`w-full flex items-center transition-all duration-150 rounded-xl cursor-pointer ${
                          isSidebarCollapsed
                            ? "justify-center size-10 mx-auto"
                            : "justify-between px-3 py-2 text-xs"
                        } ${
                          isCurrent
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                        title={isSidebarCollapsed ? item.title : undefined}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`size-4 shrink-0 ${isCurrent ? "text-primary-foreground" : "text-primary/80"}`} />
                          {!isSidebarCollapsed && <span className="truncate">{item.title}</span>}
                        </div>
                        {!isSidebarCollapsed && typeof item.badge === "number" && item.badge > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none shadow-xs ${
                              isCurrent
                                ? "bg-primary-foreground text-primary"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Tooltip / Floating Menu on collapsed */}
                      {isSidebarCollapsed && (
                        <div className="absolute left-14 top-0 hidden group-hover:block w-44 rounded-xl border border-border bg-card p-1 shadow-xl z-50 text-xs">
                          <div className="px-2.5 py-1 font-bold text-foreground border-b border-border/40">
                            {item.title}
                          </div>
                          {item.subItems.map((sub, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => setActiveTab(sub.tab)}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-muted ${
                                activeTab === sub.tab ? "text-primary font-bold" : "text-muted-foreground"
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Collapse Toggle */}
          <div className="pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer ${
                isSidebarCollapsed ? "justify-center" : "justify-between"
              }`}
              title={isSidebarCollapsed ? "মেনু প্রসারিত করুন" : "মেনু সংকুচিত করুন"}
            >
              {!isSidebarCollapsed && <span>মেনু সংকুচিত করুন</span>}
              {isSidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-card text-foreground h-full overflow-y-auto flex flex-col justify-between z-10 border-r border-border shadow-2xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <QuranExplorerLogo size="xs" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="size-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1">
                {adminNavSections.map((sec, secIdx) => (
                  <div key={secIdx} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 py-1">
                      {sec.group}
                    </p>
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isCurrent =
                        item.subItems.some((s) => s.tab === activeTab) ||
                        item.defaultTab === activeTab;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.defaultTab);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                            isCurrent
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`size-4 ${isCurrent ? "text-primary-foreground" : "text-primary"}`} />
                            <span>{item.title}</span>
                          </div>
                          {typeof item.badge === "number" && item.badge > 0 && (
                            <span className="rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-bold text-white shadow-xs">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border/60 text-center text-xs text-muted-foreground">
                Alam M &bull; শব্দ আমার ক্যানভাস
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Active Tab Banner & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {tabTitleMap[activeTab] || "এডমিন ড্যাশবোর্ড"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                শব্দ আমার ক্যানভাস &bull; {activeTab === "dashboard" ? "ওভারভিউ ও কুইক কন্ট্রোল" : tabTitleMap[activeTab]}
              </p>
            </div>

            {(activeTab === "articles" || activeTab === "articles-new") && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportModalType("wordpress")}
                  className="h-8 text-xs gap-1.5"
                >
                  <Upload className="size-3.5" />
                  ইমপোর্ট
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("export")}
                  className="h-8 text-xs gap-1.5"
                >
                  <Download className="size-3.5" />
                  এক্সপোর্ট
                </Button>
                {activeTab === "articles" && (
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("articles-new")}
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer font-medium"
                  >
                    <PenTool className="size-3.5" />
                    + নতুন পোস্ট লিখুন
                  </Button>
                )}
                {activeTab === "articles-new" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("articles")}
                    className="h-8 text-xs gap-1.5 hover:bg-muted cursor-pointer font-medium"
                  >
                    <BookOpen className="size-3.5" />
                    পোস্ট তালিকা দেখুন
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* TABS CONTENT */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
              <AlamMDashboardOverview setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="visitor-analytics" className="mt-0 focus-visible:outline-none">
              <VisitorAnalyticsAdmin />
            </TabsContent>

            <TabsContent value="cloudflare-analytics" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="requests" onTabChange={() => {}} />
            </TabsContent>
            <TabsContent value="cf-requests" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="requests" onTabChange={() => {}} />
            </TabsContent>
            <TabsContent value="cf-visitors" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="visitors" onTabChange={() => {}} />
            </TabsContent>
            <TabsContent value="cf-performance" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="performance" onTabChange={() => {}} />
            </TabsContent>
            <TabsContent value="cf-security" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="security" onTabChange={() => {}} />
            </TabsContent>
            <TabsContent value="cf-cache" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="cache" onTabChange={() => {}} />
            </TabsContent>
            <TabsContent value="cf-origin" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="origin" onTabChange={() => {}} />
            </TabsContent>
            <TabsContent value="cf-dns" className="mt-0 focus-visible:outline-none">
              <CloudflareAnalyticsAdmin initialTab="dns" onTabChange={() => {}} />
            </TabsContent>

            <TabsContent value="seo-gsc" className="mt-0 focus-visible:outline-none">
              <div className="space-y-4">
                <GoogleSearchConsolePerformance />
              </div>
            </TabsContent>

            <TabsContent value="seo-center" className="mt-0 focus-visible:outline-none">
              <SeoCenterAdmin />
            </TabsContent>

            <TabsContent value="articles" className="mt-0 focus-visible:outline-none">
              <div id="article-editor-top">
                <AdminTabErrorBoundary fallbackTitle="সাহিত্যকর্ম তালিকা লোড করতে সমস্যা হয়েছে">
                  <ArticlesAdmin
                    initialView="list"
                    onOpenImport={(type) => setImportModalType(type)}
                    onGoToExport={() => setActiveTab("export")}
                    onNavigateToNewPost={() => setActiveTab("articles-new")}
                    onNavigateToList={() => setActiveTab("articles")}
                  />
                </AdminTabErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="articles-new" className="mt-0 focus-visible:outline-none">
              <div id="article-editor-new">
                <AdminTabErrorBoundary fallbackTitle="পোস্ট এডিটর লোড করতে সমস্যা হয়েছে">
                  <ArticlesAdmin
                    initialView="editor"
                    onOpenImport={(type) => setImportModalType(type)}
                    onGoToExport={() => setActiveTab("export")}
                    onNavigateToNewPost={() => setActiveTab("articles-new")}
                    onNavigateToList={() => setActiveTab("articles")}
                  />
                </AdminTabErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="import" className="mt-0 focus-visible:outline-none">
              <PostsExportImportAdmin
                initialSubTab="import"
                onNavigateToArticles={() => setActiveTab("articles")}
              />
            </TabsContent>

            <TabsContent value="export" className="mt-0 focus-visible:outline-none">
              <PostsExportImportAdmin
                initialSubTab="export"
                onNavigateToArticles={() => setActiveTab("articles")}
              />
            </TabsContent>

            <TabsContent value="authors" className="mt-0 focus-visible:outline-none">
              <div className="space-y-4">
                <div className="border-b border-border/50 pb-2">
                  <h2 className="text-base font-semibold">লেখক পরিচিতি ও প্রোফাইল</h2>
                  <p className="text-xs text-muted-foreground">
                    আলম এম. এর প্রোফাইল তথ্য, ছবি ও জীবনী পরিচালনা করুন।
                  </p>
                </div>
                <AuthorsAdmin />
              </div>
            </TabsContent>
            <TabsContent value="posts" className="mt-0 focus-visible:outline-none">
              <div className="space-y-4">
                <div className="border-b border-border/50 pb-2">
                  <h2 className="text-base font-semibold">লেখক পরিচিতি ও প্রোফাইল</h2>
                  <p className="text-xs text-muted-foreground">
                    আলম এম. এর প্রোফাইল তথ্য, ছবি ও জীবনী পরিচালনা করুন।
                  </p>
                </div>
                <AuthorsAdmin />
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-0 focus-visible:outline-none">
              <CategoriesAdmin />
            </TabsContent>

            <TabsContent value="tags" className="mt-0 focus-visible:outline-none">
              <TagsAdmin />
            </TabsContent>

            <TabsContent value="registered-users" className="mt-0 focus-visible:outline-none">
              <RegisteredUsersAdmin onGoToRoles={() => setActiveTab("roles")} />
            </TabsContent>

            <TabsContent value="roles" className="mt-0 focus-visible:outline-none">
              <RolesAdmin />
            </TabsContent>

            <TabsContent value="menu" className="mt-0 focus-visible:outline-none">
              <MenuAdmin />
            </TabsContent>

            <TabsContent value="pages" className="mt-0 focus-visible:outline-none">
              <PagesAdmin />
            </TabsContent>

            <TabsContent value="social" className="mt-0 focus-visible:outline-none">
              <SocialLinksAdmin />
            </TabsContent>

            <TabsContent value="settings-general" className="mt-0 focus-visible:outline-none">
              <WordPressSettingsAdmin initialSubTab="settings-general" setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="settings-header-footer" className="mt-0 focus-visible:outline-none">
              <WordPressSettingsAdmin initialSubTab="settings-header-footer" setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="settings-social" className="mt-0 focus-visible:outline-none">
              <WordPressSettingsAdmin initialSubTab="settings-social" setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="settings-reading" className="mt-0 focus-visible:outline-none">
              <WordPressSettingsAdmin initialSubTab="settings-reading" setActiveTab={setActiveTab} hideSubTabSelector={true} />
            </TabsContent>

            <TabsContent value="settings-offline" className="mt-0 focus-visible:outline-none">
              <WordPressSettingsAdmin initialSubTab="settings-offline" setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="settings-discussion" className="mt-0 focus-visible:outline-none">
              <WordPressSettingsAdmin initialSubTab="settings-discussion" setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="turnstile" className="mt-0 focus-visible:outline-none">
              <WordPressSettingsAdmin initialSubTab="turnstile" setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="2fa-security" className="mt-0 focus-visible:outline-none">
              <TwoFactorAdmin />
            </TabsContent>

            <TabsContent value="messages" className="mt-0 focus-visible:outline-none">
              <MessagesAdmin />
            </TabsContent>

            <TabsContent value="offline" className="mt-0 focus-visible:outline-none">
              <OfflineSyncAdmin onGoToCacheSettings={() => setActiveTab("settings-offline")} />
            </TabsContent>

            <TabsContent value="subs" className="mt-0 focus-visible:outline-none">
              <SubscribersAdmin />
            </TabsContent>

            <TabsContent value="d1-status" className="mt-0 focus-visible:outline-none">
              <CloudflareD1StatusAdmin />
            </TabsContent>
            <TabsContent value="supabase-status" className="mt-0 focus-visible:outline-none">
              <CloudflareD1StatusAdmin />
            </TabsContent>
          </Tabs>

          {/* FOOTER */}
          <footer className="mt-12 border-t border-border/40 py-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
            <span>Alam M — শব্দ আমার ক্যানভাস &bull; ব্যক্তিগত সাহিত্যিক পোর্টাল</span>
            <span>সর্বস্বত্ব সংরক্ষিত &copy; {new Date().getFullYear()}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* ARTICLES ADMIN WITH TRASH, RESTORE, TAGS & BULK SELECTION                  */
/* ========================================================================== */
const articleSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "স্লাগে শুধুমাত্র ছোট হাতের ইংরেজি অক্ষর, সংখ্যা এবং ড্যাশ (-) ব্যবহার করা যাবে"),
  title_bn: z.string().trim().min(1, "বাংলা শিরোনাম বাধ্যতামূলক").max(200),
  title_en: z.string().trim().max(200),
  excerpt_bn: z.string().trim().max(500),
  excerpt_en: z.string().trim().max(500),
  content_bn: z.string().trim().max(60000),
  content_en: z.string().trim().max(60000),
  cover_image_url: z.string().trim().max(500),
  disclaimer_enabled: z.boolean().optional(),
  disclaimer_bn: z.string().optional(),
  disclaimer_en: z.string().optional(),
});

const EMPTY = {
  slug: "",
  title_bn: "",
  title_en: "",
  excerpt_bn: "",
  excerpt_en: "",
  content_bn: "",
  content_en: "",
  cover_image_url: "",
  disclaimer_enabled: false,
  disclaimer_bn: BANGLA_DISCLAIMER,
  disclaimer_en: ENGLISH_DISCLAIMER,
};

interface ArticlesAdminProps {
  onOpenImport: (type: "wordpress" | "blogger") => void;
  onGoToExport?: () => void;
  initialView?: "list" | "editor";
  onNavigateToNewPost?: () => void;
  onNavigateToList?: () => void;
}

function ArticlesAdmin({
  onOpenImport,
  onGoToExport,
  initialView = "list",
  onNavigateToNewPost,
  onNavigateToList,
}: ArticlesAdminProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "editor">(initialView);
  const [form, setForm] = useState({ ...EMPTY });
  const [published, setPublished] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setViewMode(initialView);
  }, [initialView]);
  const [authorId, setAuthorId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
  const [customPublishedAt, setCustomPublishedAt] = useState<string>("");
  const [dateTimeModalArticle, setDateTimeModalArticle] = useState<any | null>(null);
  const [isAutoSlug, setIsAutoSlug] = useState<boolean>(true);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState<boolean>(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState<boolean>(false);
  const [isBatchTranslating, setIsBatchTranslating] = useState<boolean>(false);
  const [batchTranslateProgress, setBatchTranslateProgress] = useState<{
    current: number;
    total: number;
    currentTitle: string;
    isPaused: boolean;
  } | null>(null);

  const [notifySubscribers, setNotifySubscribers] = useState<boolean>(true);
  const [newsletterModalArticle, setNewsletterModalArticle] = useState<any | null>(null);

  // Debounced auto-generation of short English slug
  useEffect(() => {
    if (!isAutoSlug) return;
    if (!form.title_bn.trim() && !form.title_en.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setIsGeneratingSlug(true);
        const autoSlug = await generateEnglishSlug(form.title_bn, form.title_en);
        if (autoSlug) {
          setForm((prev) => ({ ...prev, slug: autoSlug }));
        }
      } catch (err) {
        console.error("Auto slug generation error:", err);
      } finally {
        setIsGeneratingSlug(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.title_bn, form.title_en, isAutoSlug]);

  // স্বয়ংক্রিয় ড্রাফট প্রিপোপুলেশন (ভিডিও ট্রান্সক্রিপশন বা ওসিআর থেকে পাঠানো হলে)
  useEffect(() => {
    try {
      const draftContent = sessionStorage.getItem("admin_draft_content");
      const draftTitle = sessionStorage.getItem("admin_draft_title");
      if (draftContent) {
        setForm((prev) => ({
          ...prev,
          title_bn: draftTitle || prev.title_bn || "নতুন নিবন্ধ / নোট",
          content_bn: draftContent,
        }));
        sessionStorage.removeItem("admin_draft_content");
        sessionStorage.removeItem("admin_draft_title");
        const editorTop = document.getElementById("article-editor-top");
        if (editorTop) {
          editorTop.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch {}
  }, []);

  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "trash">("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkAuthorId, setBulkAuthorId] = useState<string>("");
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [isAutoSlugging, setIsAutoSlugging] = useState(false);

  const categories = useCategories();

  // নিবন্ধিত সকল ট্যাগ ফেচ (ট্যাগ সিলেক্টরের জন্য)
  const allTagsQuery = useQuery({
    queryKey: ["admin-tags-selector-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tags")
        .select("id, name_bn, name_en, slug")
        .order("name_bn");
      const dbTags = (data || []).filter((t: any) => t && typeof t.name_bn === "string" && t.name_bn.trim().length > 0);
      const dbNames = new Set(dbTags.map((t: any) => (t.name_bn || "").toLowerCase().trim()));

      const extraTags: { id: string; name_bn: string; slug: string }[] = [];
      STATIC_ARTICLES_META.forEach((meta) => {
        if (Array.isArray(meta.tags)) {
          meta.tags.forEach((t: string) => {
            const clean = String(t).trim().replace(/^#/, "");
            if (clean && !dbNames.has(clean.toLowerCase())) {
              dbNames.add(clean.toLowerCase());
              extraTags.push({ id: `meta-${clean}`, name_bn: clean, slug: clean });
            }
          });
        }
      });

      return [...dbTags, ...extraTags];
    },
  });

  const availableTags = allTagsQuery.data || [];

  const filteredAvailableTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return availableTags;
    const q = tagSearchQuery.toLowerCase().trim();
    return availableTags.filter((t: any) =>
      t.name_bn?.toLowerCase().includes(q) ||
      t.name_en?.toLowerCase().includes(q) ||
      t.slug?.toLowerCase().includes(q)
    );
  }, [availableTags, tagSearchQuery]);

  const toggleTagSelection = (tagName: string) => {
    const clean = tagName.trim().replace(/^#/, "");
    if (!clean) return;
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === clean.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== clean.toLowerCase());
      } else {
        return [...prev, clean];
      }
    });
  };

  const handleAddNewTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, "");
    if (!clean) return;

    if (!selectedTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setSelectedTags((prev) => [...prev, clean]);
    }
    setNewTagInput("");

    try {
      await supabase.from("tags").insert({
        name_bn: clean,
        name_en: null,
        slug: generateTagSlug(clean),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-tags-selector-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tags-list"] });
    } catch {}
  };

  const authors = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/authors");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            return json;
          }
        }
      } catch {}
      const { data, error } = await supabase.from("authors").select("id, name_bn").order("name_bn");
      if (error) return [];
      return data || [];
    },
  });

  const list = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      let rawDbArticles: any[] = [];
      const token = getStoredAuthToken();
      try {
        const res = await fetch("/api/public/articles?admin=1", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          rawDbArticles = await res.json();
        }
      } catch {}

      if (!Array.isArray(rawDbArticles) || rawDbArticles.length === 0) {
        try {
          const { data, error } = await supabase
            .from("articles")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) {
            console.error("Error fetching admin articles from Supabase:", error);
          }
          if (data) rawDbArticles = data;
        } catch {}
      }

      if (rawDbArticles.length === 0) {
        const cached = await getCachedDynamicArticles();
        if (Array.isArray(cached) && cached.length > 0) {
          rawDbArticles = cached;
        }
      }
      const permanentlyDeleted = getPermanentlyDeletedKeys();
      const trashedKeys = getTrashedArticleKeys();

      const staticRemaining = STATIC_ARTICLES_META.filter((sa) => {
        if (permanentlyDeleted.has(sa.id.toLowerCase()) || permanentlyDeleted.has(sa.slug.toLowerCase())) return false;
        return !rawDbArticles.some((da: any) => da.slug === sa.slug || da.id === sa.id);
      }).map((sa) => {
        if (trashedKeys.has(sa.id.toLowerCase()) || trashedKeys.has(sa.slug.toLowerCase())) {
          return { ...sa, deleted_at: sa.deleted_at || new Date().toISOString(), published: false };
        }
        return sa;
      });
      const merged = [...rawDbArticles, ...staticRemaining].sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || a.published_at || 0).getTime();
        const timeB = new Date(b.created_at || b.published_at || 0).getTime();
        return timeB - timeA;
      });
      return merged;
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: boolean }) => {
      const token = getStoredAuthToken();
      let toggledOk = false;
      try {
        const res = await fetch("/api/public/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "toggle_publish",
            id,
            published: nextStatus,
            published_at: nextStatus ? new Date().toISOString() : null,
          }),
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.ok) toggledOk = true;
        }
      } catch {}

      if (!toggledOk) {
        const artObj = (list.data || []).find((a) => a.id === id);
        const { data: updated, error } = await supabase
          .from("articles")
          .update({
            published: nextStatus,
            published_at: nextStatus ? new Date().toISOString() : null,
          })
          .eq("id", id)
          .select();

        if ((!updated || updated.length === 0) && artObj) {
          const { error: upErr } = await supabase.from("articles").upsert({
            ...artObj,
            published: nextStatus,
            published_at: nextStatus ? new Date().toISOString() : null,
          }, { onConflict: "slug" });
          if (upErr) throw upErr;
        } else if (error) {
          throw error;
        }
      } else {
        try {
          void supabase.from("articles").update({
            published: nextStatus,
            published_at: nextStatus ? new Date().toISOString() : null,
          }).eq("id", id);
        } catch {}
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success(variables.nextStatus ? "আর্টিকেল প্রকাশিত হয়েছে" : "আর্টিকেলটি খসড়া/ড্রাফট করা হয়েছে");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const moveToTrash = useMutation({
    mutationFn: async (id: string) => {
      const artObj = (list.data || []).find((a) => a.id === id);
      await moveArticleToTrash(artObj || { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("আর্টিকেল ট্র্যাশ বক্সে পাঠানো হয়েছে");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const restoreFromTrash = useMutation({
    mutationFn: async (id: string) => {
      const artObj = (list.data || []).find((a) => a.id === id);
      await restoreArticleFromTrash(artObj || { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("আর্টিকেল সফলভাবে পুনরুদ্ধার (Restore) করা হয়েছে");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const permanentDelete = useMutation({
    mutationFn: async (id: string) => {
      const artObj = (list.data || []).find((a) => a.id === id);
      await permanentlyDeleteArticle(artObj || { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("আর্টিকেল চিরতরে মুছে ফেলা হয়েছে");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const executeBulkAction = useMutation({
    mutationFn: async () => {
      if (selectedIds.length === 0) throw new Error("অনুগ্রহ করে অন্তত একটি পোস্ট নির্বাচন করুন");
      if (!bulkAction) throw new Error("বাল্ক অ্যাকশন নির্বাচন করুন");

      if (bulkAction === "trash") {
        for (const id of selectedIds) {
          const art = (list.data || []).find((a) => a.id === id);
          await moveArticleToTrash(art || { id });
        }
      } else if (bulkAction === "restore") {
        for (const id of selectedIds) {
          const art = (list.data || []).find((a) => a.id === id);
          await restoreArticleFromTrash(art || { id });
        }
      } else if (bulkAction === "permanent-delete") {
        for (const id of selectedIds) {
          const art = (list.data || []).find((a) => a.id === id);
          await permanentlyDeleteArticle(art || { id });
        }
      } else if (bulkAction === "publish") {
        const { error } = await supabase
          .from("articles")
          .update({ published: true, published_at: new Date().toISOString() })
          .in("id", selectedIds);
        if (error) throw error;
      } else if (bulkAction === "draft") {
        const { error } = await supabase
          .from("articles")
          .update({ published: false, published_at: null })
          .in("id", selectedIds);
        if (error) throw error;
      } else if (bulkAction === "change-author") {
        const { error } = await supabase
          .from("articles")
          .update({ author_id: bulkAuthorId || null })
          .in("id", selectedIds);
        if (error) throw error;
      } else if (bulkAction === "change-category") {
        const { error } = await supabase
          .from("articles")
          .update({ category_id: bulkCategoryId || null })
          .in("id", selectedIds);
        if (error) throw error;
      } else if (bulkAction === "auto-slug") {
        const targetArticles = (list.data || []).filter((a) => selectedIds.includes(a.id));
        for (const art of targetArticles) {
          if (!art.title_bn && !art.title_en) continue;
          const properSlug =
            PRECOMPILED_DB_SLUG_MAP[art.id] ||
            (await generateEnglishSlug(art.title_bn, art.title_en, String(art.id).slice(0, 6))) ||
            bnToEnSlug(art.title_bn, String(art.id).slice(0, 6));
          const { error } = await supabase
            .from("articles")
            .update({ slug: properSlug })
            .eq("id", art.id);
          if (error) console.error("Auto slug update error:", art.id, error);
        }
      } else if (bulkAction === "auto-translate-en") {
        const targetArticles = (list.data || []).filter((a) => selectedIds.includes(a.id));
        await handleBatchAutoTranslate(targetArticles);
        return;
      } else if (
        bulkAction === "export-json" ||
        bulkAction === "export-xml" ||
        bulkAction === "export-csv" ||
        bulkAction === "export-zip"
      ) {
        const targetArticles = (list.data || []).filter((a) => selectedIds.includes(a.id));
        if (targetArticles.length === 0) throw new Error("কোনো পোস্ট নির্বাচন করা হয়নি");

        const articlesWithFullContent = await Promise.all(
          targetArticles.map(async (art) => {
            if (art.content_bn) return art;
            try {
              const { STATIC_ARTICLES } = await import("@/lib/staticArticlesData");
              const full = STATIC_ARTICLES.find((sa) => sa.id === art.id || sa.slug === art.slug);
              if (full) {
                return {
                  ...art,
                  content_bn: full.content_bn,
                  content_en: full.content_en,
                };
              }
            } catch (e) {
              console.warn("Could not load full static content for export:", art.slug);
            }
            return art;
          })
        );

        const dateStr = new Date().toISOString().slice(0, 10);
        if (bulkAction === "export-json") {
          const json = exportToJson(articlesWithFullContent as any);
          downloadFile(json, `selected-articles-${dateStr}.json`, "application/json;charset=utf-8");
          toast.success(`${articlesWithFullContent.length}টি পোস্টের JSON ফাইল ডাউনলোড হয়েছে`);
        } else if (bulkAction === "export-xml") {
          const xml = exportToWordPressXml(articlesWithFullContent as any);
          downloadFile(xml, `selected-articles-${dateStr}.xml`, "application/xml;charset=utf-8");
          toast.success(`${articlesWithFullContent.length}টি পোস্টের WordPress XML ডাউনলোড হয়েছে`);
        } else if (bulkAction === "export-csv") {
          const csv = exportToCsv(articlesWithFullContent as any);
          downloadFile(csv, `selected-articles-${dateStr}.csv`, "text/csv;charset=utf-8");
          toast.success(`${articlesWithFullContent.length}টি পোস্টের CSV স্প্রেডশিট ডাউনলোড হয়েছে`);
        } else if (bulkAction === "export-zip") {
          const zipBlob = await exportToMarkdownZip(articlesWithFullContent as any);
          downloadBlob(zipBlob, `selected-articles-markdown-${dateStr}.zip`);
          toast.success(`${articlesWithFullContent.length}টি পোস্টের Markdown ZIP প্যাকেজ ডাউনলোড হয়েছে`);
        }
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setSelectedIds([]);
      setBulkAction("");
      setBulkAuthorId("");
      setBulkCategoryId("");
      toast.success("বাল্ক অ্যাকশন সফলভাবে সম্পন্ন হয়েছে!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleBatchAutoTranslate = async (targetArticlesList?: any[]) => {
    const rawList = targetArticlesList || list.data || [];
    // Candidates: Articles with content_bn, where content_en is null/empty or predominantly Bengali
    const candidates = rawList.filter((a: any) => {
      if (!a.content_bn || !a.content_bn.trim()) return false;
      if (!a.content_en || !a.content_en.trim()) return true;
      const bnMatches = a.content_en.match(/[\u0980-\u09FF]/g) || [];
      const enMatches = a.content_en.match(/[a-zA-Z]/g) || [];
      return bnMatches.length > 50 && bnMatches.length > enMatches.length * 0.3;
    });

    if (candidates.length === 0) {
      toast.info("সকল নির্বাচিত পোস্টের জন্য ইংরেজি সংস্করণ ইতোমধ্যে প্রস্তুত রয়েছে!");
      return;
    }

    if (
      !confirm(
        `মোট ${candidates.length}টি পোস্টের জন্য রিচ টেক্সট ইংরেজি সংস্করণ তৈরি ও সেভ করা হবে।\n(গুগল ট্রান্সলেট ও রিচ টেক্সট ফরম্যাটিং স্বয়ংক্রিয়ভাবে প্রয়োগ হবে)\n\nআপনি কি শুরু করতে চান?`
      )
    ) {
      return;
    }

    setIsBatchTranslating(true);
    setBatchTranslateProgress({
      current: 0,
      total: candidates.length,
      currentTitle: "",
      isPaused: false,
    });

    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < candidates.length; i++) {
      const art = candidates[i];
      setBatchTranslateProgress({
        current: i + 1,
        total: candidates.length,
        currentTitle: art.title_bn,
        isPaused: false,
      });

      try {
        const formattedBn = formatArticleContent(art.content_bn);
        const translated = await translateFullArticle({
          title_bn: art.title_bn,
          excerpt_bn: art.excerpt_bn,
          content_bn: formattedBn,
        });

        const autoExcerptEn =
          translated.excerpt_en ||
          translated.content_en
            .replace(/<[^>]*>?/gm, "")
            .replace(/\s+/g, " ")
            .slice(0, 160)
            .trim();

        const updatePayload: any = {
          title_en:
            art.title_en && !/[\u0980-\u09FF]/.test(art.title_en)
              ? art.title_en
              : translated.title_en,
          excerpt_en: autoExcerptEn || null,
          content_en: formatArticleContent(translated.content_en),
          updated_at: new Date().toISOString(),
        };

        const { error: updateErr } = await supabase
          .from("articles")
          .update(updatePayload)
          .eq("id", art.id);

        if (updateErr) {
          console.error("Batch translate save error:", art.slug, updateErr);
          errorCount++;
        } else {
          updatedCount++;
        }
      } catch (err) {
        console.error("Batch translation failed for:", art.slug, err);
        errorCount++;
      }

      // Small pacing delay between articles
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsBatchTranslating(false);
    setBatchTranslateProgress(null);
    queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    queryClient.invalidateQueries({ queryKey: ["articles"] });
    toast.success(`ব্যাচ ইংরেজি অনুবাদ সম্পন্ন! সফল: ${updatedCount}টি, ত্রুটি: ${errorCount}টি`);
  };

  const handleBulkAutoSlugGenerate = async () => {
    if (!list.data || list.data.length === 0) {
      toast.error("কোনো পোস্ট পাওয়া যায়নি");
      return;
    }
    if (
      !confirm(
        "আপনি কি সমস্ত পোস্টের পার্মালিঙ্ক (Slug) স্বয়ংক্রিয়ভাবে সংক্ষিপ্ত ইংরেজি শব্দে (যেমন: 'twice-death-and-twice-life') রূপান্তর করতে চান?"
      )
    ) {
      return;
    }

    setIsAutoSlugging(true);
    let updated = 0;
    try {
      // ১. যদি RPC ফাংশন এভেইলেবল থাকে, এক ক্লিকেই পুরো ডাটাবেজ আপডেট হবে
      try {
        const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc("update_all_articles_to_english_slugs");
        if (!rpcErr && typeof rpcRes === "number" && rpcRes > 0) {
          queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
          queryClient.invalidateQueries({ queryKey: ["articles"] });
          toast.success(`সফলভাবে ${rpcRes}টি পোস্টের পার্মালিঙ্ক সংক্ষিপ্ত ইংরেজি শব্দে আপডেট করা হয়েছে!`);
          setIsAutoSlugging(false);
          return;
        }
      } catch (e) {
        // Fallback to row-by-row precompiled batch update
      }

      // ২. প্রি-কম্পাইলড ম্যাপিং দিয়ে অতি দ্রুত ব্যাচ আপডেট
      for (const art of list.data) {
        if (!art.title_bn && !art.title_en) continue;
        const properSlug =
          PRECOMPILED_DB_SLUG_MAP[art.id] ||
          (await generateEnglishSlug(art.title_bn, art.title_en, String(art.id).slice(0, 6))) ||
          bnToEnSlug(art.title_bn, String(art.id).slice(0, 6));
        if (art.slug !== properSlug) {
          const { error } = await supabase
            .from("articles")
            .update({ slug: properSlug })
            .eq("id", art.id);
          if (!error) updated++;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success(`সফলভাবে ${updated}টি পোস্টের পার্মালিঙ্ক সংক্ষিপ্ত ইংরেজি শব্দে আপডেট করা হয়েছে!`);
    } catch (err: any) {
      toast.error(`ইরোর: ${err?.message || "স্লাগ আপডেট ব্যর্থ হয়েছে"}`);
    } finally {
      setIsAutoSlugging(false);
    }
  };

  const handleAutoTranslateEnglish = async () => {
    if (!form.title_bn.trim() && !form.content_bn.trim()) {
      toast.error("অনুগ্রহ করে আগে বাংলা শিরোনাম অথবা বিষয়বস্তু লিখুন");
      return;
    }

    setIsAutoTranslating(true);
    toast.loading("বাংলা থেকে স্বয়ংক্রিয় ইংরেজি অনুবাদ প্রস্তুত হচ্ছে...", { id: "admin-auto-translate" });

    try {
      const formattedBn = formatArticleContent(form.content_bn);
      const translated = await translateFullArticle({
        title_bn: form.title_bn,
        excerpt_bn: form.excerpt_bn,
        content_bn: formattedBn,
      });

      setForm((prev) => ({
        ...prev,
        content_bn: formattedBn,
        title_en: prev.title_en || translated.title_en || prev.title_en,
        excerpt_en: prev.excerpt_en || translated.excerpt_en || prev.excerpt_en,
        content_en: translated.content_en || prev.content_en,
        slug: isAutoSlug && (!prev.slug || prev.slug.startsWith("post-")) && translated.title_en 
          ? cleanEnglishSlug(translated.title_en) 
          : prev.slug,
      }));

      toast.success("ইংরেজি অনুবাদ সফলভাবে তৈরি হয়েছে!", { id: "admin-auto-translate" });
    } catch (err: any) {
      console.error("Auto translate error:", err);
      toast.error(`অনুবাদ ব্যর্থ হয়েছে: ${err?.message || "নেটওয়ার্ক ত্রুটি"}`, { id: "admin-auto-translate" });
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      // Ensure clean, short English slug even if empty or unpopulated
      let finalSlug = form.slug?.trim();
      if (!finalSlug || finalSlug.startsWith("post-") || /[\u0980-\u09FF]/.test(finalSlug)) {
        finalSlug = await generateEnglishSlug(form.title_bn, form.title_en);
      }
      const dataToParse = { ...form, slug: finalSlug };
      const parsed = articleSchema.safeParse(dataToParse);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "সঠিক তথ্য প্রদান করুন");

      const autoExcerptBn = parsed.data.excerpt_bn
        ? parsed.data.excerpt_bn
        : parsed.data.content_bn.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").slice(0, 160).trim();

      const autoExcerptEn = parsed.data.excerpt_en
        ? parsed.data.excerpt_en
        : parsed.data.content_en ? parsed.data.content_en.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").slice(0, 160).trim() : null;

      // কমা দিয়ে আলাদা করা ও সিলেক্ট করা ট্যাগ কম্বাইন
      const commaTags = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter((t) => t.length > 0);

      const combinedParsedTags = Array.from(
        new Set([...selectedTags.map((t) => t.trim().replace(/^#/, "")), ...commaTags])
      ).filter(Boolean);

      const baseBn = parsed.data.content_bn ? formatArticleContent(parsed.data.content_bn) : "";
      const finalBn = injectArticleDisclaimer(baseBn, {
        enabled: form.disclaimer_enabled ?? true,
        bn: form.disclaimer_bn || BANGLA_DISCLAIMER,
        en: form.disclaimer_en || ENGLISH_DISCLAIMER,
      });

      const payload: any = {
        ...parsed.data,
        title_en: parsed.data.title_en || null,
        excerpt_bn: autoExcerptBn || null,
        excerpt_en: autoExcerptEn || null,
        content_bn: finalBn || null,
        content_en: parsed.data.content_en ? formatArticleContent(parsed.data.content_en) : null,
        cover_image_url: parsed.data.cover_image_url || null,
        published,
        author_id: authorId || null,
        category_id: categoryId || null,
        tags: combinedParsedTags,
        published_at: published
          ? (customPublishedAt ? (fromDateTimeLocalString(customPublishedAt) || new Date().toISOString()) : new Date().toISOString())
          : null,
        created_by: user!.id,
        deleted_at: null,
      };
      delete payload.disclaimer_enabled;
      delete payload.disclaimer_bn;
      delete payload.disclaimer_en;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // অফলাইন মোড: ব্যাকগ্রাউন্ড কিউতে রাখুন এবং স্থানীয় ক্যাশে যোগ করুন
        const offlineArticle = {
          ...payload,
          id: editingId || `offline-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        const currentCached = await getCachedDynamicArticles();
        await cacheDynamicArticles([offlineArticle, ...currentCached]);
        await queuePendingSync({
          type: editingId ? "update_article" : "create_article",
          payload: editingId ? { id: editingId, data: payload } : payload,
        });
        toast.info("অফলাইন মোড: পোস্টটি ডিভাইসে সংরক্ষিত হয়েছে। ইন্টারনেট সংযোগ পেলে স্বয়ংক্রিয়ভাবে সার্ভারে সিঙ্ক হবে।");
        return;
      }

      const token = getStoredAuthToken();
      let d1Saved = false;
      try {
        const res = await fetch("/api/public/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "save",
            ...payload,
            id: editingId,
          }),
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.ok) d1Saved = true;
        }
      } catch {}

      if (!d1Saved) {
        if (editingId) {
          const { data: updated, error } = await supabase.from("articles").update(payload).eq("id", editingId).select();
          if ((!updated || updated.length === 0) || error) {
            const { error: upsertErr } = await supabase.from("articles").upsert({ ...payload, slug: payload.slug }, { onConflict: "slug" });
            if (upsertErr) throw upsertErr;
          }
        } else {
          const { error } = await supabase.from("articles").insert(payload);
          if (error) throw error;
        }
      } else {
        // Fire-and-forget mirror to Supabase
        try {
          if (editingId) {
            void supabase.from("articles").update(payload).eq("id", editingId);
          } else {
            void supabase.from("articles").insert(payload);
          }
        } catch {}
      }

      // স্বয়ংক্রিয়ভাবে নিউজলেটার গ্রাহকদের ইমেইল নোটিফিকেশন প্রেরণ (Auto broadcast to newsletter subscribers)
      if (published && notifySubscribers && typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const authorObj = authors.data?.find((a) => a.id === authorId);
          const { data: nSettings } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "newsletter_settings")
            .maybeSingle();
          const nVal = (nSettings?.value ?? {}) as Record<string, any>;

          fetch("/api/public/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "broadcast",
              api_key: nVal.resend_api_key || "",
              from_email: nVal.from_email || "",
              article: {
                title_bn: payload.title_bn,
                title_en: payload.title_en,
                slug: payload.slug,
                excerpt_bn: payload.excerpt_bn,
                excerpt_en: payload.excerpt_en,
                cover_image_url: payload.cover_image_url,
                authorName: authorObj?.name_bn || "আলম এম",
                tags: payload.tags,
              },
            }),
          })
            .then(async (res) => {
              const bData = await res.json().catch(() => ({}));
              if (res.ok && bData?.ok) {
                toast.success(
                  `নিউজলেটার গ্রাহকদের ইমেইল নোটিফিকেশন পাঠানো হয়েছে (${bData.sentCount || 0} জন)!`,
                  { duration: 6000 }
                );
              } else if (bData?.error === "missing_api_key") {
                toast.info(
                  "Resend API Key কনফিগার করা নেই। গ্রাহকদের ইমেইল পাঠাতে সেটিংস থেকে API Key যুক্ত করুন।",
                  { duration: 7000 }
                );
              }
            })
            .catch((e) => console.warn("Background newsletter broadcast error:", e));
        } catch (e) {
          console.warn("Newsletter broadcast trigger error:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tags-selector-list"] });
      setForm({ ...EMPTY });
      setEditingId(null);
      setAuthorId("");
      setCategoryId("");
      setTagsInput("");
      setSelectedTags([]);
      setNewTagInput("");
      setTagSearchQuery("");
      setCustomPublishedAt("");
      setPublished(true);
      toast.success(published ? "আর্টিকেল সফলভাবে প্রকাশিত হয়েছে" : "আর্টিকেল সফলভাবে খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে");
      setViewMode("list");
      if (onNavigateToList) onNavigateToList();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const allList = list.data || [];
  const activeArticles = allList.filter((a) => !a.deleted_at);
  const trashArticles = allList.filter((a) => a.deleted_at);

  const filteredArticles = (statusFilter === "trash"
    ? trashArticles
    : activeArticles.filter((a) => {
        if (statusFilter === "published") return a.published;
        if (statusFilter === "draft") return !a.published;
        return true;
      })) || [];

  const publishedCount = activeArticles.filter((a) => a.published).length;
  const draftCount = activeArticles.filter((a) => !a.published).length;
  const trashCount = trashArticles.length;

  const isAllSelected = filteredArticles.length > 0 && selectedIds.length === filteredArticles.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredArticles.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const field = (key: keyof typeof EMPTY, label: string, long = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={key} className="text-xs font-semibold">{label}</Label>
      {long ? (
        key.startsWith("content") ? (
          <RichTextEditor
            label={label}
            value={form[key]}
            onChange={(val) => setForm((prev) => ({ ...prev, [key]: val }))}
          />
        ) : (
          <Textarea
            id={key}
            rows={3}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="text-xs"
          />
        )
      ) : (
        <Input
          id={key}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="h-9 text-xs"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. View Mode Switcher Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-2 sm:p-2.5 rounded-xl border border-border">
        <div className="inline-flex items-center rounded-lg bg-card p-1 border border-border shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setViewMode("list");
              if (onNavigateToList) onNavigateToList();
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="size-3.5" />
            <span>সকল পোস্টের তালিকা ({activeArticles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ ...EMPTY });
              setPublished(true);
              setAuthorId("");
              setCategoryId("");
              setTagsInput("");
              setSelectedTags([]);
              setCustomPublishedAt("");
              setViewMode("editor");
              if (onNavigateToNewPost) onNavigateToNewPost();
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "editor"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenTool className="size-3.5" />
            <span>{editingId ? "পোস্ট সম্পাদনা" : "✍️ নতুন পোস্ট লিখুন"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {viewMode === "editor" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setViewMode("list");
                if (onNavigateToList) onNavigateToList();
              }}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>← সকল পোস্টের তালিকায় ফিরুন</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY });
                setPublished(true);
                setAuthorId("");
                setCategoryId("");
                setTagsInput("");
                setSelectedTags([]);
                setCustomPublishedAt("");
                setViewMode("editor");
                if (onNavigateToNewPost) onNavigateToNewPost();
              }}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer font-medium"
            >
              <Plus className="size-3.5" />
              <span>নতুন পোস্ট লিখুন</span>
            </Button>
          )}
        </div>
      </div>

      {viewMode === "editor" ? (
        <form
          className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewMode("list");
                  if (onNavigateToList) onNavigateToList();
                }}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>← তালিকায় ফিরুন</span>
              </Button>
              <h2 className="font-semibold text-base ml-1">
                {editingId ? "আর্টিকেল সম্পাদনা করুন" : "নতুন সাহিত্যকর্ম লিখুন"}
              </h2>
            </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Upload className="size-3.5 text-[#2271b1]" /> কুইক ইমপোর্ট:
              </span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value === "wordpress" || e.target.value === "blogger") {
                    onOpenImport(e.target.value);
                  }
                }}
                className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">নির্বাচন করুন...</option>
                <option value="wordpress">ওয়ার্ডপ্রেস / WordPress (.xml)</option>
                <option value="blogger">ব্লগার / Blogger (.xml)</option>
              </select>
            </div>

            {onGoToExport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGoToExport}
                className="h-8 gap-1.5 px-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer shadow-2xs"
                title="পোস্ট এক্সপোর্ট প্যানেলে যান"
              >
                <Download className="size-3.5 text-primary" />
                <span>এক্সপোর্ট হাব (Export)</span>
              </Button>
            )}

            <div className="h-4 w-px bg-border mx-1" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">স্ট্যাটাস:</span>
              <select
                value={published ? "published" : "draft"}
                onChange={(e) => setPublished(e.target.value === "published")}
                className={`h-8 rounded-md border px-2.5 text-xs font-semibold transition-colors focus:outline-none cursor-pointer ${
                  published 
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                    : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                <option value="published" className="bg-card text-foreground">🟢 প্রকাশিত (Published)</option>
                <option value="draft" className="bg-card text-foreground">🟡 খসড়া (Draft)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 rounded-lg border border-border/80 bg-muted/20 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="article-slug" className="text-xs font-semibold">
                স্লাগ (URL Permalink Slug) <span className="text-destructive">*</span>
              </Label>
              {isGeneratingSlug && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary animate-pulse font-medium">
                  <Sparkles className="size-3 animate-spin" /> ইংরেজি পার্মালিঙ্ক তৈরি হচ্ছে...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={isAutoSlug}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsAutoSlug(checked);
                    if (checked && (form.title_bn || form.title_en)) {
                      generateEnglishSlug(form.title_bn, form.title_en).then((s) => {
                        if (s) setForm((prev) => ({ ...prev, slug: s }));
                      });
                    }
                  }}
                  className="size-3.5 rounded border-input text-primary accent-primary cursor-pointer"
                />
                <span className="font-medium text-xs">
                  {isAutoSlug ? "⚡ স্বয়ংক্রিয় ইংরেজি পার্মালিঙ্ক (সক্রিয়)" : "ম্যানুয়াল পার্মালিঙ্ক"}
                </span>
              </label>

              <button
                type="button"
                onClick={async () => {
                  if (form.title_bn || form.title_en) {
                    toast.loading("সংক্ষিপ্ত ইংরেজি স্লাগ তৈরি হচ্ছে...", { id: "admin-slug-gen" });
                    const autoSlug = await generateEnglishSlug(form.title_bn, form.title_en);
                    setForm((prev) => ({ ...prev, slug: autoSlug }));
                    toast.success(`ইংরেজি স্লাগ তৈরি হয়েছে: ${autoSlug}`, { id: "admin-slug-gen" });
                  } else {
                    toast.error("অনুগ্রহ করে আগে বাংলা অথবা ইংরেজি শিরোনাম লিখুন");
                  }
                }}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                title="শিরোনাম থেকে পুনরায় স্লাগ রিফ্রেশ করুন"
              >
                <Sparkles className="size-3 text-primary" /> রিফ্রেশ
              </button>
            </div>
          </div>

          <div className="relative">
            <Input
              id="article-slug"
              value={form.slug}
              onChange={(e) => {
                setIsAutoSlug(false);
                setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") });
              }}
              placeholder="যেমন: twice-death-and-twice-life"
              className="h-9 text-xs font-mono"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            পার্মালিঙ্ক: <span className="font-mono text-foreground font-semibold">https://blog.wooniche.com/articles/{form.slug || "your-slug"}</span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title_bn" className="text-xs font-semibold">
              শিরোনাম (বাংলা) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title_bn"
              value={form.title_bn}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title_bn: val,
                  slug: isAutoSlug && (!prev.slug || prev.slug.startsWith("post-")) && val ? bnToEnSlug(val) : prev.slug,
                }));
              }}
              placeholder="পোস্টের মূল বাংলা শিরোনাম লিখুন..."
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title_en" className="text-xs font-semibold text-muted-foreground">
              শিরোনাম (English - ঐচ্ছিক)
            </Label>
            <Input
              id="title_en"
              value={form.title_en}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title_en: val,
                  slug: isAutoSlug && val ? cleanEnglishSlug(val) : prev.slug,
                }));
              }}
              placeholder="English title (optional, auto-generates slug)..."
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* এক-ক্লিকে বাংলা থেকে স্বয়ংক্রিয় ইংরেজি সংস্করণ তৈরি */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              স্বয়ংক্রিয় ইংরেজি সংস্করণ (AI / Auto English Translation)
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              বাংলা শিরোনাম ও বিষয়বস্তু থেকে স্বয়ংক্রিয়ভাবে ইংরেজি শিরোনাম, সারাংশ ও আর্টিকেলের বডি অনুবাদ করুন।
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isAutoTranslating || (!form.title_bn.trim() && !form.content_bn.trim())}
            onClick={handleAutoTranslateEnglish}
            className="text-xs h-8 gap-1.5 border-primary/30 hover:bg-primary hover:text-primary-foreground font-medium cursor-pointer"
          >
            {isAutoTranslating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                অনুবাদ হচ্ছে...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 text-primary" />
                ⚡ স্বয়ংক্রিয় ইংরেজি সংস্করণ তৈরি করুন
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("excerpt_bn", "সংক্ষিপ্ত বিবরণ (বাংলা)", true)}
          {field("excerpt_en", "সংক্ষিপ্ত বিবরণ (English)", true)}
        </div>
        {field("content_bn", "মূল বিষয়বস্তু (বাংলা)", true)}
        {field("content_en", "মূল বিষয়বস্তু (English)", true)}
        {field("cover_image_url", "কভার ইমেজ লিংক (Cover Image URL)")}

        {/* 🔴 ৪:৮২ কুরআনিক সত্য ঘোষণা ও পাঠকদের প্রতি নিবেদন (স্বয়ংক্রিয় ২ সারি) */}
        <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/[0.03] dark:bg-red-950/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Quote className="size-3.5 rotate-180" />
              </div>
              <span className="text-xs font-bold text-foreground">
                পোস্টের শেষভাগের ৪:৮২ কোটেশন বক্স (কুরআনিক ঘোষণা ও বিনীত অনুরোধ)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400">
                স্বয়ংক্রিয় ২ সারি
              </span>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="article-disclaimer-toggle"
                checked={form.disclaimer_enabled}
                onCheckedChange={(val) => setForm((prev) => ({ ...prev, disclaimer_enabled: val }))}
                className="data-[state=checked]:bg-red-600 cursor-pointer"
              />
              <Label
                htmlFor="article-disclaimer-toggle"
                className={`text-xs font-semibold cursor-pointer ${
                  form.disclaimer_enabled ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                }`}
              >
                {form.disclaimer_enabled ? "কোটেশন বক্স সংযুক্ত (ON)" : "কোটেশন বক্স বন্ধ (OFF)"}
              </Label>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            আগামী সকল পোস্টের সাথে সূরা আন-নিসা ৪:৮২ আয়াতের সত্য ঘোষণা ও সতর্কতামূলক কোটেশন বক্স স্বয়ংক্রিয়ভাবে জুড়ে দেওয়া হবে। নিচের সারি দুটি পূর্বনির্ধারিত মানক টেক্সট দিয়ে স্বয়ংক্রিয়ভাবে পূরণ করা থাকে; আপনি চাইলে যেকোনো নির্দিষ্ট পোস্টের জন্য তা পরিবর্তন করতে পারেন।
          </p>

          {form.disclaimer_enabled && (
            <div className="space-y-3 pt-1">
              {/* সারি ১: বাংলা কোটেশন */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="disclaimer_bn" className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span>সারি ১: বাংলা কোটেশন / বক্তব্য</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, disclaimer_bn: BANGLA_DISCLAIMER }))}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    ডিফল্ট বাংলা টেক্সট লোড করুন
                  </button>
                </div>
                <Textarea
                  id="disclaimer_bn"
                  rows={3}
                  value={form.disclaimer_bn}
                  onChange={(e) => setForm((prev) => ({ ...prev, disclaimer_bn: e.target.value }))}
                  className="text-xs font-serif leading-relaxed bg-background border-red-500/25 focus:border-red-500"
                  placeholder="কুরআনে কোনো বৈসদৃশ্য নেই..."
                />
              </div>

              {/* সারি ২: ইংরেজি কোটেশন */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="disclaimer_en" className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span>সারি ২: English Citation / Statement</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, disclaimer_en: ENGLISH_DISCLAIMER }))}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    Load Default English Text
                  </button>
                </div>
                <Textarea
                  id="disclaimer_en"
                  rows={3}
                  value={form.disclaimer_en}
                  onChange={(e) => setForm((prev) => ({ ...prev, disclaimer_en: e.target.value }))}
                  className="text-xs font-serif leading-relaxed bg-background border-red-500/25 focus:border-red-500"
                  placeholder="Every article on this website has been curated..."
                />
              </div>
            </div>
          )}
        </div>

        {/* ট্যাগ নির্বাচন ও ব্যবস্থাপনা প্যানেল (ক্যাটাগরির মতো সহজ নির্বাচন) */}
        <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <TagIcon className="size-3.5 text-primary" />
              <span>ট্যাগসমূহ (Tags) নির্বাচন করুন</span>
            </Label>
            <span className="text-[11px] text-muted-foreground">
              {selectedTags.length > 0 ? `${selectedTags.length}টি ট্যাগ নির্বাচিত` : "কোনো ট্যাগ নির্বাচিত হয়নি"}
            </span>
          </div>

          {/* নির্বাচিত ট্যাগসমূহ (Chips/Badges) */}
          <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center p-2 rounded-lg bg-background border border-border/70 shadow-2xs">
            {selectedTags.length === 0 ? (
              <span className="text-[11px] text-muted-foreground italic px-1">
                নিচের তালিকা থেকে ক্লিক করে ট্যাগ সিলেক্ট করুন অথবা নতুন ট্যাগ লিখে যোগ করুন...
              </span>
            ) : (
              selectedTags.map((t, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs py-1 px-2.5 gap-1.5 font-normal bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => toggleTagSelection(t)}
                    className="hover:text-destructive transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          {/* নতুন ট্যাগ লেখার ইনপুট ও বাটন */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="নতুন কোনো ট্যাগ লিখতে এখানে টাইপ করুন (যেমন: সৃষ্টিতত্ত্ব)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewTag();
                  }
                }}
                className="h-8 text-xs bg-background"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddNewTag()}
              disabled={!newTagInput.trim()}
              className="h-8 text-xs gap-1 cursor-pointer bg-background"
            >
              <Plus className="size-3.5" /> যোগ করুন
            </Button>
          </div>

          {/* বিদ্যমান ট্যাগসমূহ থেকে সিলেক্ট করার তালিকা */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>বিদ্যমান ট্যাগ তালিকা থেকে ক্লিক করে সিলেক্ট বা আন-সিলেক্ট করুন:</span>
              {availableTags.length > 8 && (
                <input
                  type="text"
                  placeholder="ট্যাগ ফিল্টার..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="h-6 w-28 rounded border border-border bg-background px-2 text-[10px]"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg border border-border/60 bg-card/60">
              {allTagsQuery.isLoading ? (
                <span className="text-[11px] text-muted-foreground">ট্যাগ লোড হচ্ছে...</span>
              ) : filteredAvailableTags.length === 0 ? (
                <span className="text-[11px] text-muted-foreground">কোনো ট্যাগ নেই। উপরে নতুন ট্যাগ লিখুন।</span>
              ) : (
                filteredAvailableTags.map((tagObj: any) => {
                  const tagBn = String(tagObj?.name_bn || "").trim();
                  if (!tagBn) return null;
                  const isSelected = selectedTags.some(
                    (t) => String(t || "").toLowerCase() === tagBn.toLowerCase()
                  );
                  return (
                    <button
                      key={tagObj.id || tagBn}
                      type="button"
                      onClick={() => toggleTagSelection(tagBn)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer inline-flex items-center gap-1 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-medium shadow-2xs"
                          : "bg-background text-foreground/80 border-border hover:bg-muted/70 hover:border-border/80"
                      }`}
                    >
                      {isSelected ? <Check className="size-3 text-primary-foreground" /> : <TagIcon className="size-2.5 text-muted-foreground" />}
                      <span>{tagObj.name_bn}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="author" className="text-xs font-semibold">লেখক নির্বাচন</Label>
            <select
              id="author"
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="h-9 w-full rounded border border-input bg-background px-3 text-xs"
            >
              <option value="">কোনো নির্দিষ্ট লেখক নেই</option>
              {authors.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_bn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-category" className="text-xs font-semibold">ক্যাটাগরি নির্বাচন</Label>
            <select
              id="article-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-9 w-full rounded border border-input bg-background px-3 text-xs"
            >
              <option value="">কোনো ক্যাটাগরি নেই</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_bn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-status" className="text-xs font-semibold">পোস্ট স্ট্যাটাস</Label>
            <select
              id="post-status"
              value={published ? "published" : "draft"}
              onChange={(e) => setPublished(e.target.value === "published")}
              className="h-9 w-full rounded border border-input bg-background px-3 text-xs"
            >
              <option value="published">🟢 প্রকাশিত (Published)</option>
              <option value="draft">🟡 খসড়া (Draft)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-published-at" className="text-xs font-semibold flex items-center justify-between">
              <span>প্রকাশের তারিখ ও সময়</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomPublishedAt(toDateTimeLocalString(new Date()))}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                  title="বর্তমান সময় (এখন) নির্ধারণ করুন"
                >
                  ⚡ এখন
                </button>
                {customPublishedAt && (
                  <button
                    type="button"
                    onClick={() => setCustomPublishedAt("")}
                    className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
                    title="বর্তমান সময়ে রিসেট করুন"
                  >
                    রিসেট
                  </button>
                )}
              </div>
            </Label>
            <Input
              id="post-published-at"
              type="datetime-local"
              value={customPublishedAt}
              onChange={(e) => setCustomPublishedAt(e.target.value)}
              className="h-9 text-xs"
            />
            {customPublishedAt && (
              <p className="text-[10px] text-muted-foreground truncate">
                প্রদর্শিত হবে: <span className="font-medium text-foreground">{formatFullDateTimeBn(fromDateTimeLocalString(customPublishedAt))}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Button 
              type="submit" 
              disabled={save.isPending} 
              size="sm" 
              className={`text-white transition-all cursor-pointer ${
                published
                  ? "bg-[#2271b1] hover:bg-[#135e96]"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {published ? (
                <>
                  <Plus className="size-3.5 mr-1" />
                  {editingId ? "আপডেট ও প্রকাশ করুন" : "প্রকাশ করুন (Publish)"}
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1" />
                  {editingId ? "খসড়া আপডেট করুন" : "খসড়া সংরক্ষণ করুন (Save Draft)"}
                </>
              )}
            </Button>

            {editingId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...EMPTY });
                  setPublished(true);
                  setAuthorId("");
                  setCategoryId("");
                  setTagsInput("");
                  setSelectedTags([]);
                  setNewTagInput("");
                  setTagSearchQuery("");
                  setCustomPublishedAt("");
                  setViewMode("list");
                  if (onNavigateToList) onNavigateToList();
                }}
              >
                বাতিল ও তালিকায় ফিরুন
              </Button>
            )}
            {!editingId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setViewMode("list");
                  if (onNavigateToList) onNavigateToList();
                }}
              >
                তালিকায় ফিরুন
              </Button>
            )}
          </div>

          {published && (
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg shadow-2xs">
              <input
                type="checkbox"
                checked={notifySubscribers}
                onChange={(e) => setNotifySubscribers(e.target.checked)}
                className="size-3.5 rounded border-emerald-500 text-emerald-600 accent-emerald-600 cursor-pointer"
              />
              <Mail className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>প্রকাশের সাথে সাথে নিউজলেটার গ্রাহকদের ইমেইল পাঠান</span>
            </label>
          )}
        </div>
      </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl p-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                সকল সাহিত্যকর্ম ও পোস্ট তালিকা
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                মোট {activeArticles.length}টি সক্রিয় লেখা &bull; {publishedCount}টি প্রকাশিত &bull; {draftCount}টি ড্রাফট
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...EMPTY });
                  setPublished(true);
                  setAuthorId("");
                  setCategoryId("");
                  setTagsInput("");
                  setSelectedTags([]);
                  setCustomPublishedAt("");
                  setViewMode("editor");
                  if (onNavigateToNewPost) onNavigateToNewPost();
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm gap-1.5 shadow-xs cursor-pointer font-semibold"
              >
                <PenTool className="size-4" />
                <span>+ নতুন পোস্ট লিখুন</span>
              </Button>
            </div>
          </div>

          {/* আর্টিকেল তালিকা ও ট্র্যাশ ফিল্টার বার */}
          <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">আর্টিকেল তালিকা</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBulkAutoSlugGenerate}
              disabled={isAutoSlugging}
              className="h-7 gap-1.5 px-2.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/10 cursor-pointer shadow-xs"
              title="সব পোস্টের স্লাগ বাংলা শিরোনাম অনুযায়ী স্বয়ংক্রিয়ভাবে ফোনেটিক ইংরেজিতে রূপান্তর করুন"
            >
              <Sparkles className="size-3.5 text-primary" />
              {isAutoSlugging ? "স্লাগ আপডেট হচ্ছে..." : "শিরোনাম অনুযায়ী সব স্লাগ অটো ফিক্স করুন"}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setSelectedIds([]);
              }}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                statusFilter === "all"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              সব ({activeArticles.length})
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("published");
                setSelectedIds([]);
              }}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                statusFilter === "published"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              প্রকাশিত ({publishedCount})
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("draft");
                setSelectedIds([]);
              }}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                statusFilter === "draft"
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              খসড়া / Drafts ({draftCount})
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("trash");
                setSelectedIds([]);
              }}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer flex items-center gap-1 ${
                statusFilter === "trash"
                  ? "bg-destructive text-white font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-destructive"
              }`}
            >
              <Trash2 className="size-3" />
              <span>মুছে ফেলা / Trash ({trashCount})</span>
            </button>
          </div>
        </div>

        {/* বাল্ক অ্যাকশন কন্ট্রোল বার */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="size-4 text-[#2271b1]" />
              ) : (
                <Square className="size-4 text-muted-foreground" />
              )}
              <span>সব সিলেক্ট করুন ({selectedIds.length}/{filteredArticles.length})</span>
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {statusFilter === "trash" ? (
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">বাল্ক অ্যাকশন নির্বাচন করুন...</option>
                <option value="restore">🔄 একসাথে ফিরিয়ে আনুন (Restore)</option>
                <option value="permanent-delete">🗑️ চিরতরে মুছে ফেলুন (Delete Permanently)</option>
              </select>
            ) : (
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">বাল্ক অ্যাকশন নির্বাচন করুন...</option>
                <option value="auto-translate-en">⚡ নির্বাচিত পোস্টগুলোর ইংরেজি সংস্করণ তৈরি করুন</option>
                <option value="auto-slug">✨ একসাথে স্লাগ/পার্মালিঙ্ক অটো জেনারেট করুন</option>
                <option value="publish">🟢 একসাথে প্রকাশিত করুন</option>
                <option value="draft">🟡 একসাথে খসড়া (Draft) করুন</option>
                <option value="change-author">👤 একসাথে লেখক পরিবর্তন করুন</option>
                <option value="change-category">📁 একসাথে ক্যাটাগরি পরিবর্তন করুন</option>
                <optgroup label="পোস্ট এক্সপোর্ট (Export)">
                  <option value="export-json">📥 নির্বাচিতগুলো JSON হিসেবে এক্সপোর্ট</option>
                  <option value="export-xml">📥 নির্বাচিতগুলো WordPress XML হিসেবে এক্সপোর্ট</option>
                  <option value="export-csv">📥 নির্বাচিতগুলো CSV স্প্রেডশিট হিসেবে এক্সপোর্ট</option>
                  <option value="export-zip">📥 নির্বাচিতগুলো Markdown ZIP হিসেবে এক্সপোর্ট</option>
                </optgroup>
                <option value="trash">🗑️ ট্র্যাশে পাঠান (Move to Trash)</option>
              </select>
            )}

            {bulkAction === "change-author" && (
              <select
                value={bulkAuthorId}
                onChange={(e) => setBulkAuthorId(e.target.value)}
                className="h-8 rounded border border-border bg-background px-2 text-xs"
              >
                <option value="">লেখক বাছাই করুন</option>
                {authors.data?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name_bn}</option>
                ))}
              </select>
            )}

            {bulkAction === "change-category" && (
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="h-8 rounded border border-border bg-background px-2 text-xs"
              >
                <option value="">ক্যাটাগরি বাছাই করুন</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_bn}</option>
                ))}
              </select>
            )}

            <Button
              type="button"
              size="sm"
              disabled={selectedIds.length === 0 || !bulkAction || executeBulkAction.isPending}
              onClick={() => executeBulkAction.mutate()}
              className="h-8 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs px-3 cursor-pointer"
            >
              {executeBulkAction.isPending ? "প্রয়োগ হচ্ছে..." : "প্রয়োগ করুন (Apply)"}
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            <Button
              type="button"
              size="sm"
              onClick={() => handleBatchAutoTranslate()}
              disabled={isBatchTranslating}
              className="h-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs px-3.5 font-medium gap-1.5 shadow-xs cursor-pointer"
              title="যেসব পোস্টের ইংরেজি সংস্করণ নেই বা বাংলায় রয়েছে, সেগুলোর রিচ টেক্সট ইংরেজি সংস্করণ তৈরি করুন"
            >
              <Sparkles className={`size-3.5 ${isBatchTranslating ? "animate-spin" : ""}`} />
              <span>{isBatchTranslating ? "অনুবাদ হচ্ছে..." : "⚡ সকল পোস্টের জন্য ইংরেজি সংস্করণ তৈরি করুন"}</span>
            </Button>
          </div>
        </div>

        {/* ব্যাচ অনুবাদ লাইভ অগ্রগতি কার্ড */}
        {batchTranslateProgress && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="size-4 text-emerald-600 animate-spin" />
                স্বয়ংক্রিয় রিচ টেক্সট ইংরেজি সংস্করণ তৈরি হচ্ছে...
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {batchTranslateProgress.current} / {batchTranslateProgress.total} ({Math.round((batchTranslateProgress.current / batchTranslateProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-emerald-950/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(batchTranslateProgress.current / batchTranslateProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              বর্তমান পোস্ট: <span className="font-medium text-foreground">{batchTranslateProgress.currentTitle}</span>
            </p>
          </div>
        )}

        <div className="divide-y divide-border rounded border border-border bg-card shadow-sm">
          {filteredArticles.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">
              {statusFilter === "trash" ? "ট্র্যাশ বক্সে কোনো আর্টিকেল নেই।" : "কোনো আর্টিকেল পাওয়া যায়নি।"}
            </p>
          ) : (
            filteredArticles.map((a) => {
              const isChecked = selectedIds.includes(a.id);

              return (
                <div key={a.id} className="flex items-center gap-3 p-3.5 hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelectOne(a.id)}
                    className="size-4 rounded border-border accent-[#2271b1] cursor-pointer"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{a.title_bn}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                      <span>/{a.slug}</span>
                      <span>·</span>
                      {a.deleted_at ? (
                        <span className="text-destructive font-medium">মুছে ফেলা হয়েছে (In Trash)</span>
                      ) : (
                        <span className={a.published ? "text-emerald-600 font-medium" : "text-amber-600 font-semibold"}>
                          {a.published ? "প্রকাশিত" : "খসড়া (Draft)"}
                        </span>
                      )}
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setDateTimeModalArticle(a)}
                        className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer group"
                        title="ক্লিক করে এই পোস্টের সময় ও তারিখ পরিবর্তন করুন"
                      >
                        <Calendar className="size-3 text-primary/80 group-hover:text-primary shrink-0" />
                        <span className="group-hover:underline">
                          {formatFullDateTimeBn(a.published_at || a.created_at)}
                        </span>
                      </button>
                    </div>
                  </div>

                  {statusFilter !== "trash" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        {a.published ? "Live" : "Draft"}
                      </span>
                      <Switch
                        checked={a.published}
                        onCheckedChange={(checked) =>
                          togglePublish.mutate({ id: a.id, nextStatus: checked })
                        }
                        title={a.published ? "ক্লিক করে খসড়া/ড্রাফট করুন" : "ক্লিক করে প্রকাশ করুন"}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1 ml-2 border-l border-border/60 pl-2">
                    {statusFilter === "trash" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                          aria-label="পুনরুদ্ধার করুন"
                          title="পুনরুদ্ধার করুন (Restore)"
                          onClick={() => restoreFromTrash.mutate(a.id)}
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                          aria-label="চিরতরে মুছে ফেলুন"
                          title="চিরতরে মুছে ফেলুন"
                          onClick={() => permanentDelete.mutate(a.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:bg-primary/10 cursor-pointer"
                          aria-label="সময়/তারিখ পরিবর্তন"
                          title="সময় ও তারিখ পরিবর্তন করুন (Change Date/Time)"
                          onClick={() => setDateTimeModalArticle(a)}
                        >
                          <Calendar className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer"
                          aria-label="সম্পাদনা"
                          onClick={async () => {
                            setEditingId(a.id);
                            setPublished(a.published);
                            setAuthorId(a.author_id ?? "");
                            const rawTags = Array.isArray(a.tags) ? a.tags : [];
                            setTagsInput(rawTags.join(", "));
                            setSelectedTags(rawTags.map((t: string) => String(t).trim().replace(/^#/, "")).filter(Boolean));
                            const pubDate = a.published_at || a.created_at;
                            setCustomPublishedAt(toDateTimeLocalString(pubDate));
                            let contentBn = a.content_bn ?? "";
                            let contentEn = a.content_en ?? "";
                            if (!contentBn) {
                              try {
                                const { STATIC_ARTICLES } = await import("@/lib/staticArticlesData");
                                const full = STATIC_ARTICLES.find((sa) => sa.id === a.id || sa.slug === a.slug);
                                if (full) {
                                  contentBn = full.content_bn ?? "";
                                  contentEn = full.content_en ?? "";
                                }
                              } catch (e) {
                                console.warn("Failed to dynamically load static article content for editing:", e);
                              }
                            }
                            const disc = parseArticleDisclaimer(contentBn);
                            setForm({
                              slug: a.slug,
                              title_bn: a.title_bn,
                              title_en: a.title_en ?? "",
                              excerpt_bn: a.excerpt_bn ?? "",
                              excerpt_en: a.excerpt_en ?? "",
                              content_bn: stripArticleDisclaimerComment(contentBn),
                              content_en: contentEn,
                              cover_image_url: a.cover_image_url ?? "",
                              disclaimer_enabled: disc.enabled,
                              disclaimer_bn: disc.bn,
                              disclaimer_en: disc.en,
                            });
                            setViewMode("editor");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        {a.published && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                            aria-label="গ্রাহকদের ইমেইল পাঠান"
                            title="নিউজলেটার গ্রাহকদের ইমেইল নোটিফিকেশন পাঠান"
                            onClick={() => setNewsletterModalArticle(a)}
                          >
                            <Mail className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                          aria-label="ট্র্যাশে পাঠান"
                          title="ট্র্যাশে পাঠান"
                          onClick={() => moveToTrash.mutate(a.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  )}

      {newsletterModalArticle && (
        <NewsletterBroadcastModal
          article={newsletterModalArticle}
          onClose={() => setNewsletterModalArticle(null)}
          authorsList={authors.data || []}
        />
      )}

      <ArticleDateTimeModal
        open={!!dateTimeModalArticle}
        onOpenChange={(open) => {
          if (!open) setDateTimeModalArticle(null);
        }}
        article={dateTimeModalArticle}
      />
    </div>
  );
}

function RolesAdmin() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "user">("admin");
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<{ id: string; email?: string } | null>(null);

  const rolesList = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      // 1. Fetch directly from Cloudflare D1
      try {
        const res = await fetch("/api/public/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "admin-users-list" }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.ok && Array.isArray(json.users)) {
            return json.users.map((u: any) => ({
              id: u.id,
              user_id: u.id,
              email: u.email,
              display_name: u.display_name,
              role: u.role,
            }));
          }
        }
      } catch {}

      // Fallback: Supabase user_roles
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  const displayPermsQuery = useQuery({
    queryKey: ["admin-user-display-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_display_permissions" as any)
        .select("*");
      if (error) return [];
      return data || [];
    },
  });

  const addRole = useMutation({
    mutationFn: async () => {
      const target = userId.trim();
      if (!target) throw new Error("ব্যবহারকারী আইডি (UID) বা ইমেইল প্রদান করুন");

      // 1. Cloudflare D1 update
      const res = await fetch("/api/public/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-update-user-role", userId: target, role }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "রোল আপডেট ব্যর্থ হয়েছে");
      }

      // 2. Supabase fallback sync
      try {
        await supabase
          .from("user_roles")
          .upsert({ user_id: target, role }, { onConflict: "user_id" });
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-registered-users-list"] });
      setUserId("");
      toast.success("ইউজার রোল সফলভাবে আপডেট হয়েছে!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      // 1. Demote to user in D1
      await fetch("/api/public/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-update-user-role", userId: id, role: "user" }),
      });
      // 2. Try Supabase
      try {
        await supabase.from("user_roles").delete().or(`id.eq.${id},user_id.eq.${id}`);
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-registered-users-list"] });
      toast.success("রোল সাধারণ ব্যবহারকারীতে নামিয়ে আনা হয়েছে");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const customPermsList = displayPermsQuery.data || [];

  return (
    <div className="space-y-6">
      {selectedUserForPerms && (
        <UserPermissionsDialog
          user={selectedUserForPerms}
          onClose={() => setSelectedUserForPerms(null)}
        />
      )}

      <form
        className="rounded border border-border bg-card p-5 shadow-sm space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          addRole.mutate();
        }}
      >
        <h2 className="font-semibold text-base flex items-center gap-2 border-b border-border/60 pb-2">
          <Shield className="size-4 text-[#2271b1]" /> নতুন অ্যাডমিন বা ইউজার রোল অ্যাসাইন করুন
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="userId" className="text-xs font-semibold">ব্যবহারকারী আইডি (UID) বা ইমেইল অ্যাড্রেস</Label>
            <Input
              id="userId"
              placeholder="যেমন: md.khorshed.alam@gmail.com অথবা e2a8b... (User UID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              💡 আপনি সরাসরি ব্যবহারকারীর ইমেইল অ্যাড্রেস বা সাবস্ক্রাইবার তালিকা থেকে UID কপি করে এখানে ব্যবহার করতে পারেন।
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roleSelect" className="text-xs font-semibold">রোল নির্বাচন করুন</Label>
            <select
              id="roleSelect"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user")}
              className="h-9 w-full rounded border border-input bg-background px-3 text-xs"
            >
              <option value="admin">Admin (অ্যাডমিন)</option>
              <option value="user">User (ব্যবহারকারী)</option>
            </select>
          </div>
        </div>
        <Button type="submit" disabled={addRole.isPending} size="sm" className="bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer">
          <UserCheck className="size-3.5 mr-1.5" /> রোল সংরক্ষণ করুন
        </Button>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">বর্তমান রোলসমূহের তালিকা:</h3>
        <div className="divide-y divide-border rounded border border-border bg-card shadow-sm">
          {rolesList.data?.map((r) => {
            const hasCustomPerms = customPermsList.some((p: any) => p.user_id === r.user_id);
            const isSuperAdmin = r.email?.toLowerCase() === "notabene.inc@gmail.com";
            const isAdminRole = r.role === "admin";
            return (
              <div key={r.id || r.user_id} className="flex items-center justify-between p-3.5 flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground">
                      {r.display_name ? `${r.display_name} • ` : ""}{r.email || r.user_id}
                    </p>
                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                      isAdminRole
                        ? "bg-[#2271b1]/15 text-[#2271b1] border border-[#2271b1]/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}>
                      {isSuperAdmin ? "Super Admin" : isAdminRole ? "Admin" : "User"}
                    </span>
                    {hasCustomPerms && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        <Sliders className="size-2.5" /> কাস্টম পারমিশন
                      </span>
                    )}
                  </div>
                  {r.email && r.user_id !== r.email && (
                    <p className="text-[10px] font-mono text-muted-foreground">{r.user_id}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 cursor-pointer"
                    onClick={() => setSelectedUserForPerms({ id: r.user_id, email: r.email })}
                  >
                    <SlidersHorizontal className="size-3 mr-1" /> পারমিশন সেটিংস
                  </Button>
                  {!isSuperAdmin && isAdminRole && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove Admin Role"
                      title="অ্যাডমিন রোল প্রত্যাহার করুন"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => removeRole.mutate(r.user_id || r.id)}
                    >
                      <UserX className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SubscribersAdmin() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<{ id?: string; email?: string } | null>(null);
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ১. সমস্ত প্রোফাইল ও রেজিস্টার্ড ইউজার কুয়েরি
  const profilesQuery = useQuery({
    queryKey: ["admin-all-profiles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
  });

  // ২. নিউজলেটার সাবস্ক্রাইবার
  const list = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("newsletter_subscribers")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
  });

  // ৩. ইউজার রোলস
  const rolesQuery = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("user_roles").select("*");
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
  });

  // ৪. ক্যাটাগরি ও পারমিশনসমূহ
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) return [];
      return data || [];
    },
  });

  const accessQuery = useQuery({
    queryKey: ["all-category-user-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_user_access" as any)
        .select("*");
      if (error) return [];
      return data || [];
    },
  });

  const displayPermsQuery = useQuery({
    queryKey: ["admin-user-display-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_display_permissions" as any)
        .select("*");
      if (error) return [];
      return data || [];
    },
  });

  const toggleAccess = useMutation({
    mutationFn: async ({ categoryId, email, userId, existsId }: { categoryId: string; email?: string; userId?: string; existsId?: string }) => {
      if (existsId) {
        const { error } = await supabase
          .from("category_user_access" as any)
          .delete()
          .eq("id", existsId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("category_user_access" as any)
          .insert({
            category_id: categoryId,
            email: email ? email.trim().toLowerCase() : null,
            user_id: userId || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-category-user-access"] });
      queryClient.invalidateQueries({ queryKey: ["category-access-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-category-access"] });
      toast.success("ক্যাটাগরি অ্যাক্সেস পারমিশন আপডেট হয়েছে!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("আইডি ক্লিপবোর্ডে কপি হয়েছে!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const restrictedCategories = (categoriesQuery.data || []).filter((c: any) => c.is_restricted);
  const allAccessList = accessQuery.data || [];
  const customPermsList = displayPermsQuery.data || [];

  // সব সোর্স থেকে ইউজারদের একত্রিত করা (Merge unique users from all sources)
  const userMap = new Map<string, { id?: string; email: string; display_name?: string; source: string; created_at?: string }>();

  // Profiles (Registered users)
  (profilesQuery.data || []).forEach((p: any) => {
    if (p.email) {
      const em = p.email.trim().toLowerCase();
      userMap.set(em, {
        id: p.id,
        email: em,
        display_name: p.display_name,
        source: "রেজিস্টার্ড ইউজার",
        created_at: p.created_at,
      });
    }
  });

  // Newsletter subscribers
  (list.data || []).forEach((s: any) => {
    if (s.email) {
      const em = s.email.trim().toLowerCase();
      if (!userMap.has(em)) {
        userMap.set(em, {
          id: s.id,
          email: em,
          source: "নিউজলেটার গ্রাহক",
          created_at: s.created_at,
        });
      }
    }
  });

  // Custom Display Permissions
  customPermsList.forEach((cp: any) => {
    if (cp.email) {
      const em = cp.email.trim().toLowerCase();
      if (!userMap.has(em)) {
        userMap.set(em, {
          id: cp.user_id,
          email: em,
          source: "কাস্টম পারমিশনপ্রাপ্ত",
          created_at: cp.created_at,
        });
      }
    }
  });

  // User Roles
  (rolesQuery.data || []).forEach((r: any) => {
    if (r.user_id) {
      const existing = Array.from(userMap.values()).find((u) => u.id === r.user_id);
      if (!existing) {
        userMap.set(r.user_id, {
          id: r.user_id,
          email: `UID: ${r.user_id.slice(0, 8)}...`,
          source: `রোল: ${r.role}`,
          created_at: r.created_at,
        });
      }
    }
  });

  const allUsers = Array.from(userMap.values()).filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return u.email.toLowerCase().includes(term) || (u.display_name && u.display_name.toLowerCase().includes(term));
  });

  const handleOpenCustomEmailPerms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmailInput.trim()) {
      toast.error("অনুগ্রহ করে একটি সঠিক ইমেইল বা ইউজার আইডি লিখুন");
      return;
    }
    const cleanEmail = customEmailInput.trim().toLowerCase();
    setSelectedUserForPerms({ email: cleanEmail });
    setCustomEmailInput("");
  };

  return (
    <div className="space-y-6">
      {selectedUserForPerms && (
        <UserPermissionsDialog
          user={selectedUserForPerms}
          onClose={() => setSelectedUserForPerms(null)}
        />
      )}

      {/* হেডার ও বর্ণনা */}
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          গ্রাহক ও ইউজার পারমিশন নিয়ন্ত্রণ প্যানেল
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          আপনার ওয়েবসাইটে সাইন-আপ করা যেকোনো গ্রাহক বা গবেষককে নির্দিষ্ট অনুবাদ, বিজ্ঞানভিত্তিক অর্থ ও মেটা ডাটা দেখার স্বতন্ত্র অনুমতি দিন।
        </p>
      </div>

      {/* সরাসরি ইমেইল দিয়ে তাৎক্ষণিক পারমিশন কনফিগারেশন কার্ড */}
      <form
        onSubmit={handleOpenCustomEmailPerms}
        className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-xs"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Plus className="size-3.5 text-primary" />
          <span>যেকোনো ইমেইল বা আইডিতে সরাসরি পারমিশন দিন:</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="যেমন: researcher@example.com বা ইউজার আইডি..."
            value={customEmailInput}
            onChange={(e) => setCustomEmailInput(e.target.value)}
            className="h-9 text-xs flex-1 bg-background"
          />
          <Button type="submit" size="sm" className="h-9 text-xs px-4 cursor-pointer shrink-0">
            <SlidersHorizontal className="size-3.5 mr-1.5" />
            পারমিশন কনফিগার করুন
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          💡 ব্যবহারকারী এখনো রেজিস্টার না করে থাকলেও তার ইমেইল দিয়ে পারমিশন দিয়ে রাখতে পারবেন; তিনি যখনই ওই ইমেইল দিয়ে লগইন করবেন তখন থেকেই তার জন্য অনুমোদিত লেয়ারগুলো স্বয়ংক্রিয়ভাবে দৃশ্যমান হবে।
        </p>
      </form>

      {/* সার্চ ও ফিল্টার বার */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="ইউজার ইমেইল দিয়ে সার্চ করুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs bg-card"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          মোট ইউজার: {allUsers.length} জন
        </span>
      </div>

      {/* ইউজারের তালিকা */}
      <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {allUsers.length === 0 && (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-muted-foreground">এখনো কোনো ইউজার তালিকাভুক্ত নেই।</p>
            <p className="text-[11px] text-muted-foreground">
              ওপরের বক্সে যেকোনো ইমেইল লিখে সরাসরি <strong>'পারমিশন কনফিগার করুন'</strong> বাটনে চাপ দিন।
            </p>
          </div>
        )}

        {allUsers.map((s) => {
          const userEmail = s.email?.toLowerCase();
          const grantedForThisUser = allAccessList.filter(
            (a: any) => (userEmail && a.email?.toLowerCase() === userEmail) || (s.id && a.user_id === s.id)
          );

          const customPermRecord = customPermsList.find(
            (p: any) => (userEmail && p.email?.toLowerCase() === userEmail) || (s.id && p.user_id === s.id)
          );

          return (
            <div
              key={s.email}
              className="flex flex-col gap-3 p-4 text-xs hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm">{s.email}</span>
                    {s.display_name && (
                      <span className="text-xs text-muted-foreground font-medium">
                        ({s.display_name})
                      </span>
                    )}

                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50">
                      {s.source}
                    </span>

                    {customPermRecord ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Sliders className="size-2.5" /> কাস্টম পারমিশন সক্রিয়
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/40">
                        <Globe className="size-2.5" /> গ্লোবাল ডিফল্ট
                      </span>
                    )}
                  </div>

                  {s.id && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 select-all">
                        আইডি: {s.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(s.id!)}
                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium cursor-pointer"
                      >
                        {copiedId === s.id ? (
                          <>
                            <Check className="size-3 text-emerald-500" /> কপি হয়েছে
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" /> কপি
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold px-3 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                    onClick={() => setSelectedUserForPerms({ id: s.id, email: s.email })}
                  >
                    <SlidersHorizontal className="size-3.5 mr-1.5 text-emerald-600" />
                    ডিসপ্লে ও অ্যাক্সেস পারমিশন
                  </Button>
                </div>
              </div>

              {/* রেস্ট্রিকটেড ক্যাটাগরি পারমিশন চেকলিস্ট */}
              {restrictedCategories.length > 0 && (
                <div className="mt-1 pt-2.5 border-t border-border/50">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                    রেস্ট্রিকটেড আর্টিকেল ক্যাটাগরি অ্যাক্সেস:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {restrictedCategories.map((cat: any) => {
                      const accessRecord = grantedForThisUser.find((a: any) => a.category_id === cat.id);
                      const isGranted = Boolean(accessRecord);

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            toggleAccess.mutate({
                              categoryId: cat.id,
                              email: s.email,
                              userId: s.id,
                              existsId: accessRecord?.id,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                            isGranted
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs"
                              : "border-border/80 bg-card text-muted-foreground hover:border-amber-500/50 hover:bg-amber-500/5"
                          }`}
                        >
                          {isGranted ? (
                            <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Plus className="size-3 text-muted-foreground" />
                          )}
                          <span>{cat.name_bn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}