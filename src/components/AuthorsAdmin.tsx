import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = { name_bn: "", name_en: "", image_url: "", bio_bn: "", bio_en: "" };

const authorSchema = z.object({
  name_bn: z.string().trim().min(1).max(160),
  name_en: z.string().trim().max(160),
  image_url: z.string().trim().max(600),
  bio_bn: z.string().trim().max(4000),
  bio_en: z.string().trim().max(4000),
});

export function AuthorsAdmin() {
  const { t } = usePrefs();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-authors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = authorSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const payload = {
        name_bn: parsed.data.name_bn,
        name_en: parsed.data.name_en || null,
        image_url: parsed.data.image_url || null,
        bio_bn: parsed.data.bio_bn || null,
        bio_en: parsed.data.bio_en || null,
      };
      if (editingId) {
        const { error } = await supabase.from("authors").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("authors").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-authors"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      setForm({ ...EMPTY });
      setEditingId(null);
      toast.success(t("saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("authors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-authors"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
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
        <h2 className="font-semibold">{editingId ? t("edit") : t("newAuthor")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="a-name-bn">{t("authorNameBn")}</Label>
            <Input
              id="a-name-bn"
              value={form.name_bn}
              onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-name-en">{t("authorNameEn")}</Label>
            <Input
              id="a-name-en"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-image">{t("authorImage")}</Label>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            {form.image_url ? (
              <img
                src={form.image_url}
                alt={form.name_bn}
                className="size-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <UserRound className="size-6" />
              </span>
            )}
            <Input
              id="a-image"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-bio-bn">{t("authorBioBn")}</Label>
          <Textarea
            id="a-bio-bn"
            rows={4}
            value={form.bio_bn}
            onChange={(e) => setForm({ ...form, bio_bn: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-bio-en">{t("authorBioEn")}</Label>
          <Textarea
            id="a-bio-en"
            rows={4}
            value={form.bio_en}
            onChange={(e) => setForm({ ...form, bio_en: e.target.value })}
          />
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
        {list.data?.map((a) => (
          <div key={a.id} className="card-soft flex items-center gap-3 p-4">
            {a.image_url ? (
              <img src={a.image_url} alt={a.name_bn} className="size-10 rounded-full object-cover" />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <UserRound className="size-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.name_bn}</p>
              <p className="truncate text-xs text-muted-foreground">{a.bio_bn}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit")}
              onClick={() => {
                setEditingId(a.id);
                setForm({
                  name_bn: a.name_bn,
                  name_en: a.name_en ?? "",
                  image_url: a.image_url ?? "",
                  bio_bn: a.bio_bn ?? "",
                  bio_en: a.bio_en ?? "",
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
