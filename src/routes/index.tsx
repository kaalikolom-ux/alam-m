import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, Sparkles, Image as ImageIcon } from "lucide-react";
import { useEffect, useState, memo } from "react";

import { usePrefs } from "@/lib/prefs";
import { useIsAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/NewsletterForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alam M — শব্দ আমার ক্যানভাস" },
      {
        name: "description",
        content: "শব্দের একজন লেখক এবং দৈনন্দিন মুহূর্তের মাঝে লুকানো গল্পগুলোর এক অনুসন্ধানী। গল্প, কবিতা ও স্মৃতিকথা।",
      },
      { property: "og:title", content: "Alam M — শব্দ আমার ক্যানভাস" },
      {
        property: "og:description",
        content: "গল্প, কবিতা, স্মৃতিকথা ও চিন্তাভাবনা নিয়ে ব্যক্তিগত সাহিত্যিক ব্লগ।",
      },
      { property: "og:image", content: "/android-chrome-512x512.png" },
    ],
  }),
  component: HomePage,
});

function getAutoExcerpt(content?: string | null, maxLength = 140) {
  if (!content) return "";
  const plainText = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
}

// হিরো সেকশনের রেসপনসিভ ব্যাকগ্রাউন্ড ইমেজ ও থিম কালার সিনেমেটিক ওভারলে (ডেস্কটপ, অ্যান্ড্রয়েড, আইওএস)
const HeroImageBackground = memo(function HeroImageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none bg-background transition-colors duration-500">
      {/* রেসপনসিভ ব্যাকগ্রাউন্ড ইমেজ (মোবাইল ও ডেস্কটপ ভিউপোর্টের জন্য অপ্টিমাইজড ফোকাস) */}
      <img
        src="/hero-image.webp"
        alt="Author typing on laptop"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="absolute inset-0 size-full object-cover object-[center_60%] sm:object-[center_45%] md:object-center brightness-[0.70] contrast-[1.12] saturate-[0.8] transition-transform duration-1000 ease-out will-change-transform"
      />

      {/* স্তর ১: থিম কালার গ্র্যাডিয়েন্ট ওভারলে (var(--gradient-hero) এবং ব্লেন্ডিং) */}
      <div
        className="absolute inset-0 opacity-90 transition-all duration-500"
        style={{
          backgroundImage: "var(--gradient-hero)",
          mixBlendMode: "multiply",
        }}
      />

      {/* স্তর ২: রেসপনসিভ ভিগনেট ও ডেপথ ওভারলে (থিম ব্যাকগ্রাউন্ডের সাথে সমন্বিত) */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: `
            linear-gradient(180deg, rgba(8, 15, 25, 0.85) 0%, rgba(12, 22, 36, 0.65) 40%, rgba(6, 12, 20, 0.92) 100%),
            radial-gradient(ellipse 90% 70% at 50% 35%, transparent 0%, var(--background) 95%)
          `,
        }}
      />

      {/* স্তর ৩: থিমের গোল্ড ও প্রাইমারি রঙের কেন্দ্রীয় নরম স্পটলাইট আভা */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[260px] sm:h-[360px] rounded-full opacity-25 blur-3xl pointer-events-none transition-all duration-500"
        style={{
          background: "radial-gradient(circle, var(--gold) 0%, var(--primary) 50%, transparent 80%)",
        }}
      />

      {/* স্তর ৪: নিচের সেকশনের সাথে মসৃণ ফেড ট্রানজিশন (থিম ব্যাকগ্রাউন্ডের সাথে সম্পূর্ণ একাত্ম) */}
      <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-b from-transparent via-background/50 to-background transition-colors duration-500" />
    </div>
  );
});

