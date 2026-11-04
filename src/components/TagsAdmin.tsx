import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Tag as TagIcon, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATIC_ARTICLES_META } from "@/lib/staticArticlesMeta";
import { generateTagSlug } from "@/lib/tagHelper";

export function slugifyTag(val: string): string {
  return generateTagSlug(val);
}

const tagSchema = z.object({
  name_bn: z.string().trim().min(1, "ট্যাগের বাংলা নাম বাধ্যতামূলক").max(80),
  name_en: z.string().trim().max(80).optional(),
  slug: z.string().trim().min(1, "স্লাগ বাধ্যতামূলক").max(120),
});

const EMPTY_TAG = {
  name_bn: "",
  name_en: "",
  slug: "",
};

export function TagsAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_TAG });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const tagsQuery = useQuery({
    queryKey: ["admin-tags-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name_bn", { ascending: true });
      if (error) return [];
      return data || [];
    },
  });

  // আর্টিকেলসমূহ থেকে ট্যাগ ব্যবহারের সংখ্যা ফেচ
  const articleTagsQuery = useQuery({
    queryKey: ["admin-article-tags-usage"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("tags");
      const counts: Record<string, number> = {};

      const processTags = (tagList: any) => {
        if (!Array.isArray(tagList)) return;
        tagList.forEach((t: string) => {
          if (!t) return;
          const clean = String(t).trim().replace(/^#/, "");
          if (clean) {
            counts[clean] = (counts[clean] || 0) + 1;
          }
        });
      };

      if (data) {
        data.forEach((row: any) => processTags(row.tags));
      }
      STATIC_ARTICLES_META.forEach((meta) => processTags(meta.tags));

      return counts;
    },
  });

  const tagCounts = articleTagsQuery.data || {};

  // বিদ্যমান আর্টিকেল থেকে ট্যাগ সিঙ্ক (সবগুলো একসাথে ব্যাচ আকারে)
  const handleSyncFromArticles = async () => {
    setIsSyncing(true);
    try {
      const existingDbTags = tagsQuery.data || [];
      const existingNames = new Set(
        existingDbTags.map((t: any) => (t.name_bn || "").toLowerCase().trim())
      );
      const existingSlugs = new Set(
        existingDbTags.map((t: any) => (t.slug || "").toLowerCase().trim())
      );

      const toInsert: { name_bn: string; name_en: string | null; slug: string }[] = [];
      const seenInArticles = new Set<string>();

      // সর্বাধিক ব্যবহৃত ট্যাগগুলোকে অগ্রাধিকার দিয়ে সাজানো
      const sortedTagNames = Object.keys(tagCounts).sort(
        (a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0)
      );

      sortedTagNames.forEach((tagName) => {
        const clean = tagName.trim();
        const lower = clean.toLowerCase();
        if (!existingNames.has(lower) && !seenInArticles.has(lower)) {
          seenInArticles.add(lower);
          const slug = generateTagSlug(clean, existingSlugs);
          existingSlugs.add(slug);
          toInsert.push({
            name_bn: clean,
            name_en: null,
            slug,
          });
        }
      });

      if (toInsert.length === 0) {
        toast.info("সবগুলো ট্যাগ ইতিমধ্যে ডাটাবেজে উপস্থিত রয়েছে।");
        setIsSyncing(false);
        return;
      }

      // বড় পে-লোড বা টাইমআউট এড়াতে ৫০টি করে ব্যাচ আকারে ইনসার্ট
      const chunkSize = 50;
      let insertedCount = 0;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from("tags").upsert(chunk, { onConflict: "slug" });
        if (error) {
          console.warn("Upsert error, trying plain insert:", error);
          const { error: insertErr } = await supabase.from("tags").insert(chunk);
          if (insertErr) {
            console.error("Batch insert error:", insertErr);
          }
        }
        insertedCount += chunk.length;
      }

      toast.success(`সবগুলো (${insertedCount}টি) ট্যাগ সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!`);
      queryClient.invalidateQueries({ queryKey: ["admin-tags-list"] });
    } catch (err: any) {
      toast.error(err.message || "সিঙ্ক ব্যর্থ হয়েছে");
    } finally {
      setIsSyncing(false);
    }
  };

  const saveTag = useMutation({
    mutationFn: async () => {
      let slug = form.slug.trim();
      if (!slug) {
        slug = slugifyTag(form.name_en || form.name_bn);
      }

      const parsed = tagSchema.safeParse({
        name_bn: form.name_bn,
        name_en: form.name_en || undefined,
        slug,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message);
      }

      const payload = {
        name_bn: parsed.data.name_bn,
        name_en: parsed.data.name_en || null,
        slug: parsed.data.slug,
      };

      if (editingId) {
        const { error } = await supabase.from("tags").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tags").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tags-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-article-tags-usage"] });
      setForm({ ...EMPTY_TAG });
      setEditingId(null);
      toast.success(editingId ? "ট্যাগ সফলভাবে আপডেট হয়েছে" : "নতুন ট্যাগ যুক্ত হয়েছে");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tags-list"] });
      toast.success("ট্যাগ মুছে ফেলা হয়েছে");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const combinedTags = useMemo(() => {
    const dbTags = tagsQuery.data || [];
    const list = [...dbTags];
    const dbTagNames = new Set(dbTags.map((t: any) => (t.name_bn || "").toLowerCase().trim()));
    const existingSlugs = new Set(dbTags.map((t: any) => (t.slug || "").toLowerCase().trim()));

    // Sort by usage count descending
    const sortedEntries = Object.entries(tagCounts).sort(
      (a, b) => (b[1] || 0) - (a[1] || 0)
    );

    sortedEntries.forEach(([name]) => {
      if (!dbTagNames.has(name.toLowerCase())) {
        const slug = generateTagSlug(name, existingSlugs);
        existingSlugs.add(slug);
        list.push({
          id: `virtual-${name}`,
          name_bn: name,
          name_en: null,
          slug,
          isVirtual: true,
        } as any);
      }
    });

    return list;
  }, [tagsQuery.data, tagCounts]);

  const virtualCount = useMemo(
    () => combinedTags.filter((t: any) => t.isVirtual).length,
    [combinedTags]
  );

  const filteredTags = useMemo(() => {
    if (!searchFilter.trim()) return combinedTags;
    const q = searchFilter.toLowerCase().trim();
    return combinedTags.filter((t: any) =>
      t.name_bn?.toLowerCase().includes(q) ||
      t.name_en?.toLowerCase().includes(q) ||
      t.slug?.toLowerCase().includes(q)
    );
  }, [combinedTags, searchFilter]);

  return (
    <div className="space-y-6">
      {/* ট্যাগ তৈরি বা সম্পাদনা ফর্ম */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveTag.mutate();
        }}
        className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <TagIcon className="size-4 text-primary" />
            {editingId ? "ট্যাগ সম্পাদনা করুন" : "নতুন ট্যাগ তৈরি করুন"}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncFromArticles}
            disabled={isSyncing}
            className="text-xs h-8 gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            title="সবগুলো আর্টিকেল স্ক্যান করে বিদ্যমান ট্যাগসমূহ স্বয়ংক্রিয়ভাবে ডাটাবেজে নিয়ে আসুন"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
            <span>আর্টিকেল থেকে ট্যাগ সিঙ্ক</span>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name-bn" className="text-xs font-semibold">
              ট্যাগের নাম (বাংলা) *
            </Label>
            <Input
              id="tag-name-bn"
              value={form.name_bn}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name_bn: val,
                  slug: editingId ? prev.slug : slugifyTag(prev.name_en || val),
                }));
              }}
              placeholder="যেমন: বিজ্ঞান"
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tag-name-en" className="text-xs font-semibold">
              ট্যাগের নাম (English)
            </Label>
            <Input
              id="tag-name-en"
              value={form.name_en}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name_en: val,
                  slug: editingId ? prev.slug : slugifyTag(val || prev.name_bn),
                }));
              }}
              placeholder="e.g. Science"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tag-slug" className="text-xs font-semibold">
            স্লাগ (URL Slug) *
          </Label>
          <Input
            id="tag-slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().trim() })}
            placeholder="যেমন: science"
            required
            className="h-9 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="submit"
            disabled={saveTag.isPending}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs cursor-pointer h-9 px-4"
          >
            <Plus className="size-3.5 mr-1" />
            {editingId ? "আপডেট করুন" : "ট্যাগ সংরক্ষণ করুন"}
          </Button>

          {editingId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY_TAG });
              }}
              className="text-xs cursor-pointer h-9"
            >
              বাতিল
            </Button>
          )}
        </div>
      </form>

      {/* ট্যাগ তালিকা ও অনুসন্ধান */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>সকল ট্যাগ তালিকা ({combinedTags.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ট্যাগ খুঁজুন..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 h-8 text-xs bg-card"
            />
          </div>
        </div>

        {/* যদি ভার্চুয়াল ট্যাগ থাকে, তবে একসাথে সিঙ্ক করার নোটিশ ও বাটন */}
        {virtualCount > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-primary/30 bg-primary/5 text-xs">
            <div className="flex items-center gap-2.5">
              <TagIcon className="size-4 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  আর্টিকেলসমূহ থেকে {virtualCount}টি ট্যাগ ডাটাবেজে সিঙ্ক করার জন্য প্রস্তুত
                </p>
                <p className="text-[11px] text-muted-foreground">
                  আর্টিকেল পড়ার জন্য এটি বাধ্যতামূলক নয়। তবে ডাটাবেজে রাখতে চাইলে একটা একটা না করে ১ ক্লিকেই সবগুলো সিঙ্ক করতে পারেন।
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleSyncFromArticles}
              disabled={isSyncing}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-3 shrink-0 gap-1.5 cursor-pointer font-medium"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>সবগুলো একসাথে ডাটাবেজে রাখুন ({virtualCount})</span>
            </Button>
          </div>
        )}

        <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {filteredTags.length === 0 ? (
            <p className="p-6 text-xs text-muted-foreground text-center">কোনো ট্যাগ পাওয়া যায়নি।</p>
          ) : (
            filteredTags.map((tag: any) => {
              const usageCount = tagCounts[tag.name_bn] || 0;
              const isVirtual = Boolean(tag.isVirtual);

              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <TagIcon className="size-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        #{tag.name_bn}
                      </span>
                      {tag.name_en && (
                        <span className="text-muted-foreground font-normal text-[11px]">
                          ({tag.name_en})
                        </span>
                      )}
                      {usageCount > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                          {usageCount}টি আর্টিকেলে ব্যবহৃত
                        </span>
                      )}
                      {isVirtual && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                          আর্টিকেলে পাওয়া গেছে
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono pl-5 flex items-center gap-1.5">
                      <span>URL:</span>
                      <a
                        href={`/articles?tag=${tag.slug || slugifyTag(tag.name_bn)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline hover:text-primary/80 transition-colors"
                      >
                        /articles?tag={tag.slug || slugifyTag(tag.name_bn)}
                      </a>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {isVirtual ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 cursor-pointer"
                        onClick={async () => {
                          const { error } = await supabase.from("tags").insert({
                            name_bn: tag.name_bn,
                            name_en: null,
                            slug: tag.slug || slugifyTag(tag.name_bn),
                          });
                          if (error) {
                            toast.error(error.message);
                          } else {
                            toast.success(`'${tag.name_bn}' ট্যাগটি ডাটাবেজে যুক্ত হয়েছে`);
                            queryClient.invalidateQueries({ queryKey: ["admin-tags-list"] });
                          }
                        }}
                      >
                        <Plus className="size-3" /> ডাটাবেজে রাখুন
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer"
                          title="সম্পাদনা করুন"
                          onClick={() => {
                            setEditingId(tag.id);
                            setForm({
                              name_bn: tag.name_bn,
                              name_en: tag.name_en || "",
                              slug: tag.slug,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="মুছে ফেলুন"
                          onClick={() => deleteTag.mutate(tag.id)}
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
  );
}