// src/components/PostsExportImportAdmin.tsx
// Comprehensive Post Export & Import Interface for Quran Explore Pro (কুরআন অন্বেষা)
// Complete WordPress-grade Export & Import suite supporting WXR XML, Blogger, JSON, CSV & Markdown.

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Upload,
  FileCode,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  ArrowRight,
  Database,
  User,
  Eye,
  X
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession, getStoredAuthToken } from "@/lib/auth";
import { useCategories } from "@/lib/menu";
import { STATIC_ARTICLES_META } from "@/lib/staticArticlesMeta";
import { getPermanentlyDeletedKeys, getTrashedArticleKeys } from "@/lib/articleDeletion";
import { getCachedDynamicArticles } from "@/lib/dualSupportSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArticleExportItem,
  ParsedImportResult,
  filterArticlesForExport,
  exportToWordPressXml,
  exportToJson,
  exportToCsv,
  exportToMarkdownZip,
  parseWordPressXml,
  parseBloggerXml,
  parseJsonBackup,
  parseCsvPosts,
  downloadFile,
  downloadBlob
} from "@/lib/postExportImportEngine";
import { bnToEnSlug } from "@/lib/slugHelper";

interface PostsExportImportAdminProps {
  initialSubTab?: "import" | "export";
  onNavigateToArticles?: () => void;
}

