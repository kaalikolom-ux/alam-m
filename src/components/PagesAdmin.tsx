import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug: lowercase letters, numbers and dashes only"),
  title_bn: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200),
  content_bn: z.string().trim().max(60000),
  content_en: z.string().trim().max(60000),
  meta_description_bn: z.string().trim().max(300),
  meta_description_en: z.string().trim().max(300),
});

const EMPTY = {
  slug: "",
  title_bn: "",
  title_en: "",
  content_bn: "",
  content_en: "",
  meta_description_bn: "",
  meta_description_en: "",
};

export function PagesAdmin() {
  const { t } = usePrefs();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [published, setPublished] = useState(true);
  const [inHeader, setInHeader] = useState(false);
  const [inFooter, setInFooter] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
    queryClient.invalidateQueries({ queryKey: ["page"] });
    queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const payload = {
        slug: parsed.data.slug,
        title_bn: parsed.data.title_bn,
        title_en: parsed.data.title_en || null,
        content_bn: parsed.data.content_bn || null,
        content_en: parsed.data.content_en || null,
        meta_description_bn: parsed.data.meta_description_bn || null,
        meta_description_en: parsed.data.meta_description_en || null,
        published,
      };
      if (editingId) {
        const { error } = await supabase.from("pages").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pages").insert(payload);
        if (error) throw error;
      }

      const href = `/p/${parsed.data.slug}`;
      for (const [location, wanted] of [
        ["header", inHeader],
        ["footer", inFooter],
      ] as const) {
        const { data: existing } = await supabase
          .from("menu_items")
          .select("id")
          .eq("href", href)
          .eq("location", location)
          .maybeSingle();
        if (wanted && !existing) {
          const { error } = await supabase.from("menu_items").insert({
            label_bn: parsed.data.title_bn,
            label_en: parsed.data.title_en || null,
            href,
            location,
            visible: true,
            sort_order: 50,
          });
          if (error) throw error;
        } else if (wanted && existing) {
          await supabase
            .from("menu_items")
            .update({ label_bn: parsed.data.title_bn, label_en: parsed.data.title_en || null })
            .eq("id", existing.id);
        } else if (!wanted && existing) {
          await supabase.from("menu_items").delete().eq("id", existing.id);
        }
      }
    },
    onSuccess: () => {
      invalidate();
      setForm({ ...EMPTY });
      setEditingId(null);
      toast.success(t("saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (page: { id: string; slug: string }) => {
      const { error } = await supabase.from("pages").delete().eq("id", page.id);
      if (error) throw error;
      await supabase.from("menu_items").delete().eq("href", `/p/${page.slug}`);
    },
    onSuccess: invalidate,
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{editingId ? t("edit") : t("newPage")}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{published ? t("published") : t("draft")}</span>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pg-slug">{t("slug")}</Label>
          <Input
            id="pg-slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">/p/{form.slug || "..."}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pg-title-bn">{t("titleBn")}</Label>
            <Input
              id="pg-title-bn"
              value={form.title_bn}
              onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-title-en">{t("titleEn")}</Label>
            <Input
              id="pg-title-en"
              value={form.title_en}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pg-content-bn">{t("contentBn")}</Label>
          <Textarea
            id="pg-content-bn"
            rows={8}
            value={form.content_bn}
            onChange={(e) => setForm({ ...form, content_bn: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pg-content-en">{t("contentEn")}</Label>
          <Textarea
            id="pg-content-en"
            rows={8}
            value={form.content_en}
            onChange={(e) => setForm({ ...form, content_en: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pg-meta-bn">{t("metaDescriptionBn")}</Label>
            <Textarea
              id="pg-meta-bn"
              rows={2}
              value={form.meta_description_bn}
              onChange={(e) => setForm({ ...form, meta_description_bn: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-meta-en">{t("metaDescriptionEn")}</Label>
            <Textarea
              id="pg-meta-en"
              rows={2}
              value={form.meta_description_en}
              onChange={(e) => setForm({ ...form, meta_description_en: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 rounded-md border border-border p-4 text-sm">
          <label className="flex items-center gap-2">
            <Switch checked={inHeader} onCheckedChange={setInHeader} />
            {t("addToHeaderMenu")}
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={inFooter} onCheckedChange={setInFooter} />
            {t("addToFooterMenu")}
          </label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {t("save")}
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
        {list.data?.map((p) => (
          <div key={p.id} className="card-soft flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.title_bn}</p>
              <p className="text-xs text-muted-foreground">
                /p/{p.slug} · {p.published ? t("published") : t("draft")}
              </p>
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="open">
              <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit")}
              onClick={() => {
                setEditingId(p.id);
                setPublished(p.published);
                setForm({
                  slug: p.slug,
                  title_bn: p.title_bn,
                  title_en: p.title_en ?? "",
                  content_bn: p.content_bn ?? "",
                  content_en: p.content_en ?? "",
                  meta_description_bn: p.meta_description_bn ?? "",
                  meta_description_en: p.meta_description_en ?? "",
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
              onClick={() => remove.mutate({ id: p.id, slug: p.slug })}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
