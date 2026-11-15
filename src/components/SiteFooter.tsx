import { Link } from "@tanstack/react-router";
import { Facebook, Mail } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import { useMenu } from "@/lib/menu";
import { getMenuIcon, ORDERED_MENU_ITEMS, sortMenuItems } from "@/lib/menuIcons";
import { NewsletterForm } from "@/components/NewsletterForm";

export function SiteFooter() {
  const { lang } = usePrefs();
  const menu = useMenu("footer");

  // Ordered menu items matching header order
  const rawItems = menu.data && menu.data.length > 0 ? menu.data : ORDERED_MENU_ITEMS;
  const items = sortMenuItems(rawItems);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-background/80 py-10 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 items-start gap-8 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* বামের কলাম: লোগো ও সোশাল লিংক */}
          <div className="flex flex-col items-start space-y-2.5">
            <Link to="/" className="font-logo text-3xl text-primary transition-opacity hover:opacity-90">
              Alam M
            </Link>
            <p className="text-xs font-medium tracking-tight text-muted-foreground">
              {lang === "bn" ? "শব্দ আমার ক্যানভাস" : "Worlds Painted with Words"}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === "bn" ? "স্বচ্ছ ভাবনা। সার্থক রূপায়ণ।" : "Clear thoughts. Meaningful expression."}
            </p>

            <div className="flex items-center gap-2 pt-1.5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="size-4" />
              </a>
              <Link
                to="/contact"
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Contact Email"
              >
                <Mail className="size-4" />
              </Link>
            </div>
          </div>

          {/* মাঝের কলাম: ২ কলাম গ্রিড মেনু (হাইট ব্যালেন্সড) */}
          <div className="flex flex-col space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "bn" ? "মেনু লিংক" : "Menu Links"}
            </h3>
            <nav className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              {items.map((item) => {
                const Icon = getMenuIcon(item.url, item.label_bn);
                const isInternal = item.url.startsWith("/");
                const label = lang === "en" && item.label_en ? item.label_en : item.label_bn;

                return isInternal ? (
                  <Link
                    key={item.id}
                    to={item.url}
                    className="relative inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-foreground/80 border border-transparent transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 hover:text-primary hover:translate-x-0.5 active:scale-95"
                  >
                    <Icon className="size-3.5 shrink-0 text-primary/70 transition-colors" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <a
                    key={item.id}
                    href={item.url}
                    className="relative inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-foreground/80 border border-transparent transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 hover:text-primary hover:translate-x-0.5 active:scale-95"
                  >
                    <Icon className="size-3.5 shrink-0 text-primary/70 transition-colors" />
                    <span>{label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* ডানের কলাম: নিউজলেটার ও কপিরাইট */}
          <div className="flex flex-col space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "bn" ? "নিউজলেটার সাবস্ক্রাইব করুন" : "Subscribe to Newsletter"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "নতুন গল্প, কবিতা ও স্মৃতিকথার আপডেট সরাসরি ইমেইলে পান।"
                : "Get updates on new stories, poems and thoughts directly to your inbox."}
            </p>

            <div className="pt-0.5">
              <NewsletterForm />
            </div>

            {/* কপিরাইট + Upwork প্রোফাইল লিঙ্ক */}
            <div className="border-t border-border/40 pt-3 mt-1">
              <p className="text-xs text-muted-foreground">
                © {currentYear}{" "}
                <a
                  href="https://www.upwork.com/freelancers/~01e6f18d96f1c7294f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-logo text-sm text-primary transition-opacity hover:opacity-80 inline-block mx-0.5"
                  title="Alam M - Upwork Profile"
                >
                  Alam M
                </a>{" "}
                - {lang === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
