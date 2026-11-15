import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Download,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/tech-tips")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://blog.wooniche.com/tech-tips" }],
    meta: [
      {
        title:
          "Antigravity, GitHub, Cloudflare D1 ও Workers দিয়ে আধুনিক ফুল-স্ট্যাক ওয়েবসাইট তৈরির পূর্ণাঙ্গ নির্দেশিকা - টেক টিপস",
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
          "Antigravity, GitHub, Cloudflare D1 ও Workers দিয়ে আধুনিক ফুল-স্ট্যাক ওয়েবসাইট তৈরির পূর্ণাঙ্গ নির্দেশিকা",
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

function SourcePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 text-[11px] font-sans font-medium text-zinc-400 ml-2 align-middle select-none shadow-2xs">
      {label}
    </span>
  );
}

function HollowBullet() {
  return (
    <span className="inline-block size-2 rounded-full border border-zinc-400 mr-2.5 shrink-0 align-middle" />
  );
}

function ClickableCodeBlock({
  code,
  language = "Bash",
  fileName = "command.sh",
  children,
}: {
  code: string;
  language?: string;
  fileName?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("কমান্ড কপি করা হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([code + "\n"], { type: "text/x-sh;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${fileName} ডাউনলোড হয়েছে`);
  };

  return (
    <div
      onClick={handleCopy}
      title="ক্লিক করে কমান্ড কপি করুন"
      className="group relative my-4 overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#141417] text-zinc-100 shadow-md transition-all hover:border-zinc-700 hover:shadow-lg cursor-pointer"
    >
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#1c1c22] px-4 py-2.5">
        <span className="text-xs font-semibold tracking-wide text-zinc-300 font-sans">
          {language}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download script"
            title="স্ক্রিপ্ট ফাইল ডাউনলোড করুন"
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Download className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy code"}
            title="ক্লিক করে কপি করুন"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <pre className="overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-zinc-100 selection:bg-primary/30">
          <code>{children || code}</code>
        </pre>
      </div>
    </div>
  );
}

function TechTipsPage() {
  const { lang, t } = usePrefs();
  const isBn = lang === "bn";

  return (
    <div className="bg-[#111113] text-zinc-100 min-h-screen py-8 sm:py-14 md:py-16 transition-colors">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        {/* ব্রেডক্রাম্ব */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-zinc-400">
          <Link to="/" className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <ChevronRight className="size-3.5 text-zinc-500" />
          <span className="text-zinc-200 font-medium">{isBn ? "টেক টিপস" : "Tech Tips"}</span>
        </nav>

        {/* হেডিং */}
        <h1 className="text-2xl sm:text-3xl md:text-[34px] font-bold tracking-tight text-zinc-100 leading-snug">
          {isBn
            ? "Antigravity, GitHub, Cloudflare D1 ও Workers দিয়ে আধুনিক ফুল-স্ট্যাক ওয়েবসাইট তৈরির পূর্ণাঙ্গ নির্দেশিকা"
            : "Complete Guide to Building Modern Full-Stack Websites with Antigravity, GitHub, Cloudflare D1 & Workers"}
        </h1>

        {/* পরিচিতি প্যারাগ্রাফ */}
        <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-zinc-300 font-sans">
          <p>
            {isBn
              ? "বর্তমান সময়ে ওয়েবসাইট তৈরি এবং তা গ্লোবাল লেভেলে ডেপ্লয় করার প্রক্রিয়া আগের চেয়ে অনেক বেশি সহজ ও স্মার্ট হয়ে গেছে। ঐতিহ্যবাহী সার্ভার বা জটিল হোস্টিং কনফিগারেশনের দিন শেষ। এখন আধুনিক এআই টুলস এবং এজ কম্পিউটিংয়ের (Edge Computing) যুগে আপনি খুব কম সময়ে অত্যন্ত সুরক্ষিত ও দ্রুতগতির ওয়েবসাইট তৈরি করতে পারেন।"
              : "Building and deploying web applications globally has become faster, smarter, and simpler than ever. The era of traditional costly servers and complex hosting setups is over. With modern AI tools and edge computing, you can now launch secure and ultra-fast websites in minimal time."}
          </p>
          <p>
            {isBn
              ? "আজকে আমরা দেখব কিভাবে Antigravity এআই কোডিং অ্যাসিস্ট্যান্টের সাহায্য নিয়ে, GitHub-কে সোর্স কন্ট্রোল হিসেবে ব্যবহার করে এবং Cloudflare D1 (SQLite) ও Cloudflare Workers & Pages-এর মাধ্যমে একটি ফুল-স্ট্যাক ওয়েবসাইট খুব সহজে তৈরি ও লাইভ করা যায়।"
              : "Today, we explore how to build and launch a full-stack web application with the Antigravity AI assistant, GitHub source control, Cloudflare D1 (SQLite), and Cloudflare Workers & Pages."}
          </p>
        </div>

        {/* ১. প্রযুক্তি পরিচিতি */}
        <section className="mt-10">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mb-4">
            {isBn
              ? "১. প্রযুক্তি পরিচিতি: কেন এই কম্বিনেশনটি অসাধারণ?"
              : "1. Technology Overview: Why This Stack Shines"}
          </h2>
          <ul className="space-y-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            <li className="flex items-start">
              <HollowBullet />
              <div>
                <strong className="text-zinc-100">Antigravity:</strong>{" "}
                {isBn
                  ? "এটি একটি শক্তিশালী এআই কোডিং টুল যা আপনার কোড লিখে দেওয়া, লজিক সাজানো এবং ক্লাউড কনফিগারেশন তৈরিতে জাদুকরি ভূমিকা পালন করে।"
                  : "An advanced AI coding companion that writes code, shapes application logic, and scaffolds cloud infrastructure."}
                <SourcePill label="GitHub" />
              </div>
            </li>
            <li className="flex items-start">
              <HollowBullet />
              <div>
                <strong className="text-zinc-100">GitHub:</strong>{" "}
                {isBn
                  ? "আপনার প্রোজেক্টের কোড সুরক্ষিত রাখতে এবং ক্লাউডের সাথে অটো-ডেপ্লয়মেন্ট পাইপলাইন তৈরি করতে ভার্সন কন্ট্রোল।"
                  : "Reliable version control that keeps your code safe and automates cloud deployment triggers."}
                <SourcePill label="Composio" />
              </div>
            </li>
            <li className="flex items-start">
              <HollowBullet />
              <div>
                <strong className="text-zinc-100">Cloudflare Pages & Workers:</strong>{" "}
                {isBn
                  ? "ফ্রন্টএন্ড এবং সার্ভারলেস ব্যাকএন্ড একসাথে রান করার জন্য বিশ্বমানের একটি এজ প্ল্যাটফর্ম, যা সম্পূর্ণ ফ্রি টিয়ারে দুর্দান্ত গতি দেয়।"
                  : "A global edge platform executing frontend and serverless backend code with blazing speed on a generous free tier."}
                <SourcePill label="GitHub" />
              </div>
            </li>
            <li className="flex items-start">
              <HollowBullet />
              <div>
                <strong className="text-zinc-100">Cloudflare D1 (SQLite):</strong>{" "}
                {isBn
                  ? "একদম লাইটওয়েট, সার্ভারলেস এসকিউএল ডাটাবেস, যা ক্লাউডের এজেই অত্যন্ত দ্রুত ডাটা রিড ও রাইট করতে পারে।"
                  : "A lightweight, serverless relational SQLite database that queries at the edge with ultra-low latency."}
                <SourcePill label="GitHub" />
              </div>
            </li>
          </ul>
        </section>

        {/* ২. ওয়েবসাইট তৈরির ধাপসমূহ */}
        <section className="mt-12 space-y-8">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
            {isBn
              ? "২. ওয়েবসাইট তৈরির ধাপসমূহ (Step-by-Step Guide)"
              : "2. Website Building Steps (Step-by-Step Guide)"}
          </h2>

          {/* ধাপ ১ */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              {isBn
                ? "ধাপ ১: Antigravity-এর সাহায্যে প্রোজেক্ট স্ক্যাফোল্ডিং ও কোড তৈরি"
                : "Step 1: Project Scaffolding & Code Generation with Antigravity"}
              <SourcePill label="GitHub" />
            </h3>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "প্রথমে আপনার লোকাল কম্পিউটারে একটি নতুন ফোল্ডার তৈরি করুন এবং Antigravity এআই অ্যাসিস্ট্যান্টকে আপনার আইডি বা টার্মিনালের মাধ্যমে যুক্ত করুন।"
                : "First create a new folder on your computer and connect the Antigravity assistant through your IDE or terminal."}
            </p>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "Antigravity-কে আপনার ওয়েবসাইটের আইডিয়া দিন। যেমন, আপনি তাকে বলতে পারেন:"
                : "Provide Antigravity with your project concept. For example, instruct:"}
            </p>
            <div className="my-3 border-l-2 border-dashed border-zinc-600 pl-4 py-1 text-sm sm:text-base text-zinc-300 font-mono italic leading-relaxed">
              {isBn
                ? '"আমি React, TypeScript, Tailwind CSS এবং Cloudflare Workers ব্যাকএন্ডযুক্ত একটি ডায়নামিক ব্লগ/পোর্টফোলিও ওয়েবসাইট বানাতে চাই। যেখানে Cloudflare D1 ডাটাবেস যুক্ত থাকবে।"'
                : '"I want to build a dynamic blog website with React, TypeScript, Tailwind CSS, and Cloudflare Workers SSR, backed by a Cloudflare D1 SQLite database."'}
            </div>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "Antigravity মুহূর্তের মধ্যে আপনার জন্য পুরো প্রোজেক্টের স্ট্রাকচার, প্রয়োজনীয় কম্পোনেন্টস এবং রাউটিং তৈরি করে দেবে।"
                : "Antigravity will instantly generate your project structure, necessary components, and route tree."}
            </p>
          </div>

          {/* ধাপ ২ */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              {isBn
                ? "ধাপ ২: Cloudflare D1 ডাটাবেস কনফিগারেশন"
                : "Step 2: Cloudflare D1 Database Configuration"}
              <SourcePill label="Cloudflare" />
            </h3>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "ওয়েবসাইটে যদি ইউজার কমেন্ট, আর্টিকেলের ডেটা বা কোনো ফর্ম সাবমিশনের ব্যবস্থা থাকে, তবে ডাটাবেস দরকার। Cloudflare D1 হলো এজ-ভিত্তিক SQLite ডাটাবেস।"
                : "If your website accepts comments, articles, or form data, a database is required. Cloudflare D1 provides edge-based SQLite persistence."}
              <SourcePill label="GitHub + 1" />
            </p>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed pt-1">
              {isBn
                ? "1. Wrangler CLI ব্যবহার করে লোকালি D1 ডাটাবেস তৈরি করুন:"
                : "1. Create the D1 database locally using Wrangler CLI:"}
              <SourcePill label="GitHub" />
            </p>
            <ClickableCodeBlock
              code="npx wrangler d1 create my-website-db"
              fileName="d1-create.sh"
            >
              <span>npx wrangler d1 create my-website-db</span>
            </ClickableCodeBlock>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn ? (
                <>
                  2. প্রাপ্ত ডাটাবেস আইডি আপনার প্রোজেক্টের{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                    wrangler.toml
                  </code>{" "}
                  ফাইলে যুক্ত করুন। Antigravity-কে বললেই সে আপনার কনফিগারেশন ফাইলটি স্বয়ংক্রিয়ভাবে সাজিয়ে দেবে।
                </>
              ) : (
                <>
                  2. Add the generated database ID to your{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                    wrangler.toml
                  </code>{" "}
                  file. Antigravity can configure this automatically.
                </>
              )}
            </p>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed pt-1">
              {isBn ? (
                <>
                  3. ডাটাবেসের টেবিল স্কিমা তৈরি করার জন্য একটি{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                    .sql
                  </code>{" "}
                  ফাইল তৈরি করুন এবং Antigravity-কে দিয়ে টেবিল তৈরির কোড লিখিয়ে নিন। এরপর কমান্ড দিয়ে তা ডেপ্লয় করুন:
                </>
              ) : (
                <>
                  3. Create a{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                    .sql
                  </code>{" "}
                  file for your schema and deploy it with this command:
                </>
              )}
            </p>
            <ClickableCodeBlock
              code="npx wrangler d1 execute my-website-db --local --file=./schema.sql"
              fileName="d1-local.sh"
            >
              <span>
                npx wrangler d1 execute my-website-db{" "}
                <span className="text-amber-400">--local</span>{" "}
                <span className="text-amber-400">--file=./schema.sql</span>
              </span>
            </ClickableCodeBlock>
          </div>

          {/* ধাপ ৩ */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              {isBn
                ? "ধাপ ৩: GitHub-এ কোড পুশ করা (Repository Setup)"
                : "Step 3: Pushing Code to GitHub (Repository Setup)"}
            </h3>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "প্রোজেক্টের কোড লোকালি পুরোপুরি তৈরি হয়ে গেলে সেটিকে GitHub-এ আপলোড করতে হবে যাতে ক্লাউডফেয়ার সেখান থেকে অটো-ডেপ্লয় করতে পারে।"
                : "Once the code is ready locally, publish it to GitHub so Cloudflare can trigger automatic deployments."}
              <SourcePill label="Composio" />
            </p>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed pt-1">
              {isBn ? (
                <>
                  1. GitHub-এ একটি নতুন রিপোজিটরি তৈরি করুন (যেমন:{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                    my-edge-website
                  </code>
                  )।
                </>
              ) : (
                <>
                  1. Create a new repository on GitHub (e.g.{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                    my-edge-website
                  </code>
                  ).
                </>
              )}
            </p>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "2. টার্মিনালে নিচের কমান্ডগুলো চালিয়ে কোড গিটহাবে যুক্ত করুন:"
                : "2. Run the following commands in your terminal to connect to GitHub:"}
            </p>
            <ClickableCodeBlock
              code={`git init
git add .
git commit -m "Initial commit with Antigravity"
git branch -M main
git remote add origin https://github.com/your-username/my-edge-website.git
git push -u origin main`}
              fileName="git-setup.sh"
            >
              <div>git init</div>
              <div>git add .</div>
              <div>
                git commit <span className="text-amber-400">-m</span>{" "}
                <span className="text-emerald-400">"Initial commit with Antigravity"</span>
              </div>
              <div>
                git branch <span className="text-amber-400">-M</span> main
              </div>
              <div>
                git remote add origin{" "}
                <span className="text-sky-300">
                  https://github.com/your-username/my-edge-website.git
                </span>
              </div>
              <div>
                git push <span className="text-amber-400">-u</span> origin main
              </div>
            </ClickableCodeBlock>
          </div>

          {/* ধাপ ৪ */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              {isBn
                ? "ধাপ ৪: Cloudflare Pages ও Workers-এ ডেপ্লয়মেন্ট"
                : "Step 4: Deployment on Cloudflare Pages & Workers"}
            </h3>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "আপনার প্রোজেক্ট গিটহাবে চলে যাওয়ার পর এটিকে লাইভ করার পালা:"
                : "With your code on GitHub, it's time to bring your application live:"}
            </p>
            <ol className="space-y-2 text-sm sm:text-base text-zinc-300 leading-relaxed">
              <li>{isBn ? "1. আপনার Cloudflare Dashboard-এ লগইন করুন।" : "1. Log into your Cloudflare Dashboard."}</li>
              <li>
                {isBn
                  ? "2. বাম দিক থেকে Workers & Pages অপশনে গিয়ে Create application বাটনে ক্লিক করুন এবং Pages ট্যাবে গিয়ে Connect to Git সিলেক্ট করুন।"
                  : "2. On the left menu, go to Workers & Pages > Create application > Pages > Connect to Git."}
                <SourcePill label="GitHub" />
              </li>
              <li>
                {isBn ? (
                  <>
                    3. আপনার গিটহাব অ্যাকাউন্ট কানেক্ট করে কাঙ্ক্ষিত রিপোজিটরি (
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                      my-edge-website
                    </code>
                    ) সিলেক্ট করুন।
                  </>
                ) : (
                  <>
                    3. Connect your GitHub account and choose the target repository (
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                      my-edge-website
                    </code>
                    ).
                  </>
                )}
              </li>
              <li>
                {isBn ? "4. Build Settings-এ নিচের তথ্যগুলো দিন:" : "4. In Build Settings, enter the following details:"}
                <ul className="mt-2 space-y-1.5 pl-4">
                  <li className="flex items-start">
                    <HollowBullet />
                    <span>
                      <strong className="text-zinc-200">Framework preset:</strong> Vite / React ({isBn ? "আপনার প্রোজেক্ট অনুযায়ী" : "as per your project"})
                    </span>
                  </li>
                  <li className="flex items-start">
                    <HollowBullet />
                    <span>
                      <strong className="text-zinc-200">Build command:</strong>{" "}
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                        npm run build
                      </code>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <HollowBullet />
                    <span>
                      <strong className="text-zinc-200">Build output directory:</strong>{" "}
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-200">
                        dist
                      </code>{" "}
                      ({isBn ? "বা আপনার ফ্রেমওয়ার্ক অনুযায়ী নির্ধারিত ফোল্ডার" : "or your framework dist folder"})
                    </span>
                  </li>
                </ul>
              </li>
              <li>
                {isBn
                  ? "5. Save and Deploy বাটনে ক্লিক করুন। ব্যস! কয়েক সেকেন্ডের মধ্যে Cloudflare আপনার সাইটটিকে বিশ্বব্যাপী তাদের শত শত এজ সার্ভারে ছড়িয়ে দেবে।"
                  : "5. Click Save and Deploy. Within seconds, Cloudflare distributes your website across hundreds of global edge data centers."}
                <SourcePill label="Composio" />
              </li>
            </ol>
          </div>

          {/* ধাপ ৫ */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              {isBn
                ? "ধাপ ৫: D1 ডাটাবেস প্রোডাকশনে মাইগ্রেট করা"
                : "Step 5: Migrating D1 Database to Production"}
              <SourcePill label="GitHub" />
            </h3>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "লোকাল এনভায়রনমেন্ট সফলভাবে কাজ করার পর প্রোডাকশন ডাটাবেসে স্কিমা রান করতে হবে:"
                : "After verifying your local environment, execute the schema on your production database:"}
            </p>
            <ClickableCodeBlock
              code="npx wrangler d1 execute my-website-db --remote --file=./schema.sql"
              fileName="d1-remote.sh"
            >
              <span>
                npx wrangler d1 execute my-website-db{" "}
                <span className="text-amber-400">--remote</span>{" "}
                <span className="text-amber-400">--file=./schema.sql</span>
              </span>
            </ClickableCodeBlock>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isBn
                ? "এর মাধ্যমে আপনার লাইভ সাইট এখন ক্লাউডফেয়ারের রিমোট D1 ডাটাবেস থেকে রিয়েল-টাইমে ডেটা আদান-প্রদান করতে পারবে।"
                : "Your live application can now exchange data in real time with Cloudflare's remote D1 database."}
            </p>
          </div>
        </section>

        {/* ৩. এই কাঠামোর মূল সুবিধাসমূহ */}
        <section className="mt-12">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mb-4">
            {isBn ? "৩. এই কাঠামোর মূল সুবিধাসমূহ" : "3. Key Advantages of This Architecture"}
          </h2>
          <ul className="space-y-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            <li className="flex items-start">
              <HollowBullet />
              <div>
                <strong className="text-zinc-100">
                  {isBn ? "বিনা খরচে দুর্দান্ত পারফরম্যান্স:" : "Cost-Free High Performance:"}
                </strong>{" "}
                {isBn
                  ? "Cloudflare-এর ফ্রি টিয়ারে হিউজ রিকোয়েস্ট এবং ডাটাবেস অপারেশন সম্পূর্ণ বিনামূল্যে পাওয়া যায়।"
                  : "Cloudflare's generous free tier provides high request volumes and database operations completely free of charge."}
                <SourcePill label="GitHub" />
              </div>
            </li>
            <li className="flex items-start">
              <HollowBullet />
              <div>
                <strong className="text-zinc-100">
                  {isBn ? "জিরো লেটেন্সি (Zero Latency):" : "Zero Latency:"}
                </strong>{" "}
                {isBn
                  ? "যেহেতু ডাটাবেস এবং কোড দুটিই ইউজারের সবচেয়ে কাছের এজ লোকেশনে রান করে, তাই সাইট লোড হয় চোখের পলকে।"
                  : "Because both code and data run at the edge closest to your visitors, pages load in the blink of an eye."}
                <SourcePill label="GitHub" />
              </div>
            </li>
            <li className="flex items-start">
              <HollowBullet />
              <div>
                <strong className="text-zinc-100">
                  {isBn ? "এআই চালিত মেইনটেনেন্স:" : "AI-Driven Maintenance:"}
                </strong>{" "}
                {isBn
                  ? "কোডে কোনো সমস্যা দেখা দিলে বা নতুন ফিচার (যেমন: সার্চ বক্স, ইউজার অথেন্টিকেশন ইত্যাদি) যুক্ত করতে চাইলে আপনি খুব সহজেই Antigravity-এর সাহায্য নিতে পারেন।"
                  : "If you hit an issue or want to build a new feature like search or auth, you can easily pair with Antigravity to solve it."}
              </div>
            </li>
          </ul>
        </section>

        {/* উপসংহার */}
        <section className="mt-12 rounded-2xl border border-zinc-800 bg-[#16161a] p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-zinc-100">
            {isBn ? "উপসংহার:" : "Conclusion:"}
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
            {isBn
              ? "প্রথাগত হোস্টিংয়ের ঝামেলা এড়িয়ে আধুনিক সার্ভারলেস প্রযুক্তির ছোঁয়া পেতে Antigravity, GitHub এবং Cloudflare-এর এই মেলবন্ধন দারুণ একটি অভিজ্ঞতা। আজই আপনার আইডিয়াকে বাস্তবে রূপ দিন এবং বিশ্ববাসীর সামনে তুলে ধরুন আপনার নিজস্ব এজ-পাওয়ার্ড ওয়েবসাইট!"
              : "Avoiding the hassles of traditional hosting, the synergy of Antigravity, GitHub, and Cloudflare offers an outstanding development workflow. Bring your ideas to reality today and showcase your edge-powered web application to the world!"}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 shadow-sm"
            >
              <BookOpen className="size-4" />
              {isBn ? "অন্যান্য লেখালেখি পড়ুন" : "Read More Articles"}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              {isBn ? "যোগাযোগ" : "Contact"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
