import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Lock, Mail, ShieldCheck, Sparkles, ArrowRight, Loader2, KeyRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession, useIsAdmin, setCachedSession, isSuperAdminEmail } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "সাইন ইন / অ্যাডমিন লগইন — Alam M" },
      {
        name: "description",
        content: "অ্যাকাউন্টে সাইন ইন করে অ্যাডমিন ড্যাশবোর্ড বা বুকমার্ক অ্যাক্সেস করুন।",
      },
      { property: "og:title", content: "সাইন ইন / অ্যাডমিন লগইন — Alam M" },
      { property: "og:description", content: "অ্যাডমিন প্যানেল ও কনটেন্ট পরিচালনা।" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("সঠিক ইমেইল ঠিকানা দিন").max(255),
  password: z.string().min(6, "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে").max(72),
});

function AuthPage() {
  const { t } = usePrefs();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();

  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const destination = search.redirect || "/admin";

  // Auto-redirect if already authenticated as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate({ to: destination });
    }
  }, [user, isAdmin, destination, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "forgot") {
        const parsedEmail = z.string().trim().email().max(255).safeParse(email);
        if (!parsedEmail.success) {
          throw new Error("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success("পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।");
        return;
      }

      const parsed = schema.safeParse({ email, password });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "সঠিক ইমেইল ও পাসওয়ার্ড প্রদান করুন");
      }

      if (mode === "in") {
        const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;

        if (data.session) {
          setCachedSession(data.session);
        }
        toast.success("স্বাগতম! লগইন সফল হয়েছে।");
        navigate({ to: destination });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        if (data.session) {
          setCachedSession(data.session);
          toast.success("অ্যাকাউন্ট সফলভাবে প্রস্তুত হয়েছে!");
          navigate({ to: destination });
        } else {
          setSent(true);
          toast.success("অ্যাকাউন্ট নিশ্চিত করার লিংক আপনার ইমেইলে পাঠানো হয়েছে।");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error((error as Error).message || "লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  const quickFillAdmin = (adminEmail: string) => {
    setEmail(adminEmail);
    if (!password) {
      setPassword("admin123456");
    }
  };

  const isCurrentSuper = isSuperAdminEmail(email);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/25 dark:border-amber-500/20 bg-card/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="size-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md">
            <Lock className="size-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            {mode === "in"
              ? "অ্যাকাউন্টে সাইন ইন করুন"
              : mode === "up"
              ? "নতুন অ্যাকাউন্ট তৈরি করুন"
              : "পাসওয়ার্ড পুনরুদ্ধার"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === "in"
              ? "অ্যাডমিন ড্যাশবোর্ড ও সংরক্ষিত কন্টেন্ট পরিচালনা করতে প্রবেশ করুন"
              : mode === "up"
              ? "আপনার ইমেইল দিয়ে সহজে একটি নতুন অ্যাকাউন্ট খুলুন"
              : "আপনার নিবন্ধিত ইমেইলে রিসেট লিংক পাঠানো হবে"}
          </p>
        </div>

        {/* Quick Admin Email Fill Suggestions */}
        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5">
            <ShieldCheck className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span>অ্যাডমিন কুইক সিলেক্ট (Quick Fill):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => quickFillAdmin("md.khorshed.alam@gmail.com")}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-background border border-amber-500/30 text-foreground hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer shadow-2xs"
            >
              ⚡ md.khorshed.alam@gmail.com
            </button>
            <button
              type="button"
              onClick={() => quickFillAdmin("notabene.inc@gmail.com")}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-background border border-amber-500/30 text-foreground hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer shadow-2xs"
            >
              ⚡ notabene.inc@gmail.com
            </button>
          </div>
        </div>

        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-semibold mb-1">ইমেইল যাচাইকরণ লিংক পাঠানো হয়েছে!</p>
            <p><strong>{email}</strong> ঠিকানায় পাঠানো লিংকে ক্লিক করে অ্যাকাউন্ট নিশ্চিত করুন।</p>
          </div>
        ) : resetSent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-semibold mb-1">পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!</p>
            <p>আপনার ইনবক্স চেক করে নতুন পাসওয়ার্ড সেট করুন।</p>
          </div>
        ) : (
          <form
            toolname="user_authentication"
            tooldescription="Sign in or register an account on Alam M literary blog."
            className="space-y-4"
            onSubmit={submit}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" />
                <span>ইমেইল ঠিকানা (Email)</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="আপনার ইমেইল লিখুন"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm bg-background/50 border-input focus:border-amber-500"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-muted-foreground" />
                    <span>পাসওয়ার্ড (Password)</span>
                  </Label>
                  {mode === "in" && (
                    <button
                      type="button"
                      tabIndex={-1}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      onClick={() => setMode("forgot")}
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={72}
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  placeholder="অন্তত ৬ অক্ষরের পাসওয়ার্ড"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-sm bg-background/50 border-input focus:border-amber-500"
                />
              </div>
            )}

            {isCurrentSuper && (
              <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 px-1">
                <Sparkles className="size-3 text-amber-500 shrink-0 animate-pulse" />
                <span>সুপার অ্যাডমিন ইমেইল শনাক্ত হয়েছে (পূর্ণ অ্যাডমিন অ্যাক্সেস প্রদান করা হবে)</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md cursor-pointer transition-all"
              disabled={busy}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>প্রসেসিং হচ্ছে...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>
                    {mode === "in"
                      ? "লগইন করুন (Log In)"
                      : mode === "up"
                      ? "অ্যাকাউন্ট তৈরি করুন (Sign Up)"
                      : "রিসেট লিংক পাঠান"}
                  </span>
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>
        )}

        {/* Bottom Switcher */}
        <div className="mt-6 pt-4 border-t border-border/60 text-center space-y-2 text-xs">
          {mode === "forgot" ? (
            <button
              type="button"
              className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium"
              onClick={() => {
                setResetSent(false);
                setMode("in");
              }}
            >
              ← সাইন ইন পেজে ফিরে যান
            </button>
          ) : (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={() => {
                setSent(false);
                setResetSent(false);
                setMode((m) => (m === "in" ? "up" : "in"));
              }}
            >
              {mode === "in" ? (
                <span>
                  নতুন একাউন্ট খুলতে চান?{" "}
                  <strong className="text-amber-600 dark:text-amber-400 underline">নিবন্ধন করুন (Sign Up)</strong>
                </span>
              ) : (
                <span>
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                  <strong className="text-amber-600 dark:text-amber-400 underline">সাইন ইন করুন (Log In)</strong>
                </span>
              )}
            </button>
          )}

          <div>
            <Link to="/" className="text-[11px] text-muted-foreground/75 hover:text-foreground">
              হোমপেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
