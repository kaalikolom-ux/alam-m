import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  label_bn: z.string().trim().min(1, "বাংলা লেবেল আবশ্যক").max(80),
  label_en: z.string().trim().max(80).optional().default(""),
  url: z.string().trim().min(1, "লিংক (URL) আবশ্যক").max(300),
  location: z.enum(["header", "footer"]),
  sort_order: z.number().int().min(0).max(999),
});

type FormState = {
  label_bn: string;
  label_en: string;
  url: string;
  location: "header" | "footer";
  sort_order: number;
};

const EMPTY: FormState = {
  label_bn: "",
  label_en: "",
  url: "",
  location: "header",
  sort_order: 0,
};

export function MenuAdmin() {
  const { t } = usePrefs();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [visible, setVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("location")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        ...form,
        sort_order: Number(form.sort_order),
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      }

      const payload = {
        label_bn: parsed.data.label_bn,
        label_en: parsed.data.label_en || null,
        url: parsed.data.url,
        location: parsed.data.location,
        sort_order: parsed.data.sort_order,
        visible,
      };

      if (editingId) {
        const { error } = await supabase
          .from("menu_items")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      setForm({ ...EMPTY });
      setEditingId(null);
      setVisible(true);
      toast.success(t("saved") || "সফলভাবে সংরক্ষিত হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success(t("delete") || "মুছে ফেলা হয়েছে");
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {editingId ? (t("edit") || "সম্পাদনা") : (t("newMenuItem") || "নতুন মেন্যু আইটেম")}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {visible ? (t("visible") || "দৃশ্যমান") : (t("hidden") || "লুকায়িত")}
            </span>
            <Switch checked={visible} onCheckedChange={setVisible} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="menu-label-bn">{t("labelBn") || "লেবেল (বাংলা)"}</Label>
            <Input
              id="menu-label-bn"
              required
              value={form.label_bn}
              onChange={(e) => setForm({ ...form, label_bn: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-label-en">{t("labelEn") || "লেবেল (ইংরেজি)"}</Label>
            <Input
              id="menu-label-en"
              value={form.label_en}
              onChange={(e) => setForm({ ...form, label_en: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-url">{t("linkUrl") || "লিংক (URL)"}</Label>
          <Input
            id="menu-url"
            required
            placeholder="/about"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="menu-location">{t("menuLocation") || "অবস্থান"}</Label>
            <select
              id="menu-location"
              value={form.location}
              onChange={(e) =>
                setForm({
                  ...form,
                  location: e.target.value as "header" | "footer",
                })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="header">{t("header") || "হেডার"}</option>
              <option value="footer">{t("footer") || "ফুটার"}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-order">{t("sortOrder") || "ক্রম"}</Label>
            <Input
              id="menu-order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {editingId ? (
              <>
                <Check className="size-4" /> {t("update") || "আপডেট করুন"}
              </>
            ) : (
              <>
                <Plus className="size-4" /> {t("save") || "সংরক্ষণ"}
              </>
            )}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY });
                setVisible(true);
              }}
            >
              {t("cancel") || "বাতিল"}
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {list.data?.map((m) => (
          <div key={m.id} className="card-soft flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.label_bn}</p>
              <p className="text-xs text-muted-foreground">
                {m.url} · {m.location === "footer" ? (t("footer") || "ফুটার") : (t("header") || "হেডার")} · #{m.sort_order} ·{" "}
                {m.visible ? (t("visible") || "দৃশ্যমান") : (t("hidden") || "লুকায়িত")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit") || "Edit"}
              onClick={() => {
                setEditingId(m.id);
                setVisible(m.visible);
                setForm({
                  label_bn: m.label_bn,
                  label_en: m.label_en ?? "",
                  url: m.url,
                  location: (m.location as "header" | "footer") || "header",
                  sort_order: m.sort_order,
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("delete") || "Delete"}
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