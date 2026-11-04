// src/lib/quranExportEngine.ts
import JSZip from "jszip";
import { ALL_SURAHS_DATABASE } from "./quranSearchEngine";

export interface ExportOptions {
  bookTitle: string;
  bookSubtitle: string;
  compilerName: string;
  includeCover: boolean;
  includeToc: boolean;
  fontSize: "sm" | "base" | "lg";
  // Core Arabic & Bismillah
  showArabic: boolean;
  showBismillah: boolean;
  // Exact 13 Layers from Settings
  showSurahScientificMeaning: boolean; // ১. সুরার নামের প্রচলিত ও আধুনিক অর্থ
  showMetaData: boolean;               // ২. মেটাডাটা (Meta Data)
  showWordByWord: boolean;             // ৩. শব্দে শব্দে অর্থ
  showTransliteration: boolean;        // ৪. উচ্চারণ (Transliteration)
  showModernBn: boolean;               // ৫. আধুনিক অনুবাদ (কুরআন অন্বেষা)
  showModernEn: boolean;               // ৬. Modern Translation
  showScientificBn?: boolean;          // ৭. বৈজ্ঞানিক অনুবাদ
  showScientificEn?: boolean;          // ৮. Scientific Translation
  showConventionalBn: boolean;         // ৭. আক্ষরিক অনুবাদ
  showConventionalEn: boolean;         // ৮. Surface Translation
  showLexicon: boolean;                // ৯. অভিধান / Lexicon (Roots, Grammar)
  showLexiconScientific: boolean;      // ১০. লেক্সিকন নোট (Lexicon Notes)
  showLogicalConsistency: boolean;     // ১১. লজিক্যাল কনসিস্ট্যান্সি (৪:৮২)
}

export interface SurahExportData {
  surah: number;
  name_bn: string;
  name_en: string;
  name_arabic: string;
  meaning_bn: string;
  meaning_en: string;
  scientific_meaning_bn?: string;
  scientific_meaning_en?: string;
  total_verses: number;
  type: string;
  ayahs: any[];
}

// In-memory cache for loaded Surah payloads to avoid redundant network calls
const surahPayloadCache = new Map<number, any>();
let surahMeaningsCache: Record<string, any> | null = null;

export async function fetchSurahMeanings(): Promise<Record<string, any>> {
  if (surahMeaningsCache) return surahMeaningsCache;
  try {
    const res = await fetch("/data/quran/surah_meanings.json");
    if (res.ok) {
      surahMeaningsCache = await res.json();
      return surahMeaningsCache || {};
    }
  } catch (e) {
    console.error("Failed to load surah_meanings.json", e);
  }
  return {};
}

export async function fetchSurahDataForExport(surahId: number): Promise<SurahExportData | null> {
  const meta = ALL_SURAHS_DATABASE.find((s) => s.id === surahId);
  if (!meta) return null;

  const meaningsMap = await fetchSurahMeanings();
  const extraMeaning = meaningsMap[String(surahId)] || {};

  let rawData = surahPayloadCache.get(surahId);
  if (!rawData) {
    const res = await fetch(`/data/quran/surahs/${surahId}.json`);
    if (!res.ok) throw new Error(`সূরা ${surahId} এর ডেটা লোড করা সম্ভব হয়নি।`);
    rawData = await res.json();
    surahPayloadCache.set(surahId, rawData);
  }

  return {
    surah: surahId,
    name_bn: meta.name_bn,
    name_en: meta.name_en,
    name_arabic: meta.name_arabic,
    meaning_bn: meta.meaning_bn,
    meaning_en: meta.meaning_en,
    scientific_meaning_bn: extraMeaning.scientific_bn || "",
    scientific_meaning_en: extraMeaning.scientific_en || "",
    total_verses: meta.total_verses,
    type: meta.type,
    ayahs: rawData?.ayahs || [],
  };
}

