import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Calendar,
  Lock,
  Eye,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  Mail,
  Globe,
  ArrowLeft,
} from "lucide-react";

import { usePrefs } from "@/lib/prefs";
import { usePage } from "@/components/PageBody";
import { formatArticleContent } from "@/lib/contentFormatter";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://blog.wooniche.com/privacy-policy" }],
    meta: [
      { title: "Privacy Policy - Alam M" },
      {
        name: "description",
        content: "Privacy Policy for Alam M website (blog.wooniche.com). Learn how we handle, protect, and respect your personal information.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blog.wooniche.com/privacy-policy" },
      { property: "og:title", content: "Privacy Policy - Alam M" },
      {
        property: "og:description",
        content: "Privacy Policy for Alam M website (blog.wooniche.com). Learn how we handle, protect, and respect your personal information.",
      },
      { property: "og:image", content: "https://blog.wooniche.com/og-image.png?v=2" },
      { property: "og:image:secure_url", content: "https://blog.wooniche.com/og-image.png?v=2" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Privacy Policy - Alam M" },
      {
        name: "twitter:description",
        content: "Privacy Policy for Alam M website (blog.wooniche.com). Learn how we handle, protect, and respect your personal information.",
      },
      { name: "twitter:image", content: "https://blog.wooniche.com/og-image.png?v=2" },
    ],
  }),
  component: PrivacyPolicyPage,
});

