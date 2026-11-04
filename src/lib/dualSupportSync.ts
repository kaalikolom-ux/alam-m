import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
async function getSupabase() {
  const mod = await import("@/integrations/supabase/client");
  return mod.supabase;
}
import { toast } from "sonner";
import { get, set, del } from "idb-keyval";
import { saveSurahOffline, getSurahOffline } from "@/lib/offline";
import { STATIC_AUTHORS, STATIC_CATEGORIES } from "@/lib/staticCategories";

export const SYNC_STORAGE_KEY = "quran_offline_dynamic_articles_v1";
export const SYNC_META_STORAGE_KEY = "quran_offline_articles_meta_v1";
export const SYNC_CATEGORIES_KEY = "quran_offline_categories_v1";
const SYNC_TIMESTAMP_KEY = "quran_last_synced_at_v1";
const PENDING_QUEUE_KEY = "quran_pending_sync_queue_v1";

export interface PendingSyncItem {
  id: string;
  type: "create_article" | "update_article" | "trash_article";
  payload: any;
  createdAt: string;
}

export interface DualSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
}

// Global in-memory listener set for sync state
type Listener = (status: DualSyncStatus) => void;
const listeners = new Set<Listener>();

let currentStatus: DualSyncStatus = {
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  lastSyncedAt: null,
  pendingCount: 0,
};

function notifyListeners() {
  listeners.forEach((l) => l({ ...currentStatus }));
}

/** Extract lightweight metadata without heavy HTML content for reliable LocalStorage storage */
export function extractArticleMeta(a: any) {
  if (!a) return null;

  const DEFAULT_ALAM_M_ID = "38aa28c8-3535-4a1b-ba06-3d1e2792a9c1";
  const DEFAULT_QURANIC_ID = "9397b0e6-f196-47a1-80bd-fdfc98f82015";
  const DEFAULT_RESEARCH_ID = "e5a19d08-41fb-489d-905e-88c9f52a71b2";

  const isAuthorless = !a.author_id && !a.author?.id;
  const author_id = a.author_id || (isAuthorless ? DEFAULT_ALAM_M_ID : a.author?.id);
  const author = a.author || (isAuthorless ? STATIC_AUTHORS[DEFAULT_ALAM_M_ID] : null);

  const isUncategorized =
    !a.category_id &&
    !a.category?.id &&
    (!Array.isArray(a.category_ids) || a.category_ids.length === 0) &&
    (!Array.isArray(a.categories) || a.categories.length === 0);

  const quranicCat = STATIC_CATEGORIES.find((c) => c.id === DEFAULT_QURANIC_ID);
  const researchCat = STATIC_CATEGORIES.find((c) => c.id === DEFAULT_RESEARCH_ID);

  const category_id = a.category_id || (isUncategorized ? DEFAULT_QURANIC_ID : null);
  const category_ids =
    Array.isArray(a.category_ids) && a.category_ids.length > 0
      ? a.category_ids
      : isUncategorized
      ? [DEFAULT_QURANIC_ID, DEFAULT_RESEARCH_ID]
      : undefined;

  const categories =
    Array.isArray(a.categories) && a.categories.length > 0
      ? a.categories
      : isUncategorized && quranicCat && researchCat
      ? [quranicCat, researchCat]
      : undefined;

  let category = a.category
    ? {
        id: a.category.id,
        name_bn: a.category.name_bn,
        name_en: a.category.name_en,
        slug: a.category.slug,
        show_in_menu: a.category.show_in_menu !== false,
        is_restricted: a.category.is_restricted || false,
      }
    : isUncategorized && quranicCat
    ? {
        id: quranicCat.id,
        name_bn: quranicCat.name_bn,
        name_en: quranicCat.name_en,
        slug: quranicCat.slug,
        show_in_menu: true,
        is_restricted: false,
      }
    : null;

  let tags = Array.isArray(a.tags) ? [...a.tags] : [];
  if (isAuthorless && !tags.includes("আলম এম.")) {
    tags.push("আলম এম.");
  }
  if (isUncategorized) {
    if (!tags.includes("কুরআনিক")) tags.unshift("কুরআনিক");
    if (!tags.includes("গবেষণা")) {
      const qIdx = tags.indexOf("কুরআনিক");
      tags.splice(qIdx + 1, 0, "গবেষণা");
    }
  }

  return {
    id: a.id,
    slug: a.slug,
    title_bn: a.title_bn,
    title_en: a.title_en || null,
    excerpt_bn: a.excerpt_bn || "",
    excerpt_en: a.excerpt_en || null,
    cover_image_url: a.cover_image_url || null,
    published: a.published,
    published_at: a.published_at || a.created_at,
    created_at: a.created_at,
    updated_at: a.updated_at,
    author_id,
    category_id,
    category_ids,
    categories,
    tags,
    author,
    category,
  };
}

