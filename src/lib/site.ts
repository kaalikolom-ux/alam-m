import { useQuery } from "@tanstack/react-query";

let _settingsPromise: Promise<Record<string, any>> | null = null;
export async function fetchPublicSettings(): Promise<Record<string, any>> {
  if (typeof window === "undefined") return {};
  if (!_settingsPromise) {
    _settingsPromise = fetch("/api/public/settings")
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}))
      .finally(() => {
        setTimeout(() => {
          _settingsPromise = null;
        }, 30000);
      });
  }
  return _settingsPromise;
}

export interface HeaderSettings {
  siteTitle: string;
  tagline: string;
  showSearch: boolean;
  stickyHeader: boolean;
  showLangSwitch: boolean;
  announcement: {
    enabled: boolean;
    text: string;
    link: string;
  };
}

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  siteTitle: "কুরআন অন্বেষা — Quran Explorer",
  tagline: "শব্দে শব্দে কুরআন অন্বেষা",
  showSearch: true,
  stickyHeader: true,
  showLangSwitch: true,
  announcement: {
    enabled: false,
    text: "",
    link: "",
  },
};

export interface FooterSettings {
  aboutText: string;
  copyrightText: string;
  showFooterSocialIcons: boolean;
  showMenuLinks: boolean;
  showNewsletter: boolean;
}

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  aboutText: "কুরআনের গভীর ভাবার্থ ও আয়াতের তাফসির উপলব্ধির আধুনিক ডিজিটাল প্ল্যাটফর্ম।",
  copyrightText: "সর্বস্বত্ব সংরক্ষিত।",
  showFooterSocialIcons: true,
  showMenuLinks: true,
  showNewsletter: true,
};

export interface SocialLinkItem {
  id?: string;
  platform: string;
  label: string;
  url: string;
  enabled: boolean;
  sort_order?: number;
}

export interface SocialMediaSettings {
  enablePostSharing: boolean;
  showFooterSocial: boolean;
  facebookAppId?: string;
  facebookAdmins?: string;
  facebookPageId?: string;
  links: SocialLinkItem[];
}

export const DEFAULT_FB_APP_ID =
  (typeof process !== "undefined" && (process.env?.VITE_FACEBOOK_APP_ID || process.env?.FACEBOOK_APP_ID)) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FACEBOOK_APP_ID) ||
  "";