export function PostsExportImportAdmin({
  initialSubTab = "import",
  onNavigateToArticles,
}: PostsExportImportAdminProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();

  const [activeSubTab, setActiveSubTab] = useState<"import" | "export">(initialSubTab);

  // --- QUERY: ALL ARTICLES (FOR EXPORT) ---
  const articlesQuery = useQuery({
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
            .select(`
              id,
              slug,
              title_bn,
              title_en,
              excerpt_bn,
              excerpt_en,
              content_bn,
              content_en,
              cover_image_url,
              published,
              published_at,
              created_at,
              updated_at,
              deleted_at,
              author_id,
              category_id,
              category_ids,
              tags
            `)
            .order("created_at", { ascending: false });
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

      return merged as ArticleExportItem[];
    },
  });

  // --- QUERY: AUTHORS ---
  const authorsQuery = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/authors");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch {}
      const { data, error } = await supabase.from("authors").select("id, name_bn, name_en").order("name_bn");
      if (error) return [];
      return data || [];
    },
  });

  // =========================================================================
  // EXPORT STATE
  // =========================================================================
  const [exportFormat, setExportFormat] = useState<"wordpress" | "json" | "csv" | "markdown-zip">("wordpress");
  const [exportScope, setExportScope] = useState<"all" | "category" | "author" | "status" | "date">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"published" | "draft" | "trash" | "all">("published");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  // Compute matched articles for export preview
  const matchedArticles = useMemo(() => {
    const all = articlesQuery.data || [];
    return filterArticlesForExport(all, {
      format: exportFormat,
      scope: exportScope,
      categoryId: selectedCategoryId,
      authorId: selectedAuthorId,
      status: selectedStatus,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [
    articlesQuery.data,
    exportFormat,
    exportScope,
    selectedCategoryId,
    selectedAuthorId,
    selectedStatus,
    startDate,
    endDate,
  ]);

  // Handle Export Action
  const handleExecuteExport = async () => {
    if (matchedArticles.length === 0) {
      toast.error("এক্সপোর্ট করার মতো কোনো পোস্ট পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন।");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("এক্সপোর্ট ফাইল তৈরি হচ্ছে...");

    try {
      // Ensure full content for static articles if missing
      const articlesWithFullContent = await Promise.all(
        matchedArticles.map(async (art) => {
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

      if (exportFormat === "wordpress") {
        const xml = exportToWordPressXml(articlesWithFullContent);
        downloadFile(xml, `quran-explore-wordpress-${dateStr}.xml`, "application/xml;charset=utf-8");
        toast.success(`সফলভাবে ${articlesWithFullContent.length}টি পোস্ট WordPress XML আকারে ডাউনলোড হয়েছে!`, { id: toastId });
      } else if (exportFormat === "json") {
        const json = exportToJson(articlesWithFullContent);
        downloadFile(json, `quran-explore-backup-${dateStr}.json`, "application/json;charset=utf-8");
        toast.success(`সফলভাবে ${articlesWithFullContent.length}টি পোস্টের পূর্ণাঙ্গ JSON ব্যাকআপ ডাউনলোড হয়েছে!`, { id: toastId });
      } else if (exportFormat === "csv") {
        const csv = exportToCsv(articlesWithFullContent);
        downloadFile(csv, `quran-explore-posts-${dateStr}.csv`, "text/csv;charset=utf-8");
        toast.success(`সফলভাবে ${articlesWithFullContent.length}টি পোস্টের Excel CSV স্প্রেডশিট ডাউনলোড হয়েছে!`, { id: toastId });
      } else if (exportFormat === "markdown-zip") {
        const zipBlob = await exportToMarkdownZip(articlesWithFullContent);
        downloadBlob(zipBlob, `quran-explore-markdown-posts-${dateStr}.zip`);
        toast.success(`সফলভাবে ${articlesWithFullContent.length}টি পোস্টের Markdown ZIP প্যাকেজ ডাউনলোড হয়েছে!`, { id: toastId });
      }
    } catch (err: any) {
      console.error("Export generation error:", err);
      toast.error("এক্সপোর্ট তৈরিতে সমস্যা হয়েছে: " + (err.message || String(err)), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // =========================================================================
  // IMPORT STATE
  // =========================================================================
  const [selectedImportType, setSelectedImportType] = useState<"wordpress" | "blogger" | "json" | "csv">("wordpress");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [importOptions, setImportOptions] = useState({
    keepPermalink: true,
    keepAuthor: true,
    keepCategory: true,
    keepTags: true,
    keepCoverImage: true,
    keepDateAndStatus: true,
    overwriteDuplicates: false,
  });

  const [fallbackAuthorId, setFallbackAuthorId] = useState<string>("");
  const [fallbackCategoryId, setFallbackCategoryId] = useState<string>("");

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Handle File Selection and Parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);
    setImportSuccessCount(null);

    try {
      const text = await file.text();
      let result: ParsedImportResult;

      if (selectedImportType === "wordpress") {
        result = parseWordPressXml(text);
      } else if (selectedImportType === "blogger") {
        result = parseBloggerXml(text);
      } else if (selectedImportType === "json") {
        result = parseJsonBackup(text);
      } else if (selectedImportType === "csv") {
        result = parseCsvPosts(text);
      } else {
        throw new Error("অপরিচিত ইমপোর্ট ফরম্যাট");
      }

      if (result.posts.length === 0) {
        throw new Error("ফাইলটিতে কোনো পোস্ট পাওয়া যায়নি।");
      }

      setParsedData(result);
      toast.success(`ফাইলটি যাচাই সম্পন্ন: ${result.posts.length}টি পোস্ট পাওয়া গেছে।`);
    } catch (err: any) {
      console.error("Parse error:", err);
      setParseError(err.message || "ফাইল পার্স করতে ব্যর্থ হয়েছে");
      toast.error(err.message || "ফাইল পার্স করা যায়নি");
    } finally {
      setIsParsing(false);
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.posts.length === 0) {
      toast.error("ইমপোর্ট করার জন্য কোনো ডেটা পাওয়া যায়নি");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: parsedData.posts.length });

    try {
      const dbAuthors = authorsQuery.data || [];
      const dbCategories = categoriesQuery.data || [];

      // 1. Author Mapping & Auto Insertion
      const authorMap = new Map<string, string>();
      dbAuthors.forEach((a) => {
        authorMap.set(a.name_bn.toLowerCase(), a.id);
        if (a.name_en) authorMap.set(a.name_en.toLowerCase(), a.id);
      });

      if (importOptions.keepAuthor && parsedData.detectedAuthors.length > 0) {
        for (const authName of parsedData.detectedAuthors) {
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

      // 2. Category Mapping & Auto Insertion
      const categoryMap = new Map<string, string>();
      dbCategories.forEach((c) => {
        categoryMap.set(c.name_bn.toLowerCase(), c.id);
        if (c.name_en) categoryMap.set(c.name_en.toLowerCase(), c.id);
      });

      if (importOptions.keepCategory && parsedData.detectedCategories.length > 0) {
        for (const catName of parsedData.detectedCategories) {
          if (!categoryMap.has(catName.toLowerCase())) {
            const catSlug = bnToEnSlug(catName, "cat");
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

      // 3. Prepare Articles
      const articlesToInsert: any[] = [];
      const usedSlugs = new Set<string>();

      for (let i = 0; i < parsedData.posts.length; i++) {
        const item = parsedData.posts[i];

        let resolvedAuthorId = fallbackAuthorId || null;
        if (importOptions.keepAuthor && item.author_name && authorMap.has(item.author_name.toLowerCase())) {
          resolvedAuthorId = authorMap.get(item.author_name.toLowerCase()) || null;
        }

        let resolvedCategoryId = fallbackCategoryId || null;
        if (importOptions.keepCategory && item.category_name && categoryMap.has(item.category_name.toLowerCase())) {
          resolvedCategoryId = categoryMap.get(item.category_name.toLowerCase()) || null;
        }

        let finalSlug = importOptions.keepPermalink && item.slug ? item.slug : bnToEnSlug(item.title_bn, String(i));
        // Avoid collision inside same import batch
        if (usedSlugs.has(finalSlug)) {
          finalSlug = `${finalSlug}-${i + 1}`;
        }
        usedSlugs.add(finalSlug);

        articlesToInsert.push({
          title_bn: item.title_bn,
          title_en: item.title_en || item.title_bn,
          slug: finalSlug,
          content_bn: item.content_bn,
          content_en: item.content_en || item.content_bn,
          excerpt_bn: item.excerpt_bn || item.content_bn.replace(/<[^>]*>?/gm, "").slice(0, 180).trim(),
          excerpt_en: item.excerpt_en || (item.content_en ? item.content_en.replace(/<[^>]*>?/gm, "").slice(0, 180).trim() : null),
          cover_image_url: importOptions.keepCoverImage ? item.cover_image_url : null,
          author_id: resolvedAuthorId,
          category_id: resolvedCategoryId,
          tags: importOptions.keepTags ? item.tags : [],
          published: importOptions.keepDateAndStatus ? item.published : true,
          published_at: importOptions.keepDateAndStatus ? item.published_at : new Date().toISOString(),
          created_by: user?.id || null,
          deleted_at: null,
        });
      }

      // 4. Batch Insertion (in chunks of 50 for safety)
      const chunkSize = 50;
      let insertedCount = 0;

      const token = getStoredAuthToken();
      for (let i = 0; i < articlesToInsert.length; i += chunkSize) {
        const chunk = articlesToInsert.slice(i, i + chunkSize);
        
        // Save to Cloudflare D1
        if (token) {
          for (const item of chunk) {
            try {
              await fetch("/api/public/articles", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: "save", ...item }),
              });
            } catch {}
          }
        }

        let error;
        try {
          if (importOptions.overwriteDuplicates) {
            const res = await supabase.from("articles").upsert(chunk, { onConflict: "slug" });
            error = res.error;
          } else {
            const res = await supabase.from("articles").insert(chunk);
            error = res.error;
          }
        } catch (sbErr) {
          if (!token) error = sbErr;
        }

        if (error && !token) throw error;

        insertedCount += chunk.length;
        setImportProgress({ current: insertedCount, total: articlesToInsert.length });
      }

      setImportSuccessCount(insertedCount);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      toast.success(`অভিনন্দন! সফলভাবে ${insertedCount}টি পোস্ট ইমপোর্ট সম্পন্ন হয়েছে।`);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error("ইমপোর্ট চলাকালীন ত্রুটি হয়েছে: " + (err.message || String(err)));
    } finally {
      setIsImporting(false);
    }
  };

  // Reset Import Flow
  const handleResetImport = () => {
    setImportFile(null);
    setParsedData(null);
    setParseError(null);
    setImportSuccessCount(null);
    setImportProgress(null);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER & TAB SWITCHER */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="size-5 text-[#2271b1]" />
              পোস্ট এক্সপোর্ট ও ইমপোর্ট হাব (Posts Export & Import)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              আপনার সাইটের সব পোস্ট ব্যাকআপ ও এক্সপোর্ট করুন অথবা অন্য যেকোনো প্ল্যাটফর্ম থেকে নতুন পোস্ট ইমপোর্ট করুন।
            </p>
          </div>

          {/* Subtab Toggle Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/50 border border-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab("import")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeSubTab === "import"
                  ? "bg-[#2271b1] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <Upload className="size-4" />
              <span>পোস্ট ইমপোর্ট (Import)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("export")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeSubTab === "export"
                  ? "bg-[#2271b1] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <Download className="size-4" />
              <span>পোস্ট এক্সপোর্ট (Export)</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: IMPORT CONTENT                                              */}
        {/* =================================================================== */}
        {activeSubTab === "import" && (
          <div className="pt-6 space-y-6">
            {!importFile ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">প্ল্যাটফর্ম বা ফরম্যাট নির্বাচন করুন</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    নিচের যে উৎস থেকে আপনি ডেটা ইমপোর্ট করতে চান তা নির্বাচন করুন:
                  </p>
                </div>

                {/* 4 Import Source Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: WordPress */}
                  <div
                    onClick={() => setSelectedImportType("wordpress")}
                    className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                      selectedImportType === "wordpress"
                        ? "border-[#2271b1] bg-[#2271b1]/5 ring-1 ring-[#2271b1]"
                        : "border-border/80 bg-muted/20 hover:border-[#2271b1]/50"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-md bg-[#2271b1]/10 px-2 py-0.5 text-[11px] font-bold text-[#2271b1]">
                        WordPress (WXR XML)
                      </span>
                      <h4 className="text-sm font-bold text-foreground">ওয়ার্ডপ্রেস থেকে ইমপোর্ট</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tools &gt; Export থেকে ডাউনলোড করা <code>.xml</code> ফাইল দিয়ে সব পোস্ট ইমপোর্ট করুন।
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedImportType === "wordpress" ? "default" : "outline"}
                      className="w-full text-xs font-semibold cursor-pointer"
                    >
                      {selectedImportType === "wordpress" ? "নির্বাচিত আছে ✓" : "বেছে নিন"}
                    </Button>
                  </div>

                  {/* Card 2: Blogger */}
                  <div
                    onClick={() => setSelectedImportType("blogger")}
                    className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                      selectedImportType === "blogger"
                        ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                        : "border-border/80 bg-muted/20 hover:border-amber-500/50"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Blogger (Atom XML)
                      </span>
                      <h4 className="text-sm font-bold text-foreground">ব্লগার থেকে ইমপোর্ট</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Settings &gt; Back up content থেকে ডাউনলোড করা <code>.xml</code> ব্যাকআপ ফাইল দিয়ে ইমপোর্ট করুন।
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedImportType === "blogger" ? "default" : "outline"}
                      className="w-full text-xs font-semibold cursor-pointer"
                    >
                      {selectedImportType === "blogger" ? "নির্বাচিত আছে ✓" : "বেছে নিন"}
                    </Button>
                  </div>

                  {/* Card 3: JSON Backup */}
                  <div
                    onClick={() => setSelectedImportType("json")}
                    className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                      selectedImportType === "json"
                        ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                        : "border-border/80 bg-muted/20 hover:border-emerald-500/50"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        JSON Backup
                      </span>
                      <h4 className="text-sm font-bold text-foreground">সম্পূর্ণ JSON ব্যাকআপ</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        কুরআন অন্বেষা বা কাস্টম সিস্টেমের <code>.json</code> ব্যাকআপ ফাইল দিয়ে হাই-স্পিড ইমপোর্ট করুন।
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedImportType === "json" ? "default" : "outline"}
                      className="w-full text-xs font-semibold cursor-pointer"
                    >
                      {selectedImportType === "json" ? "নির্বাচিত আছে ✓" : "বেছে নিন"}
                    </Button>
                  </div>

                  {/* Card 4: CSV / Excel */}
                  <div
                    onClick={() => setSelectedImportType("csv")}
                    className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                      selectedImportType === "csv"
                        ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500"
                        : "border-border/80 bg-muted/20 hover:border-purple-500/50"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        CSV / Excel
                      </span>
                      <h4 className="text-sm font-bold text-foreground">CSV স্প্রেডশিট</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        স্প্রেডশিট বা টেবিল আকারে সাজানো <code>.csv</code> ফাইল দিয়ে একাধিক পোস্ট একসাথে যুক্ত করুন।
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedImportType === "csv" ? "default" : "outline"}
                      className="w-full text-xs font-semibold cursor-pointer"
                    >
                      {selectedImportType === "csv" ? "নির্বাচিত আছে ✓" : "বেছে নিন"}
                    </Button>
                  </div>
                </div>

                {/* Upload Input Drop Zone */}
                <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 sm:p-10 text-center bg-muted/10 hover:bg-muted/20 transition-colors">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <Upload className="size-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {selectedImportType === "wordpress" && "WordPress WXR XML ফাইল আপলোড করুন"}
                    {selectedImportType === "blogger" && "Blogger Atom XML ফাইল আপলোড করুন"}
                    {selectedImportType === "json" && "JSON ব্যাকআপ ফাইল আপলোড করুন"}
                    {selectedImportType === "csv" && "CSV স্প্রেডশিট ফাইল আপলোড করুন"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    আপনার কম্পিউটার থেকে ফাইলটি টেনে এনে ছেড়ে দিন অথবা নিচের বাটনে ক্লিক করে ফাইলটি বেছে নিন।
                  </p>
                  <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                    <Upload className="size-4" />
                    <span>ফাইল নির্বাচন করুন</span>
                    <input
                      type="file"
                      accept={
                        selectedImportType === "json"
                          ? ".json"
                          : selectedImportType === "csv"
                          ? ".csv"
                          : ".xml"
                      }
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </>
            ) : (
              /* ACTIVE FILE IMPORT WIZARD */
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {selectedImportType === "csv" ? (
                        <FileSpreadsheet className="size-5" />
                      ) : selectedImportType === "json" ? (
                        <FileCode className="size-5" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{importFile.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        সাইজ: {(importFile.size / 1024).toFixed(1)} KB • টাইপ: {selectedImportType.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetImport}
                    disabled={isImporting}
                    className="text-xs cursor-pointer"
                  >
                    অন্য ফাইল নির্বাচন করুন
                  </Button>
                </div>

                {isParsing && (
                  <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground text-sm">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span>ফাইলটি বিশ্লেষণ ও পোস্টগুলো যাচাই করা হচ্ছে...</span>
                  </div>
                )}

                {parseError && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="size-4" />
                      <span>ফাইল বিশ্লেষণে ত্রুটি ঘটেছে</span>
                    </div>
                    <p>{parseError}</p>
                  </div>
                )}

                {/* Parsed Inspection & Settings */}
                {parsedData && !importSuccessCount && (
                  <div className="space-y-6">
                    {/* Stats Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <span className="text-[11px] text-muted-foreground block">শনাক্তকৃত পোস্ট</span>
                        <strong className="text-lg font-bold text-primary">{parsedData.posts.length}টি</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <span className="text-[11px] text-muted-foreground block">শনাক্তকৃত লেখক</span>
                        <strong className="text-lg font-bold text-foreground">
                          {parsedData.detectedAuthors.length > 0 ? `${parsedData.detectedAuthors.length} জন` : "স্বয়ংক্রিয়"}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <span className="text-[11px] text-muted-foreground block">শনাক্তকৃত ক্যাটাগরি</span>
                        <strong className="text-lg font-bold text-foreground">
                          {parsedData.detectedCategories.length > 0
                            ? `${parsedData.detectedCategories.length}টি`
                            : "স্বয়ংক্রিয়"}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <span className="text-[11px] text-muted-foreground block">স্ট্যাটাস মান্যতা</span>
                        <strong className="text-lg font-bold text-emerald-600 dark:text-emerald-400">সক্রিয় ✓</strong>
                      </div>
                    </div>

                    {/* Import Options Checkboxes */}
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                        ইমপোর্ট অপশন ও ম্যাপিং
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importOptions.keepAuthor}
                            onChange={(e) => setImportOptions({ ...importOptions, keepAuthor: e.target.checked })}
                            className="rounded accent-[#2271b1] size-3.5"
                          />
                          <span>লেখক স্বয়ংক্রিয় তৈরি ও ম্যাচ করুন</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importOptions.keepCategory}
                            onChange={(e) => setImportOptions({ ...importOptions, keepCategory: e.target.checked })}
                            className="rounded accent-[#2271b1] size-3.5"
                          />
                          <span>ক্যাটাগরি স্বয়ংক্রিয় তৈরি ও ম্যাচ করুন</span>
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
                          <span>আসল প্রকাশের তারিখ ও স্ট্যাটাস বজায় রাখুন</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importOptions.overwriteDuplicates}
                            onChange={(e) => setImportOptions({ ...importOptions, overwriteDuplicates: e.target.checked })}
                            className="rounded accent-[#2271b1] size-3.5"
                          />
                          <span>একই স্লাগের পোস্ট থাকলে আপডেট (Overwrite) করুন</span>
                        </label>
                      </div>

                      {/* Fallback Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/50">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">ডিফল্ট লেখক (যদি ফাইলে না মিলে):</Label>
                          <select
                            value={fallbackAuthorId}
                            onChange={(e) => setFallbackAuthorId(e.target.value)}
                            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                          >
                            <option value="">কোনো নির্দিষ্ট লেখক নেই</option>
                            {authorsQuery.data?.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name_bn}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">ডিফল্ট ক্যাটাগরি (যদি ফাইলে না মিলে):</Label>
                          <select
                            value={fallbackCategoryId}
                            onChange={(e) => setFallbackCategoryId(e.target.value)}
                            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                          >
                            <option value="">কোনো ক্যাটাগরি নেই</option>
                            {categoriesQuery.data?.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name_bn}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Preview Table of First 5 Posts */}
                    <div className="rounded-xl border border-border overflow-hidden bg-card">
                      <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Eye className="size-3.5 text-primary" />
                          পোস্ট প্রিভিউ (প্রথম ৫টি পোস্টের নমুনা)
                        </span>
                        <span className="text-muted-foreground font-mono">মোট {parsedData.posts.length}টি পোস্ট</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                              <th className="py-2 px-3 font-semibold">শিরোনাম</th>
                              <th className="py-2 px-3 font-semibold">লেখক</th>
                              <th className="py-2 px-3 font-semibold">ক্যাটাগরি</th>
                              <th className="py-2 px-3 font-semibold">স্ট্যাটাস</th>
                              <th className="py-2 px-3 font-semibold">তারিখ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 font-serif">
                            {parsedData.posts.slice(0, 5).map((p, idx) => (
                              <tr key={idx} className="hover:bg-muted/20">
                                <td className="py-2.5 px-3 font-medium text-foreground max-w-xs truncate">
                                  {p.title_bn}
                                </td>
                                <td className="py-2.5 px-3 text-muted-foreground">{p.author_name || "—"}</td>
                                <td className="py-2.5 px-3 text-muted-foreground">{p.category_name || "—"}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      p.published
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {p.published ? "প্রকাশিত" : "খসড়া"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                                  {p.published_at ? new Date(p.published_at).toLocaleDateString("bn-BD") : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Progress Bar (during import) */}
                    {isImporting && importProgress && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-primary">
                          <span>পোস্ট ইমপোর্ট হচ্ছে...</span>
                          <span className="font-mono">
                            {importProgress.current} / {importProgress.total} (
                            {Math.round((importProgress.current / importProgress.total) * 100)}%)
                          </span>
                        </div>
                        <Progress value={(importProgress.current / importProgress.total) * 100} className="h-2" />
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetImport}
                        disabled={isImporting}
                        className="text-xs cursor-pointer"
                      >
                        বাতিল
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleExecuteImport}
                        disabled={isImporting}
                        className="bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>ইমপোর্ট হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5" />
                            <span>{parsedData.posts.length}টি পোস্ট ইমপোর্ট শুরু করুন</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Success Card */}
                {importSuccessCount !== null && (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-foreground">ইমপোর্ট সফলভাবে সম্পন্ন হয়েছে!</h4>
                      <p className="text-xs text-muted-foreground">
                        সর্বমোট <strong className="text-emerald-600 dark:text-emerald-400">{importSuccessCount}টি</strong>{" "}
                        পোস্ট আপনার ডেটাবেজে সফলভাবে যুক্ত হয়েছে।
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetImport}
                        className="text-xs cursor-pointer"
                      >
                        আরেকটি ফাইল ইমপোর্ট করুন
                      </Button>
                      {onNavigateToArticles && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={onNavigateToArticles}
                          className="bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold cursor-pointer gap-1.5"
                        >
                          <span>সকল পোস্টে যান</span>
                          <ArrowRight className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: EXPORT CONTENT                                              */}
        {/* =================================================================== */}
        {activeSubTab === "export" && (
          <div className="pt-6 space-y-6">
            {/* Step 1: Filter Scope */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Filter className="size-4 text-[#2271b1]" />
                ১. কি কি পোস্ট এক্সপোর্ট করবেন তা নির্বাচন করুন:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                {/* Option 1: All */}
                <label
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    exportScope === "all"
                      ? "border-[#2271b1] bg-[#2271b1]/5 ring-1 ring-[#2271b1]"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "all"}
                      onChange={() => setExportScope("all")}
                      className="accent-[#2271b1]"
                    />
                    <span className="text-xs font-bold text-foreground">সকল পোস্ট</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-2">
                    সবগুলো পোস্ট একসাথে এক্সপোর্ট হবে ({articlesQuery.data?.filter((a) => !a.deleted_at).length || 0}টি)
                  </span>
                </label>

                {/* Option 2: Category */}
                <label
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    exportScope === "category"
                      ? "border-[#2271b1] bg-[#2271b1]/5 ring-1 ring-[#2271b1]"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "category"}
                      onChange={() => setExportScope("category")}
                      className="accent-[#2271b1]"
                    />
                    <span className="text-xs font-bold text-foreground">ক্যাটাগরি অনুযায়ী</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-2">নির্দিষ্ট বিষয়ের পোস্ট ফিল্টার করুন</span>
                </label>

                {/* Option 3: Author */}
                <label
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    exportScope === "author"
                      ? "border-[#2271b1] bg-[#2271b1]/5 ring-1 ring-[#2271b1]"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "author"}
                      onChange={() => setExportScope("author")}
                      className="accent-[#2271b1]"
                    />
                    <span className="text-xs font-bold text-foreground">লেখক অনুযায়ী</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-2">নির্দিষ্ট লেখকের পোস্ট এক্সপোর্ট করুন</span>
                </label>

                {/* Option 4: Status */}
                <label
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    exportScope === "status"
                      ? "border-[#2271b1] bg-[#2271b1]/5 ring-1 ring-[#2271b1]"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "status"}
                      onChange={() => setExportScope("status")}
                      className="accent-[#2271b1]"
                    />
                    <span className="text-xs font-bold text-foreground">স্ট্যাটাস অনুযায়ী</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-2">প্রকাশিত অথবা খসড়া পোস্ট</span>
                </label>

                {/* Option 5: Date */}
                <label
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    exportScope === "date"
                      ? "border-[#2271b1] bg-[#2271b1]/5 ring-1 ring-[#2271b1]"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "date"}
                      onChange={() => setExportScope("date")}
                      className="accent-[#2271b1]"
                    />
                    <span className="text-xs font-bold text-foreground">তারিখের সীমা অনুযায়ী</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-2">নির্দিষ্ট সময়কালের পোস্ট</span>
                </label>
              </div>

              {/* Conditional Sub-selectors based on Scope */}
              {exportScope === "category" && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 mt-2 max-w-md">
                  <Label className="text-xs text-muted-foreground block mb-1">ক্যাটাগরি বেছে নিন:</Label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="h-9 w-full rounded border border-border bg-background px-3 text-xs"
                  >
                    <option value="">সকল ক্যাটাগরি</option>
                    {categoriesQuery.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_bn} ({c.name_en})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {exportScope === "author" && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 mt-2 max-w-md">
                  <Label className="text-xs text-muted-foreground block mb-1">লেখক বেছে নিন:</Label>
                  <select
                    value={selectedAuthorId}
                    onChange={(e) => setSelectedAuthorId(e.target.value)}
                    className="h-9 w-full rounded border border-border bg-background px-3 text-xs"
                  >
                    <option value="">সকল লেখক</option>
                    {authorsQuery.data?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name_bn} ({a.name_en})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {exportScope === "status" && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 mt-2 max-w-md">
                  <Label className="text-xs text-muted-foreground block mb-1">স্ট্যাটাস বেছে নিন:</Label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="h-9 w-full rounded border border-border bg-background px-3 text-xs"
                  >
                    <option value="published">🟢 শুধুমাত্র প্রকাশিত পোস্ট (Published)</option>
                    <option value="draft">🟡 শুধুমাত্র খসড়া পোস্ট (Draft)</option>
                    <option value="trash">🗑️ ট্র্যাশে থাকা পোস্ট (Trash)</option>
                    <option value="all">সব ধরনের পোস্ট (All)</option>
                  </select>
                </div>
              )}

              {exportScope === "date" && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">শুরুর তারিখ:</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">শেষের তারিখ:</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Choose Export Format */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <FileCode className="size-4 text-[#2271b1]" />
                ২. এক্সপোর্ট ফরম্যাট নির্বাচন করুন:
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                {/* Format 1: WordPress XML */}
                <div
                  onClick={() => setExportFormat("wordpress")}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                    exportFormat === "wordpress"
                      ? "border-[#2271b1] bg-[#2271b1]/5 ring-1 ring-[#2271b1]"
                      : "border-border/80 bg-muted/20 hover:border-[#2271b1]/50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[#2271b1]/10 px-2 py-0.5 text-[11px] font-bold text-[#2271b1]">
                        WordPress XML
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        স্ট্যান্ডার্ড
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">WordPress WXR XML (.xml)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      ওয়ার্ডপ্রেস eXtended RSS 1.2 ফরম্যাট। যেকোনো ওয়ার্ডপ্রেস ব্লগে হুবহু ইমপোর্ট করা যাবে।
                    </p>
                  </div>
                  <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                    <span>✓ ট্যাগ, ক্যাটাগরি ও লেখক সংরক্ষিত</span>
                  </div>
                </div>

                {/* Format 2: JSON Backup */}
                <div
                  onClick={() => setExportFormat("json")}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                    exportFormat === "json"
                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                      : "border-border/80 bg-muted/20 hover:border-emerald-500/50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Full JSON
                      </span>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        পূর্ণাঙ্গ ব্যাকআপ
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">সম্পূর্ণ JSON ব্যাকআপ (.json)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      পূর্ণাঙ্গ বাংলা ও ইংরেজি কনটেন্ট, মেটাডেটা, ইউজার আইডি ও ট্যাগ সহ নিখুঁত ডেটা ব্যাকআপ।
                    </p>
                  </div>
                  <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                    <span>✓ ১০০% ডেটা নিরাপত্তা ও রিস্টোর উপযোগী</span>
                  </div>
                </div>

                {/* Format 3: CSV Excel */}
                <div
                  onClick={() => setExportFormat("csv")}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                    exportFormat === "csv"
                      ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500"
                      : "border-border/80 bg-muted/20 hover:border-purple-500/50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        Excel CSV
                      </span>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        স্প্রেডশিট
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">CSV স্প্রেডশিট (.csv)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      মাইক্রোসফট এক্সেল বা গুগল শিটসে ওপেন করার জন্য UTF-8 BOM যুক্ত ক্লিন স্প্রেডশিট টেবিল।
                    </p>
                  </div>
                  <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                    <span>✓ বাংলা ফন্ট ভাঙবে না (UTF-8 BOM)</span>
                  </div>
                </div>

                {/* Format 4: Markdown ZIP */}
                <div
                  onClick={() => setExportFormat("markdown-zip")}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                    exportFormat === "markdown-zip"
                      ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                      : "border-border/80 bg-muted/20 hover:border-amber-500/50"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Markdown ZIP
                      </span>
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        অফলাইন এডিটর
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Markdown জিপ প্যাকেজ (.zip)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      প্রতিটি পোস্টের জন্য আলাদা <code>.md</code> ফাইল ও ফ্রন্টম্যাটার (Obsidian বা VS Code এর জন্য)।
                    </p>
                  </div>
                  <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                    <span>✓ জিপ ফাইলে সাজানো মার্কডাউন</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Summary & Trigger Action */}
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">এক্সপোর্ট প্রস্তুতি সারাংশ</span>
                <h4 className="text-base sm:text-lg font-bold text-foreground">
                  নির্বাচিত ফিল্টার অনুযায়ী{" "}
                  <span className="text-[#2271b1] underline decoration-wavy">{matchedArticles.length}টি পোস্ট</span> প্রস্তুত
                </h4>
                <p className="text-xs text-muted-foreground font-serif">
                  ফরম্যাট:{" "}
                  <strong>
                    {exportFormat === "wordpress" && "WordPress XML (.xml)"}
                    {exportFormat === "json" && "সম্পূর্ণ JSON ব্যাকআপ (.json)"}
                    {exportFormat === "csv" && "Excel CSV স্প্রেডশিট (.csv)"}
                    {exportFormat === "markdown-zip" && "Markdown জিপ প্যাকেজ (.zip)"}
                  </strong>
                </p>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={handleExecuteExport}
                disabled={isExporting || matchedArticles.length === 0}
                className="bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold cursor-pointer shadow-sm gap-2 min-w-[200px]"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>ফাইল প্রস্তুত হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    <span>এক্সপোর্ট ফাইল ডাউনলোড করুন</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