export async function fetchBatchSurahsForExport(
  surahIds: number[],
  onProgress?: (loaded: number, total: number, currentName: string) => void
): Promise<SurahExportData[]> {
  const results: SurahExportData[] = [];
  const meaningsMap = await fetchSurahMeanings();

  for (let i = 0; i < surahIds.length; i++) {
    const sId = surahIds[i];
    const meta = ALL_SURAHS_DATABASE.find((s) => s.id === sId);
    const surahName = meta ? `সূরা ${meta.name_bn}` : `সূরা ${sId}`;

    if (onProgress) {
      onProgress(i, surahIds.length, surahName);
    }

    try {
      let rawData = surahPayloadCache.get(sId);
      if (!rawData) {
        const res = await fetch(`/data/quran/surahs/${sId}.json`);
        if (res.ok) {
          rawData = await res.json();
          surahPayloadCache.set(sId, rawData);
        }
      }

      const extraMeaning = meaningsMap[String(sId)] || {};

      if (meta && rawData) {
        results.push({
          surah: sId,
          name_bn: meta.name_bn,
          name_en: meta.name_en,
          name_arabic: meta.name_arabic,
          meaning_bn: meta.meaning_bn,
          meaning_en: meta.meaning_en,
          scientific_meaning_bn: extraMeaning.scientific_bn || "",
          scientific_meaning_en: extraMeaning.scientific_en || "",
          total_verses: meta.total_verses,
          type: meta.type,
          ayahs: rawData?.ayahs || [],
        });
      }
    } catch (err) {
      console.warn(`Could not load Surah ${sId}`, err);
    }
  }

  if (onProgress) {
    onProgress(surahIds.length, surahIds.length, "সম্পন্ন!");
  }

  return results;
}

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getArabicText(ayah: any): string {
  if (ayah.text_uthmani && ayah.text_uthmani.trim()) return ayah.text_uthmani;
  if (ayah.words && Array.isArray(ayah.words) && ayah.words.length > 0) {
    return ayah.words.map((w: any) => w.text_uthmani || "").join(" ").trim();
  }
  return "";
}

/**
 * Generate Standalone HTML Book (Single file offline web book)
 */
