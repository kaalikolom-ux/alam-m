import React from "react";

interface QuranExplorerLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  fill?: string;
}

/**
 * Alam M Brand Text Logo
 * Exact 1:1 match with SiteHeader & SiteFooter:
 * - "Alam M": font-['Kaushan_Script'] font-bold tracking-tight text-primary
 * - "শব্দ আমার ক্যানভাস": font-['Hind_Siliguri'] font-medium tracking-widest text-muted-foreground
 */
export function QuranExplorerLogo({ className = "", size = "md", fill }: QuranExplorerLogoProps) {
  const sizeConfig = {
    xs: {
      title: "text-[16px] sm:text-[17px]",
      sub: "text-[8.5px] sm:text-[9px]",
      gap: "gap-0",
    },
    sm: {
      title: "text-[19px] sm:text-[21px]",
      sub: "text-[9.5px] sm:text-[10px]",
      gap: "gap-0.5",
    },
    md: {
      title: "text-[23px] sm:text-[25px]",
      sub: "text-[10px] sm:text-[10.5px]",
      gap: "gap-0.5",
    },
    lg: {
      title: "text-[28px] sm:text-[32px]",
      sub: "text-[11px] sm:text-[12px]",
      gap: "gap-1",
    },
  }[size];

  const titleColor = fill || "text-primary";
  const subColor = fill ? "" : "text-muted-foreground";

  return (
    <div
      className={`inline-flex flex-col justify-center leading-none select-none text-left ${sizeConfig.gap} ${className}`}
      role="img"
      aria-label="Alam M — শব্দ আমার ক্যানভাস"
    >
      <span
        className={`font-['Kaushan_Script'] font-bold leading-none tracking-tight ${sizeConfig.title} ${titleColor}`}
      >
        Alam M
      </span>
      <span
        className={`font-['Hind_Siliguri'] font-medium tracking-widest leading-none mt-1 ${sizeConfig.sub} ${subColor}`}
      >
        শব্দ আমার ক্যানভাস
      </span>
    </div>
  );
}

export const AlamMLogo = QuranExplorerLogo;
