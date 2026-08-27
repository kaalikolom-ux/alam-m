import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "সাইন ইন / সাবস্ক্রাইব — Alam M" },
      {
        name: "description",
        content: "অ্যাকাউন্ট খুলে পছন্দের আর্টিকেল ও লেখা বুকমার্ক করুন।",
      },
      { property: "og:title", content: "সাইন ইন / সাবস্ক্রাইব — Alam M" },
      { property: "og:description", content: "বুকমার্ক করতে অ্যাকাউন্ট খুলুন।" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

function AuthPage() {
  const { t } = usePrefs();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const parsedEmail = z.string().trim().email().max(255).safeParse(email);
        if (!parsedEmail.success) throw new Error(parsedEmail.error.issues[0]?.message ?? t("error"));
        const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
        return;
      }
      const parsed = schema.safeParse({ email, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? t("error"));
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: "/bookmarks" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/bookmarks" });
        else setSent(true);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const heading =
    mode === "in" ? t("signIn") : mode === "up" ? t("createAccount") : t("resetPassword");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="card-soft p-8">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("signInPrompt")}</p>

        {sent ? (
          <p className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            {t("email")}: {email} — please confirm via the link we sent.
          </p>
        ) : resetSent ? (
          <p className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            {t("resetSent")}
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
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
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "in" ? t("signIn") : mode === "up" ? t("createAccount") : t("sendResetLink")}
            </Button>
          </form>
        )}

        {mode === "in" && !resetSent && (
          <button
            className="mt-4 w-full text-sm text-muted-foreground hover:text-primary hover:underline"
            onClick={() => {
              setSent(false);
              setResetSent(false);
              setMode("forgot");
            }}
          >
            {t("forgotPassword")}
          </button>
        )}

        <button
          className="mt-3 w-full text-sm text-primary hover:underline"
          onClick={() => {
            setSent(false);
            setResetSent(false);
            setMode((m) => (m === "in" ? "up" : "in"));
          }}
        >
          {mode === "in" ? t("noAccount") : mode === "up" ? t("haveAccount") : t("backToSignIn")}
        </button>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            {t("home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

