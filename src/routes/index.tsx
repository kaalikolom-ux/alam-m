import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";

import { usePrefs } from "@/lib/prefs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/NewsletterForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "কুরআন অন্বেষা — শব্দে শব্দে অর্থসহ কুরআন ও আর্টিকেল" },
      {
        name: "description",
        content:
          "আরবি, শব্দে শব্দে অর্থ, বাংলা (তাইসিরুল কুরআন) ও ইংরেজি (Pickthall) অনুবাদ এবং বিজ্ঞানভিত্তিক অনুবাদসহ কুরআন পড়ুন। বুকমার্ক ও আর্টিকেল সুবিধা।",
      },
      { property: "og:title", content: "কুরআন অন্বেষা — শব্দে শব্দে অর্থসহ কুরআন" },
      {
        property: "og:description",
        content: "শব্দে শব্দে অর্থ, প্রচলিত ও বিজ্ঞানভিত্তিক অনুবাদ একই পাতায়।",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, lang } = usePrefs();

  const articles = useQuery({
    queryKey: ["articles", "published", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title_bn, title_en, excerpt_bn, excerpt_en, published_at, cover_image_url")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="hero-surface relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-xs font-medium tracking-wide">
            <Sparkles className="size-3.5" /> {t("tagline")}
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            {lang === "bn" ? (
              <>
                পবিত্র কুরআন — <span className="gold-text">শব্দে শব্দে</span> বুঝে পড়ুন
              </>
            ) : (
              <>
                The Holy Quran — understand it <span className="gold-text">word by word</span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80">{t("heroSub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/articles">{t("articles")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">{t("latestArticles")}</h2>
            <Link to="/articles" className="inline-flex items-center gap-1 text-sm text-primary">
              {t("articles")} <ArrowRight className="size-4" />
            </Link>
          </div>
          {articles.data && articles.data.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {articles.data.map((a) => (
                <Link
                  key={a.id}
                  to="/articles/$slug"
                  params={{ slug: a.slug }}
                  className="card-soft flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
                >
                  {a.cover_image_url && (
                    <img
                      src={a.cover_image_url}
                      alt={a.title_bn}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="text-base font-semibold">
                      {lang === "en" && a.title_en ? a.title_en : a.title_bn}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {lang === "en" && a.excerpt_en ? a.excerpt_en : a.excerpt_bn}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">{t("noArticles")}</p>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <div className="card-soft p-8 text-center">
          <h2 className="text-xl font-semibold">{t("newsletter")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("newsletterSub")}</p>
          <div className="mt-6">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