export const DEFAULT_SOCIAL_MEDIA_SETTINGS: SocialMediaSettings = {
  enablePostSharing: true,
  showFooterSocial: true,
  facebookAppId: DEFAULT_FB_APP_ID,
  facebookAdmins: "",
  facebookPageId: "",
  links: [
    { platform: "facebook", label: "Facebook", url: "https://facebook.com/quranexplore", enabled: true, sort_order: 1 },
    { platform: "youtube", label: "YouTube", url: "https://youtube.com/@quranexplore", enabled: true, sort_order: 2 },
    { platform: "twitter", label: "X (Twitter)", url: "https://x.com/quranexplore", enabled: true, sort_order: 3 },
    { platform: "instagram", label: "Instagram", url: "https://instagram.com/quranexplore", enabled: true, sort_order: 4 },
    { platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com/company/quranexplore", enabled: false, sort_order: 5 },
    { platform: "telegram", label: "Telegram", url: "https://t.me/quranexplore", enabled: true, sort_order: 6 },
    { platform: "whatsapp", label: "WhatsApp", url: "https://wa.me", enabled: false, sort_order: 7 },
    { platform: "github", label: "GitHub", url: "https://github.com/kaalikolom-ux", enabled: true, sort_order: 8 },
    { platform: "email", label: "Email", url: "mailto:info@quraan.bd", enabled: false, sort_order: 9 },
    { platform: "website", label: "Website", url: "https://www.quraan.bd", enabled: false, sort_order: 10 },
  ],
};

export function useHeaderSettings() {
  return useQuery({
    queryKey: ["site-settings-header"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<HeaderSettings> => {
      try {
        const settings = await fetchPublicSettings();
        const raw = settings.header_settings;
        if (raw) {
          const val = typeof raw === "string" ? JSON.parse(raw) : raw;
          return {
            ...DEFAULT_HEADER_SETTINGS,
            ...val,
            announcement: {
              ...DEFAULT_HEADER_SETTINGS.announcement,
              ...(val.announcement || {}),
            },
          };
        }
      } catch {}
      return DEFAULT_HEADER_SETTINGS;
    },
  });
}

export function useFooterSettings() {
  return useQuery({
    queryKey: ["site-settings-footer"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<FooterSettings> => {
      try {
        const settings = await fetchPublicSettings();
        const raw = settings.footer_settings;
        if (raw) {
          const val = typeof raw === "string" ? JSON.parse(raw) : raw;
          return {
            ...DEFAULT_FOOTER_SETTINGS,
            ...val,
          };
        }
      } catch {}
      return DEFAULT_FOOTER_SETTINGS;
    },
  });
}

export function useSocialMediaSettings() {
  return useQuery({
    queryKey: ["site-settings-social-media"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SocialMediaSettings> => {
      try {
        const settings = await fetchPublicSettings();
        const raw = settings.social_media_settings;
        if (raw) {
          const val = typeof raw === "string" ? JSON.parse(raw) : raw;
          return {
            ...DEFAULT_SOCIAL_MEDIA_SETTINGS,
            ...val,
            facebookAppId: val.facebookAppId ?? DEFAULT_SOCIAL_MEDIA_SETTINGS.facebookAppId,
            facebookAdmins: val.facebookAdmins ?? "",
            facebookPageId: val.facebookPageId ?? "",
            links: Array.isArray(val.links) ? val.links : DEFAULT_SOCIAL_MEDIA_SETTINGS.links,
          };
        }
      } catch {}
      return DEFAULT_SOCIAL_MEDIA_SETTINGS;
    },
  });
}

export function useSocialLinks() {
  return useQuery({
    queryKey: ["social-links"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // 1. First check social_media_settings from site_settings (Edge API)
      try {
        const settings = await fetchPublicSettings();
        const sVal = settings.social_media_settings
          ? typeof settings.social_media_settings === "string"
            ? JSON.parse(settings.social_media_settings)
            : settings.social_media_settings
          : null;
        if (sVal && Array.isArray(sVal.links)) {
          const activeLinks = sVal.links
            .filter((l: any) => l.enabled && l.url && l.url.trim() !== "")
            .map((l: any, idx: number) => ({
              id: l.id || `social-${l.platform}-${idx}`,
              platform: l.platform,
              label: l.label || l.platform,
              url: l.url,
              sort_order: l.sort_order ?? idx,
            }));
          if (activeLinks.length > 0) {
            return activeLinks;
          }
        }
      } catch {
        // Fallback
      }

      // 2. Fallback to default active social links
      return DEFAULT_SOCIAL_MEDIA_SETTINGS.links
        .filter((l) => l.enabled && l.url)
        .map((l, idx) => ({
          id: `default-${l.platform}-${idx}`,
          platform: l.platform,
          label: l.label,
          url: l.url,
          sort_order: l.sort_order ?? idx,
        }));
    },
  });
}

export type TurnstileConfig = { site_key: string; enabled: boolean };

export const DEFAULT_TURNSTILE_CONFIG: TurnstileConfig = {
  site_key: "0x4AAAAAAFjoKRa4qnckqqZF",
  enabled: true,
};

export function useTurnstileConfig() {
  return useQuery({
    queryKey: ["turnstile-config"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<TurnstileConfig> => {
      try {
        const settings = await fetchPublicSettings();
        const v = (settings.turnstile ?? {}) as Partial<TurnstileConfig>;
        if (v && typeof v === "object" && typeof v.enabled !== "undefined") {
          return { site_key: v.site_key || DEFAULT_TURNSTILE_CONFIG.site_key, enabled: Boolean(v.enabled) };
        }
      } catch {}
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "turnstile")
          .maybeSingle();
        if (!error && data?.value) {
          const v = data.value as Partial<TurnstileConfig>;
          return { site_key: v.site_key || DEFAULT_TURNSTILE_CONFIG.site_key, enabled: Boolean(v.enabled) };
        }
      } catch {}
      return DEFAULT_TURNSTILE_CONFIG;
    },
  });
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
