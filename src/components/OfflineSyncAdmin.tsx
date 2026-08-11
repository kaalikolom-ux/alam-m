import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CloudDownload, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { syncChapters, syncSurah } from "@/lib/quran-sync";
import { usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function OfflineSyncAdmin() {
  const { t } = usePrefs();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [label, setLabel] = useState("");

  const state = useQuery({
    queryKey: ["quran-sync-state"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quran_sync_state")
        .select("surah, verses_synced, synced_at")
        .order("surah");
      if (error) throw error;
      return data;
    },
  });

  async function runSync(from: number, to: number) {
    setRunning(true);
    setDone(0);
    try {
      await syncChapters();
      for (let s = from; s <= to; s += 1) {
        setLabel(`${t("surahs")} ${s}`);
        await syncSurah(s);
        setDone(s - from + 1);
      }
      toast.success(t("syncDone"));
      await state.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
      setLabel("");
    }
  }

  const total = state.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="card-soft space-y-4 p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold">{t("offlineSync")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("offlineSyncHint")}</p>
          </div>
          <CloudDownload className="size-6 shrink-0 text-primary" />
        </div>

        <p className="text-sm">
          {t("syncedSurahs")}: <span className="font-semibold">{total}</span> / 114
        </p>

        {running && (
          <div className="space-y-2">
            <Progress value={(done / 114) * 100} />
            <p className="text-xs text-muted-foreground">
              {label} — {done}/114
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button disabled={running} onClick={() => runSync(1, 114)}>
            <RefreshCw className={`size-4 ${running ? "animate-spin" : ""}`} /> {t("syncAll")}
          </Button>
          <Button variant="outline" disabled={running} onClick={() => runSync(1, 10)}>
            {t("syncFirstTen")}
          </Button>
        </div>
      </div>

      <div className="card-soft max-h-72 divide-y divide-border overflow-y-auto p-2">
        {state.data?.map((s) => (
          <div key={s.surah} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>
              {t("surahs")} {s.surah} · {s.verses_synced} {t("verses")}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(s.synced_at).toLocaleDateString("en-GB")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
