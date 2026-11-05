import { GoogleSearchConsolePerformance } from "@/components/GoogleSearchConsolePerformance";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
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
  Headphones,
  Gauge,
  Pin,
  Palette,
  Wrench,
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Home,
  Layers,
  Activity,
  Smartphone,
  Video,
  FileImage,
  Cloud,
  Database,
} from "lucide-react";
import { FormattedTranslation } from "@/components/FormattedTranslation";
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
import { SURAH_META_MAP } from "@/lib/surahMeta";
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
import { QuranExportAdmin } from "@/components/QuranExportAdmin";
import { SurahAudioAdmin } from "@/components/SurahAudioAdmin";
import { WordPressDashboardOverview } from "@/components/WordPressDashboardOverview";
import { WordPressSettingsAdmin } from "@/components/WordPressSettingsAdmin";
import { VisitorAnalyticsAdmin } from "@/components/VisitorAnalyticsAdmin";
import { SeoCenterAdmin } from "@/components/SeoCenterAdmin";
import { CloudflareD1StatusAdmin } from "@/components/CloudflareD1StatusAdmin";
import { CloudflareAnalyticsAdmin } from "@/components/CloudflareAnalyticsAdmin";
import { RegisteredUsersAdmin } from "@/components/RegisteredUsersAdmin";
import { PostsExportImportAdmin } from "@/components/PostsExportImportAdmin";
import { TwoFactorAdmin } from "@/components/TwoFactorAdmin";
import { VideoTranscriberAdmin } from "@/components/VideoTranscriberAdmin";
import { ImageToTextAdmin } from "@/components/ImageToTextAdmin";
import { QuranExplorerLogo } from "@/components/QuranExplorerLogo";
import { PageHeroBackground } from "@/components/PageHeroBackground";
import {
  exportToWordPressXml,
  exportToJson,
  exportToCsv,
  exportToMarkdownZip,
  downloadFile,
  downloadBlob,
} from "@/lib/postExportImportEngine";
import { saveSurahOffline } from "@/lib/offline";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: typeof search.tab === "string" ? search.tab : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "অ্যাডমিন ড্যাশবোর্ড — Alam M" },
      { name: "description", content: "আর্টিকেল ও কনটেন্ট ব্যবস্থাপনা প্যানেল।" },
      { name: "robots", content: "noindex" },
    ],
  }),
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
/* DUAL-MODE RICH TEXT EDITOR (IMPORTED COMPONENT)                            */
/* ========================================================================== */
const RichTextEditor = React.lazy(() =>
  import("@/components/RichTextEditor").then((m) => ({
    default: m.RichTextEditor,
  }))
);
import {
  BANGLA_DISCLAIMER,
  ENGLISH_DISCLAIMER,
  parseArticleDisclaimer,
  injectArticleDisclaimer,
  stripArticleDisclaimerComment,
} from "@/components/ArticleDisclaimerBox";


