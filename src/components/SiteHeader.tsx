import { Link } from "@tanstack/react-router";
import { Bookmark, Languages, LogIn, LogOut, Moon, Shield, Sun, Menu } from "lucide-react";
import { useState } from "react";

import { usePrefs } from "@/lib/prefs";
import { useMenu } from "@/lib/menu";
import { useIsAdmin, useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const FALLBACK = [
  { id: "home", label_bn: "হোম", label_en: "Home", url: "/" },
  { id: "articles", label_bn: "আর্টিকেল", label_en: "Articles", url: "/articles" },
  { id: "about", label_bn: "আমার পাতা", label_en: "About Me", url: "/about" },
  { id: "contact", label_bn: "যোগাযোগ", label_en: "Contact", url: "/contact" },
];

function NavLinks({ onNavigate, mobile }: { onNavigate?: () => void; mobile?: boolean }) {
  const { lang } = usePrefs();
  const menu = useMenu("header");
  const items = menu.data && menu.data.length > 0 ? menu.data : FALLBACK;

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.url as "/"}
          onClick={onNavigate}
          activeOptions={{ exact: item.url === "/" }}
          activeProps={{ className: "text-primary" }}
          className={
            mobile
              ? "text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              : "text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          }
        >
          {lang === "en" && item.label_en ? item.label_en : item.label_bn}
        </Link>
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
        {/* লোগো ও ট্যাগলাইন সেকশন */}
        <Link to="/" className="flex flex-col group justify-center py-1">
          <span className="font-logo text-2xl leading-tight text-primary transition-opacity group-hover:opacity-90 sm:text-3xl">
            Alam M
          </span>
          <span className="text-[10px] font-medium tracking-tight text-muted-foreground transition-colors group-hover:text-foreground">
            {lang === "bn" ? "শব্দ আমার ক্যানভাস" : "Worlds Painted with Words"}
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 md:flex">
          <NavLinks />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex size-9 items-center justify-center rounded-md border border-border text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
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
            className="md:hidden rounded-md border border-border p-1.5"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLinks onNavigate={() => setOpen(false)} />
            {user ? (
              <>
                <Link to="/bookmarks" onClick={() => setOpen(false)} className="text-sm font-medium">
                  {t("bookmarks")}
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="text-sm font-medium">
                    {t("admin")}
                  </Link>
                )}
                <button
                  className="text-left text-sm font-medium text-destructive"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                >
                  {t("signOut")}
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="text-sm font-medium text-primary">
                {t("signIn")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}