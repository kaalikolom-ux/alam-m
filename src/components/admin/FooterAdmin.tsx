import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { translate } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const EMPTY = {
  footer_about_bn: "",
  footer_about_en: "",
  footer_copyright_bn: "",
  footer_copyright_en: "",
};

export function FooterAdmin() {
  const { lang } = usePrefs();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });

  const settings = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings.data) {
      setForm({
        footer_about_bn: settings.data.footer_about_bn ?? "",
        footer_about_en: settings.data.footer_about_en ?? "",
        footer_copyright_bn: settings.data.footer_copyright_bn ?? "",
        footer_copyright_en: settings.data.footer_copyright_en ?? "",
      });
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ id: "main", ...form });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(translate(lang, "saved"));
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label>{translate(lang, "footerAboutBn")}</Label>
        <Textarea
          rows={3}
          value={form.footer_about_bn}
          onChange={(e) => setForm({ ...form, footer_about_bn: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{translate(lang, "footerAboutEn")}</Label>
        <Textarea
          rows={3}
          value={form.footer_about_en}
          onChange={(e) => setForm({ ...form, footer_about_en: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{translate(lang, "footerCopyrightBn")}</Label>
        <Input
          value={form.footer_copyright_bn}
          onChange={(e) => setForm({ ...form, footer_copyright_bn: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{translate(lang, "footerCopyrightEn")}</Label>
        <Input
          value={form.footer_copyright_en}
          onChange={(e) => setForm({ ...form, footer_copyright_en: e.target.value })}
        />
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {translate(lang, "save")}
      </Button>
    </div>
  );
}