function CenterTypingText({ fullText }: { fullText: string }) {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => setIsReady(true), 1200);
    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let timer: NodeJS.Timeout;
    const len = fullText.length;
    const mid = Math.floor(len / 2);
    const maxRadius = Math.max(mid, len - mid);
    const currentRadius = Math.ceil(displayText.length / 2);

    if (!isDeleting && currentRadius < maxRadius) {
      timer = setTimeout(() => {
        const nextRadius = currentRadius + 1;
        const start = Math.max(0, mid - nextRadius);
        const end = Math.min(len, mid + nextRadius);
        setDisplayText(fullText.slice(start, end));
      }, 70);
    } else if (!isDeleting && currentRadius >= maxRadius) {
      timer = setTimeout(() => setIsDeleting(true), 4200);
    } else if (isDeleting && displayText.length > 0) {
      timer = setTimeout(() => {
        const nextRadius = Math.max(0, currentRadius - 1);
        if (nextRadius === 0) {
          setDisplayText("");
        } else {
          const start = Math.max(0, mid - nextRadius);
          const end = Math.min(len, mid + nextRadius);
          setDisplayText(fullText.slice(start, end));
        }
      }, 35);
    } else if (isDeleting && displayText.length === 0) {
      timer = setTimeout(() => setIsDeleting(false), 600);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, isReady, fullText]);

  return (
    <div className="relative flex h-20 sm:h-16 w-full max-w-2xl items-center justify-center overflow-hidden px-3">
      <p className="bg-gradient-to-r from-white/60 via-white/95 to-white/60 bg-clip-text text-center font-medium tracking-normal sm:tracking-wider text-transparent text-sm sm:text-lg md:text-xl leading-snug sm:leading-normal drop-shadow-sm">
        {displayText || (isReady ? "" : fullText)}
        <span className="ml-1 inline-block h-3.5 w-[2px] animate-pulse bg-gold align-middle sm:h-5" />
      </p>
    </div>
  );
}

