import React from "react";
import { Link } from "@tanstack/react-router";
import { Quote, BookOpen } from "lucide-react";

interface ArticleDisclaimerBoxProps {
  lang?: string;
  className?: string;
  customBn?: string;
  customEn?: string;
}

export const BANGLA_DISCLAIMER =
  "কুরআনে কোনো বৈসদৃশ্য নেই—সূরা আন-নিসার ৪:৮২ আয়াতের এই শ্বাশত সত্যকে সামনে রেখেই প্রতিটি নিবন্ধ সাজানো হয়েছে। তবে আমাদের কোনো অসচেতনতা বা তথ্যগত সীমাবদ্ধতার কারণে কোথাও কোনো ভুল থেকে যেতে পারে। তাই কোনো সিদ্ধান্ত নেওয়ার আগে প্রতিটি লেখা সতর্কতার সাথে মিলিয়ে দেখার এবং নিজে থেকে আরও গভীরভাবে গবেষণা করার জন্য পাঠকদের বিনীতভাবে অনুরোধ করছি।";

export const ENGLISH_DISCLAIMER =
  "Every article on this website has been curated in strict adherence to the eternal truth of Surah An-Nisa (4:82)—that there is no inconsistency or contradiction within the Qur'an. However, due to human limitations or inadvertent oversights, errors may occur. Therefore, readers are sincerely requested to approach these writings with careful discernment and to pursue their own deep, independent Quranic research before drawing definitive conclusions.";

/**
 * Extracts custom disclaimer settings embedded in article HTML content
 */
export function parseArticleDisclaimer(content: string | null | undefined): {
  enabled: boolean;
  bn: string;
  en: string;
} {
  if (!content) {
    return { enabled: true, bn: BANGLA_DISCLAIMER, en: ENGLISH_DISCLAIMER };
  }
  const match = content.match(/<!--\s*disclaimer:\s*(\{.*?\})\s*-->/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        enabled: parsed.enabled !== false,
        bn: typeof parsed.bn === "string" && parsed.bn.trim() ? parsed.bn : BANGLA_DISCLAIMER,
        en: typeof parsed.en === "string" && parsed.en.trim() ? parsed.en : ENGLISH_DISCLAIMER,
      };
    } catch {}
  }
  return { enabled: true, bn: BANGLA_DISCLAIMER, en: ENGLISH_DISCLAIMER };
}

/**
 * Strips the hidden disclaimer comment marker from rendered content
 */
export function stripArticleDisclaimerComment(content: string | null | undefined): string {
  if (!content) return "";
  return content.replace(/\n*<!--\s*disclaimer:\s*\{.*?\}\s*-->\s*/g, "").trimEnd();
}

/**
 * Injects disclaimer options into article content as clean trailing metadata
 */
export function injectArticleDisclaimer(
  content: string,
  options: { enabled: boolean; bn: string; en: string }
): string {
  const clean = stripArticleDisclaimerComment(content);
  const isCustomBn = options.bn.trim() !== BANGLA_DISCLAIMER.trim();
  const isCustomEn = options.en.trim() !== ENGLISH_DISCLAIMER.trim();

  // If disabled, or if custom text is provided, embed metadata marker
  if (!options.enabled || isCustomBn || isCustomEn) {
    const payload = JSON.stringify({
      enabled: options.enabled,
      ...(isCustomBn ? { bn: options.bn.trim() } : {}),
      ...(isCustomEn ? { en: options.en.trim() } : {}),
    });
    return `${clean}\n\n<!-- disclaimer: ${payload} -->`;
  }

  return clean;
}

export function ArticleDisclaimerBox({
  lang = "bn",
  className = "",
  customBn,
  customEn,
}: ArticleDisclaimerBoxProps) {
  const isEn = lang === "en";

  const textBn = customBn?.trim() || BANGLA_DISCLAIMER;
  const textEn = customEn?.trim() || ENGLISH_DISCLAIMER;

  return (
    <aside
      aria-label={
        isEn
          ? "Quranic Principle & Note to Readers"
          : "কুরআনিক ঘোষণা ও পাঠকদের প্রতি বিনীত অনুরোধ"
      }
      className={`my-8 rounded-none border border-[#b88e58]/35 bg-gradient-to-br from-[#b88e58]/10 via-[#b88e58]/5 to-transparent dark:from-[#b88e58]/15 dark:via-[#141a23]/60 dark:to-transparent p-5 sm:p-7 border-l-[5px] border-l-[#b88e58] shadow-xs relative overflow-hidden not-prose ${className}`}
    >
      {/* Decorative background quote watermark */}
      <Quote
        className="size-24 text-[#b88e58]/12 dark:text-[#b88e58]/15 absolute -right-3 -bottom-3 pointer-events-none select-none rotate-180"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10 border-b border-[#b88e58]/25 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-none bg-[#b88e58]/15 text-[#b88e58] dark:text-[#ecd599] flex items-center justify-center shrink-0 border border-[#b88e58]/35 shadow-2xs">
            <Quote className="size-4 rotate-180" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#b88e58] dark:text-[#ecd599] font-serif leading-none">
              {isEn
                ? "Quranic Principle & Note to Readers"
                : "কুরআনিক ঘোষণা ও পাঠকদের প্রতি বিনীত অনুরোধ"}
            </h4>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-none bg-[#b88e58]/15 border border-[#b88e58]/35 text-[#b88e58] dark:text-[#ecd599] font-sans">
              {isEn ? "Surah An-Nisa (4:82)" : "সূরা আন-নিসা (৪:৮২)"}
            </span>
          </div>
        </div>
      </div>

      {/* Content Block */}
      <div className="space-y-4 relative z-10">
        <div className="space-y-1.5">
          <blockquote className="!border-none !bg-transparent !p-0 !m-0 !shadow-none before:!hidden">
            <p className="text-sm sm:text-base leading-relaxed text-foreground/95 dark:text-foreground/90 font-serif italic selection:bg-[#b88e58]/20">
              “{isEn ? textEn : textBn}”
            </p>
          </blockquote>
        </div>
      </div>

      {/* Footer Navigation Link to Ayah 4:82 */}
      <div className="mt-4 pt-3.5 border-t border-[#b88e58]/25 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
        <Link
          to="/surah/$id"
          params={{ id: "4" }}
          search={{ ayah: 82 } as any}
          className="inline-flex items-center gap-1.5 font-semibold text-[#b88e58] dark:text-[#ecd599] hover:text-[#d4af6a] hover:underline transition-colors"
        >
          <BookOpen className="size-3.5" />
          <span>
            {isEn
              ? "Read Surah An-Nisa (4:82) with translation & word-by-word meaning →"
              : "পবিত্র কুরআনে সূরা আন-নিসা (৪:৮২) আয়াতটি পড়ুন ও গবেষণা করুন →"}
          </span>
        </Link>
      </div>
    </aside>
  );
}