/** Synchronous read of cached articles metadata for instant 0ms startup */
export function getSyncCachedArticles(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const meta = localStorage.getItem(SYNC_META_STORAGE_KEY);
    if (meta) {
      const parsed = JSON.parse(meta);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const full = localStorage.getItem(SYNC_STORAGE_KEY);
    if (full) {
      const parsed = JSON.parse(full);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error reading sync cached articles:", e);
  }
  return [];
}

/** Synchronous read of cached categories for instant 0ms startup */
export function getSyncCachedCategories(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const local = localStorage.getItem(SYNC_CATEGORIES_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

/** Cache categories in IndexedDB and LocalStorage */
export async function cacheDynamicCategories(cats: any[]) {
  if (!Array.isArray(cats) || cats.length === 0) return;
  try {
    await set(SYNC_CATEGORIES_KEY, cats);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SYNC_CATEGORIES_KEY, JSON.stringify(cats));
      } catch {}
    }
  } catch {}
}

/** Get cached dynamic articles from IndexedDB / LocalStorage for instant offline view */
export async function getCachedDynamicArticles(): Promise<any[]> {
  try {
    const idbData = await get<any[]>(SYNC_STORAGE_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) return idbData;

    const syncCached = getSyncCachedArticles();
    if (syncCached.length > 0) return syncCached;
  } catch (e) {
    console.warn("Error reading cached dynamic articles:", e);
  }
  return [];
}

/** Check whether an article object contains valid, readable HTML/text body content */
export function isArticleContentValid(a: any): boolean {
  if (!a) return false;
  const bn = typeof a.content_bn === "string" ? a.content_bn.trim() : "";
  const en = typeof a.content_en === "string" ? a.content_en.trim() : "";
  return bn.length > 20 || en.length > 20;
}

/** Cache dynamic articles to IndexedDB (full objects) and LocalStorage (lightweight metadata) */
export async function cacheDynamicArticles(articles: any[]) {
  if (!Array.isArray(articles) || articles.length === 0) return;
  try {
    // 1. Read existing dynamic articles in IndexedDB to preserve full HTML content
    const existingList = (await get<any[]>(SYNC_STORAGE_KEY)) || [];
    const existingMap = new Map<string, any>();
    if (Array.isArray(existingList)) {
      for (const item of existingList) {
        if (!item) continue;
        if (item.slug) existingMap.set(item.slug, item);
        if (item.id) existingMap.set(item.id, item);
      }
    }

    const mergedArticles = articles.map((incoming) => {
      if (!incoming) return incoming;
      const existing = (incoming.slug && existingMap.get(incoming.slug)) || (incoming.id && existingMap.get(incoming.id));
      if (existing) {
        // If incoming is missing content but existing has it, preserve existing full content!
        const hasIncomingContent = isArticleContentValid(incoming);
        const hasExistingContent = isArticleContentValid(existing);
        if (!hasIncomingContent && hasExistingContent) {
          return {
            ...existing,
            ...incoming,
            content_bn: existing.content_bn,
            content_en: existing.content_en || incoming.content_en,
          };
        }
      }
      return incoming;
    });

    // 1. IndexedDB stores merged articles
    await set(SYNC_STORAGE_KEY, mergedArticles);

    // Persist individual articles ONLY if they have valid readable content
    // NEVER overwrite an individual cached article with a content-less metadata shell!
    for (const art of mergedArticles) {
      if (!art || !isArticleContentValid(art)) continue;
      if (art.slug) {
        set(`quran_offline_art_${art.slug}`, art).catch(() => {});
      }
      if (art.id) {
        set(`quran_offline_art_${art.id}`, art).catch(() => {});
      }
    }

    // 2. LocalStorage stores lightweight metadata without heavy HTML content (< 60 KB)
    if (typeof window !== "undefined") {
      try {
        const metaArticles = articles.map(extractArticleMeta).filter(Boolean);
        localStorage.setItem(SYNC_META_STORAGE_KEY, JSON.stringify(metaArticles.slice(0, 100)));
      } catch (localErr) {
        console.warn("Notice: LocalStorage meta caching error:", localErr);
      }
    }
  } catch (e) {
    console.warn("Error caching dynamic articles:", e);
  }
}

