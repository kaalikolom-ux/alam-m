import { createFileRoute, Link } from "@tanstack/react-router";
import { Feather, BookOpen, Mail, Quote } from "lucide-react";

import { usePrefs } from "@/lib/prefs";
import { usePage } from "@/components/PageBody";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমার পাতা — Alam M" },
      {
        name: "description",
        content: "আমি আলম। শব্দের একজন লেখক, দৈনন্দিন মুহূর্তের গল্পের অনুসন্ধানী। লেখক পরিচিতি ও ভাবনা।",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "আমার পাতা — Alam M" },
      { property: "og:description", content: "আমি আলম। শব্দের ভাঁজে ভাঁজে লুকিয়ে থাকা গল্পগুলোর সন্ধানী।" },
      { property: "og:image", content: "https://a.wooniche.com/og-image.png" },
      { property: "og:image:secure_url", content: "https://a.wooniche.com/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://a.wooniche.com/og-image.png" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { lang } = usePrefs();
  const page = usePage("about");

  const dynamicTitle =
    lang === "en" ? page.data?.title_en || page.data?.title_bn : page.data?.title_bn;
  const dynamicContent =
    lang === "en" ? page.data?.content_en || page.data?.content_bn : page.data?.content_bn;

  const isBengali = lang === "bn";

  return (
    <div className="bg-background text-foreground transition-colors py-10 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        {/* হেডার / টাইটেল সেকশন (Left Aligned) */}
        <div className="text-left space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary shadow-sm">
            <Feather className="size-3.5 text-primary" />
            {isBengali ? "লেখক পরিচিতি ও ভাবনা" : "Author Profile & Reflections"}
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground font-['Kaushan_Script',cursive]">
            {dynamicTitle || (isBengali ? "আমার পাতা" : "About Me")}
          </h1>

          <p className="text-base sm:text-lg text-primary/90 font-['Kaushan_Script',cursive]">
            {isBengali ? "শব্দ আমার ক্যানভাস, গল্প আমার পথচলা" : "Words are my canvas, stories my path"}
          </p>
        </div>

        {/* কভার ইমেজ (যদি ডেটাবেজে থাকে) */}
        {page.data?.cover_image_url && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 shadow-md">
            <img
              src={page.data.cover_image_url}
              alt={dynamicTitle || "About Alam"}
              className="w-full object-cover max-h-[380px]"
            />
          </div>
        )}

        {/* মূল কনটেন্ট এরিয়া (Left Aligned) */}
        <article className="mt-10 space-y-6 text-base sm:text-lg leading-relaxed text-foreground/90 font-normal text-left">
          {dynamicContent ? (
            <div className="space-y-4">
              {dynamicContent.split(/\n{2,}/).map((para: string, i: number) => (
                <p key={i} className="whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            </div>
          ) : isBengali ? (
            // বাংলা রিচ টেক্সট কনটেন্ট
            <>
              <p className="text-lg sm:text-xl font-medium leading-relaxed text-foreground first-letter:text-4xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2">
                আমি আলম। শব্দের ভাঁজে ভাঁজে লুকিয়ে থাকা গল্পগুলোর সন্ধানী। সকালের প্রথম আলোয় যখন কাগজ ছোঁয় জানালার গ্রিল ধরে, তখন আমার কলম জেগে ওঠে। এই কলম আর আমি—আমরা দুই বন্ধু, যারা প্রতিদিন নতুন কোনও অজানা ঠিকানায় পৌঁছে দিতে চাই কিছু কথা।
              </p>

              <p>
                আমি বিশ্বাস করি, প্রতিটি মুহূর্তের গভীরে একটা করে কবিতা লুকিয়ে থাকে। রাস্তার ধারে চায়ের দোকানের ফুটন্ত পানির বুদবুদে, বিকেলবেলায় বাড়ি ফেরা কোনো পাখির ডানার ছোঁয়ায়, কিংবা পুরোনো ডায়েরির পাতায় মিলিয়ে যাওয়া কোনো হাতের লেখায়—সবখানেই আছে একেকটি গল্প। আমি শুধু সেগুলোকে খুঁজে নিই, তুলে আনি আলোয়। শব্দ আমার মাধ্যম, আর আবেগ আমার পথচলা।
              </p>

              {/* কোটেশন হাইলাইট কার্ড (Left Aligned) */}
              <div className="my-8 relative overflow-hidden rounded-2xl border-l-4 border-primary border-y border-r border-border/40 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 sm:p-8 shadow-sm text-left">
                <Quote className="absolute -top-2 -left-2 size-16 text-primary/15 pointer-events-none" />
                <p className="relative z-10 text-base sm:text-lg italic font-medium text-foreground/95 leading-relaxed">
                  "শব্দেরও প্রাণ আছে। তুই যদি ঠিকমতো ডাক দিতে শিখিস, তারা নিজেরাই গল্প বলতে আসবে।"
                </p>
              </div>

              <p>
                প্রতিটি লেখাই যেন এক অজানা আত্মার সঙ্গে কথোপকথন। আমি লিখি একা বসে, কিন্তু লেখা শেষে মনে হয়, পুরো বিশ্বটা জুড়ে বসে আছে আমার পাশে।
              </p>

              <p>
                আমি যখন লিখি, সময় থমকে দাঁড়ায়। ঘড়ির কাঁটা চলে, কিন্তু আমি থাকি অন্যখানে—সেই জায়গায় যেখানে স্মৃতি আর কল্পনার সীমানা মিলিয়ে যায়। সেখান থেকে ফিরে আসি কিছু অক্ষরের ঝুলি নিয়ে, কিছু অনুভূতির বস্তা বেঁধে। সেগুলো হয়তো কারও কাজে লাগে, কারও না। কিন্তু লেখাটা শেষ করার পর আমার নিজের একটা অংশ চিরকাল বেঁচে থাকে সেই পাতায়।
              </p>

              <p>
                যারা পড়েন, তারা আমার অজান্তেই আমার সঙ্গী হয়ে যান। তাঁদের চোখের তারায় আমি দেখি আমার লেখার প্রতিফলন। সেটাই আমার পাওয়া। সেটাই আমার প্রাপ্তি।
              </p>

              <p>
                এই পৃষ্ঠাটা আমার ডায়েরির প্রথম পাতা। বাকিটা লেখা হবে একদিন, এক শব্দে, এক গল্পে। যদি আপনি পড়তে পড়তে থেমে যান কোথাও, যদি কোনো বাক্য আপনার ভেতরে দাগ কাটে—তাহলে জেনে রাখবেন, আমার লেখা সফল। কারণ শব্দ তখনই সত্যিকারের হয়, যখন তা কারও না কারও মন স্পর্শ করে।
              </p>

              {/* সমাপনী পরিচয় কার্ড (Left Aligned) */}
              <div className="my-8 rounded-xl border border-primary/25 bg-card/60 p-6 text-left backdrop-blur-sm shadow-sm space-y-2">
                <p className="text-xl sm:text-2xl font-bold text-primary font-['Kaushan_Script',cursive] tracking-wide">
                  আমি আলম। শব্দের লেখক। গল্পের পথিক।
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  আপনার সময় দিয়ে আমার পাতাকে সমৃদ্ধ করার জন্য ধন্যবাদ। চলুন, একসঙ্গে কিছু গল্প বুনি।
                </p>
              </div>
            </>
          ) : (
            // English Rich Text Content
            <>
              <p className="text-lg sm:text-xl font-medium leading-relaxed text-foreground first-letter:text-4xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2">
                I am Alam. A seeker of stories quietly nestled within the folds of words. When the morning’s first light touches the paper through the window sill, my pen awakens. This pen and I—we are two companions journeying together every day, yearning to deliver a few heartfelt words to uncharted destinations.
              </p>

              <p>
                I believe that deep within every single moment, a poem lies hidden. In the simmering bubbles of a roadside tea stall, in the gentle flutter of a bird returning home at dusk, or in the fading ink of a vintage diary—stories reside everywhere. I simply discover them and bring them into the light. Words are my canvas, and emotions are the path I tread.
              </p>

              {/* Quote Card (Left Aligned) */}
              <div className="my-8 relative overflow-hidden rounded-2xl border-l-4 border-primary border-y border-r border-border/40 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 sm:p-8 shadow-sm text-left">
                <Quote className="absolute -top-2 -left-2 size-16 text-primary/15 pointer-events-none" />
                <p className="relative z-10 text-base sm:text-lg italic font-medium text-foreground/95 leading-relaxed">
                  "Words have a soul of their own, Alam. If you learn how to call upon them gently, they will come forward to tell their own tales."
                </p>
              </div>

              <p>
                Every piece of writing is like a quiet conversation with an unseen soul. I write alone, yet when the ink dries, it feels as if the entire universe is seated right beside me.
              </p>

              <p>
                Whenever I write, time seems to pause. The clock ticks forward, but I drift elsewhere—to that ethereal realm where the boundaries of memory and imagination merge into one. I return from there carrying a pouch of letters, carrying a satchel of unspoken emotions. Perhaps they touch someone’s heart, perhaps they drift away unnoticed. But once a piece is completed, a living part of me remains immortalized upon that page forever.
              </p>

              <p>
                Those who read become my silent companions without even realizing it. In the sparkle of their eyes, I glimpse the quiet reflection of my words. That is my true reward. That is my ultimate fulfillment.
              </p>

              <p>
                This page is the opening leaf of my journal. The rest will be written day by day, word by word, story by story. If you ever pause in the middle of a sentence, if a phrase stirs something deep within you—know that my writing has found its true purpose. Because words only truly come alive when they touch someone’s soul.
              </p>

              {/* Closing Identity Card (Left Aligned) */}
              <div className="my-8 rounded-xl border border-primary/25 bg-card/60 p-6 text-left backdrop-blur-sm shadow-sm space-y-2">
                <p className="text-xl sm:text-2xl font-bold text-primary font-['Kaushan_Script',cursive] tracking-wide">
                  I am Alam. A writer of words. A wanderer of stories.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Thank you for gracing my page with your valuable time. Let us weave some stories together.
                </p>
              </div>
            </>
          )}
        </article>

        {/* বটম অ্যাকশন লিংক বাটন (Left Aligned) */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap items-center justify-start gap-4">
          <Button asChild size="lg" className="bg-primary text-primary-foreground font-medium px-6 shadow-md">
            <Link to="/articles" search={{ q: undefined }}>
              <BookOpen className="size-4 mr-2" />
              {isBengali ? "সকল লেখা পড়ুন" : "Read All Posts"}
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="px-6 border-border hover:bg-muted font-medium">
            <Link to="/contact">
              <Mail className="size-4 mr-2 text-primary" />
              {isBengali ? "যোগাযোগ করুন" : "Get In Touch"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
