import React from "react";

interface QuranExplorerLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  fill?: string;
}

/**
 * Alam M Brand Text Logo
 * Renders "Alam M" in Kaushan Script with the tagline "শব্দ আমার ক্যানভাস"
 */
export function QuranExplorerLogo({ className = "", size = "md", fill }: QuranExplorerLogoProps) {
  const sizeConfig = {
    xs: {
      title: "text-[14px] sm:text-[15px]",
      sub: "text-[7.5px] sm:text-[8px]",
      gap: "gap-0",
    },
    sm: {
      title: "text-[17px] sm:text-[19px]",
      sub: "text-[8.5px] sm:text-[9.5px]",
      gap: "gap-0",
    },
    md: {
      title: "text-[21px] sm:text-[23px]",
      sub: "text-[9.5px] sm:text-[10.5px]",
      gap: "gap-0.5",
    },
    lg: {
      title: "text-[28px] sm:text-[32px]",
      sub: "text-[11.5px] sm:text-[13px]",
      gap: "gap-1",
    },
  }[size];

  const titleColor = fill || "text-stone-900 dark:text-stone-100";
  const subColor = fill ? "" : "text-amber-800 dark:text-[#ecd599]";

  return (
    <div
      className={`inline-flex flex-col justify-center leading-none select-none text-left ${sizeConfig.gap} ${className}`}
      role="img"
      aria-label="Alam M — শব্দ আমার ক্যানভাস"
    >
      <span
        className={`font-['Kaushan_Script'] font-bold leading-none tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${sizeConfig.title} ${titleColor}`}
      >
        Alam M
      </span>
      <span
        className={`font-['Hind_Siliguri'] font-medium tracking-wider leading-none mt-0.5 ${sizeConfig.sub} ${subColor}`}
      >
        শব্দ আমার ক্যানভাস
      </span>
    </div>
  );
}

export const AlamMLogo = QuranExplorerLogo;
