import { Link } from "@tanstack/react-router";

import { usePrefs } from "@/lib/prefs";
import { useMenu } from "@/lib/menu";

export function SiteFooter() {
  const { t, lang } = usePrefs();
  const header = useMenu("header");
  const footer = useMenu("footer");
  const items = [...(footer.data ?? []), ...(footer.data?.length ? [] : header.data ?? [])];

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-logo text-2xl text-primary">Alam M</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {(items.length > 0
            ? items
            : [
                { id: "h", label_bn: "হোম", label_en: "Home", url: "/" },
                { id: "a", label_bn: "আর্টিকেল", label_en: "Articles", url: "/articles" },
                { id: "ab", label_bn: "আমার পাতা", label_en: "About Me", url: "/about" },
                { id: "c", label_bn: "যোগাযোগ", label_en: "Contact", url: "/contact" },
              ]
          ).map((m) => (
            <Link key={m.id} to={m.url as "/"} className="text-muted-foreground hover:text-primary">
              {lang === "en" && m.label_en ? m.label_en : m.label_bn}
            </Link>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            {lang === "en"
              ? "Quran text and classical translations: Quran.com API."
              : "কুরআনের টেক্সট ও প্রচলিত অনুবাদ: Quran.com API।"}
          </p>
          <p className="mt-2">© {new Date().getFullYear()} {t("siteName")}</p>
        </div>
      </div>
    </footer>
  );
}
