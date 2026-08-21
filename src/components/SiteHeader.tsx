import { Link } from "@tanstack/react-router";
import { Bookmark, Languages, LogIn, LogOut, Moon, Shield, Sun, Menu } from "lucide-react";
import { useState, useMemo } from "react";

import { usePrefs } from "@/lib/prefs";
import { useMenu } from "@/lib/menu";
import { useIsAdmin, useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const FALLBACK = [
  { id: "home", label_bn: "হোম", label_en: "Home", url: "/" },
  { id: "story", label_bn: "গল্প", label_en: "Stories", url: "/articles?q=গল্প" },
  { id: "poem", label_bn: "কবিতা", label_en: "Poems", url: "/articles?q=কবিতা" },
  { id: "memory", label_bn: "স্মৃতিকথা", label_en: "Memories", url: "/articles?q=স্মৃতিকথা" },
  { id: "about", label_bn: "আমার পাতা", label_en: "About Me", url: "/about" },
  { id: "contact", label_bn: "যোগাযোগ", label_en: "Contact", url: "/contact" },
];

function sanitizeNavUrl(url: string, labelBn: string): string {
  if (!url) return "/";
  
  // কাস্টম পেইজ, রুট লিংক, এক্সটার্নাল লিংক বা কোয়েরি প্যারামিটার অক্ষত রাখা
  if (
    url.startsWith("/") || 
    url.startsWith("http://") || 
    url.startsWith("https://") ||
    url.startsWith("#")
  ) {
    return url;
  }
  
  // ক্যাটাগরি প্যারামিটার হ্যান্ডলিং
  const cleanParam = labelBn || url;
  return `/articles?q=${encodeURIComponent(cleanParam)}`;
}

function NavLinks({ onNavigate, mobile }: { onNavigate?: () => void; mobile?: boolean }) {
  const { lang } = usePrefs();
  const menu = useMenu("header");

  const items = useMemo(() => {
    const dbItems = menu.data || [];

    // ১. ডাটাবেজ আইটেমস থাকলে সেগুলোকে অগ্রাধিকার দেওয়া এবং মিসিং ফলব্যাকগুলো মার্জ করা
    let combined = [...dbItems];

    if (combined.length === 0) {
      combined = [...FALLBACK];
    } else {
      // যদি ডাটাবেজে হোম না থাকে তবে ফলব্যাক থেকে হোম যুক্ত করা
      const hasHome = combined.some(
        (i) => i.url === "/" || i.label_bn === "হোম" || i.label_en?.toLowerCase() === "home"
      );
      if (!hasHome) {
        combined.unshift(FALLBACK[0]);
      }
    }

    // ২. ফিল্টারিং এবং লিঙ্ক স্যানিটাইজেশন
    const filtered = combined
      .filter((item) => item.label_bn !== "আর্টিকেল" && item.label_en?.toLowerCase() !== "articles")
      .map((item) => ({
        ...item,
        url: sanitizeNavUrl(item.url, item.label_bn),
      }));

    // ৩. 'হোম' সর্বদা প্রথমে রাখা
    const homeItem = filtered.find(
      (item) => item.url === "/" || item.label_bn === "হোম" || item.label_en?.toLowerCase() === "home"
    );
    const otherItems = filtered.filter((item) => item !== homeItem);

    return homeItem ? [homeItem, ...otherItems] : otherItems;
  }, [menu.data]);

  return (
    <>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          onClick={onNavigate}
          className={
            mobile
              ? "flex items-center rounded-lg px-3.5 py-2 text-sm font-medium text-foreground/80 border border-transparent transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 hover:text-primary active:scale-[0.98]"
              : "relative inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-sm font-medium text-foreground/80 border border-transparent transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 hover:text-primary hover:-translate-y-0.5 hover:shadow-sm active:scale-95"
          }
        >
          {lang === "en" && item.label_en ? item.label_en : item.label_bn}
        </a>
      ))}
    </>
  );
}

export function SiteHeader() {
  const { t, lang, toggleLang, dark, setDark } = usePrefs();
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        {/* লোগো ও ট্যাগলাইন */}
        <Link to="/" className="flex flex-col group justify-center py-1">
          <span className="font-logo text-2xl leading-tight text-primary transition-opacity group-hover:opacity-90 sm:text-3xl">
            Alam M
          </span>
          <span className="text-[10px] font-medium tracking-tight text-muted-foreground transition-colors group-hover:text-foreground">
            {lang === "bn" ? "শব্দ আমার ক্যানভাস" : "Worlds Painted with Words"}
          </span>
        </Link>

        {/* হেডার মেনু বাটনসমূহ */}
        <nav className="ml-6 hidden items-center gap-1.5 md:flex">
          <NavLinks />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex size-9 items-center justify-center rounded-md border border-border text-foreground/80 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:border-primary/30"
            aria-label={t("language")}
            title={lang === "bn" ? "বাংলা → English" : "English → বাংলা"}
          >
            <Languages className="size-4" />
          </button>

          <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
            <Sun className="size-3.5 text-muted-foreground" />
            <Switch checked={dark} onCheckedChange={setDark} aria-label={t("darkMode")} />
            <Moon className="size-3.5 text-muted-foreground" />
          </div>

          {user ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Button asChild variant="ghost" size="icon" aria-label={t("bookmarks")} title={t("bookmarks")}>
                <Link to="/bookmarks">
                  <Bookmark className="size-4" />
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost" size="icon" aria-label={t("admin")} title={t("admin")}>
                  <Link to="/admin">
                    <Shield className="size-4" />
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                aria-label={t("signOut")}
                title={t("signOut")}
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Button asChild size="icon" className="hidden sm:inline-flex" aria-label={t("signIn")} title={t("signIn")}>
              <Link to="/auth">
                <LogIn className="size-4" />
              </Link>
            </Button>
          )}

          <button
            className="md:hidden rounded-md border border-border p-1.5 transition-colors hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1.5">
            <NavLinks onNavigate={() => setOpen(false)} mobile />
            <div className="my-2 border-t border-border/50" />
            {user ? (
              <>
                <Link
                  to="/bookmarks"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-accent"
                >
                  {t("bookmarks")}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-accent"
                  >
                    {t("admin")}
                  </Link>
                )}
                <button
                  className="flex items-center rounded-lg px-3.5 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                >
                  {t("signOut")}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="flex items-center rounded-lg px-3.5 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                {t("signIn")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}