import { Link } from "@tanstack/react-router";

import { usePrefs } from "@/lib/prefs";

export function SiteFooter() {
  const { t, lang } = usePrefs();
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-base font-semibold">{t("siteName")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            {t("home")}
          </Link>
          <Link to="/surah/$id" params={{ id: "1" }} className="text-muted-foreground hover:text-primary">
            {t("readQuran")}
          </Link>
          <Link to="/articles" className="text-muted-foreground hover:text-primary">
            {t("articles")}
          </Link>
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
