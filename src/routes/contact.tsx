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
import {
  AntiSpamCaptcha,
  generateMathCaptcha,
  convertBengaliToEnglishDigits,
  type MathCaptcha,
} from "@/components/AntiSpamCaptcha";

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
  name: z.string().trim().min(1, "নাম লিখুন").max(100),
  email: z.string().trim().email("সঠিক ইমেইল ঠিকানা দিন").max(200),
  subject: z.string().trim().max(200),
  message: z.string().trim().min(1, "বার্তা লিখুন").max(4000),
});

function ContactPage() {
  const { t, lang } = usePrefs();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [captchaProblem, setCaptchaProblem] = useState<MathCaptcha>(() => generateMathCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const refreshCaptcha = () => {
    setCaptchaProblem(generateMathCaptcha());
    setCaptchaAnswer("");
  };

  const send = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

      // Verify Anti-Spam Captcha
      const normalizedAnswer = convertBengaliToEnglishDigits(captchaAnswer.trim());
      if (!normalizedAnswer) {
        throw new Error(lang === "bn" ? "দয়া করে স্প্যাম সুরক্ষা প্রশ্নের উত্তর দিন।" : "Please answer the anti-spam question.");
      }
      if (parseInt(normalizedAnswer, 10) !== captchaProblem.answer) {
        refreshCaptcha();
        throw new Error(lang === "bn" ? "স্প্যাম সুরক্ষা প্রশ্নের সঠিক উত্তর দিন।" : "Incorrect anti-spam answer.");
      }

      const { error } = await supabase.from("contact_messages").insert({
        ...parsed.data,
        subject: parsed.data.subject || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", email: "", subject: "", message: "" });
      refreshCaptcha();
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

        <AntiSpamCaptcha
          value={captchaAnswer}
          onChange={setCaptchaAnswer}
          onRefresh={refreshCaptcha}
          currentProblem={captchaProblem}
          lang={lang}
        />

        <Button type="submit" disabled={send.isPending} className="w-full sm:w-auto">
          <Send className="size-4" /> {t("sendMessage")}
        </Button>
      </form>
    </div>
  );
}
