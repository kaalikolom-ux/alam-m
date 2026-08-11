import { Settings2 } from "lucide-react";

import { usePrefs, type LayerKey } from "@/lib/prefs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ROWS: { key: LayerKey; label: string }[] = [
  { key: "arabic", label: "arabicText" },
  { key: "translation", label: "translationLayer" },
  { key: "words", label: "wordByWord" },
  { key: "transliteration", label: "transliteration" },
  { key: "bn", label: "banglaTranslation" },
  { key: "en", label: "englishTranslation" },
  { key: "sciBn", label: "sciBn" },
  { key: "sciEn", label: "sciEn" },
  { key: "lexicon", label: "lexicon" },
];


export function DisplayToggles() {
  const { t, layers, toggleLayer } = usePrefs();

  return (
    <div className="card-soft p-5">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="size-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("displaySettings")}
        </h2>
      </div>
      <div className="grid gap-3">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <Label htmlFor={`layer-${row.key}`} className="cursor-pointer text-sm font-normal">
              {t(row.label)}
            </Label>
            <Switch
              id={`layer-${row.key}`}
              checked={layers[row.key]}
              onCheckedChange={() => toggleLayer(row.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
