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
        .select("id, slug, title_bn, title_en, excerpt_bn, excerpt_en, published_at, cover_image_url, article_categories(categories(id, name_bn, name_en))")
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
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-xs font-medium tracking-wide">
            <Sparkles className="size-3.5" /> {t("tagline")}
          </p>
          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl">
            আমি <span className="gold-text">আলম</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            শব্দের একজন লেখক এবং দৈনন্দিন মুহূর্তের মাঝে লুকানো গল্পগুলোর এক অনুসন্ধানী। আমার
            লেখার মাধ্যমে আমি ক্ষণিকের ভাবনাগুলোকে এমন বাক্যে রূপ দিতে চাই, যা পাঠের অনেক পরেও
            মনে রয়ে যায়। শব্দ আমার ক্যানভাস, আর গল্প আমার রঙ — যেগুলো দিয়ে আমি আঁকি।
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
            <div className="mt-6 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.data.map((a) => {
                const title = lang === "en" && a.title_en ? a.title_en : a.title_bn;
                const excerpt = lang === "en" && a.excerpt_en ? a.excerpt_en : a.excerpt_bn;

                return (
                  <Link
                    key={a.id}
                    to="/articles/$slug"
                    params={{ slug: a.slug }}
                    className="card-soft group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-lift)]"
                  >
                    {/* ওপরের অংশ: ইমেজ অথবা সেন্টার্ড পোস্ট টাইটেল */}
                    <div className="aspect-[16/10] w-full shrink-0 overflow-hidden bg-accent/40 relative">
                      {a.cover_image_url ? (
                        <img
                          src={a.cover_image_url}
                          alt={title}
                          loading="lazy"
                          width={1600}
                          height={1000}
                          className="block size-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center p-6 text-center bg-gradient-to-br from-primary/5 via-accent/20 to-primary/10 transition-colors group-hover:from-primary/10 group-hover:to-primary/20">
                          <h3 className="line-clamp-3 text-lg font-semibold tracking-tight text-foreground/90 transition-colors group-hover:text-primary">
                            {title}
                          </h3>
                        </div>
                      )}
                    </div>

                    {/* নিচের অংশ: ক্যাটাগরি, তারিখ ও সারসংক্ষেপ */}
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        {a.article_categories?.map(
                          (ac) =>
                            ac.categories && (
                              <span
                                key={ac.categories.id}
                                className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                              >
                                {lang === "en" && ac.categories.name_en
                                  ? ac.categories.name_en
                                  : ac.categories.name_bn}
                              </span>
                            ),
                        )}
                        {a.published_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.published_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB")}
                          </span>
                        )}
                      </div>

                      {/* সারসংক্ষেপ (Excerpt) */}
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {excerpt || "কোনো সারসংক্ষেপ যুক্ত করা হয়নি..."}
                      </p>

                      <span className="mt-auto pt-4 text-xs font-semibold uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        {t("readMore")} →
                      </span>
                    </div>
                  </Link>
                );
              })}
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