import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bookmark,
  Languages,
  LogOut,
  Moon,
  Search,
  Shield,
  Sun,
  User,
  Menu,
  X,
} from "lucide-react";

import { usePrefs } from "@/lib/prefs";
import { useSession, useIsAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";

export function SiteHeader() {
  const { theme, toggleTheme, lang, toggleLang, t } = usePrefs();
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navLinks = [
    { to: "/", label: lang === "bn" ? "হোম" : "Home" },
    { to: "/articles", label: lang === "bn" ? "স্মৃতিকথা" : "Memories", search: { q: "স্মৃতিকথা" } },
    { to: "/articles", label: lang === "bn" ? "কবিতা" : "Poems", search: { q: "কবিতা" } },
    { to: "/articles", label: lang === "bn" ? "গল্প" : "Stories", search: { q: "গল্প" } },
    { to: "/contact", label: lang === "bn" ? "যোগাযোগ" : "Contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          {/* লোগো ও ট্যাগলাইন */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex flex-col">
              <span className="font-['Kaushan_Script'] text-2xl font-bold tracking-tight text-primary">
                Alam M
              </span>
              <span className="text-[10px] tracking-widest text-muted-foreground font-medium">
                শব্দ আমার ক্যানভাস
              </span>
            </Link>

            {/* ডেস্কটপ নেভিগেশন লিংক */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.to}
                  search={link.search as any}
                  className="text-muted-foreground transition-colors hover:text-primary"
                  activeProps={{ className: "text-foreground font-semibold" }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* কন্ট্রোল বার: সার্চ, থিম, ভাষা, অ্যাডমিন ও মোবাইল টগল */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* ডেস্কটপ সার্চ বাটন (ইনপুট স্টাইল) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all shadow-sm"
              title="খুঁজুন (Ctrl+K)"
            >
              <Search className="size-3.5 text-primary" />
              <span>{lang === "bn" ? "অনুসন্ধান..." : "Search..."}</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* মোবাইল সার্চ আইকন বাটন */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-9 rounded-full text-foreground/80 hover:text-primary"
              onClick={() => setSearchOpen(true)}
              title="খুঁজুন"
            >
              <Search className="size-4" />
            </Button>

            {/* ভাষা পরিবর্তন বাটন */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLang}
              className="size-9 rounded-full text-foreground/80 hover:text-primary"
              title={lang === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
            >
              <Languages className="size-4" />
            </Button>

            {/* ডার্ক/লাইট মোড টগল বাটন */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-9 rounded-full text-foreground/80 hover:text-primary"
              title="থিম পরিবর্তন"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {/* বুকমার্ক পেজ লিংক */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex size-9 rounded-full text-foreground/80 hover:text-primary"
              title="বুকমার্ক সমূহ"
            >
              <Link to="/bookmarks">
                <Bookmark className="size-4" />
              </Link>
            </Button>

            {/* অ্যাডমিন প্যানেল লিংক */}
            {isAdmin && (
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-9 rounded-full border-primary/40 text-primary hover:bg-primary/10"
                title="অ্যাডমিন ড্যাশবোর্ড"
              >
                <Link to="/admin">
                  <Shield className="size-4" />
                </Link>
              </Button>
            )}

            {/* লগইন / লগআউট বাটন */}
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="size-9 rounded-full text-destructive hover:bg-destructive/10"
                title="লগআউট"
              >
                <LogOut className="size-4" />
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-foreground/80 hover:text-primary"
                title="লগইন"
              >
                <Link to="/auth">
                  <User className="size-4" />
                </Link>
              </Button>
            )}

            {/* মোবাইল মেনু বাটন */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-9 rounded-full text-foreground/80 hover:text-primary ml-0.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* মোবাইল ড্রপডাউন মেনু */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                search={link.search as any}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border/50">
              <Link
                to="/bookmarks"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
              >
                <Bookmark className="size-4 text-primary" />
                <span>বুকমার্ক</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* গ্লোবাল সার্চ মোডাল পপআপ */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
