import { supabase } from "@/integrations/supabase/client";
import { get, set, del } from "idb-keyval";
import { getCachedDynamicArticles, cacheDynamicArticles } from "@/lib/dualSupportSync";
import { STATIC_ARTICLES_META } from "@/lib/staticArticlesMeta";

const TRASHED_STORAGE_KEY = "quran_trashed_articles_v1";
const PERMANENT_DELETED_KEY = "quran_permanently_deleted_articles_v1";

/**
 * Get the set of permanently deleted article IDs & slugs from localStorage and memory
 */
export function getPermanentlyDeletedKeys(): Set<string> {
  const setKeys = new Set<string>();
  if (typeof window === "undefined") return setKeys;
  try {
    const raw = localStorage.getItem(PERMANENT_DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((k: string) => {
          if (k) setKeys.add(String(k).toLowerCase());
        });
      }
    }
  } catch (e) {
    console.warn("Error reading permanently deleted keys:", e);
  }
  return setKeys;
}

/**
 * Get the set of trashed (soft-deleted) article IDs & slugs from localStorage
 */
export function getTrashedArticleKeys(): Set<string> {
  const setKeys = new Set<string>();
  if (typeof window === "undefined") return setKeys;
  try {
    const raw = localStorage.getItem(TRASHED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((k: string) => {
          if (k) setKeys.add(String(k).toLowerCase());
        });
      }
    }
  } catch (e) {
    console.warn("Error reading trashed article keys:", e);
  }
  return setKeys;
}

/**
 * Check if an article is marked as permanently deleted
 */
export function isArticlePermanentlyDeleted(identifier?: string | null): boolean {
  if (!identifier) return false;
  const clean = String(identifier).toLowerCase();
  // কোডবেসের সক্রিয় প্রকাশিত স্ট্যাটিক আর্টিকেল কখনোই পার্মানেন্ট ডিলিট হবে না
  if (STATIC_ARTICLES_META.some((sa) => sa.slug?.toLowerCase() === clean || sa.id?.toLowerCase() === clean)) {
    return false;
  }
  const setKeys = getPermanentlyDeletedKeys();
  return setKeys.has(clean);
}

/**
 * Check if an article is in trash (soft-deleted)
 */
export function isArticleTrashed(article?: { id?: string; slug?: string; deleted_at?: string | null } | null): boolean {
  if (!article) return false;
  const artSlug = article.slug?.toLowerCase();
  const artId = article.id?.toLowerCase();
  // কোডবেসের সক্রিয় প্রকাশিত স্ট্যাটিক আর্টিকেল কখনোই ট্র্যাশ হবে না
  if (STATIC_ARTICLES_META.some((sa) => (artSlug && sa.slug?.toLowerCase() === artSlug) || (artId && sa.id?.toLowerCase() === artId))) {
    return false;
  }
  if (article.deleted_at) return true;
  const trashedKeys = getTrashedArticleKeys();
  if (artId && trashedKeys.has(artId)) return true;
  if (artSlug && trashedKeys.has(artSlug)) return true;
  return false;
}


/**
 * Move an article to trash (handles both static and dynamic articles safely)
 */
export async function moveArticleToTrash(article: { id: string; slug?: string; [key: string]: any }): Promise<void> {
  if (!article?.id) return;
  const now = new Date().toISOString();

  // 1. Update localStorage tracking
  try {
    const trashed = getTrashedArticleKeys();
    if (article.id) trashed.add(article.id.toLowerCase());
    if (article.slug) trashed.add(article.slug.toLowerCase());
    localStorage.setItem(TRASHED_STORAGE_KEY, JSON.stringify(Array.from(trashed)));
  } catch {}

  // 1.5. Update D1 via Edge API
  try {
    const { getStoredAuthToken } = await import("@/lib/auth");
    const token = getStoredAuthToken();
    if (token) {
      await fetch("/api/public/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "trash", id: article.id || article.slug }),
      });
    }
  } catch {}

  // 2. Update or upsert into Supabase (mirror / fallback)
  try {
    const { data: updated, error } = await (supabase.from("articles") as any)
      .update({ deleted_at: now, published: false })
      .eq("id", article.id)
      .select();

    if ((!updated || updated.length === 0) && !error) {
      // If it was a static article not yet in DB, upsert it with deleted_at
      await (supabase.from("articles") as any).upsert({
        ...article,
        deleted_at: now,
        published: false,
      }, { onConflict: "slug" });
    }
  } catch (err) {
    console.warn("Failed to soft delete in Supabase, attempting fallback:", err);
    try {
      await (supabase.from("articles") as any)
        .update({ published: false })
        .eq("id", article.id);
    } catch {}
  }

  // 3. Update offline dynamic cache
  try {
    const list = await getCachedDynamicArticles();
    const updated = list.map((a) => {
      if (a.id === article.id || (article.slug && a.slug === article.slug)) {
        return { ...a, deleted_at: now, published: false };
      }
      return a;
    });
    await cacheDynamicArticles(updated);
  } catch {}
}