/** Get a specific cached article by its slug or ID from IndexedDB (only returns if content is valid) */
export async function getCachedArticleBySlug(slug: string): Promise<any | null> {
  if (!slug) return null;
  try {
    let cleanSlug = slug;
    try {
      cleanSlug = decodeURIComponent(slug);
    } catch {}

    // 1. Check direct individual article key in IndexedDB
    const directSlug = await get<any>(`quran_offline_art_${slug}`);
    if (isArticleContentValid(directSlug)) {
      return directSlug;
    } else if (directSlug) {
      // Self-heal: Clean up hollow/empty cached article shell
      del(`quran_offline_art_${slug}`).catch(() => {});
    }

    if (cleanSlug !== slug) {
      const directClean = await get<any>(`quran_offline_art_${cleanSlug}`);
      if (isArticleContentValid(directClean)) {
        return directClean;
      } else if (directClean) {
        del(`quran_offline_art_${cleanSlug}`).catch(() => {});
      }
    }

    // 2. Check in dynamic articles collection
    const list = await getCachedDynamicArticles();
    if (Array.isArray(list)) {
      const found = list.find(
        (a) => a && (a.slug === slug || a.slug === cleanSlug || a.id === slug || a.id === cleanSlug)
      );
      if (isArticleContentValid(found)) return found;
    }
  } catch (e) {
    console.warn("Error reading cached article by slug:", e);
  }
  return null;
}

/** Save an article to offline cache (both individual key and merged dynamic list) */
export async function saveArticleToOfflineCache(article: any): Promise<void> {
  if (!article) return;
  try {
    if (isArticleContentValid(article)) {
      if (article.slug) {
        await set(`quran_offline_art_${article.slug}`, article);
      }
      if (article.id) {
        await set(`quran_offline_art_${article.id}`, article);
      }
    }

    const list = await getCachedDynamicArticles();
    const idx = list.findIndex(
      (a) => (article.slug && a.slug === article.slug) || (article.id && a.id === article.id)
    );
    let updatedList: any[];
    if (idx >= 0) {
      updatedList = [...list];
      const prev = list[idx];
      updatedList[idx] = {
        ...prev,
        ...article,
        content_bn: article.content_bn || prev.content_bn,
        content_en: article.content_en || prev.content_en,
      };
    } else {
      updatedList = [article, ...list];
    }
    await cacheDynamicArticles(updatedList);
  } catch (e) {
    console.warn("Error saving article to offline cache:", e);
  }
}

