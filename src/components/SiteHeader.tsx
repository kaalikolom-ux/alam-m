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
import { useMenu } from "@/lib/menu";
import { getMenuIcon, ORDERED_MENU_ITEMS, sortMenuItems } from "@/lib/menuIcons";
import { useSession, useIsAdmin, signOutFast } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";

export function SiteHeader() {
  const { theme, toggleTheme, lang, toggleLang, t } = usePrefs();
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const queryClient = useQueryClient();
  const handleSignOut = async () => {
    await signOutFast(queryClient);
    toast.success("লগআউট সফল হয়েছে");
  };

  const menu = useMenu("header");

  const dbLinks = menu.data && menu.data.length > 0 ? menu.data : ORDERED_MENU_ITEMS;
  const sortedItems = sortMenuItems(dbLinks);

  const navLinks = sortedItems.map((item) => ({
    id: item.id,
    url: item.url,
    label: lang === "en" && item.label_en ? item.label_en : item.label_bn,
  }));

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* লোগো ও ট্যাগলাইন */}
          <div className="flex items-center gap-3 lg:gap-5 xl:gap-6">
            <Link to="/" className="flex flex-col shrink-0">
              <span className="font-['Kaushan_Script'] text-2xl font-bold tracking-tight text-primary">
                Alam M
              </span>
              <span className="text-[10px] tracking-widest text-muted-foreground font-medium">
                শব্দ আমার ক্যানভাস
              </span>
            </Link>

            {/* ডেস্কটপ নেভিগেশন লিংক */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-4.5 text-xs lg:text-[13px] xl:text-sm font-medium">
              {navLinks.map((link) => {
                const Icon = getMenuIcon(link.url, link.label);
                const isInternal = link.url.startsWith("/");
                return isInternal ? (
                  <Link
                    key={link.id}
                    to={link.url}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-muted-foreground transition-colors hover:text-primary"
                    activeProps={{ className: "text-primary font-semibold" }}
                  >
                    <Icon className="size-3.5 shrink-0 opacity-80" />
                    <span>{link.label}</span>
                  </Link>
                ) : (
                  <a
                    key={link.id}
                    href={link.url}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon className="size-3.5 shrink-0 opacity-80" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* কন্ট্রোল বার: সার্চ, থিম, ভাষা, অ্যাডমিন ও মোবাইল টগল */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* ডেস্কটপ সার্চ বাটন (ইনপুট স্টাইল) */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={lang === "bn" ? "খুঁজুন (Ctrl+K)" : "Search (Ctrl+K)"}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all shadow-sm"
              title={lang === "bn" ? "অনুসন্ধান (Ctrl+K)" : "Search (Ctrl+K)"}
            >
              <Search className="size-3.5 text-primary" />
              <span>{lang === "bn" ? "অনুসন্ধান..." : "Search..."}</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground shadow-xs">
                ⌘K
              </kbd>
            </button>

            {/* মোবাইল সার্চ আইকন বাটন */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={lang === "bn" ? "অনুসন্ধান করুন" : "Search"}
              className="md:hidden size-9 rounded-full text-foreground/80 hover:text-primary"
              onClick={() => setSearchOpen(true)}
              title={lang === "bn" ? "অনুসন্ধান" : "Search"}
            >
              <Search className="size-4" />
            </Button>

            {/* ভাষা পরিবর্তন বাটন */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={lang === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
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
              aria-label={theme === "dark" ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
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
              aria-label={lang === "bn" ? "বুকমার্ক সমূহ" : "Saved Bookmarks"}
              className="hidden sm:inline-flex size-9 rounded-full text-foreground/80 hover:text-primary"
              title="বুকমার্ক সমূহ"
            >
              <Link to="/bookmarks" aria-label={lang === "bn" ? "বুকমার্ক সমূহ" : "Saved Bookmarks"}>
                <Bookmark className="size-4" />
              </Link>
            </Button>

            {/* অ্যাডমিন প্যানেল লিংক */}
            {isAdmin && (
              <Button
                asChild
                variant="outline"
                size="icon"
                aria-label="অ্যাডমিন ড্যাশবোর্ড"
                className="size-9 rounded-full border-primary/40 text-primary hover:bg-primary/10"
                title="অ্যাডমিন ড্যাশবোর্ড"
              >
                <Link to="/admin" aria-label="অ্যাডমিন ড্যাশবোর্ড">
                  <Shield className="size-4" />
                </Link>
              </Button>
            )}

            {/* লগইন / লগআউট বাটন */}
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={lang === "bn" ? "লগআউট" : "Log out"}
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
                aria-label={lang === "bn" ? "লগইন" : "Log in"}
                className="size-9 rounded-full text-foreground/80 hover:text-primary"
                title="লগইন"
              >
                <Link to="/auth" aria-label={lang === "bn" ? "লগইন" : "Log in"}>
                  <User className="size-4" />
                </Link>
              </Button>
            )}

            {/* মোবাইল মেনু বাটন */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={mobileMenuOpen ? (lang === "bn" ? "মেনু বন্ধ করুন" : "Close menu") : (lang === "bn" ? "মেনু খুলুন" : "Open menu")}
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
            {navLinks.map((link) => {
              const Icon = getMenuIcon(link.url, link.label);
              const isInternal = link.url.startsWith("/");
              return isInternal ? (
                <Link
                  key={link.id}
                  to={link.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                  activeProps={{ className: "bg-muted text-primary font-semibold" }}
                >
                  <Icon className="size-4 text-primary shrink-0" />
                  <span>{link.label}</span>
                </Link>
              ) : (
                <a
                  key={link.id}
                  href={link.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                >
                  <Icon className="size-4 text-primary shrink-0" />
                  <span>{link.label}</span>
                </a>
              );
            })}
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
