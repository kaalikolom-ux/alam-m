// src/components/QuranExportAdmin.tsx
import { useState, useMemo } from "react";
import {
  BookOpen,
  FileDown,
  Download,
  Printer,
  Layers,
  Settings2,
  FileCode,
  FileText,
  Eye,
  Loader2,
  ListFilter,
  Search,
  X
} from "lucide-react";
import { toast } from "sonner";

import { ALL_SURAHS_DATABASE, SurahMeta } from "@/lib/quranSearchEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  ExportOptions,
  SurahExportData,
  fetchBatchSurahsForExport,
  generateHtmlBook,
  generateEpub,
  generateMarkdownBook,
  openPrintPdfWindow,
  downloadBlob
} from "@/lib/quranExportEngine";

export function QuranExportAdmin() {
  // Surah Multi-Selection State (Set of selected Surah IDs)
  const [selectedSurahIds, setSelectedSurahIds] = useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [surahSearchQuery, setSurahSearchQuery] = useState("");

  // Book Options State
  const [bookTitle, setBookTitle] = useState("আল-কুরআনুল কারীম — আধুনিক বিজ্ঞানভিত্তিক অনুবাদ ও তাদাব্বুর");
  const [bookSubtitle, setBookSubtitle] = useState("প্রচলিত ও আধুনিক বিজ্ঞানভিত্তিক অনুবাদের পূর্ণাঙ্গ সংকলন");
  const [compilerName, setCompilerName] = useState("কুরআন অন্বেষা রিসার্চ টিম (Quran Explore Pro)");
  const [includeCover, setIncludeCover] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  // Core Arabic & Bismillah
  const [showArabic, setShowArabic] = useState(true);
  const [showBismillah, setShowBismillah] = useState(true);

  // Exact 15 Data Layers from Settings
  const [showSurahScientificMeaning, setShowSurahScientificMeaning] = useState(true); // ১. সুরার নামের প্রচলিত ও আধুনিক বিজ্ঞানভিত্তিক অর্থ
  const [showMetaData, setShowMetaData] = useState(true);                             // ২. মেটাডাটা (Meta Data)
  const [showWordByWord, setShowWordByWord] = useState(false);                        // ৩. শব্দে শব্দে অর্থ
  const [showTransliteration, setShowTransliteration] = useState(true);               // ৪. উচ্চারণ (Transliteration)
  const [showModernBn, setShowModernBn] = useState(true);                             // ৫. কুরআন অন্বেষা
  const [showModernEn, setShowModernEn] = useState(false);                            // ৬. Qur'an Explorer
  const [showScientificBn, setShowScientificBn] = useState(true);                     // ৭. বৈজ্ঞানিক অনুবাদ (বাংলা)
  const [showScientificEn, setShowScientificEn] = useState(false);                    // ৮. Scientific Translation (English)
  const [showConventionalBn, setShowConventionalBn] = useState(true);                 // ৯. আক্ষরিক অনুবাদ
  const [showConventionalEn, setShowConventionalEn] = useState(false);                // ১০. Surface Translation
  const [showLexicon, setShowLexicon] = useState(false);                              // ১১. অভিধান / Lexicon
  const [showLexiconScientific, setShowLexiconScientific] = useState(true);          // ১২. লেক্সিকন নোট (Lexicon Notes)
  const [showLogicalConsistency, setShowLogicalConsistency] = useState(true);        // ১৩. লজিক্যাল কনসিস্ট্যান্সি (৪:৮২)

  // Processing & Export State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filtered Surahs in selection list
  const filteredSurahs = useMemo(() => {
    const q = surahSearchQuery.toLowerCase().trim();
    if (!q) return ALL_SURAHS_DATABASE;
    return ALL_SURAHS_DATABASE.filter(
      (s) =>
        String(s.id).includes(q) ||
        s.name_bn.toLowerCase().includes(q) ||
        s.name_en.toLowerCase().includes(q) ||
        s.name_arabic.includes(q) ||
        s.meaning_bn.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [surahSearchQuery]);

  // Target ordered Surah IDs
  const sortedSelectedSurahIds = useMemo(() => {
    return Array.from(selectedSurahIds).sort((a, b) => a - b);
  }, [selectedSurahIds]);

  const targetSurahsMeta = useMemo(() => {
    return sortedSelectedSurahIds
      .map((id) => ALL_SURAHS_DATABASE.find((s) => s.id === id))
      .filter(Boolean) as SurahMeta[];
  }, [sortedSelectedSurahIds]);

  const totalVersesInScope = useMemo(() => {
    return targetSurahsMeta.reduce((sum, s) => sum + s.total_verses, 0);
  }, [targetSurahsMeta]);

  // Toggle individual surah
  const toggleSurah = (id: number) => {
    const next = new Set(selectedSurahIds);
    if (next.has(id)) {
      if (next.size === 1) {
        toast.warning("কমপক্ষে ১টি সূরা নির্বাচিত থাকতে হবে!");
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedSurahIds(next);
  };

  // Surah Presets
  const selectAllSurahs = () => {
    setSelectedSurahIds(new Set(Array.from({ length: 114 }, (_, i) => i + 1)));
    toast.info("সব ১১৪টি সূরা নির্বাচন করা হয়েছে।");
  };

  const clearSurahSelection = () => {
    setSelectedSurahIds(new Set([1]));
    toast.info("সিলেকশন রিসেট করা হয়েছে (সূরা ১ আল-ফাতিহা নির্বাচিত)।");
  };

  const selectCompletedFour = () => {
    setSelectedSurahIds(new Set([1, 2, 3, 4]));
    toast.success("১০০% বিজ্ঞানভিত্তিক রূপান্তরকৃত প্রথম ৪টি সূরা (১, ২, ৩, ৪) নির্বাচিত!");
  };

  const selectMeccanSurahs = () => {
    const meccan = ALL_SURAHS_DATABASE.filter((s) => s.type === "Meccan").map((s) => s.id);
    setSelectedSurahIds(new Set(meccan));
    toast.info(`${meccan.length}টি মাক্কী সূরা নির্বাচিত হয়েছে।`);
  };

  const selectMedinanSurahs = () => {
    const medinan = ALL_SURAHS_DATABASE.filter((s) => s.type === "Medinan").map((s) => s.id);
    setSelectedSurahIds(new Set(medinan));
    toast.info(`${medinan.length}টি মাদানী সূরা নির্বাচিত হয়েছে।`);
  };

  const selectJuz30 = () => {
    const juz30 = Array.from({ length: 37 }, (_, i) => 78 + i);
    setSelectedSurahIds(new Set(juz30));
    toast.info("৩০তম পারা (সূরা ৭৮ থেকে ১১৪) নির্বাচিত হয়েছে।");
  };

  const selectFirstTen = () => {
    setSelectedSurahIds(new Set(Array.from({ length: 10 }, (_, i) => i + 1)));
    toast.info("১ থেকে ১০ নম্বর সূরা নির্বাচিত হয়েছে।");
  };

  // Layer Presets
  const selectAllLayers = () => {
    setShowArabic(true);
    setShowBismillah(true);
    setShowSurahScientificMeaning(true);
    setShowMetaData(true);
    setShowWordByWord(true);
    setShowTransliteration(true);
    setShowConventionalBn(true);
    setShowConventionalEn(true);
    setShowModernBn(true);
    setShowModernEn(true);
    setShowScientificBn(true);
    setShowScientificEn(true);
    setShowLexicon(true);
    setShowLexiconScientific(true);
    setShowLogicalConsistency(true);
    toast.info("সবগুলো ডাটা লেয়ার চালু করা হয়েছে।");
  };

  const deselectAllLayers = () => {
    setShowArabic(true);
    setShowBismillah(true);
    setShowSurahScientificMeaning(false);
    setShowMetaData(false);
    setShowWordByWord(false);
    setShowTransliteration(false);
    setShowConventionalBn(false);
    setShowConventionalEn(false);
    setShowModernBn(false);
    setShowModernEn(false);
    setShowScientificBn(false);
    setShowScientificEn(false);
    setShowLexicon(false);
    setShowLexiconScientific(false);
    setShowLogicalConsistency(false);
    toast.info("সব অনুবাদ ও লেয়ার ডিসিলেক্ট করা হয়েছে (শুধু আরবী মূল টেক্সট সক্রিয়)।");
  };

  const selectModernPreset = () => {
    setShowArabic(true);
    setShowBismillah(true);
    setShowSurahScientificMeaning(true);
    setShowMetaData(true);
    setShowWordByWord(false);
    setShowTransliteration(true);
    setShowConventionalBn(true);
    setShowConventionalEn(false);
    setShowModernBn(true);
    setShowModernEn(false);
    setShowScientificBn(true);
    setShowScientificEn(false);
    setShowLexicon(false);
    setShowLexiconScientific(true);
    setShowLogicalConsistency(true);
    toast.success("আধুনিক বিজ্ঞানভিত্তিক অনুবাদ ও তাদাব্বুর প্রিসেট সক্রিয়!");
  };

  const selectConventionalPreset = () => {
    setShowArabic(true);
    setShowBismillah(true);
    setShowSurahScientificMeaning(false);
    setShowMetaData(false);
    setShowWordByWord(true);
    setShowTransliteration(true);
    setShowConventionalBn(true);
    setShowConventionalEn(true);
    setShowModernBn(false);
    setShowModernEn(false);
    setShowScientificBn(false);
    setShowScientificEn(false);
    setShowLexicon(true);
    setShowLexiconScientific(false);
    setShowLogicalConsistency(false);
    toast.info("প্রচলিত অনুবাদ ও শব্দার্থ প্রিসেট সক্রিয়!");
  };

  const exportOptions: ExportOptions = {
    bookTitle,
    bookSubtitle,
    compilerName,
    includeCover,
    includeToc,
    fontSize,
    showArabic,
    showBismillah,
    showSurahScientificMeaning,
    showMetaData,
    showWordByWord,
    showTransliteration,
    showConventionalBn,
    showConventionalEn,
    showModernBn,
    showModernEn,
    showScientificBn,
    showScientificEn,
    showLexicon,
    showLexiconScientific,
    showLogicalConsistency,
  };

  const loadTargetSurahs = async (): Promise<SurahExportData[]> => {
    if (sortedSelectedSurahIds.length === 0) {
      toast.error("অনুগ্রহ করে কমপক্ষে একটি সূরা নির্বাচন করুন!");
      throw new Error("No surahs selected");
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressText("কুরআনের ডেটা লোড হচ্ছে...");

    try {
      const data = await fetchBatchSurahsForExport(sortedSelectedSurahIds, (loaded, total, currentName) => {
        const p = Math.round((loaded / total) * 100);
        setProgressPercent(p);
        setProgressText(`${currentName} লোড হচ্ছে (${loaded}/${total})...`);
      });
      return data;
    } catch (err: any) {
      toast.error(err.message || "ডেটা লোড করতে ব্যর্থ হয়েছে");
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  // 1. Export as PDF (Open Print Dialog)
  const handleExportPdf = async () => {
    try {
      const surahs = await loadTargetSurahs();
      if (!surahs.length) return;
      toast.success("প্রিন্ট ও PDF উইন্ডো প্রস্তুত করা হয়েছে!");
      openPrintPdfWindow(exportOptions, surahs);
    } catch (e: any) {
      toast.error(e.message || "PDF তৈরিতে সমস্যা হয়েছে");
    }
  };

  // 2. Export as EPUB 3.0 (.epub)
  const handleExportEpub = async () => {
    try {
      const surahs = await loadTargetSurahs();
      if (!surahs.length) return;
      setProgressText("EPUB ই-বুক ফাইল কম্পাইল হচ্ছে...");
      setIsProcessing(true);

      const blob = await generateEpub(exportOptions, surahs);
      const filename =
        sortedSelectedSurahIds.length === 1
          ? `Quran_Surah_${sortedSelectedSurahIds[0]}_${targetSurahsMeta[0]?.name_en || ""}.epub`
          : `Al-Quran_EBook_${sortedSelectedSurahIds.length}_Surahs.epub`;

      downloadBlob(blob, filename);
      toast.success("EPUB ই-বুক সফলভাবে ডাউনলোড হয়েছে!");
    } catch (e: any) {
      toast.error(e.message || "EPUB তৈরিতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  // 3. Export as Standalone HTML Book (.html)
  const handleExportHtml = async () => {
    try {
      const surahs = await loadTargetSurahs();
      if (!surahs.length) return;

      const html = generateHtmlBook(exportOptions, surahs);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const filename =
        sortedSelectedSurahIds.length === 1
          ? `Quran_Surah_${sortedSelectedSurahIds[0]}_${targetSurahsMeta[0]?.name_en || ""}.html`
          : `Al-Quran_Offline_Book.html`;

      downloadBlob(blob, filename);
      toast.success("অফলাইন HTML বুক সফলভাবে ডাউনলোড হয়েছে!");
    } catch (e: any) {
      toast.error(e.message || "HTML বুক তৈরিতে সমস্যা হয়েছে");
    }
  };

  // 4. Export as Markdown (.md)
  const handleExportMarkdown = async () => {
    try {
      const surahs = await loadTargetSurahs();
      if (!surahs.length) return;

      const md = generateMarkdownBook(exportOptions, surahs);
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const filename =
        sortedSelectedSurahIds.length === 1
          ? `Quran_Surah_${sortedSelectedSurahIds[0]}_${targetSurahsMeta[0]?.name_en || ""}.md`
          : `Al-Quran_Markdown_Book.md`;

      downloadBlob(blob, filename);
      toast.success("মার্কডাউন ফাইল সফলভাবে ডাউনলোড হয়েছে!");
    } catch (e: any) {
      toast.error(e.message || "মার্কডাউন তৈরিতে সমস্যা হয়েছে");
    }
  };

  // 5. Generate Live Preview
  const handleGeneratePreview = async () => {
    try {
      const surahs = await loadTargetSurahs();
      if (!surahs.length) return;
      const html = generateHtmlBook(exportOptions, surahs);
      setPreviewHtml(html);
      setPreviewOpen(true);
    } catch (e: any) {
      toast.error(e.message || "প্রিভিউ লোড করতে ব্যর্থ হয়েছে");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <BookOpen className="size-6 text-primary" />
              <h2 className="text-lg font-bold text-foreground">কুরআন PDF ও E-Book এক্সপোর্টার</h2>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                PRO GENERATOR
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              পুরো কুরআন অথবা যেকোনো এক বা একাধিক সূরা নির্বাচন করে আপনার পছন্দমতো অনুবাদ ও তথ্যের লেয়ার বেছে নিয়ে প্রিন্ট-রেডি <strong>PDF</strong>, স্ট্যান্ডার্ড <strong>EPUB 3.0 ই-বুক</strong>, কিংবা অফলাইন <strong>HTML বুক</strong> তৈরি ও শেয়ার করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePreview}
              disabled={isProcessing}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Eye className="size-3.5 text-primary" /> লাইভ প্রিভিউ দেখুন
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar when loading */}
      {isProcessing && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-primary">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>{progressText}</span>
            </div>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      {/* Main Grid: Surah Multi-Selection (5 cols) & Content Layer Toggles (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Surah Multi-Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Surah Multi-Select Box */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ListFilter className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">১. সূরা নির্বাচন (এক বা একাধিক)</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {sortedSelectedSurahIds.length} টি নির্বাচিত
              </span>
            </div>

            {/* Quick Selection Presets */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                কুইক সিলেকশন প্রিসেট:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={selectCompletedFour}
                  className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                >
                  ✨ সম্পূর্ণ সূরা ১-৪ (১০০% সায়েন্টিফিক)
                </button>
                <button
                  type="button"
                  onClick={selectAllSurahs}
                  className="rounded-md bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 cursor-pointer"
                >
                  সব ১১৪টি সূরা
                </button>
                <button
                  type="button"
                  onClick={selectFirstTen}
                  className="rounded-md bg-muted border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 cursor-pointer"
                >
                  সূরা ১-১০
                </button>
                <button
                  type="button"
                  onClick={selectJuz30}
                  className="rounded-md bg-muted border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 cursor-pointer"
                >
                  ৩০তম পারা (৭৮-১১৪)
                </button>
                <button
                  type="button"
                  onClick={selectMeccanSurahs}
                  className="rounded-md bg-muted border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 cursor-pointer"
                >
                  মাক্কী (৮৬টি)
                </button>
                <button
                  type="button"
                  onClick={selectMedinanSurahs}
                  className="rounded-md bg-muted border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 cursor-pointer"
                >
                  মাদানী (২৮টি)
                </button>
                <button
                  type="button"
                  onClick={clearSurahSelection}
                  className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 cursor-pointer"
                >
                  রিসেট
                </button>
              </div>
            </div>

            {/* Search Input for Surahs */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={surahSearchQuery}
                onChange={(e) => setSurahSearchQuery(e.target.value)}
                placeholder="🔍 সূরা নম্বর বা নাম দিয়ে খুঁজুন (যেমন: ফাতিহা, 2, নিসা)..."
                className="pl-8 h-9 text-xs"
              />
              {surahSearchQuery && (
                <button
                  onClick={() => setSurahSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Interactive Scrollable Surah Checkbox List */}
            <div className="rounded-lg border border-border bg-background p-1.5 max-h-72 overflow-y-auto space-y-1 divide-y divide-border/40">
              {filteredSurahs.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  কোনো সূরা পাওয়া যায়নি।
                </div>
              ) : (
                filteredSurahs.map((s) => {
                  const isChecked = selectedSurahIds.has(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer text-xs ${
                        isChecked ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSurah(s.id)}
                          className="rounded accent-primary size-4"
                        />
                        <div className="truncate">
                          <span className="font-bold mr-1.5">{s.id}.</span>
                          <span className="font-semibold">{s.name_bn}</span>
                          <span className="text-[11px] text-muted-foreground ml-1 font-mono">({s.name_arabic})</span>
                          <span className="text-[11px] text-muted-foreground ml-1.5">[{s.total_verses} আয়াত]</span>
                        </div>
                      </div>

                      <span className="shrink-0 text-[10px] uppercase font-bold text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded">
                        {s.type === "Meccan" ? "মাক্কী" : "মাদানী"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Scope Summary Badge */}
            <div className="rounded-lg bg-muted/40 border border-border/70 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>নির্বাচিত মোট সূরা:</span>
                <span className="font-bold text-foreground">{sortedSelectedSurahIds.length} টি</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>মোট আয়াত সংখ্যা:</span>
                <span className="font-bold text-primary">{totalVersesInScope} টি</span>
              </div>
            </div>
          </div>

          {/* Book Metadata Settings Box */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Settings2 className="size-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">২. বই ও কাভারের তথ্য</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-medium">বইয়ের মূল শিরোনাম:</Label>
                <Input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="বইয়ের শিরোনাম"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">সাবটাইটেল / বিবরণ:</Label>
                <Input
                  value={bookSubtitle}
                  onChange={(e) => setBookSubtitle(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="সাবটাইটেল"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">সংকলক / অনুবাদক নাম:</Label>
                <Input
                  value={compilerName}
                  onChange={(e) => setCompilerName(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="সংকলকের নাম"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    className="rounded accent-primary size-3.5"
                  />
                  <span>কভার পেজ যুক্ত করুন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeToc}
                    onChange={(e) => setIncludeToc(e.target.checked)}
                    className="rounded accent-primary size-3.5"
                  />
                  <span>সূচিপত্র (TOC) তৈরি করুন</span>
                </label>
              </div>

              <div className="pt-2 border-t border-border/40">
                <Label className="text-xs font-medium mb-1.5 block">ফন্ট সাইজ:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["sm", "base", "lg"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      className={`py-1.5 rounded border text-xs font-semibold cursor-pointer ${
                        fontSize === sz
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {sz === "sm" ? "ছোট (Small)" : sz === "base" ? "সাধারণ (Medium)" : "বড় (Large)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Exact 13 Data Layer Toggles & Export Action Buttons (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Content Layer Selector Box */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">৩. অনুবাদের লেয়ার ও ডাটা ফিল্টারিং (১৩টি লেয়ার)</h3>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={selectModernPreset}
                  className="rounded px-2.5 py-1 bg-primary/10 text-primary font-bold hover:bg-primary/20 cursor-pointer"
                  title="শুধু কুরআন অন্বেষা ও তাদাব্বুর নোটসমূহ নির্বাচন করুন"
                >
                  ✨ সায়েন্টিফিক প্রিসেট
                </button>
                <button
                  type="button"
                  onClick={selectAllLayers}
                  className="rounded px-2 py-1 bg-muted text-muted-foreground font-semibold hover:text-foreground cursor-pointer"
                  title="সবগুলো ডাটা লেয়ার অন করুন"
                >
                  সব সিলেক্ট
                </button>
                <button
                  type="button"
                  onClick={deselectAllLayers}
                  className="rounded px-2 py-1 bg-destructive/10 text-destructive font-semibold hover:bg-destructive/20 cursor-pointer"
                  title="সব অনুবাদ বন্ধ করে শুধু আরবী রাখুন"
                >
                  সব ডিসিলেক্ট
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Layer 1 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-foreground">১. সুরার নামের প্রচলিত ও আধুনিক বিজ্ঞানভিত্তিক অর্থ</span>
                  <p className="text-[11px] text-muted-foreground">প্রতিটি সুরার শীর্ষে প্রচলিত অর্থ ও আধুনিক বিজ্ঞানভিত্তিক তাৎপর্য</p>
                </div>
                <Switch checked={showSurahScientificMeaning} onCheckedChange={setShowSurahScientificMeaning} />
              </label>

              {/* Layer 2 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-foreground">২. মেটাডাটা (Meta Data)</span>
                  <p className="text-[11px] text-muted-foreground">বিষযভিত্তিক মেটা ডাটা ও টপিক ট্যাগ</p>
                </div>
                <Switch checked={showMetaData} onCheckedChange={setShowMetaData} />
              </label>

              {/* Layer 3 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-foreground">৩. শব্দে শব্দে অর্থ (Word by Word)</span>
                  <p className="text-[11px] text-muted-foreground">প্রতিটি শব্দের নিচে স্বতন্ত্র অর্থ ও পদ</p>
                </div>
                <Switch checked={showWordByWord} onCheckedChange={setShowWordByWord} />
              </label>

              {/* Layer 4 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-foreground">৪. উচ্চারণ (Transliteration)</span>
                  <p className="text-[11px] text-muted-foreground">সহজে পড়ার জন্য উচ্চারণের নির্দেশিকা</p>
                </div>
                <Switch checked={showTransliteration} onCheckedChange={setShowTransliteration} />
              </label>

              {/* Layer 5 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-primary">৫. কুরআন অন্বেষা</span>
                  <p className="text-[11px] text-muted-foreground">মহাজাগতিক ও আধুনিক রূপান্তর (কুরআন অন্বেষা)</p>
                </div>
                <Switch checked={showModernBn} onCheckedChange={setShowModernBn} />
              </label>

              {/* Layer 6 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-primary">৬. Qur'an Explorer</span>
                  <p className="text-[11px] text-muted-foreground">Modern & Cosmic Translation (Qur'an Explorer)</p>
                </div>
                <Switch checked={showModernEn} onCheckedChange={setShowModernEn} />
              </label>

              {/* Layer 7: বৈজ্ঞানিক অনুবাদ (বাংলা) */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-cyan-700 dark:text-cyan-400">৭. বৈজ্ঞানিক অনুবাদ (বাংলা)</span>
                  <p className="text-[11px] text-muted-foreground">বিজ্ঞান ও মহাজাগতিক বিষয়ের আধুনিক বৈজ্ঞানিক অনুবাদ</p>
                </div>
                <Switch checked={showScientificBn} onCheckedChange={setShowScientificBn} />
              </label>

              {/* Layer 8: Scientific Translation (English) */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-cyan-700 dark:text-cyan-400">৮. Scientific Translation (English)</span>
                  <p className="text-[11px] text-muted-foreground">Contemporary scientific, cosmological & natural world English translation</p>
                </div>
                <Switch checked={showScientificEn} onCheckedChange={setShowScientificEn} />
              </label>

              {/* Layer 9 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-foreground">৯. আক্ষরিক অনুবাদ</span>
                  <p className="text-[11px] text-muted-foreground">মুহিউদ্দীন খান / তাইসিরুল কুরআন</p>
                </div>
                <Switch checked={showConventionalBn} onCheckedChange={setShowConventionalBn} />
              </label>

              {/* Layer 10 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-foreground">১০. Surface Translation</span>
                  <p className="text-[11px] text-muted-foreground">সহীহ ইন্টারন্যাশনাল স্ট্যান্ডার্ড অনুবাদ</p>
                </div>
                <Switch checked={showConventionalEn} onCheckedChange={setShowConventionalEn} />
              </label>

              {/* Layer 11 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">১১. অভিধান / Lexicon</span>
                  <p className="text-[11px] text-muted-foreground">শব্দকোষ, মূল ধাতু (Root) ও ব্যাকরণ</p>
                </div>
                <Switch checked={showLexicon} onCheckedChange={setShowLexicon} />
              </label>

              {/* Layer 12 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">১২. লেক্সিকন নোট (Lexicon Notes)</span>
                  <p className="text-[11px] text-muted-foreground">আধুনিক বিজ্ঞানভিত্তিক ব্যাখ্যা ও প্রেক্ষাপট</p>
                </div>
                <Switch checked={showLexiconScientific} onCheckedChange={setShowLexiconScientific} />
              </label>

              {/* Layer 13 */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer transition-colors sm:col-span-2">
                <div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">১৩. লজিক্যাল কনসিস্ট্যান্সি (৪:৮২)</span>
                  <p className="text-[11px] text-muted-foreground">কুরআনের সার্বজনীন ইনফরমেশন আর্কিটেকচার ও অভ্যন্তরীণ সামঞ্জস্য বিশ্লেষণ</p>
                </div>
                <Switch checked={showLogicalConsistency} onCheckedChange={setShowLogicalConsistency} />
              </label>

              {/* Extra Arabic & Bismillah */}
              <label className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/50 cursor-pointer">
                <span className="font-semibold text-foreground">📖 আরবী হরফ (Uthmani Script)</span>
                <Switch checked={showArabic} onCheckedChange={setShowArabic} />
              </label>

              <label className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/50 cursor-pointer">
                <span className="font-semibold text-foreground">✨ সূরার শুরুতে বিসমিল্লাহ</span>
                <Switch checked={showBismillah} onCheckedChange={setShowBismillah} />
              </label>
            </div>
          </div>

          {/* Export Action Buttons Box */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Download className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">৪. এক্সপোর্ট ফরম্যাট নির্বাচন ও ডাউনলোড</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                ({sortedSelectedSurahIds.length} টি সূরা প্রস্তুত)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* PDF Export Button */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between space-y-3 hover:border-primary transition-all">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                    <Printer className="size-4" />
                    <span>প্রিন্ট-রেডি PDF ডকুমেন্ট</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    নির্বাচিত {sortedSelectedSurahIds.length}টি সূরার সুন্দর মার্জিন, কভার ও হেডারসহ ভেক্টর PDF হিসেবে প্রিন্ট বা সেভ করুন।
                  </p>
                </div>
                <Button
                  onClick={handleExportPdf}
                  disabled={isProcessing || sortedSelectedSurahIds.length === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs cursor-pointer"
                >
                  <Printer className="size-3.5 mr-1.5" /> PDF / প্রিন্ট প্রস্তুত করুন
                </Button>
              </div>

              {/* EPUB Export Button */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col justify-between space-y-3 hover:border-amber-500 transition-all">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                    <BookOpen className="size-4" />
                    <span>স্ট্যান্ডার্ড EPUB 3.0 ই-বুক</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Apple Books, Google Play Books, Kindle, Moon+ Reader এ পড়ার জন্য স্ট্যান্ডার্ড <code>.epub</code> ফাইল।
                  </p>
                </div>
                <Button
                  onClick={handleExportEpub}
                  disabled={isProcessing || sortedSelectedSurahIds.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs cursor-pointer"
                >
                  <Download className="size-3.5 mr-1.5" /> EPUB (.epub) ডাউনলোড
                </Button>
              </div>

              {/* Offline HTML Book Export Button */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col justify-between space-y-3 hover:border-emerald-500 transition-all">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    <FileCode className="size-4" />
                    <span>অফলাইন HTML বুক</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    সার্চ বার ও ডার্ক/লাইট মোডসহ সিঙ্গেল <code>.html</code> ফাইল যা ইন্টারনেট ছাড়াই যেকোনো ডিভাইসে চলবে।
                  </p>
                </div>
                <Button
                  onClick={handleExportHtml}
                  disabled={isProcessing || sortedSelectedSurahIds.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                >
                  <Download className="size-3.5 mr-1.5" /> HTML (.html) ডাউনলোড
                </Button>
              </div>

              {/* Markdown Export Button */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col justify-between space-y-3 hover:border-foreground/30 transition-all">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-1">
                    <FileText className="size-4" />
                    <span>রিসার্চ মার্কডাউন (Markdown)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    গবেষণা ও টেক্সট এডিটরে ব্যবহারের জন্য ফরম্যাটেড <code>.md</code> মার্কডাউন ফাইল।
                  </p>
                </div>
                <Button
                  onClick={handleExportMarkdown}
                  disabled={isProcessing || sortedSelectedSurahIds.length === 0}
                  variant="outline"
                  className="w-full text-xs cursor-pointer"
                >
                  <FileDown className="size-3.5 mr-1.5" /> Markdown (.md) ডাউনলোড
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewOpen && previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col h-[90vh]">
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Eye className="size-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">লাইভ বুক প্রিভিউ</h3>
                <span className="text-xs text-muted-foreground">({sortedSelectedSurahIds.length} টি নির্বাচিত সূরা)</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleExportPdf}
                  className="bg-primary text-primary-foreground text-xs cursor-pointer"
                >
                  <Printer className="size-3.5 mr-1" /> PDF প্রিন্ট
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  বন্ধ করুন
                </Button>
              </div>
            </div>
            <div className="flex-1 p-2 overflow-hidden">
              <iframe
                title="Book Preview"
                srcDoc={previewHtml}
                className="w-full h-full rounded-xl border border-border bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