/** Fetch an article online from quraan.bd API and immediately cache it for offline reading */
export async function fetchAndCacheArticle(slug: string): Promise<any | null> {
  if (!slug) return null;
  try {
    let cleanSlug = slug;
    try {
      cleanSlug = decodeURIComponent(slug);
    } catch {}

    const isLocalOrApp =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("androidplatform.net") ||
        window.location.hostname === "localhost" ||
        window.location.protocol === "file:");

    const baseUrl = isLocalOrApp ? "https://www.quraan.bd" : "";
    const apiUrl = `${baseUrl}/api/public/articles?slug=${encodeURIComponent(cleanSlug)}&t=${Date.now()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const art = await res.json();
      if (art && !art.error && isArticleContentValid(art)) {
        await saveArticleToOfflineCache(art);
        return art;
      }
    }
  } catch (err) {
    console.warn("fetchAndCacheArticle network fetch error:", err);
  }
  return null;
}

/** Queue an action for when the app comes back online */
export async function queuePendingSync(item: Omit<PendingSyncItem, "id" | "createdAt">) {
  try {
    const queue = (await get<PendingSyncItem[]>(PENDING_QUEUE_KEY)) || [];
    const newItem: PendingSyncItem = {
      ...item,
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    queue.push(newItem);
    await set(PENDING_QUEUE_KEY, queue);
    currentStatus.pendingCount = queue.length;
    notifyListeners();
  } catch (e) {
    console.warn("Error queuing pending sync item:", e);
  }
}

/** Flush and push all queued actions to Cloudflare D1 when network is restored */
export async function flushPendingSyncQueue(): Promise<number> {
  let flushed = 0;
  try {
    const queue = (await get<PendingSyncItem[]>(PENDING_QUEUE_KEY)) || [];
    if (queue.length === 0) return 0;

    const remaining: PendingSyncItem[] = [];

    const isLocalOrApp =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("androidplatform.net") ||
        window.location.hostname === "localhost" ||
        window.location.protocol === "file:");
    const baseUrl = isLocalOrApp ? "https://www.quraan.bd" : "";

    for (const item of queue) {
      try {
        let synced = false;
        // 1. Push to Cloudflare D1 via Edge API
        if (item.type === "create_article" || item.type === "update_article") {
          const payload = item.payload?.data || item.payload || {};
          const res = await fetch(`${baseUrl}/api/public/articles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save", ...payload, id: item.payload?.id || payload.id }),
          });
          if (res.ok) synced = true;
        } else if (item.type === "trash_article") {
          const res = await fetch(`${baseUrl}/api/public/articles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "trash", id: item.payload?.id }),
          });
          if (res.ok) synced = true;
        }

        if (synced) {
          flushed++;
          // Non-blocking mirror to Supabase
          try {
            const supabase = await getSupabase();
            if (item.type === "create_article") {
              void supabase.from("articles").insert(item.payload);
            } else if (item.type === "update_article") {
              void supabase.from("articles").update(item.payload.data).eq("id", item.payload.id);
            } else if (item.type === "trash_article") {
              void supabase.from("articles").update({ deleted_at: new Date().toISOString() }).eq("id", item.payload.id);
            }
          } catch {}
        } else {
          remaining.push(item);
        }
      } catch (err) {
        console.warn("Failed to sync item:", item, err);
        remaining.push(item);
      }
    }

    await set(PENDING_QUEUE_KEY, remaining);
    currentStatus.pendingCount = remaining.length;
    notifyListeners();
  } catch (e) {
    console.warn("Error flushing pending sync queue:", e);
  }
  return flushed;
}

/** Perform full bidirectional sync with Cloudflare D1 (quraan.bd Edge API) */
export async function performDualSync(
  queryClient?: any,
  options?: { lightBoot?: boolean }
): Promise<boolean> {
  if (currentStatus.isSyncing) return false;
  const isLightBoot = Boolean(options?.lightBoot);

  currentStatus.isSyncing = true;
  notifyListeners();

  try {
    // 1. Flush any pending offline changes
    await flushPendingSyncQueue();

    // 2. Fetch fresh published articles metadata from Cloudflare D1 Edge API
    let apiArticles: any[] = [];
    try {
      const isLocalOrApp =
        typeof window !== "undefined" &&
        (window.location.hostname.includes("androidplatform.net") ||
          window.location.hostname === "localhost" ||
          window.location.protocol === "file:");

      const baseUrl = isLocalOrApp ? "https://www.quraan.bd" : "";
      const apiUrl = `${baseUrl}/api/public/articles?t=${Date.now()}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.articles)) {
          apiArticles = json.articles;
        }
        if (json && Array.isArray(json.categories) && json.categories.length > 0) {
          await cacheDynamicCategories(json.categories);
        }
      }
    } catch (apiErr) {
      console.warn("D1 sync: Edge API fetch notice:", apiErr);
    }

    const combinedMap = new Map<string, any>();
    for (const art of apiArticles) {
      const key = art.slug || art.id;
      if (key) {
        combinedMap.set(key, art);
      }
    }

    const mergedArticles = Array.from(combinedMap.values());

    if (mergedArticles.length > 0) {
      // 3. Cache metadata locally for offline persistence
      await cacheDynamicArticles(mergedArticles);

      // Only pre-download full HTML for 15 articles when manual sync is requested (not on every visitor's initial page load)
      if (!isLightBoot) {
        for (const art of mergedArticles.slice(0, 15)) {
          if (art.slug) {
            fetchAndCacheArticle(art.slug).catch(() => {});
          }
        }
      }

      const timestamp = new Date().toISOString();
      currentStatus.lastSyncedAt = timestamp;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(SYNC_TIMESTAMP_KEY, timestamp);
        } catch {}
      }
    }

    // 5. Fetch & cache latest App Design & Layout Settings (Zero-Reinstall OTA sync via Cloudflare D1)
    try {
      const { syncAppDesignSettings } = await import("@/lib/designSync");
      await syncAppDesignSettings();
    } catch (designErr) {
      console.warn("Dual sync design settings notice:", designErr);
    }

    // 6. Invalidate TanStack Query caches on manual sync so UI updates everywhere
    if (queryClient && !isLightBoot) {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-single-detail"] });
      queryClient.invalidateQueries({ queryKey: ["article-prev-next-nav"] });
      queryClient.invalidateQueries({ queryKey: ["wp-admin-articles-summary"] });
      queryClient.invalidateQueries({ queryKey: ["global-search-articles"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["authors-list"] });
    }

    // Broadcast global articles-synced event so UI components can immediately update
    if (typeof window !== "undefined" && mergedArticles.length > 0) {
      window.dispatchEvent(
        new CustomEvent("quran:articles-synced", {
          detail: { articles: mergedArticles },
        })
      );
    }

    // 7. Full bidirectional sync of Quran ayah translations & metadata overrides from Supabase (only on manual sync)
    if (!isLightBoot) {
      try {
        await syncQuranVersesAndTranslations(queryClient);
      } catch (versesErr) {
        console.warn("Verses sync notice during dual sync:", versesErr);
      }
    }

    currentStatus.isOnline = true;
    currentStatus.isSyncing = false;
    notifyListeners();
    return true;
  } catch (err) {
    console.warn("Dual sync error:", err);
    currentStatus.isSyncing = false;
    notifyListeners();
    return false;
  }
}

