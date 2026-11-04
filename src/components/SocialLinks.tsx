import React from "react";
import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useSocialLinks } from "@/lib/site";

const ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  github: Github,
  telegram: Send,
  whatsapp: MessageCircle,
  email: Mail,
  website: Globe,
};

const BRAND_HOVER_CLASSES: Record<string, string> = {
  facebook: "hover:bg-[#1877F2]/15 hover:text-[#1877F2] hover:border-[#1877F2]/40",
  youtube: "hover:bg-[#FF0000]/15 hover:text-[#FF0000] hover:border-[#FF0000]/40",
  twitter: "hover:bg-[#1DA1F2]/15 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/40",
  x: "hover:bg-[#000000]/15 dark:hover:bg-white/15 hover:text-foreground hover:border-foreground/40",
  telegram: "hover:bg-[#229ED9]/15 hover:text-[#229ED9] hover:border-[#229ED9]/40",
  whatsapp: "hover:bg-[#25D366]/15 hover:text-[#25D366] hover:border-[#25D366]/40",
  linkedin: "hover:bg-[#0A66C2]/15 hover:text-[#0A66C2] hover:border-[#0A66C2]/40",
  github: "hover:bg-foreground/15 hover:text-foreground hover:border-foreground/40",
  instagram: "hover:bg-[#E4405F]/15 hover:text-[#E4405F] hover:border-[#E4405F]/40",
  email: "hover:bg-[#EA4335]/15 hover:text-[#EA4335] hover:border-[#EA4335]/40",
  website: "hover:bg-primary/15 hover:text-primary hover:border-primary/40",
};

export function socialIconFor(platform: string): LucideIcon {
  return ICONS[platform.trim().toLowerCase()] ?? Globe;
}

export const SOCIAL_PLATFORMS = Object.keys(ICONS);

export const BRAND_DEFAULT_SOCIAL = [
  { id: "def-fb", platform: "facebook", label: "Facebook", url: "https://facebook.com/quranexplore" },
  { id: "def-x", platform: "twitter", label: "X (Twitter)", url: "https://x.com/quranexplore" },
  { id: "def-yt", platform: "youtube", label: "YouTube", url: "https://youtube.com/@quranexplore" },
  { id: "def-ig", platform: "instagram", label: "Instagram", url: "https://instagram.com/quranexplore" },
  { id: "def-tg", platform: "telegram", label: "Telegram", url: "https://t.me/quranexplore" },
  { id: "def-gh", platform: "github", label: "GitHub", url: "https://github.com/kaalikolom-ux" },
];

function sanitizeSocialUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed === "https://github.com/kaalikolom-ux/quran-explore-pro-5574") {
    return "https://github.com/kaalikolom-ux";
  }
  return trimmed;
}

export function SocialLinks({ className = "" }: { className?: string }) {
  const links = useSocialLinks();

  const dynamicLinks = (links.data || [])
    .filter((l) => {
      if (!l.url || l.url.trim() === "") return false;
      const u = l.url.trim();
      if (u === "https://linkedin.com/company/quranexplore" || u === "https://wa.me") return false;
      return true;
    })
    .map((l) => ({
      ...l,
      url: sanitizeSocialUrl(l.url),
    }));
  const visibleLinks = dynamicLinks.length > 0 ? dynamicLinks : BRAND_DEFAULT_SOCIAL;

  if (!visibleLinks.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {visibleLinks.map((l) => {
        const platformKey = l.platform.toLowerCase().trim();
        const Icon = socialIconFor(platformKey);
        const label = l.label || l.platform;
        const brandHover = BRAND_HOVER_CLASSES[platformKey] || "hover:bg-primary/15 hover:text-primary hover:border-primary/40";

        return (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={label}
            title={label}
            className={`flex size-8.5 sm:size-9 items-center justify-center rounded-xl border border-border/80 bg-background/60 text-muted-foreground shadow-2xs backdrop-blur-xs transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${brandHover}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
