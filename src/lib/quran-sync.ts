import { supabase } from "@/integrations/supabase/client";
import {
  AFASY_RECITATION_ID,
  BN_TRANSLATION_ID,
  EN_TRANSLATION_ID,
  stripHtml,
  type Chapter,
  type QWord,
  type Verse,
} from "@/lib/quran";

const API = "https://api.quran.com/api/v4";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quran API error ${res.status}`);
  return (await res.json()) as T;
}

/** Mirror the 114 chapter records into our own database. */
export async function syncChapters() {
  const bn = await getJson<{ chapters: Chapter[] }>(`${API}/chapters?language=bn`);
  const rows = bn.chapters.map((c) => ({
    id: c.id,
    name_simple: c.name_simple,
    name_arabic: c.name_arabic,
    translated_name: c.translated_name.name,
    verses_count: c.verses_count,
    revelation_place: c.revelation_place,
    lang: "bn",
  }));
  const { error } = await supabase.from("quran_chapters").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  return rows.length;
}

/** Mirror one surah: Arabic text, word-by-word, both translations and audio links. */
export async function syncSurah(surah: number) {
  const params = new URLSearchParams({
    words: "true",
    language: "bn",
    word_fields: "text_uthmani,transliteration",
    fields: "text_uthmani",
    translations: `${BN_TRANSLATION_ID},${EN_TRANSLATION_ID}`,
    per_page: "300",
  });
  const [{ verses }, audio] = await Promise.all([
    getJson<{ verses: Verse[] }>(`${API}/verses/by_chapter/${surah}?${params.toString()}`),
    getJson<{ audio_files: { verse_key: string; url: string }[] }>(
      `${API}/recitations/${AFASY_RECITATION_ID}/by_chapter/${surah}?per_page=300`,
    ),
  ]);

  const audioMap: Record<number, string> = {};
  for (const f of audio.audio_files) {
    const ayah = Number(f.verse_key.split(":")[1]);
    if (ayah) audioMap[ayah] = `https://verses.quran.com/${f.url}`;
  }

  const rows = verses.map((v) => {
    const bn = v.translations.find((x) => x.resource_id === BN_TRANSLATION_ID);
    const en = v.translations.find((x) => x.resource_id === EN_TRANSLATION_ID);
    return {
      surah,
      ayah: v.verse_number,
      text_uthmani: v.text_uthmani,
      words: v.words as unknown as QWord[],
      bn_text: bn ? stripHtml(bn.text) : null,
      en_text: en ? stripHtml(en.text) : null,
      audio_url: audioMap[v.verse_number] ?? null,
    };
  });

  const { error } = await supabase
    .from("quran_verses")
    .upsert(rows, { onConflict: "surah,ayah" });
  if (error) throw error;

  const { error: stateError } = await supabase.from("quran_sync_state").upsert(
    { surah, verses_synced: rows.length, synced_at: new Date().toISOString() },
    { onConflict: "surah" },
  );
  if (stateError) throw stateError;

  return rows.length;
}
