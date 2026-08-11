import { useEffect, useState } from "react";
import { Check, Download, Loader2, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { usePrefs } from "@/lib/prefs";
import {
  downloadSurahAudio,
  isSurahAudioDownloaded,
  removeSurahAudio,
  useOnline,
} from "@/lib/offline";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/** Lets a reader keep one surah (text is cached automatically, audio on demand). */
export function OfflineDownload({ audioUrls }: { audioUrls: string[] }) {
  const { t } = usePrefs();
  const online = useOnline();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    void isSurahAudioDownloaded(audioUrls).then((v) => {
      if (active) setSaved(v);
    });
    return () => {
      active = false;
    };
  }, [audioUrls]);

  async function save() {
    setBusy(true);
    setProgress(0);
    try {
      await downloadSurahAudio(audioUrls, (done, total) =>
        setProgress(Math.round((done / total) * 100)),
      );
      setSaved(true);
      toast.success(t("downloaded"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await removeSurahAudio(audioUrls);
    setSaved(false);
  }

  return (
    <div className="card-soft space-y-3 p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("downloadOffline")}
      </p>
      {!online && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <WifiOff className="size-3.5 shrink-0" /> {t("offlineBanner")}
        </p>
      )}
      {busy && <Progress value={progress} />}
      {saved ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-primary">
            <Check className="size-4" /> {t("downloaded")}
          </span>
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 className="size-4" /> {t("removeOffline")}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={busy || audioUrls.length === 0}
          onClick={save}
          className="w-full"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {busy ? t("downloading") : t("downloadOffline")}
        </Button>
      )}
    </div>
  );
}
