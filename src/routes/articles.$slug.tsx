import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  Bold,
  Calendar,
  Check,
  Code,
  Eye,
  EyeOff,
  Folder,
  Globe,
  Italic,
  List,
  ListOrdered,
  MessageSquare,
  Pencil,
  Quote,
  Send,
  Underline as UnderlineIcon,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { useIsAdmin } from "@/lib/auth";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AuthorCard } from "@/components/AuthorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/articles/$slug")({
  component: ArticlePage,
});

interface CommentItem {
  id: string;
  name: string;
  comment: string;
  created_at: string;
}

function InlineRichEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isHtmlMode]);

  const executeCommand = (command: string, arg?: string) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    
    const formattedHtml = text
      .split(/\r\n|\r|\n/)
      .map((line) => line.trim())
      .map((line) => (line ? `<p>${line}</p>` : `<p><br></p>`))
      .join("");

    document.execCommand("insertHTML", false, formattedHtml);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs font-medium"
          onClick={() => setIsHtmlMode(!isHtmlMode)}
        >
          {isHtmlMode ? (
            <>
              <Eye className="size-3.5" /> সাধারণ ভিউ
            </>
          ) : (
            <>
              <Code className="size-3.5" /> HTML কোড ভিউ
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1.5">
          <button
            type="button"
            title="বোল্ড"
            disabled={isHtmlMode}
            onClick={() => executeCommand("bold")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            title="ইটালিক"
            disabled={isHtmlMode}
            onClick={() => executeCommand("italic")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            title="আন্ডারলাইন"
            disabled={isHtmlMode}
            onClick={() => executeCommand("underline")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <UnderlineIcon className="size-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-border" />
          <button
            type="button"
            title="বামে সারিবদ্ধ"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyLeft")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignLeft className="size-4" />
          </button>
          <button
            type="button"
            title="মাঝখানে সারিবদ্ধ"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyCenter")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignCenter className="size-4" />
          </button>
          <button
            type="button"
            title="ডানে সারিবদ্ধ"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyRight")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignRight className="size-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-border" />
          <button
            type="button"
            title="উদ্ধৃতি"
            disabled={isHtmlMode}
            onClick={() => executeCommand("formatBlock", "blockquote")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <Quote className="size-4" />
          </button>
          <button
            type="button"
            title="বুলেট লিস্ট"
            disabled={isHtmlMode}
            onClick={() => executeCommand("insertUnorderedList")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            title="নাম্বার লিস্ট"
            disabled={isHtmlMode}
            onClick={() => executeCommand("insertOrderedList")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ListOrdered className="size-4" />
          </button>
        </div>

        {isHtmlMode ? (
          <Textarea
            rows={12}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-b-lg border-0 bg-background font-mono text-xs text-foreground focus-visible:ring-0 p-3"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onPaste={handlePaste}
            onInput={() => {
              if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
              }
            }}
            className="min-h-[260px] p-3 text-sm text-foreground focus:outline-none [&_*]:!bg-transparent [&_*]:!text-inherit [&_p]:mb-3 [&_p]:!bg-transparent [&_p:empty]:h-4 [&_div]:!bg-transparent [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          />
        )}
      </div>
    </div>
  );
}

function ArticlePage() {
  const params = useParams({ strict: false }) as Record<string, string>;
  const rawSlug = params["slug"] || params["$slug"] || "";
  const slug = decodeURIComponent(rawSlug).trim();

  const { t, lang } = usePrefs();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title_bn: "",
    title_en: "",
    excerpt_bn: "",
    excerpt_en: "",
    content_bn: "",
    content_en: "",
    cover_image_url: "",
    slug: "",
  });
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");

  const article = useQuery({
    queryKey: ["article-single", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data: art, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!art) return null;

      const [catsRes, authorRes] = await Promise.all([
        supabase
          .from("article_categories")
          .select("category_id, categories(id, name_bn, name_en, slug)")
          .eq("article_id", art.id),
        art.author_id
          ? supabase.from("authors").select("*").eq("id", art.author_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...art,
        article_categories: catsRes.data || [],
        authors: authorRes.data || null,
      };
    },
    enabled: Boolean(slug),
  });

  const categoriesQuery = useQuery({
    queryKey: ["all-categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name_bn");
      if (error) throw error;
      return data || [];
    },
  });

  const authorsQuery = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("authors").select("id, name_bn").order("name_bn");
      if (error) throw error;
      return data || [];
    },
  });

  const a = article.data;
  const isDraftPost = (a?.article_categories || []).some(
    (ac: any) => ac.categories?.slug === "draft" || ac.categories?.name_bn === "খসড়া"
  );

  useEffect(() => {
    if (a) {
      setFormData({
        title_bn: a.title_bn || "",
        title_en: a.title_en || "",
        excerpt_bn: a.excerpt_bn || "",
        excerpt_en: a.excerpt_en || "",
        content_bn: a.content_bn || "",
        content_en: a.content_en || "",
        cover_image_url: a.cover_image_url || "",
        slug: a.slug || "",
      });
      setSelectedAuthorId(a.author_id || "");
      setSelectedCatIds(
        (a.article_categories || []).map((ac: any) => ac.category_id).filter(Boolean)
      );
    }
  }, [a]);

  const updateArticle = useMutation({
    mutationFn: async ({ shouldPublish }: { shouldPublish?: boolean }) => {
      if (!a) return;

      const draftCat = categoriesQuery.data?.find(
        (c) => c.slug === "draft" || c.name_bn === "খসড়া"
      );

      let finalCatIds = [...selectedCatIds];
      if (shouldPublish === true && draftCat) {
        finalCatIds = finalCatIds.filter((id) => id !== draftCat.id);
      } else if (shouldPublish === false && draftCat) {
        if (!finalCatIds.includes(draftCat.id)) {
          finalCatIds.push(draftCat.id);
        }
      }

      const payload = {
        title_bn: formData.title_bn,
        title_en: formData.title_en || null,
        slug: formData.slug,
        excerpt_bn: formData.excerpt_bn || null,
        excerpt_en: formData.excerpt_en || null,
        content_bn: formData.content_bn,
        content_en: formData.content_en || null,
        cover_image_url: formData.cover_image_url || null,
        author_id: selectedAuthorId || null,
        published: true,
        published_at: a.published_at || new Date().toISOString(),
      };

      const { error } = await supabase.from("articles").update(payload).eq("id", a.id);
      if (error) throw error;

      await supabase.from("article_categories").delete().eq("article_id", a.id);

      if (finalCatIds.length > 0) {
        await supabase.from("article_categories").insert(
          finalCatIds.map((category_id) => ({
            article_id: a.id,
            category_id,
          }))
        );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["article-single", slug] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      setIsEditing(false);

      if (variables?.shouldPublish === true) {
        toast.success(lang === "bn" ? "পোস্টটি সফলভাবে সবার জন্য প্রকাশিত হয়েছে!" : "Article published successfully!");
      } else if (variables?.shouldPublish === false) {
        toast.success(lang === "bn" ? "পোস্টটি খসড়া/গোপন রাখা হয়েছে।" : "Article set to draft.");
      } else {
        toast.success(lang === "bn" ? "পরিবর্তনগুলো সংরক্ষিত হয়েছে!" : "Changes saved!");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleCategory = useMutation({
    mutationFn: async (catId: string) => {
      if (!a) return;
      const isSelected = selectedCatIds.includes(catId);
      const updated = isSelected
        ? selectedCatIds.filter((id) => id !== catId)
        : [...selectedCatIds, catId];

      setSelectedCatIds(updated);

      await supabase.from("article_categories").delete().eq("article_id", a.id);
      if (updated.length > 0) {
        await supabase.from("article_categories").insert(
          updated.map((category_id) => ({
            article_id: a.id,
            category_id,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-single", slug] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success(lang === "bn" ? "ক্যাটাগরি আপডেট হয়েছে" : "Category updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const togglePublishStatus = useMutation({
    mutationFn: async (makePublic: boolean) => {
      if (!a) return;
      const draftCat = categoriesQuery.data?.find(
        (c) => c.slug === "draft" || c.name_bn === "খসড়া"
      );
      if (!draftCat) return;

      if (makePublic) {
        await supabase
          .from("article_categories")
          .delete()
          .eq("article_id", a.id)
          .eq("category_id", draftCat.id);
      } else {
        await supabase
          .from("article_categories")
          .insert({ article_id: a.id, category_id: draftCat.id });
      }
    },
    onSuccess: (_, makePublic) => {
      queryClient.invalidateQueries({ queryKey: ["article-single", slug] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success(
        makePublic
          ? "পোস্টটি সবার জন্য উন্মুক্ত (Public) করা হয়েছে!"
          : "পোস্টটি খসড়া (Draft) করা হয়েছে!"
      );
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (article.isLoading || roleLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!a || (!isAdmin && isDraftPost)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-base text-muted-foreground">
          {lang === "bn" ? "পোস্টটি পাওয়া যায়নি বা এটি খসড়া অবস্থায় রয়েছে।" : "Article not found or is in draft mode."}
        </p>
        <Link to="/articles" search={{ q: undefined }} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          <ArrowLeft className="size-4" /> {t("backToArticles")}
        </Link>
      </div>
    );
  }

  const title = lang === "en" && a.title_en ? a.title_en : a.title_bn;
  const content = lang === "en" && a.content_en ? a.content_en : a.content_bn;

  const categoriesList = (a.article_categories ?? [])
    .map((ac: any) => ac.categories)
    .filter((cat: any) => cat && (isAdmin || (cat.slug !== "draft" && cat.name_bn !== "খসড়া")));

  const authorName = a.authors ? (lang === "en" && a.authors.name_en ? a.authors.name_en : a.authors.name_bn) : null;

  const formattedDate = a.published_at
    ? new Date(a.published_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")
    : null;
  const dateSearchParam = a.published_at ? a.published_at.slice(0, 10) : "";

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) {
      toast.error(lang === "bn" ? "নাম এবং মন্তব্য উভয়ই পূরণ করুন" : "Please enter both name and comment");
      return;
    }
    const newEntry: CommentItem = {
      id: Date.now().toString(),
      name: commentName.trim(),
      comment: commentText.trim(),
      created_at: new Date().toISOString(),
    };
    setComments([newEntry, ...comments]);
    setCommentName("");
    setCommentText("");
    toast.success(lang === "bn" ? "মন্তব্য যোগ করা হয়েছে!" : "Comment added successfully!");
  };

  const isHtml = /<[a-z][\s\S]*>/i.test(content || "");

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12">
      {isAdmin && (
        <div className="mb-8 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 shadow-sm backdrop-blur-sm sm:p-5 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`flex size-3 rounded-full shrink-0 ${isDraftPost ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
              <div>
                <h4 className="text-sm font-semibold text-foreground">অ্যাডমিন প্রিভিউ মোড</h4>
                <p className="text-xs text-muted-foreground">
                  বর্তমান অবস্থা:{" "}
                  {isDraftPost ? (
                    <strong className="text-amber-600 dark:text-amber-400">
                      ⚠️ খসড়া / গোপন (ভিজিটররা দেখতে পাচ্ছে না)
                    </strong>
                  ) : (
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ✓ প্রকাশিত (Public)
                    </strong>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isDraftPost ? (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-medium"
                  disabled={togglePublishStatus.isPending}
                  onClick={() => togglePublishStatus.mutate(true)}
                >
                  <Globe className="size-3.5" /> সবার জন্য পাবলিশ করুন
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-600 border-amber-500/40 hover:bg-amber-500/10 gap-1.5"
                  disabled={togglePublishStatus.isPending}
                  onClick={() => togglePublishStatus.mutate(false)}
                >
                  <EyeOff className="size-3.5" /> পুনরায় খসড়া করুন
                </Button>
              )}

              <Button
                size="sm"
                variant={isEditing ? "destructive" : "default"}
                onClick={() => setIsEditing(!isEditing)}
                className="gap-1.5"
              >
                {isEditing ? (
                  <>
                    <X className="size-3.5" /> এডিটর বন্ধ করুন
                  </>
                ) : (
                  <>
                    <Pencil className="size-3.5" /> এই পোস্টটি এডিট করুন
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Folder className="size-3 text-primary" /> ক্যাটাগরি নির্বাচন:
            </span>
            {categoriesQuery.data?.map((c) => {
              const active = selectedCatIds.includes(c.id);
              const isDraft = c.slug === "draft" || c.name_bn === "খসড়া";
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={toggleCategory.isPending}
                  onClick={() => toggleCategory.mutate(c.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    active
                      ? isDraft
                        ? "bg-amber-500 text-white border border-amber-600"
                        : "bg-primary text-primary-foreground border border-primary shadow-sm"
                      : "bg-background border border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }`}
                >
                  {active && <Check className="size-3" />}
                  {isDraft ? `⚠️ ${c.name_bn}` : c.name_bn}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && isEditing ? (
        <form
          className="card-soft mb-12 space-y-6 rounded-2xl border border-primary/40 p-6 shadow-md"
          onSubmit={(e) => {
            e.preventDefault();
            updateArticle.mutate({});
          }}
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-semibold text-primary">পোস্ট সম্পাদনা ও সংশোধন</h3>
            <span className="text-xs text-muted-foreground">সংশোধন করে সরাসরি পাবলিশ বা ড্রাফট রাখতে পারেন</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>শিরোনাম (বাংলা) *</Label>
              <Input
                required
                value={formData.title_bn}
                onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>শিরোনাম (ইংরেজি)</Label>
              <Input
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>স্লাগ / URL (Slug) *</Label>
            <Input
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>সংক্ষিপ্ত বিবরণ / সারসংক্ষেপ (বাংলা)</Label>
              <Textarea
                rows={2}
                value={formData.excerpt_bn}
                onChange={(e) => setFormData({ ...formData, excerpt_bn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>সংক্ষিপ্ত বিবরণ / সারসংক্ষেপ (ইংরেজি)</Label>
              <Textarea
                rows={2}
                value={formData.excerpt_en}
                onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
              />
            </div>
          </div>

          <InlineRichEditor
            label="মূল কন্টেন্ট (বাংলা)"
            value={formData.content_bn}
            onChange={(val) => setFormData({ ...formData, content_bn: val })}
          />

          <InlineRichEditor
            label="মূল কন্টেন্ট (ইংরেজি)"
            value={formData.content_en}
            onChange={(val) => setFormData({ ...formData, content_en: val })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>কভার ইমেজ URL</Label>
              <Input
                placeholder="https://..."
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>লেখক (Author)</Label>
              <select
                value={selectedAuthorId}
                onChange={(e) => setSelectedAuthorId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">লেখক ছাড়া</option>
                {authorsQuery.data?.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name_bn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={updateArticle.isPending}
              onClick={() => updateArticle.mutate({ shouldPublish: true })}
            >
              <Send className="size-4" /> সবার জন্য পাবলিশ করুন
            </Button>

            <Button
              type="button"
              variant="outline"
              className="text-amber-600 border-amber-500/40 hover:bg-amber-500/10 gap-1.5"
              disabled={updateArticle.isPending}
              onClick={() => updateArticle.mutate({ shouldPublish: false })}
            >
              <EyeOff className="size-4" /> খসড়া হিসেবে সেভ রাখুন
            </Button>

            <Button
              type="submit"
              variant="secondary"
              disabled={updateArticle.isPending}
              className="gap-1.5"
            >
              <Check className="size-4" /> শুধু আপডেট সেভ করুন
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              বাতিল
            </Button>
          </div>
        </form>
      ) : null}

      <Link to="/articles" search={{ q: undefined }} className="inline-flex items-center gap-1 text-sm text-primary">
        <ArrowLeft className="size-4" /> {t("backToArticles")}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold leading-snug">{title}</h1>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-border/40 pb-4">
        {formattedDate && (
          <p className="text-xs text-muted-foreground">
            {formattedDate}
          </p>
        )}
        <BookmarkButton
          variant="outline"
          target={{ kind: "article", articleId: a.id, label: a.title_bn }}
        />
      </div>

      {a.cover_image_url && (
        <img
          src={a.cover_image_url}
          alt={title}
          className="mt-6 w-full rounded-xl object-cover shadow-sm"
          loading="lazy"
        />
      )}

      <div className="prose-reader mt-8 text-base leading-relaxed text-foreground">
        {isHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: content || "" }}
            className="[&_*]:!bg-transparent [&_*]:!text-inherit [&_p]:mb-3 [&_p:empty]:h-4 [&_div]:mb-2 [&_blockquote]:!border-l-4 [&_blockquote]:!border-primary [&_blockquote]:!pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
          />
        ) : (
          <div>
            {(content ?? "").split(/\n{2,}/).map((para, i) => (
              <p key={i} className="mb-4 whitespace-pre-line last:mb-0">
                {para}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border/40 pt-6">
        {authorName && (
          <Link
            to="/articles"
            search={{ q: authorName } as any}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
          >
            <User className="size-3.5 text-primary" />
            <span>{authorName}</span>
          </Link>
        )}

        {categoriesList.map((cat: any) => {
          const catName = lang === "en" && cat.name_en ? cat.name_en : cat.name_bn;
          return (
            <Link
              key={cat.id}
              to="/articles"
              search={{ q: catName } as any}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
            >
              <Folder className="size-3.5 text-primary" />
              <span>{catName}</span>
            </Link>
          );
        })}

        {formattedDate && (
          <Link
            to="/articles"
            search={{ q: dateSearchParam } as any}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
          >
            <Calendar className="size-3.5 text-primary" />
            <span>{formattedDate}</span>
          </Link>
        )}
      </div>

      {a.author_id && (
        <div className="mt-10">
          <AuthorCard authorId={a.author_id} />
        </div>
      )}

      <section className="mt-12 rounded-xl border border-border bg-card/40 p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
          <MessageSquare className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {lang === "bn" ? "মন্তব্য সমূহ" : "Comments"} {comments.length > 0 && `(${comments.length})`}
          </h2>
        </div>

        <form onSubmit={handleCommentSubmit} className="mt-5 space-y-3">
          <div>
            <Input
              type="text"
              placeholder={lang === "bn" ? "আপনার নাম লিখুন *" : "Your Name *"}
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              className="bg-background"
            />
          </div>
          <div>
            <Textarea
              rows={3}
              placeholder={lang === "bn" ? "আপনার মন্তব্য লিখুন... *" : "Write your comment here... *"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-background"
            />
          </div>
          <Button type="submit" size="sm" className="gap-1.5">
            <Send className="size-3.5" />
            {lang === "bn" ? "মন্তব্য প্রকাশ করুন" : "Post Comment"}
          </Button>
        </form>

        <div className="mt-6 space-y-3 divide-y divide-border/30">
          {comments.length === 0 ? (
            <p className="pt-2 text-xs text-muted-foreground">
              {lang === "bn" ? "এখনও কোনো মন্তব্য করা হয়নি। প্রথম মন্তব্যটি আপনিই করুন!" : "No comments yet. Be the first to comment!"}
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}