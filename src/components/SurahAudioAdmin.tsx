import React, { useState, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Headphones,
  Globe,
  Lock,
  CheckCircle2,
  Search,
  ExternalLink,
  ShieldCheck,
  Volume2,
  VolumeX,
  Play,
  Square,
  BookOpen,
  Layers,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import {
  usePrefs,
  TRACK_TO_LAYER_MAP,
  type TranslationAudioPermissions
} from "@/lib/prefs";
import { SURAH_META_MAP, type SurahMeta } from "@/lib/surahMeta";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TrackConfig = {
  id: keyof TranslationAudioPermissions;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  voice: string;
  langTag: "bn" | "en" | "ar";
  badgeBn: string;
  badgeEn: string;
};

export const TRANSLATION_TRACKS_CONFIG: TrackConfig[] = [
  {
    id: "conventional_bn",
    titleBn: "১. প্রচলিত ও আক্ষরিক অনুবাদ (বাংলা)",
    titleEn: "1. Conventional / Literal Translation (Bangla)",
    descBn: "মুহিউদ্দীন খান / তাইসিরুল কুরআন — সৈয়দ ইসমত তোহার বাচিক কণ্ঠে অনুবাদ পাঠ",
    descEn: "Muhiuddin Khan / Taisirul Quran — Syed Ismat Toha Recitation Voice",
    voice: "bn-BD-PradeepNeural",
    langTag: "bn",
    badgeBn: "🇧🇩 বাংলা অনুবাদ (সৈয়দ ইসমত তোহা)",
    badgeEn: "🇧🇩 Bangla Translation (Syed Ismat Toha)",
  },
  {
    id: "modern_bn",
    titleBn: "২. কুরআন অন্বেষা (বাংলা)",
    titleEn: "2. Qur'an Explorer (Bangla)",
    descBn: "মহাজাগতিক ও আধুনিক প্রেক্ষাপট — সৈয়দ ইসমত তোহার বাচিক কণ্ঠে অনুবাদ পাঠ",
    descEn: "Contemporary modern framework (Qur'an Explorer) — Syed Ismat Toha Voice",
    voice: "bn-BD-PradeepNeural",
    langTag: "bn",
    badgeBn: "🇧🇩 কুরআন অন্বেষা (সৈয়দ ইসমত তোহা)",
    badgeEn: "🇧🇩 Qur'an Explorer (Syed Ismat Toha)",
  },
  {
    id: "conventional_en",
    titleBn: "৩. Conventional / Surface Translation (English)",
    titleEn: "3. Conventional / Surface Translation (English)",
    descBn: "Sahih International — Microsoft Edge Natural AI Voice (Guy)",
    descEn: "Sahih International — Microsoft Edge Natural AI Voice (Guy)",
    voice: "en-US-GuyNeural",
    langTag: "en",
    badgeBn: "🇬🇧 English Surface",
    badgeEn: "🇬🇧 English Surface",
  },
  {
    id: "modern_en",
    titleBn: "৪. Qur'an Explorer (English)",
    titleEn: "4. Qur'an Explorer (English)",
    descBn: "Contemporary modern English worldview (Qur'an Explorer) — Natural Male AI Voice",
    descEn: "Contemporary modern English worldview (Qur'an Explorer) — Natural Male AI Voice",
    voice: "en-US-GuyNeural",
    langTag: "en",
    badgeBn: "🇬🇧 Qur'an Explorer",
    badgeEn: "🇬🇧 Qur'an Explorer",
  },
  {
    id: "arabic",
    titleBn: "৫. মূল আরবী তিলাওয়াত (Arabic Recitation)",
    titleEn: "5. Original Arabic Recitation",
    descBn: "ক্বারী মিশারী রাশিদ আল-আফাসী (Mishary Rashid Al-Afasy) — হাই-কোয়ালিটি অরিজিনাল অডিও",
    descEn: "Qari Mishary Rashid Al-Afasy — High-fidelity original recitation",
    voice: "Mishary Rashid Alafasy",
    langTag: "ar",
    badgeBn: "🕋 আরবী তিলাওয়াত",
    badgeEn: "🕋 Arabic Recitation",
  },
];

const SAMPLE_TEXTS: Record<string, string> = {
  conventional_bn: "সমস্ত প্রশংসা জগৎসমূহের প্রতিপালক আল্লাহরই জন্য।",
  modern_bn: "মহাবিশ্বের প্রতিটি কণা ও শক্তির পরম নিয়ন্ত্রণকারী আল্লাহর জন্য সমস্ত প্রশংসা।",
  conventional_en: "All praise is due to Allah, Lord of the worlds.",
  modern_en: "All universal praise is owed to Allah, the Architect and Sustainer of the cosmos.",
};

export function SurahAudioAdmin() {
  const {
    publicPermissions,
    updatePublicPermission,
    surahAudioPermissions,
    updateSurahAudioPermission,
    bulkUpdateSurahAudioPermissions,
    translationAudioPermissions,
    updateTranslationAudioPermission,
    bulkUpdateTranslationAudioPermissions,
    isTranslationAudioAllowed,
    lang,
  } = usePrefs();

  const [activeSubTab, setActiveSubTab] = useState<"translations" | "surahs">("translations");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "allowed" | "restricted">("all");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Audio preview state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Global switch
  const isGlobalAudioAllowed = publicPermissions.showAudioPlayback !== false;

  // Stop audio preview
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingTrackId(null);
  };

  // Play voice preview sample
  const handlePlaySample = (trackId: string, voice: string) => {
    if (playingTrackId === trackId) {
      stopAudio();
      return;
    }
    stopAudio();

    if (trackId === "arabic") {
      // Play 1st ayah of Fatihah
      const audio = new Audio("https://everyayah.com/data/Alafasy_128kbps/001001.mp3");
      audioRef.current = audio;
      setPlayingTrackId(trackId);
      audio.onended = () => setPlayingTrackId(null);
      audio.onerror = () => {
        toast.error("তিলাওয়াত অডিও লোড করা যায়নি");
        setPlayingTrackId(null);
      };
      audio.play().catch(() => setPlayingTrackId(null));
      return;
    }

    const text = SAMPLE_TEXTS[trackId] || "সমস্ত প্রশংসা আল্লাহর";
    const ttsUrl = `/api/public/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`;
    const audio = new Audio(ttsUrl);
    audioRef.current = audio;
    setPlayingTrackId(trackId);
    audio.onended = () => setPlayingTrackId(null);
    audio.onerror = () => {
      toast.error(lang === "bn" ? "ভয়েস নমুনা লোড করা যায়নি" : "Failed to load voice sample");
      setPlayingTrackId(null);
    };
    audio.play().catch(() => setPlayingTrackId(null));
  };

  // Build 114 surahs array
  const surahsList = useMemo(() => {
    const list: Array<{ id: number } & SurahMeta> = [];
    for (let i = 1; i <= 114; i++) {
      const meta = SURAH_META_MAP[i] || {
        name_bn: `সুরা ${i}`,
        name_ar: "",
        type: "মাক্কী",
        total: 0,
      };
      list.push({ id: i, ...meta });
    }
    return list;
  }, []);

  // Filtered surahs
  const filteredSurahs = useMemo(() => {
    return surahsList.filter((s) => {
      const isAllowed = isGlobalAudioAllowed && surahAudioPermissions[s.id] !== false;

      // Status filter
      if (filterMode === "allowed" && !isAllowed) return false;
      if (filterMode === "restricted" && isAllowed) return false;

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.trim().toLowerCase();
      const matchId = String(s.id) === term;
      const matchBn = s.name_bn.toLowerCase().includes(term);
      const matchAr = s.name_ar.includes(term);
      return matchId || matchBn || matchAr;
    });
  }, [surahsList, isGlobalAudioAllowed, surahAudioPermissions, filterMode, searchTerm]);

  // Statistics for Surahs
  const surahStats = useMemo(() => {
    let allowedCount = 0;
    let restrictedCount = 0;
    for (let i = 1; i <= 114; i++) {
      if (isGlobalAudioAllowed && surahAudioPermissions[i] !== false) {
        allowedCount++;
      } else {
        restrictedCount++;
      }
    }
    return { allowedCount, restrictedCount };
  }, [isGlobalAudioAllowed, surahAudioPermissions]);

  // Statistics for Translations
  const translationStats = useMemo(() => {
    let allowedCount = 0;
    let restrictedCount = 0;
    for (const track of TRANSLATION_TRACKS_CONFIG) {
      if (isTranslationAudioAllowed(track.id, false)) {
        allowedCount++;
      } else {
        restrictedCount++;
      }
    }
    return { allowedCount, restrictedCount };
  }, [isTranslationAudioAllowed]);

  const handleGlobalToggle = async (val: boolean) => {
    await updatePublicPermission("showAudioPlayback", val);
    toast.success(
      val
        ? (lang === "bn" ? "ভিজিটরদের জন্য সম্পূর্ণ কুরআনের অডিও প্লেব্যাক উন্মুক্ত করা হয়েছে" : "Global audio playback is now visible to public visitors")
        : (lang === "bn" ? "ভিজিটরদের জন্য সম্পূর্ণ কুরআনের অডিও প্লেব্যাক স্থগিত করা হয়েছে" : "Global audio playback is now restricted for public visitors")
    );
  };

  const handleSurahToggle = async (surahId: number, currentAllowed: boolean) => {
    const nextVal = !currentAllowed;
    await updateSurahAudioPermission(surahId, nextVal);
    const surahMeta = SURAH_META_MAP[surahId];
    toast.success(
      lang === "bn"
        ? `সুরা ${surahMeta?.name_bn || surahId} এর অডিও ভিজিটরদের জন্য ${nextVal ? "উন্মুক্ত" : "লুকানো/স্থগিত"} করা হয়েছে`
        : `Surah ${surahMeta?.name_bn || surahId} audio is now ${nextVal ? "allowed" : "restricted"} for visitors`
    );
  };

  const handleTranslationToggle = async (track: TrackConfig, currentAllowed: boolean) => {
    const nextVal = !currentAllowed;
    await updateTranslationAudioPermission(track.id, nextVal);
    toast.success(
      lang === "bn"
        ? `"${track.titleBn}" এর অডিও সাধারণ ভিজিটরদের জন্য ${nextVal ? "উন্মুক্ত" : "লুকানো/স্থগিত"} করা হয়েছে`
        : `"${track.titleEn}" audio is now ${nextVal ? "allowed" : "restricted"} for visitors`
    );
  };

  const handleBulkEnableAllSurahs = async () => {
    setIsBulkProcessing(true);
    try {
      if (!isGlobalAudioAllowed) {
        await updatePublicPermission("showAudioPlayback", true);
      }
      await bulkUpdateSurahAudioPermissions(true);
      toast.success(
        lang === "bn"
          ? "সকল ১১৪টি সুরার অডিও ভিজিটরদের জন্য উন্মুক্ত করা হয়েছে"
          : "Audio for all 114 surahs is now allowed for visitors"
      );
    } catch {
      toast.error(lang === "bn" ? "আপডেট করতে সমস্যা হয়েছে" : "Failed to update permissions");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDisableAllSurahs = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdateSurahAudioPermissions(false);
      toast.success(
        lang === "bn"
          ? "সকল ১১৪টি সুরার অডিও ভিজিটরদের জন্য স্থগিত করা হয়েছে"
          : "Audio for all 114 surahs is now restricted for visitors"
      );
    } catch {
      toast.error(lang === "bn" ? "আপডেট করতে সমস্যা হয়েছে" : "Failed to update permissions");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkEnableAllTranslations = async () => {
    setIsBulkProcessing(true);
    try {
      if (!isGlobalAudioAllowed) {
        await updatePublicPermission("showAudioPlayback", true);
      }
      await bulkUpdateTranslationAudioPermissions(true);
      toast.success(
        lang === "bn"
          ? "সকল অনুবাদের অডিও ভিজিটরদের জন্য উন্মুক্ত করা হয়েছে"
          : "Audio for all translations is now allowed for visitors"
      );
    } catch {
      toast.error(lang === "bn" ? "আপডেট করতে সমস্যা হয়েছে" : "Failed to update permissions");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDisableAllTranslations = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdateTranslationAudioPermissions(false);
      toast.success(
        lang === "bn"
          ? "সকল অনুবাদের অডিও ভিজিটরদের জন্য স্থগিত করা হয়েছে"
          : "Audio for all translations is now restricted for visitors"
      );
    } catch {
      toast.error(lang === "bn" ? "আপডেট করতে সমস্যা হয়েছে" : "Failed to update permissions");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* হেডার ও সার্বিক পরিচিতি */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Headphones className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>{lang === "bn" ? "অডিও প্লেব্যাক ও ভিজিটর অনুমোদন কন্ট্রোল" : "Audio Playback & Visitor Access Control"}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="size-3.5" />
                  {lang === "bn" ? "এডমিন মাস্টার মোড" : "Admin Master"}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "bn"
                  ? "সাধারণ ভিজিটরদের জন্য সুনির্দিষ্ট অনুবাদের অডিও (বাংলা ও ইংরেজি) কিংবা যেকোনো নির্দিষ্ট সুরার অডিও প্লেব্যাক নিয়ন্ত্রণ করুন।"
                  : "Control visitor audio playback for specific translations (Bangla & English) or individual surahs."}
              </p>
            </div>
          </div>
        </div>

        {/* গ্লোবাল মাস্টার সুইচ কার্ড */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Globe className={`size-4 shrink-0 mt-0.5 ${isGlobalAudioAllowed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`} />
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {lang === "bn" ? "সার্বিক অডিও প্লেব্যাক (Global Master Switch):" : "Global Audio Playback Master:"}
                </span>{" "}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ml-1.5 ${
                  isGlobalAudioAllowed
                    ? "text-emerald-700 bg-emerald-500/20 dark:text-emerald-300"
                    : "text-amber-700 bg-amber-500/20 dark:text-amber-300"
                }`}>
                  {isGlobalAudioAllowed
                    ? (lang === "bn" ? "🌐 উন্মুক্ত (Allowed)" : "Allowed")
                    : (lang === "bn" ? "🔒 সম্পূর্ণ সাইটে স্থগিত (Restricted)" : "Restricted")}
                </span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {lang === "bn"
                    ? "এই গ্লোবাল সুইচটি বন্ধ থাকলে কোনো ভিজিটর সমগ্র সাইটের কোনো সুরায় আরবী বা অনুবাদ অডিও শুনতে পাবে না। এডমিন হিসেবে আপনি সবসময় সম্পূর্ণ অডিও পরীক্ষা ও শুনতে পারবেন।"
                    : "When turned off, audio playback is disabled sitewide for public visitors, while administrators can always listen."}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <Switch
                id="global-audio-master-switch"
                checked={isGlobalAudioAllowed}
                onCheckedChange={handleGlobalToggle}
              />
            </div>
          </div>
        </div>

        {/* সাব-ট্যাব ন্যাভিগেশন (অনুবাদের অডিও বনাম ১১৪টি সুরার অডিও) */}
        <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as "translations" | "surahs")} className="w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border/50">
            <TabsList className="bg-muted/70 p-1 h-9">
              <TabsTrigger value="translations" className="text-xs flex items-center gap-1.5 px-3">
                <Layers className="size-3.5" />
                <span>{lang === "bn" ? "১. সুনির্দিষ্ট অনুবাদের অডিও (৭টি ট্র্যাক)" : "1. Translation Audio (7 Tracks)"}</span>
              </TabsTrigger>
              <TabsTrigger value="surahs" className="text-xs flex items-center gap-1.5 px-3">
                <BookOpen className="size-3.5" />
                <span>{lang === "bn" ? "২. ১১৪টি সুরার অডিও" : "2. Per-Surah Audio (114)"}</span>
              </TabsTrigger>
            </TabsList>

            {activeSubTab === "translations" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEnableAllTranslations}
                  disabled={isBulkProcessing}
                  className="h-8 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <Volume2 className="size-3.5 mr-1 text-emerald-600" />
                  {lang === "bn" ? "সব অনুবাদে চালু" : "Enable All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDisableAllTranslations}
                  disabled={isBulkProcessing}
                  className="h-8 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  <VolumeX className="size-3.5 mr-1 text-amber-600" />
                  {lang === "bn" ? "সব অনুবাদে স্থগিত" : "Disable All"}
                </Button>
              </div>
            )}

            {activeSubTab === "surahs" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEnableAllSurahs}
                  disabled={isBulkProcessing}
                  className="h-8 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <Volume2 className="size-3.5 mr-1 text-emerald-600" />
                  {lang === "bn" ? "সব সুরায় চালু" : "Enable All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDisableAllSurahs}
                  disabled={isBulkProcessing}
                  className="h-8 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  <VolumeX className="size-3.5 mr-1 text-amber-600" />
                  {lang === "bn" ? "সব সুরায় স্থগিত" : "Disable All"}
                </Button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: সুনির্দিষ্ট অনুবাদের অডিও কন্ট্রোল (TRANSLATION AUDIO TRACKS)        */}
          {/* ========================================================================= */}
          <TabsContent value="translations" className="mt-4 focus-visible:outline-none space-y-4">
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
              <span>
                {lang === "bn"
                  ? `মোট ৭টি অডিও ট্র্যাকের মধ্যে ${translationStats.allowedCount}টি উন্মুক্ত এবং ${translationStats.restrictedCount}টি স্থগিত রয়েছে।`
                  : `${translationStats.allowedCount} allowed and ${translationStats.restrictedCount} restricted out of 7 audio tracks.`}
              </span>
              <span className="text-[11px] text-muted-foreground/80 italic hidden sm:inline">
                {lang === "bn" ? "*অনুবাদ টেক্সট হাইড থাকলে অডিও স্বয়ংক্রিয়ভাবে স্থগিত থাকে" : "*Hidden text translations are automatically audio restricted"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TRANSLATION_TRACKS_CONFIG.map((track) => {
                const isAllowedForVisitors = isTranslationAudioAllowed(track.id, false);
                const underlyingLayerKey = TRACK_TO_LAYER_MAP[track.id];
                const isTextLayerHidden = underlyingLayerKey && publicPermissions[underlyingLayerKey] === false;
                const isPlaying = playingTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    className={`flex flex-col justify-between rounded-xl border p-4.5 shadow-xs transition-all ${
                      !isAllowedForVisitors
                        ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                        : "border-border/70 bg-card hover:border-border"
                    }`}
                  >
                    {/* শীর্ষ অংশ: ট্র্যকের নাম, ব্যাজ ও ভয়েস ডেসক্রিপশন */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">
                              {lang === "bn" ? track.titleBn : track.titleEn}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              track.langTag === "bn"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : track.langTag === "en"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            }`}>
                              {lang === "bn" ? track.badgeBn : track.badgeEn}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {lang === "bn" ? track.descBn : track.descEn}
                          </p>
                        </div>

                        {/* ভয়েস প্রিভিউ বোতাম */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlaySample(track.id, track.voice)}
                          className={`h-8 px-2.5 text-xs shrink-0 cursor-pointer ${
                            isPlaying
                              ? "border-primary bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-muted/70 text-foreground"
                          }`}
                          title="ভয়েস নমুনা শুনুন"
                        >
                          {isPlaying ? (
                            <>
                              <Square className="size-3 mr-1 fill-current" />
                              <span>{lang === "bn" ? "থামান" : "Stop"}</span>
                            </>
                          ) : (
                            <>
                              <Play className="size-3 mr-1 fill-current" />
                              <span>{lang === "bn" ? "প্রিভিউ" : "Sample"}</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {/* ওয়ার্নিং: যদি অনুবাদ টেক্সট লেয়ারটিই বন্ধ থাকে */}
                      {isTextLayerHidden && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/15 p-2 rounded-lg">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>
                            {lang === "bn"
                              ? "সেটিংস থেকে এই অনুবাদ টেক্সটটি সাধারণ ভিজিটরদের জন্য লুকানো (Hidden), তাই এর অডিও স্বয়ংক্রিয়ভাবে স্থগিত রয়েছে।"
                              : "This translation text is currently hidden from visitors in Settings, so its audio is automatically restricted."}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* নিচের অংশ: স্ক্রিনশটের হুবহু ডিজাইনে ভিজিটর অনুমোদন টগল সুইচ */}
                    <div
                      className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2 cursor-pointer hover:opacity-90 transition-opacity select-none"
                      onClick={() => handleTranslationToggle(track, isAllowedForVisitors)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Globe
                          className={`size-3.5 shrink-0 ${
                            isAllowedForVisitors ? "text-emerald-500" : "text-amber-500"
                          }`}
                        />
                        <span className="text-xs font-semibold text-foreground/90 truncate">
                          {lang === "bn" ? "ভিজিটর অনুমোদন:" : "Visitor Access:"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            isAllowedForVisitors
                              ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                              : "text-amber-600 bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {isAllowedForVisitors
                            ? (lang === "bn" ? "উন্মুক্ত" : "Allowed")
                            : (lang === "bn" ? "লুকানো (Hidden)" : "Restricted")}
                        </span>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          id={`trans-audio-perm-${track.id}`}
                          checked={isAllowedForVisitors}
                          onCheckedChange={() => handleTranslationToggle(track, isAllowedForVisitors)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: ১১৪টি সুরার পৃথক অডিও কন্ট্রোল (PER-SURAH AUDIO CONTROLS)            */}
          {/* ========================================================================= */}
          <TabsContent value="surahs" className="mt-4 focus-visible:outline-none space-y-4">
            {/* ফিল্টার ও সার্চ বার */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={lang === "bn" ? "সুরা খুঁজুন (নম্বর বা নাম)..." : "Search surah (number or name)..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    filterMode === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang === "bn" ? "সবগুলো (১১৪)" : "All (114)"}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("allowed")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    filterMode === "allowed" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  {lang === "bn" ? `উন্মুক্ত (${surahStats.allowedCount})` : `Allowed (${surahStats.allowedCount})`}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("restricted")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    filterMode === "restricted" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lock className="size-3 text-amber-600" />
                  {lang === "bn" ? `স্থগিত (${surahStats.restrictedCount})` : `Restricted (${surahStats.restrictedCount})`}
                </button>
              </div>
            </div>

            {/* ১১৪টি সুরার কার্ড গ্রিড */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSurahs.map((surah) => {
                const isSurahAllowed = isGlobalAudioAllowed && surahAudioPermissions[surah.id] !== false;

                return (
                  <div
                    key={surah.id}
                    className={`flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-all ${
                      !isSurahAllowed
                        ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                        : "border-border/70 bg-card hover:border-border"
                    }`}
                  >
                    {/* শীর্ষ অংশ: সুরার পরিচিতি ও টেস্ট লিংক */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="size-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 border border-border/60">
                            {surah.id}
                          </span>
                          <span className="text-sm font-bold text-foreground truncate">
                            {surah.name_bn}
                          </span>
                          <span className="text-xs font-serif text-muted-foreground">
                            ({surah.name_ar})
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{surah.total}টি আয়াত</span>
                          <span>•</span>
                          <span className="rounded bg-muted/60 px-1.5 py-0.2 text-[10px] font-medium text-foreground">
                            {surah.type}
                          </span>
                        </p>
                      </div>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                        title="সুরার অডিও টেস্ট করুন"
                      >
                        <Link to={`/surah/${surah.id}`} target="_blank">
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                    </div>

                    {/* নিচের অংশ: স্ক্রিনশটের হুবহু ডিজাইনে ভিজিটর অনুমোদন টগল */}
                    <div
                      className="mt-3.5 pt-3 border-t border-border/50 flex items-center justify-between gap-2 cursor-pointer hover:opacity-90 transition-opacity select-none"
                      onClick={() => handleSurahToggle(surah.id, isSurahAllowed)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Globe
                          className={`size-3.5 shrink-0 ${
                            isSurahAllowed ? "text-emerald-500" : "text-amber-500"
                          }`}
                        />
                        <span className="text-xs font-semibold text-foreground/90 truncate">
                          {lang === "bn" ? "ভিজিটর অনুমোদন:" : "Visitor Access:"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            isSurahAllowed
                              ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                              : "text-amber-600 bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {isSurahAllowed
                            ? (lang === "bn" ? "উন্মুক্ত" : "Allowed")
                            : (lang === "bn" ? "লুকানো (Hidden)" : "Restricted")}
                        </span>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          id={`surah-audio-perm-${surah.id}`}
                          checked={isSurahAllowed}
                          onCheckedChange={() => handleSurahToggle(surah.id, isSurahAllowed)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredSurahs.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
                {lang === "bn"
                  ? "কোনো সুরা খুঁজে পাওয়া যায়নি। ভিন্ন নম্বর বা নাম লিখে চেষ্টা করুন।"
                  : "No surahs found matching your filter criteria."}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
