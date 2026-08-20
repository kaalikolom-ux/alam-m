import { Link } from "@tanstack/react-router";
import { Facebook, Mail } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import { useMenu } from "@/lib/menu";
import { NewsletterForm } from "@/components/NewsletterForm";

const FALLBACK_FOOTER = [
  { id: "home", label_bn: "হোম", label_en: "Home", url: "/" },
  { id: "story", label_bn: "গল্প", label_en: "Stories", url: "/articles?q=গল্প" },
  { id: "poem", label_bn: "কবিতা", label_en: "Poems", url: "/articles?q=কবিতা" },
  { id: "memory", label_bn: "স্মৃতিকথা", label_en: "Memories", url: "/articles?q=স্মৃতিকথা" },
  { id: "about", label_bn: "আমার পাতা", label_en: "About Me", url: "/about" },
  { id: "contact", label_bn: "যোগাযোগ", label_en: "Contact", url: "/contact" },
];

export function SiteFooter() {
  const { lang } = usePrefs();
  const menu = useMenu("footer");
  const rawItems = menu.data && menu.data.length > 0 ? menu.data : FALLBACK_FOOTER;

  // "আর্টিকেল" ফিল্টার করে বাদ দেওয়া এবং হোম প্রথমে রাখা
  const filteredItems = rawItems.filter(
    (item) => item.label_bn !== "আর্টিকেল" && item.label_en?.toLowerCase() !== "articles"
  );
  const homeItem = filteredItems.find(
    (item) => item.url === "/" || item.label_bn === "হোম" || item.label_en?.toLowerCase() === "home"
  );
  const otherItems = filteredItems.filter((item) => item !== homeItem);
  const items = homeItem ? [homeItem, ...otherItems] : otherItems;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-background/80 py-12 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* বামের কলাম: লোগো ও সোশাল লিংক */}
          <div className="flex flex-col items-start space-y-3">
            <Link to="/" className="font-logo text-3xl text-primary transition-opacity hover:opacity-90">
              Alam M
            </Link>
            <p className="text-xs font-medium tracking-tight text-muted-foreground">
              {lang === "bn" ? "শব্দ আমার ক্যানভাস" : "Worlds Painted with Words"}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === "bn" ? "স্বচ্ছ ভাবনা। সার্থক রূপায়ণ।" : "Clear thoughts. Meaningful expression."}
            </p>

            <div className="flex items-center gap-2 pt-2">
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

          {/* মাঝের কলাম: মেনু লিঙ্ক (বাটন হোভার স্টাইল) */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "bn" ? "মেনু লিংক" : "Menu Links"}
            </h3>
            <nav className="flex flex-col items-start gap-1.5">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  className="relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/80 border border-transparent transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 hover:text-primary hover:translate-x-1 active:scale-95"
                >
                  {lang === "en" && item.label_en ? item.label_en : item.label_bn}
                </a>
              ))}
            </nav>
          </div>

          {/* ডানের কলাম: নিউজলেটার ও কপিরাইট */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "bn" ? "নিউজলেটার সাবস্ক্রাইব করুন" : "Subscribe to Newsletter"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "নতুন গল্প, কবিতা ও স্মৃতিকথার আপডেট সরাসরি ইমেইলে পান।"
                : "Get updates on new stories, poems and thoughts directly to your inbox."}
            </p>

            <div className="pt-1">
              <NewsletterForm />
            </div>

            {/* কপিরাইট + Upwork লিঙ্কযুক্ত লোগো টেক্সট */}
            <div className="border-t border-border/40 pt-4 mt-2">
              <p className="text-xs text-muted-foreground">
                © {currentYear}{" "}
                <a
                  href="https://www.upwork.com/freelancers/~01e6f18d96f1c7294f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-logo text-sm text-primary transition-opacity hover:opacity-80 inline-block mx-0.5"
                  title="Alam M — Upwork Profile"
                >
                  Alam M
                </a>{" "}
                — {lang === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}