import React from "react";
import { ExternalLink } from "lucide-react";

interface FormattedTranslationProps {
  text?: string | null;
  className?: string;
}

/**
 * Regex to parse reference links:
 * 1. Markdown style: [১](https://... or /articles/...)
 * 2. Bracket colon style: [১: https://... or /articles/...]
 */
const REFERENCE_LINK_REGEX =
  /(?:\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)|\[([^\s:\]]+)\s*:\s*((?:https?:\/\/|\/)[^\s\]]+)\])/g;

export const FormattedTranslation: React.FC<FormattedTranslationProps> = React.memo(
  function FormattedTranslation({ text, className }) {
    if (!text) return null;

    // Fast path: if no link brackets present, return text directly
    if (!text.includes("[") || (!text.includes("http") && !text.includes("/"))) {
      return <span className={className}>{text}</span>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex index for this run
    REFERENCE_LINK_REGEX.lastIndex = 0;

    while ((match = REFERENCE_LINK_REGEX.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        elements.push(text.substring(lastIndex, matchIndex));
      }

      const rawLabel = (match[1] || match[3] || "রেফারেন্স").trim();
      const url = (match[2] || match[4] || "#").trim();
      const displayLabel = rawLabel.startsWith("[") && rawLabel.endsWith("]")
        ? rawLabel
        : `[${rawLabel}]`;

      elements.push(
        <a
          key={`ref-link-${matchIndex}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          title={`রেফারেন্স পোস্ট দেখুন: ${url}`}
          className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded text-[0.82em] font-bold text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary transition-all border border-primary/25 cursor-pointer no-underline align-baseline shadow-2xs hover:shadow-xs select-text group/ref"
        >
          <span>{displayLabel}</span>
          <ExternalLink className="size-2.5 opacity-60 group-hover/ref:opacity-100 transition-opacity ml-0.5 inline-block shrink-0" />
        </a>
      );

      lastIndex = REFERENCE_LINK_REGEX.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return <span className={className}>{elements}</span>;
  }
);
