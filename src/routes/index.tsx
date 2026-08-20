import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, memo, useRef, useEffect } from "react";
import { ArrowRight, BookOpen, FileText, Search, Settings, Sparkles } from "lucide-react";

import { chaptersQuery, localNumber } from "@/lib/quran";
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
      { property: "og:type", content: "website" },
      { property: "og:title", content: "কুরআন অন্বেষা — শব্দে শব্দে অর্থসহ কুরআন" },
      {
        property: "og:description",
        content: "শব্দে শব্দে অর্থ, প্রচলিত ও বিজ্ঞানভিত্তিক অনুবাদ একই পাতায়।",
      },
      { property: "og:image", content: "/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "কুরআন অন্বেষা — শব্দে শব্দে অর্থসহ কুরআন" },
      {
        name: "twitter:description",
        content: "শব্দে শব্দে অর্থ, প্রচলিত ও বিজ্ঞানভিত্তিক অনুবাদ একই পাতায়।",
      },
      { name: "twitter:image", content: "/og-image.jpg" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(chaptersQuery("bn"));
  },
  component: HomePage,
});

function bnToEnDigits(str: string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[০-৯]/g, (w) => String(bnDigits.indexOf(w)));
}

// সেলফ-কনটেইন্ড টাইপরাইটার কম্পোনেন্ট
function InlineTypewriter({
  words,
  typingSpeed = 90,
  deletingSpeed = 50,
  delayBetweenWords = 1500,
}: {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex % words.length];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (text.length < currentWord.length) {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length + 1));
        }, typingSpeed);
      } else {
        timer = setTimeout(() => setIsDeleting(true), delayBetweenWords);
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span>
      {text}
      <span className="inline-block animate-pulse text-amber-300">|</span>
    </span>
  );
}

