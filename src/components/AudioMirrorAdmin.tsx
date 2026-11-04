import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Music4, Square } from "lucide-react";
import { toast } from "sonner";

import { audioMirrorStats, mirrorAudioBatch } from "@/lib/quran-audio.functions";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function AudioMirrorAdmin() {
  const { t } = usePrefs();
  const getStats = useServerFn(audioMirrorStats);
  const runBatch = useServerFn(mirrorAudioBatch);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("");
  const stop = useRef(false);

  const stats = useQuery({
    queryKey: ["audio-mirror-stats"],
    queryFn: () => getStats({}),
  });

  async function start() {
    setRunning(true);
    stop.current = false;
    try {
      for (let surah = 1; surah <= 114; surah += 1) {
        let offset = 0;
        for (;;) {
          if (stop.current) return;
          setLabel(`${surah} · ${offset}`);
          const res = await runBatch({ data: { surah, offset, limit: 15 } });
          if (res.copied > 0) void stats.refetch();
          if (res.done || res.next === null) break;
          offset = res.next;
        }
      }
      toast.success(t("audioMirrorDone"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
      setLabel("");
      void stats.refetch();
    }
  }

  const total = stats.data?.total ?? 6236;
  const mirrored = stats.data?.mirrored ?? 0;

  return (
    <div className="card-soft space-y-4 p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold">{t("audioMirror")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("audioMirrorHint")}</p>
        </div>
        <Music4 className="size-6 shrink-0 text-primary" />
      </div>

      <p className="text-sm">
        {t("audioMirrorProgress")}: <span className="font-semibold">{mirrored}</span> / {total}
      </p>
      <Progress value={total ? (mirrored / total) * 100 : 0} />
      {running && <p className="text-xs text-muted-foreground">{label}</p>}

      <div className="flex flex-wrap gap-2">
        <Button disabled={running} onClick={start}>
          <Music4 className="size-4" /> {t("audioMirrorStart")}
        </Button>
        {running && (
          <Button
            variant="outline"
            onClick={() => {
              stop.current = true;
            }}
          >
            <Square className="size-4" /> {t("audioMirrorStop")}
          </Button>
        )}
      </div>
    </div>
  );
}
