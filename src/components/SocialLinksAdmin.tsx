import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { SOCIAL_PLATFORMS, socialIconFor } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  platform: z.string().trim().min(1).max(40),
  label: z.string().trim().max(80),
  url: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .regex(/^(https?:\/\/|mailto:)/, "link must start with https:// or mailto:"),
  sort_order: z.coerce.number().int().min(0).max(999),
});

const EMPTY = { platform: "facebook", label: "", url: "", sort_order: "0" };

export function SocialLinksAdmin() {
  const { t } = usePrefs();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [visible, setVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-social-links"] });
    queryClient.invalidateQueries({ queryKey: ["social-links"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const payload = {
        platform: parsed.data.platform.toLowerCase(),
        label: parsed.data.label || null,
        url: parsed.data.url,
        sort_order: parsed.data.sort_order,
        visible,
      };
      if (editingId) {
        const { error } = await supabase.from("social_links").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("social_links").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setForm({ ...EMPTY });
      setEditingId(null);
      setVisible(true);
      toast.success(t("saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_links").delete().eq("id", id);
      if (error) throw error;
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
          <h2 className="font-semibold">{editingId ? t("edit") : t("newSocialLink")}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("visible")}</span>
            <Switch checked={visible} onCheckedChange={setVisible} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sl-platform">{t("platform")}</Label>
            <select
              id="sl-platform"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sl-label">{t("labelOptional")}</Label>
            <Input
              id="sl-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sl-url">{t("link")}</Label>
          <Input
            id="sl-url"
            placeholder="https://facebook.com/yourpage"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sl-order">{t("sortOrder")}</Label>
          <Input
            id="sl-order"
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
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
        {list.data?.map((s) => {
          const Icon = socialIconFor(s.platform);
          return (
            <div key={s.id} className="card-soft flex items-center gap-3 p-4">
              <Icon className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.label || s.platform}</p>
                <p className="truncate text-xs text-muted-foreground">{s.url}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("edit")}
                onClick={() => {
                  setEditingId(s.id);
                  setVisible(s.visible);
                  setForm({
                    platform: s.platform,
                    label: s.label ?? "",
                    url: s.url,
                    sort_order: String(s.sort_order),
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
                onClick={() => remove.mutate(s.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