export function PrivacyPolicyPage() {
  const { lang, t } = usePrefs();
  const page = usePage("privacy-policy");

  const isBengali = lang === "bn";
  const dynamicContent = isBengali
    ? page.data?.content_bn || page.data?.content_en
    : page.data?.content_en || page.data?.content_bn;

  return (
    <div className="bg-background text-foreground transition-colors py-10 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        
        {/* ব্যাক লিঙ্ক */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>{isBengali ? "হোমে ফিরে যান" : "Back to Home"}</span>
          </Link>
        </div>

        {/* হেডার / টাইটেল সেকশন */}
        <div className="text-left space-y-4 border-b border-border/60 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{isBengali ? "গোপনীয়তা ও ডেটা সুরক্ষা" : "Privacy & Data Protection"}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5 text-primary/70" />
              <span>{isBengali ? "সর্বশেষ আপডেট: ১৯ নভেম্বর, ২০২৬" : "Last Updated: November 19, 2026"}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-serif">
            {page.data?.title_en && !isBengali
              ? page.data.title_en
              : page.data?.title_bn && isBengali
              ? page.data.title_bn
              : isBengali
              ? "প্রাইভেসি পলিসি"
              : "Privacy Policy"}
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl">
            {isBengali
              ? "আমাদের ওয়েবসাইট ও অফিসিয়াল সোশ্যাল মিডিয়া প্ল্যাটফর্মে আপনার ব্যক্তিগত তথ্যের সুরক্ষা এবং গোপনীয়তা সম্পর্কিত পূর্ণাঙ্গ নীতিমালা।"
              : "Welcome to Alam M. We respect your privacy and are committed to protecting any personal information you share with us."}
          </p>
        </div>

        {/* যদি ডাটাবেস থেকে কোনো কাস্টম রিচ কন্টেন্ট আসে */}
        {dynamicContent && (
          <div
            dangerouslySetInnerHTML={{ __html: formatArticleContent(dynamicContent) }}
            className="prose-reader mt-8 text-base leading-relaxed text-foreground font-serif [&_p]:mb-4"
          />
        )}

        {/* রিচ টেক্সট ফরম্যাটেড ডিফল্ট/বিল্ট-ইন কন্টেন্ট */}
        {!dynamicContent && (
          <div className="mt-8 space-y-8">
            
            {/* স্বাগতম বার্তা ও ভূমিকা কার্ড */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Globe className="size-5 text-primary" />
                <span>{isBengali ? "স্বাগতম ও প্রতিশ্রুতি" : "Welcome & Our Commitment"}</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-foreground/90">
                {isBengali ? (
                  <>
                    <strong>Alam M</strong>-এ আপনাকে স্বাগতম। আমরা আপনার গোপনীয়তাকে সর্বোচ্চ সম্মান জানাই এবং আমাদের ওয়েবসাইট{" "}
                    <a
                      href="https://blog.wooniche.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
                    >
                      blog.wooniche.com
                    </a>{" "}
                    ও আমাদের অফিশিয়াল সোশ্যাল মিডিয়া পেজসমূহের মাধ্যমে আপনার শেয়ার করা যেকোনো ব্যক্তিগত তথ্যের সুরক্ষা নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ।
                  </>
                ) : (
                  <>
                    Welcome to <strong>Alam M</strong>. We respect your privacy and are committed to protecting any personal information you share with us through our website{" "}
                    <a
                      href="https://blog.wooniche.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
                    >
                      https://blog.wooniche.com/
                    </a>{" "}
                    and our official social media pages.
                  </>
                )}
              </p>
            </div>

            {/* পয়েন্ট ১: Information We Collect */}
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:border-border">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  1
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Eye className="size-4.5 text-primary" />
                  <span>{isBengali ? "১. যেসব তথ্য আমরা সংগ্রহ করি" : "1. Information We Collect"}</span>
                </h2>
              </div>

              <div className="mt-4 pl-11 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
                <p>
                  {isBengali
                    ? "আপনি যখন আমাদের ওয়েবসাইট ভিজিট করেন, নিউজলেটারে সাবস্ক্রাইব করেন, কোনো মন্তব্য করেন কিংবা সরাসরি আমাদের সাথে যোগাযোগ করেন, তখন আমরা আপনার নাম, ইমেইল ঠিকানা এবং পাঠানো বার্তার মতো মৌলিক তথ্য সংগ্রহ করতে পারি।"
                    : "When you visit our website, subscribe to our newsletter, leave a comment, or contact us directly, we may collect basic information such as your name, email address, and any message you send us."}
                </p>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 text-xs sm:text-sm text-muted-foreground">
                  <p>
                    {isBengali
                      ? "💡 এছাড়াও আপনার পড়ার অভিজ্ঞতা আরও নিখুঁত ও আরামদায়ক করতে আমরা সাধারণ কুকিজের (Cookies) মাধ্যমে ব্রাউজারের ধরণ ও ডিভাইসের তথ্যের মতো অ-ব্যক্তিগত ডেটা সংগ্রহ করতে পারি।"
                      : "💡 We may also collect non-personal data like browser type and device information through standard cookies to improve your reading experience."}
                  </p>
                </div>
              </div>
            </section>

            {/* পয়েন্ট ২: How We Use Your Information */}
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:border-border">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  2
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-primary" />
                  <span>{isBengali ? "২. সংগৃহীত তথ্যের ব্যবহার" : "2. How We Use Your Information"}</span>
                </h2>
              </div>

              <div className="mt-4 pl-11 text-sm sm:text-base text-foreground/85 leading-relaxed">
                <p>
                  {isBengali
                    ? "আমরা সংগৃহীত তথ্য শুধুমাত্র নিম্নলিখিত সুনির্দিষ্ট উদ্দেশ্যসমূহে ব্যবহার করি:"
                    : "We use the collected information solely to:"}
                </p>

                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <span className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <strong className="text-foreground">{isBengali ? "মন্তব্য ও প্রশ্নের উত্তর প্রদান:" : "Direct Responses:"}</strong>{" "}
                      <span className="text-muted-foreground">
                        {isBengali
                          ? "আপনার পাঠানো মন্তব্য, জিজ্ঞাসা এবং অনুসন্ধানের দ্রুত জবাব দেওয়া।"
                          : "Respond to your comments, questions, and inquiries."}
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <span className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <strong className="text-foreground">{isBengali ? "আপডেট ও সাহিত্যিক কনটেন্ট শেয়ার:" : "Content & Updates:"}</strong>{" "}
                      <span className="text-muted-foreground">
                        {isBengali
                          ? "আপনি সাবস্ক্রাইব করতে চাইলে নতুন আপডেট, আর্টিকেল, গল্প এবং কুরআনিক গবেষণামূলক কনটেন্ট সরাসরি ইমেইলে পৌঁছে দেওয়া।"
                          : "Share updates, articles, stories, and Quranic research content if you choose to subscribe."}
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <span className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <strong className="text-foreground">{isBengali ? "সাইট অভিজ্ঞতা উন্নয়ন:" : "Experience Optimization:"}</strong>{" "}
                      <span className="text-muted-foreground">
                        {isBengali
                          ? "আমাদের ওয়েবসাইটের মান এবং ব্যবহারকারীদের পড়ার অভিজ্ঞতা প্রতিনিয়ত উন্নত করা।"
                          : "Improve the quality and user experience of our website and content."}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* পয়েন্ট ৩: Data Sharing and Security */}
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:border-border">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  3
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Lock className="size-4.5 text-primary" />
                  <span>{isBengali ? "৩. তথ্য শেয়ারিং ও নিরাপত্তা" : "3. Data Sharing and Security"}</span>
                </h2>
              </div>

              <div className="mt-4 pl-11 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-600 dark:text-emerald-400 font-medium">
                  {isBengali
                    ? "✓ আমরা কোনো অবস্থাতেই আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি, লেনদেন বা ভাড়া দিই না।"
                    : "✓ We do not sell, trade, or rent your personal information to third parties."}
                </div>
                <p className="text-muted-foreground text-sm">
                  {isBengali
                    ? "আপনার তথ্যের সর্বোচ্চ নিরাপত্তা বজায় রাখতে আমরা প্রয়োজনীয় সকল কার্যকর ব্যবস্থা গ্রহণ করি। তবে মনে রাখা জরুরি, ইন্টারনেটে কোনো ডেটা আদান-প্রদান পদ্ধতিই শতভাগ ঝুঁকিমুক্ত নয়।"
                    : "We take reasonable measures to keep your information secure, though no method of transmission over the internet is 100% secure."}
                </p>
              </div>
            </section>

            {/* পয়েন্ট ৪: Third-Party Links */}
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:border-border">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  4
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <ExternalLink className="size-4.5 text-primary" />
                  <span>{isBengali ? "৪. তৃতীয় পক্ষের লিংক" : "4. Third-Party Links"}</span>
                </h2>
              </div>

              <div className="mt-4 pl-11 text-sm sm:text-base text-foreground/85 leading-relaxed">
                <p>
                  {isBengali
                    ? "আমাদের ওয়েবসাইট এবং সোশ্যাল মিডিয়া পোস্টগুলোতে বিভিন্ন বাহ্যিক সাইটের (যেমন: ইউটিউব, ফেসবুক বা রেফারেন্স উপকরণ) লিংক থাকতে পারে। সেইসব বহিরাগত ওয়েবসাইটের গোপনীয়তা নীতি কিংবা কনটেন্টের ব্যাপারে আমরা দায়বদ্ধ নই।"
                    : "Our website and social media posts may contain links to external sites (such as YouTube, Facebook, or reference materials). We are not responsible for the privacy practices or content of those external websites."}
                </p>
              </div>
            </section>

            {/* পয়েন্ট ৫: Your Consent and Rights */}
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:border-border">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  5
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <UserCheck className="size-4.5 text-primary" />
                  <span>{isBengali ? "৫. আপনার সম্মতি ও অধিকার" : "5. Your Consent and Rights"}</span>
                </h2>
              </div>

              <div className="mt-4 pl-11 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
                <p>
                  {isBengali
                    ? "আমাদের ওয়েবসাইট ব্যবহারের মাধ্যমে আপনি এই প্রাইভেসি পলিসির প্রতি সম্মতি প্রকাশ করছেন।"
                    : "By using our website, you consent to this Privacy Policy."}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isBengali
                    ? "যেকোনো সময় আমাদের সাথে যোগাযোগ করে আপনার ব্যক্তিগত তথ্য দেখার, সংশোধন করার কিংবা ডেটাবেস থেকে স্থায়ীভাবে মুছে ফেলার পূর্ণ অধিকার আপনার রয়েছে।"
                    : "You have the right to request access to, correction of, or deletion of your personal information at any time by contacting us."}
                </p>
              </div>
            </section>

            {/* পয়েন্ট ৬: Contact Us */}
            <section className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  6
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Mail className="size-4.5 text-primary" />
                  <span>{isBengali ? "৬. যোগাযোগ" : "6. Contact Us"}</span>
                </h2>
              </div>

              <div className="mt-4 pl-11 text-sm sm:text-base text-foreground/85 leading-relaxed">
                <p>
                  {isBengali
                    ? "এই প্রাইভেসি পলিসি সম্পর্কে আপনার কোনো প্রশ্ন, জিজ্ঞাসা বা মতামত থাকলে সরাসরি আমাদের সাথে যোগাযোগ করুন:"
                    : "If you have any questions about this Privacy Policy, please contact us at:"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a
                    href="mailto:me@wooniche.com"
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 transition-all hover:border-primary/50 hover:bg-primary/5 group"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isBengali ? "অফিশিয়াল ইমেইল" : "Official Email"}</p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        me@wooniche.com
                      </p>
                    </div>
                  </a>

                  <a
                    href="https://blog.wooniche.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 transition-all hover:border-primary/50 hover:bg-primary/5 group"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <Globe className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isBengali ? "অফিশিয়াল ওয়েবসাইট" : "Official Website"}</p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        https://blog.wooniche.com/
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
}
