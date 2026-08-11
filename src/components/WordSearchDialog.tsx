import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { localNumber } from "@/lib/quran";
import { usePrefs } from "@/lib/prefs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Strip Arabic diacritics so a clicked word matches unvowelled spellings too. */
function bareRoot(word: string) {
  return word.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED\u0640]/g, "");
}

export function WordSearchDialog({
  word,
  onClose,
}: {
  word: string | null;
  onClose: () => void;
}) {
  const { t, lang } = usePrefs();
  const root = word ? bareRoot(word) : "";

  const results = useQuery({
    queryKey: ["word-search", root],
    enabled: !!root,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quran_verses")
        .select("surah, ayah, text_uthmani, bn_text, en_text")
        .ilike("text_uthmani", `%${root}%`)
        .order("surah")
        .order("ayah")
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={!!word} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="arabic text-2xl text-primary">{word}</span>
            <span className="text-sm font-normal text-muted-foreground">{t("wordSearch")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("wordSearchHint")} · {t("searchInDb")}
          </DialogDescription>
        </DialogHeader>

        {results.isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
        {results.isError && <p className="text-sm text-destructive">{t("error")}</p>}
        {results.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noWordResults")}</p>
        )}

        <ul className="divide-y divide-border">
          {results.data?.map((v) => (
            <li key={`${v.surah}:${v.ayah}`} className="py-3">
              <Link
                to="/surah/$id"
                params={{ id: String(v.surah) }}
                hash={`ayah-${v.ayah}`}
                onClick={onClose}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {localNumber(v.surah, lang)}:{localNumber(v.ayah, lang)}
              </Link>
              <p className="arabic mt-1 text-right text-xl leading-loose">{v.text_uthmani}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "bn" ? v.bn_text : v.en_text}
              </p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
