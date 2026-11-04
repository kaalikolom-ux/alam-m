import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ShieldCheck, Mail, Send, Key, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  site_key: z.string().trim().max(200),
  secret_key: z.string().trim().max(300),
  to_email: z.string().trim().email().max(255),
  newsletter_email: z.string().trim().email().max(255),
  from_email: z.string().trim().max(255),
  sender_domain: z.string().trim().max(255),
  resend_api_key: z.string().trim().max(255).optional().default(""),
  newsletter_from: z.string().trim().max(255).optional().default(""),
  auto_send_on_publish: z.boolean().optional().default(true),
});

export function TurnstileAdmin() {
  const { t } = usePrefs();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [form, setForm] = useState({
    site_key: "",
    secret_key: "",
    to_email: "contact+notabene.inc@gmail.com",
    newsletter_email: "newslater+notabene.inc@gmail.com",
    from_email: "",
    sender_domain: "",
    resend_api_key: "",
    newsletter_from: "Quran Explore <onboarding@resend.dev>",
    auto_send_on_publish: true,
  });

  const settings = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/settings?all=1");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch {}
      return [];
    },
  });

  // Query subscriber count
  const subscribersCountQuery = useQuery({
    queryKey: ["admin-newsletter-count"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/public/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "count" }),
        });
        const json = await res.json().catch(() => ({}));
        return json?.count ?? 0;
      } catch {
        return 0;
      }
    },
  });

  useEffect(() => {
    if (!settings.data) return;
    const get = (key: string) =>
      (settings.data.find((s) => s.key === key)?.value ?? {}) as Record<string, unknown>;
    const ts = get("turnstile");
    const sec = get("turnstile_secret");
    const contact = get("contact");
    const newsletter = get("newsletter_settings");

    setEnabled(Boolean(ts["enabled"]));
    setAutoSend(newsletter["auto_send_on_publish"] !== false);
    setForm({
      site_key: String(ts["site_key"] ?? ""),
      secret_key: String(sec["secret_key"] ?? ""),
      to_email: String(contact["to_email"] ?? "contact+notabene.inc@gmail.com"),
      newsletter_email: String(newsletter["to_email"] ?? "newslater+notabene.inc@gmail.com"),
      from_email: String(contact["from_email"] ?? ""),
      sender_domain: String(contact["sender_domain"] ?? ""),
      resend_api_key: String(newsletter["resend_api_key"] ?? ""),
      newsletter_from: String(newsletter["from_email"] ?? "Quran Explore <onboarding@resend.dev>"),
      auto_send_on_publish: newsletter["auto_send_on_publish"] !== false,
    });
    if (!testEmailAddress) {
      setTestEmailAddress(String(newsletter["to_email"] ?? "newslater+notabene.inc@gmail.com"));
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ ...form, auto_send_on_publish: autoSend });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const rows = [
        {
          key: "turnstile",
          value: { site_key: parsed.data.site_key, enabled },
          is_public: true,
        },
        {
          key: "turnstile_secret",
          value: { secret_key: parsed.data.secret_key },
          is_public: false,
        },
        {
          key: "contact",
          value: {
            to_email: parsed.data.to_email,
            from_email: parsed.data.from_email,
            sender_domain: parsed.data.sender_domain,
          },
          is_public: false,
        },
        {
          key: "newsletter_settings",
          value: {
            to_email: parsed.data.newsletter_email,
            resend_api_key: parsed.data.resend_api_key,
            from_email: parsed.data.newsletter_from,
            auto_send_on_publish: autoSend,
          },
          is_public: false,
        },
      ];
      const res = await fetch("/api/public/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) throw new Error("সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["turnstile-config"] });
      toast.success("সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast.error("সঠিক টেস্ট ইমেইল ঠিকানা দিন");
      return;
    }

    if (!form.resend_api_key.trim()) {
      toast.error("অনুগ্রহ করে প্রথমে Resend API Key লিখুন এবং সংরক্ষণ করুন");
      return;
    }

    setIsSendingTest(true);
    toast.loading("টেস্ট নোটিফিকেশন ইমেইল পাঠানো হচ্ছে...", { id: "test-email-send" });

    try {
      const sampleArticle = {
        title_bn: "আল্লাহ কি তাঁর সৃষ্টির কসম করেন?",
        title_en: "Does Allah Swear by His Creation?",
        slug: "does-allah-swear-by-his-creation",
        excerpt_bn: "কুরআনের কিছু আয়াতের প্রচলিত অনুবাদ পড়লে মনে হয় আল্লাহ তাঁর নিজের সৃষ্টির বিভিন্ন বস্তুর কসম করেছেন। কিন্তু আরবি লা উকসিমু এর প্রকৃত তাৎপর্য কী?",
        authorName: "আলম এম",
        tags: ["কুরআনিক", "গবেষণা"],
      };

      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          api_key: form.resend_api_key.trim(),
          from_email: form.newsletter_from.trim(),
          target_email: testEmailAddress.trim().toLowerCase(),
          article: sampleArticle,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        toast.success(`টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে (${testEmailAddress})!`, { id: "test-email-send" });
      } else {
        const errorMsg = json.error || json.message || "ইমেইল পাঠাতে ব্যর্থ হয়েছে";
        toast.error(`ব্যর্থ: ${errorMsg}`, { id: "test-email-send" });
      }
    } catch (err: any) {
      toast.error(`নেটওয়ার্ক ত্রুটি: ${err.message}`, { id: "test-email-send" });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <form
      className="card-soft space-y-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      {/* 1. Turnstile Security */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h2 className="font-semibold">{t("turnstileTab")} স্প্যাম সুরক্ষা</h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{enabled ? t("on") : t("off")}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("turnstileHint")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ts-site">{t("turnstileSiteKey")}</Label>
            <Input
              id="ts-site"
              value={form.site_key}
              onChange={(e) => setForm({ ...form, site_key: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ts-secret">{t("turnstileSecretKey")}</Label>
            <Input
              id="ts-secret"
              type="password"
              value={form.secret_key}
              onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 2. Newsletter & Email Broadcast Delivery (Resend API) */}
      <div className="space-y-4 border-t border-border/60 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="font-semibold text-foreground">নিউজলেটার ও নতুন প্রবন্ধ ইমেইল ব্রডকাস্ট</h2>
              <p className="text-xs text-muted-foreground">নতুন কোনো আর্টিক্যাল প্রকাশিত হলে গ্রাহকদের স্বয়ংক্রিয় নোটিফিকেশন পাঠান</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium">
            <Users className="size-3.5" />
            <span>সক্রিয় গ্রাহক: {subscribersCountQuery.data ?? 0} জন</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Resend API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="resend-key" className="flex items-center gap-1.5 font-medium text-xs">
                <Key className="size-3.5 text-primary" /> Resend API Key
              </Label>
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                বিনামূল্যে কি নিন (resend.com) ↗
              </a>
            </div>
            <Input
              id="resend-key"
              type="password"
              placeholder="re_123456789..."
              value={form.resend_api_key}
              onChange={(e) => setForm({ ...form, resend_api_key: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Resend-এ বিনামূল্যে প্রতি মাসে ৩,০০০ ইমেইল পাঠানো যায়।
            </p>
          </div>

          {/* From Sender Address */}
          <div className="space-y-2">
            <Label htmlFor="news-from" className="font-medium text-xs">
              প্রেরক ইমেইল (From Address)
            </Label>
            <Input
              id="news-from"
              placeholder="Quran Explore <onboarding@resend.dev>"
              value={form.newsletter_from}
              onChange={(e) => setForm({ ...form, newsletter_from: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              ডিফল্ট: <code className="text-primary font-mono">Quran Explore &lt;onboarding@resend.dev&gt;</code> বা ডোমেইন ভেরিফাই করা থাকলে <code className="text-primary font-mono">newsletter@quraan.bd</code>
            </p>
          </div>
        </div>

        {/* Auto Send Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3.5">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold cursor-pointer">
              নতুন প্রবন্ধ প্রকাশের সাথে সাথে স্বয়ংক্রিয়ভাবে নোটিফিকেশন পাঠানো
            </Label>
            <p className="text-[11px] text-muted-foreground">
              অ্যাডমিন ড্যাশবোর্ড থেকে নতুন কোনো আর্টিকেল পাবলিশ করলে সকল নিউজলেটার গ্রাহকদের ইমেইল চলে যাবে
            </p>
          </div>
          <Switch checked={autoSend} onCheckedChange={setAutoSend} />
        </div>

        {/* Test Email Box */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              টেস্ট নোটিফিকেশন ইমেইল পাঠান
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="আপনার টেস্ট ইমেইল ঠিকানা লিখুন..."
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              className="text-xs h-8 bg-background flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSendingTest || !form.resend_api_key}
              onClick={handleSendTestEmail}
              className="h-8 text-xs font-medium border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
            >
              {isSendingTest ? "পাঠানো হচ্ছে..." : "টেস্ট পাঠান"}
            </Button>
          </div>
          {!form.resend_api_key && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠️ টেস্ট পাঠানোর পূর্বে উপরে আপনার Resend API Key লিখে সংরক্ষণ করুন।
            </p>
          )}
        </div>
      </div>

      {/* 3. Notification Routing Emails */}
      <div className="space-y-4 border-t border-border/60 pt-5">
        <h2 className="font-semibold text-foreground text-sm">অভ্যন্তরীণ নোটিফিকেশন রিসিভ ঠিকানা</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ts-contact" className="flex items-center gap-1.5 font-medium text-xs">
              <Mail className="size-3.5 text-primary" /> কন্টাক্ট ফর্ম রিসিভ ইমেইল
            </Label>
            <Input
              id="ts-contact"
              type="email"
              value={form.to_email}
              onChange={(e) => setForm({ ...form, to_email: e.target.value })}
              placeholder="contact+notabene.inc@gmail.com"
            />
            <p className="text-[11px] text-muted-foreground">যোগাযোগ ফর্মের বার্তা এই ঠিকানায় আসবে</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ts-news" className="flex items-center gap-1.5 font-medium text-xs">
              <Send className="size-3.5 text-primary" /> নিউজলেটার রিসিভ/কপি ইমেইল
            </Label>
            <Input
              id="ts-news"
              type="email"
              value={form.newsletter_email}
              onChange={(e) => setForm({ ...form, newsletter_email: e.target.value })}
              placeholder="newslater+notabene.inc@gmail.com"
            />
            <p className="text-[11px] text-muted-foreground">নতুন গ্রাহক যোগ হলে বা ব্রডকাস্ট হলে এই ঠিকানায় কপি যাবে</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 border-t border-border/50 flex justify-end">
        <Button type="submit" disabled={save.isPending} className="cursor-pointer">
          {save.isPending ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন (Save Settings)"}
        </Button>
      </div>
    </form>
  );
}