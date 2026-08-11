import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { BookA, ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from "lucide-react";

import {
  BN_TRANSLATION_ID,
  EN_TRANSLATION_ID,
  audioQuery,
  chaptersQuery,
  localNumber,
  stripHtml,
  versesQuery,
} from "@/lib/quran";
import { usePrefs } from "@/lib/prefs";
import { supabase } from "@/integrations/supabase/client";
import { resolveAudioSrc } from "@/lib/offline";
import { DisplayToggles } from "@/components/DisplayToggles";
import { OfflineDownload } from "@/components/OfflineDownload";
import { BookmarkButton } from "@/components/BookmarkButton";
import { TranslationLayer } from "@/components/TranslationLayer";
import { WordSearchDialog } from "@/components/WordSearchDialog";

import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/surah/$id")({
  head: ({ params }) => {
    const title = `সুরা ${params.id} — কুরআন অন্বেষা`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `সুরা ${params.id}-এর আরবি, শব্দে শব্দে অর্থ, বাংলা ও ইংরেজি অনুবাদ এবং বিজ্ঞানভিত্তিক অনুবাদ।`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "শব্দে শব্দে অর্থ ও একাধিক অনুবাদসহ কুরআন পড়ুন।",
        },
      ],
    };
  },
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(versesQuery(Number(params.id), "bn"));
    context.queryClient.ensureQueryData(chaptersQuery("bn"));
  },
  component: SurahPage,
});

