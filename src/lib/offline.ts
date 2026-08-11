import { useEffect, useState } from "react";

/** Cache Storage bucket that holds downloaded ayah recitations. */
export const AUDIO_CACHE = "quran-audio-v1";

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
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

/** Resolve a playable URL for an ayah, preferring the offline copy. */
export async function resolveAudioSrc(url: string): Promise<string> {
  if (!cachesAvailable()) return url;
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const hit = await cache.match(url);
    if (!hit) return url;
    const blob = await hit.blob();
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}

export async function isSurahAudioDownloaded(urls: string[]) {
  if (!cachesAvailable() || urls.length === 0) return false;
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const first = await cache.match(urls[0]!);
    const last = await cache.match(urls[urls.length - 1]!);
    return !!first && !!last;
  } catch {
    return false;
  }
}

/** Download every ayah recitation of a surah into Cache Storage. */
export async function downloadSurahAudio(
  urls: string[],
  onProgress?: (done: number, total: number) => void,
) {
  if (!cachesAvailable()) throw new Error("Offline storage unavailable");
  const cache = await caches.open(AUDIO_CACHE);
  let done = 0;
  for (const url of urls) {
    const existing = await cache.match(url);
    if (!existing) {
      const res = await fetch(url, { mode: "cors" });
      if (res.ok) await cache.put(url, res.clone());
    }
    done += 1;
    onProgress?.(done, urls.length);
  }
}

export async function removeSurahAudio(urls: string[]) {
  if (!cachesAvailable()) return;
  const cache = await caches.open(AUDIO_CACHE);
  await Promise.all(urls.map((u) => cache.delete(u)));
}
