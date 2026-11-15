import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Terminal,
  Cpu,
  Globe,
  Database,
  Cloud,
  Zap,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  GitBranch,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";

import { usePrefs } from "@/lib/prefs";
import { usePage } from "@/components/PageBody";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tech-tips")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://blog.wooniche.com/tech-tips" }],
    meta: [
      {
        title:
          "টেক টিপস: Antigravity, GitHub, Cloudflare D1 ও Workers নির্দেশিকা - Alam M",
      },
      {
        name: "description",
        content:
          "Antigravity, GitHub, Cloudflare D1 ও Workers দিয়ে আধুনিক ফুল-স্ট্যাক ওয়েবসাইট তৈরির পূর্ণাঙ্গ নির্দেশিকা।",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://blog.wooniche.com/tech-tips" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:title",
        content:
          "টেক টিপস: Antigravity, GitHub, Cloudflare D1 ও Workers নির্দেশিকা - Alam M",
      },
      {
        property: "og:description",
        content:
          "সার্ভারলেস এজ কম্পিউটিং ও এআই কোডিং অ্যাসিস্ট্যান্ট দিয়ে ফুল-স্ট্যাক ওয়েবসাইট তৈরির হ্যান্ডস-অন গাইড।",
      },
      {
        property: "og:image",
        content:
          "https://blog.wooniche.com/og/articles/antigravity-github-cloudflare-d1-workers-guide.png",
      },
      {
        property: "og:image:secure_url",
        content:
          "https://blog.wooniche.com/og/articles/antigravity-github-cloudflare-d1-workers-guide.png",
      },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        name: "twitter:image",
        content:
          "https://blog.wooniche.com/og/articles/antigravity-github-cloudflare-d1-workers-guide.png",
      },
    ],
  }),
  component: TechTipsPage,
});

function CopyCodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-border/80 bg-slate-950 text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-primary" />
          <span className="font-mono text-muted-foreground">{title || "Terminal"}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400">কপি হয়েছে</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>কপি করুন</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs sm:text-sm font-mono leading-relaxed text-slate-100 selection:bg-primary/30">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TechTipsPage() {
  const { lang, t } = usePrefs();
  const page = usePage("tech-tips");

  const isBn = lang === "bn";

  return (
    <div className="bg-background text-foreground transition-colors py-8 sm:py-14 md:py-18">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        {/* ব্রেডক্রাম্ব */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-medium">{isBn ? "টেক টিপস" : "Tech Tips"}</span>
        </nav>

        {/* হেডার ও ব্যাজ */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium tracking-wide text-primary shadow-sm">
              <Cpu className="size-3.5 text-primary" />
              {isBn ? "প্রযুক্তি ও নির্দেশিকা" : "Tech & Guides"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              <Zap className="size-3 text-amber-500" />
              {isBn ? "৮ মিনিট পাঠ" : "8 min read"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {isBn ? "১৫ নভেম্বর ২০২৬" : "15 November 2026"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {isBn
              ? "Antigravity, GitHub, Cloudflare D1 ও Workers দিয়ে আধুনিক ফুল-স্ট্যাক ওয়েবসাইট তৈরির পূর্ণাঙ্গ নির্দেশিকা"
              : "Complete Guide to Building Modern Full-Stack Websites with Antigravity, GitHub, Cloudflare D1 & Workers"}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {isBn
              ? "বর্তমান সময়ে ওয়েবসাইট তৈরি এবং তা গ্লোবাল লেভেলে ডেপ্লয় করার প্রক্রিয়া আগের চেয়ে অনেক বেশি সহজ ও স্মার্ট হয়ে গেছে। ঐতিহ্যবাহী সার্ভার বা জটিল হোস্টিং কনফিগারেশনের দিন শেষ।"
              : "Building and deploying modern websites globally has become faster, smarter, and simpler than ever. Traditional expensive servers and complex hosting setups are no longer required."}
          </p>
        </header>

        {/* পরিচিতি কলআউট */}
        <div className="my-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-5 sm:p-6 shadow-sm">
          <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
            {isBn ? (
              <>
                আজকে আমরা দেখব কিভাবে <strong className="text-primary font-semibold">Antigravity</strong> এআই কোডিং অ্যাসিস্ট্যান্টের সাহায্য নিয়ে, <strong className="text-primary font-semibold">GitHub</strong>-কে সোর্স কন্ট্রোল হিসেবে ব্যবহার করে এবং <strong className="text-primary font-semibold">Cloudflare D1 (SQLite)</strong> ও <strong className="text-primary font-semibold">Cloudflare Workers & Pages</strong>-এর মাধ্যমে একটি ফুল-স্ট্যাক ওয়েবসাইট খুব সহজে তৈরি ও লাইভ করা যায়।
              </>
            ) : (
              <>
                Today, we explore how to build and launch a high-performance full-stack web application combining the power of the <strong className="text-primary font-semibold">Antigravity</strong> AI coding assistant, <strong className="text-primary font-semibold">GitHub</strong> version control, <strong className="text-primary font-semibold">Cloudflare D1 (Edge SQLite)</strong>, and <strong className="text-primary font-semibold">Cloudflare Workers & Pages</strong>.
              </>
            )}
          </p>
        </div>

        {/* সেকশন ১: প্রযুক্তি পরিচিতি */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm font-semibold">
              ১
            </span>
            {isBn
              ? "প্রযুক্তি পরিচিতি: কেন এই কম্বিনেশনটি অসাধারণ?"
              : "Tech Overview: Why This Modern Stack Shines"}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-primary mb-1.5 text-sm sm:text-base">
                <Cpu className="size-4 shrink-0" />
                <span>Antigravity</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isBn
                  ? "একটি শক্তিশালী এআই কোডিং টুল যা আপনার কোড লিখে দেওয়া, লজিক সাজানো এবং ক্লাউড কনফিগারেশন তৈরিতে জাদুকরি ভূমিকা পালন করে।"
                  : "An advanced agentic AI coding companion that writes code, scaffold architectures, handles debugging, and assists in cloud orchestration."}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-primary mb-1.5 text-sm sm:text-base">
                <GitBranch className="size-4 shrink-0" />
                <span>GitHub</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isBn
                  ? "আপনার প্রোজেক্টের কোড সুরক্ষিত রাখতে এবং ক্লাউডের সাথে অটো-ডেপ্লয়মেন্ট পাইপলাইন তৈরি করতে নির্ভরযোগ্য ভার্সন কন্ট্রোল।"
                  : "Industry-standard Git hosting for code security, version control, and automated CI/CD continuous deployment triggers."}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-primary mb-1.5 text-sm sm:text-base">
                <Globe className="size-4 shrink-0" />
                <span>Cloudflare Pages & Workers</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isBn
                  ? "ফ্রন্টএন্ড এবং সার্ভারলেস ব্যাকএন্ড একসাথে রান করার জন্য বিশ্বমানের একটি এজ প্ল্যাটফর্ম, যা সম্পূর্ণ ফ্রি টিয়ারে দুর্দান্ত গতি দেয়।"
                  : "World-class serverless edge network executing SSR frontend and dynamic API routes within milliseconds across 300+ global cities."}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-primary mb-1.5 text-sm sm:text-base">
                <Database className="size-4 shrink-0" />
                <span>Cloudflare D1 (SQLite)</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isBn
                  ? "একদম লাইটওয়েট, সার্ভারলেস এসকিউএল ডাটাবেস, যা ক্লাউডের এজেই অত্যন্ত দ্রুত ডাটা রিড ও রাইট করতে পারে।"
                  : "Native serverless relational SQLite database colocated with Workers for lightning-fast querying with zero connection overhead."}
              </p>
            </div>
          </div>
        </section>

        {/* সেকশন ২: ওয়েবসাইট তৈরির ধাপসমূহ */}
        <section className="mt-12 space-y-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm font-semibold">
              ২
            </span>
            {isBn ? "ওয়েবসাইট তৈরির ধাপসমূহ (Step-by-Step Guide)" : "Step-by-Step Implementation Guide"}
          </h2>

          {/* ধাপ ১ */}
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                {isBn ? "ধাপ ১" : "Step 1"}
              </span>
              {isBn
                ? "Antigravity-এর সাহায্যে প্রোজেক্ট স্ক্যাফোল্ডিং ও কোড তৈরি"
                : "Project Scaffolding & Code Generation with Antigravity"}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
              {isBn
                ? "প্রথমে আপনার লোকাল কম্পিউটারে একটি নতুন ফোল্ডার তৈরি করুন এবং Antigravity এআই অ্যাসিস্ট্যান্টকে আপনার আইডি বা টার্মিনালের মাধ্যমে যুক্ত করুন।"
                : "Create a fresh working directory on your local workstation and initialize your project with the Antigravity agentic environment."}
            </p>

            <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
              {isBn
                ? "Antigravity-কে আপনার ওয়েবসাইটের আইডিয়া দিন। যেমন, আপনি তাকে বলতে পারেন:"
                : "Provide Antigravity with your application concept. For example, instruct:"}
            </p>

            <blockquote className="border-l-4 border-primary bg-background/80 px-4 py-3 rounded-r-lg italic text-sm text-foreground/90">
              {isBn
                ? '"আমি React, TypeScript, Tailwind CSS এবং Cloudflare Workers ব্যাকএন্ডযুক্ত একটি ডায়নামিক ব্লগ/পোর্টফোলিও ওয়েবসাইট বানাতে চাই। যেখানে Cloudflare D1 ডাটাবেস যুক্ত থাকবে।"'
                : '"I want to build a dynamic blog website with React, TypeScript, Tailwind CSS, and Cloudflare Workers SSR, backed by a Cloudflare D1 SQLite database."'}
            </blockquote>

            <p className="text-sm text-muted-foreground">
              {isBn
                ? "Antigravity মুহূর্তের মধ্যে আপনার জন্য পুরো প্রোজেক্টের স্ট্রাকচার, প্রয়োজনীয় কম্পোনেন্টস এবং রাউটিং তৈরি করে দেবে।"
                : "Antigravity immediately constructs your application directory, type contracts, route tree, and responsive component UI."}
            </p>
          </div>

          {/* ধাপ ২ */}
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                {isBn ? "ধাপ ২" : "Step 2"}
              </span>
              {isBn ? "Cloudflare D1 ডাটাবেস কনফিগারেশন" : "Cloudflare D1 Database Provisioning"}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
              {isBn
                ? "ওয়েবসাইটে যদি ইউজার কমেন্ট, আর্টিকেল বা কোনো ডাটাকল বা ফর্ম সাবমিশনের ব্যবস্থা থাকে, তবে ডাটাবেস দরকার। Cloudflare D1 হলো এজ-ভিত্তিক SQLite ডাটাবেস।"
                : "When your web application manages dynamic data like articles, user comments, or forms, Cloudflare D1 provides robust relational edge persistence."}
            </p>

            <div className="space-y-2 pt-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {isBn ? "১. Wrangler CLI ব্যবহার করে লোকালি D1 ডাটাবেস তৈরি করুন:" : "1. Create the D1 database using Wrangler CLI:"}
              </p>
              <CopyCodeBlock code="npx wrangler d1 create my-website-db" title="Create D1 Database" />
            </div>

            <p className="text-xs sm:text-sm text-foreground/85">
              {isBn
                ? "২. প্রাপ্ত ডাটাবেস আইডি আপনার প্রোজেক্টের wrangler.toml ফাইলে যুক্ত করুন। Antigravity-কে বললেই সে আপনার কনফিগারেশন ফাইলটি স্বয়ংক্রিয়ভাবে সাজিয়ে দেবে।"
                : "2. Paste the generated database binding ID into your wrangler.toml file under [[d1_databases]]. Antigravity can configure this automatically."}
            </p>

            <div className="space-y-2 pt-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {isBn
                  ? "৩. ডাটাবেসের টেবিল স্কিমা তৈরি করার জন্য একটি .sql ফাইল তৈরি করুন এবং লোকালি টেস্ট করুন:"
                  : "3. Write your table definitions into a schema.sql file and execute locally:"}
              </p>
              <CopyCodeBlock code="npx wrangler d1 execute my-website-db --local --file=./schema.sql" title="Local D1 Migration" />
            </div>
          </div>

          {/* ধাপ ৩ */}
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                {isBn ? "ধাপ ৩" : "Step 3"}
              </span>
              {isBn ? "GitHub-এ কোড পুশ করা (Repository Setup)" : "Pushing Code to GitHub"}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
              {isBn
                ? "প্রোজেক্টের কোড লোকালি পুরোপুরি তৈরি হয়ে গেলে সেটিকে GitHub-এ আপলোড করতে হবে যাতে ক্লাউডফ্লেয়ার সেখান থেকে অটো-ডেপ্লয় করতে পারে।"
                : "Once your local build is verified, publish the repository to GitHub to link Cloudflare's continuous deployment pipeline."}
            </p>

            <CopyCodeBlock
              code={`git init
git add .
git commit -m "Initial commit with Antigravity"
git branch -M main
git remote add origin https://github.com/your-username/my-edge-website.git
git push -u origin main`}
              title="Git Commands"
            />
          </div>

          {/* ধাপ ৪ */}
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                {isBn ? "ধাপ ৪" : "Step 4"}
              </span>
              {isBn ? "Cloudflare Pages ও Workers-এ ডেপ্লয়মেন্ট" : "Deploying on Cloudflare Pages & Workers"}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
              {isBn ? "আপনার প্রজেক্ট গিটহাবে চলে যাওয়ার পর এটিকে লাইভ করার পালা:" : "Connect your GitHub repository to Cloudflare:"}
            </p>

            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-foreground/90 pl-1 leading-relaxed">
              <li>{isBn ? "আপনার Cloudflare Dashboard-এ লগইন করুন।" : "Log into your Cloudflare Dashboard."}</li>
              <li>
                {isBn
                  ? "বাম দিক থেকে Workers & Pages অপশনে গিয়ে Create application বাটনে ক্লিক করুন এবং Pages ট্যাবে গিয়ে Connect to Git সিলেক্ট করুন।"
                  : "Navigate to Workers & Pages > Create application > Pages > Connect to Git."}
              </li>
              <li>
                {isBn
                  ? "আপনার গিটহাব অ্যাকাউন্ট কানেক্ট করে কাঙ্ক্ষিত রিপোজিটরি (my-edge-website) সিলেক্ট করুন।"
                  : "Select your GitHub repository (e.g., my-edge-website)."}
              </li>
              <li>
                {isBn ? (
                  <>
                    <strong>Build Settings</strong>-এ Framework preset: Vite / React, Build command: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">npm run build</code>, Build output directory: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">dist</code> নির্বাচন করুন।
                  </>
                ) : (
                  <>
                    Set Framework preset to Vite/React, Build command to <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">npm run build</code>, and output directory to <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">dist</code>.
                  </>
                )}
              </li>
              <li>
                {isBn
                  ? "Save and Deploy বাটনে ক্লিক করুন। ব্যস! কয়েক সেকেন্ডের মধ্যে Cloudflare আপনার সাইটটিকে বিশ্বব্যাপী ছড়িয়ে দেবে।"
                  : "Click Save and Deploy. Cloudflare provisions and distributes your website across its global edge network."}
              </li>
            </ol>
          </div>

          {/* ধাপ ৫ */}
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                {isBn ? "ধাপ ৫" : "Step 5"}
              </span>
              {isBn ? "D1 ডাটাবেস প্রোডাকশনে মাইগ্রেট করা" : "Production D1 Remote Database Migration"}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
              {isBn
                ? "লোকাল এনভায়রনমেন্ট সফলভাবে কাজ করার পর প্রোডাকশন ডাটাবেসে স্কিমা রান করতে হবে:"
                : "Execute your SQL schema migration against the remote production database:"}
            </p>

            <CopyCodeBlock code="npx wrangler d1 execute my-website-db --remote --file=./schema.sql" title="Production Migration" />

            <p className="text-xs sm:text-sm text-muted-foreground">
              {isBn
                ? "এর মাধ্যমে আপনার লাইভ সাইট এখন ক্লাউডফ্লেয়ারের রিমোট D1 ডাটাবেস থেকে রিয়েল-টাইমে ডেটা আদান-প্রদান করতে পারবে।"
                : "Your live application can now seamlessly read and write data to the remote D1 database with ultra-low latency."}
            </p>
          </div>
        </section>

        {/* সেকশন ৩: সুবিধা সমূহ */}
        <section className="mt-12 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm font-semibold">
              ৩
            </span>
            {isBn ? "এই কাঠামোর মূল সুবিধাসমূহ" : "Key Architectural Advantages"}
          </h2>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                  {isBn ? "বিনা খরচে দুর্দান্ত পারফরম্যান্স" : "Cost-Free High Performance"}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isBn
                    ? "Cloudflare-এর ফ্রি টিয়ারে হিউজ রিকোয়েস্ট এবং ডাটাবেস অপারেশন সম্পূর্ণ বিনামূল্যে পাওয়া যায়।"
                    : "Generous free tier allowances provide high request volumes, bandwidth, and database rows without recurring cloud bills."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="mt-0.5 rounded-lg bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
                <Zap className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                  {isBn ? "জিরো লেটেন্সি (Zero Latency)" : "Zero-Hop Edge Latency"}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isBn
                    ? "যেহেতু ডাটাবেস এবং কোড দুটিই ইউজারের সবচেয়ে কাছের এজ লোকেশনে রান করে, তাই সাইট লোড হয় চোখের পলকে।"
                    : "Code execution and database reads run directly at the closest Cloudflare data center to the end user for sub-50ms responses."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <Cpu className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                  {isBn ? "এআই চালিত মেইনটেনেন্স" : "AI-Assisted Maintenance"}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isBn
                    ? "কোডে কোনো বাগ দেখা দিলে বা নতুন ফিচার (যেমন: সার্চ বক্স, ইউজার অথেন্টিকেশন ইত্যাদি) যুক্ত করতে চাইলে আপনি খুব সহজেই Antigravity-এর সাহায্য নিতে পারেন।"
                    : "Rapidly add new features, refactor schemas, or fix bugs by pairing directly with Antigravity inside your workflow."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* উপসংহার */}
        <footer className="mt-12 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/30 p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {isBn ? "উপসংহার" : "Conclusion"}
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            {isBn
              ? "প্রথাগত হোস্টিংয়ের ঝামেলা এড়িয়ে আধুনিক সার্ভারলেস প্রযুক্তির ছোঁয়া পেতে Antigravity, GitHub এবং Cloudflare-এর এই মেলবন্ধন দারুণ একটি অভিজ্ঞতা। আজই আপনার আইডিয়াকে বাস্তবে রূপ দিন এবং বিশ্ববাসীর সামনে তুলে ধরুন আপনার নিজস্ব এজ-পাওয়ার্ড ওয়েবসাইট!"
              : "Bypassing the complexities of traditional servers with modern serverless architecture, Antigravity, GitHub, and Cloudflare form an unbeatable developer stack. Bring your ideas to life today with an edge-powered website!"}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 shadow-sm"
            >
              <BookOpen className="size-4" />
              {isBn ? "অন্যান্য লেখালেখি পড়ুন" : "Read More Articles"}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {isBn ? "লেখককে মতামত পাঠান" : "Send Feedback"}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
