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
  const { t, lang } = usePrefs();
  const { user, loading } = useSession();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("articles");
  const [importPlatform, setImportPlatform] = useState("");

  if (loading || (user && roleLoading)) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{t("adminOnly")}</p>
        {!user && (
          <Button asChild className="mt-4">
            <Link to="/auth">{t("signIn")}</Link>
          </Button>
        )}
      </div>
    );
  }

  const tabOptions = [
    { value: "articles", label: t("articles") },
    { value: "categories", label: t("categoriesTab") },
    { value: "pages", label: t("pagesTab") },
    { value: "menus", label: t("menusTab") },
    { value: "authors", label: lang === "bn" ? "লেখক/Author" : "Authors" },
    { value: "footer", label: t("footerTab") },
    { value: "messages", label: t("messagesTab") },
    { value: "subs", label: t("subscribersTab") },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("dashboard")}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <div className="flex w-full flex-row items-end justify-between gap-3 md:gap-4">
          <div className="w-1/2 md:w-64">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "bn" ? "সাধারণ / General" : "General"}
            </label>
            <div className="relative">
              <select
                value={activeTab !== "import" ? activeTab : ""}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setImportPlatform("");
                }}
                className="w-full cursor-pointer appearance-none rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {activeTab === "import" && (
                  <option value="" disabled className="hidden">
                    {lang === "bn" ? "অন্যান্য..." : "Other..."}
                  </option>
                )}
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
          </div>

          <div className="w-1/2 md:w-64">
            <label className="mb-1.5 block text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-left">
              {lang === "bn" ? "পোষ্ট ইমপোর্ট / Post Import" : "Post Import"}
            </label>
            <div className="relative">
              <select
                value={importPlatform}
                onChange={(e) => {
                  const val = e.target.value;
                  setImportPlatform(val);
                  if (val) setActiveTab("import");
                }}
                className="w-full cursor-pointer appearance-none rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{lang === "bn" ? "নির্বাচন করুন..." : "Select..."}</option>
                <option value="wordpress">ওয়ার্ডপ্রেস / WordPress</option>
                <option value="blogger">ব্লগার / Blogger</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <ChevronDown className="size-4" />
              </div>
            </div>
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
        <TabsContent value="authors" className="mt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang === "bn" ? "পোস্টের লেখক বা Author যুক্ত ও এডিট করুন।" : "Manage Post Authors."}
            </p>
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

        <TabsContent value="import" className="mt-6">
          <ImportAdmin platform={importPlatform} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImportAdmin({ platform, user }: { platform: string; user: any }) {
  const { lang } = usePrefs();
  const queryClient = useQueryClient();
  const [authorId, setAuthorId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const authors = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("authors").select("id, name_bn").order("name_bn");
      if (error) throw error;
      return data;
    },
  });

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !authorId) {
      toast.error(lang === "bn" ? "ফাইল এবং লেখক নির্বাচন করা আবশ্যক!" : "File and Author are required!");
      return;
    }

    setIsImporting(true);
    try {
      const { data: draftCat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "draft")
        .maybeSingle();

      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const payloads: any[] = [];

      if (platform === "wordpress") {
        const items = Array.from(xmlDoc.querySelectorAll("item"));
        items.forEach((item) => {
          const postType = item.getElementsByTagNameNS("*", "post_type")[0]?.textContent;
          const status = item.getElementsByTagNameNS("*", "status")[0]?.textContent;

          if (postType === "post" && status === "publish") {
            const title = item.querySelector("title")?.textContent || "Untitled";
            const contentNodes = item.getElementsByTagName("content:encoded");
            const content = contentNodes.length > 0 
              ? contentNodes[0].textContent 
              : (item.querySelector("description")?.textContent || "");

            payloads.push({
              title_bn: title,
              content_bn: content || " ",
              slug: `import-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              published: true,
              author_id: authorId,
              created_by: user.id
            });
          }
        });
      } else if (platform === "blogger") {
        const entries = Array.from(xmlDoc.querySelectorAll("entry"));
        entries.forEach((entry) => {
          const isPost = Array.from(entry.querySelectorAll("category")).some((c) => c.getAttribute("term")?.includes("kind#post"));
          if (isPost) {
            const title = entry.querySelector("title")?.textContent || "Untitled";
            const content = entry.querySelector("content")?.textContent || "";

            payloads.push({
              title_bn: title,
              content_bn: content || " ",
              slug: `import-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              published: true,
              author_id: authorId,
              created_by: user.id
            });
          }
        });
      }

      if (payloads.length > 0) {
        const { data: insertedArticles, error } = await supabase
          .from("articles")
          .insert(payloads)
          .select("id");

        if (error) throw error;

        if (draftCat && insertedArticles && insertedArticles.length > 0) {
          const catMappings = insertedArticles.map((art) => ({
            article_id: art.id,
            category_id: draftCat.id,
          }));
          await supabase.from("article_categories").insert(catMappings);
        }

        toast.success(
          lang === "bn"
            ? `সফলভাবে ${payloads.length} টি পোস্ট 'খসড়া' ক্যাটাগরিতে ইমপোর্ট হয়েছে!`
            : `Successfully imported ${payloads.length} posts into 'Draft' category!`
        );
        queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
        queryClient.invalidateQueries({ queryKey: ["articles"] });
        setFile(null);
      } else {
        toast.error(lang === "bn" ? "কোনো ভ্যালিড পোস্ট পাওয়া যায়নি।" : "No valid posts found in the file.");
      }
    } catch (err: any) {
      toast.error(lang === "bn" ? "ইমপোর্ট ফেইল হয়েছে: " + err.message : "Import failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!platform) return null;

  return (
    <form onSubmit={handleImport} className="card-soft space-y-6 p-6 md:p-8">
      <div>
        <h2 className="text-xl font-semibold text-primary">
          {platform === "wordpress" ? "ওয়ার্ডপ্রেস (WordPress) থেকে ইমপোর্ট" : "ব্লগার (Blogger) থেকে ইমপোর্ট"}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          আপনার {platform === "wordpress" ? "WordPress WXR (.xml)" : "Blogger Atom (.xml)"} ফাইল আপলোড করুন। সকল পোস্ট স্বয়ংক্রিয়ভাবে <strong>খসড়া (Draft)</strong> ক্যাটাগরিতে জমা হবে যা ভিজিটররা দেখতে পাবে না।
        </p>
      </div>

      <div className="space-y-2 max-w-md">
        <Label>লেখক নির্বাচন করুন (Author) *</Label>
        <select
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        >
          <option value="">নির্বাচন করুন...</option>
          {authors.data?.map((a) => (
            <option key={a.id} value={a.id}>{a.name_bn}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 max-w-md">
        <Label>XML ফাইল আপলোড করুন *</Label>
        <Input
          type="file"
          accept=".xml"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
          className="cursor-pointer bg-background"
        />
      </div>

      <Button type="submit" disabled={isImporting} size="lg" className="w-full sm:w-auto mt-2">
        {isImporting ? (lang === "bn" ? "ইমপোর্ট হচ্ছে..." : "Importing...") : (lang === "bn" ? "ইমপোর্ট শুরু করুন" : "Start Import")}
      </Button>
    </form>
  );
}

function RichTextEditor({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void; }) {
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
    document.execCommand("insertText", false, text);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium" onClick={() => setIsHtmlMode(!isHtmlMode)}>
          {isHtmlMode ? <><Eye className="size-3.5" /> সাধারণ ভিউ</> : <><Code className="size-3.5" /> HTML কোড ভিউ</>}
        </Button>
      </div>

      <div className="rounded-lg border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1.5">
          <button type="button" title="বোল্ড" disabled={isHtmlMode} onClick={() => executeCommand("bold")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <Bold className="size-4" />
          </button>
          <button type="button" title="ইটালিক" disabled={isHtmlMode} onClick={() => executeCommand("italic")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <Italic className="size-4" />
          </button>
          <button type="button" title="আন্ডারলাইন" disabled={isHtmlMode} onClick={() => executeCommand("underline")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <UnderlineIcon className="size-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-border" />
          <button type="button" title="বামে সারিবদ্ধ (Left)" disabled={isHtmlMode} onClick={() => executeCommand("justifyLeft")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <AlignLeft className="size-4" />
          </button>
          <button type="button" title="মাঝখানে সারিবদ্ধ (Center)" disabled={isHtmlMode} onClick={() => executeCommand("justifyCenter")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <AlignCenter className="size-4" />
          </button>
          <button type="button" title="ডানে সারিবদ্ধ (Right)" disabled={isHtmlMode} onClick={() => executeCommand("justifyRight")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <AlignRight className="size-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-border" />
          <button type="button" title="উদ্ধৃতি (Quote)" disabled={isHtmlMode} onClick={() => executeCommand("formatBlock", "blockquote")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <Quote className="size-4" />
          </button>
          <button type="button" title="বুলেট লিস্ট" disabled={isHtmlMode} onClick={() => executeCommand("insertUnorderedList")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <List className="size-4" />
          </button>
          <button type="button" title="নাম্বার লিস্ট" disabled={isHtmlMode} onClick={() => executeCommand("insertOrderedList")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
            <ListOrdered className="size-4" />
          </button>
        </div>

        {isHtmlMode ? (
          <Textarea rows={10} value={value} onChange={(e) => onChange(e.target.value)} placeholder="এখানে সরাসরি কাস্টম HTML কোড লিখুন বা পেস্ট করুন..." className="w-full rounded-b-lg border-0 bg-background font-mono text-xs text-foreground focus-visible:ring-0 p-3" />
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
            className="min-h-[220px] p-3 text-sm text-foreground focus:outline-none [&_*]:!bg-transparent [&_*]:!text-inherit [&_span]:!bg-transparent [&_p]:!bg-transparent [&_div]:!bg-transparent [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          />
        )}
      </div>
    </div>
  );
}

const articleSchema = z.object({
  slug: z.string().trim().min(1, "Slug is required").max(120),
  title_bn: z.string().trim().min(1, "Title is required").max(200),
  title_en: z.string().trim().max(200).optional().or(z.literal("")),
  excerpt_bn: z.string().trim().max(500).optional().or(z.literal("")),
  excerpt_en: z.string().trim().max(500).optional().or(z.literal("")),
  content_bn: z.string().trim().min(1, "বাংলা মূল বিষয়বস্তু খালি রাখা যাবে না").max(60000),
  content_en: z.string().trim().max(60000).optional().or(z.literal("")),
  cover_image_url: z.string().trim().max(500).optional().or(z.literal("")),
});

const EMPTY = {
  slug: "", title_bn: "", title_en: "", excerpt_bn: "", excerpt_en: "", content_bn: "", content_en: "", cover_image_url: "",
};

function ArticlesAdmin() {
  const { t, lang } = usePrefs();
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
        .select("*, article_categories(category_id, categories(id, name_bn, slug))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = articleSchema.safeParse(form);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      }
      
      const payload = {
        slug: parsed.data.slug,
        title_bn: parsed.data.title_bn,
        title_en: parsed.data.title_en || null,
        excerpt_bn: parsed.data.excerpt_bn || null,
        excerpt_en: parsed.data.excerpt_en || null,
        content_bn: parsed.data.content_bn, // নিশ্চিত করা হলো যাতে null না যায়
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
        const { error: delError } = await supabase.from("article_categories").delete().eq("article_id", articleId);
        if (delError) throw delError;
        if (catIds.length > 0) {
          const { error: insError } = await supabase.from("article_categories").insert(catIds.map((category_id) => ({ article_id: articleId!, category_id })));
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
        content_bn: article.content_bn || " ",
        content_en: article.content_en || null,
        cover_image_url: article.cover_image_url || null,
        published: true,
        author_id: article.author_id || null,
        published_at: new Date().toISOString(),
        created_by: user!.id,
      };

      const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
      if (error) throw error;
      const newId = data.id;
      const categoriesToAdd = (article.article_categories || []).map((ac: any) => ac.category_id);
      if (categoriesToAdd.length > 0) {
        const { error: catError } = await supabase.from("article_categories").insert(categoriesToAdd.map((category_id: string) => ({ article_id: newId, category_id })));
        if (catError) throw catError;
      }
      return { newId, ...payload, catIds: categoriesToAdd };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setEditingId(data.newId);
      setPublished(true);
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
      toast.success(lang === "bn" ? "পোস্ট সফলভাবে ডুপ্লিকেট করা হয়েছে!" : "Post duplicated successfully!");
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
        <Textarea id={key} rows={3} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      ) : (
        <Input id={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <form className="card-soft space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
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

        <RichTextEditor label={t("contentBn")} value={form.content_bn} onChange={(val) => setForm({ ...form, content_bn: val })} />
        <RichTextEditor label={t("contentEn")} value={form.content_en} onChange={(val) => setForm({ ...form, content_en: val })} />

        {field("cover_image_url", t("coverImage"))}
        <div className="space-y-2">
          <Label htmlFor="author">{t("author")}</Label>
          <select id="author" value={authorId} onChange={(e) => setAuthorId(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{t("noAuthor")}</option>
            {authors.data?.map((a) => <option key={a.id} value={a.id}>{a.name_bn}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t("categories")}</Label>
          {categories.data?.length === 0 && <p className="text-xs text-muted-foreground">{t("noCategories")}</p>}
          <div className="flex flex-wrap gap-2">
            {categories.data?.map((c) => {
              const active = catIds.includes(c.id);
              const isDraftCategory = c.slug === "draft";
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatIds(active ? catIds.filter((id) => id !== c.id) : [...catIds, c.id])}
                  className={
                    active
                      ? isDraftCategory 
                        ? "rounded-full border border-amber-500 bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                        : "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary"
                  }
                >
                  {isDraftCategory ? `⚠️ ${c.name_bn} (গোপন)` : c.name_bn}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}><Plus className="size-4" /> {t("save")}</Button>
          {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ ...EMPTY }); setCatIds([]); }}>{t("cancel")}</Button>}
        </div>
      </form>

      <div className="space-y-3">
        {list.data?.map((a) => {
          const isDraft = (a.article_categories || []).some((ac: any) => ac.categories?.slug === "draft");
          return (
            <div key={a.id} className={`card-soft flex items-center gap-3 p-4 ${isDraft ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{a.title_bn}</p>
                  {isDraft && (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      খসড়া / গোপন
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  /{a.slug} · {a.published ? t("published") : t("draft")}
                </p>
              </div>
              
              <Button variant="ghost" size="icon" title="ডুপ্লিকেট করুন" onClick={() => duplicate.mutate(a)}>
                <Copy className="size-4 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" title={t("edit")} onClick={() => {
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
                    cover_image_url: a.cover_image_url ?? ""
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" title={t("delete")} onClick={() => remove.mutate(a.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubscribersAdmin() {
  const { t } = usePrefs();
  const list = useQuery({ queryKey: ["admin-subscribers"], queryFn: async () => { const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  return (
    <div className="card-soft divide-y divide-border p-2">
      {list.data?.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("noArticles")}</p>}
      {list.data?.map((s) => (
        <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <span>{s.email}</span>
          <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("en-GB")}</span>
        </div>
      ))}
    </div>
  );
}