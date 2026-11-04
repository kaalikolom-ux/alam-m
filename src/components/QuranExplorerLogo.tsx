import React from "react";

interface QuranExplorerLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  fill?: string;
}

export function QuranExplorerLogo({ className = "", size = "md", fill }: QuranExplorerLogoProps) {
  const sizeConfig = {
    xs: {
      title: "text-[11px] sm:text-[12px]",
      sub: "text-[5.5px] sm:text-[6px]",
      gap: "gap-[1px]",
    },
    sm: {
      title: "text-[13px] sm:text-[15px]",
      sub: "text-[6.5px] sm:text-[7.5px]",
      gap: "gap-[1px]",
    },
    md: {
      title: "text-[16px] sm:text-[18px]",
      sub: "text-[8px] sm:text-[9px]",
      gap: "gap-[2px]",
    },
    lg: {
      title: "text-[22px] sm:text-[25px]",
      sub: "text-[10px] sm:text-[11.5px]",
      gap: "gap-[3px]",
    },
  }[size];

  const titleColor = fill || "text-foreground dark:text-white";
  const subColor = fill ? "" : "text-primary dark:text-[#b88e58]";

  return (
    <div
      className={`inline-flex flex-col justify-center leading-none select-none text-left ${sizeConfig.gap} ${className}`}
      role="img"
      aria-label="QUR'AN EXPLORER"
    >
      <span
        className={`font-brand-serif font-black uppercase leading-none tracking-[0.06em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${sizeConfig.title} ${titleColor}`}
        style={{ letterSpacing: "0.06em" }}
      >
        QUR'AN
      </span>
      <span
        className={`font-brand-sans font-bold uppercase leading-none ${sizeConfig.sub} ${subColor}`}
        style={{ letterSpacing: "0.34em" }}
      >
        EXPLORER
      </span>
    </div>
  );
}
