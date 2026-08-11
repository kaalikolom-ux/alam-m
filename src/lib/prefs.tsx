import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { translate, type Lang } from "./i18n";

export type LayerKey =
  | "arabic"
  | "translation"
  | "words"
  | "transliteration"
  | "bn"
  | "en"
  | "sciBn"
  | "sciEn"
  | "lexicon";

export type Layers = Record<LayerKey, boolean>;

const DEFAULT_LAYERS: Layers = {
  arabic: true,
  translation: true,
  words: true,
  transliteration: false,
  bn: true,
  en: true,
  sciBn: true,
  sciEn: false,
  lexicon: true,
};

type PrefsValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  dark: boolean;
  setDark: (dark: boolean) => void;
  layers: Layers;
  toggleLayer: (key: LayerKey) => void;
  ready: boolean;
};

const PrefsContext = createContext<PrefsValue | null>(null);

const STORAGE_KEY = "quran-onbesha-prefs";

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  const [dark, setDarkState] = useState(false);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [ready, setReady] = useState(false);

  // Read stored prefs after hydration so server and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          lang: Lang;
          dark: boolean;
          layers: Partial<Layers>;
        }>;
        if (parsed.lang === "bn" || parsed.lang === "en") setLangState(parsed.lang);
        if (typeof parsed.dark === "boolean") setDarkState(parsed.dark);
        if (parsed.layers) setLayers({ ...DEFAULT_LAYERS, ...parsed.layers });
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDarkState(true);
      }
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang, dark, layers }));
    } catch {
      // storage may be unavailable
    }
  }, [lang, dark, layers, ready]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<PrefsValue>(
    () => ({
      lang,
      setLang: setLangState,
      toggleLang: () => setLangState((prev) => (prev === "bn" ? "en" : "bn")),
      t: (key: string) => translate(lang, key),
      dark,
      setDark: setDarkState,
      layers,
      toggleLayer: (key: LayerKey) =>
        setLayers((prev) => ({ ...prev, [key]: !prev[key] })),
      ready,
    }),
    [lang, dark, layers, ready],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}

export function useT() {
  const { lang } = usePrefs();
  return useCallback((key: string) => translate(lang, key), [lang]);
}
