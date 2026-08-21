import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, Sparkles, Image as ImageIcon } from "lucide-react";
import { useEffect, useState, memo, useRef } from "react";

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

// স্টিল-ব্লু ড্রপলেট ও ভাসমান মেঘের লাইভ ব্যাকগ্রাউন্ড
const WaterDropletCloudBackground = memo(function WaterDropletCloudBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    const droplets = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.8 + 1.2,
      stretch: Math.random() * 1.8 + 1,
      angle: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      speedY: Math.random() * 0.08 + 0.02,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        d.y += d.speedY;
        if (d.y > h + 10) {
          d.y = -10;
          d.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.angle);

        ctx.beginPath();
        ctx.ellipse(0, 0, d.r * d.stretch, d.r, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(10, 20, 32, ${d.alpha * 0.85})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-d.r * 0.3, -d.r * 0.3, d.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 245, 255, ${d.alpha * 0.7})`;
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none bg-[#182635]">
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #324757 0%, #20313f 50%, #101c27 100%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full opacity-80 mix-blend-multiply"
      />
      <div
        className="absolute inset-x-[-20%] bottom-0 h-64 opacity-35 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse 75% 45% at 35% 95%, rgba(255, 255, 255, 0.45), transparent 70%), radial-gradient(ellipse 65% 55% at 75% 85%, rgba(195, 220, 240, 0.35), transparent 65%)",
          animation: "cloudDriftOne 20s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute inset-x-[-25%] -bottom-8 h-52 opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 65% 95%, rgba(255, 255, 255, 0.45), transparent 70%), radial-gradient(ellipse 55% 45% at 20% 80%, rgba(180, 210, 235, 0.3), transparent 60%)",
          animation: "cloudDriftTwo 28s linear infinite",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-background" />

      <style>{`
        @keyframes cloudDriftOne {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-40px, -12px, 0) scale(1.04); }
          100% { transform: translate3d(30px, 6px, 0) scale(0.97); }
        }
        @keyframes cloudDriftTwo {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(50px, -8px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>
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
      <section className="relative overflow-hidden">
        <WaterDropletCloudBackground />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
            <Sparkles className="size-3.5" /> {t("tagline")}
          </p>

          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl text-white">
            {heroName} <span className="gold-text">Alam —</span>
          </h1>

          <div className="mt-4 flex justify-center">
            <CenterTypingText fullText={taglineText} />
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            {bioText}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/articles">{lang === "bn" ? "সকল লেখা" : "All Posts"}</Link>
            </Button>

            {isAdmin && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-amber-500/60 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200 gap-1.5 shadow-sm"
              >
                <Link to="/articles" search={{ q: "খসড়া" } as any}>
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