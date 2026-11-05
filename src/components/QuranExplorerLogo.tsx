import React from "react";

interface QuranExplorerLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  fill?: string;
}

/**
 * Alam M Brand Text Logo
 * Renders "Alam M" in Kaushan Script with the tagline "শব্দ আমার ক্যানভাস"
 * Matches SiteHeader styling exactly without any extraneous badges.
 */
export function QuranExplorerLogo({ className = "", size = "md", fill }: QuranExplorerLogoProps) {
  const sizeConfig = {
    xs: {
      title: "text-[15px] sm:text-[16px]",
      sub: "text-[8px] sm:text-[8.5px]",
    },
    sm: {
      title: "text-[18px] sm:text-[20px]",
      sub: "text-[9px] sm:text-[9.5px]",
    },
    md: {
      title: "text-[22px] sm:text-[24px]",
      sub: "text-[10px] sm:text-[10.5px]",
    },
    lg: {
      title: "text-[28px] sm:text-[32px]",
      sub: "text-[11px] sm:text-[12px]",
    },
  }[size];

  const titleColor = fill || "text-stone-900 dark:text-stone-100 group-hover:text-[#b88e58] transition-colors";
  const subColor = fill ? "" : "text-amber-800 dark:text-[#ecd599] font-medium tracking-widest";

  return (
    <div
      className={`inline-flex flex-col justify-center leading-none select-none text-left ${className}`}
      role="img"
      aria-label="Alam M — শব্দ আমার ক্যানভাস"
    >
      <span
        className={`font-['Kaushan_Script'] font-bold leading-none tracking-tight drop-shadow-xs ${sizeConfig.title} ${titleColor}`}
      >
        Alam M
      </span>
      <span
        className={`font-['Hind_Siliguri'] leading-none mt-1 ${sizeConfig.sub} ${subColor}`}
      >
        শব্দ আমার ক্যানভাস
      </span>
    </div>
  );
}

export const AlamMLogo = QuranExplorerLogo;
