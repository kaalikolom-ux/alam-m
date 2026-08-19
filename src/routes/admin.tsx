import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Copy,
  Eye,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Plus,
  Quote,
  Trash2,
  Underline as UnderlineIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AuthorsAdmin } from "@/components/AuthorsAdmin";
import { CategoriesAdmin } from "@/components/admin/CategoriesAdmin";
import { PagesAdmin } from "@/components/admin/PagesAdmin";
import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { MessagesAdmin } from "@/components/admin/MessagesAdmin";
import { FooterAdmin } from "@/components/admin/FooterAdmin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন ড্যাশবোর্ড — Alam M" },
      { name: "description", content: "কনটেন্ট ও প্রকাশনা ব্যবস্থাপনা প্যানেল।" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "অ্যাডমিন ড্যাশবোর্ড — Alam M" },
      { property: "og:description", content: "কনটেন্ট ও প্রকাশনা ব্যবস্থাপনা প্যানেল।" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = usePrefs();
  const { user, loading } = useSession();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("articles");

  if (loading || (user && roleLoading)) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{t("adminOnly")}</p>
        <Button asChild className="mt-4">
          <Link to="/auth">{t("signIn")}</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{t("adminOnly")}</p>
      </div>
    );
  }

  const tabOptions = [
    { value: "articles", label: t("articles") },
    { value: "categories", label: t("categoriesTab") },
    { value: "pages", label: t("pagesTab") },
    { value: "menus", label: t("menusTab") },
    { value: "posts", label: t("postSettings") },
    { value: "footer", label: t("footerTab") },
    { value: "messages", label: t("messagesTab") },
    { value: "subs", label: t("subscribersTab") },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("dashboard")}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <div className="relative w-full max-w-xs">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full appearance-none rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            {tabOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-background text-foreground py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            <ChevronDown className="size-4" />
          </div>
        </div>

        <TabsContent value="articles" className="mt-6">
          <ArticlesAdmin />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoriesAdmin />
        </TabsContent>
        <TabsContent value="pages" className="mt-6">
          <PagesAdmin />
        </TabsContent>
        <TabsContent value="menus" className="mt-6">
          <MenuAdmin />
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("authorsTab")}</p>
            <AuthorsAdmin />
          </div>
        </TabsContent>
        <TabsContent value="footer" className="mt-6">
          <FooterAdmin />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <MessagesAdmin />
        </TabsContent>
        <TabsContent value="subs" className="mt-6">
          <SubscribersAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RichTextEditor({
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
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
            title="বামে সারিবদ্ধ (Left)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyLeft")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignLeft className="size-4" />
          </button>
          <button
            type="button"
            title="মাঝখানে সারিবদ্ধ (Center)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyCenter")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignCenter className="size-4" />
          </button>
          <button
            type="button"
            title="ডানে সারিবদ্ধ (Right)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyRight")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignRight className="size-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          <button
            type="button"
            title="উদ্ধৃতি (Quote)"
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
            rows={10}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="এখানে সরাসরি কাস্টম HTML কোড লিখুন বা পেস্ট করুন..."
            className="w-full rounded-b-lg border-0 bg-background font-mono text-xs text-foreground focus-visible:ring-0 p-3"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={() => {
              if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
              }
            }}
            className="min-h-[220px] p-3 text-sm text-foreground focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          />
        )}
      </div>
    </div>
  );
}

const articleSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug: lowercase letters, numbers and dashes only"),
  title_bn: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200),
  excerpt_bn: z.string().trim().max(500),
  excerpt_en: z.string().trim().max(500),
  content_bn: z.string().trim().max(60000),
  content_en: z.string().trim().max(60000),
  cover_image_url: z.string().trim().max(500),
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
};

