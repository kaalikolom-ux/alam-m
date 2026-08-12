import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthorsAdmin } from "@/components/AuthorsAdmin";
import { CategoriesAdmin } from "@/components/admin/CategoriesAdmin";
import { PagesAdmin } from "@/components/admin/PagesAdmin";
import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { MessagesAdmin } from "@/components/admin/MessagesAdmin";
import { FooterAdmin } from "@/components/admin/FooterAdmin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন ড্যাশবোর্ড — কুরআন অন্বেষা" },
      { name: "description", content: "আর্টিকেল ও বিজ্ঞানভিত্তিক অনুবাদ ইনপুট দেওয়ার প্যানেল।" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "অ্যাডমিন ড্যাশবোর্ড — কুরআন অন্বেষা" },
      { property: "og:description", content: "কনটেন্ট ব্যবস্থাপনা প্যানেল।" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = usePrefs();
  const { user, loading } = useSession();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("dashboard")}</h1>
      <Tabs defaultValue="articles" className="mt-8">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="articles">{t("articles")}</TabsTrigger>
          <TabsTrigger value="categories">{t("categoriesTab")}</TabsTrigger>
          <TabsTrigger value="pages">{t("pagesTab")}</TabsTrigger>
          <TabsTrigger value="menus">{t("menusTab")}</TabsTrigger>
          <TabsTrigger value="posts">{t("postSettings")}</TabsTrigger>
          <TabsTrigger value="footer">{t("footerTab")}</TabsTrigger>
          <TabsTrigger value="messages">{t("messagesTab")}</TabsTrigger>
          <TabsTrigger value="subs">{t("subscribersTab")}</TabsTrigger>
        </TabsList>
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
          rows={key.startsWith("content") ? 8 : 3}
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
        {field("content_bn", t("contentBn"), true)}
        {field("content_en", t("contentEn"), true)}
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

      <div className="space-y-3">
        {list.data?.map((a) => (
          <div key={a.id} className="card-soft flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.title_bn}</p>
              <p className="text-xs text-muted-foreground">
                /{a.slug} · {a.published ? t("published") : t("draft")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit")}
              onClick={() => {
                setEditingId(a.id);
                setPublished(a.published);
                setAuthorId(a.author_id ?? "");
                setCatIds((a.article_categories ?? []).map((ac) => ac.category_id));
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
            <Button
              variant="ghost"
              size="icon"
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
