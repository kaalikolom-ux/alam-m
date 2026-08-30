import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug: lowercase letters, numbers and dashes only"),
  name_bn: z.string().trim().min(1).max(80),
  name_en: z.string().trim().max(80),
  description_bn: z.string().trim().max(500),
});

const EMPTY = { slug: "", name_bn: "", name_en: "", description_bn: "" };

export function CategoriesAdmin() {
  const { t } = usePrefs();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name_bn");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const payload = {
        ...parsed.data,
        name_en: parsed.data.name_en || null,
        description_bn: parsed.data.description_bn || null,
      };
      if (editingId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm({ ...EMPTY });
      setEditingId(null);
      toast.success(t("saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("delete"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <form
        className="card-soft space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="font-semibold">{editingId ? t("edit") : t("newCategory")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cat-bn">{t("nameBn") || "ক্যাটাগরির নাম (বাংলা)"}</Label>
            <Input
              id="cat-bn"
              value={form.name_bn}
              onChange={(e) => {
                const val = e.target.value;
                const bnToEnMap: Record<string, string> = {
                  "গল্প": "golpo",
                  "কবিতা": "kobita",
                  "স্মৃতিকথা": "smritikotha",
                  "খসড়া": "khosra",
                  "খসড়া": "khosra",
                  "স্ট্যাটাস": "status",
                  "প্রবন্ধ": "probondho",
                  "উপন্যাস": "uponnash",
                  "নাটক": "natok",
                  "গান": "gan",
                };
                const autoSlug = bnToEnMap[val.trim()] || "";
                setForm((prev) => ({
                  ...prev,
                  name_bn: val,
                  slug: !editingId && autoSlug ? autoSlug : prev.slug,
                }));
              }}
              placeholder="যেমন: গল্প, কবিতা..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-en">{t("nameEn") || "ক্যাটাগরির নাম (English)"}</Label>
            <Input
              id="cat-en"
              value={form.name_en}
              onChange={(e) => {
                const val = e.target.value;
                const cleanSlug = val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
                setForm((prev) => ({
                  ...prev,
                  name_en: val,
                  slug: !editingId && cleanSlug ? cleanSlug : prev.slug,
                }));
              }}
              placeholder="e.g. Stories, Poems..."
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-slug">{t("slug") || "স্লাগ (URL Slug)"}</Label>
          <Input
            id="cat-slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            placeholder="golpo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-desc">{t("description")}</Label>
          <Textarea
            id="cat-desc"
            rows={3}
            value={form.description_bn}
            onChange={(e) => setForm({ ...form, description_bn: e.target.value })}
          />
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
              }}
            >
              {t("cancel")}
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {list.data?.length === 0 && <p className="text-sm text-muted-foreground">{t("noCategories")}</p>}
        {list.data?.map((c) => (
          <div key={c.id} className="card-soft flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name_bn}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit")}
              onClick={() => {
                setEditingId(c.id);
                setForm({
                  slug: c.slug,
                  name_bn: c.name_bn,
                  name_en: c.name_en ?? "",
                  description_bn: c.description_bn ?? "",
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => remove.mutate(c.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