export const triggerDualSync = performDualSync;

/**
 * Sync all Ayah translations, modern translations, lexicon notes, and metadata from Supabase
 * into local offline storage (IndexedDB + Cache Storage) and invalidate Quran queries.
 */
export async function syncQuranVersesAndTranslations(queryClient?: any): Promise<number> {
  try {
    const isLocalOrApp =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("androidplatform.net") ||
        window.location.hostname === "localhost" ||
        window.location.protocol === "file:");
    const baseUrl = isLocalOrApp ? "https://www.quraan.bd" : "";

    // 1. Fetch all cloud overrides across translation & verse tables from Supabase with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const supabase = await getSupabase();
    const [transRes, verseRes, metaRes, engRes] = await Promise.all([
      (supabase as any).from("verse_translations").select("surah, ayah, lang, text, note, updated_at"),
      (supabase as any).from("quran_verses").select("surah, ayah, conventional_bn, conventional_en, modern_translation_bn, modern_translation_en, lexicon_modern_notes, meta_bn, meta_en, updated_at"),
      (supabase as any).from("ayah_metadata").select("surah, ayah, meta_bn, meta_en"),
      (supabase as any).from("quran_english_translations").select("*"),
    ]);
    clearTimeout(timeout);

    const transRows: any[] = Array.isArray(transRes?.data) ? transRes.data : [];
    const verseRows: any[] = Array.isArray(verseRes?.data) ? verseRes.data : [];
    const metaRows: any[] = Array.isArray(metaRes?.data) ? metaRes.data : [];
    const engRows: any[] = Array.isArray(engRes?.data) ? engRes.data : [];

    // 2. Identify all surahs that have cloud overrides
    const surahsToSync = new Set<number>();
    for (const r of transRows) if (r.surah) surahsToSync.add(Number(r.surah));
    for (const r of verseRows) if (r.surah) surahsToSync.add(Number(r.surah));
    for (const r of metaRows) if (r.surah) surahsToSync.add(Number(r.surah));
    for (const r of engRows) if (r.surah) surahsToSync.add(Number(r.surah));

    // Also include currently active surah if user is on a /surah/:id route
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/surah\/(\d+)/);
      if (match && match[1]) {
        const activeSurah = Number(match[1]);
        if (activeSurah >= 1 && activeSurah <= 114) {
          surahsToSync.add(activeSurah);
        }
      }
    }
    // Always guarantee Surah 1 is included
    surahsToSync.add(1);

    const list = Array.from(surahsToSync);

    // 3. For each affected surah, load base data, apply overrides, and save offline
    await Promise.all(
      list.map(async (sId) => {
        try {
          let surahData: any = await getSurahOffline(sId);
          const isSurah2Outdated = (sId === 2 && surahData?.ayahs && !surahData.ayahs.find((a: any) => a.ayah === 286)?.scientific_translation_bn) || (sId === 3 && surahData?.ayahs && !surahData.ayahs.find((a: any) => a.ayah === 30)?.scientific_translation_bn);
          if (!surahData || !Array.isArray(surahData.ayahs) || surahData.ayahs.length === 0 || isSurah2Outdated) {
            try {
              const res = await fetch(`${baseUrl}/data/quran/surahs/${sId}.json?v=${Date.now()}`);
              if (res.ok) {
                surahData = await res.json();
              }
            } catch {
              try {
                const resLocal = await fetch(`/data/quran/surahs/${sId}.json`);
                if (resLocal.ok) {
                  surahData = await resLocal.json();
                }
              } catch {}
            }
          }

          if (surahData && Array.isArray(surahData.ayahs) && surahData.ayahs.length > 0) {
            // Apply ayah_metadata overrides
            const sMeta = metaRows.filter((r) => r.surah === sId);
            if (sMeta.length > 0) {
              const mMap = new Map<number, any>();
              for (const r of sMeta) mMap.set(r.ayah, r);
              for (const a of surahData.ayahs) {
                const cloudM = mMap.get(a.ayah);
                if (cloudM) {
                  if (cloudM.meta_bn && typeof cloudM.meta_bn === "string" && cloudM.meta_bn.trim().length > 0 && !/Surah\s+\d+\s+Ayah\s+\d+\s+Theme/i.test(cloudM.meta_bn)) {
                    a.meta_bn = cloudM.meta_bn.trim();
                  }
                  if (cloudM.meta_en && typeof cloudM.meta_en === "string" && cloudM.meta_en.trim().length > 0 && !/Surah\s+\d+\s+Ayah\s+\d+\s+Theme/i.test(cloudM.meta_en)) {
                    a.meta_en = cloudM.meta_en.trim();
                  }
                }
              }
            }

            // Apply quran_verses overrides
            const sVerse = verseRows.filter((r) => r.surah === sId);
            if (sVerse.length > 0) {
              const vMap = new Map<number, any>();
              for (const r of sVerse) vMap.set(r.ayah, r);
              for (const a of surahData.ayahs) {
                const cv = vMap.get(a.ayah);
                if (cv) {
                  if (cv.conventional_bn && typeof cv.conventional_bn === "string" && cv.conventional_bn.trim().length > 0) {
                    a.conventional_bn = cv.conventional_bn.trim();
                    a.translation_bn = cv.conventional_bn.trim();
                    a.bn_text = cv.conventional_bn.trim();
                  }
                  if (cv.conventional_en && typeof cv.conventional_en === "string" && cv.conventional_en.trim().length > 0) {
                    a.conventional_en = cv.conventional_en.trim();
                    a.translation_en = cv.conventional_en.trim();
                    a.en_text = cv.conventional_en.trim();
                  }
                  const cloudUpdatedAt = cv.updated_at ? new Date(cv.updated_at).getTime() : Date.now();
                  if (cv.modern_translation_bn && typeof cv.modern_translation_bn === "string" && cv.modern_translation_bn.trim().length > 0 && cv.modern_translation_bn.trim() !== "—") {
                    a.modern_translation_bn = cv.modern_translation_bn.trim();
                    a.saved_at = cloudUpdatedAt;
                  }
                  if (cv.modern_translation_en && typeof cv.modern_translation_en === "string" && cv.modern_translation_en.trim().length > 0 && cv.modern_translation_en.trim() !== "—") {
                    a.modern_translation_en = cv.modern_translation_en.trim();
                    a.saved_at = cloudUpdatedAt;
                  }
                  if (cv.scientific_translation_bn && typeof cv.scientific_translation_bn === "string" && cv.scientific_translation_bn.trim().length > 0 && cv.scientific_translation_bn.trim() !== "—") {
                    a.scientific_translation_bn = cv.scientific_translation_bn.trim();
                    a.saved_at = cloudUpdatedAt;
                  }
                  if (cv.scientific_translation_en && typeof cv.scientific_translation_en === "string" && cv.scientific_translation_en.trim().length > 0 && cv.scientific_translation_en.trim() !== "—") {
                    a.scientific_translation_en = cv.scientific_translation_en.trim();
                    a.saved_at = cloudUpdatedAt;
                  }
                  if (cv.lexicon_modern_notes && typeof cv.lexicon_modern_notes === "string" && cv.lexicon_modern_notes.trim().length > 0) {
                    a.lexicon_modern_notes = cv.lexicon_modern_notes.trim();
                  }
                  if (cv.meta_bn && typeof cv.meta_bn === "string" && cv.meta_bn.trim().length > 0 && !/Surah\s+\d+\s+Ayah\s+\d+\s+Theme/i.test(cv.meta_bn)) {
                    a.meta_bn = cv.meta_bn.trim();
                  }
                  if (cv.meta_en && typeof cv.meta_en === "string" && cv.meta_en.trim().length > 0 && !/Surah\s+\d+\s+Ayah\s+\d+\s+Theme/i.test(cv.meta_en)) {
                    a.meta_en = cv.meta_en.trim();
                  }
                }
              }
            }

            // Apply verse_translations overrides
            const sTrans = transRows.filter((r) => r.surah === sId);
            if (sTrans.length > 0) {
              for (const tr of sTrans) {
                const a = surahData.ayahs.find((item: any) => item.ayah === tr.ayah);
                if (a && tr.text && typeof tr.text === "string" && tr.text.trim().length > 0) {
                  const tTrim = tr.text.trim();
                  const rowUpdatedAt = tr.updated_at ? new Date(tr.updated_at).getTime() : Date.now();
                  if (tr.lang === "bn_std" || tr.lang === "conventional_bn") {
                    a.conventional_bn = tTrim;
                    a.translation_bn = tTrim;
                    a.bn_text = tTrim;
                  } else if (tr.lang === "en_std" || tr.lang === "conventional_en") {
                    a.conventional_en = tTrim;
                    a.translation_en = tTrim;
                    a.en_text = tTrim;
                  } else if (tr.lang === "bn" || tr.lang === "modern_bn" || tr.lang === "modern_translation_bn") {
                    if (tTrim.length > 0 && tTrim !== "—") {
                      a.modern_translation_bn = tTrim;
                      a.saved_at = rowUpdatedAt;
                    }
                  } else if (tr.lang === "en" || tr.lang === "modern_en" || tr.lang === "modern_translation_en") {
                    if (tTrim.length > 0 && tTrim !== "—") {
                      a.modern_translation_en = tTrim;
                      a.saved_at = rowUpdatedAt;
                    }
                  } else if (tr.lang === "scientific_bn" || tr.lang === "scientific_translation_bn") {
                    if (tTrim.length > 0 && tTrim !== "—") {
                      a.scientific_translation_bn = tTrim;
                      a.saved_at = rowUpdatedAt;
                    }
                  } else if (tr.lang === "scientific_en" || tr.lang === "scientific_translation_en") {
                    if (tTrim.length > 0 && tTrim !== "—") {
                      a.scientific_translation_en = tTrim;
                      a.saved_at = rowUpdatedAt;
                    }
                  }
                }
              }
            }

            // Apply quran_english_translations overrides
            const sEng = engRows.filter((r) => r.surah === sId);
            if (sEng.length > 0) {
              const eMap = new Map<number, any>();
              for (const r of sEng) eMap.set(r.ayah, r);
              for (const a of surahData.ayahs) {
                const ce = eMap.get(a.ayah);
                if (ce) {
                  a.english_translations = {
                    sahih_international: ce.sahih_international || a.english_translations?.sahih_international || "",
                    pickthall: ce.pickthall || a.english_translations?.pickthall || "",
                    yusuf_ali: ce.yusuf_ali || a.english_translations?.yusuf_ali || "",
                    shakir: ce.shakir || a.english_translations?.shakir || "",
                    muhammad_sarwar: ce.muhammad_sarwar || a.english_translations?.muhammad_sarwar || "",
                    mohsin_khan: ce.mohsin_khan || a.english_translations?.mohsin_khan || "",
                    arberry: ce.arberry || a.english_translations?.arberry || "",
                  };
                }
              }
            }

            // Save to offline storage
            await saveSurahOffline(sId, surahData);

            // Update in-memory react query cache if client available
            if (queryClient) {
              queryClient.setQueriesData({ queryKey: ["local-surah-cache", sId] }, () => surahData);
              queryClient.setQueriesData({ queryKey: ["local-surah-init", sId] }, (prev: any) =>
                prev && Array.isArray(prev.ayahs)
                  ? { ...prev, ayahs: surahData.ayahs.slice(0, 5) }
                  : surahData
              );
            }
          }
        } catch (surahErr) {
          console.warn(`Error syncing translations for Surah ${sId}:`, surahErr);
        }
      })
    );

    // 4. Invalidate all Quran queries in React Query
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ["local-surah-cache"] });
      queryClient.invalidateQueries({ queryKey: ["local-surah-init"] });
      queryClient.invalidateQueries({ queryKey: ["quran"] });
      queryClient.invalidateQueries({ queryKey: ["surah"] });
      queryClient.invalidateQueries({ queryKey: ["verse-translations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verse-translations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-verses-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin-surah-dataset"] });
    }

    // 5. Broadcast global event for any active page or component listening
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("quran:verses-synced", {
          detail: { surahs: list },
        })
      );
    }

    return list.length;
  } catch (err) {
    console.warn("syncQuranVersesAndTranslations error:", err);
    return 0;
  }
}