function SurahPage() {
  const { id } = Route.useParams();
  const surah = Number(id);
  const { t, lang, layers } = usePrefs();

  const chapters = useQuery(chaptersQuery(lang));
  const verses = useQuery(versesQuery(surah, lang));
  const chapter = chapters.data?.find((c) => c.id === surah);

  const custom = useQuery({
    queryKey: ["verse-translations", surah],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verse_translations")
        .select("surah, ayah, lang, text, note")
        .eq("surah", surah);
      if (error) throw error;
      return data;
    },
  });

  const customFor = (ayah: number, l: string) =>
    custom.data?.find((c) => c.ayah === ayah && c.lang === l);

  const audio = useQuery(audioQuery(surah));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [lexOpen, setLexOpen] = useState<number | null>(null);
  const [searchWord, setSearchWord] = useState<string | null>(null);


  async function playAyah(ayah: number) {
    const el = audioRef.current;
    const src = audio.data?.[ayah];
    if (!el || !src) return;
    if (playing === ayah && !el.paused) {
      el.pause();
      setPlaying(null);
      return;
    }
    // Prefer the offline copy when this surah has been saved to the device.
    el.src = await resolveAudioSrc(src);
    void el.play();
    setPlaying(ayah);
  }

  function playNext() {
    if (playing == null) return;
    const next = playing + 1;
    if (audio.data?.[next]) void playAyah(next);
    else setPlaying(null);
  }


  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="card-soft mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("surahs")} {localNumber(surah, lang)}
              </p>
              <h1 className="mt-1 text-2xl font-semibold">
                {chapter?.name_simple ?? "..."}{" "}
                {chapter && (
                  <span className="text-muted-foreground">— {chapter.translated_name.name}</span>
                )}
              </h1>
              {chapter && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {localNumber(chapter.verses_count, lang)} {t("verses")} · {t("makaMadina")}:{" "}
                  {chapter.revelation_place}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="arabic text-2xl text-primary">{chapter?.name_arabic}</span>
              <Button
                variant="outline"
                size="sm"
                aria-label={playing != null ? t("pause") : t("play")}
                title={t("reciter")}
                onClick={() => void playAyah(playing ?? 1)}
              >
                {playing != null ? <Pause className="size-4" /> : <Play className="size-4" />}
                <span className="hidden sm:inline">{t("audio")}</span>
              </Button>
              {chapter && (
                <BookmarkButton
                  variant="outline"
                  target={{ kind: "surah", surah, label: chapter.name_simple }}
                />
              )}
            </div>
          </div>

          <audio
            ref={audioRef}
            onEnded={playNext}
            onPause={() => setPlaying((p) => (audioRef.current?.ended ? p : null))}
            preload="none"
            className="hidden"
          />
          <p className="mb-4 text-xs text-muted-foreground">{t("reciter")}</p>


          {verses.isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
          {verses.isError && <p className="text-sm text-destructive">{t("error")}</p>}

          <div className="space-y-4">
            {verses.data?.map((v) => {
              const bn = v.translations.find((x) => x.resource_id === BN_TRANSLATION_ID);
              const en = v.translations.find((x) => x.resource_id === EN_TRANSLATION_ID);
              const sciBn = customFor(v.verse_number, "bn");
              const sciEn = customFor(v.verse_number, "en");
              const bnEdited = customFor(v.verse_number, "bn_std");
              const enEdited = customFor(v.verse_number, "en_std");
              const metaBn = customFor(v.verse_number, "meta_bn");
              const metaEn = customFor(v.verse_number, "meta_en");
              const arabicEdited = customFor(v.verse_number, "arabic");
              const lexNote = customFor(v.verse_number, "lexicon");
              const words = v.words.filter((w) => w.char_type_name === "word");
              const fullTransliteration = words
                .map((w) => w.transliteration?.text)
                .filter(Boolean)
                .join(" ");
              const isPlaying = playing === v.verse_number;
              const lexiconOpen = lexOpen === v.verse_number;
              return (
                <article key={v.id} id={`ayah-${v.verse_number}`} className="card-soft p-6">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                        {localNumber(surah, "bn")}ঃ{localNumber(v.verse_number, "bn")}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {surah}:{v.verse_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={isPlaying ? t("pause") : t("play")}
                        title={t("reciter")}
                        onClick={() => void playAyah(v.verse_number)}
                      >
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </Button>
                      <BookmarkButton
                        target={{
                          kind: "ayah",
                          surah,
                          ayah: v.verse_number,
                          label: `${chapter?.name_simple ?? surah} ${surah}:${v.verse_number}`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-5 grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
                    <TranslationLayer
                      surah={surah}
                      ayah={v.verse_number}
                      storageLang="meta_bn"
                      title={`${localNumber(surah, "bn")}ঃ${localNumber(v.verse_number, "bn")} — ${t("metadataBn")}`}
                      text={metaBn?.text ?? ""}
                      note={metaBn?.note ?? null}
                      placeholder={t("metadataPlaceholder")}
                    />
                    <TranslationLayer
                      surah={surah}
                      ayah={v.verse_number}
                      storageLang="meta_en"
                      title={`${surah}:${v.verse_number} — ${t("metadataEn")}`}
                      text={metaEn?.text ?? ""}
                      note={metaEn?.note ?? null}
                      placeholder={t("metadataPlaceholder")}
                    />
                  </div>

                  {layers.arabic && (
                    <>
                      <TranslationLayer
                        surah={surah}
                        ayah={v.verse_number}
                        storageLang="arabic"
                        title={t("arabicText")}
                        text={arabicEdited ? arabicEdited.text : v.text_uthmani}
                        edited={!!arabicEdited}
                        hideNoteField
                        textClassName="arabic text-right text-3xl leading-[2.4] text-foreground"
                      />
                      {fullTransliteration && (
                        <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
                          {fullTransliteration}
                        </p>
                      )}
                    </>
                  )}

                  {layers.words && (
                    <div className="mt-5 flex flex-wrap-reverse justify-end gap-x-4 gap-y-4">
                      {words.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSearchWord(w.text_uthmani ?? null)}
                          className="min-w-16 rounded-md px-1.5 py-1 text-center transition-colors hover:bg-accent"
                          title={t("wordSearch")}
                        >
                          <div className="arabic text-2xl leading-normal text-foreground">
                            {w.text_uthmani}
                          </div>
                          {w.transliteration?.text && (
                            <div className="text-[11px] italic text-muted-foreground">
                              {w.transliteration.text}
                            </div>
                          )}
                          <div className="text-xs text-primary">{w.translation?.text}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {layers.translation && (
                  <div className="mt-5 space-y-4 border-t border-border pt-5">
                    {layers.bn && (
                      <TranslationLayer
                        surah={surah}
                        ayah={v.verse_number}
                        storageLang="bn_std"
                        title={bnEdited ? t("stdBn") : t("banglaTranslation")}
                        text={bnEdited ? bnEdited.text : bn ? stripHtml(bn.text) : ""}
                        note={bnEdited?.note ?? null}
                        edited={!!bnEdited}
                      />
                    )}
                    {layers.en && (
                      <TranslationLayer
                        surah={surah}
                        ayah={v.verse_number}
                        storageLang="en_std"
                        title={enEdited ? t("stdEn") : t("englishTranslation")}
                        text={enEdited ? enEdited.text : en ? stripHtml(en.text) : ""}
                        note={enEdited?.note ?? null}
                        edited={!!enEdited}
                      />
                    )}
                    {layers.sciBn && (
                      <TranslationLayer
                        surah={surah}
                        ayah={v.verse_number}
                        storageLang="bn"
                        tone="primary"
                        title={t("sciBn")}
                        text={sciBn?.text ?? ""}
                        note={sciBn?.note ?? null}
                      />
                    )}
                    {layers.sciEn && (
                      <TranslationLayer
                        surah={surah}
                        ayah={v.verse_number}
                        storageLang="en"
                        tone="gold"
                        title={t("sciEn")}
                        text={sciEn?.text ?? ""}
                        note={sciEn?.note ?? null}
                      />
                    )}
                  </div>
                  )}

                  {layers.lexicon && (
                  <div className="mt-5 border-t border-border pt-4">
                    <button
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      aria-expanded={lexiconOpen}
                      onClick={() => setLexOpen(lexiconOpen ? null : v.verse_number)}
                    >
                      <BookA className="size-4" />
                      {t("lexicon")}
                    </button>
                    {lexiconOpen && (
                      <div className="mt-3 rounded-lg border border-border bg-muted/40 p-4">
                        <p className="text-xs text-muted-foreground">{t("lexiconHint")}</p>
                        <ul className="mt-3 divide-y divide-border/70">
                          {words.map((w) => (
                            <li
                              key={w.id}
                              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2"
                            >
                              <button
                                type="button"
                                onClick={() => setSearchWord(w.text_uthmani ?? null)}
                                className="arabic text-xl text-foreground hover:text-primary"
                                title={t("wordSearch")}
                              >
                                {w.text_uthmani}
                              </button>
                              {w.transliteration?.text && (
                                <span className="text-xs italic text-muted-foreground">
                                  {w.transliteration.text}
                                </span>
                              )}
                              <span className="text-sm text-primary">{w.translation?.text}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 border-t border-border/70 pt-3">
                          <TranslationLayer
                            surah={surah}
                            ayah={v.verse_number}
                            storageLang="lexicon"
                            title={t("lexiconNote")}
                            text={lexNote?.text ?? ""}
                            note={lexNote?.note ?? null}
                          />
                        </div>
                        <a
                          href={`https://corpus.quran.com/wordbyword.jsp?chapter=${surah}&verse=${v.verse_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                        >
                          {t("rootLookup")} <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  )}

                </article>
              );
            })}

          </div>

          <div className="mt-8 flex items-center justify-between">
            {surah > 1 ? (
              <Button asChild variant="outline">
                <Link to="/surah/$id" params={{ id: String(surah - 1) }}>
                  <ChevronLeft className="size-4" /> {localNumber(surah - 1, lang)}
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {surah < 114 && (
              <Button asChild variant="outline">
                <Link to="/surah/$id" params={{ id: String(surah + 1) }}>
                  {localNumber(surah + 1, lang)} <ChevronRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <DisplayToggles />
          <OfflineDownload audioUrls={Object.values(audio.data ?? {})} />
          <div className="card-soft p-5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("surahs")}
            </p>
            <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
              {chapters.data?.map((c) => (
                <Link
                  key={c.id}
                  to="/surah/$id"
                  params={{ id: String(c.id) }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                >
                  <span className="w-7 text-xs text-muted-foreground">
                    {localNumber(c.id, lang)}
                  </span>
                  <span className="truncate">{c.name_simple}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <WordSearchDialog word={searchWord} onClose={() => setSearchWord(null)} />
    </div>

  );
}
