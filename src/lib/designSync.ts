// src/lib/designSync.ts
/**
 * App Design & UI Layout Sync Engine (Over-The-Air Zero-Reinstall Updates)
 * 
 * Allows design tweaks (card layout, hero covers, mobile popup toggles, scroll thresholds)
 * to be saved to cloud site_settings and auto-synced across web, mobile, and offline storage
 * without requiring APK updates or re-installations.
 */

import { useState, useEffect, useCallback } from "react";
import { get, set } from "idb-keyval";

export const DESIGN_SETTINGS_STORAGE_KEY = "app_design_settings_v1";
export const DESIGN_SETTINGS_EVENT = "quran:design-synced";
export const SITE_SETTINGS_KEY = "app_design_settings";

export interface AppDesignSettings {
  /** মোবাইল ভিউতে ভাসমান এডিটর পপআপ দৃশ্যমান থাকবে কি না (ডিফল্ট: false) */
  mobileFloatingPopupEnabled: boolean;
  /** ভাসমান উইজেট স্ক্রল থ্রেশহোল্ড (পিক্সেল, ডিফল্ট: 620px) */
  mobilePopupScrollThreshold: number;
  /** সর্বশেষ আপডেটের সময় */
  updatedAt: string;
  // Deprecated legacy properties (kept as optional for backward compatibility)
  articleCoverHeroBg?: boolean;
  articleCardShowFullTitle?: boolean;
  articleCardShowBottomTitle?: boolean;
  articleCardCoverAspect?: string;
}

export const DEFAULT_DESIGN_SETTINGS: AppDesignSettings = {
  mobileFloatingPopupEnabled: false,
  mobilePopupScrollThreshold: 620,
  updatedAt: new Date().toISOString(),
};

/** Get local design settings synchronously from localStorage with fallback */
export function getLocalDesignSettings(): AppDesignSettings {
  if (typeof window === "undefined") return { ...DEFAULT_DESIGN_SETTINGS };

  try {
    const raw = localStorage.getItem(DESIGN_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DESIGN_SETTINGS,
        ...parsed,
      };
    }
    // Backward-compatibility fallback for standalone admin_mobile_floating_popup_enabled
    const legacyPopup = localStorage.getItem("admin_mobile_floating_popup_enabled");
    if (legacyPopup !== null) {
      return {
        ...DEFAULT_DESIGN_SETTINGS,
        mobileFloatingPopupEnabled: legacyPopup === "true",
      };
    }
  } catch (e) {
    console.warn("Failed reading local design settings:", e);
  }

  return { ...DEFAULT_DESIGN_SETTINGS };
}

/** Save design settings locally and dispatch global update event */
export function saveLocalDesignSettings(settings: AppDesignSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(DESIGN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem("admin_mobile_floating_popup_enabled", String(settings.mobileFloatingPopupEnabled));
    set(DESIGN_SETTINGS_STORAGE_KEY, settings).catch(() => {});

    window.dispatchEvent(
      new CustomEvent(DESIGN_SETTINGS_EVENT, {
        detail: settings,
      })
    );
  } catch (e) {
    console.warn("Failed saving local design settings:", e);
  }
}

/**
 * Fetch latest design settings from Cloud (Supabase / D1 site_settings) and sync locally.
 * Called automatically during All-in-One Cloud Sync or app initialization.
 */
export async function syncAppDesignSettings(): Promise<AppDesignSettings> {
  const current = getLocalDesignSettings();

  // 1. Fetch from Cloudflare Edge / D1 site_settings (Primary, sub-1ms)
  try {
    const isLocalOrApp =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("androidplatform.net") ||
        window.location.hostname === "localhost" ||
        window.location.protocol === "file:");
    const baseUrl = isLocalOrApp ? "https://www.quraan.bd" : "";

    const res = await fetch(`${baseUrl}/api/public/settings?key=${SITE_SETTINGS_KEY}&v=${Date.now()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const edgeData = await res.json();
      const rawVal = edgeData?.app_design_settings || edgeData?.value;
      if (rawVal) {
        const parsed = typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal;
        const merged: AppDesignSettings = {
          ...DEFAULT_DESIGN_SETTINGS,
          ...current,
          ...parsed,
          updatedAt: new Date().toISOString(),
        };
        saveLocalDesignSettings(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("Design sync notice (Cloudflare D1):", err);
  }

  // 2. Fallback: Supabase site_settings (legacy mirror)
  try {
    const mod = await import("@/integrations/supabase/client");
    const supabase = mod.supabase;

    const { data, error } = await supabase
      .from("site_settings")
      .select("value, updated_at")
      .eq("key", SITE_SETTINGS_KEY)
      .maybeSingle();

    if (!error && data?.value) {
      const cloudVal = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      const merged: AppDesignSettings = {
        ...DEFAULT_DESIGN_SETTINGS,
        ...current,
        ...cloudVal,
        updatedAt: data.updated_at || cloudVal.updatedAt || new Date().toISOString(),
      };

      saveLocalDesignSettings(merged);
      return merged;
    }
  } catch {}

  return current;
}

/**
 * Save updated design settings to Cloud (Cloudflare D1 primary + Supabase mirror)
 * and update local storage immediately.
 */
export async function saveCloudDesignSettings(
  partial: Partial<AppDesignSettings>
): Promise<boolean> {
  const current = getLocalDesignSettings();
  const updated: AppDesignSettings = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  // Immediate local update
  saveLocalDesignSettings(updated);

  let d1Saved = false;
  // 1. Save directly to Cloudflare D1 via Edge API
  try {
    const isLocalOrApp =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("androidplatform.net") ||
        window.location.hostname === "localhost" ||
        window.location.protocol === "file:");
    const baseUrl = isLocalOrApp ? "https://www.quraan.bd" : "";

    const res = await fetch(`${baseUrl}/api/public/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: SITE_SETTINGS_KEY, value: updated }),
    });
    if (res.ok) d1Saved = true;
  } catch (d1Err) {
    console.warn("Notice: Error saving design settings to Cloudflare D1:", d1Err);
  }

  // 2. Non-blocking mirror to Supabase
  try {
    const mod = await import("@/integrations/supabase/client");
    const supabase = mod.supabase;
    void supabase.from("site_settings").upsert(
      {
        key: SITE_SETTINGS_KEY,
        value: updated,
        is_public: true,
      },
      { onConflict: "key" }
    );
  } catch {}

  return d1Saved;
}

/**
 * React hook to consume and update synchronized App Design Settings.
 * Automatically stays in sync across all components and windows.
 */
export function useAppDesignSettings() {
  const [settings, setSettings] = useState<AppDesignSettings>(getLocalDesignSettings);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) {
        setSettings({ ...e.detail });
      } else {
        setSettings(getLocalDesignSettings());
      }
    };

    window.addEventListener(DESIGN_SETTINGS_EVENT, handleSync);
    window.addEventListener("storage", handleSync);

    // Initial silent sync if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncAppDesignSettings().then((synced) => {
        setSettings(synced);
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener(DESIGN_SETTINGS_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppDesignSettings>) => {
    // 1. Immediate local update
    const next = { ...settings, ...partial, updatedAt: new Date().toISOString() };
    setSettings(next);
    saveLocalDesignSettings(next);

    // 2. Cloud sync in background
    try {
      await saveCloudDesignSettings(partial);
    } catch (e) {
      console.warn("Background cloud save error:", e);
    }
  }, [settings]);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const fresh = await syncAppDesignSettings();
      setSettings(fresh);
      return fresh;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    settings,
    updateSettings,
    isSyncing,
    triggerSync,
  };
}