/**
 * Restore an article from trash
 */
export async function restoreArticleFromTrash(article: { id: string; slug?: string; [key: string]: any }): Promise<void> {
  if (!article?.id) return;

  // 1. Update localStorage tracking
  try {
    const trashed = getTrashedArticleKeys();
    if (article.id) trashed.delete(article.id.toLowerCase());
    if (article.slug) trashed.delete(article.slug.toLowerCase());
    localStorage.setItem(TRASHED_STORAGE_KEY, JSON.stringify(Array.from(trashed)));

    const perm = getPermanentlyDeletedKeys();
    if (article.id) perm.delete(article.id.toLowerCase());
    if (article.slug) perm.delete(article.slug.toLowerCase());
    localStorage.setItem(PERMANENT_DELETED_KEY, JSON.stringify(Array.from(perm)));
  } catch {}

  // 1.5. Update D1 via Edge API
  try {
    const { getStoredAuthToken } = await import("@/lib/auth");
    const token = getStoredAuthToken();
    if (token) {
      await fetch("/api/public/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "restore", id: article.id || article.slug }),
      });
    }
  } catch {}

  // 2. Update in Supabase (mirror / fallback)
  try {
    await (supabase.from("articles") as any)
      .update({ deleted_at: null, published: true })
      .eq("id", article.id);
  } catch (err) {
    console.warn("Restore error in Supabase:", err);
  }

  // 3. Update offline dynamic cache
  try {
    const list = await getCachedDynamicArticles();
    const updated = list.map((a) => {
      if (a.id === article.id || (article.slug && a.slug === article.slug)) {
        return { ...a, deleted_at: null, published: true };
      }
      return a;
    });
    await cacheDynamicArticles(updated);
  } catch {}
}

/**
 * Permanently delete an article (both from DB and ensures static fallback ignores it)
 */
export async function permanentlyDeleteArticle(article: { id: string; slug?: string; [key: string]: any }): Promise<void> {
  if (!article?.id) return;

  // 1. Record in permanent deletion blacklist so static lists never resurrect it
  try {
    const perm = getPermanentlyDeletedKeys();
    if (article.id) perm.add(article.id.toLowerCase());
    if (article.slug) perm.add(article.slug.toLowerCase());
    localStorage.setItem(PERMANENT_DELETED_KEY, JSON.stringify(Array.from(perm)));

    const trashed = getTrashedArticleKeys();
    if (article.id) trashed.delete(article.id.toLowerCase());
    if (article.slug) trashed.delete(article.slug.toLowerCase());
    localStorage.setItem(TRASHED_STORAGE_KEY, JSON.stringify(Array.from(trashed)));
  } catch {}

  // 1.5. Delete from D1 via Edge API
  try {
    const { getStoredAuthToken } = await import("@/lib/auth");
    const token = getStoredAuthToken();
    if (token) {
      await fetch("/api/public/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "delete", id: article.id || article.slug }),
      });
    }
  } catch {}

  // 2. Delete from Supabase (mirror / fallback)
  try {
    await supabase.from("articles").delete().eq("id", article.id);
    if (article.slug) {
      await supabase.from("articles").delete().eq("slug", article.slug);
    }
  } catch (err) {
    console.warn("Delete error in Supabase:", err);
  }

  // 3. Delete from IndexedDB / LocalStorage individual caches
  try {
    if (article.slug) {
      await del(`quran_offline_art_${article.slug}`);
    }
    await del(`quran_offline_art_${article.id}`);

    const list = await getCachedDynamicArticles();
    const filtered = list.filter(
      (a) => a.id !== article.id && (!article.slug || a.slug !== article.slug)
    );
    await cacheDynamicArticles(filtered);
  } catch (cacheErr) {
    console.warn("Failed to clear offline cache for deleted article:", cacheErr);
  }
}
