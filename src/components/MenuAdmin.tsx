import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { useCategories } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  label_bn: z.string().trim().min(1).max(80),
  label_en: z.string().trim().max(80),
  href: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^\/[A-Za-z0-9\-/_?=&.]*$/, "link must be an internal path starting with /"),
  location: z.enum(["header", "footer"]),
  sort_order: z.coerce.number().int().min(0).max(999),
});

const EMPTY = { label_bn: "", label_en: "", href: "/", sort_order: "0" };

export function MenuAdmin() {
  const { t, lang } = usePrefs();
  const queryClient = useQueryClient();
  const categories = useCategories();
  const [form, setForm] = useState({ ...EMPTY });
  const [location, setLocation] = useState<"header" | "footer">("header");
  const [visible, setVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("location")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
    queryClient.invalidateQueries({ queryKey: ["menu-items"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ ...form, location });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const payload = {
        label_bn: parsed.data.label_bn,
        label_en: parsed.data.label_en || null,
        href: parsed.data.href,
        location: parsed.data.location,
        sort_order: parsed.data.sort_order,
        visible,
      };
      if (editingId) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setForm({ ...EMPTY });
      setEditingId(null);
      toast.success(t("saved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
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
        <h2 className="font-semibold">{editingId ? t("edit") : t("newMenuItem")}</h2>

        {(categories.data?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.data?.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    label_bn: c.name_bn,
                    label_en: c.name_en ?? "",
                    href: `/articles?category=${c.slug}`,
                  })
                }
              >
                + {lang === "en" && c.name_en ? c.name_en : c.name_bn}
              </Button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="menu-bn">{t("menuLabelBn")}</Label>
            <Input
              id="menu-bn"
              value={form.label_bn}
              onChange={(e) => setForm({ ...form, label_bn: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-en">{t("menuLabelEn")}</Label>
            <Input
              id="menu-en"
              value={form.label_en}
              onChange={(e) => setForm({ ...form, label_en: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-href">{t("menuLink")}</Label>
            <Input
              id="menu-href"
              value={form.href}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-loc">{t("menuLocation")}</Label>
            <select
              id="menu-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value as "header" | "footer")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="header">{t("headerMenu")}</option>
              <option value="footer">{t("footerMenu")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-order">{t("sortOrder")}</Label>
            <Input
              id="menu-order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 pt-6 text-sm">
            <Switch id="menu-visible" checked={visible} onCheckedChange={setVisible} />
            <Label htmlFor="menu-visible">{t("visible")}</Label>
          </div>
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
        {list.data?.map((m) => (
          <div key={m.id} className="card-soft flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.label_bn}</p>
              <p className="truncate text-xs text-muted-foreground">
                {m.href} · {m.location === "header" ? t("headerMenu") : t("footerMenu")}
                {m.visible ? "" : " · —"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit")}
              onClick={() => {
                setEditingId(m.id);
                setLocation(m.location === "footer" ? "footer" : "header");
                setVisible(m.visible);
                setForm({
                  label_bn: m.label_bn,
                  label_en: m.label_en ?? "",
                  href: m.href,
                  sort_order: String(m.sort_order),
                });
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("delete")}
              onClick={() => remove.mutate(m.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