function HomePage() {
  const { t, lang } = usePrefs();
  const { isAdmin } = useIsAdmin();

  const taglineText =
    lang === "bn"
      ? "শব্দ আমার ক্যানভাস, গল্প আমার রঙ; লেখার তুলিতে আঁকি ভাবনা"
      : "Words are my canvas, stories my colors; painting thoughts with the pencil";

  const bioText =
    lang === "bn"
      ? "শব্দের একজন লেখক এবং দৈনন্দিন মুহূর্তের মাঝে লুকানো গল্পগুলোর এক অনুসন্ধানী। আমার লেখার মাধ্যমে আমি ক্ষণিকের ভাবনাগুলোকে এমন বাক্যে রূপ দিতে চাই, যা পাঠের অনেক পরেও মনে রয়ে যায়।"
      : "A wordsmith and an explorer of stories hidden in everyday moments. Through my craft, I transform fleeting thoughts into sentences that echo long after the reading ends.";

  const heroName = lang === "bn" ? "আমি" : "I am";

  const articles = useQuery({
    queryKey: ["articles", "published", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, created_at, published_at, cover_image_url, article_categories(categories(id, name_bn, name_en, slug))",
        )
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
  });

  // ড্রাফট ব্যতীত প্রথম ৩টি প্রকাশিত পোস্ট
  const visibleArticles = (articles.data || [])
    .filter((art: any) => {
      if (isAdmin) return true;
      const isDraft = (art.article_categories || []).some(
        (ac: any) => ac.categories?.slug === "draft" || ac.categories?.name_bn === "খসড়া"
      );
      return !isDraft;
    })
    .slice(0, 3);

  return (
    <div className="bg-background text-foreground transition-colors duration-300">
      {/* হিরো সেকশন */}
      <section className="relative overflow-hidden min-h-[520px] sm:min-h-[580px] md:min-h-[620px] flex items-center justify-center">
        <HeroImageBackground />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-16 text-center sm:py-24 md:py-28">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-md shadow-sm">
            <Sparkles className="size-3.5 text-amber-300" /> {t("tagline")}
          </p>

          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl md:text-6xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            {heroName} <span className="gold-text">Alam —</span>
          </h1>

          <div className="mt-4 flex justify-center">
            <CenterTypingText fullText={taglineText} />
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base sm:leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-normal">
            {bioText}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 border border-primary/40 font-medium px-6"
            >
              <Link to="/articles" search={{ q: undefined }}>{lang === "bn" ? "সকল লেখা" : "All Posts"}</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/35 bg-black/25 text-white hover:bg-white/15 hover:text-white backdrop-blur-md px-6 shadow-sm"
            >
              <Link to="/about">{lang === "bn" ? "আমার পাতা" : "About Me"}</Link>
            </Button>

            {isAdmin && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-amber-500/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-amber-200 gap-1.5 shadow-sm backdrop-blur-md"
              >
                <Link to="/articles" search={{ q: "খসড়া" }}>
                  <FileText className="size-4" />
                  {lang === "bn" ? "খসড়া পোস্ট" : "Draft Posts"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* সাম্প্রতিক লেখা সেকশন */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {lang === "bn" ? "সাম্প্রতিক লেখা" : "Latest Articles"}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {lang === "bn" ? "সর্বশেষ প্রকাশিত চিন্তা ও গল্পসমূহ" : "Latest published thoughts and stories"}
              </p>
            </div>
            <Link
              to="/articles"
              search={{ q: undefined }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group"
            >
              {lang === "bn" ? "সকল লেখা" : "All Posts"} 
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {visibleArticles.length > 0 ? (
            <div className="mt-8 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleArticles.map((a: any) => {
                const title = lang === "en" && a.title_en ? a.title_en : a.title_bn;
                const rawExcerpt = lang === "en" && a.excerpt_en ? a.excerpt_en : a.excerpt_bn;
                const rawContent = lang === "en" && a.content_en ? a.content_en : a.content_bn;
                const excerpt = rawExcerpt || getAutoExcerpt(rawContent);
                const postDate = a.published_at || a.created_at;

                return (
                  <Link
                    key={a.id}
                    to="/articles/$slug"
                    params={{ slug: a.slug }}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-xl dark:hover:shadow-primary/5"
                  >
                    {/* ফটোকার্ড হেডার / ইমেজ কনটেইনার */}
                    <div className="aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted relative">
                      {a.cover_image_url ? (
                        <img
                          src={a.cover_image_url}
                          alt={title}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-accent/30 to-background p-6 text-center transition-colors group-hover:from-primary/20 group-hover:to-accent/40">
                          <ImageIcon className="size-8 text-muted-foreground/40 mb-2" />
                          <h3 className="line-clamp-2 text-base font-semibold text-foreground/80 group-hover:text-primary transition-colors">
                            {title}
                          </h3>
                        </div>
                      )}

                      {/* ইমেজ ওভারলে শ্যাডো */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    {/* কার্ড বডি */}
                    <div className="flex min-w-0 flex-1 flex-col p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {a.article_categories
                          ?.filter((ac: any) => isAdmin || (ac.categories?.slug !== "draft" && ac.categories?.name_bn !== "খসড়া"))
                          .map(
                            (ac: any) =>
                              ac.categories && (
                                <span
                                  key={ac.categories.id}
                                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                                >
                                  {lang === "en" && ac.categories.name_en
                                    ? ac.categories.name_en
                                    : ac.categories.name_bn}
                                </span>
                              ),
                          )}
                        {postDate && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(postDate).toLocaleDateString(
                              lang === "bn" ? "bn-BD" : "en-GB",
                            )}
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                        {title}
                      </h3>

                      <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {excerpt}
                      </p>

                      <div className="mt-auto pt-5 flex items-center text-xs font-semibold text-primary">
                        <span className="relative inline-flex items-center gap-1.5 transition-transform duration-200 group-hover:translate-x-1">
                          {t("readMore")} <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">{t("noArticles")}</p>
            </div>
          )}
        </div>
      </section>

      {/* নিউজলেটার সেকশন */}
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