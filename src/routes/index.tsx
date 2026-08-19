import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { usePrefs } from "@/lib/prefs";
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
    ],
  }),
  component: HomePage,
});

function getAutoExcerpt(content?: string | null, maxLength = 180) {
  if (!content) return "";
  const plainText = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
}

// লাইভ স্মোক পার্টিকেল ইফেক্ট
function SmokeBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      alphaSpeed: number;
    }> = [];

    const particleCount = 28;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 80 + 50,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.35 - 0.1,
        alpha: Math.random() * 0.18 + 0.05,
        alphaSpeed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaSpeed;

        if (p.alpha <= 0.03 || p.alpha >= 0.22) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        if (p.y + p.radius < 0) {
          p.y = height + p.radius;
          p.x = Math.random() * width;
        }
        if (p.x - p.radius > width) p.x = -p.radius;
        if (p.x + p.radius < 0) p.x = width + p.radius;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
        gradient.addColorStop(0.6, `rgba(212, 175, 55, ${p.alpha * 0.4})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 size-full opacity-60 mix-blend-screen"
    />
  );
}

// ধীরগতির মাঝখান থেকে দুই দিকে টাইপিং লুপ
function CenterTypingText({ fullText }: { fullText: string }) {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
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
      }, 80); // পড়ার উপযোগী শান্ত টাইপিং স্পিড
    } else if (!isDeleting && currentRadius >= maxRadius) {
      timer = setTimeout(() => setIsDeleting(true), 4200); // পড়ার জন্য বর্ধিত বিরতি
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
      }, 45);
    } else if (isDeleting && displayText.length === 0) {
      timer = setTimeout(() => setIsDeleting(false), 700);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, fullText]);

  return (
    <div className="relative inline-flex min-h-[3.5rem] items-center justify-center px-4 py-2">
      <p className="bg-gradient-to-r from-white/60 via-white/95 to-white/60 bg-clip-text text-center font-medium tracking-wider text-transparent text-lg sm:text-2xl drop-shadow-sm">
        {displayText}
        <span className="ml-1.5 inline-block h-5 w-[2px] animate-pulse bg-gold align-middle sm:h-6" />
      </p>
    </div>
  );
}

function HomePage() {
  const { t, lang } = usePrefs();

  const taglineText =
    lang === "bn"
      ? "শব্দ আমার ক্যানভাস, গল্প আমার রঙ; লেখার তুলিতে আঁকি ভাবনা"
      : "Words are my canvas, stories my colors; painting thoughts with the pencil";

  const articles = useQuery({
    queryKey: ["articles", "published", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, published_at, cover_image_url, article_categories(categories(id, name_bn, name_en))",
        )
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      {/* লাইভ স্মোক ওয়ালপেপারযুক্ত হিরো সেকশন */}
      <section className="hero-surface relative overflow-hidden">
        <SmokeBackground />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-1 text-xs font-medium tracking-wide backdrop-blur-sm">
            <Sparkles className="size-3.5" /> {t("tagline")}
          </p>

          {/* নাম এবং গোল্ডেন em-dash */}
          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl">
            আমি <span className="gold-text">আলম —</span>
          </h1>

          {/* ট্রান্সপারেন্ট টাইপিং লাইন */}
          <div className="mt-3 flex justify-center">
            <CenterTypingText fullText={taglineText} />
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            শব্দের একজন লেখক এবং দৈনন্দিন মুহূর্তের মাঝে লুকানো গল্পগুলোর এক অনুসন্ধানী। আমার
            লেখার মাধ্যমে আমি ক্ষণিকের ভাবনাগুলোকে এমন বাক্যে রূপ দিতে চাই, যা পাঠের অনেক পরেও
            মনে রয়ে যায়।
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/articles">{lang === "bn" ? "সকল লেখা" : "All Posts"}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* সাম্প্রতিক লেখা সেকশন */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">
              {lang === "bn" ? "সাম্প্রতিক লেখা" : "Latest Articles"}
            </h2>
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {lang === "bn" ? "সকল লেখা" : "All Posts"} <ArrowRight className="size-4" />
            </Link>
          </div>

          {articles.data && articles.data.length > 0 ? (
            <div className="mt-6 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.data.map((a) => {
                const title = lang === "en" && a.title_en ? a.title_en : a.title_bn;
                const rawExcerpt = lang === "en" && a.excerpt_en ? a.excerpt_en : a.excerpt_bn;
                const rawContent = lang === "en" && a.content_en ? a.content_en : a.content_bn;
                const excerpt = rawExcerpt || getAutoExcerpt(rawContent);

                return (
                  <Link
                    key={a.id}
                    to="/articles/$slug"
                    params={{ slug: a.slug }}
                    className="card-soft group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-lift)]"
                  >
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
                            {new Date(a.published_at).toLocaleDateString(
                              lang === "bn" ? "bn-BD" : "en-GB",
                            )}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                        {excerpt}
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