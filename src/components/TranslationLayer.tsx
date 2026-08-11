import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Tone = "plain" | "primary" | "gold";

const TONE_WRAP: Record<Tone, string> = {
  plain: "",
  primary: "rounded-lg border border-primary/25 bg-primary/5 p-4",
  gold: "rounded-lg border border-gold/40 bg-gold/10 p-4 dark:border-gold/50 dark:bg-gold/15",
};

const TONE_TITLE: Record<Tone, string> = {
  plain: "text-muted-foreground",
  primary: "text-primary",
  gold: "text-gold-foreground dark:text-gold",
};

export function TranslationLayer({
  surah,
  ayah,
  storageLang,
  title,
  text,
  note,
  edited,
  tone = "plain",
  placeholder,
  textClassName,
  hideNoteField,
}: {
  surah: number;
  ayah: number;
  /** row `lang` value in verse_translations: bn_std | en_std | bn | en */
  storageLang: string;
  title: string;
  text: string;
  note?: string | null;
  edited?: boolean;
  tone?: Tone;
  placeholder?: string;
  textClassName?: string;
  hideNoteField?: boolean;
}) {

  const { t } = usePrefs();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(text);
  const [draftNote, setDraftNote] = useState(note ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("verse_translations").upsert(
        {
          surah,
          ayah,
          lang: storageLang,
          text: draft.trim(),
          note: draftNote.trim() || null,
        },
        { onConflict: "surah,ayah,lang" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["verse-translations", surah] });
      setOpen(false);
      toast.success(t("saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit() {
    setDraft(text);
    setDraftNote(note ?? "");
    setOpen(true);
  }

  return (
    <div className={TONE_WRAP[tone]}>
      <div className="flex items-start justify-between gap-2">
        <p
          className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide ${TONE_TITLE[tone]}`}
        >
          {title}
          {edited && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] normal-case text-primary">
              {t("editedBadge")}
            </span>
          )}
        </p>
        {isAdmin && !open && (
          <button
            onClick={startEdit}
            aria-label={t("edit")}
            title={t("edit")}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      {open ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder={title}
            className={textClassName}
          />
          {!hideNoteField && (
            <Input
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder={t("note")}
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
              {t("save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className={`mt-1 leading-relaxed ${textClassName ?? ""}`}>
            {text || <span className="text-muted-foreground">{placeholder ?? t("notAdded")}</span>}
          </p>
          {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
        </>
      )}
    </div>
  );
}