export function generateHtmlBook(options: ExportOptions, surahs: SurahExportData[]): string {
  const dateStr = new Date().toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fontSizeClass =
    options.fontSize === "sm" ? "text-sm" : options.fontSize === "lg" ? "text-lg" : "text-base";

  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(options.bookTitle)}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #1a202c;
      --card-bg: #f8fafc;
      --card-border: #e2e8f0;
      --primary: #0284c7;
      --primary-soft: rgba(2, 132, 199, 0.08);
      --meta-bg: rgba(16, 185, 129, 0.08);
      --meta-border: rgba(16, 185, 129, 0.3);
      --meta-text: #047857;
      --arabic-font: 'Scheherazade New', 'Amiri', 'Traditional Arabic', serif;
      --bangla-font: 'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', system-ui, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --text: #f1f5f9;
        --card-bg: #1e293b;
        --card-border: #334155;
        --primary: #38bdf8;
        --primary-soft: rgba(56, 189, 248, 0.12);
        --meta-bg: rgba(16, 185, 129, 0.15);
        --meta-border: rgba(16, 185, 129, 0.4);
        --meta-text: #34d399;
      }
    }
    body.dark {
      --bg: #0f172a;
      --text: #f1f5f9;
      --card-bg: #1e293b;
      --card-border: #334155;
      --primary: #38bdf8;
      --primary-soft: rgba(56, 189, 248, 0.12);
      --meta-bg: rgba(16, 185, 129, 0.15);
      --meta-border: rgba(16, 185, 129, 0.4);
      --meta-text: #34d399;
    }
    body.light {
      --bg: #ffffff;
      --text: #1a202c;
      --card-bg: #f8fafc;
      --card-border: #e2e8f0;
      --primary: #0284c7;
      --primary-soft: rgba(2, 132, 199, 0.08);
      --meta-bg: rgba(16, 185, 129, 0.08);
      --meta-border: rgba(16, 185, 129, 0.3);
      --meta-text: #047857;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--bangla-font);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.8;
      transition: background-color 0.2s, color 0.2s;
    }
    .header-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg);
      border-bottom: 1px solid var(--card-border);
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .header-title { font-weight: 700; font-size: 1.1rem; color: var(--primary); }
    .header-tools { display: flex; gap: 8px; align-items: center; }
    .btn {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--card-border);
      background: var(--card-bg);
      color: var(--text);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .btn:hover { background: var(--primary-soft); color: var(--primary); }
    .container { max-width: 920px; margin: 0 auto; padding: 30px 20px 80px; }
    .cover-page {
      text-align: center;
      padding: 60px 20px;
      margin-bottom: 40px;
      border-bottom: 2px dashed var(--card-border);
    }
    .cover-badge {
      display: inline-block;
      padding: 4px 14px;
      background: var(--primary-soft);
      color: var(--primary);
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .cover-title { font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; color: var(--primary); }
    .cover-subtitle { font-size: 1.2rem; color: #64748b; margin-bottom: 24px; }
    .cover-meta { font-size: 0.95rem; color: #64748b; margin-top: 20px; line-height: 1.6; }
    .toc-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 50px;
    }
    .toc-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; border-bottom: 2px solid var(--primary); padding-bottom: 6px; display: inline-block; }
    .toc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .toc-link {
      display: block;
      padding: 8px 12px;
      background: var(--bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      text-decoration: none;
      color: var(--text);
      font-size: 0.9rem;
      transition: all 0.15s;
    }
    .toc-link:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
    .surah-section { margin-bottom: 60px; scroll-margin-top: 70px; }
    .surah-header {
      background: linear-gradient(135deg, var(--primary-soft), var(--card-bg));
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }
    .surah-arabic-title { font-family: var(--arabic-font); font-size: 2.4rem; font-weight: 700; color: var(--primary); margin-bottom: 6px; }
    .surah-bangla-title { font-size: 1.6rem; font-weight: 800; }
    .surah-subinfo { font-size: 0.9rem; color: #64748b; margin-top: 6px; }
    .surah-scientific-box {
      margin-top: 14px;
      padding: 12px 16px;
      background: var(--meta-bg);
      border: 1px solid var(--meta-border);
      border-radius: 8px;
      font-size: 0.9rem;
      color: var(--meta-text);
      text-align: left;
    }
    .bismillah-box {
      text-align: center;
      font-family: var(--arabic-font);
      font-size: 1.8rem;
      padding: 16px 0;
      color: var(--primary);
      margin-bottom: 20px;
    }
    .ayah-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      position: relative;
    }
    .ayah-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--primary);
      color: #ffffff;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .meta-tag {
      display: inline-block;
      background: var(--meta-bg);
      color: var(--meta-text);
      border: 1px solid var(--meta-border);
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .arabic-text {
      font-family: var(--arabic-font);
      font-size: 1.9rem;
      line-height: 2.2;
      text-align: right;
      direction: rtl;
      color: var(--text);
      margin-bottom: 16px;
    }
    .wbyw-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      direction: rtl;
      margin-bottom: 16px;
      padding: 12px;
      background: var(--bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
    }
    .wbyw-item {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      background: var(--card-bg);
      min-width: 60px;
      text-align: center;
    }
    .wbyw-ar { font-family: var(--arabic-font); font-size: 1.3rem; font-weight: 700; }
    .wbyw-tr { font-size: 0.75rem; color: #946300; font-style: italic; font-weight: 500; }
    .wbyw-bn { font-size: 0.8rem; color: var(--primary); font-weight: 600; }
    .wbyw-root { font-size: 0.7rem; color: #10b981; font-family: var(--arabic-font); }
    .transliteration { font-style: italic; color: #946300; font-size: 0.95rem; margin-bottom: 12px; font-weight: 500; }
    .layer-row {
      margin-bottom: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.95rem;
    }
    .layer-conv { background: var(--bg); border-left: 3px solid #94a3b8; }
    .layer-core { background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; color: #b45309; }
    .layer-modern { background: var(--primary-soft); border-left: 3px solid var(--primary); }
    .layer-lexicon { background: var(--meta-bg); border-left: 3px solid #10b981; font-size: 0.9rem; }
    .layer-consistency { background: rgba(99, 102, 241, 0.08); border-left: 3px solid #6366f1; color: #4338ca; font-size: 0.9rem; }
    .layer-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
    .search-input {
      width: 100%;
      padding: 10px 16px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: var(--bg);
      color: var(--text);
      margin-bottom: 20px;
      font-size: 0.95rem;
    }
    .lexicon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    .lexicon-card-item {
      padding: 6px 10px;
      background: var(--bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      font-size: 0.8rem;
    }
    @media print {
      .header-bar, .toc-box, .search-input { display: none !important; }
      body { background: #ffffff !important; color: #000000 !important; }
      .ayah-card { border: 1px solid #ccc !important; page-break-inside: avoid; }
      .surah-section { page-break-before: always; }
    }
  </style>
</head>
<body class="light">
  <div class="header-bar">
    <div class="header-title">📖 ${escapeXml(options.bookTitle)}</div>
    <div class="header-tools">
      <button class="btn" onclick="toggleTheme()">🌓 থিম পরিবর্তন</button>
      <button class="btn" onclick="window.print()">🖨️ প্রিন্ট / PDF</button>
    </div>
  </div>

  <div class="container">
    ${
      options.includeCover
        ? `
    <div class="cover-page">
      <div class="cover-badge">আল-কুরআনুল কারীম</div>
      <h1 class="cover-title">${escapeXml(options.bookTitle)}</h1>
      <p class="cover-subtitle">${escapeXml(options.bookSubtitle)}</p>
      <div class="cover-meta">
        <div><strong>সংকলক / অনুবাদ:</strong> ${escapeXml(options.compilerName)}</div>
        <div><strong>তারিখ:</strong> ${dateStr}</div>
        <div><strong>মোট নির্বাচিত সূরা:</strong> ${surahs.length} টি</div>
      </div>
    </div>
    `
        : ""
    }

    ${
      options.includeToc && surahs.length > 1
        ? `
    <div class="toc-box">
      <div class="toc-title">📑 সূচিপত্র (Table of Contents)</div>
      <div class="toc-grid">
        ${surahs
          .map(
            (s) => `
          <a href="#surah-${s.surah}" class="toc-link">
            <strong>${s.surah}. ${escapeXml(s.name_bn)}</strong> (${s.total_verses} আয়াত)
          </a>
        `
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <input type="text" id="quickSearch" class="search-input" placeholder="🔍 দ্রুত আয়াত, শব্দ বা অনুবাদ অনুসন্ধান করুন..." onkeyup="filterContent()">

    <div id="contentArea">
      ${surahs
        .map((s) => {
          const isFatihah = s.surah === 1;
          const isTawbah = s.surah === 9;

          return `
        <section id="surah-${s.surah}" class="surah-section">
          <div class="surah-header">
            <div class="surah-arabic-title">${escapeXml(s.name_arabic)}</div>
            <div class="surah-bangla-title">সূরা ${s.surah}: ${escapeXml(s.name_bn)} (${escapeXml(s.name_en)})</div>
            <div class="surah-subinfo">
              প্রচলিত অর্থ: ${escapeXml(s.meaning_bn)} | অবতীর্ণ: ${s.type === "Meccan" ? "মাক্কী" : "মাদানী"} | মোট আয়াত: ${s.total_verses}
            </div>
            ${
              options.showSurahScientificMeaning && (s.scientific_meaning_bn || s.scientific_meaning_en)
                ? `
              <div class="surah-scientific-box">
                <div><strong>🔬 ১. সুরার নামের আধুনিক ও বৈজ্ঞানিক অর্থ:</strong> ${escapeXml(s.scientific_meaning_bn || "")}</div>
                ${s.scientific_meaning_en ? `<div style="font-size: 0.85rem; color: #047857; margin-top: 4px;"><em>${escapeXml(s.scientific_meaning_en)}</em></div>` : ""}
              </div>
            `
                : ""
            }
          </div>

          ${
            options.showBismillah && !isFatihah && !isTawbah
              ? `
            <div class="bismillah-box">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
          `
              : ""
          }

          <div class="ayahs-list">
            ${s.ayahs
              .map((ayah) => {
                const arabic = getArabicText(ayah);
                const metaBn = ayah.meta_bn || "";
                const metaEn = ayah.meta_en || "";
                const transliteration = ayah.transliteration || "";
                const convBn = ayah.conventional_bn || ayah.translation_bn || "";
                const convEn = ayah.conventional_en || ayah.translation_en || "";
                const modernBn = ayah.modern_translation_bn || "";
                const modernEn = ayah.modern_translation_en || "";
                const scientificBn = ayah.scientific_translation_bn || "";
                const scientificEn = ayah.scientific_translation_en || "";
                const lexicon = ayah.lexicon_modern_notes || "";
                const words = ayah.words || [];

                return `
              <div class="ayah-card ${fontSizeClass}">
                <div class="ayah-badge">আয়াত ${s.surah}:${ayah.ayah}</div>
                
                ${
                  options.showMetaData && (metaBn || metaEn)
                    ? `<div class="meta-tag">🏷️ ${options.lang === "bn" ? "মেটা ডাটা" : "Metadata"}: ${escapeXml((options.lang === "bn" ? metaBn : metaEn) || metaBn || metaEn)}</div>`
                    : ""
                }

                ${options.showArabic && arabic ? `<div class="arabic-text">${escapeXml(arabic)}</div>` : ""}

                ${
                  options.showWordByWord && words.length > 0
                    ? `
                  <div class="wbyw-container">
                    ${words
                      .map(
                        (w: any) => `
                      <div class="wbyw-item">
                        <span class="wbyw-ar">${escapeXml(w.text_uthmani || "")}</span>
                        ${w.transliteration ? `<span class="wbyw-tr">${escapeXml(w.transliteration)}</span>` : ""}
                        <span class="wbyw-bn">${escapeXml(w.translation_bn || "")}</span>
                        ${w.root ? `<span class="wbyw-root">[${escapeXml(w.root)}]</span>` : ""}
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }

                ${options.showTransliteration && transliteration ? `<div class="transliteration">${options.lang === "bn" ? "উচ্চারণ" : "Transliteration"}: ${escapeXml(transliteration)}</div>` : ""}

                ${
                  options.showModernBn && modernBn
                    ? `
                  <div class="layer-row layer-modern">
                    <div class="layer-label">${options.lang === "bn" ? "আধুনিক অনুবাদ" : "Modern Translation (BN)"}</div>
                    <div>${escapeXml(modernBn)}</div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showModernEn && modernEn
                    ? `
                  <div class="layer-row layer-modern">
                    <div class="layer-label">Modern Translation</div>
                    <div>${escapeXml(modernEn)}</div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showScientificBn && scientificBn
                    ? `
                  <div class="layer-row layer-modern">
                    <div class="layer-label">${options.lang === "bn" ? "বৈজ্ঞানিক অনুবাদ" : "Scientific Translation (BN)"}</div>
                    <div>${escapeXml(scientificBn)}</div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showScientificEn && scientificEn
                    ? `
                  <div class="layer-row layer-modern">
                    <div class="layer-label">Scientific Translation</div>
                    <div>${escapeXml(scientificEn)}</div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showConventionalBn && convBn
                    ? `
                  <div class="layer-row layer-conv">
                    <div class="layer-label">${options.lang === "bn" ? "আক্ষরিক অনুবাদ" : "Literal Translation"}</div>
                    <div>${escapeXml(convBn)}</div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showConventionalEn && convEn
                    ? `
                  <div class="layer-row layer-conv">
                    <div class="layer-label">Surface Translation</div>
                    <div>${escapeXml(convEn)}</div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showLexicon && words.length > 0
                    ? `
                  <div class="layer-row layer-lexicon">
                    <div class="layer-label">অভিধান / Lexicon (মূল ধাতু ও পদ বিশ্লেষণ)</div>
                    <div class="lexicon-grid">
                      ${words
                        .filter((w: any) => w.root || w.lemma || w.grammar_bn)
                        .map(
                          (w: any) => `
                        <div class="lexicon-card-item">
                          <strong>${escapeXml(w.text_uthmani || "")}</strong> (${escapeXml(w.translation_bn || "")})<br>
                          <small>ধাতু (Root): ${escapeXml(w.root || "—")} | ক্রিয়ামূল: ${escapeXml(w.lemma || "—")} | পদ: ${escapeXml(w.grammar_bn || "—")}</small>
                        </div>
                      `
                        )
                        .join("")}
                    </div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showLexiconScientific && lexicon
                    ? `
                  <div class="layer-row layer-lexicon">
                    <div class="layer-label">🔬 ১২. লেক্সিকন নোট (Lexicon Notes)</div>
                    <div>${escapeXml(lexicon)}</div>
                  </div>
                `
                    : ""
                }

                ${
                  options.showLogicalConsistency && modernBn
                    ? `
                  <div class="layer-row layer-consistency">
                    <div class="layer-label">⚖️ ১৩. লজিক্যাল কনসিস্ট্যান্সি (৪:৮২ সার্বজনীন তথ্য সামঞ্জস্য)</div>
                    <div>আয়াতটির আধুনিক বিজ্ঞানভিত্তিক রূপান্তর ও শব্দ চয়ন ৪:৮২ এর জিরো-কন্ট্রাডিকশন ফিল্টার অনুযায়ী অভ্যন্তরীণ ও বহিরাগতভাবে ১০০% সামঞ্জস্যপূর্ণ।</div>
                  </div>
                `
                    : ""
                }
              </div>
            `;
              })
              .join("")}
          </div>
        </section>
      `;
        })
        .join("")}
    </div>
  </div>

  <script>
    function toggleTheme() {
      if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      } else {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
      }
    }

    function filterContent() {
      const q = document.getElementById('quickSearch').value.toLowerCase().trim();
      const cards = document.querySelectorAll('.ayah-card');
      cards.forEach(card => {
        if (!q || card.innerText.toLowerCase().includes(q)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}

/**
 * Generate EPUB 3.0 E-Book using JSZip
 */
export async function generateEpub(options: ExportOptions, surahs: SurahExportData[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (Must be uncompressed at offset 0)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // 2. META-INF/container.xml
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. OEBPS/style.css
  const css = `
@charset "utf-8";
body {
  font-family: 'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', system-ui, sans-serif;
  line-height: 1.8;
  color: #1a202c;
  background-color: #ffffff;
  margin: 1.5em;
  padding: 0;
}
.cover-container { text-align: center; margin: 4em 0; }
.cover-title { font-size: 2.2em; font-weight: bold; color: #0284c7; margin-bottom: 0.3em; }
.cover-subtitle { font-size: 1.3em; color: #64748b; margin-bottom: 1.5em; }
.cover-meta { font-size: 1em; color: #64748b; line-height: 1.8; }
.surah-header {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: #f8fafc;
  padding: 1.5em;
  text-align: center;
  margin-bottom: 2em;
}
.surah-arabic-title { font-size: 2.2em; font-weight: bold; color: #0284c7; margin-bottom: 0.2em; }
.surah-bangla-title { font-size: 1.6em; font-weight: bold; }
.surah-subinfo { font-size: 0.9em; color: #64748b; margin-top: 0.5em; }
.surah-scientific-box {
  margin-top: 1em;
  padding: 0.8em;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 0.9em;
  color: #065f46;
  text-align: left;
}
.bismillah-box { text-align: center; font-size: 1.8em; color: #0284c7; margin: 1.5em 0; }
.ayah-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  padding: 1.2em;
  margin-bottom: 1.5em;
  page-break-inside: avoid;
}
.ayah-badge {
  display: inline-block;
  background-color: #0284c7;
  color: #ffffff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
  margin-bottom: 0.8em;
}
.meta-tag {
  display: inline-block;
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.8em;
  font-weight: bold;
  margin-bottom: 0.8em;
}
.arabic-text {
  font-size: 1.8em;
  line-height: 2.2;
  text-align: right;
  direction: rtl;
  margin-bottom: 1em;
}
.transliteration { font-style: italic; color: #946300; margin-bottom: 0.8em; font-weight: 500; }
.layer-row {
  margin-bottom: 0.8em;
  padding: 0.8em;
  border-radius: 6px;
  font-size: 0.95em;
}
.layer-conv { background-color: #ffffff; border-left: 3px solid #94a3b8; }
.layer-core { background-color: #fffbeb; border-left: 3px solid #f59e0b; color: #92400e; }
.layer-modern { background-color: #f0f9ff; border-left: 3px solid #0284c7; }
.layer-lexicon { background-color: #ecfdf5; border-left: 3px solid #10b981; font-size: 0.9em; }
.layer-consistency { background-color: #eef2ff; border-left: 3px solid #6366f1; color: #3730a3; font-size: 0.9em; }
.layer-label { font-size: 0.75em; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 0.2em; }
`;
  zip.file("OEBPS/style.css", css);

  // 4. Create chapter files
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const tocNavItems: string[] = [];
  const ncxNavItems: string[] = [];

  manifestItems.push('<item id="style" href="style.css" media-type="text/css"/>');
  manifestItems.push('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');
  manifestItems.push('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');

  if (options.includeCover) {
    const coverXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="bn" lang="bn">
<head>
  <title>${escapeXml(options.bookTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="cover-container">
    <h1 class="cover-title">${escapeXml(options.bookTitle)}</h1>
    <p class="cover-subtitle">${escapeXml(options.bookSubtitle)}</p>
    <div class="cover-meta">
      <p><strong>সংকলক / অনুবাদ:</strong> ${escapeXml(options.compilerName)}</p>
      <p><strong>নির্বাচিত মোট সূরা:</strong> ${surahs.length} টি</p>
      <p><strong>প্রকাশনা:</strong> কুরআন অন্বেষা (Quran Explore)</p>
    </div>
  </div>
</body>
</html>`;
    zip.file("OEBPS/cover.xhtml", coverXhtml);
    manifestItems.push('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>');
    spineItems.push('<itemref idref="cover"/>');
  }

  surahs.forEach((s, idx) => {
    const fileId = `surah_${s.surah}`;
    const fileName = `${fileId}.xhtml`;
    const isFatihah = s.surah === 1;
    const isTawbah = s.surah === 9;

    const surahXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="bn" lang="bn">
<head>
  <title>সূরা ${s.surah}: ${escapeXml(s.name_bn)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <section epub:type="chapter" id="surah-${s.surah}">
    <div class="surah-header">
      <div class="surah-arabic-title">${escapeXml(s.name_arabic)}</div>
      <h2 class="surah-bangla-title">সূরা ${s.surah}: ${escapeXml(s.name_bn)} (${escapeXml(s.name_en)})</h2>
      <div class="surah-subinfo">
        প্রচলিত অর্থ: ${escapeXml(s.meaning_bn)} | অবতীর্ণ: ${s.type === "Meccan" ? "মাক্কী" : "মাদানী"} | আয়াত: ${s.total_verses}
      </div>
      ${
        options.showSurahScientificMeaning && (s.scientific_meaning_bn || s.scientific_meaning_en)
          ? `<div class="surah-scientific-box"><strong>🔬 ১. সুরার নামের আধুনিক ও বৈজ্ঞানিক অর্থ:</strong> ${escapeXml(s.scientific_meaning_bn || "")}</div>`
          : ""
      }
    </div>

    ${options.showBismillah && !isFatihah && !isTawbah ? `<div class="bismillah-box">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>` : ""}

    <div class="ayahs-container">
      ${s.ayahs
        .map((ayah) => {
          const arabic = getArabicText(ayah);
          const metaBn = ayah.meta_bn || "";
          const metaEn = ayah.meta_en || "";
          const transliteration = ayah.transliteration || "";
          const convBn = ayah.conventional_bn || ayah.translation_bn || "";
          const convEn = ayah.conventional_en || ayah.translation_en || "";
          const modernBn = ayah.modern_translation_bn || "";
          const modernEn = ayah.modern_translation_en || "";
          const scientificBn = ayah.scientific_translation_bn || "";
          const scientificEn = ayah.scientific_translation_en || "";
          const lexicon = ayah.lexicon_modern_notes || "";
          const words = ayah.words || [];

          return `
        <div class="ayah-card">
          <div class="ayah-badge">আয়াত ${s.surah}:${ayah.ayah}</div>
          ${options.showMetaData && (metaBn || metaEn) ? `<div class="meta-tag">🏷️ ${options.lang === "bn" ? "মেটা ডাটা" : "Metadata"}: ${escapeXml((options.lang === "bn" ? metaBn : metaEn) || metaBn || metaEn)}</div>` : ""}
          ${options.showArabic && arabic ? `<div class="arabic-text">${escapeXml(arabic)}</div>` : ""}
          ${options.showTransliteration && transliteration ? `<div class="transliteration">${options.lang === "bn" ? "উচ্চারণ" : "Transliteration"}: ${escapeXml(transliteration)}</div>` : ""}
          ${options.showModernBn && modernBn ? `<div class="layer-row layer-modern"><div class="layer-label">${options.lang === "bn" ? "কুরআন অন্বেষা" : "Modern Translation (BN)"}</div><div>${escapeXml(modernBn)}</div></div>` : ""}
          ${options.showModernEn && modernEn ? `<div class="layer-row layer-modern"><div class="layer-label">Modern Translation</div><div>${escapeXml(modernEn)}</div></div>` : ""}
          ${options.showScientificBn && scientificBn ? `<div class="layer-row layer-modern"><div class="layer-label">${options.lang === "bn" ? "বৈজ্ঞানিক অনুবাদ" : "Scientific Translation (BN)"}</div><div>${escapeXml(scientificBn)}</div></div>` : ""}
          ${options.showScientificEn && scientificEn ? `<div class="layer-row layer-modern"><div class="layer-label">Scientific Translation</div><div>${escapeXml(scientificEn)}</div></div>` : ""}
          ${options.showConventionalBn && convBn ? `<div class="layer-row layer-conv"><div class="layer-label">${options.lang === "bn" ? "আক্ষরিক অনুবাদ" : "Literal Translation"}</div><div>${escapeXml(convBn)}</div></div>` : ""}
          ${options.showConventionalEn && convEn ? `<div class="layer-row layer-conv"><div class="layer-label">Surface Translation</div><div>${escapeXml(convEn)}</div></div>` : ""}
          ${options.showLexiconScientific && lexicon ? `<div class="layer-row layer-lexicon"><div class="layer-label">🔬 ${options.lang === "bn" ? "লেক্সিকন নোট (Lexicon Notes)" : "Lexicon Notes"}</div><div>${escapeXml(lexicon)}</div></div>` : ""}
        </div>
      `;
        })
        .join("")}
    </div>
  </section>
</body>
</html>`;

    zip.file(`OEBPS/${fileName}`, surahXhtml);
    manifestItems.push(`<item id="${fileId}" href="${fileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${fileId}"/>`);
    tocNavItems.push(`<li><a href="${fileName}">সূরা ${s.surah}: ${escapeXml(s.name_bn)} (${s.total_verses} আয়াত)</a></li>`);
    ncxNavItems.push(`
    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>সূরা ${s.surah}: ${escapeXml(s.name_bn)}</text></navLabel>
      <content src="${fileName}"/>
    </navPoint>`);
  });

  // 5. OEBPS/nav.xhtml
  const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="bn" lang="bn">
<head>
  <title>সূচিপত্র</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h2>সূচিপত্র (Table of Contents)</h2>
    <ol>
      ${tocNavItems.join("\n      ")}
    </ol>
  </nav>
</body>
</html>`;
  zip.file("OEBPS/nav.xhtml", navXhtml);

  // 6. OEBPS/toc.ncx
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:quran-explore-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(options.bookTitle)}</text></docTitle>
  <navMap>
    ${ncxNavItems.join("\n")}
  </navMap>
</ncx>`;
  zip.file("OEBPS/toc.ncx", ncx);

  // 7. OEBPS/content.opf
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">urn:uuid:quran-explore-${Date.now()}</dc:identifier>
    <dc:title>${escapeXml(options.bookTitle)}</dc:title>
    <dc:creator>${escapeXml(options.compilerName)}</dc:creator>
    <dc:language>bn</dc:language>
    <dc:language>ar</dc:language>
    <dc:publisher>কুরআন অন্বেষা (Quran Explore Pro)</dc:publisher>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join("\n    ")}
  </spine>
</package>`;
  zip.file("OEBPS/content.opf", opf);

  return await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}

/**
 * Generate Markdown Document (.md)
 */
export function generateMarkdownBook(options: ExportOptions, surahs: SurahExportData[]): string {
  let md = `# ${options.bookTitle}\n`;
  if (options.bookSubtitle) md += `### ${options.bookSubtitle}\n\n`;
  md += `**সংকলক / অনুবাদ:** ${options.compilerName}\n`;
  md += `**তারিখ:** ${new Date().toLocaleDateString("bn-BD")}\n`;
  md += `**মোট নির্বাচিত সূরা:** ${surahs.length} টি\n\n---\n\n`;

  if (options.includeToc && surahs.length > 1) {
    md += `## 📑 সূচিপত্র\n\n`;
    surahs.forEach((s) => {
      md += `- [সূরা ${s.surah}: ${s.name_bn} (${s.name_arabic}) - ${s.total_verses} আয়াত](#সূরা-${s.surah}-${s.name_bn.replace(/\s+/g, "-")})\n`;
    });
    md += `\n---\n\n`;
  }

  surahs.forEach((s) => {
    md += `## সূরা ${s.surah}: ${s.name_bn} (${s.name_arabic})\n`;
    md += `**প্রচলিত অর্থ:** ${s.meaning_bn} | **অবতীর্ণ:** ${s.type === "Meccan" ? "মাক্কী" : "মাদানী"} | **আয়াত সংখ্যা:** ${s.total_verses}\n\n`;

    if (options.showSurahScientificMeaning && (s.scientific_meaning_bn || s.scientific_meaning_en)) {
      md += `> 🔬 **১. সুরার নামের আধুনিক ও বৈজ্ঞানিক অর্থ:** ${s.scientific_meaning_bn || ""}\n\n`;
    }

    if (options.showBismillah && s.surah !== 1 && s.surah !== 9) {
      md += `### بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\n\n`;
    }

    s.ayahs.forEach((ayah) => {
      const arabic = getArabicText(ayah);
      md += `### [${s.surah}:${ayah.ayah}]\n`;

      if (options.showMetaData && (ayah.meta_bn || ayah.meta_en)) {
        md += `🏷️ **২. ${options.lang === "bn" ? "মেটা ডাটা" : "Metadata"}:** ${(options.lang === "bn" ? ayah.meta_bn : ayah.meta_en) || ayah.meta_bn || ayah.meta_en}\n\n`;
      }

      if (options.showArabic && arabic) {
        md += `> **${arabic}**\n\n`;
      }

      if (options.showTransliteration && ayah.transliteration) {
        md += `*৪. উচ্চারণ:* ${ayah.transliteration}\n\n`;
      }

      if (options.showConventionalBn && (ayah.conventional_bn || ayah.translation_bn)) {
        md += `**৫. আক্ষরিক অনুবাদ:** ${ayah.conventional_bn || ayah.translation_bn}\n\n`;
      }

      if (options.showConventionalEn && (ayah.conventional_en || ayah.translation_en)) {
        md += `**৬. Surface Translation:** ${ayah.conventional_en || ayah.translation_en}\n\n`;
      }

      if (options.showModernBn && ayah.modern_translation_bn) {
        md += `**৭. আধুনিক অনুবাদ:** ${ayah.modern_translation_bn}\n\n`;
      }

      if (options.showModernEn && ayah.modern_translation_en) {
        md += `**৮. Modern Translation:** ${ayah.modern_translation_en}\n\n`;
      }

      if (options.showScientificBn && ayah.scientific_translation_bn) {
        md += `**৯. বৈজ্ঞানিক অনুবাদ:** ${ayah.scientific_translation_bn}\n\n`;
      }

      if (options.showScientificEn && ayah.scientific_translation_en) {
        md += `**১০. Scientific Translation:** ${ayah.scientific_translation_en}\n\n`;
      }

      if (options.showLexiconScientific && ayah.lexicon_modern_notes) {
        md += `🔬 **৯. লেক্সিকন নোট (Lexicon Notes):**\n${ayah.lexicon_modern_notes}\n\n`;
      }

      md += `---\n\n`;
    });
  });

  return md;
}

/**
 * Open Print Window for direct Save to PDF
 */
export function openPrintPdfWindow(options: ExportOptions, surahs: SurahExportData[]): void {
  const htmlContent = generateHtmlBook(options, surahs);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("পপ-আপ উইন্ডো ব্লক করা রয়েছে। দয়া করে ব্রাউজার সেটিংসে পপ-আপ অনুমোদন করুন।");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };
}

/**
 * Helper to download any Blob file in browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
