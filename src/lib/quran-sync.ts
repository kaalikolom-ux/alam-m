import { supabase } from "@/integrations/supabase/client";
import { ALL_SURAHS_DATABASE } from "@/lib/quranSearchEngine";

/** Mirror the 114 chapter records into our Supabase database. */
export async function syncChapters() {
  const rows = ALL_SURAHS_DATABASE.map((s) => ({
    id: s.id,
    name_simple: s.name_en,
    name_arabic: s.name_arabic,
    translated_name: s.meaning_bn,
    verses_count: s.total_verses,
    revelation_place: s.type === "Meccan" ? "makkah" : "madinah",
    lang: "bn",
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("quran_chapters").upsert(rows, { onConflict: "id" });
  if (error) {
    console.warn("syncChapters error:", error);
    throw error;
  }
  return rows.length;
}

/** Mirror one surah: Arabic text, words, transliteration, 4 translation layers, metadata & lexicon notes into Supabase. */
export async function syncSurah(surah: number) {
  const res = await fetch(`/data/quran/surahs/${surah}.json`);
  if (!res.ok) throw new Error(`Could not load local data for Surah ${surah}`);
  const data = await res.json();
  const ayahs = data.ayahs || [];

  const rows = ayahs.map((a: any) => {
    const sPad = String(surah).padStart(3, "0");
    const aPad = String(a.ayah).padStart(3, "0");
    const audioUrl = a.audio_url || `https://everyayah.com/data/Alafasy_128kbps/${sPad}${aPad}.mp3`;
    const convBn = a.conventional_bn || a.translation_bn || "";
    const convEn = a.conventional_en || a.translation_en || "";
    const modBn = a.modern_translation_bn || null;
    const modEn = a.modern_translation_en || null;
    const sciBn = a.scientific_translation_bn || null;
    const sciEn = a.scientific_translation_en || null;
    const mBn = a.meta_bn || null;
    const mEn = a.meta_en || null;
    const lexNotes =
      typeof a.lexicon_modern_notes === "string"
        ? a.lexicon_modern_notes
        : a.lexicon_modern_notes
        ? JSON.stringify(a.lexicon_modern_notes)
        : null;

    return {
      surah,
      ayah: a.ayah,
      text_uthmani: a.text_uthmani || "",
      words: a.words || [],
      transliteration: a.transliteration || null,
      bn_text: convBn,
      en_text: convEn,
      conventional_bn: convBn,
      conventional_en: convEn,
      modern_translation_bn: modBn,
      modern_translation_en: modEn,
      scientific_translation_bn: sciBn,
      scientific_translation_en: sciEn,
      meta_bn: mBn,
      meta_en: mEn,
      lexicon_modern_notes: lexNotes,
      audio_url: audioUrl,
      updated_at: new Date().toISOString(),
    };
  });

  // Upsert in batches of 40 to avoid payload limits
  const batchSize = 40;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("quran_verses")
      .upsert(batch, { onConflict: "surah,ayah" });
    if (error) {
      console.warn(`Supabase upsert warning on Surah ${surah}:`, error);
      throw error;
    }
  }

  // Also record sync state
  try {
    await supabase.from("quran_sync_state").upsert(
      { surah, verses_synced: rows.length, synced_at: new Date().toISOString() },
      { onConflict: "surah" }
    );
  } catch {}

  return rows.length;
}
