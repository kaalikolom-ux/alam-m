import React from "react";

export function QuillNibIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 36"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14 2 C10 10, 5 18, 2 24 C1 26, 3 28, 6 28 L12 28 L14 34 L16 28 L22 28 C25 28, 27 26, 26 24 C23 18, 18 10, 14 2 Z" />
      <circle cx="14" cy="19" r="1.5" fill="#dfb76c" />
      <line x1="14" y1="21" x2="14" y2="34" stroke="#dfb76c" strokeWidth="1.2" />
    </svg>
  );
}

// Fallback compatibility alias
export const QafIcon = QuillNibIcon;

interface QuranLogoBadgeProps {
  className?: string;
  iconClassName?: string;
  style?: React.CSSProperties;
}

/**
 * Alam M Luxury Brand Badge
 * Renders a luxury gold badge with the Bengali calligraphy letter "আ" (for Alam M)
 */
export function QuranLogoBadge({
  className = "h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 rounded-[5px]",
  iconClassName = "text-base sm:text-lg",
  style,
}: QuranLogoBadgeProps) {
  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-[#d4af6a] via-[#b88e58] to-[#9e743f] text-[#0b0f13] border border-[#d4af6a]/80 shadow-[0_2px_8px_rgba(184,142,88,0.3)] transition-transform duration-200 group-hover:scale-105 select-none ${className}`}
      title="Alam M"
    >
      <span
        className={`font-['Hind_Siliguri'] font-bold leading-none text-[#0b0f13] select-none ${iconClassName}`}
        style={{ transform: "translateY(-0.5px)" }}
      >
        আ
      </span>
    </div>
  );
}

export const AlamMLogoBadge = QuranLogoBadge;
