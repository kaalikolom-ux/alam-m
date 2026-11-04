import { useEffect, useState } from "react";
import { get, set, del, clear } from "idb-keyval";

/** Cache Storage buckets */
export const AUDIO_CACHE = "quran-audio-v1";
export const SURAH_TEXT_CACHE = "quran-text-v10";
const IDB_NAME = "quran_offline_storage_v7";
const AUDIO_STORE = "offline_audio";
const SURAH_STORE = "offline_surahs";

// Purge obsolete pre-scientific translation cache from client storage
if (typeof window !== "undefined") {
  try {
    if ("indexedDB" in window) {
      indexedDB.deleteDatabase("quran_offline_storage_v5");
      indexedDB.deleteDatabase("quran_offline_storage_v6");
    }
    if ("caches" in window) {
      caches.delete("quran-text-v8").catch(() => {});
      caches.delete("quran-text-v9").catch(() => {});
    }
  } catch {}
}

/** IndexedDB helper for 100% reliable persistence in Web, PWA, and APK WebViews */
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: "url" });
      }
      if (!db.objectStoreNames.contains(SURAH_STORE)) {
        db.createObjectStore(SURAH_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function cachesAvailable() {
  return typeof window !== "undefined" && "caches" in window;
}

/** Save audio blob to idb-keyval, Cache Storage and IndexedDB */
export async function saveAudioOffline(url: string, blob: Blob): Promise<void> {
  const buffer = await blob.arrayBuffer();
  const type = blob.type || "audio/mpeg";

  // 1. Primary: idb-keyval (Supported across 100% of modern browsers, WebViews and Android APKs)
  try {
    await set(`quran_audio_${url}`, { buffer, type, timestamp: Date.now() });
  } catch (e) {
    console.warn("idb-keyval save warning:", e);
  }

  // 2. Cache Storage
  if (cachesAvailable()) {
    try {
      const cache = await caches.open(AUDIO_CACHE);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const normalizedUrl = url.startsWith("http") ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
      const response = new Response(buffer.slice(0), {
        headers: {
          "Content-Type": type,
          "Content-Length": String(buffer.byteLength),
          "Accept-Ranges": "bytes",
        },
      });
      await cache.put(normalizedUrl, response);
    } catch (e) {
      console.warn("CacheStorage audio save warning:", e);
    }
  }

  // 3. Secondary IndexedDB
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(AUDIO_STORE, "readwrite");
    tx.objectStore(AUDIO_STORE).put({ url, blob: new Blob([buffer], { type }), timestamp: Date.now() });
  } catch (e) {
    console.warn("IndexedDB audio save warning:", e);
  }
}

/** Check if an audio URL is stored offline */
export async function isAudioSavedOffline(url: string): Promise<boolean> {
  // 1. Check idb-keyval first
  try {
    const item = await get<any>(`quran_audio_${url}`);
    if (item && (item.buffer || item.byteLength || item instanceof Blob)) {
      return true;
    }
  } catch {}

  // 2. Cache Storage check
  if (cachesAvailable()) {
    try {
      const cache = await caches.open(AUDIO_CACHE);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const normalizedUrl = url.startsWith("http") ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
      const hit = await cache.match(normalizedUrl);
      if (hit) return true;
    } catch {}
  }

  // 3. IndexedDB check
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(AUDIO_STORE, "readonly");
    const store = tx.objectStore(AUDIO_STORE);
    const hasItem = await new Promise<boolean>((resolve) => {
      const req = store.get(url);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
    if (hasItem) return true;
  } catch {}

  return false;
}

/** Resolve a playable URL for an ayah audio (offline object URL preferred) */
export async function resolveAudioSrc(url: string): Promise<string> {
  // 1. Check idb-keyval (fastest and most reliable)
  try {
    const item = await get<any>(`quran_audio_${url}`);
    if (item) {
      if (item instanceof Blob) {
        return URL.createObjectURL(item);
      }
      if (item.buffer) {
        const blob = new Blob([item.buffer], { type: item.type || "audio/mpeg" });
        return URL.createObjectURL(blob);
      }
    }
  } catch (e) {
    console.warn("idb-keyval audio resolve warning:", e);
  }

  // 2. Check Cache Storage
  if (cachesAvailable()) {
    try {
      const cache = await caches.open(AUDIO_CACHE);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const normalizedUrl = url.startsWith("http") ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
      const hit = await cache.match(normalizedUrl);
      if (hit) {
        const buffer = await hit.arrayBuffer();
        const blob = new Blob([buffer], { type: "audio/mpeg" });
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn("CacheStorage match warning:", e);
    }
  }

  // 3. Check IndexedDB
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(AUDIO_STORE, "readonly");
    const store = tx.objectStore(AUDIO_STORE);
    const item = await new Promise<any>((resolve) => {
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    if (item && item.blob) {
      const blob = item.blob.type === "audio/mpeg" ? item.blob : new Blob([await item.blob.arrayBuffer()], { type: "audio/mpeg" });
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn("IndexedDB audio lookup warning:", e);
  }

  // 4. Online fallback (direct remote URL)
  return url;
}

/** Check if all ayahs in a surah are downloaded */
export async function isSurahAudioDownloaded(urls: string[]): Promise<boolean> {
  if (urls.length === 0) return false;
  const first = await isAudioSavedOffline(urls[0]!);
  const last = await isAudioSavedOffline(urls[urls.length - 1]!);
  return first && last;
}

/** Download every ayah recitation into offline storage */
export async function downloadSurahAudio(
  urls: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  let done = 0;
  for (const url of urls) {
    const isSaved = await isAudioSavedOffline(url);
    if (!isSaved) {
      try {
        const res = await fetch(url, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          await saveAudioOffline(url, blob);
        }
      } catch (e) {
        console.warn("Audio download error for", url, e);
      }
    }
    done += 1;
    onProgress?.(done, urls.length);
  }
}

/** Delete an audio file from offline storage */
export async function deleteAudioOffline(url: string): Promise<void> {
  if (cachesAvailable()) {
    try {
      const cache = await caches.open(AUDIO_CACHE);
      await cache.delete(url);
    } catch {}
  }
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(AUDIO_STORE, "readwrite");
    tx.objectStore(AUDIO_STORE).delete(url);
  } catch {}
}

export async function removeSurahAudio(urls: string[]): Promise<void> {
  await Promise.all(urls.map((u) => deleteAudioOffline(u)));
}

/** Save a full surah JSON to offline storage (safely merges partial init data without destroying full surah cache) */
export async function saveSurahOffline(surahId: number, data: any): Promise<void> {
  if (!data?.ayahs || !Array.isArray(data.ayahs)) return;

  // Protect full surah cache: if incoming data is partial, merge into existing cached surah
  let dataToSave = data;
  const isPartial = Boolean(data.is_partial || data.ayahs.length <= 5);
  if (isPartial) {
    try {
      const existing = await getSurahOffline(surahId);
      if (existing?.ayahs && existing.ayahs.length > data.ayahs.length) {
        const mergedAyahs = [...existing.ayahs];
        for (const newAyah of data.ayahs) {
          const idx = mergedAyahs.findIndex((ea: any) => ea.ayah === newAyah.ayah);
          if (idx !== -1) {
            mergedAyahs[idx] = { ...mergedAyahs[idx], ...newAyah };
          }
        }
        dataToSave = { ...existing, ayahs: mergedAyahs };
      }
    } catch {}
  }

  const url = `/data/quran/surahs/${surahId}.json`;
  if (cachesAvailable()) {
    try {
      const cache = await caches.open(SURAH_TEXT_CACHE);
      await cache.put(url, new Response(JSON.stringify(dataToSave), {
        headers: { "Content-Type": "application/json" }
      }));
    } catch {}
  }
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(SURAH_STORE, "readwrite");
    tx.objectStore(SURAH_STORE).put({ id: surahId, data: dataToSave, timestamp: Date.now() });
  } catch {}
}

/** Retrieve a full surah JSON from offline storage */
export async function getSurahOffline(surahId: number): Promise<any | null> {
  // 1. Try Cache Storage
  const url = `/data/quran/surahs/${surahId}.json`;
  if (cachesAvailable()) {
    try {
      const cache = await caches.open(SURAH_TEXT_CACHE);
      const hit = await cache.match(url);
      if (hit) {
        return await hit.json();
      }
    } catch {}
  }

  // 2. Try IndexedDB
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(SURAH_STORE, "readonly");
    const store = tx.objectStore(SURAH_STORE);
    return new Promise((resolve) => {
      const req = store.get(surahId);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Generate offline cache key for an ayah's translation TTS audio */
export function getTranslationAudioKey(surah: number, ayah: number, track: string): string {
  return `/api/public/tts?surah=${surah}&ayah=${ayah}&track=${track}&v=toha`;
}

/** Fetch translation audio from edge TTS (or offline cache) and cache it */
export async function getOrFetchTranslationAudio(
  surah: number,
  ayah: number,
  track: string,
  text: string,
  voice?: string
): Promise<string> {
  const cacheKey = getTranslationAudioKey(surah, ayah, track);

  // 1. If already saved offline, resolve it immediately
  const isSaved = await isAudioSavedOffline(cacheKey);
  if (isSaved) {
    return await resolveAudioSrc(cacheKey);
  }

  // 2. Fetch from edge TTS API
  const encodedText = encodeURIComponent(text);
  const voiceParam = voice ? `&voice=${encodeURIComponent(voice)}` : "";
  const apiUrl = `/api/public/tts?text=${encodedText}${voiceParam}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`TTS server responded with status ${res.status}`);
  }

  const blob = await res.blob();
  // Save to offline storage with the persistent cache key
  await saveAudioOffline(cacheKey, blob);

  return URL.createObjectURL(blob);
}

/** Canonical offline path and link for a full surah MP3 (in the 'quran/audio' storage folder) */
export function getFullSurahAudioPath(surahId: number): string {
  const sStr = String(surahId).padStart(3, "0");
  return `/data/quran/audio/${sStr}.mp3`;
}

/** Remote high-quality recitation URL for full surah MP3 (fast CDN) */
export function getFullSurahRemoteUrl(surahId: number): string {
  const sStr = String(surahId).padStart(3, "0");
  return `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${sStr}.mp3`;
}

/** Check if full surah MP3 is saved offline in the quran audio storage */
export async function isFullSurahAudioSaved(surahId: number): Promise<boolean> {
  // 0. Check native Android QuranNative bridge first
  if (typeof window !== "undefined" && (window as any).QuranNative?.isSurahAudioSaved) {
    try {
      if ((window as any).QuranNative.isSurahAudioSaved(surahId)) {
        return true;
      }
    } catch {}
  }

  // 1. Direct surah id key in idb-keyval
  try {
    const direct = await get<any>(`quran_full_surah_audio_${surahId}`);
    if (direct && (direct.buffer || direct.byteLength || direct instanceof Blob)) {
      return true;
    }
  } catch {}

  // 2. Canonical virtual path and remote url
  const path = getFullSurahAudioPath(surahId);
  const remote = getFullSurahRemoteUrl(surahId);
  const savedPath = await isAudioSavedOffline(path);
  if (savedPath) return true;
  return await isAudioSavedOffline(remote);
}

/** Save a full surah MP3 blob to offline storage under /data/quran/audio/${sStr}.mp3, remote URL and direct surah key */
export async function saveFullSurahAudioOffline(surahId: number, blob: Blob): Promise<void> {
  const path = getFullSurahAudioPath(surahId);
  const remote = getFullSurahRemoteUrl(surahId);

  try {
    const buffer = await blob.arrayBuffer();
    const type = blob.type || "audio/mpeg";
    // Direct store for fastest access
    await set(`quran_full_surah_audio_${surahId}`, { buffer, type, timestamp: Date.now(), size: blob.size });
    // Also save via saveAudioOffline under both paths
    await saveAudioOffline(path, blob);
    await saveAudioOffline(remote, blob);
  } catch (e) {
    console.warn("Error saving full surah audio:", e);
  }
}

/** Resolve full surah audio playable src (blob URL or remote) */
export async function resolveFullSurahAudioSrc(surahId: number): Promise<string> {
  const sStr = String(surahId).padStart(3, "0");

  // 0. If native Android app has the file saved, use the local path (intercepted natively)
  if (typeof window !== "undefined" && (window as any).QuranNative?.isSurahAudioSaved) {
    try {
      if ((window as any).QuranNative.isSurahAudioSaved(surahId)) {
        return `/data/quran/audio/${sStr}.mp3`;
      }
    } catch {}
  }

  // 1. Check direct surah ID in idb-keyval
  try {
    const direct = await get<any>(`quran_full_surah_audio_${surahId}`);
    if (direct) {
      if (direct instanceof Blob) {
        return URL.createObjectURL(direct);
      }
      if (direct.buffer) {
        const blob = new Blob([direct.buffer], { type: direct.type || "audio/mpeg" });
        return URL.createObjectURL(blob);
      }
    }
  } catch (e) {
    console.warn("Direct surah audio lookup error:", e);
  }

  const path = getFullSurahAudioPath(surahId);
  const remote = getFullSurahRemoteUrl(surahId);

  if (await isAudioSavedOffline(path)) {
    return await resolveAudioSrc(path);
  }
  if (await isAudioSavedOffline(remote)) {
    return await resolveAudioSrc(remote);
  }

  // 3. Remote URL fallback (In Android APK, MainActivity will intercept this and serve from local quran/ folder)
  return remote;
}

/** Delete full surah MP3 from offline storage */
export async function deleteFullSurahAudioOffline(surahId: number): Promise<void> {
  try {
    await del(`quran_full_surah_audio_${surahId}`);
  } catch {}
  const path = getFullSurahAudioPath(surahId);
  const remote = getFullSurahRemoteUrl(surahId);
  await deleteAudioOffline(path);
  await deleteAudioOffline(remote);
}

/**
 * Completely wipe all offline caches (Cache Storage, IndexedDB stores, and idb-keyval)
 */
export async function clearAllOfflineStorage(): Promise<{ cachesCleared: number; idbCleared: boolean }> {
  let cachesCleared = 0;
  let idbCleared = false;

  // 1. Clear all window Cache Storage caches
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
        cachesCleared++;
      }
    } catch (e) {
      console.warn("Failed to clear caches:", e);
    }
  }

  // 2. Clear idb-keyval store
  try {
    await clear();
  } catch (e) {
    console.warn("Failed to clear idb-keyval:", e);
  }

  // 3. Clear application IndexedDB object stores
  try {
    const db = await openOfflineDB();
    const storeNames = Array.from(db.objectStoreNames);
    if (storeNames.length > 0) {
      const tx = db.transaction(storeNames, "readwrite");
      for (const name of storeNames) {
        tx.objectStore(name).clear();
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    }
    idbCleared = true;
  } catch (e) {
    console.warn("Failed to clear offline IndexedDB:", e);
  }

  // 4. Delete obsolete legacy IndexedDB databases
  if (typeof window !== "undefined" && "indexedDB" in window) {
    try {
      indexedDB.deleteDatabase("quran_offline_storage_v2");
      indexedDB.deleteDatabase("quran_offline_storage_v1");
    } catch {}
  }

  // 5. Clean all stale Quran overrides & cache keys from localStorage
  if (typeof window !== "undefined") {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("quran_ayah_meta_") || k.startsWith("quran_meta_cache_") || k.startsWith("quran_surah_"))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  return { cachesCleared, idbCleared };
}

/**
 * Automatically purges stale pre-wipe client caches (one-time migration check).
 */
export function runOneTimeStoragePurge() {
  if (typeof window === "undefined") return;
  const PURGE_KEY = "quran_scientific_purged_20261021_v21";
  try {
    if (!localStorage.getItem(PURGE_KEY)) {
      // 1. Remove all old quran_ayah_meta_, quran_surah_, and React Query offline cache keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith("quran_ayah_meta_") ||
            k.startsWith("quran_meta_cache_") ||
            k.startsWith("quran_surah_") ||
            k.includes("REACT_QUERY_OFFLINE_CACHE"))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // 2. Delete legacy IndexedDB databases
      if ("indexedDB" in window) {
        try { indexedDB.deleteDatabase("quran_offline_storage_v6"); } catch {}
        try { indexedDB.deleteDatabase("quran_offline_storage_v5"); } catch {}
        try { indexedDB.deleteDatabase("quran_offline_storage_v4"); } catch {}
        try { indexedDB.deleteDatabase("quran_offline_storage_v3"); } catch {}
        try { indexedDB.deleteDatabase("quran_offline_storage_v2"); } catch {}
        try { indexedDB.deleteDatabase("quran_offline_storage_v1"); } catch {}
      }

      // 3. Delete old Cache Storage buckets
      if ("caches" in window) {
        try { caches.delete("quran-text-v9"); } catch {}
        try { caches.delete("quran-text-v8"); } catch {}
        try { caches.delete("quran-text-v7"); } catch {}
        try { caches.delete("quran-text-v6"); } catch {}
        try { caches.delete("quran-text-v5"); } catch {}
      }

      // 4. Clear idb-keyval react query persister if present
      try { del("REACT_QUERY_OFFLINE_CACHE"); } catch {}

      localStorage.setItem(PURGE_KEY, "true");
    }
  } catch (err) {
    console.warn("One-time storage purge notice:", err);
  }
}