// স্টিল-ব্লু ড্রপলেট ও লাইভ ক্লাউড ব্যাকগ্রাউন্ড
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

    const droplets = Array.from({ length: 95 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.8 + 1.2,
      stretch: Math.random() * 1.8 + 1,
      angle: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.55 + 0.25,
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

      {/* হিরো ও পরের সেকশনের মসৃণ ব্লেন্ডিং ফেড */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#070d14]/70 to-[#070d14]" />

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

function HomePage() {
  const { t, lang } = usePrefs();
  const [term, setTerm] = useState("");
  const chapters = useQuery(chaptersQuery(lang));
  const navigate = useNavigate();

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

  const normalizedTerm = useMemo(() => {
    return bnToEnDigits(term.trim().toLowerCase());
  }, [term]);

  const parsedAyahTarget = useMemo(() => {
    const match = normalizedTerm.match(/^(\d{1,3})[:ঃ\/\.\-](\d{1,3})$/);
    if (match) {
      return {
        surah: Number(match[1]),
        ayah: Number(match[2]),
      };
    }
    return null;
  }, [normalizedTerm]);

  const filtered = useMemo(() => {
    const list = chapters.data ?? [];
    if (!normalizedTerm) return list;

    if (parsedAyahTarget) {
      return list.filter((c) => c.id === parsedAyahTarget.surah);
    }

    const isNum = /^\d+$/.test(normalizedTerm);
    if (isNum) {
      return list.filter((c) => String(c.id) === normalizedTerm);
    }

    const rawQ = term.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(rawQ) ||
        c.translated_name.name.toLowerCase().includes(rawQ) ||
        String(c.id) === normalizedTerm
    );
  }, [chapters.data, normalizedTerm, term, parsedAyahTarget]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedTerm) return;

    if (parsedAyahTarget) {
      const { surah, ayah } = parsedAyahTarget;
      if (surah >= 1 && surah <= 114) {
        navigate({
          to: "/surah/$id",
          params: { id: String(surah) },
          search: { ayah: Number(ayah) },
        });
        return;
      }
    }

    if (/^\d+$/.test(normalizedTerm)) {
      const sNum = Number(normalizedTerm);
      if (sNum >= 1 && sNum <= 114) {
        navigate({
          to: "/surah/$id",
          params: { id: String(sNum) },
        });
        return;
      }
    }

    if (filtered.length > 0) {
      navigate({
        to: "/surah/$id",
        params: { id: String(filtered[0].id) },
      });
    }
  };

  return (
    <div className="bg-[#070d14]">
      {/* হিরো সেকশন */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:py-28">
        <WaterDropletCloudBackground />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3.5 py-1 text-xs font-medium tracking-wide bg-black/25 backdrop-blur-md shadow-xs text-white">
            <Sparkles className="size-3.5 text-amber-300" /> {t("tagline")}
          </p>

          <h1 className="mt-6 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl text-white drop-shadow-md">
            {lang === "bn" ? (
              <>
                পবিত্র কুরআন — বুঝে পড়ুন <br />
                <span className="inline-block mt-1 font-semibold text-amber-300">
                  <InlineTypewriter
                    words={[
                      "শব্দে শব্দে অর্থসহ",
                      "বিজ্ঞানভিত্তিক ব্যাখ্যায়",
                      "সহজ বাংলা অনুবাদে",
                      "প্রামাণ্য তথ্যসূত্রসহ",
                    ]}
                    typingSpeed={90}
                    deletingSpeed={50}
                    delayBetweenWords={1500}
                  />
                </span>
              </>
            ) : (
              <>
                The Holy Quran — understand it <br />
                <span className="inline-block mt-1 font-semibold text-amber-300">
                  <InlineTypewriter
                    words={[
                      "word by word",
                      "with scientific context",
                      "in clear translation",
                      "with authentic notes",
                    ]}
                    typingSpeed={80}
                    deletingSpeed={40}
                    delayBetweenWords={1500}
                  />
                </span>
              </>
            )}
          </h1>

          <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-white/90 drop-shadow-sm">
            {lang === "bn"
              ? "আরবি, শব্দে শব্দে অর্থ, বাংলা ও ইংরেজি অনুবাদ এবং বিজ্ঞানভিত্তিক অনুবাদসহ পবিত্র কুরআন পড়ুন। শব্দে শব্দে অর্থ, প্রচলিত ও বিজ্ঞানভিত্তিক অনুবাদ একই পাতায়।"
              : "Read the Holy Quran with Arabic, word-by-word meaning, Bengali & English translations, and scientific context on a single platform."}
          </p>
          
          <div className="mt-8 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 max-w-lg sm:max-w-none">
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto px-2 sm:px-4 text-xs sm:text-base bg-black/30 text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-black/45 hover:text-white hover:scale-[1.02] border border-white/20"
            >
              <Link to="/surah/$id" params={{ id: "1" }}>
                <BookOpen className="size-3.5 sm:size-4 mr-1 sm:mr-2 shrink-0 text-amber-300" /> 
                <span className="truncate">{t("readQuran")}</span>
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto px-2 sm:px-4 text-xs sm:text-base bg-black/30 text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-black/45 hover:text-white hover:scale-[1.02] border border-white/20"
            >
              <Link to="/articles">
                <FileText className="size-3.5 sm:size-4 mr-1 sm:mr-2 shrink-0 text-sky-300" /> 
                <span className="truncate">{lang === "bn" ? "আর্টিকেল" : "Articles"}</span>
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto px-2 sm:px-4 text-xs sm:text-base bg-black/30 text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-black/45 hover:text-white hover:scale-[1.02] border border-white/20"
            >
              <Link to="/settings">
                <Settings className="size-3.5 sm:size-4 mr-1 sm:mr-2 shrink-0 text-amber-200" /> 
                <span className="truncate">{lang === "bn" ? "সেটিংস" : "Settings"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* সুরা তালিকা সেকশন */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("surahs")} <span className="text-muted-foreground">({localNumber(114, lang)})</span>
            </h2>

            <div className="w-full max-w-sm space-y-1.5">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center rounded-xl border border-border/80 bg-card/70 px-3 py-1.5 shadow-xs focus-within:border-foreground/40 transition-all"
              >
                <Search className="size-4 text-muted-foreground shrink-0 mr-2" />
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder={
                    lang === "bn"
                      ? "সুরা খুঁজুন... / আয়াত খুঁজুন..."
                      : "Search Surah... / Ayah..."
                  }
                  className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-primary/15 hover:bg-primary/25 text-primary px-2.5 py-1 text-xs font-semibold transition-colors border border-primary/20 shrink-0 cursor-pointer"
                >
                  যান
                </button>
              </form>
              <p className="text-[11px] leading-tight text-muted-foreground/70 px-1">
                {lang === "bn"
                  ? "💡 সুরা খুঁজতে নাম বা নম্বর (৩৩ বা 33) লিখুন। আয়াত খুঁজতে ৩৩ঃ৪০ বা 33:40 লিখে ইন্টার চাপুন।"
                  : "💡 Search surah by name or no. (33). Search ayah like 33:40 and press Enter."}
              </p>
            </div>
          </div>

          {chapters.isLoading ? (
            <p className="mt-8 text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const targetAyah = parsedAyahTarget && parsedAyahTarget.surah === c.id ? parsedAyahTarget.ayah : undefined;

                return (
                  <Link
                    key={c.id}
                    to="/surah/$id"
                    params={{ id: String(c.id) }}
                    search={targetAyah ? { ayah: targetAyah } : undefined}
                    className="card-soft group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] cursor-pointer"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
                      {localNumber(c.id, lang)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {c.name_simple}
                        {targetAyah && (
                          <span className="ml-2 text-xs font-semibold text-primary">
                            ({localNumber(targetAyah, lang)} নং আয়াত)
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.translated_name.name} · {localNumber(c.verses_count, lang)} {t("verses")}
                      </span>
                    </span>
                    <span className="arabic text-lg text-primary">{c.name_arabic}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* আর্টিকেল সেকশন */}
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

      {/* নিউজলেটার */}
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