import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageBody } from "@/components/PageBody";
import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "যোগাযোগ — Alam M" },
      {
        name: "description",
        content: "লেখক আলমের সাথে যোগাযোগ করুন — প্রশ্ন, মতামত বা কাজের প্রস্তাব পাঠান।",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "যোগাযোগ — Alam M" },
      { property: "og:description", content: "প্রশ্ন, মতামত বা কাজের প্রস্তাব পাঠান।" },
      { property: "og:image", content: "https://a.wooniche.com/og-image.png" },
      { property: "og:image:secure_url", content: "https://a.wooniche.com/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://a.wooniche.com/og-image.png" },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200),
  message: z.string().trim().min(1).max(4000),
});

function ContactPage() {
  const { t } = usePrefs();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const send = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const { error } = await supabase.from("contact_messages").insert({
        ...parsed.data,
        subject: parsed.data.subject || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success(t("messageSent"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="pb-16">
      <PageBody slug="contact" fallbackTitle={t("contact")} />
      <form
        className="card-soft mx-auto w-full max-w-3xl space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-name">{t("yourName")}</Label>
            <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">{t("email")}</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-subject">{t("subject")}</Label>
          <Input
            id="c-subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-message">{t("message")}</Label>
          <Textarea
            id="c-message"
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={send.isPending} className="w-full sm:w-auto">
          <Send className="size-4" /> {t("sendMessage")}
        </Button>
      </form>
    </div>
  );
}