function ArticlesAdmin() {
  const { t } = usePrefs();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [published, setPublished] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string>("");
  const [catIds, setCatIds] = useState<string[]>([]);

  const authors = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("authors").select("id, name_bn").order("name_bn");
      if (error) throw error;
      return data;
    },
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name_bn");
      if (error) throw error;
      return data;
    },
  });

  const list = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, article_categories(category_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = articleSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const payload = {
        ...parsed.data,
        title_en: parsed.data.title_en || null,
        excerpt_bn: parsed.data.excerpt_bn || null,
        excerpt_en: parsed.data.excerpt_en || null,
        content_bn: parsed.data.content_bn || null,
        content_en: parsed.data.content_en || null,
        cover_image_url: parsed.data.cover_image_url || null,
        published,
        author_id: authorId || null,
        published_at: published ? new Date().toISOString() : null,
        created_by: user!.id,
      };
      let articleId = editingId;
      if (editingId) {
        const { error } = await supabase.from("articles").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
        if (error) throw error;
        articleId = data.id;
      }
      if (articleId) {
        const { error: delError } = await supabase
          .from("article_categories")
          .delete()
          .eq("article_id", articleId);
        if (delError) throw delError;
        if (catIds.length > 0) {
          const { error: insError } = await supabase
            .from("article_categories")
            .insert(catIds.map((category_id) => ({ article_id: articleId!, category_id })));
          if (insError) throw insError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setForm({ ...EMPTY });
      setEditingId(null);
      setAuthorId("");
      setCatIds([]);
      toast.success(t("saved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // পোস্ট ডুপ্লিকেট করার মিউটেশন
  const duplicate = useMutation({
    mutationFn: async (article: any) => {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newSlug = `${article.slug}-copy-${randomSuffix}`.slice(0, 120);

      const payload = {
        slug: newSlug,
        title_bn: `${article.title_bn} (কপি)`,
        title_en: article.title_en ? `${article.title_en} (Copy)` : null,
        excerpt_bn: article.excerpt_bn || null,
        excerpt_en: article.excerpt_en || null,
        content_bn: article.content_bn || null,
        content_en: article.content_en || null,
        cover_image_url: article.cover_image_url || null,
        published: false, // ডুপ্লিকেট পোস্ট শুরুতে ড্রাফট হিসেবে থাকবে
        author_id: article.author_id || null,
        published_at: null,
        created_by: user!.id,
      };

      const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
      if (error) throw error;

      const newId = data.id;
      const categoriesToAdd = (article.article_categories || []).map((ac: any) => ac.category_id);

      if (categoriesToAdd.length > 0) {
        const { error: catError } = await supabase
          .from("article_categories")
          .insert(categoriesToAdd.map((category_id: string) => ({ article_id: newId, category_id })));
        if (catError) throw catError;
      }

      return { newId, ...payload, catIds: categoriesToAdd };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      
      // ডুপ্লিকেট করা পোস্টটি সরাসরি এডিট ফর্মে লোড করে উপরে স্ক্রল করানো
      setEditingId(data.newId);
      setPublished(false);
      setAuthorId(data.author_id ?? "");
      setCatIds(data.catIds || []);
      setForm({
        slug: data.slug,
        title_bn: data.title_bn,
        title_en: data.title_en ?? "",
        excerpt_bn: data.excerpt_bn ?? "",
        excerpt_en: data.excerpt_en ?? "",
        content_bn: data.content_bn ?? "",
        content_en: data.content_en ?? "",
        cover_image_url: data.cover_image_url ?? "",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("পোস্ট সফলভাবে ডুপ্লিকেট করা হয়েছে!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success(t("delete"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const field = (key: keyof typeof EMPTY, label: string, long = false) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      {long ? (
        <Textarea
          id={key}
          rows={3}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <Input
          id={key}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <form
        className="card-soft space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{editingId ? t("edit") : t("newArticle")}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{published ? t("published") : t("draft")}</span>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>
        </div>
        {field("slug", t("slug"))}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("title_bn", t("titleBn"))}
          {field("title_en", t("titleEn"))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("excerpt_bn", t("excerptBn"), true)}
          {field("excerpt_en", t("excerptEn"), true)}
        </div>

        <RichTextEditor
          label={t("contentBn")}
          value={form.content_bn}
          onChange={(val) => setForm({ ...form, content_bn: val })}
        />
        <RichTextEditor
          label={t("contentEn")}
          value={form.content_en}
          onChange={(val) => setForm({ ...form, content_en: val })}
        />

        {field("cover_image_url", t("coverImage"))}
        <div className="space-y-2">
          <Label htmlFor="author">{t("author")}</Label>
          <select
            id="author"
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t("noAuthor")}</option>
            {authors.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name_bn}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t("categories")}</Label>
          {categories.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("noCategories")}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {categories.data?.map((c) => {
              const active = catIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setCatIds(active ? catIds.filter((id) => id !== c.id) : [...catIds, c.id])
                  }
                  className={
                    active
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary"
                  }
                >
                  {c.name_bn}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            <Plus className="size-4" /> {t("save")}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY });
                setCatIds([]);
              }}
            >
              {t("cancel")}
            </Button>
          )}
        </div>
      </form>

      {/* পোস্ট তালিকা ও অ্যাকশন বাটনসমূহ */}
      <div className="space-y-3">
        {list.data?.map((a) => (
          <div key={a.id} className="card-soft flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.title_bn}</p>
              <p className="text-xs text-muted-foreground">
                /{a.slug} · {a.published ? t("published") : t("draft")}
              </p>
            </div>
            
            {/* ডুপ্লিকেট বাটন */}
            <Button
              variant="ghost"
              size="icon"
              title="ডুপ্লিকেট করুন"
              aria-label="Duplicate"
              disabled={duplicate.isPending}
              onClick={() => duplicate.mutate(a)}
            >
              <Copy className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>

            {/* এডিট বাটন */}
            <Button
              variant="ghost"
              size="icon"
              title={t("edit")}
              aria-label={t("edit")}
              onClick={() => {
                setEditingId(a.id);
                setPublished(a.published);
                setAuthorId(a.author_id ?? "");
                setCatIds((a.article_categories ?? []).map((ac: any) => ac.category_id));
                setForm({
                  slug: a.slug,
                  title_bn: a.title_bn,
                  title_en: a.title_en ?? "",
                  excerpt_bn: a.excerpt_bn ?? "",
                  excerpt_en: a.excerpt_en ?? "",
                  content_bn: a.content_bn ?? "",
                  content_en: a.content_en ?? "",
                  cover_image_url: a.cover_image_url ?? "",
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Pencil className="size-4" />
            </Button>

            {/* ডিলিট বাটন */}
            <Button
              variant="ghost"
              size="icon"
              title={t("delete")}
              aria-label={t("delete")}
              onClick={() => remove.mutate(a.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscribersAdmin() {
  const { t } = usePrefs();
  const list = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="card-soft divide-y divide-border p-2">
      {list.data?.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">{t("noArticles")}</p>
      )}
      {list.data?.map((s) => (
        <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <span>{s.email}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(s.created_at).toLocaleDateString("en-GB")}
          </span>
        </div>
      ))}
    </div>
  );
}