import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "পাসওয়ার্ড রিসেট — Alam M" },
      {
        name: "description",
        content: "নতুন পাসওয়ার্ড দিয়ে আপনার Alam M অ্যাকাউন্টে আবার প্রবেশ করুন।",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "পাসওয়ার্ড রিসেট — Alam M" },
      { property: "og:description", content: "নতুন পাসওয়ার্ড সেট করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z.object({ password: z.string().min(6).max(72) });

function ResetPasswordPage() {
  const { t } = usePrefs();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("error"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("error"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("passwordUpdated"));
      navigate({ to: "/bookmarks" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="card-soft p-8">
        <h1 className="text-2xl font-semibold">{t("resetPassword")}</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("newPassword")}</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {t("updatePassword")}
            </Button>
          </form>
        )}
        <div className="mt-6 text-center">
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary">
            {t("backToSignIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
