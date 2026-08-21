import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { translate } from "@/lib/i18n";
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
  const { lang } = usePrefs();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [visible, setVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

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
        const { error } = await supabase.from("menu_items").insert(payload);
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
      toast.success(translate(lang, "saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success(translate(lang, "delete"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, currentVisible }: { id: string; currentVisible: boolean }) => {
      const { error } = await supabase
        .from("menu_items")
        .update({ visible: !currentVisible })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success(lang === "bn" ? "মেনুর দৃশ্যমানতা পরিবর্তিত হয়েছে" : "Menu visibility updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDrop = async (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId || !list.data) return;

    const items = [...list.data];
    const fromIndex = items.findIndex((item) => item.id === draggedItemId);
    const toIndex = items.findIndex((item) => item.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);

    const updates = items.map((item, index) => ({
      id: item.id,
      label_bn: item.label_bn,
      label_en: item.label_en,
      url: item.url,
      location: item.location,
      visible: item.visible,
      sort_order: index + 1,
    }));

    const { error } = await supabase.from("menu_items").upsert(updates);
    if (error) {
      toast.error(lang === "bn" ? "ক্রম সংরক্ষণ করা যায়নি" : "Could not save order");
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success(lang === "bn" ? "মেনুর ক্রম পরিবর্তিত হয়েছে" : "Menu order updated");
    }

    setDraggedItemId(null);
  };

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
            {editingId ? translate(lang, "edit") : translate(lang, "newMenuItem")}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {visible ? translate(lang, "visible") : translate(lang, "hidden")}
            </span>
            <Switch checked={visible} onCheckedChange={setVisible} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="menu-label-bn">{translate(lang, "labelBn")}</Label>
            <Input
              id="menu-label-bn"
              required
              value={form.label_bn}
              onChange={(e) => setForm({ ...form, label_bn: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-label-en">{translate(lang, "labelEn")}</Label>
            <Input
              id="menu-label-en"
              value={form.label_en}
              onChange={(e) => setForm({ ...form, label_en: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-url">{translate(lang, "linkUrl")}</Label>
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
            <Label htmlFor="menu-location">{translate(lang, "menuLocation")}</Label>
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
              <option value="header">{translate(lang, "header")}</option>
              <option value="footer">{translate(lang, "footer")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-order">{translate(lang, "sortOrder")}</Label>
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
                <Check className="size-4 mr-1" /> {lang === "bn" ? "আপডেট করুন" : "Update"}
              </>
            ) : (
              <>
                <Plus className="size-4 mr-1" /> {translate(lang, "save")}
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
              {translate(lang, "cancel")}
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {lang === "bn" 
            ? "* ড্র্যাগ আইকন ধরে টেনে আগে-পিছে নিন অথবা সরাসরি স্যুইচ দিয়ে প্রকাশ/লুকিয়ে রাখুন।"
            : "* Drag items to reorder or use the switch to publish/unpublish."}
        </p>

        {list.data?.map((m) => (
          <div
            key={m.id}
            draggable
            onDragStart={() => setDraggedItemId(m.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(m.id)}
            className={`card-soft flex items-center gap-3 p-4 transition-all duration-200 ${
              draggedItemId === m.id ? "opacity-40 border-dashed border-primary" : ""
            } ${!m.visible ? "opacity-60 bg-muted/20" : ""}`}
          >
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <GripVertical className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`truncate text-sm font-medium ${!m.visible ? "line-through text-muted-foreground" : ""}`}>
                  {m.label_bn}
                </p>
                {m.label_en && (
                  <span className="text-xs text-muted-foreground">({m.label_en})</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {m.url} · {m.location === "footer" ? translate(lang, "footer") : translate(lang, "header")} · #{m.sort_order}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Switch
                checked={m.visible}
                onCheckedChange={() =>
                  toggleVisibility.mutate({ id: m.id, currentVisible: m.visible })
                }
                title={m.visible ? "লুকিয়ে রাখুন" : "প্রকাশ করুন"}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label={translate(lang, "edit")}
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
              aria-label={translate(lang, "delete")}
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