/* ========================================================================== */
/* MAIN ADMIN PAGE                                                            */
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

  // WordPress UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wp_admin_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [screenOptionsOpen, setScreenOptionsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<"overview" | "navigation">("overview");
  const { settings: designSettings, updateSettings: updateDesignSettings } = useAppDesignSettings();
  const mobileFloatingPopupEnabled = designSettings.mobileFloatingPopupEnabled;
  const setMobileFloatingPopupEnabled = (val: boolean) => {
    updateDesignSettings({ mobileFloatingPopupEnabled: val });
  };

  // Dropdown states for Top Admin Bar
  const [siteDropdown, setSiteDropdown] = useState(false);
  const [newDropdown, setNewDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [purgingCfHeader, setPurgingCfHeader] = useState(false);
  const [flushingRedisHeader, setFlushingRedisHeader] = useState(false);

  const handleHeaderPurgeCloudflare = async () => {
    if (purgingCfHeader) return;
    setPurgingCfHeader(true);
    try {
      let responseMessage = "ক্লাউডফ্লেয়ার এজ ও ব্রাউজার ক্যাশ সফলভাবে ক্লিয়ার হয়েছে!";
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
        // Fallback to local edge/browser cache purge
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
      toast.error(err?.message || "ক্লাউডফ্লেয়ার ক্যাশ ক্লিয়ার ব্যর্থ হয়েছে");
    } finally {
      setPurgingCfHeader(false);
    }
  };

  const handleHeaderFlushRedis = async () => {
    if (flushingRedisHeader) return;
    setFlushingRedisHeader(true);
    try {
      let responseMessage = "রেডিস ও ইন-মেমরি র‍্যাম ক্যাশ সফলভাবে ক্লিয়ার হয়েছে!";
      try {
        const res = await fetch("/api/admin/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "flush" }),
        });
        const data = await res.json();
        if (data?.message) {
          responseMessage = data.message;
        }
      } catch {
        // Fallback to local queryClient cache flush
      }
      queryClient.clear();
      await queryClient.invalidateQueries();
      toast.success(responseMessage);
    } catch (err: any) {
      toast.error(err?.message || "রেডিস ক্যাশ ক্লিয়ার ব্যর্থ হয়েছে");
    } finally {
      setFlushingRedisHeader(false);
    }
  };

  // Widget visibility for WordPress Dashboard (persisted in localStorage)
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const defaultWidgets = {
      welcome: true,
      atAGlance: true,
      quickDraft: true,
      recentActivity: true,
      siteHealth: true,
      visitorAnalytics: true,
    };
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wp_dashboard_widgets");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...defaultWidgets,
            ...parsed,
            visitorAnalytics: parsed.visitorAnalytics !== false,
          };
        } catch {
          // fallback
        }
      }
    }
    return defaultWidgets;
  });

  const toggleWidget = (key: keyof typeof visibleWidgets) => {
    setVisibleWidgets((prev: typeof visibleWidgets) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        localStorage.setItem("wp_dashboard_widgets", JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("wp_admin_sidebar_collapsed", String(next));
      }
      return next;
    });
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

  // Authentic WordPress Hierarchical Navigation Structure
  const wpNavMenu = [
    {
      id: "dashboard",
      title: "ড্যাশবোর্ড",
      icon: Gauge,
      defaultTab: "dashboard",
      subItems: [
        { tab: "dashboard", label: "হোম (Home)" },
        { tab: "d1-status", label: "Cloudflare D1 ডেটাবেজ" },
        { tab: "offline", label: "আপডেট (Updates)" },
      ],
    },
    {
      id: "analytics",
      title: "ভিজিটর অ্যানালিটিক্স",
      icon: Activity,
      defaultTab: "visitor-analytics",
      badge: liveVisitorsCount > 0 ? liveVisitorsCount : undefined,
      subItems: [
        { tab: "visitor-analytics", label: "লাইভ ভিজিটর ও আইপি" },
        { tab: "visitor-analytics", label: "ব্রাউজিং সময় ও গ্রাফ" },
      ],
    },
    {
      id: "cloudflare-traffic",
      title: "ক্লাউডফ্লেয়ার ট্র্যাফিক",
      icon: Cloud,
      defaultTab: "cf-requests",
      badge: "Edge",
      subItems: [
        { tab: "cf-requests", label: "অনুরোধ ও ট্রাফিক (Requests)" },
        { tab: "cf-visitors", label: "ভিজিটর ও দেশ (Visitors)" },
        { tab: "cf-performance", label: "পারফরম্যান্স ও স্পিড (Performance)" },
        { tab: "cf-security", label: "নিরাপত্তা ও থ্রেট (Security)" },
        { tab: "cf-cache", label: "ক্যাশ ও ব্যান্ডউইথ (Cache)" },
        { tab: "cf-origin", label: "অরিজিন ও D1 (Origin & Workers)" },
        { tab: "cf-dns", label: "ডিএনএস নেটওয়ার্ক (DNS)" },
      ],
    },
    {
      id: "seo",
      title: "এসইও ও সার্চ ইঞ্জিন",
      icon: Globe,
      defaultTab: "seo-center",
      subItems: [
        { tab: "seo-gsc", label: "গুগল সার্চ কনসোল পারফরম্যান্স" },
        { tab: "seo-center", label: "সার্চ কনসোল ও সাইটম্যাপ" },
        { tab: "seo-center", label: "আর্টিকেল এসইও অডিট" },
        { tab: "seo-center", label: "সার্চ ট্র্যাফিক ও রেফারেল" },
      ],
    },
    {
      id: "posts",
      title: "পোস্টসমূহ",
      icon: Pin,
      defaultTab: "articles",
      subItems: [
        { tab: "articles", label: "সকল পোস্ট" },
        { tab: "articles", label: "নতুন পোস্ট যোগ করুন" },
        { tab: "categories", label: "ক্যাটাগরি" },
        { tab: "tags", label: "ট্যাগসমূহ" },
      ],
    },
    {
      id: "quran",
      title: "কুরআন ডেটা",
      icon: BookOpen,
      defaultTab: "translations",
      subItems: [
        { tab: "translations", label: "আয়াত ও অনুবাদ" },
        { tab: "surah-audio", label: "সুরার অডিও" },
        { tab: "quran-export", label: "PDF ও E-Book এক্সপোর্ট" },
      ],
    },
    {
      id: "reading-settings",
      title: "পঠন ও লেয়ার অনুমতি",
      icon: Layers,
      defaultTab: "settings-reading",
      subItems: [
        { tab: "settings-reading", label: "লেয়ার ও এক্সেস কন্ট্রোল" },
      ],
    },
    {
      id: "pages",
      title: "পেজসমূহ",
      icon: FileCode,
      defaultTab: "pages",
      subItems: [
        { tab: "pages", label: "সকল পেজ" },
      ],
    },
    {
      id: "messages",
      title: "মন্তব্য ও বার্তা",
      icon: MessageSquare,
      badge: unreadMessagesCount,
      defaultTab: "messages",
      subItems: [
        { tab: "messages", label: "সকল বার্তা" },
      ],
    },
    {
      id: "appearance",
      title: "অ্যাপিয়ারেন্স",
      icon: Palette,
      defaultTab: "menu",
      subItems: [
        { tab: "menu", label: "মেনু কনফিগারেশন" },
        { tab: "social", label: "সোশ্যাল মিডিয়া" },
      ],
    },
    {
      id: "users",
      title: "ব্যবহারকারী",
      icon: Users,
      defaultTab: "registered-users",
      subItems: [
        { tab: "registered-users", label: "নিবন্ধিত অ্যাকাউন্ট ও লগইন" },
        { tab: "roles", label: "ইউজার রোল ও পারমিশন" },
        { tab: "2fa-security", label: "2FA সিকিউরিটি (Google Authenticator)" },
        { tab: "subs", label: "নিউজলেটার গ্রাহক" },
        { tab: "posts", label: "লেখক ও গবেষক" },
      ],
    },
    {
      id: "tools",
      title: "টুলস",
      icon: Wrench,
      defaultTab: "import",
      subItems: [
        { tab: "video-transcriber", label: "ভিডিও ট্রান্সক্রিপশন ও টাইমস্ট্যাম্প" },
        { tab: "image-to-text", label: "ইমেজ টু টেক্সট (OCR)" },
        { tab: "import", label: "পোস্ট ইমপোর্ট ও এক্সপোর্ট" },
        { tab: "export", label: "পোস্ট এক্সপোর্ট" },
        { tab: "offline", label: "অফলাইন সিঙ্ক ও ক্যাশ" },
        { tab: "d1-status", label: "Cloudflare D1 ও এজ স্ট্যাটাস" },
      ],
    },
    {
      id: "settings",
      title: "সেটিংস",
      icon: Settings,
      defaultTab: "settings-general",
      subItems: [
        { tab: "settings-general", label: "সাধারণ (General)" },
        { tab: "settings-header-footer", label: "হেডার ও ফুটার (Header & Footer)" },
        { tab: "settings-social", label: "সোশ্যাল মিডিয়া ও শেয়ার (Social & Sharing)" },
        { tab: "settings-audio", label: "অডিও ও মিডিয়া (Audio)" },
        { tab: "settings-offline", label: "ক্লাউডফ্লেয়ার ও রেডিস ক্যাশ (Cloudflare & Redis)" },
        { tab: "settings-discussion", label: "মন্তব্য ও যোগাযোগ (Discussion)" },
        { tab: "turnstile", label: "টার্নস্টাইল সিকিউরিটি (Security)" },
        { tab: "2fa-security", label: "2FA সিকিউরিটি (Google Authenticator)" },
      ],
    },
  ];

  const tabTitleMap: Record<string, string> = {
    dashboard: "এডমিন ড্যাশবোর্ড ওভারভিউ",
    "video-transcriber": "ভিডিও ট্রান্সক্রিপশন ও টাইমস্ট্যাম্প (Video Transcriber)",
    "image-to-text": "ইমেজ টু টেক্সট ও ওসিআর (Image to Text OCR)",
    "d1-status": "Cloudflare D1 SQLite ডেটাবেজ ও এজ স্ট্যাটাস (Cloudflare D1 Overview)",
    "supabase-status": "Cloudflare D1 SQLite ডেটাবেজ ও এজ স্ট্যাটাস (Cloudflare D1 Overview)",
    "visitor-analytics": "ভিজিটর ট্র্যাকিং ও অ্যানালিটিক্স (Visitor Analytics)",
    "cloudflare-analytics": "ক্লাউডফ্লেয়ার এজ ও ট্র্যাফিক অ্যানালিটিক্স (Cloudflare Edge Analytics)",
    "cf-requests": "ক্লাউডফ্লেয়ার: অনুরোধ ও ট্রাফিক (Requests & Traffic)",
    "cf-visitors": "ক্লাউডফ্লেয়ার: ভিজিটর ও ভৌগোলিক অবস্থান (Visitors & Locations)",
    "cf-performance": "ক্লাউডফ্লেয়ার: পারফরম্যান্স ও স্পিড (Performance & Speed)",
    "cf-security": "ক্লাউডফ্লেয়ার: নিরাপত্তা ও থ্রেট প্রতিরোধ (Security & Threats)",
    "cf-cache": "ক্লাউডফ্লেয়ার: ক্যাশ রেশিও ও ব্যান্ডউইথ (Cache & Bandwidth)",
    "cf-origin": "ক্লাউডফ্লেয়ার: অরিজিন রেসপন্স ও D1 সীমা (Origin & Edge Workers)",
    "cf-dns": "ক্লাউডফ্লেয়ার: এনিকাস্ট ডিএনএস নেটওয়ার্ক (Anycast DNS)",
    "seo-center": "এসইও ও সার্চ ইঞ্জিন ম্যানেজমেন্ট (SEO Center)",
    articles: "সকল পোস্ট ও প্রবন্ধ (Posts)",
    import: "টুলস: পোস্ট ইমপোর্ট ও এক্সপোর্ট (Posts Import & Export)",
    export: "টুলস: পোস্ট এক্সপোর্ট (Export Posts)",
    translations: "কুরআন আয়াত ও অনুবাদ পরিচালনা",
    "surah-audio": "সুরার অডিও কন্ট্রোল প্যানেল",
    "quran-export": "কুরআন PDF ও E-Book এক্সপোর্টার",
    posts: "লেখক ও গবেষকবৃন্দ (Authors)",
    categories: "বিষয়ভিত্তিক ক্যাটাগরি (Categories)",
    tags: "ট্যাগসমূহ (Tags)",
    pages: "স্থির পেজসমূহ (Pages)",
    messages: "ব্যবহারকারীর বার্তা ও ফিডব্যাক (Messages)",
    menu: "হেডার ও নেভিগেশন মেনু (Menus)",
    social: "সোশ্যাল মিডিয়া প্রোফাইল লিংক",
    "registered-users": "নিবন্ধিত অ্যাকাউন্ট ও সাইন-ইন তালিকা (Registered Users)",
    roles: "অ্যাডমিন ও ইউজার রোল (Roles & Access)",
    subs: "গ্রাহক ও ইউজার পারমিশন (Subscribers)",
    "settings-general": "সাধারণ সেটিংস (General Settings)",
    "settings-header-footer": "হেডার ও ফুটার সেটিংস (Header & Footer Settings)",
    "settings-social": "সোশ্যাল মিডিয়া ও শেয়ার সেটিংস (Social Media & Sharing)",
    "settings-reading": "পঠন ও লেয়ার অনুমতি (Reading Settings)",
    "settings-audio": "অডিও ও মিডিয়া সেটিংস (Audio Settings)",
    "settings-offline": "ক্লাউডফ্লেয়ার ও রেডিস ক্যাশ সেটিংস (Cloudflare & Redis Cache)",
    "settings-discussion": "মন্তব্য ও যোগাযোগ সেটিংস (Discussion Settings)",
    turnstile: "ক্লাউডফ্লেয়ার টার্নস্টাইল সিকিউরিটি কী (Security Settings)",
    "2fa-security": "২-ফ্যাক্টর নিরাপত্তা ও গুগল প্রমাণীকরণ (2FA / Google Authenticator)",
    offline: "অফলাইন ডেটা সিঙ্ক ও ক্যাশ স্ট্যাটাস",
  };

  if (!authTimedOut && (loading || (user && roleLoading))) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1d2327]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-4 border-[#2271b1] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-300">এডমিন ড্যাশবোর্ড লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f0f1] px-4">
        <div className="w-full max-w-sm rounded border border-[#c3c4c7] bg-white p-6 text-center shadow-xs">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#1d2327] p-2 shadow-xs">
            <Lock className="size-6 text-[#ecd599]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1d2327]">অ্যাডমিন প্রবেশাধিকার সংরক্ষিত</h2>
          <p className="mt-1 text-xs text-[#646970]">শুধুমাত্র অনুমোদিত অ্যাডমিন এই প্যানেলে প্রবেশ করতে পারবেন।</p>
          <Button asChild className="mt-5 w-full bg-[#2271b1] hover:bg-[#135e96] text-white">
            <Link to="/auth" search={{ redirect: "/admin" }}>লগইন করুন (Log In)</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#2c3338] dark:bg-[#121212] dark:text-[#f0f0f1] font-sans antialiased w-full max-w-full overflow-x-hidden">
      {importModalType && (
        <InlineImportModal type={importModalType} onClose={() => setImportModalType(null)} />
      )}

      {/* 1. TOP WORDPRESS ADMIN BAR (#wpadminbar) */}
      <div
        id="wpadminbar"
        className="fixed top-0 left-0 right-0 h-8 bg-[var(--gradient-hero)] text-stone-800 dark:text-stone-200 z-50 flex items-center justify-between px-2 text-[13px] border-b border-[#c4aa82]/60 dark:border-[#b88e58]/35 select-none backdrop-blur-md shadow-xs contain-paint"
      >
        <PageHeroBackground intensity="subtle" fadeBottom={false} />
        {/* Left Side */}
        <div className="flex items-center gap-1 relative z-10">
          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-8 px-2 hover:bg-white/40 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 hover:text-[#8e5a07] dark:hover:text-[#ecd599] cursor-pointer transition-colors"
            title="মেনু টগল"
          >
            <MenuIcon className="size-4" />
          </button>

          {/* Qur'an Explorer Branded Logo with Dropdown */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setSiteDropdown(true)}
            onMouseLeave={() => setSiteDropdown(false)}
          >
            <Link
              to="/"
              className="flex items-center gap-1.5 h-8 px-2 hover:bg-white/40 dark:hover:bg-white/10 text-stone-800 dark:text-stone-200 hover:text-[#8e5a07] dark:hover:text-[#ecd599] cursor-pointer transition-colors group select-none"
              title="Alam M — হোমপেজে যান (Visit Site)"
            >
              <div className="flex flex-col justify-center leading-none shrink-0 py-0.5">
                <QuranExplorerLogo size="xs" />
              </div>
              <ChevronDown className="size-2.5 text-[#8c8f94] group-hover:text-[#ecd599] transition-transform ml-0.5" />
            </Link>
            {siteDropdown && (
              <div
                className="absolute left-0 top-8 w-52 bg-[var(--gradient-hero)] text-stone-800 dark:text-stone-200 py-1 shadow-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-2 border-t-[#b88e58] z-50 text-xs rounded-b backdrop-blur-md overflow-hidden"
              >
                <div className="px-3 py-1.5 font-bold text-stone-900 dark:text-stone-100 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/25 bg-white/30 dark:bg-black/30 flex items-center justify-between">
                  <span>Alam M</span>
                  <span className="text-[10px] text-[#8e5a07] dark:text-[#ecd599] font-mono">v4.0.0</span>
                </div>
                <Link
                  to="/"
                  className="flex items-center justify-between px-3 py-1.5 hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors"
                  onClick={() => setSiteDropdown(false)}
                >
                  <span className="flex items-center gap-1.5">
                    <Home className="size-3 text-[#b07818] dark:text-[#ecd599]" />
                    <span>ওয়েবসাইট দেখুন (Visit Site)</span>
                  </span>
                  <ExternalLink className="size-3 opacity-60" />
                </Link>
                <Link
                  to="/about"
                  className="block px-3 py-1.5 hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors"
                  onClick={() => setSiteDropdown(false)}
                >
                  আমাদের সম্পর্কে (About)
                </Link>
                <Link
                  to="/articles"
                  className="block px-3 py-1.5 hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors"
                  onClick={() => setSiteDropdown(false)}
                >
                  লেখালেখি (Articles)
                </Link>
                <Link
                  to="/contact"
                  className="block px-3 py-1.5 hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors"
                  onClick={() => setSiteDropdown(false)}
                >
                  সহায়তা ফোরাম (Support)
                </Link>
              </div>
            )}
          </div>

          {/* Updates icon */}
          <button
            type="button"
            onClick={() => setActiveTab("offline")}
            className="flex items-center gap-1 h-8 px-2 hover:bg-white/40 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 hover:text-[#8e5a07] dark:hover:text-[#ecd599] cursor-pointer transition-colors"
            title="আপডেট ও অফলাইন সিঙ্ক"
          >
            <RefreshCw className="size-3" />
            <span className="hidden sm:inline text-[11px]">0</span>
          </button>

          {/* Comments / Messages */}
          <button
            type="button"
            onClick={() => setActiveTab("messages")}
            className="flex items-center gap-1 h-8 px-2 hover:bg-white/40 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 hover:text-[#8e5a07] dark:hover:text-[#ecd599] cursor-pointer transition-colors"
            title="বার্তা ও ফিডব্যাক"
          >
            <MessageSquare className="size-3.5" />
            {unreadMessagesCount > 0 && (
              <span className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white leading-none shadow-xs">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* + New dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNewDropdown(!newDropdown)}
              className="flex items-center gap-1 h-8 px-2.5 hover:bg-white/40 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 hover:text-[#8e5a07] dark:hover:text-[#ecd599] cursor-pointer transition-colors"
            >
              <Plus className="size-3.5 text-[#b07818] dark:text-[#ecd599]" />
              <span className="text-xs">নতুন</span>
            </button>
            {newDropdown && (
              <div
                className="absolute left-0 top-8 w-44 bg-[var(--gradient-hero)] text-stone-800 dark:text-stone-200 py-1 shadow-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-2 border-t-[#b88e58] z-50 text-xs rounded-b backdrop-blur-md overflow-hidden"
                onMouseLeave={() => setNewDropdown(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("articles");
                    setNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer"
                >
                  <Pin className="size-3 text-[#b07818] dark:text-[#ecd599]" />
                  <span>পোস্ট (Post)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("surah-audio");
                    setNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer"
                >
                  <Headphones className="size-3 text-[#b07818] dark:text-[#ecd599]" />
                  <span>সুরার অডিও</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("pages");
                    setNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer"
                >
                  <FileCode className="size-3 text-[#b07818] dark:text-[#ecd599]" />
                  <span>পেজ (Page)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("posts");
                    setNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer"
                >
                  <Users className="size-3 text-[#b07818] dark:text-[#ecd599]" />
                  <span>লেখক ও গবেষক</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("categories");
                    setNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer"
                >
                  <FolderTree className="size-3 text-[#b07818] dark:text-[#ecd599]" />
                  <span>ক্যাটাগরি</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("tags");
                    setNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer"
                >
                  <TagIcon className="size-3 text-[#b07818] dark:text-[#ecd599]" />
                  <span>ট্যাগ (Tag)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right - Cloudflare & Redis Cache Quick Clear + Mobile Floating Popup Quick Toggle */}
        <div className="flex items-center gap-1.5 ml-auto mr-3 relative z-10">
          <button
            type="button"
            onClick={handleHeaderPurgeCloudflare}
            disabled={purgingCfHeader}
            className="flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-semibold cursor-pointer transition-all border bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-500/40 hover:bg-orange-500/30 disabled:opacity-60"
            title="ক্লাউডফ্লেয়ার এজ ক্যাশ এবং ব্রাউজার ক্যাশ ক্লিয়ার করুন (Purge Cloudflare Cache)"
          >
            {purgingCfHeader ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Cloud className="size-3.5" />
            )}
            <span className="hidden sm:inline">ক্লাউডফ্লেয়ার ক্যাশ ক্লিয়ার</span>
            <span className="sm:hidden">CF ক্যাশ</span>
          </button>

          <button
            type="button"
            onClick={handleHeaderFlushRedis}
            disabled={flushingRedisHeader}
            className="flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-semibold cursor-pointer transition-all border bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/30 disabled:opacity-60"
            title="রেডিস ক্যাশ এবং ইন-মেমরি র‍্যাম ক্যাশ ক্লিয়ার করুন (Flush Redis Cache)"
          >
            {flushingRedisHeader ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Database className="size-3.5" />
            )}
            <span className="hidden sm:inline">রেডিস ক্যাশ ক্লিয়ার</span>
            <span className="sm:hidden">Redis ক্যাশ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !mobileFloatingPopupEnabled;
              setMobileFloatingPopupEnabled(next);
              try {
                localStorage.setItem("admin_mobile_floating_popup_enabled", String(next));
              } catch {}
              toast.success(
                next
                  ? "মোবাইলে ভাসমান পপআপ চালু করা হয়েছে"
                  : "মোবাইলে ভাসমান পপআপ বন্ধ করা হয়েছে (পড়ার সুবিধা নিশ্চিত)"
              );
            }}
            className={`hidden md:flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-semibold cursor-pointer transition-all border ${
              mobileFloatingPopupEnabled
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
            }`}
            title="মোবাইল ভিউতে আর্টিকেলে ফ্লোটিং অ্যাডমিন পপআপ চালু বা বন্ধ করুন"
          >
            <Smartphone className="size-3.5" />
            <span>মোবাইল পপআপ: {mobileFloatingPopupEnabled ? "চালু (ON)" : "বন্ধ (OFF)"}</span>
          </button>
        </div>

        {/* Right Side - Howdy, Admin */}
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => setUserDropdown(!userDropdown)}
            className="flex items-center gap-2 h-8 px-2 hover:bg-white/40 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 hover:text-[#8e5a07] dark:hover:text-[#ecd599] cursor-pointer transition-colors"
          >
            <span className="text-xs hidden sm:inline">
              হ্যালো, <strong className="text-stone-900 dark:text-stone-100 font-semibold">{user.email?.split("@")[0] || "admin"}</strong>
            </span>
            <div className="size-5 rounded-sm bg-gradient-to-br from-[#b07818] to-[#b88e58] text-white flex items-center justify-center text-[10px] font-bold uppercase select-none shadow-xs">
              {(user.email?.[0] || "A").toUpperCase()}
            </div>
          </button>
          {userDropdown && (
            <div
              className="absolute right-0 top-8 w-60 bg-[var(--gradient-hero)] text-stone-800 dark:text-stone-200 p-3 shadow-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-t-2 border-t-[#b88e58] z-50 text-xs rounded-b backdrop-blur-md overflow-hidden"
              onMouseLeave={() => setUserDropdown(false)}
            >
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/25">
                <div className="size-9 rounded-sm bg-gradient-to-br from-[#b07818] to-[#b88e58] text-white flex items-center justify-center text-sm font-bold uppercase select-none shadow-xs">
                  {(user.email?.[0] || "A").toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-stone-900 dark:text-stone-100 truncate text-xs">{user.email}</p>
                  <p className="text-[11px] text-[#8e5a07] dark:text-[#ecd599] font-medium">সুপার অ্যাডমিনিস্ট্রেটর</p>
                </div>
              </div>
              <div className="pt-2.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("2fa-security");
                    setUserDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium"
                >
                  <ShieldCheck className="size-3" />
                  <span>২-ফ্যাক্টর নিরাপত্তা (2FA Settings)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("roles");
                    setUserDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-white/40 dark:hover:bg-white/10 hover:text-[#8e5a07] dark:hover:text-[#ecd599] transition-colors cursor-pointer text-xs"
                >
                  প্রোফাইল ও পারমিশন দেখুন
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-1.5 rounded text-red-500 hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <LogOut className="size-3" />
                  <span>লগআউট (Log Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN LAYOUT: SIDEBAR + BODY */}
      <div className="flex pt-8 min-h-screen w-full max-w-full overflow-x-hidden">
        {/* DESKTOP WORDPRESS ADMIN MENU (#adminmenuwrap) */}
        <aside
          id="adminmenuwrap"
          className={`fixed top-8 bottom-0 left-0 bg-[var(--gradient-hero)] text-stone-800 dark:text-stone-200 z-40 hidden md:flex flex-col justify-between select-none border-r border-[#c4aa82]/60 dark:border-[#b88e58]/35 shadow-xl transition-all duration-150 contain-paint ${
            isSidebarCollapsed ? "w-12" : "w-[160px]"
          }`}
        >
          <PageHeroBackground intensity="subtle" fadeBottom={false} />
          <ul id="adminmenu" className="relative z-10 py-2 overflow-y-auto overflow-x-hidden flex-1">
            {wpNavMenu.map((item) => {
              const Icon = item.icon;
              const isCurrent =
                item.subItems.some((s) => s.tab === activeTab) ||
                (item.id === "dashboard" && activeTab === "dashboard") ||
                (item.id === "cloudflare-traffic" && (activeTab === "cloudflare-analytics" || (typeof activeTab === "string" && activeTab.startsWith("cf-"))));

              return (
                <li key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.defaultTab)}
                    className={`relative flex w-full items-center transition-all duration-150 cursor-pointer ${
                      isSidebarCollapsed ? "justify-center h-10 px-0" : "justify-between h-9 px-3"
                    } ${
                      isCurrent
                        ? "bg-gradient-to-r from-[#b07818] to-[#b88e58] text-white font-semibold shadow-xs after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-y-[5px] after:border-y-transparent after:border-r-[5px] after:border-r-[#f0f0f1] dark:after:border-r-[#121212]"
                        : "text-stone-700 dark:text-stone-300 hover:bg-white/45 dark:hover:bg-white/5 hover:text-[#8e5a07] dark:hover:text-[#ecd599]"
                    }`}
                    title={isSidebarCollapsed ? item.title : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 shrink-0 transition-colors ${isCurrent ? "text-white" : "text-[#94764d] dark:text-[#c4aa82]/85 group-hover:text-[#8e5a07] dark:group-hover:text-[#ecd599]"}`} />
                      {!isSidebarCollapsed && (
                        <span className="text-xs truncate">{item.title}</span>
                      )}
                    </div>
                    {!isSidebarCollapsed && typeof item.badge === "number" && item.badge > 0 && (
                      <span className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white leading-none shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Expanded Submenu */}
                  {!isSidebarCollapsed && isCurrent && item.subItems.length > 0 && (
                    <ul className="bg-white/35 dark:bg-[#12171f]/65 backdrop-blur-md py-1 border-y border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                      {item.subItems.map((sub, sIdx) => {
                        const isSubActive = activeTab === sub.tab;
                        return (
                          <li key={sIdx}>
                            <button
                              type="button"
                              onClick={() => setActiveTab(sub.tab)}
                              className={`flex w-full items-center pl-7 pr-3 py-1.5 text-left text-[11px] transition-all cursor-pointer ${
                                isSubActive
                                  ? "text-[#8e5a07] dark:text-[#ecd599] font-bold bg-[#b88e58]/15 border-l-2 border-[#b88e58]"
                                  : "text-stone-600 dark:text-stone-400 hover:text-[#8e5a07] dark:hover:text-[#ecd599] hover:bg-white/35 dark:hover:bg-white/5"
                              }`}
                            >
                              <span>{sub.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Hover Floating Flyout in Collapsed Mode */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-12 top-0 hidden group-hover:block w-48 bg-[var(--gradient-hero)] text-stone-800 dark:text-stone-200 shadow-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 border-l-2 border-l-[#b88e58] z-50 rounded-r-lg py-1 backdrop-blur-md overflow-hidden">
                      <div className="px-3 py-1.5 font-bold text-xs text-[#8e5a07] dark:text-[#ecd599] border-b border-[#c4aa82]/30 dark:border-[#b88e58]/25 bg-white/20 dark:bg-black/20">
                        {item.title}
                      </div>
                      <ul>
                        {item.subItems.map((sub, sIdx) => (
                          <li key={sIdx}>
                            <button
                              type="button"
                              onClick={() => setActiveTab(sub.tab)}
                              className={`block w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                activeTab === sub.tab
                                  ? "bg-gradient-to-r from-[#b07818] to-[#b88e58] text-white font-semibold"
                                  : "hover:bg-white/40 dark:hover:bg-white/5 hover:text-[#8e5a07] dark:hover:text-[#ecd599]"
                              }`}
                            >
                              {sub.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* WordPress Collapse Menu Button */}
          <div className="relative z-10 border-t border-[#c4aa82]/40 dark:border-[#b88e58]/25 p-1.5 bg-white/20 dark:bg-black/20 backdrop-blur-xs">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] text-stone-600 dark:text-stone-400 hover:text-[#8e5a07] dark:hover:text-[#ecd599] hover:bg-white/40 dark:hover:bg-white/10 rounded transition-colors cursor-pointer ${
                isSidebarCollapsed ? "justify-center" : ""
              }`}
              title={isSidebarCollapsed ? "মেনু প্রসারিত করুন" : "মেনু সংকুচিত করুন"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  <span>মেনু সংকুচিত করুন</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER OVERLAY & MENU */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 bg-[var(--gradient-hero)] text-stone-800 dark:text-stone-200 h-full overflow-y-auto flex flex-col justify-between z-10 border-r border-[#c4aa82]/60 dark:border-[#b88e58]/35 shadow-2xl contain-paint">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />
              <div className="relative z-10">
                <div className="flex items-center justify-between p-3 border-b border-[#c4aa82]/30 dark:border-[#b88e58]/25 bg-white/20 dark:bg-black/30 backdrop-blur-xs">
                  <Link
                    to="/"
                    className="flex items-center gap-2 select-none group"
                    onClick={() => setIsMobileMenuOpen(false)}
                    title="Alam M — হোমপেজে যান"
                  >
                    <div className="flex flex-col justify-center leading-none">
                      <QuranExplorerLogo size="sm" />
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 rounded transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <ul className="py-2">
                  {wpNavMenu.map((item) => {
                    const Icon = item.icon;
                    const isCurrent =
                      item.subItems.some((s) => s.tab === activeTab) ||
                      (item.id === "dashboard" && activeTab === "dashboard") ||
                      (item.id === "cloudflare-traffic" && (activeTab === "cloudflare-analytics" || (typeof activeTab === "string" && activeTab.startsWith("cf-"))));
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(item.defaultTab);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3.5 py-2 text-xs transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-gradient-to-r from-[#b07818] to-[#b88e58] text-white font-semibold shadow-xs"
                              : "text-stone-700 dark:text-stone-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-[#8e5a07] dark:hover:text-[#ecd599]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`size-4 ${isCurrent ? "text-white" : "text-[#94764d] dark:text-[#c4aa82]/85"}`} />
                            <span>{item.title}</span>
                          </div>
                          {typeof item.badge === "number" && item.badge > 0 && (
                            <span className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white shadow-xs">
                              {item.badge}
                            </span>
                          )}
                        </button>
                        {isCurrent && item.subItems.length > 0 && (
                          <ul className="bg-white/35 dark:bg-[#12171f]/65 backdrop-blur-md py-1 border-y border-[#c4aa82]/30 dark:border-[#b88e58]/20">
                            {item.subItems.map((sub, sIdx) => (
                              <li key={sIdx}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab(sub.tab);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className={`block w-full text-left pl-9 pr-3 py-1.5 text-[11px] transition-colors ${
                                    activeTab === sub.tab
                                      ? "text-[#8e5a07] dark:text-[#ecd599] font-bold bg-[#b88e58]/15 border-l-2 border-[#b88e58]"
                                      : "text-stone-600 dark:text-stone-400 hover:text-[#8e5a07] dark:hover:text-[#ecd599] hover:bg-white/35 dark:hover:bg-white/5"
                                  }`}
                                >
                                  {sub.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="relative z-10 p-3 border-t border-[#c4aa82]/30 dark:border-[#b88e58]/20 text-[11px] text-stone-500 dark:text-stone-400 text-center bg-white/10 dark:bg-black/20">
                এডমিন ড্যাশবোর্ড &bull; v4.0.0
              </div>
            </div>
          </div>
        )}

        {/* 3. MAIN WORDPRESS CONTENT BODY (#wpbody) */}
        <div
          id="wpbody"
          className={`flex-1 min-w-0 w-full max-w-full overflow-x-hidden transition-all duration-150 ${
            isSidebarCollapsed ? "md:ml-12" : "md:ml-[160px]"
          }`}
        >
          {/* SCREEN META: SCREEN OPTIONS & HELP TOGGLE BUTTONS */}
          <div className="flex justify-end gap-1 px-4 sm:px-6 pt-1 select-none flex-wrap">
            <button
              type="button"
              onClick={() => {
                const next = !mobileFloatingPopupEnabled;
                setMobileFloatingPopupEnabled(next);
                try {
                  localStorage.setItem("admin_mobile_floating_popup_enabled", String(next));
                } catch {}
                toast.success(
                  next
                    ? "মোবাইলে ভাসমান পপআপ চালু করা হয়েছে"
                    : "মোবাইলে ভাসমান পপআপ বন্ধ করা হয়েছে (পড়ার সুবিধা নিশ্চিত)"
                );
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold border border-t-0 border-[#c3c4c7] dark:border-[#3c434a] rounded-b transition-colors cursor-pointer shadow-2xs ${
                mobileFloatingPopupEnabled
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
              }`}
              title="মোবাইল ভিউতে আর্টিকেলে ভাসমান অ্যাডমিন পপআপ প্রদর্শন নিয়ন্ত্রণ করুন"
            >
              <Smartphone className="size-3" />
              <span>মোবাইল পপআপ: {mobileFloatingPopupEnabled ? "চালু (ON)" : "বন্ধ (OFF)"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHelpOpen(!helpOpen);
                if (screenOptionsOpen) setScreenOptionsOpen(false);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-t-0 border-[#c3c4c7] dark:border-[#3c434a] rounded-b transition-colors cursor-pointer ${
                helpOpen
                  ? "bg-white dark:bg-[#1e1e1e] text-[#2271b1] shadow-xs"
                  : "bg-[#f0f0f1] dark:bg-[#2c3338] text-[#50575e] dark:text-[#a7aaad] hover:bg-white dark:hover:bg-[#1e1e1e]"
              }`}
            >
              <span>সহায়তা (Help)</span>
              {helpOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setScreenOptionsOpen(!screenOptionsOpen);
                if (helpOpen) setHelpOpen(false);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-t-0 border-[#c3c4c7] dark:border-[#3c434a] rounded-b transition-colors cursor-pointer ${
                screenOptionsOpen
                  ? "bg-white dark:bg-[#1e1e1e] text-[#2271b1] shadow-xs"
                  : "bg-[#f0f0f1] dark:bg-[#2c3338] text-[#50575e] dark:text-[#a7aaad] hover:bg-white dark:hover:bg-[#1e1e1e]"
              }`}
            >
              <span>স্ক্রিন অপশন (Screen Options)</span>
              {screenOptionsOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
          </div>

          {/* SLIDE DOWN HELP PANEL */}
          {helpOpen && (
            <div className="bg-white dark:bg-[#1e1e1e] border-b border-[#c3c4c7] dark:border-[#3c434a] p-4 shadow-sm mx-4 sm:mx-6 mb-4 rounded-b text-xs transition-all">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-48 border-b sm:border-b-0 sm:border-r border-[#dcdcde] dark:border-[#3c434a] pr-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveHelpTab("overview")}
                    className={`block w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer ${
                      activeHelpTab === "overview"
                        ? "bg-[#2271b1] text-white font-medium"
                        : "text-[#50575e] dark:text-[#a7aaad] hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    সংক্ষিপ্ত বিবরণ (Overview)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHelpTab("navigation")}
                    className={`block w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer ${
                      activeHelpTab === "navigation"
                        ? "bg-[#2271b1] text-white font-medium"
                        : "text-[#50575e] dark:text-[#a7aaad] hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    ন্যাভিগেশন নির্দেশিকা
                  </button>
                </div>
                <div className="flex-1 space-y-2 text-[#50575e] dark:text-[#c3c4c7] leading-relaxed">
                  {activeHelpTab === "overview" ? (
                    <div>
                      <h3 className="font-bold text-[#1d2327] dark:text-white mb-1">
                        এডমিন ড্যাশবোর্ড ওভারভিউ
                      </h3>
                      <p>
                        Alam M-এর এডমিন ড্যাশবোর্ডে আপনাকে স্বাগতম। এই প্যানেল থেকে আপনি সম্পূর্ণ ওয়েবসাইট, গল্প, কবিতা, স্মৃতিকথা, প্রবন্ধ ও ব্যবহারকারী রোল নিয়ন্ত্রণ করতে পারবেন।
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-[#1d2327] dark:text-white mb-1">
                        ন্যাভিগেশন ও ব্যবহার পদ্ধতি
                      </h3>
                      <p>
                        বামের সাইডবার মেনু থেকে যেকোনো সেকশনে প্রবেশ করতে পারেন। উপরের কালো অ্যাডমিন বার দিয়ে দ্রুত নতুন পোস্ট যুক্ত করা, বার্তা দেখা ও সরাসরি লাইভ ওয়েবসাইট ব্রাউজ করা যায়।
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE DOWN SCREEN OPTIONS PANEL */}
          {screenOptionsOpen && (
            <div className="bg-white dark:bg-[#1e1e1e] border-b border-[#c3c4c7] dark:border-[#3c434a] p-4 shadow-sm mx-4 sm:mx-6 mb-4 rounded-b text-xs transition-all">
              <h4 className="font-bold text-[#1d2327] dark:text-white mb-2">
                স্ক্রিনে উপাদান প্রদর্শন করুন (Show on screen)
              </h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleWidgets.welcome}
                    onChange={() => toggleWidget("welcome")}
                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span>স্বাগতম প্যানেল (Welcome Panel)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleWidgets.atAGlance}
                    onChange={() => toggleWidget("atAGlance")}
                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span>এক নজরে (At a Glance)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleWidgets.quickDraft}
                    onChange={() => toggleWidget("quickDraft")}
                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span>দ্রুত খসড়া (Quick Draft)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleWidgets.recentActivity}
                    onChange={() => toggleWidget("recentActivity")}
                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span>সাম্প্রতিক কার্যকলাপ (Activity)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleWidgets.siteHealth}
                    onChange={() => toggleWidget("siteHealth")}
                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span>সাইট হেলথ ও সার্ভার স্ট্যাটাস</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleWidgets.visitorAnalytics}
                    onChange={() => toggleWidget("visitorAnalytics")}
                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span>লাইভ ভিজিটর ও ব্রাউজিং সময়</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer border-l border-[#dcdcde] dark:border-[#3c434a] pl-3 ml-2 font-medium">
                  <input
                    type="checkbox"
                    checked={mobileFloatingPopupEnabled}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setMobileFloatingPopupEnabled(next);
                      try {
                        localStorage.setItem("admin_mobile_floating_popup_enabled", String(next));
                      } catch {}
                      toast.success(
                        next
                          ? "মোবাইলে ভাসমান পপআপ চালু করা হয়েছে"
                          : "মোবাইলে ভাসমান পপআপ বন্ধ করা হয়েছে (পড়ার সুবিধা নিশ্চিত)"
                      );
                    }}
                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span>মোবাইল ভিউতে ভাসমান পপআপ (Mobile Popup)</span>
                </label>
              </div>
            </div>
          )}

          {/* MAIN CONTENT AREA CONTAINER */}
          <main className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 pb-20 sm:pb-24 lg:pb-8">
            {/* LUXURY HERO-STYLE DUAL CTA ACTIONS (ভিডিও ট্রান্সক্রিপশন ও ইমেজ টু টেক্সট) */}
            <div className="mb-6 relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 bg-[var(--gradient-hero)] p-5 shadow-xl contain-paint transition-colors duration-300">
              <PageHeroBackground intensity="subtle" fadeBottom={false} />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-800 dark:text-[#ecd599] shadow-2xs">
                    <Sparkles className="size-3 text-amber-500 dark:text-[#ecd599] animate-pulse" />
                    <span>আলম এম — এআই ও মাল্টিমিডিয়া কনভার্টার</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1e150f] dark:text-white font-serif">
                    ভিডিও ট্রান্সক্রিপশন ও ইমেজ টু টেক্সট (OCR)
                  </h2>
                  <p className="text-xs text-[#50575e] dark:text-[#c3c4c7] max-w-xl">
                    ইউটিউব ও ফেসবুক ভিডিওর টাইমস্ট্যাম্পসহ নিখুঁত স্ক্রিপ্ট এবং যেকোনো পাতার ছবি থেকে তাত্ক্ষণিক বাংলা, আরবি ও ইংরেজি টেক্সট এক্সট্রাক্ট করুন।
                  </p>
                </div>

                {/* 2 PROMINENT CTA BUTTONS */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto shrink-0">
                  {/* CTA BUTTON 1: VIDEO TRANSCRIBER */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("video-transcriber")}
                    className={`group relative flex-1 sm:flex-initial flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl active:scale-[0.98] ${
                      activeTab === "video-transcriber"
                        ? "bg-gradient-to-r from-[#b07818] to-[#b88e58] text-white border-transparent ring-2 ring-[#b88e58]/50"
                        : "bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md text-[#1e150f] dark:text-white border-[#c4aa82]/50 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 hover:border-[#b88e58] dark:hover:border-[#ecd599]"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] shrink-0 group-hover:scale-110 transition-transform">
                      <Video className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold tracking-tight text-[#1e150f] dark:text-white">
                          ভিডিও ট্রান্সক্রিপশন ও টাইমস্ট্যাম্প
                        </span>
                        <Sparkles className="size-3 text-[#b07818] dark:text-[#ecd599] animate-pulse shrink-0" />
                      </div>
                      <p className="text-[10px] text-[#675b4c] dark:text-[#ecd599]/90 truncate">
                        YouTube ও FB ভিডিও • ১+ ঘণ্টা • সব ভাষা
                      </p>
                    </div>
                  </button>

                  {/* CTA BUTTON 2: IMAGE TO TEXT OCR */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("image-to-text")}
                    className={`group relative flex-1 sm:flex-initial flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl active:scale-[0.98] ${
                      activeTab === "image-to-text"
                        ? "bg-gradient-to-r from-[#b07818] to-[#b88e58] text-white border-transparent ring-2 ring-[#b88e58]/50"
                        : "bg-white/45 dark:bg-[#12171f]/60 backdrop-blur-md text-[#1e150f] dark:text-white border-[#c4aa82]/50 dark:border-[#b88e58]/35 border-t-[1.5px] border-t-[#dfc7a5] dark:border-t-[#ecd599]/70 border-b-2 border-b-[#b3946a]/35 dark:border-b-black/60 hover:border-[#b88e58] dark:hover:border-[#ecd599]"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-[#a16e03] dark:text-[#ecd599] shrink-0 group-hover:scale-110 transition-transform">
                      <FileImage className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold tracking-tight text-[#1e150f] dark:text-white">
                          ইমেজ টু টেক্সট (OCR)
                        </span>
                        <Sparkles className="size-3 text-[#b07818] dark:text-[#ecd599] animate-pulse shrink-0" />
                      </div>
                      <p className="text-[10px] text-[#675b4c] dark:text-muted-foreground truncate">
                        ছবি আপলোড / Ctrl+V • বাংলা, আরবি ও ইংরেজি
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* WORDPRESS PAGE HEADER */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#c3c4c7]/60 dark:border-[#3c434a]">
              <div className="flex items-center gap-3">
                <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327] dark:text-[#f0f0f1]">
                  {tabTitleMap[activeTab] || "ড্যাশবোর্ড"}
                </h1>
                {activeTab === "articles" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("article-editor-top");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="border border-[#2271b1] text-[#2271b1] hover:bg-[#2271b1] hover:text-white text-xs px-2.5 py-1 rounded bg-[#f6f7f7] dark:bg-[#2c3338] font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      নতুন যোগ করুন (Add New)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !mobileFloatingPopupEnabled;
                        setMobileFloatingPopupEnabled(next);
                        try {
                          localStorage.setItem("admin_mobile_floating_popup_enabled", String(next));
                        } catch {}
                        toast.success(
                          next
                            ? "মোবাইলে ভাসমান পপআপ চালু করা হয়েছে"
                            : "মোবাইলে ভাসমান পপআপ বন্ধ করা হয়েছে (পড়ার সুবিধা নিশ্চিত)"
                        );
                      }}
                      className="border border-border text-xs px-2.5 py-1 rounded bg-[#f6f7f7] dark:bg-[#2c3338] text-foreground hover:bg-muted font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="মোবাইল ভিউতে আর্টিকেলে ফ্লোটিং অ্যাডমিন পপআপ নিয়ন্ত্রণ"
                    >
                      <Smartphone className="size-3.5 text-primary" />
                      <span>মোবাইল ফ্লোটিং পপআপ: {mobileFloatingPopupEnabled ? "চালু" : "বন্ধ"}</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#646970] dark:text-[#8c8f94]">
                <button
                  type="button"
                  onClick={handleHeaderPurgeCloudflare}
                  disabled={purgingCfHeader}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-medium transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
                  title="ক্লাউডফ্লেয়ার এজ ক্যাশ এবং ব্রাউজার ক্যাশ ক্লিয়ার করুন"
                >
                  {purgingCfHeader ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Cloud className="size-3.5" />
                  )}
                  <span>ক্লাউডফ্লেয়ার ক্যাশ ক্লিয়ার</span>
                </button>
                <button
                  type="button"
                  onClick={handleHeaderFlushRedis}
                  disabled={flushingRedisHeader}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
                  title="রেডিস ক্যাশ এবং ইন-মেমরি র‍্যাম ক্যাশ ক্লিয়ার করুন"
                >
                  {flushingRedisHeader ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Database className="size-3.5" />
                  )}
                  <span>রেডিস ক্যাশ ক্লিয়ার</span>
                </button>
                <span className="hidden lg:inline">&bull;</span>
                <span className="hidden lg:inline">Admin Dashboard Interface</span>
                <span className="hidden sm:inline">&bull;</span>
                <span className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  v4.0.0
                </span>
              </div>
            </div>

            {/* TAB CONTENTS */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* 1. DASHBOARD OVERVIEW */}
              <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
                <WordPressDashboardOverview
                  setActiveTab={setActiveTab}
                  visibleWidgets={visibleWidgets}
                />
              </TabsContent>

              {/* 1.A VIDEO TRANSCRIBER WITH TIMESTAMPS */}
              <TabsContent value="video-transcriber" className="mt-0 focus-visible:outline-none">
                <VideoTranscriberAdmin
                  onSendToArticleDraft={(content, title) => {
                    try {
                      sessionStorage.setItem("admin_draft_content", content);
                      if (title) sessionStorage.setItem("admin_draft_title", title);
                    } catch {}
                    setActiveTab("articles");
                    toast.success("ট্রান্সক্রিপশন টেক্সট আর্টিকেল এডিটরে পাঠানো হয়েছে!");
                  }}
                  onBackToDashboard={() => setActiveTab("dashboard")}
                />
              </TabsContent>

              {/* 1.B IMAGE TO TEXT OCR */}
              <TabsContent value="image-to-text" className="mt-0 focus-visible:outline-none">
                <ImageToTextAdmin
                  onSendToArticleDraft={(content, title) => {
                    try {
                      sessionStorage.setItem("admin_draft_content", content);
                      if (title) sessionStorage.setItem("admin_draft_title", title);
                    } catch {}
                    setActiveTab("articles");
                    toast.success("ওসিআর টেক্সট আর্টিকেল এডিটরে পাঠানো হয়েছে!");
                  }}
                  onBackToDashboard={() => setActiveTab("dashboard")}
                />
              </TabsContent>

              {/* 1.1 VISITOR ANALYTICS */}
              <TabsContent value="visitor-analytics" className="mt-0 focus-visible:outline-none">
                <VisitorAnalyticsAdmin />
              </TabsContent>

{/* 1.1.B CLOUDFLARE EDGE ANALYTICS (7 TABS) */}
              <TabsContent value="cloudflare-analytics" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="requests" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>
              <TabsContent value="cf-requests" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="requests" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>
              <TabsContent value="cf-visitors" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="visitors" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>
              <TabsContent value="cf-performance" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="performance" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>
              <TabsContent value="cf-security" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="security" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>
              <TabsContent value="cf-cache" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="cache" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>
              <TabsContent value="cf-origin" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="origin" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>
              <TabsContent value="cf-dns" className="mt-0 focus-visible:outline-none">
                <CloudflareAnalyticsAdmin initialTab="dns" onTabChange={(t) => setActiveTab(`cf-${t}`)} />
              </TabsContent>

              {/* 1.2 SEO & SEARCH ENGINE CENTER */}
                            {/* 1.1 GOOGLE SEARCH CONSOLE PERFORMANCE */}
              <TabsContent value="seo-gsc" className="mt-0 focus-visible:outline-none">
                <div className="space-y-4">
                  <GoogleSearchConsolePerformance />
                </div>
              </TabsContent>

<TabsContent value="seo-center" className="mt-0 focus-visible:outline-none">
                <SeoCenterAdmin />
              </TabsContent>

              {/* 2. ALL ARTICLES */}
              <TabsContent value="articles" className="mt-0 focus-visible:outline-none">
                <div id="article-editor-top">
                  <ArticlesAdmin
                    onOpenImport={(type) => setImportModalType(type)}
                    onGoToExport={() => setActiveTab("export")}
                  />
                </div>
              </TabsContent>

              {/* 3. IMPORT & EXPORT POSTS */}
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

              {/* 4. TRANSLATIONS */}
              <TabsContent value="translations" className="mt-0 focus-visible:outline-none">
                <TranslationsAdmin />
              </TabsContent>

              {/* 5. SURAH AUDIO */}
              <TabsContent value="surah-audio" className="mt-0 focus-visible:outline-none">
                <SurahAudioAdmin />
              </TabsContent>

              {/* 6. QURAN EXPORT */}
              <TabsContent value="quran-export" className="mt-0 focus-visible:outline-none">
                <QuranExportAdmin />
              </TabsContent>

              {/* 7. AUTHORS */}
              <TabsContent value="posts" className="mt-0 focus-visible:outline-none">
                <div className="space-y-4">
                  <div className="border-b border-border/50 pb-2">
                    <h2 className="text-base font-semibold">লেখক ও গবেষক ব্যবস্থাপনা</h2>
                    <p className="text-xs text-muted-foreground">
                      নতুন লেখক যুক্ত করুন এবং প্রোফাইল তথ্য পরিচালনা করুন।
                    </p>
                  </div>
                  <AuthorsAdmin />
                </div>
              </TabsContent>

              {/* 8. CATEGORIES */}
              <TabsContent value="categories" className="mt-0 focus-visible:outline-none">
                <CategoriesAdmin />
              </TabsContent>

              {/* 9. TAGS */}
              <TabsContent value="tags" className="mt-0 focus-visible:outline-none">
                <TagsAdmin />
              </TabsContent>

              {/* 10. REGISTERED USERS & SIGN-IN LIST */}
              <TabsContent value="registered-users" className="mt-0 focus-visible:outline-none">
                <RegisteredUsersAdmin onGoToRoles={() => setActiveTab("roles")} />
              </TabsContent>

              {/* 11. ROLES */}
              <TabsContent value="roles" className="mt-0 focus-visible:outline-none">
                <RolesAdmin />
              </TabsContent>

              {/* 11. MENUS */}
              <TabsContent value="menu" className="mt-0 focus-visible:outline-none">
                <MenuAdmin />
              </TabsContent>

              {/* 12. PAGES */}
              <TabsContent value="pages" className="mt-0 focus-visible:outline-none">
                <PagesAdmin />
              </TabsContent>

              {/* 13. SOCIAL LINKS */}
              <TabsContent value="social" className="mt-0 focus-visible:outline-none">
                <SocialLinksAdmin />
              </TabsContent>

              {/* 14. SETTINGS (WORDPRESS DASHBOARD SETTINGS) */}
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

              <TabsContent value="settings-audio" className="mt-0 focus-visible:outline-none">
                <WordPressSettingsAdmin initialSubTab="settings-audio" setActiveTab={setActiveTab} />
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

              {/* 15. MESSAGES */}
              <TabsContent value="messages" className="mt-0 focus-visible:outline-none">
                <MessagesAdmin />
              </TabsContent>

              {/* 16. OFFLINE SYNC */}
              <TabsContent value="offline" className="mt-0 focus-visible:outline-none">
                <OfflineSyncAdmin onGoToCacheSettings={() => setActiveTab("settings-offline")} />
              </TabsContent>

              {/* 17. SUBSCRIBERS */}
              <TabsContent value="subs" className="mt-0 focus-visible:outline-none">
                <SubscribersAdmin />
              </TabsContent>

              {/* 18. CLOUDFLARE D1 SQLITE STATUS & OVERVIEW */}
              <TabsContent value="d1-status" className="mt-0 focus-visible:outline-none">
                <CloudflareD1StatusAdmin />
              </TabsContent>
              <TabsContent value="supabase-status" className="mt-0 focus-visible:outline-none">
                <CloudflareD1StatusAdmin />
              </TabsContent>
            </Tabs>

            {/* 4. WORDPRESS FOOTER (#wpfooter) */}
            <footer
              id="wpfooter"
              className="mt-12 border-t border-[#c3c4c7] dark:border-[#3c434a] py-3 text-xs text-[#646970] dark:text-[#8c8f94] flex flex-wrap items-center justify-between gap-2 px-1 select-none"
            >
              <div>
                <span>Alam M দিয়ে তৈরি করার জন্য ধন্যবাদ। (Thank you for creating with Alam M.)</span>
              </div>
              <div>
                <span>ভার্সন ৩.৩.০ (Version 3.3.0)</span>
              </div>
            </footer>
          </main>
        </div>
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
  disclaimer_enabled: true,
  disclaimer_bn: BANGLA_DISCLAIMER,
  disclaimer_en: ENGLISH_DISCLAIMER,
};

function ArticlesAdmin({
  onOpenImport,
  onGoToExport,
}: {
  onOpenImport: (type: "wordpress" | "blogger") => void;
  onGoToExport?: () => void;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [published, setPublished] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
  const [customPublishedAt, setCustomPublishedAt] = useState<string>("");
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
      const dbTags = data || [];
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
          ? (customPublishedAt ? new Date(customPublishedAt).toISOString() : new Date().toISOString())
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
          <React.Suspense fallback={<div className="p-4 text-center text-xs text-muted-foreground animate-pulse border rounded-md">এডিটর লোড হচ্ছে...</div>}>
            <RichTextEditor
              value={form[key]}
              onChange={(val) => setForm((prev) => ({ ...prev, [key]: val }))}
            />
          </React.Suspense>
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
      <form
        className="rounded border border-border bg-card p-5 shadow-sm space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h2 className="font-semibold text-base">
              {editingId ? "আর্টিকেল সম্পাদনা করুন" : "নতুন আর্টিকেল লিখুন"}
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
            পার্মালিঙ্ক: <span className="font-mono text-foreground font-semibold">https://www.quraan.bd/articles/{form.slug || "your-slug"}</span>
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
                  const isSelected = selectedTags.some(
                    (t) => t.toLowerCase() === tagObj.name_bn.toLowerCase()
                  );
                  return (
                    <button
                      key={tagObj.id}
                      type="button"
                      onClick={() => toggleTagSelection(tagObj.name_bn)}
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
              {customPublishedAt && (
                <button
                  type="button"
                  onClick={() => setCustomPublishedAt("")}
                  className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer"
                  title="বর্তমান সময়ে রিসেট করুন"
                >
                  রিসেট
                </button>
              )}
            </Label>
            <Input
              id="post-published-at"
              type="datetime-local"
              value={customPublishedAt}
              onChange={(e) => setCustomPublishedAt(e.target.value)}
              className="h-9 text-xs"
            />
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
                }}
              >
                বাতিল
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
                    <p className="text-[11px] text-muted-foreground">
                      /{a.slug} ·{" "}
                      {a.deleted_at ? (
                        <span className="text-destructive font-medium">মুছে ফেলা হয়েছে (In Trash)</span>
                      ) : (
                        <span className={a.published ? "text-emerald-600 font-medium" : "text-amber-600 font-semibold"}>
                          {a.published ? "প্রকাশিত" : "খসড়া (Draft)"}
                        </span>
                      )}
                    </p>
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
                            setCustomPublishedAt(pubDate ? new Date(pubDate).toISOString().slice(0, 16) : "");
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

      {newsletterModalArticle && (
        <NewsletterBroadcastModal
          article={newsletterModalArticle}
          onClose={() => setNewsletterModalArticle(null)}
          authorsList={authors.data || []}
        />
      )}
    </div>
  );
}

const TRANSLATION_LABELS: Record<string, string> = {
  bn_std: "১. আক্ষরিক অনুবাদ (বাংলা)",
  en_std: "২. Surface Translation (English)",
  bn: "৩. কুরআন অন্বেষা — আধুনিক অনুবাদ (বাংলা)",
  en: "৪. Qur'an Explorer — Modern Translation (English)",
  scientific_bn: "৫. বৈজ্ঞানিক অনুবাদ (বাংলা)",
  scientific_en: "৬. Scientific Translation (English)",
  modern_bn: "৩. কুরআন অন্বেষা — আধুনিক অনুবাদ (বাংলা)",
  modern_en: "৪. Qur'an Explorer — Modern Translation (English)",
  conventional_bn: "১. আক্ষরিক অনুবাদ (বাংলা)",
  conventional_en: "২. Surface Translation (English)",
};

type TranslationType = "bn_std" | "en_std" | "bn" | "en" | "scientific_bn" | "scientific_en";

function TranslationsAdmin() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [surah, setSurah] = useState("1");
  const [ayah, setAyah] = useState("1");
  const [lng, setLng] = useState<TranslationType>("bn_std");
  const [metaBn, setMetaBn] = useState("");
  const [metaEn, setMetaEn] = useState("");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refMarker, setRefMarker] = useState("১");
  const [editingTranslationId, setEditingTranslationId] = useState<string | null>(null);

  const [activeListTab, setActiveListTab] = useState<"overrides" | "dataset">("dataset");
  const [isSyncingSurah, setIsSyncingSurah] = useState(false);

  // Load published articles to allow quick reference selection
  const articlesQuery = useQuery({
    queryKey: ["admin-articles-for-reference"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title_bn, title_en, slug")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const handleInsertReference = () => {
    const cleanMarker = refMarker.trim() || "১";
    const cleanUrl = refUrl.trim();
    const snippet = cleanUrl ? ` [${cleanMarker}](${cleanUrl})` : ` [${cleanMarker}]`;

    setText((prev) => (prev ? prev.trimEnd() + snippet : snippet.trim()));
    if (cleanUrl && !note.trim()) {
      setNote(`রেফারেন্স: [${cleanMarker}] ${cleanUrl}`);
    }

    toast.success(
      cleanUrl
        ? `রেফারেন্স লিঙ্ক [${cleanMarker}] অনুবাদ টেক্সটে যুক্ত হয়েছে!`
        : `রেফারেন্স মার্কার [${cleanMarker}] অনুবাদ টেক্সটে যুক্ত হয়েছে!`
    );

    // Auto increment marker for next reference
    const banglaNums = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০"];
    const bIdx = banglaNums.indexOf(cleanMarker);
    if (bIdx >= 0 && bIdx < banglaNums.length - 1) {
      setRefMarker(banglaNums[bIdx + 1]);
    } else if (/^[A-Y]$/.test(cleanMarker)) {
      setRefMarker(String.fromCharCode(cleanMarker.charCodeAt(0) + 1));
    } else if (/^\d+$/.test(cleanMarker)) {
      setRefMarker(String(Number(cleanMarker) + 1));
    }
  };

  const list = useQuery({
    queryKey: ["admin-verse-translations", surah],
    queryFn: async () => {
      const sNum = Number(surah) || 1;
      let d1Trans: any[] = [];
      try {
        const res = await fetch(`/api/public/verse-translations?surah=${sNum}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.translations)) d1Trans = json.translations;
        }
      } catch {}

      let sbTrans: any[] = [];
      try {
        const { data, error } = await supabase
          .from("verse_translations")
          .select("*")
          .eq("surah", sNum)
          .order("ayah");
        if (!error && data) sbTrans = data;
      } catch {}

      const mergedMap = new Map<string, any>();
      for (const t of sbTrans) mergedMap.set(`${t.ayah}_${t.lang}`, t);
      for (const t of d1Trans) mergedMap.set(`${t.ayah}_${t.lang}`, t);
      return Array.from(mergedMap.values());
    },
  });

  const surahDatasetQuery = useQuery({
    queryKey: ["admin-surah-dataset", surah],
    queryFn: async () => {
      const sNum = Number(surah) || 1;
      const res = await fetch(`/data/quran/surahs/${sNum}.json`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const cloudVersesQuery = useQuery({
    queryKey: ["admin-cloud-verses-status", surah],
    queryFn: async () => {
      const sNum = Number(surah) || 1;
      const { data, error } = await supabase
        .from("quran_verses")
        .select("ayah, modern_translation_bn, modern_translation_en, conventional_bn, conventional_en, meta_bn, meta_en")
        .eq("surah", sNum)
        .order("ayah");
      if (error) return [];
      return data || [];
    },
  });

  const currentAyahData = useMemo(() => {
    const sNum = Number(surah) || 1;
    const aNum = Number(ayah) || 1;
    const baseAyah = surahDatasetQuery.data?.ayahs?.find((x: any) => Number(x.ayah) === aNum) || {
      surah: sNum,
      ayah: aNum,
      words: [],
    };

    const merged = { ...baseAyah };

    // 1. Cloud verses table overrides
    const cloudV = cloudVersesQuery.data?.find((v: any) => Number(v.ayah) === aNum);
    if (cloudV) {
      if (cloudV.modern_translation_bn) merged.modern_translation_bn = cloudV.modern_translation_bn;
      if (cloudV.modern_translation_en) merged.modern_translation_en = cloudV.modern_translation_en;
      if (cloudV.conventional_bn) merged.conventional_bn = cloudV.conventional_bn;
      if (cloudV.conventional_en) merged.conventional_en = cloudV.conventional_en;
      if (cloudV.meta_bn) merged.meta_bn = cloudV.meta_bn;
      if (cloudV.meta_en) merged.meta_en = cloudV.meta_en;
    }

    // 2. verse_translations overrides
    const trans = list.data?.filter((t: any) => Number(t.ayah) === aNum) || [];
    for (const t of trans) {
      if ((t.lang === "bn" || t.lang === "modern_bn") && t.text) {
        merged.modern_translation_bn = t.text;
      } else if ((t.lang === "en" || t.lang === "modern_en") && t.text) {
        merged.modern_translation_en = t.text;
      } else if ((t.lang === "bn_std" || t.lang === "conventional_bn") && t.text) {
        merged.conventional_bn = t.text;
      } else if ((t.lang === "en_std" || t.lang === "conventional_en") && t.text) {
        merged.conventional_en = t.text;
      } else if (t.lang === "scientific_bn" && t.text) {
        merged.scientific_translation_bn = t.text;
      } else if (t.lang === "scientific_en" && t.text) {
        merged.scientific_translation_en = t.text;
      }
    }

    // 3. Local storage overrides
    try {
      const saved = localStorage.getItem(`quran_ayah_meta_${sNum}_${aNum}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.modern_translation_bn) merged.modern_translation_bn = parsed.modern_translation_bn;
        if (parsed.modern_translation_en) merged.modern_translation_en = parsed.modern_translation_en;
        if (parsed.conventional_bn) merged.conventional_bn = parsed.conventional_bn;
        if (parsed.conventional_en) merged.conventional_en = parsed.conventional_en;
        if (parsed.scientific_translation_bn) merged.scientific_translation_bn = parsed.scientific_translation_bn;
        if (parsed.scientific_translation_en) merged.scientific_translation_en = parsed.scientific_translation_en;
        if (parsed.meta_bn) merged.meta_bn = parsed.meta_bn;
        if (parsed.meta_en) merged.meta_en = parsed.meta_en;
      }
    } catch {}

    return merged;
  }, [surahDatasetQuery.data, cloudVersesQuery.data, list.data, surah, ayah]);

  // Load existing metadata and translation text whenever surah, ayah, or translation type changes
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const sNum = Number(surah);
      const aNum = Number(ayah);
      if (!sNum || !aNum) return;

      // 1. Check local storage first
      let localObj: any = null;
      try {
        const saved = localStorage.getItem(`quran_ayah_meta_${sNum}_${aNum}`);
        if (saved) {
          localObj = JSON.parse(saved);
        }
      } catch {}

      const hasBengali = (text?: string | null) => (text ? /[\u0980-\u09FF]/.test(text) : false);

      if (localObj && !cancelled) {
        if (localObj.meta_bn && hasBengali(localObj.meta_bn)) {
          setMetaBn(localObj.meta_bn);
        }
        if (localObj.meta_en && !localObj.meta_en.includes("Root Directory Authentication")) {
          setMetaEn(localObj.meta_en);
        }
      }

      // Check if dataset is already in memory
      const memAyah = surahDatasetQuery.data?.ayahs?.find((x: any) => Number(x.ayah) === aNum);
      if (memAyah && !cancelled) {
        if (!localObj?.meta_bn || !hasBengali(localObj.meta_bn)) {
          setMetaBn(memAyah.meta_bn || "");
        }
        if (!localObj?.meta_en || localObj.meta_en.includes("Root Directory Authentication")) {
          setMetaEn(memAyah.meta_en || "");
        }
      }

      // 2. Check if a translation was saved in database for this surah, ayah & lng
      const matchedTrans = list.data?.find((t) => t.surah === sNum && t.ayah === aNum && t.lang === lng);
      if (matchedTrans && !cancelled) {
        setText(matchedTrans.text || "");
        setNote(matchedTrans.note || "");
        return;
      }

      const matchedCloudVerse = cloudVersesQuery.data?.find((v) => Number(v.ayah) === aNum);
      if (matchedCloudVerse && !cancelled) {
        let cvText = "";
        if (lng === "bn") cvText = matchedCloudVerse.modern_translation_bn || "";
        else if (lng === "en") cvText = matchedCloudVerse.modern_translation_en || "";
        else if (lng === "bn_std") cvText = matchedCloudVerse.conventional_bn || "";
        else if (lng === "en_std") cvText = matchedCloudVerse.conventional_en || "";
        if (cvText) {
          setText(cvText);
          return;
        }
      }

      // 3. Check local storage specific translation fields
      if (localObj) {
        let fieldText = "";
        if (lng === "bn_std") fieldText = localObj.conventional_bn || localObj.bn_text || "";
        else if (lng === "en_std") fieldText = localObj.conventional_en || localObj.en_text || "";
        else if (lng === "bn") fieldText = localObj.modern_translation_bn || "";
        else if (lng === "en") fieldText = localObj.modern_translation_en || "";
        else if (lng === "scientific_bn") fieldText = localObj.scientific_translation_bn || "";
        else if (lng === "scientific_en") fieldText = localObj.scientific_translation_en || "";

        if (fieldText && !cancelled) {
          setText(fieldText);
          return;
        }
      }

      // 4. Fetch from static surah JSON dataset if not yet loaded in memory
      try {
        const r = await fetch(`/data/quran/surahs/${sNum}.json`);
        if (!r.ok || cancelled) return;
        const d = await r.json();
        const a = d?.ayahs?.find((x: any) => Number(x.ayah) === aNum);
        if (a && !cancelled) {
          if (!localObj?.meta_bn || !hasBengali(localObj.meta_bn)) {
            setMetaBn(a.meta_bn || "");
          }
          if (!localObj?.meta_en || localObj.meta_en.includes("Root Directory Authentication")) {
            setMetaEn(a.meta_en || "");
          }

          let tVal = "";
          if (lng === "bn_std") tVal = a.conventional_bn || a.translation_bn || a.bn_text || "";
          else if (lng === "en_std") tVal = a.conventional_en || a.translation_en || a.en_text || "";
          else if (lng === "bn") tVal = a.modern_translation_bn || "";
          else if (lng === "en") tVal = a.modern_translation_en || "";
          else if (lng === "scientific_bn") tVal = a.scientific_translation_bn || "";
          else if (lng === "scientific_en") tVal = a.scientific_translation_en || "";

          setText(tVal);
        }
      } catch {}
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [surah, ayah, lng, list.data]);

  const handleSelectLayerToEdit = (type: TranslationType) => {
    setLng(type);
    if (currentAyahData) {
      let tVal = "";
      if (type === "bn_std") tVal = currentAyahData.conventional_bn || currentAyahData.translation_bn || currentAyahData.bn_text || "";
      else if (type === "en_std") tVal = currentAyahData.conventional_en || currentAyahData.translation_en || currentAyahData.en_text || "";
      else if (type === "bn") tVal = currentAyahData.modern_translation_bn || "";
      else if (type === "en") tVal = currentAyahData.modern_translation_en || "";
      else if (type === "scientific_bn") tVal = currentAyahData.scientific_translation_bn || "";
      else if (type === "scientific_en") tVal = currentAyahData.scientific_translation_en || "";

      const sNum = Number(surah);
      const aNum = Number(ayah);
      const matchedTrans = list.data?.find((t: any) => t.surah === sNum && t.ayah === aNum && t.lang === type);
      if (matchedTrans?.text) {
        setText(matchedTrans.text);
      } else {
        setText(tVal);
      }
    }
    const formElement = document.getElementById("admin-translation-editor-form");
    if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
    toast.info(`${TRANSLATION_LABELS[type]} ফর্মে সম্পাদনার জন্য প্রস্তুত`);
  };

  const handleSyncSurahToCloud = async () => {
    const sNum = Number(surah) || 1;
    const ayahs = surahDatasetQuery.data?.ayahs;
    if (!ayahs || ayahs.length === 0) {
      toast.error("সূরার ডেটা এখনও লোড হয়নি");
      return;
    }

    try {
      setIsSyncingSurah(true);
      const batch = ayahs.map((a: any) => {
        const convBn = a.conventional_bn || a.translation_bn || "";
        const convEn = a.conventional_en || a.translation_en || "";
        const modBn = a.modern_translation_bn || null;
        const modEn = a.modern_translation_en || null;
        const mBn = a.meta_bn || null;
        const mEn = a.meta_en || null;
        let lexNotes = "";
        if (a.lexicon_modern_notes) {
          lexNotes = typeof a.lexicon_modern_notes === "string" ? a.lexicon_modern_notes : JSON.stringify(a.lexicon_modern_notes);
        }
        const sPad = String(sNum).padStart(3, "0");
        const aPad = String(a.ayah).padStart(3, "0");

        return {
          surah: sNum,
          ayah: a.ayah,
          text_uthmani: a.text_uthmani || a.words?.map((w: any) => w.text_uthmani).join(" ") || "",
          words: a.words || [],
          bn_text: convBn,
          en_text: convEn,
          conventional_bn: convBn,
          conventional_en: convEn,
          modern_translation_bn: modBn,
          modern_translation_en: modEn,
          meta_bn: mBn,
          meta_en: mEn,
          lexicon_modern_notes: lexNotes || null,
          audio_url: `https://everyayah.com/data/Alafasy_128kbps/${sPad}${aPad}.mp3`,
          updated_at: new Date().toISOString(),
        };
      });

      const chunkSize = 25;
      for (let i = 0; i < batch.length; i += chunkSize) {
        const chunk = batch.slice(i, i + chunkSize);
        const { error } = await (supabase as any).from("quran_verses").upsert(chunk, { onConflict: "surah,ayah" });
        if (error) throw error;
      }

      const metaBatch = batch
        .filter((v: any) => v.meta_bn || v.meta_en)
        .map((v: any) => ({
          surah: v.surah,
          ayah: v.ayah,
          meta_bn: v.meta_bn,
          meta_en: v.meta_en,
        }));
      if (metaBatch.length > 0) {
        await (supabase as any).from("ayah_metadata").upsert(metaBatch, { onConflict: "surah,ayah" });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-cloud-verses-status", surah] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-verses", surah] });
      toast.success(`সূরা ${sNum}-এর মোট ${ayahs.length}টি আয়াতের সকল স্তর সফলভাবে ক্লাউড ডাটাবেজে (Supabase) সিঙ্ক করা হয়েছে!`);
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(`সিঙ্ক করতে সমস্যা হয়েছে: ${err.message || err}`);
    } finally {
      setIsSyncingSurah(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const sNum = Number(surah);
      const aNum = Number(ayah);
      if (!sNum || sNum < 1 || sNum > 114) throw new Error("সঠিক সূরা নম্বর দিন (১-১১৪)");
      if (!aNum || aNum < 1 || aNum > 300) throw new Error("সঠিক আয়াত নম্বর দিন");

      let metaSaved = false;

      // ১. মেটা ডাটা লোকাল ও ক্লাউডে সংরক্ষণ
      if (metaBn.trim() || metaEn.trim()) {
        try {
          const existingSaved = localStorage.getItem(`quran_ayah_meta_${sNum}_${aNum}`);
          const currentObj = existingSaved ? JSON.parse(existingSaved) : {};
          if (metaBn.trim()) currentObj.meta_bn = metaBn.trim();
          if (metaEn.trim()) currentObj.meta_en = metaEn.trim();
          currentObj.saved_at = Date.now();
          localStorage.setItem(`quran_ayah_meta_${sNum}_${aNum}`, JSON.stringify(currentObj));
          metaSaved = true;
        } catch {}

        try {
          await supabase.from("ayah_metadata").upsert({
            surah: sNum,
            ayah: aNum,
            meta_bn: metaBn.trim() || null,
            meta_en: metaEn.trim() || null,
            created_by: user?.id || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "surah,ayah" });
        } catch (mErr) {
          console.warn("ayah_metadata sync notice:", mErr);
        }
      }

      // ২. অনুবাদ টেক্সট সংরক্ষণ (যদি প্রদান করা হয়)
      if (text.trim()) {
        const transSchema = z.object({
          surah: z.coerce.number().int().min(1).max(114),
          ayah: z.coerce.number().int().min(1).max(300),
          lang: z.enum(["bn", "en", "bn_std", "en_std", "modern_bn", "modern_en", "scientific_bn", "scientific_en"]),
          text: z.string().trim().min(1, "অনুবাদ টেক্সট প্রদান করুন").max(8000),
          note: z.string().trim().max(4000).optional().default(""),
        });

        const parsed = transSchema.safeParse({ surah: sNum, ayah: aNum, lang: lng, text, note });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "সঠিক অনুবাদ তথ্য দিন");

        // ৩. Sync to quran_verses master table (primary live store for reader & all visitors)
        const verseUpdate: any = {
          surah: parsed.data.surah,
          ayah: parsed.data.ayah,
          updated_at: new Date().toISOString(),
        };
        if (parsed.data.lang === "bn_std") {
          verseUpdate.conventional_bn = parsed.data.text;
          verseUpdate.bn_text = parsed.data.text;
        } else if (parsed.data.lang === "en_std") {
          verseUpdate.conventional_en = parsed.data.text;
          verseUpdate.en_text = parsed.data.text;
        } else if (parsed.data.lang === "bn" || parsed.data.lang === "modern_bn") {
          verseUpdate.modern_translation_bn = parsed.data.text;
        } else if (parsed.data.lang === "en" || parsed.data.lang === "modern_en") {
          verseUpdate.modern_translation_en = parsed.data.text;
        }
        if (metaBn.trim()) verseUpdate.meta_bn = metaBn.trim();
        if (metaEn.trim()) verseUpdate.meta_en = metaEn.trim();

        // Only upsert to quran_verses if any standard verse fields were modified
        if (
          verseUpdate.conventional_bn ||
          verseUpdate.conventional_en ||
          verseUpdate.modern_translation_bn ||
          verseUpdate.modern_translation_en ||
          verseUpdate.meta_bn ||
          verseUpdate.meta_en
        ) {
          try {
            const { error: qvErr } = await (supabase as any)
              .from("quran_verses")
              .upsert(verseUpdate, { onConflict: "surah,ayah" });
            if (qvErr) console.warn("Failed to sync quran_verses in admin:", qvErr);
          } catch (qvErr) {
            console.warn("Failed to sync quran_verses in admin:", qvErr);
          }
        }

                // ৪. Primary Sync to Cloudflare Edge D1 via /api/public/verse-translations
        try {
          const token = getStoredAuthToken();
          await fetch("/api/public/verse-translations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              surah: parsed.data.surah,
              ayah: parsed.data.ayah,
              lang: parsed.data.lang,
              text: parsed.data.text,
              note: parsed.data.note || null,
              meta_bn: metaBn.trim() || undefined,
              meta_en: metaEn.trim() || undefined,
            }),
          });
        } catch (edgeErr) {
          console.warn("Edge D1 save notice in admin:", edgeErr);
        }

        // Secondary optional sync to Supabase (catch error so RLS does not fail the save)
        try {
          if (editingTranslationId) {
            await supabase
              .from("verse_translations")
              .update({
                surah: parsed.data.surah,
                ayah: parsed.data.ayah,
                lang: parsed.data.lang,
                text: parsed.data.text,
                note: parsed.data.note || null,
                created_by: user?.id || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", editingTranslationId);
          } else {
            const { data: existingTrans } = await supabase
              .from("verse_translations")
              .select("id")
              .eq("surah", parsed.data.surah)
              .eq("ayah", parsed.data.ayah)
              .eq("lang", parsed.data.lang)
              .maybeSingle();

            if (existingTrans?.id) {
              await supabase
                .from("verse_translations")
                .update({
                  text: parsed.data.text,
                  note: parsed.data.note || null,
                  created_by: user?.id || null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingTrans.id);
            } else {
              await supabase
                .from("verse_translations")
                .insert({
                  surah: parsed.data.surah,
                  ayah: parsed.data.ayah,
                  lang: parsed.data.lang,
                  text: parsed.data.text,
                  note: parsed.data.note || null,
                  created_by: user?.id || null,
                  updated_at: new Date().toISOString(),
                });
            }
          }
        } catch (sbErr) {
          console.warn("Supabase verse_translations save notice:", sbErr);
        }
        // ৫. Local storage sync with full translation fields
        try {
          const existingSaved = localStorage.getItem(`quran_ayah_meta_${sNum}_${aNum}`);
          const currentObj = existingSaved ? JSON.parse(existingSaved) : {};
          if (metaBn.trim()) currentObj.meta_bn = metaBn.trim();
          if (metaEn.trim()) currentObj.meta_en = metaEn.trim();
          if (parsed.data.lang === "bn_std") {
            currentObj.conventional_bn = parsed.data.text;
            currentObj.bn_text = parsed.data.text;
          } else if (parsed.data.lang === "en_std") {
            currentObj.conventional_en = parsed.data.text;
            currentObj.en_text = parsed.data.text;
          } else if (parsed.data.lang === "bn" || parsed.data.lang === "modern_bn") {
            currentObj.modern_translation_bn = parsed.data.text;
          } else if (parsed.data.lang === "en" || parsed.data.lang === "modern_en") {
            currentObj.modern_translation_en = parsed.data.text;
          } else if (parsed.data.lang === "scientific_bn") {
            currentObj.scientific_translation_bn = parsed.data.text;
          } else if (parsed.data.lang === "scientific_en") {
            currentObj.scientific_translation_en = parsed.data.text;
          }
          currentObj.saved_at = Date.now();
          localStorage.setItem(`quran_ayah_meta_${sNum}_${aNum}`, JSON.stringify(currentObj));
        } catch {}
      } else if (!metaSaved) {
        throw new Error("অনুবাদ টেক্সট অথবা মেটা ডাটা প্রদান করুন");
      }
    },
    onSuccess: () => {
      const sNum = Number(surah);
      const aNum = Number(ayah);
      setEditingTranslationId(null);

      // React Query ও অফলাইন ক্যাশে তাৎক্ষণিক সিঙ্ক যাতে রিডার পেজ ০ মিলিসেকেন্ডে আপডেট পায়
      try {
        const updateSurahImmutably = (old: any) => {
          if (!old?.ayahs) return old;
          return {
            ...old,
            ayahs: old.ayahs.map((a: any) => {
              if (a.ayah !== aNum) return a;
              const updated = { ...a };
              if (lng === "bn" || lng === "modern_bn") updated.modern_translation_bn = text.trim();
              else if (lng === "en" || lng === "modern_en") updated.modern_translation_en = text.trim();
              else if (lng === "scientific_bn") updated.scientific_translation_bn = text.trim();
              else if (lng === "scientific_en") updated.scientific_translation_en = text.trim();
              else if (lng === "bn_std") {
                updated.conventional_bn = text.trim();
                updated.translation_bn = text.trim();
                updated.bn_text = text.trim();
              } else if (lng === "en_std") {
                updated.conventional_en = text.trim();
                updated.translation_en = text.trim();
                updated.en_text = text.trim();
              }
              if (metaBn.trim()) updated.meta_bn = metaBn.trim();
              if (metaEn.trim()) updated.meta_en = metaEn.trim();
              return updated;
            }),
          };
        };

        queryClient.setQueryData(["local-surah-cache", sNum], updateSurahImmutably);
        queryClient.setQueryData(["local-surah-init", sNum], updateSurahImmutably);

        const updatedFull = queryClient.getQueryData(["local-surah-cache", sNum]);
        if (updatedFull) {
          saveSurahOffline(sNum, updatedFull).catch(() => {});
        }
      } catch (cacheErr) {
        console.warn("Direct cache update notice:", cacheErr);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-verse-translations", surah] });
      queryClient.invalidateQueries({ queryKey: ["verse-translations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-verses-status", surah] });
      queryClient.invalidateQueries({ queryKey: ["local-surah-cache", sNum] });
      queryClient.invalidateQueries({ queryKey: ["local-surah-init", sNum] });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("quran:verses-synced", {
            detail: { surahs: [sNum] },
          })
        );
      }
      toast.success("আয়াতের তথ্য ও অনুবাদ সফলভাবে সংরক্ষণ করা হয়েছে");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("verse_translations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      const sNum = Number(surah);
      queryClient.invalidateQueries({ queryKey: ["admin-verse-translations", surah] });
      queryClient.invalidateQueries({ queryKey: ["verse-translations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-verses-status", surah] });
      if (sNum) {
        queryClient.invalidateQueries({ queryKey: ["local-surah-cache", sNum] });
        queryClient.invalidateQueries({ queryKey: ["local-surah-init", sNum] });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("quran:verses-synced", {
              detail: { surahs: [sNum] },
            })
          );
        }
      }
      toast.success("অনুবাদ মুছে ফেলা হয়েছে");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleEditRow = (v: any) => {
    setEditingTranslationId(v.id);
    setSurah(String(v.surah));
    setAyah(String(v.ayah));
    setLng(v.lang as any);
    setText(v.text);
    setNote(v.note || "");
    const formElement = document.getElementById("admin-translation-editor-form");
    if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
    toast.info(`সূরা ${v.surah} : আয়াত ${v.ayah} (${TRANSLATION_LABELS[v.lang] || v.lang}) সম্পাদনার জন্য লোড করা হয়েছে`);
  };

  const handleCancelEditRow = () => {
    setEditingTranslationId(null);
    setText("");
    setNote("");
    toast.info("সম্পাদনা মোড বাতিল করা হয়েছে");
  };

  const currentSurahNum = Math.min(114, Math.max(1, Number(surah) || 1));
  const currentSurahInfo = SURAH_META_MAP[currentSurahNum] || { name_bn: `সূরা ${currentSurahNum}`, name_ar: "", total: 7, type: "" };
  const totalAyahsInSurah = surahDatasetQuery.data?.ayahs?.length || currentSurahInfo.total || 7;
  const cloudSyncedCount = cloudVersesQuery.data?.length || 0;

  const handlePrevSurah = () => {
    if (currentSurahNum > 1) {
      setSurah(String(currentSurahNum - 1));
      setAyah("1");
    }
  };

  const handleNextSurah = () => {
    if (currentSurahNum < 114) {
      setSurah(String(currentSurahNum + 1));
      setAyah("1");
    }
  };

  return (
    <div className="space-y-6">
      {/* ১. শীর্ষ সূরা নির্বাচন ও কুইক নেভিগেশন বার */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gradient-to-r from-primary/5 via-background to-emerald-500/5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevSurah}
            disabled={currentSurahNum <= 1}
            className="h-9 px-3 text-xs font-semibold cursor-pointer shrink-0"
            title="পূর্ববর্তী সূরা"
          >
            <ChevronLeft className="size-4 mr-1" /> পূর্ববর্তী
          </Button>

          <div className="flex-1 md:flex-initial">
            <select
              aria-label="সূরা নির্বাচন করুন"
              value={surah}
              onChange={(e) => {
                setSurah(e.target.value);
                setAyah("1");
              }}
              className="h-9 w-full md:w-84 rounded-lg border border-primary/50 bg-background px-3 text-xs font-bold text-foreground shadow-2xs focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {Array.from({ length: 114 }, (_, i) => i + 1).map((num) => {
                const info = SURAH_META_MAP[num];
                return (
                  <option key={num} value={num}>
                    {num}. {info?.name_bn || `সূরা ${num}`} ({info?.name_ar || ""}) — {info?.total || 0}টি আয়াত ({info?.type || ""})
                  </option>
                );
              })}
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextSurah}
            disabled={currentSurahNum >= 114}
            className="h-9 px-3 text-xs font-semibold cursor-pointer shrink-0"
            title="পরবর্তী সূরা"
          >
            পরবর্তী <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-md">
            সূরা {currentSurahNum}: {currentSurahInfo.name_bn}
          </span>
          <span className="font-arabic text-sm text-foreground bg-muted px-2.5 py-0.5 rounded-md">
            {currentSurahInfo.name_ar}
          </span>
          <span className="text-muted-foreground bg-muted/60 px-2 py-1 rounded-md font-medium">
            {currentSurahInfo.type} · {totalAyahsInSurah}টি আয়াত
          </span>
        </div>
      </div>

      {/* ২. ওভারভিউ ও সিস্টেম স্ট্যাটাস কার্ড */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground">কুরআন অনুবাদ ও ডেটাসেট নিয়ন্ত্রণ কেন্দ্র</h2>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold">
                  সম্পূর্ণ ১১৪টি সূরা ও ৬,২৩৬টি আয়াত সক্রিয়
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                মূল এজ ডেটাসেটে (Edge JSON) সম্পূর্ণ ১১৪টি সূরার <strong>সংশোধিত অনুবাদ (Revised Translation)</strong> ও <strong>কুরআন অন্বেষা / Qur'an Explorer</strong> সংরক্ষিত রয়েছে। যেকোনো সূরা ব্রাউজ ও সম্পাদন করতে উপরের ড্রপডাউন ব্যবহার করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSyncingSurah || !surahDatasetQuery.data}
              onClick={handleSyncSurahToCloud}
              className="h-8 text-xs font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer shadow-2xs"
              title="এই সূরার সকল আয়াত ও অনুবাদ ক্লাউড ডাটাবেজে (Supabase) সংরক্ষণ করুন"
            >
              {isSyncingSurah ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" /> সিঙ্ক হচ্ছে...
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  সূরা {currentSurahNum} ক্লাউড ডাটাবেজে সিঙ্ক করুন
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ৩টি মেজরিং কাউন্টার বক্স */}
        <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 border border-border/60">
            <span className="text-muted-foreground font-medium">কুরআন কোর ইঞ্জিন:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">১১৪ সূরা (৬,২৩৬ আয়াত)</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 border border-border/60">
            <span className="text-muted-foreground font-medium">সূরা {currentSurahNum} ক্লাউড স্ট্যাটাস:</span>
            <span className={`font-bold ${cloudSyncedCount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {cloudSyncedCount} / {totalAyahsInSurah} আয়াত
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 border border-border/60">
            <span className="text-muted-foreground font-medium">ম্যানুয়াল কাস্টম ওভাররাইড:</span>
            <span className="font-bold text-foreground">
              {list.data?.length || 0}টি আয়াত পরিবর্তিত
            </span>
          </div>
        </div>
      </div>

      {/* ৩. বর্তমান নির্বাচিত আয়াতের মাল্টি-লেয়ার লাইভ প্রিভিউ কার্ড */}
      {currentAyahData && (
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">
                সূরা {currentSurahNum} ({currentSurahInfo.name_bn}) : আয়াত {ayah} — মূল ডেটাসেটের অনুবাদসমূহ
              </span>
              {currentAyahData.meta_bn && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-medium">
                  {currentAyahData.meta_bn}
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              ক্লিক করে নিচের ফর্মে যেকোনো স্তর সম্পাদনা করুন
            </span>
          </div>

          {/* আরবি আয়াত টেক্সট */}
          <div className="rounded-lg bg-muted/30 p-3.5 border border-border/60 text-right">
            <p className="font-arabic text-xl sm:text-2xl leading-loose text-foreground" dir="rtl">
              {currentAyahData.text_uthmani || currentAyahData.words?.map((w: any) => w.text_uthmani).join(" ")}
            </p>
          </div>

          {/* ৪টি স্তর গ্রিড */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
            {/* ১. আক্ষরিক অনুবাদ */}
            <div className="rounded-lg border border-border/80 bg-background p-3 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">১. আক্ষরিক অনুবাদ</span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">বাংলা</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  <FormattedTranslation text={currentAyahData.conventional_bn || currentAyahData.translation_bn || "—"} />
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full mt-2 cursor-pointer"
                onClick={() => handleSelectLayerToEdit("bn_std")}
              >
                <Pencil className="size-3 mr-1" /> আক্ষরিক এডিট করুন
              </Button>
            </div>

            {/* ২. কুরআন অন্বেষা */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 p-3 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">২. কুরআন অন্বেষা</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">বাংলা</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed italic">
                  <FormattedTranslation text={currentAyahData.modern_translation_bn || "—"} />
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full mt-2 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15 cursor-pointer font-medium"
                onClick={() => handleSelectLayerToEdit("bn")}
              >
                <Pencil className="size-3 mr-1" /> কুরআন অন্বেষা এডিট
              </Button>
            </div>

            {/* ৩. Qur'an Explorer (English) */}
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 p-3 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">৩. Qur'an Explorer</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">English</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed font-serif italic">
                  <FormattedTranslation text={currentAyahData.modern_translation_en || "—"} />
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full mt-2 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/15 cursor-pointer font-medium"
                onClick={() => handleSelectLayerToEdit("en")}
              >
                <Pencil className="size-3 mr-1" /> Explorer Edit
              </Button>
            </div>

            {/* ৪. বৈজ্ঞানিক অনুবাদ */}
            <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 dark:bg-teal-500/10 p-3 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">৪. বৈজ্ঞানিক অনুবাদ</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-bold">Scientific</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed italic">
                  <FormattedTranslation text={currentAyahData.scientific_translation_bn || "—"} />
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full mt-2 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/15 cursor-pointer font-medium"
                onClick={() => handleSelectLayerToEdit("scientific_bn")}
              >
                <Pencil className="size-3 mr-1" /> বৈজ্ঞানিক এডিট
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ৩. অনুবাদ ও মেটাডাটা সম্পাদনা ফর্ম */}
      <form
        id="admin-translation-editor-form"
        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Pencil className="size-4 text-primary" />
            <span>আয়াত ও অনুবাদ সম্পাদনা ফর্ম — সূরা {currentSurahNum}: {currentSurahInfo.name_bn}</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            যেকোনো স্তরের অনুবাদ পরিবর্তন করে ডাটাবেজে ওভাররাইড সংরক্ষণ করুন
          </span>
        </div>

        {editingTranslationId && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-1.5 font-semibold">
              <Pencil className="size-3.5" />
              <span>বিদ্যমান অনুবাদ সম্পাদনা মোড সক্রিয় (আয়াত নম্বর বা টেক্সট সংশোধন করে সংরক্ষণ করুন)</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelEditRow}
              className="h-6 text-[11px] border-amber-500/40 hover:bg-amber-500/15 cursor-pointer"
            >
              বাতিল / নতুন এন্ট্রি মোড
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="surah" className="text-xs font-semibold flex items-center justify-between">
              <span>সূরা নির্বাচন (১১৪টি সূরা)</span>
              <span className="text-[10px] text-muted-foreground font-normal">১-১১৪</span>
            </Label>
            <select
              id="surah"
              value={surah}
              onChange={(e) => {
                setSurah(e.target.value);
                setAyah("1");
              }}
              className="h-9 w-full rounded border border-input bg-background px-3 text-xs font-semibold cursor-pointer"
            >
              {Array.from({ length: 114 }, (_, i) => i + 1).map((num) => {
                const info = SURAH_META_MAP[num];
                return (
                  <option key={num} value={num}>
                    {num}. {info?.name_bn || `সূরা ${num}`} ({info?.name_ar || ""}) — {info?.total || 0} আয়াত
                  </option>
                );
              })}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ayah" className="text-xs font-semibold flex items-center justify-between">
              <span>আয়াত নম্বর</span>
              <span className="text-[10px] text-muted-foreground font-normal">মোট {totalAyahsInSurah}টি</span>
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="ayah"
                type="number"
                min={1}
                max={totalAyahsInSurah}
                value={ayah}
                onChange={(e) => setAyah(e.target.value)}
                className="h-9 text-xs flex-1"
              />
              <select
                aria-label="আয়াত দ্রুত নির্বাচন"
                value={ayah}
                onChange={(e) => setAyah(e.target.value)}
                className="h-9 rounded border border-input bg-background px-2 text-xs font-medium w-24 shrink-0 cursor-pointer"
              >
                {Array.from({ length: totalAyahsInSurah }, (_, i) => i + 1).map((aNum) => (
                  <option key={aNum} value={aNum}>
                    আয়াত {aNum}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lng" className="text-xs font-semibold">অনুবাদ স্তর (৬টির যেকোনোটি)</Label>
            <select
              id="lng"
              value={lng}
              onChange={(e) => setLng(e.target.value as any)}
              className="h-9 w-full rounded border border-input bg-background px-3 text-xs font-medium"
            >
              <option value="bn_std">১. আক্ষরিক অনুবাদ (বাংলা)</option>
              <option value="en_std">২. Surface Translation (English)</option>
              <option value="bn">৩. কুরআন অন্বেষা — আধুনিক অনুবাদ (বাংলা)</option>
              <option value="en">৪. Qur'an Explorer — Modern Translation (English)</option>
              <option value="scientific_bn">৫. বৈজ্ঞানিক অনুবাদ (বাংলা)</option>
              <option value="scientific_en">৬. Scientific Translation (English)</option>
            </select>
          </div>
        </div>

        {/* মেটা ডাটা (Meta Data) বক্স */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="size-3.5" />
            <span>আয়াতের মেটা ডাটা / Meta Data (নম্বরের পাশে দৃশ্যমান হবে)</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="metaBn" className="text-xs font-medium text-muted-foreground">
                মেটা ডাটা (বাংলা)
              </Label>
              <Input
                id="metaBn"
                value={metaBn}
                onChange={(e) => setMetaBn(e.target.value)}
                placeholder="যেমন: মহাজাগতিক সোর্স কোড ও সার্বজনীন অনুগ্রহ"
                className="h-9 text-xs bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metaEn" className="text-xs font-medium text-muted-foreground">
                Meta Data (English)
              </Label>
              <Input
                id="metaEn"
                value={metaEn}
                onChange={(e) => setMetaEn(e.target.value)}
                placeholder="e.g. Cosmic Source Code & Universal Boundless Grace"
                className="h-9 text-xs bg-background"
              />
            </div>
          </div>
        </div>

        {/* নির্বাচিত আয়াতের লাইভ প্রিভিউ কার্ড (এডমিন নিশ্চিতভাবে দেখতে পাবেন কোন আয়াতটি এডিট করছেন) */}
        {currentAyahData && (
          <div className="rounded-lg bg-muted/40 border border-border/70 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="text-primary font-bold">
                চলতি নির্বাচিত আয়াত: সূরা {currentSurahNum} : আয়াত {ayah}
              </span>
              {currentAyahData.meta_bn && (
                <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {currentAyahData.meta_bn}
                </span>
              )}
            </div>
            <p className="font-arabic text-right text-base text-foreground leading-relaxed" dir="rtl">
              {currentAyahData.text_uthmani || currentAyahData.words?.map((w: any) => w.text_uthmani).join(" ")}
            </p>
            {(currentAyahData.conventional_bn || currentAyahData.translation_bn) && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                <span className="font-semibold text-foreground/80">আক্ষরিক: </span>
                {currentAyahData.conventional_bn || currentAyahData.translation_bn}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="text" className="text-xs font-semibold">
            {TRANSLATION_LABELS[lng] || "অনুবাদ"} টেক্সট
          </Label>
          <Textarea 
            id="text" 
            rows={4} 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="এখানে আয়াতের নির্বাচিত অনুবাদটি সম্পাদনা বা নতুন করে লিখুন..."
            className="text-xs" 
          />
        </div>

        {/* রেফারেন্স লিংক যুক্ত করার টুল (Reference Link & Citation Assistant) */}
        <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <ExternalLink className="size-4" />
              <span>রেফারেন্স লিংক ও সাইটেশন যুক্ত করুন (Clickable Reference Link)</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              অনুবাদে ক্লিক করলে নতুন ট্যাবে রেফারেন্স পোস্ট ওপেন হবে
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-12 items-end">
            {/* ১. মার্কার নির্বাচন */}
            <div className="sm:col-span-4 space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>মার্কার / লেবেল</span>
                <span className="text-[10px] text-primary font-bold">[{refMarker}]</span>
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={refMarker}
                  onChange={(e) => setRefMarker(e.target.value)}
                  placeholder="১ বা A"
                  className="h-8.5 text-xs font-bold w-16 text-center bg-background"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {["১", "২", "৩", "৪", "A", "B", "C"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRefMarker(m)}
                      className={`px-1.5 py-0.5 text-[11px] rounded border transition-colors cursor-pointer ${
                        refMarker === m
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                          : "bg-background hover:bg-muted text-muted-foreground border-input"
                      }`}
                    >
                      [{m}]
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ২. রেফারেন্স URL / পোস্ট নির্বাচন */}
            <div className="sm:col-span-8 space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>রেফারেন্স পোস্টের লিংক / URL <span className="font-normal text-muted-foreground/70">(ঐচ্ছিক)</span></span>
                {articlesQuery.data && articlesQuery.data.length > 0 && (
                  <span className="text-[10px] text-primary/80 font-normal">
                    ড্রপডাউন থেকে আর্টিকেলের লিংক সহজে নিতে পারেন
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={refUrl}
                  onChange={(e) => setRefUrl(e.target.value)}
                  placeholder="ঐচ্ছিক: https://example.com/post অথবা /articles/slug"
                  className="h-8.5 text-xs flex-1 bg-background"
                />
                {articlesQuery.data && articlesQuery.data.length > 0 && (
                  <select
                    aria-label="ওয়েবসাইটের প্রকাশিত আর্টিকেল"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setRefUrl(e.target.value);
                    }}
                    className="h-8.5 rounded border border-input bg-background px-2 text-xs w-36 sm:w-44 shrink-0 cursor-pointer text-muted-foreground"
                  >
                    <option value="">পোস্ট নির্বাচন...</option>
                    {articlesQuery.data.map((art: any) => (
                      <option key={art.id} value={`/articles/${art.slug}`}>
                        {art.title_bn || art.title_en || art.slug}
                      </option>
                    ))}
                  </select>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleInsertReference}
                  className="h-8.5 text-xs shrink-0 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-2xs"
                >
                  <Plus className="size-3.5 mr-1" /> অনুবাদে যোগ করুন
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs font-semibold">বিশেষ টীকা / নোট (ঐচ্ছিক)</Label>
          <Textarea 
            id="note" 
            rows={2} 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="প্রাসঙ্গিক ব্যাখ্যা বা তথ্যসূত্র..."
            className="text-xs" 
          />
        </div>
        <Button type="submit" disabled={save.isPending} size="sm" className="bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer shadow-xs">
          <Plus className="size-3.5 mr-1" /> সংরক্ষণ করুন
        </Button>
      </form>

      {/* ৫. তালিকা সেকশন: ডুয়াল ট্যাব (কাস্টম ওভাররাইড বনাম মূল ডেটাসেট) */}
      <div className="space-y-3 pt-1">
        {/* তথ্য ও দ্রুত সূরা পরিভ্রমণ বার */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/60">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="size-4 text-primary shrink-0" />
            <span>
              কুরআনের মোট <strong>১১৪টি সূরা ও ৬,২৩৬টি আয়াত</strong> সিস্টেমে সংরক্ষিত। বর্তমানে <strong>সূরা {currentSurahNum}: {currentSurahInfo.name_bn} ({currentSurahInfo.name_ar})</strong>-এর {totalAyahsInSurah}টি আয়াত প্রদর্শিত হচ্ছে।
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2.5 cursor-pointer"
              disabled={currentSurahNum <= 1}
              onClick={handlePrevSurah}
            >
              <ChevronLeft className="size-3 mr-0.5" /> পূর্ববর্তী সূরা
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2.5 cursor-pointer"
              disabled={currentSurahNum >= 114}
              onClick={handleNextSurah}
            >
              পরবর্তী সূরা <ChevronRight className="size-3 ml-0.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveListTab("overrides")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeListTab === "overrides"
                  ? "bg-[#2271b1] text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              কাস্টম ওভাররাইড তালিকা ({list.data?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveListTab("dataset")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeListTab === "dataset"
                  ? "bg-[#2271b1] text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              সূরা {currentSurahNum} ({currentSurahInfo.name_bn})-এর আয়াতসমূহ ({totalAyahsInSurah})
            </button>
          </div>
          <span className="text-xs font-bold text-primary">
            সূরা {currentSurahNum}: {currentSurahInfo.name_bn} ({currentSurahInfo.name_ar})
          </span>
        </div>

        {activeListTab === "overrides" ? (
          <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
            {list.data?.length ? (
              list.data.map((v) => (
                <div key={v.id} className="flex items-start gap-3 p-3.5 hover:bg-muted/30 transition-colors">
                  <span className="rounded bg-[#2271b1]/10 px-2 py-0.5 text-[11px] font-bold text-[#2271b1] shrink-0">
                    সূরা {v.surah} : আয়াত {v.ayah} · {TRANSLATION_LABELS[v.lang] || v.lang}
                  </span>
                  <p className="min-w-0 flex-1 text-xs text-foreground leading-relaxed">{v.text}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:bg-primary/10 cursor-pointer"
                      aria-label="সম্পাদনা করুন"
                      title="ফর্মে লোড করে সম্পাদনা করুন"
                      onClick={() => handleEditRow(v)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                      aria-label="মুছে ফেলুন"
                      title="মুছে ফেলুন"
                      onClick={() => remove.mutate(v.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>সূরা {surah}-এর সকল আয়াত মূল ডেটাসেটের আধুনিক ও সংশোধিত অনুবাদ দ্বারা লাইভ পরিচালিত হচ্ছে</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  ডাটাবেজে আলাদা কোনো কাস্টম ওভাররাইডের প্রয়োজন পড়েনি। মূল ডেটাসেটে সকল আয়াতের সংশোধিত অনুবাদ ও কুরআন অন্বেষা সংরক্ষিত রয়েছে। কোনো আয়াতে বিশেষ পরিবর্তন করতে চাইলে ওপরের ফর্মটি ব্যবহার করে সংরক্ষণ করতে পারেন।
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm max-h-[600px] overflow-y-auto">
            {surahDatasetQuery.data?.ayahs?.map((a: any) => (
              <div key={a.ayah} className="p-3.5 space-y-2 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      আয়াত {a.ayah}
                    </span>
                    {a.meta_bn && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                        {a.meta_bn}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] cursor-pointer"
                    onClick={() => {
                      setAyah(String(a.ayah));
                      const formElement = document.getElementById("admin-translation-editor-form");
                      if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
                      toast.info(`সূরা ${surah} : আয়াত ${a.ayah} নির্বাচিত হয়েছে`);
                    }}
                  >
                    <Pencil className="size-2.5 mr-1" /> এই আয়াত এডিট করুন
                  </Button>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-arabic text-base text-foreground text-right" dir="rtl">
                    {a.text_uthmani || a.words?.map((w: any) => w.text_uthmani).join(" ")}
                  </p>
                  {a.modern_translation_bn && (
                    <p className="text-muted-foreground leading-relaxed italic">
                      <span className="font-bold text-purple-700 dark:text-purple-400 not-italic">আধুনিক: </span>
                      {a.modern_translation_bn}
                    </p>
                  )}
                  {a.conventional_bn && (
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      <span className="font-semibold text-muted-foreground">আক্ষরিক: </span>
                      {a.conventional_bn}
                    </p>
                  )}
                  {a.scientific_translation_bn && (
                    <p className="text-muted-foreground leading-relaxed italic text-[11px]">
                      <span className="font-bold text-teal-700 dark:text-teal-400 not-italic">বৈজ্ঞানিক: </span>
                      {a.scientific_translation_bn}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserPermissionsDialog({
  user,
  onClose,
}: {
  user: { id: string; email?: string } | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    showArabic: true,
    showWordByWord: true,
    showTransliteration: true,
    showConventionalBn: true,
    showConventionalEn: true,
    showSahih: true,
    showPickthall: true,
    showYusufAli: true,
    showShakir: true,
    showSarwar: true,
    showMohsinKhan: true,
    showArberry: true,
    showModernBn: true,
    showModernEn: true,
    showScientificBn: true,
    showScientificEn: true,
    showLexicon: true,
    showLexiconModern: true,
    showLexiconScientific: true,
    showMetaData: true,
    showSurahScientificMeaning: true,
    showLogicalConsistency: true,
  });
  const [hasCustomRecord, setHasCustomRecord] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from("user_display_permissions" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (data && (data as any).permissions) {
          setPermissions({
            showArabic: true,
            showWordByWord: true,
            showTransliteration: true,
            showConventionalBn: true,
            showConventionalEn: true,
            showSahih: true,
            showPickthall: true,
            showYusufAli: true,
            showShakir: true,
            showSarwar: true,
            showMohsinKhan: true,
            showArberry: true,
            showModernBn: true,
            showModernEn: true,
            showScientificBn: true,
            showScientificEn: true,
            showLexicon: true,
            showLexiconModern: true,
            showLexiconScientific: true,
            showMetaData: true,
            showSurahScientificMeaning: true,
            showLogicalConsistency: true,
            ...((data as any).permissions || {}),
          });
          setNotes((data as any).notes || "");
          setHasCustomRecord(true);
        } else {
          setHasCustomRecord(false);
        }
        setLoading(false);
      });
  }, [user?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_display_permissions" as any)
        .upsert({
          user_id: user.id,
          email: user.email ? user.email.trim().toLowerCase() : null,
          permissions,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-display-permissions"] });
      toast.success(`ইউজার ${user?.email || user?.id} এর জন্য কাস্টম ডিসপ্লে পারমিশন সংরক্ষিত হয়েছে!`);
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_display_permissions" as any)
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-display-permissions"] });
      toast.success("কাস্টম পারমিশন মুছে গ্লোবাল ডিফল্টে ফিরিয়ে নেওয়া হয়েছে");
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!user) return null;

  const displayLayersList: { key: string; title: string; desc: string; highlight?: boolean }[] = [
    { key: "showSurahScientificMeaning", title: "১. সুরার নামের প্রচলিত ও আধুনিক বিজ্ঞানভিত্তিক অর্থ", desc: "প্রতিটি সুরার শীর্ষে প্রচলিত অর্থ ও আধুনিক বিজ্ঞানভিত্তিক অর্থ", highlight: true },
    { key: "showArabic", title: "২. মূল আরবি পাঠ (Original Arabic)", desc: "প্রতিটি আয়াতের মূল নূরানী/উসমানি আরবি হরফ ও বিশুদ্ধ পাঠ প্রদর্শন", highlight: true },
    { key: "showMetaData", title: "৩. আয়াত মেটাডাটা ও বিষয়ভিত্তিক ট্যাগ (Meta Data)", desc: "আয়াতের পাশে প্রাসঙ্গিক বিষয়ভিত্তিক মেটা ডাটা ও টপিক ট্যাগ", highlight: true },
    { key: "showWordByWord", title: "৪. শব্দে শব্দে অর্থ (Word by Word)", desc: "প্রতিটি শব্দের নিচে স্বতন্ত্র অর্থ ও ব্যাকরণিক উচ্চারণ" },
    { key: "showTransliteration", title: "৫. আয়াত উচ্চারণ নির্দেশিকা (Transliteration)", desc: "সহজে পড়ার জন্য আয়াতের বাংলা ফোনেটিক উচ্চারণ" },
    { key: "showModernBn", title: "৬. কুরআন অন্বেষা (আধুনিক বাংলা অনুবাদ)", desc: "আমাদের সমসাময়িক গবেষণালব্ধ কুরআন অন্বেষা বাংলা অনুবাদ", highlight: true },
    { key: "showModernEn", title: "৭. Qur'an Explorer (Modern English Translation)", desc: "আমাদের সমসাময়িক Qur'an Explorer ইংরেজি অনুবাদ", highlight: true },
    { key: "showScientificBn", title: "৮. বৈজ্ঞানিক অনুবাদ (বাংলা)", desc: "মহাবিশ্ব, প্রকৃতি ও বিজ্ঞানের গবেষণালব্ধ বৈজ্ঞানিক অনুবাদ", highlight: true },
    { key: "showScientificEn", title: "৯. Scientific Translation (English)", desc: "Contemporary scientific, cosmological & natural world English translation", highlight: true },
    { key: "showConventionalBn", title: "১০. আক্ষরিক বাংলা অনুবাদ (Literal Bengali)", desc: "মুহিউদ্দীন খান / তাইসিরুল কুরআন স্ট্যান্ডার্ড অনুবাদ" },
    { key: "showSahih", title: "১১.১ Sahih International (সহীহ ইন্টারন্যাশনাল ইংরেজি)", desc: "Corpus Quran স্ট্যান্ডার্ড সহীহ ইন্টারন্যাশনাল ইংরেজি অনুবাদ" },
    { key: "showPickthall", title: "১১.২ Marmaduke Pickthall (মোহাম্মদ মারমাডিউক পিকথল)", desc: "মারমাডিউক পিকথলের প্রামাণ্য ইংরেজি অনুবাদ" },
    { key: "showYusufAli", title: "১১.৩ Abdullah Yusuf Ali (আব্দুল্লাহ ইউসুফ আলী)", desc: "আব্দুল্লাহ ইউসুফ আলীর সাহিত্যমানসমৃদ্ধ ঐতিহ্যবাহী ইংরেজি অনুবাদ" },
    { key: "showShakir", title: "১১.৪ M. H. Shakir (মোহাম্মদ হাবিব শাকির)", desc: "এম. এইচ. শাকিরের প্রাঞ্জল ইংরেজি অনুবাদ" },
    { key: "showSarwar", title: "১১.৫ Muhammad Sarwar (শেখ মুহাম্মদ সারওয়ার)", desc: "শেখ মুহাম্মদ সারওয়ারের আধুনিক ইংরেজি অনুবাদ" },
    { key: "showMohsinKhan", title: "১১.৬ Al-Hilali & Mohsin Khan (মুহসিন খান ও আল-হিলালী)", desc: "ড. মুহসিন খান ও ড. হিলালীর ইংরেজি অনুবাদ" },
    { key: "showArberry", title: "১১.৭ Arthur John Arberry (আর্থার জন আর্বেরি)", desc: "এ. জে. আর্বেরির ছন্দময় উচ্চাঙ্গ ইংরেজি অনুবাদ" },
    { key: "showLexicon", title: "১২.১ প্রচলিত আক্ষরিক অভিধান ও শব্দকোষ", desc: "শব্দকোষ, মূল ধাতু (Root) ও ব্যাকরণ" },
    { key: "showLexiconModern", title: "১২.২ কুরআন অন্বেষা আধুনিক অভিধান", desc: "গবেষণাধর্মী আধুনিক পারিভাষিক অর্থ ও বিশ্লেষণ", highlight: true },
    { key: "showLexiconScientific", title: "১২.৩ বিজ্ঞানভিত্তিক অভিধান ও লেক্সিকন নোট", desc: "অভিধানে আধুনিক বিজ্ঞানভিত্তিক গভীর ব্যাখ্যা ও প্রেক্ষাপট", highlight: true },
    { key: "showLogicalConsistency", title: "১৪. লজিক্যাল কন্সিসট্যান্সি ফ্রেমওয়ার্ক (৪:৮২)", desc: "কুরআনের সার্বজনীন ইনফরমেশন আর্কিটেকচার ও অভ্যন্তরীণ সামঞ্জস্য", highlight: true },
    { key: "showAudioPlayback", title: "১৫. সুরার অডিও প্লেব্যাক ও কন্ট্রোল (Audio Recitation & Player)", desc: "আরবি তেলাওয়াত ও বহুভাষিক AI অনুবাদ পাঠের সার্বজনীন প্লেয়ার", highlight: true },
  ];

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <SlidersHorizontal className="size-5 text-primary" />
            স্বতন্ত্র ইউজার ডিসপ্লে ও অ্যাক্সেস পারমিশন
          </DialogTitle>
          <DialogDescription className="text-xs">
            ইউজার: <span className="font-semibold text-foreground">{user.email || "অজ্ঞাত"}</span>{" "}
            (আইডি: <span className="font-mono">{user.id}</span>)
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center items-center text-muted-foreground text-xs">
            <Loader2 className="size-5 animate-spin mr-2" /> পারমিশন লোড হচ্ছে...
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* কুইক প্রিসেট বাটন */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground">কুইক প্রিসেট:</span>
              <button
                type="button"
                onClick={() => {
                  const allOn: Record<string, boolean> = {};
                  displayLayersList.forEach((l) => (allOn[l.key] = true));
                  setPermissions(allOn);
                  toast.info("সবগুলো লেয়ার উন্মুক্ত করা হলো");
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer"
              >
                🌟 সম্পূর্ণ উন্মুক্ত (Full Access)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPermissions({
                    showArabic: true,
                    showWordByWord: true,
                    showTransliteration: true,
                    showConventionalBn: true,
                    showConventionalEn: true,
                    showModernBn: false,
                    showModernEn: false,
                    showScientificBn: false,
                    showScientificEn: false,
                    showLexicon: true,
                    showLexiconModern: false,
                    showLexiconScientific: false,
                    showMetaData: false,
                  });
                  toast.info("শুধুমাত্র প্রচলিত কুরআন লেয়ারসমূহ সক্রিয় করা হলো");
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/30 cursor-pointer"
              >
                📖 শুধুমাত্র প্রচলিত কুরআন (Standard)
              </button>
            </div>

            {/* ১০টি লেয়ারের চেকলিস্ট */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground block">
                এই ইউজারের জন্য কুরআনের কোন কোন অংশ দৃশ্যমান হবে:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {displayLayersList.map((layer) => {
                  const isChecked = permissions[layer.key] ?? true;
                  return (
                    <div
                      key={layer.key}
                      className={`flex items-start justify-between gap-2.5 p-3 rounded-lg border transition-all cursor-pointer ${
                        layer.highlight
                          ? isChecked
                            ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
                            : "border-border/60 bg-card opacity-70"
                          : isChecked
                          ? "border-border bg-card"
                          : "border-border/40 bg-muted/20 opacity-60"
                      }`}
                      onClick={() => setPermissions({ ...permissions, [layer.key]: !isChecked })}
                    >
                      <div className="space-y-0.5 select-none flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">{layer.title}</span>
                          {layer.highlight && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 font-bold">
                              বিশেষ
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{layer.desc}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          id={`user-perm-${layer.key}`}
                          checked={isChecked}
                          onCheckedChange={(val) => setPermissions({ ...permissions, [layer.key]: val })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* এডমিন নোটস */}
            <div className="space-y-1 pt-2 border-t border-border/50">
              <Label htmlFor="admin-perm-notes" className="text-xs font-semibold">
                এডমিন নোট (ঐচ্ছিক):
              </Label>
              <Input
                id="admin-perm-notes"
                placeholder="যেমন: অনুমোদিত ইসলামিক গবেষক / বিশেষ রিভিউয়ার"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t border-border/60">
          {hasCustomRecord ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
              className="text-destructive hover:bg-destructive/10 text-xs h-8 cursor-pointer"
            >
              <RotateCcw className="size-3 mr-1" /> গ্লোবাল ডিফল্টে রিসেট
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
              বাতিল
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saveMutation.isPending || loading}
              onClick={() => saveMutation.mutate()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs cursor-pointer"
            >
              {saveMutation.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : <Check className="size-3 mr-1" />}
              পারমিশন সংরক্ষণ করুন
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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