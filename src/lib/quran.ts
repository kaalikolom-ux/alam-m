import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

const API = "https://api.quran.com/api/v4";

export type Chapter = {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  translated_name: { name: string };
};

export type QWord = {
  id: number;
  position: number;
  char_type_name: string;
  text_uthmani?: string;
  translation: { text: string };
  transliteration: { text: string | null };
};

export type Verse = {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  words: QWord[];
  translations: { resource_id: number; text: string }[];
};

export const BN_TRANSLATION_ID = 161; // Taisirul Quran
export const EN_TRANSLATION_ID = 19; // M. Pickthall

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quran API error ${res.status}`);
  return (await res.json()) as T;
}

/** Read the local (Supabase) mirror first so the app works offline. */
async function mirrorChapters(): Promise<Chapter[] | null> {
  try {
    const { data, error } = await supabase
      .from("quran_chapters")
      .select("id, name_simple, name_arabic, translated_name, verses_count, revelation_place")
      .order("id");
    if (error || !data || data.length < 114) return null;
    return data.map((c) => ({
      id: c.id,
      name_simple: c.name_simple,
      name_arabic: c.name_arabic,
      verses_count: c.verses_count,
      revelation_place: c.revelation_place ?? "",
      translated_name: { name: c.translated_name },
    }));
  } catch {
    return null;
  }
}

async function mirrorVerses(surah: number): Promise<Verse[] | null> {
  try {
    const { data, error } = await supabase
      .from("quran_verses")
      .select("surah, ayah, text_uthmani, words, bn_text, en_text")
      .eq("surah", surah)
      .order("ayah");
    if (error || !data || data.length === 0) return null;
    return data.map((v) => ({
      id: v.surah * 1000 + v.ayah,
      verse_number: v.ayah,
      verse_key: `${v.surah}:${v.ayah}`,
      text_uthmani: v.text_uthmani,
      words: (v.words as unknown as QWord[]) ?? [],
      translations: [
        { resource_id: BN_TRANSLATION_ID, text: v.bn_text ?? "" },
        { resource_id: EN_TRANSLATION_ID, text: v.en_text ?? "" },
      ],
    }));
  } catch {
    return null;
  }
}

export const chaptersQuery = (lang: "bn" | "en") =>
  queryOptions({
    queryKey: ["quran", "chapters", lang],
    staleTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      const mirrored = await mirrorChapters();
      if (mirrored) return mirrored;
      const data = await getJson<{ chapters: Chapter[] }>(
        `${API}/chapters?language=${lang}`,
      );
      return data.chapters;
    },
  });

export const versesQuery = (surah: number, lang: "bn" | "en") =>
  queryOptions({
    queryKey: ["quran", "verses", surah, lang],
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async () => {
      const mirrored = await mirrorVerses(surah);
      if (mirrored) return mirrored;
      const params = new URLSearchParams({
        words: "true",
        language: lang,
        word_fields: "text_uthmani,transliteration",
        fields: "text_uthmani",
        translations: `${BN_TRANSLATION_ID},${EN_TRANSLATION_ID}`,
        per_page: "300",
      });
      const data = await getJson<{ verses: Verse[] }>(
        `${API}/verses/by_chapter/${surah}?${params.toString()}`,
      );
      return data.verses;
    },
  });

export function stripHtml(input: string) {
  return input.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "");
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function localNumber(value: number | string, lang: "bn" | "en") {
  if (lang === "en") return String(value);
  return String(value)
    .split("")
    .map((c) => (/\d/.test(c) ? BN_DIGITS[Number(c)] : c))
    .join("");
}

// Mishary Rashid Al-Afasy (quran.com recitation id 7)
export const AFASY_RECITATION_ID = 7;
const AUDIO_BASE = "https://verses.quran.com/";

export const audioQuery = (surah: number) =>
  queryOptions({
    queryKey: ["quran", "audio", AFASY_RECITATION_ID, surah],
    staleTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      try {
        const { data: rows } = await supabase
          .from("quran_verses")
          .select("ayah, audio_url")
          .eq("surah", surah)
          .not("audio_url", "is", null)
          .order("ayah");
        if (rows && rows.length > 0) {
          const mirroredMap: Record<number, string> = {};
          for (const r of rows) if (r.audio_url) mirroredMap[r.ayah] = r.audio_url;
          return mirroredMap;
        }
      } catch {
        // fall through to the network API
      }
      const data = await getJson<{
        audio_files: { verse_key: string; url: string }[];
      }>(
        `${API}/recitations/${AFASY_RECITATION_ID}/by_chapter/${surah}?per_page=300`,
      );
      const map: Record<number, string> = {};
      for (const f of data.audio_files) {
        const ayah = Number(f.verse_key.split(":")[1]);
        if (ayah) map[ayah] = `${AUDIO_BASE}${f.url}`;
      }
      return map;
    },
  });
