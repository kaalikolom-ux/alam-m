// src/lib/tagHelper.ts
// Intelligent English slug generator and resolver for tags

import { cleanEnglishSlug } from "@/lib/slugHelper";

// Bengali-to-Latin phonetic transliteration dictionary
const BN_TO_EN_PHONETIC: Record<string, string> = {
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "ee", "উ": "u", "ঊ": "oo", "ঋ": "ri",
  "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng",
  "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n",
  "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "bh", "ম": "m",
  "য": "j", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh", "স": "s", "হ": "h",
  "ড়": "r", "ঢ়": "rh", "য়": "y", "ৎ": "t", "ং": "ng", "ঃ": "h", "ঁ": "",
  "া": "a", "ি": "i", "ী": "ee", "ু": "u", "ূ": "oo", "ৃ": "ri",
  "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou", "্": "",
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

// Curated high-fidelity English slugs for Quranic, scientific, thematic & author tags
export const KNOWN_TAG_SLUGS: Record<string, string> = {
  "বিজ্ঞানভিত্তিক": "scientific",
  "কুরআন গবেষণা": "quran-research",
  "অনুবাদ তত্ত্ব": "translation-theory",
  "অনুবাদ": "translation",
  "৪:৮২ ফিল্টার": "4-82-filter",
  "৪:৮২": "4-82",
  "আলম এম.": "alam-m",
  "আলম এম": "alam-m",
  "কুরআন ও বিজ্ঞান": "quran-and-science",
  "ডিএনএ": "dna",
  "dna": "dna",
  "কুরআনিক": "quranic",
  "নফস": "nafs",
  "রূহ": "ruh",
  "রুহ": "ruh",
  "নফসে মুতমায়িন্নাহ": "nafs-al-mutmainnah",
  "তাসাউফ": "tasawwuf",
  "আত্মশুদ্ধি": "self-purification",
  "তাদাব্বুর": "tadabbur",
  "চাঁদ বিদীর্ণ": "moon-split",
  "ভাষাতত্ত্ব": "linguistics",
  "বালাগাত": "balaghat",
  "কুরআনের অলংকার": "quranic-rhetoric",
  "মাযী": "past-tense",
  "অঙ্গীকার": "covenant",
  "দায়িত্বশীল": "responsibility",
  "আমানত": "amanah",
  "জবাবদিহি": "accountability",
  "শাসক": "rulers",
  "বংশধারা": "lineage",
  "সৃষ্টিতত্ত্ব": "cosmology",
  "নুতফাহ": "nutfah",
  "জিনতত্ত্ব": "genetics",
  "ঈমান": "iman",
  "ইসলাম": "islam",
  "যুক্তিবাদ": "rationalism",
  "খতনা": "circumcision",
  "খিতান": "khitan",
  "সৃষ্টির গঠন": "creation-structure",
  "আল্লাহর অনুমতি": "divine-permission",
  "গবেষণা": "research",
  "সূরা আল-কাউসার": "surah-al-kawthar",
  "কাউসার": "al-kawthar",
  "নাহর": "nahar",
  "আবতার": "abtar",
  "বুরহান": "burhan",
  "হজ": "hajj",
  "সালাত": "salat",
  "যাকাত": "zakat",
  "সিয়াম": "sawm",
  "রোজা": "fasting",
  "তাওহীদ": "tawheed",
  "মালাইকা": "malaika",
  "হাশর": "hashr",
  "কিয়ামত": "qiyamah",
  "কেয়ামত": "qiyamah",
  "আখিরাত": "afterlife",
  "পরকাল": "afterlife",
  "জান্নাত": "paradise",
  "জাহান্নাম": "hell",
  "তাকওয়া": "taqwa",
  "তাকওয়া": "taqwa",
  "মুত্তাকী": "muttaqeen",
  "মুত্তাকীন": "muttaqeen",
  "মুনাফিক": "hypocrites",
  "শিরক": "shirk",
  "কুফর": "kufr",
  "হিদায়াত": "hidayah",
  "হিদায়েত": "hidayah",
  "সিরাতুল মুস্তাক্বীম": "sirat-al-mustaqeem",
  "সীরাত": "seerah",
  "নবুওয়াত": "prophethood",
  "ওহী": "wahy",
  "ওহি": "wahy",
  "হিকমাহ": "hikmah",
  "জ্ঞান": "knowledge",
  "দর্শন": "philosophy",
  "নীতিশাস্ত্র": "ethics",
  "মহাবিশ্ব": "universe",
  "পদার্থবিজ্ঞান": "physics",
  "জীববিজ্ঞান": "biology",
  "মহাকর্ষ": "gravity",
  "সময়": "time",
  "মহাকাশ": "space",
  "আলো": "light",
  "অন্ধকার": "darkness",
  "পানি": "water",
  "সমুদ্র": "ocean",
  "পাহাড়": "mountains",
  "লোহা": "iron",
  "সূর্য": "sun",
  "চন্দ্র": "moon",
  "নক্ষত্র": "stars",
  "আকাশ": "sky",
  "পৃথিবী": "earth",
  "বায়ুমণ্ডল": "atmosphere",
  "তথ্যপ্রযুক্তি": "information-theory",
  "কসমিক ওওএস": "cosmic-oos",
  "নিসা": "nisa",
  "পরিবার": "family",
  "অর্থনীতি": "economics",
  "রিবা": "riba",
  "সুদ": "usury",
  "ইনসাফ": "justice",
  "আদল": "adl",
};

// Arabic root mappings
const ARABIC_MAPPINGS: Record<string, string> = {
  "ص-ل-و": "root-slw",
  "ح-জ-জ": "root-hjj",
  "ح-ج-ج": "root-hjj",
  "ن-ك-ح": "root-nkh",
  "ذَٰلِكَ": "dhalika",
};

/**
 * বাংলা বর্ণমালার ধ্বনিভিত্তিক ইংরেজি রূপান্তর
 */
export function transliterateBengali(text: string): string {
  let out = "";
  for (const ch of text) {
    if (BN_TO_EN_PHONETIC[ch] !== undefined) {
      out += BN_TO_EN_PHONETIC[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * যেকোনো বাংলা বা ইংরেজি ট্যাগ থেকে পরিষ্কার, অর্থপূর্ণ ও সংক্ষিপ্ত ইংরেজি স্লাগ তৈরি
 */
export function generateTagSlug(rawTag: string, existingSlugs?: Set<string>): string {
  if (!rawTag) return "";
  const clean = rawTag.trim().replace(/^#/, "");
  if (!clean) return "";
  const lower = clean.toLowerCase();

  let baseSlug = "";

  // ১. সরাসরি পরিচিত আরবী বা ডিকশনারি ম্যাপিং
  if (ARABIC_MAPPINGS[clean]) {
    baseSlug = ARABIC_MAPPINGS[clean];
  } else if (KNOWN_TAG_SLUGS[lower]) {
    baseSlug = KNOWN_TAG_SLUGS[lower];
  } else if (KNOWN_TAG_SLUGS[clean]) {
    baseSlug = KNOWN_TAG_SLUGS[clean];
  } else if (!/[\u0980-\u09FF\u0600-\u06FF]/.test(clean)) {
    // ২. শুধুমাত্র ইংরেজি/সংখ্যা থাকলে
    baseSlug = cleanEnglishSlug(clean);
  } else {
    // ৩. শব্দভিত্তিক বিশ্লেষণ: পরিচিত শব্দ অনুবাদ ও অপ্রচলিত শব্দ ফোনেটিক রোমানাইজেশন
    const tokens = clean.split(/[\s\-:,/।+&]+/);
    const translatedTokens: string[] = [];

    for (const token of tokens) {
      const tClean = token.trim();
      if (!tClean) continue;
      const tLower = tClean.toLowerCase();

      if (ARABIC_MAPPINGS[tClean]) {
        translatedTokens.push(ARABIC_MAPPINGS[tClean]);
      } else if (KNOWN_TAG_SLUGS[tLower]) {
        translatedTokens.push(KNOWN_TAG_SLUGS[tLower]);
      } else if (KNOWN_TAG_SLUGS[tClean]) {
        translatedTokens.push(KNOWN_TAG_SLUGS[tClean]);
      } else if (!/[\u0980-\u09FF\u0600-\u06FF]/.test(tClean)) {
        const c = cleanEnglishSlug(tClean);
        if (c) translatedTokens.push(c);
      } else {
        const phon = cleanEnglishSlug(transliterateBengali(tClean));
        if (phon) translatedTokens.push(phon);
      }
    }
    baseSlug = cleanEnglishSlug(translatedTokens.join("-"));
  }

  if (!baseSlug) baseSlug = cleanEnglishSlug(clean) || "tag";

  // ৪. ডুপ্লিকেট স্লাগ রোধকরণ (যদি existingSlugs সেট দেওয়া থাকে)
  if (existingSlugs) {
    let candidate = baseSlug;
    let counter = 2;
    while (existingSlugs.has(candidate)) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
    return candidate;
  }

  return baseSlug;
}

/**
 * স্লাগ বা ট্যাগ নাম উভয়কে ভিত্তি করে ম্যাচিং নিশ্চিতকরণ
 */
export function isTagMatch(articleTag: string, targetSlugOrName: string): boolean {
  if (!articleTag || !targetSlugOrName) return false;
  const cleanArticleTag = articleTag.trim().toLowerCase().replace(/^#/, "");
  const cleanTarget = targetSlugOrName.trim().toLowerCase().replace(/^#/, "");

  if (cleanArticleTag === cleanTarget) return true;
  const generatedSlug = generateTagSlug(cleanArticleTag);
  if (generatedSlug === cleanTarget) return true;

  return false;
}
