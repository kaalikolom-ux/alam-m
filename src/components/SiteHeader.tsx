import { Link } from "@tanstack/react-router";
import { BookOpen, Bookmark, Languages, LogIn, LogOut, Moon, Shield, Sun, Menu } from "lucide-react";
import { useState } from "react";

import { usePrefs } from "@/lib/prefs";
import { useIsAdmin, useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = usePrefs();
  return (
    <>
      <Link
        to="/"
        onClick={onNavigate}
        activeOptions={{ exact: true }}
        activeProps={{ className: "text-primary" }}
        className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        {t("home")}
      </Link>
      <Link
        to="/articles"
        onClick={onNavigate}
        activeProps={{ className: "text-primary" }}
        className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        {t("articles")}
      </Link>
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
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            {t("siteName")}
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