/**
 * Main React Hook for Dual Support (Offline + Online Sync)
 * Can be used in components to display sync status or trigger manual sync.
 */
export function useDualSupportSync() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DualSyncStatus>(currentStatus);
  const isInitialMount = useRef(true);

  const handleSyncNow = useCallback(async () => {
    return toast.promise(performDualSync(queryClient), {
      loading: "সার্ভারের সাথে সিঙ্ক হচ্ছে...",
      success: "সবশেষ আর্টিকেল, অনুবাদ ও লেটেস্ট ডিজাইন সফলভাবে সিঙ্ক সম্পন্ন হয়েছে!",
      error: "সিঙ্ক করতে ব্যর্থ হয়েছে (ইন্টারনেট কানেকশন চেক করুন)",
    });
  }, [queryClient]);

  useEffect(() => {
    // Register listener for global status updates
    listeners.add(setStatus);

    // Read stored last sync time
    if (typeof window !== "undefined") {
      const storedTime = localStorage.getItem(SYNC_TIMESTAMP_KEY);
      if (storedTime) {
        currentStatus.lastSyncedAt = storedTime;
        setStatus((s) => ({ ...s, lastSyncedAt: storedTime }));
      }
    }

    const onOnline = async () => {
      currentStatus.isOnline = true;
      notifyListeners();
      toast.info("ইন্টারনেটে সংযুক্ত হয়েছে — ক্লাউড ডাটা সিঙ্ক হচ্ছে...");
      const success = await performDualSync(queryClient);
      if (success) {
        toast.success("সবশেষ আর্টিকেল, অনুবাদ ও লেটেস্ট ডিজাইন স্বয়ংক্রিয়ভাবে সিঙ্ক সম্পন্ন হয়েছে!");
      }
    };

    const onOffline = () => {
      currentStatus.isOnline = false;
      notifyListeners();
      toast.warning("অফলাইন মোড সক্রিয় — স্থানীয় সংরক্ষিত ডাটা ব্যবহৃত হচ্ছে");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Initial check on mount: perform lightweight background sync once (deferred to idle)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          performDualSync(queryClient, { lightBoot: true }).catch(() => {});
        });
      } else {
        setTimeout(() => {
          performDualSync(queryClient, { lightBoot: true }).catch(() => {});
        }, 2500);
      }
    }

    return () => {
      listeners.delete(setStatus);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [queryClient]);

  return {
    ...status,
    syncNow: handleSyncNow,
  };
}
