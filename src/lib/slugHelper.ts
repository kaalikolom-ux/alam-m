/**
 * বাংলা শিরোনাম থেকে অর্থপূর্ণ ও সংক্ষিপ্ত ইংরেজি পার্মালিঙ্ক (Concise English Slug) তৈরির ইঞ্জিন
 * ফোনেটিক বাংলিশ (যেমন: 'duibar-mrityu-ebong-duibar-jibon') পরিহার করে সরাসরি প্রকৃত ইংরেজি শব্দ 
 * (যেমন: 'twice-death-and-twice-life') দিয়ে অটোমেটিক সংক্ষিপ্ত পার্মালিঙ্ক তৈরি করে।
 */

// ইংরেজি স্টপ-ওয়ার্ডস যা স্লাগকে অপ্রয়োজনীয় লম্বা করে
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "am", "be", "been", "being",
  "do", "does", "did", "have", "has", "had", "we", "our", "you", "your",
  "they", "them", "it", "its", "ever", "in", "of", "at", "to", "for", "with",
  "on", "by", "from", "about", "as", "into", "like", "through", "after", "over",
  "between", "out", "that", "this", "these", "those"
]);

// সমৃদ্ধ অফলাইন বাংলা-ইংরেজি শব্দকোষ (কুরআনিক, ইসলামিক, জীবন ও বিজ্ঞান বিষয়ক)
const BENGALI_WORD_MAP: [RegExp, string][] = [
  // সংখ্যা ও ক্রম
  [/১ম|প্রথম/gi, "first"],
  [/২য়|দ্বিতীয়|দ্বিতীয়/gi, "second"],
  [/৩য়|তৃতীয়/gi, "third"],
  [/১টি|একটি/gi, "1"],
  [/২টি|দুইটি/gi, "2"],
  [/৩টি|তিনটি/gi, "3"],
  [/৪টি|চারটি/gi, "4"],
  [/৫টি|পাঁচটি/gi, "5"],
  [/৬টি|ছয়টি|ছয়টি/gi, "6"],
  [/৭টি|সাতটি/gi, "7"],
  [/৮টি|আটটি/gi, "8"],
  [/৯টি|নয়টি|নয়টি/gi, "9"],
  [/১০টি|দশটি/gi, "10"],
  [/দুইবার/gi, "twice"],
  [/একবার/gi, "once"],
  [/তিনবার/gi, "three-times"],

  // কুরআন ও ইসলামিক পরিভাষা
  [/পবিত্র কুরআন|কুরআনুল কারীম|আল-কুরআন|কুরআন|কোরআন/gi, "quran"],
  [/হাদিস|হাদীস/gi, "hadith"],
  [/সুন্নাহ/gi, "sunnah"],
  [/তাফসির|তাফসীর/gi, "tafsir"],
  [/তাদাব্বুর/gi, "tadabbur"],
  [/আল্লাহর|আল্লাহ/gi, "allah"],
  [/রাসুলুল্লাহ|রসুলুল্লাহ|রাসুল|রসুল|নবীজি|নবীগণের|নবীগণ|নবী/gi, "prophets"],
  [/সাহাবী|সাহাবীদের/gi, "companions"],
  [/সালাত|নামাজ|নামায/gi, "prayer"],
  [/রোজা|সিয়াম|সিয়াম/gi, "fasting"],
  [/রমজানের|রমজান|রমযান/gi, "ramadan"],
  [/যাকাত|জাকাত/gi, "zakat"],
  [/সদকা|দান/gi, "charity"],
  [/হজ|হজ্জ/gi, "hajj"],
  [/উমরাহ|ওমরাহ/gi, "umrah"],
  [/দোয়া|দোয়া|মোনাজাত/gi, "supplication"],
  [/জিকির|যিকির/gi, "dhikr"],
  [/তওবা|তাওবা|অনুশোচনা/gi, "repentance"],
  [/ক্ষমা/gi, "forgiveness"],
  [/ঈমান|ইমান/gi, "faith"],
  [/তাকওয়া|তাকওয়া|খোদাভীতি/gi, "piety"],
  [/ইহসান/gi, "excellence"],
  [/শিরক/gi, "polytheism"],
  [/কুফর/gi, "disbelief"],
  [/মুনাফিক|মুনাফেকি/gi, "hypocrisy"],
  [/জান্নাত|বেহেশত/gi, "paradise"],
  [/জাহান্নাম|দোজখ/gi, "hell"],
  [/আখিরাত|পরকাল/gi, "afterlife"],
  [/কবর/gi, "grave"],
  [/কেয়ামত|কিয়ামত|হাশর/gi, "judgment-day"],
  [/হিসাব/gi, "accountability"],
  [/মিজান/gi, "scale"],
  [/পুলসিরাত/gi, "sirat"],
  [/মৃত্যু|মউত/gi, "death"],
  [/জীবন|হায়াত/gi, "life"],
  [/রুহ|আত্মা/gi, "soul"],
  [/আত্মশুদ্ধি/gi, "self-purification"],
  [/আত্মজিজ্ঞাসা|আত্মউপলব্ধি|উপলব্ধি|অনুধাবন/gi, "reflection"],
  [/আত্মসমালোচনা/gi, "self-reckoning"],
  [/আগমনক্রম|ধারাবাহিকতা|ক্রম/gi, "chronology"],
  [/তালিকা/gi, "list"],
  [/প্রচার|দাওয়াত|দাওয়াত/gi, "mission"],
  [/অঞ্চল|এলাকা/gi, "regions"],
  [/শপথ/gi, "oath"],
  [/দৃষ্টিভঙ্গি|দৃষ্টি|দর্শন/gi, "perspective"],
  [/আয়াতসমূহ|আয়াতসমূহ|আয়াত|আয়াত/gi, "verses"],
  [/সূরা|সুরা/gi, "surah"],
  [/সিস্টেম|কাঠামো/gi, "system"],
  [/অনুবাদ/gi, "translation"],
  [/প্রমাণ|দলিল/gi, "proof"],
  [/শব্দ|পরিভাষা/gi, "lexicon"],
  [/মহাজাগতিক/gi, "cosmic"],
  [/আহ্বান|ডাক/gi, "call"],
  [/বিরোধ|দ্বন্দ্ব|দ্বন্দ/gi, "conflict"],
  [/পরিমিতিবোধ|ভারসাম্য/gi, "balance"],
  [/শূন্যতা|শূণ্যতা/gi, "void"],
  [/প্রকৃতি|সৃষ্টিজগত/gi, "nature"],
  [/সম্পদ|অর্থসম্পদ/gi, "wealth"],
  [/বণ্টন|বন্টন/gi, "distribution"],
  [/উদ্বোধন|ওপেনিং/gi, "opening"],
  [/প্রটোকল/gi, "protocol"],
  [/মর্যাদা|সম্মান/gi, "honor"],
  [/পিতামাতা|পিতা|মাতা/gi, "parents"],
  [/বিবাহ|নিকাহ/gi, "marriage"],
  [/তালাক|বিচ্ছেদ/gi, "divorce"],
  [/উত্তরাধিকার/gi, "inheritance"],
  [/হালাল|বৈধ/gi, "halal"],
  [/হারাম|নিষিদ্ধ/gi, "haram"],
  [/পুনঃপাঠ|পুনর্পাঠ/gi, "re-reading"],
  [/বিকল্প/gi, "alternative"],
  [/স্বপ্ন|স্বপ্নের/gi, "dream"],
  [/সংকলন/gi, "compilation"],
  [/কালপঞ্জি|ক্যালেন্ডার/gi, "calendar"],
  [/নাসি/gi, "nasi"],
  [/মাছ/gi, "fish"],
  [/মৃত/gi, "dead"],
  [/প্রবৃত্তি|কামনা/gi, "desires"],
  [/ক্ষমতা/gi, "power"],
  [/সার্বভৌমত্ব|বিচারিক/gi, "sovereignty"],
  [/সিরাতুল মুস্তাক্বীম|সিরাত/gi, "sirat-mustaqeem"],
  [/নীতিমালা|নীতি/gi, "principles"],
  [/বধির-মূক-অন্ধ|বধির|মূক|অন্ধ/gi, "deaf-dumb-blind"],
  [/মসজিদুল হারাম/gi, "masjid-haram"],
  [/মসজিদুল আকসা/gi, "masjid-aqsa"],
  [/জ্বীন|জিন/gi, "jinn"],
  [/ইবলিস/gi, "iblis"],
  [/শয়তান/gi, "shaytan"],
  [/মালাইকা|ফেরেশতা/gi, "malaikah"],
  [/পদার্থবিজ্ঞান|ফিজিক্স/gi, "physics"],
  [/জীববিজ্ঞান|বায়ো/gi, "biology"],
  [/রুকু/gi, "ruku"],
  [/সিজদা|সাজদাহ/gi, "sujud"],
  [/হুরুফুল মুকাত্তায়াত|হুরুফুল মুকাত্তাআত/gi, "huruful-muqattaat"],
  [/জিব্রাইল|জিবরীল/gi, "jibreel"],
  [/মিকাইল/gi, "mikail"],
  [/রাজনৈতিক/gi, "political"],
  [/ডিএনএ|dna/gi, "dna"],
  [/পশ্চিম/gi, "west"],
  [/উদিত|উদয়/gi, "rising"],
  [/তাহাজ্জুদ/gi, "tahajjud"],
  [/জুমুআ|জুমা/gi, "jumuah"],
  [/অজু|ওযু/gi, "wudu"],
  [/কসম/gi, "qasam"],
  [/লা উক্বসিমু|লা উকসিমু/gi, "la-uqsimu"],
  [/ফালা উকসিমু/gi, "fala-uqsimu"],

  // ধারণা ও সাধারণ বিষয়াবলী
  [/বিজ্ঞান|বিজ্ঞানের/gi, "science"],
  [/মহাবিশ্ব|মহাকাশ/gi, "universe"],
  [/সৃষ্টিতত্ত্ব|সৃষ্টিরহস্য/gi, "cosmology"],
  [/সৃষ্টি|স্রষ্টা/gi, "creation"],
  [/পৃথিবী|ধরণী/gi, "earth"],
  [/আকাশ|আসমান/gi, "heavens"],
  [/চন্দ্র|চাঁদ/gi, "moon"],
  [/সূর্য|সুর্য/gi, "sun"],
  [/নক্ষত্র|তারা/gi, "stars"],
  [/মানুষ|মানব|মানবজাতি/gi, "humanity"],
  [/ইতিহাস|ঐতিহাসিক/gi, "history"],
  [/দর্শন|দার্শনিক/gi, "philosophy"],
  [/সমাজ|সামাজিক/gi, "society"],
  [/পরিবার|পারিবারিক/gi, "family"],
  [/নারী|মহিলা/gi, "women"],
  [/অধিকার/gi, "rights"],
  [/ইনসাফ|ন্যায়বিচার|বিচার/gi, "justice"],
  [/জ্ঞান|ইলম/gi, "knowledge"],
  [/শিক্ষা/gi, "education"],
  [/শান্তি/gi, "peace"],
  [/ভালোবাসা|প্রেম/gi, "love"],
  [/দয়া|রহমত|অনুগ্রহ/gi, "mercy"],
  [/বরকত|আশীর্বাদ/gi, "blessings"],
  [/নিয়ামত|নেয়ামত/gi, "bounties"],
  [/শোকর|কৃতজ্ঞতা/gi, "gratitude"],
  [/ধৈর্য|সবর/gi, "patience"],
  [/সত্য|হক/gi, "truth"],
  [/মিথ্যা|বাতিল/gi, "falsehood"],
  [/অহংকার|দম্ভ/gi, "arrogance"],
  [/হিংসা|বিদ্বেষ/gi, "envy"],
  [/লোভ|লালসা/gi, "greed"],
  [/হৃদয়|অন্তর|কলব/gi, "heart"],
  [/বিবেক/gi, "conscience"],
  [/আলো|আলোকে/gi, "light"],
  [/অন্ধকার/gi, "darkness"],
  [/পথ|রাস্তা/gi, "path"],
  [/সফলতা|কামিয়াবি/gi, "success"],
  [/ব্যর্থতা/gi, "failure"],
  [/মুক্তি|নাজাত/gi, "salvation"],
  [/সুসংবাদ/gi, "glad-tidings"],
  [/সতর্কতা|সতর্কবার্তা/gi, "warning"],
  [/প্রবন্ধ|নিবন্ধ/gi, "article"],
  [/গবেষণা/gi, "research"],
  [/বিশ্লেষণ/gi, "analysis"],
  [/ব্যাখ্যা/gi, "explanation"],
  [/প্রশ্ন|জিজ্ঞাসা/gi, "question"],
  [/উত্তর/gi, "answer"],
  [/অজুহাত/gi, "excuse"],
  [/সময়|সময়/gi, "time"],
  [/আজ|আজকে/gi, "today"],
  [/কাল|আগামীকাল/gi, "tomorrow"],
  [/উপহার/gi, "gift"],
  [/আদর্শ/gi, "ideal"],
  [/চরিত্র/gi, "character"],
  [/নীতিমালা|নৈতিকতা/gi, "ethics"],
  [/নিয়ম|আইন/gi, "law"],
  [/আধুনিক|বর্তমান/gi, "modern"],
  [/প্রাচীন|পূর্ববর্তী/gi, "ancient"],
  [/সহজ|সরল/gi, "easy"],
  [/কঠিন|জটিল/gi, "complex"],
  [/মূল|ভিত্তি/gi, "foundation"],
  [/তাৎপর্য|গুরুত্ব/gi, "significance"],
  [/শিক্ষা|সবক/gi, "lesson"],
  [/স্মৃতি|স্মৃতিকথা/gi, "memoir"],
  [/গল্প|কাহিনী/gi, "story"],
  [/কবিতা/gi, "poem"],
  [/উপন্যাস/gi, "novel"],
  [/খসড়া|খসড়া/gi, "draft"],
  [/এবং/gi, "and"],
  [/ও/gi, "and"],
  [/অথবা/gi, "or"],
  [/কিন্তু/gi, "but"],
  [/কারণ/gi, "because"],
];

const NUMBERS: [RegExp, string][] = [
  [/০/g, "0"],
  [/১/g, "1"],
  [/২/g, "2"],
  [/৩/g, "3"],
  [/৪/g, "4"],
  [/৫/g, "5"],
  [/৬/g, "6"],
  [/৭/g, "7"],
  [/৮/g, "8"],
  [/৯/g, "9"],
];

/**
 * ইংরেজি টেক্সট থেকে অপ্রয়োজনীয় শব্দ বাদ দিয়ে ৩-৫ শব্দের চমৎকার সংক্ষিপ্ত পার্মালিঙ্ক তৈরি করে
 */
export function cleanEnglishSlug(englishText: string, maxWords = 5): string {
  if (!englishText || typeof englishText !== "string") return "";

  let workingText = englishText.trim();

  // যদি টেক্সটে প্রশ্ন ও মূল বক্তব্য থাকে (যেমন: 'Do we ever stop? 7 self-questions in the Quran')
  // তাহলে প্রশ্নের পরের মূল বক্তব্যটি অগ্রাধিকার দেওয়া হয়
  if (workingText.includes("?")) {
    const parts = workingText.split("?").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1 && parts[1].length > 4) {
      workingText = parts[1];
    }
  } else if (workingText.includes(":")) {
    const parts = workingText.split(":").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1 && parts[1].length > 4) {
      workingText = parts[1];
    }
  } else if (workingText.includes("—")) {
    const parts = workingText.split("—").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1 && parts[0].length > 4) {
      workingText = parts[0];
    }
  }

  // শব্দ বিভাজন ও ফিল্টারিং
  const rawWords = workingText
    .toLowerCase()
    .replace(/holy quran|al-quran/gi, "quran")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (rawWords.length === 0) return "";

  // যদি শব্দ সংখ্যা বেশি হয়, স্টপ ওয়ার্ড বাদ দিয়ে সংক্ষিপ্ত মূল কি-ওয়ার্ড রাখা
  let selectedWords = rawWords;
  if (rawWords.length > 4) {
    selectedWords = rawWords.filter((w) => !STOP_WORDS.has(w));
    if (selectedWords.length < 2) {
      selectedWords = rawWords;
    }
  }

  const slug = selectedWords
    .slice(0, maxWords)
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return slug;
}

/**
 * গুগল ট্রান্সলেট ব্যবহার করে অনলাইন স্বয়ংক্রিয় দ্রুত ইংরেজি অনুবাদ
 */
export async function translateBnToEnglishOnline(text: string): Promise<string | null> {
  if (!text || typeof text !== "string" || text.trim().length === 0) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0]).filter(Boolean).join(" ");
      return translated.trim() || null;
    }
  } catch {
    // অফলাইন বা নেটওয়ার্ক এরর হলে শান্তভাবে অফলাইন ডিকশনারিতে ফলব্যাক করবে
  }
  return null;
}

/**
 * অফলাইন অভিধানের মাধ্যমে বাংলা থেকে অর্থপূর্ণ ইংরেজি শব্দের সংকলন তৈরি
 */
export function translateBengaliOffline(rawText: string): string {
  let text = rawText.toLowerCase();

  // ১. বাংলা সংখ্যা রূপান্তর
  for (const [pattern, rep] of NUMBERS) {
    text = text.replace(pattern, rep);
  }

  // ২. পরিচিত বাংলা শব্দের ইংরেজি প্রতিশব্দ বসানো
  for (const [pattern, rep] of BENGALI_WORD_MAP) {
    text = text.replace(pattern, ` ${rep} `);
  }

  // ৩. শুধুমাত্র ইংরেজি আলফানিউমেরিক শব্দগুলো রাখা
  const englishWords = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  return englishWords.slice(0, 5).join(" ");
}

/**
 * বাংলা বা ইংরেজি শিরোনাম থেকে স্মার্ট ও সংক্ষিপ্ত ইংরেজি পার্মালিঙ্ক তৈরি (Asynchronous - AI/Online + Offline)
 */
export async function generateEnglishSlug(
  titleBn: string,
  titleEn?: string | null,
  fallback = ""
): Promise<string> {
  // ১. যদি আগেই ইংরেজি শিরোনাম দেওয়া থাকে, সেখান থেকে সরাসরি পরিষ্কার স্লাগ নেওয়া
  if (titleEn && typeof titleEn === "string" && titleEn.trim().length >= 2) {
    const cleanEn = cleanEnglishSlug(titleEn);
    if (cleanEn && cleanEn.length >= 2) return cleanEn;
  }

  const bnText = (titleBn || "").trim();
  if (!bnText) {
    return fallback ? `post-${fallback}` : `post-${Date.now().toString().slice(-4)}`;
  }

  // ২. যদি শিরোনামে কেবল ইংরেজি বর্ণ থাকে
  const hasBengali = /[\u0980-\u09FF]/.test(bnText);
  if (!hasBengali) {
    const directSlug = cleanEnglishSlug(bnText);
    if (directSlug && directSlug.length >= 2) return directSlug;
  }

  // ৩. অনলাইনে দ্রুত প্রকৃত ইংরেজি অনুবাদ নেওয়া
  const onlineTranslation = await translateBnToEnglishOnline(bnText);
  if (onlineTranslation) {
    const slugFromOnline = cleanEnglishSlug(onlineTranslation);
    if (slugFromOnline && slugFromOnline.length >= 2) {
      return slugFromOnline;
    }
  }

  // ৪. অফলাইনে থাকলে সমৃদ্ধ শব্দকোষ থেকে অর্থপূর্ণ ইংরেজি স্লাগ তৈরি
  const offlineWords = translateBengaliOffline(bnText);
  if (offlineWords) {
    const slugFromOffline = cleanEnglishSlug(offlineWords);
    if (slugFromOffline && slugFromOffline.length >= 2) {
      return slugFromOffline;
    }
  }

  // ৫. চূড়ান্ত নিরাপদ ফলব্যাক (কখনই ফোনেটিক বাংলিশ নয়)
  return fallback ? `post-${fallback}` : `post-${Date.now().toString().slice(-4)}`;
}

/**
 * সিঙ্ক্রোনাস ভার্সন (ইনস্ট্যান্ট ফিল্ড টাইপিং বা অফলাইন কন্টেক্সটের জন্য)
 * এটি আর কোনো অবস্থাতেই ফোনেটিক বাংলিশ তৈরি করে না, বরং সরাসরি অর্থপূর্ণ ইংরেজি শব্দ ব্যবহার করে
 */
export function generateConciseEnglishSlugSync(rawText: string, fallback = ""): string {
  if (!rawText || typeof rawText !== "string") {
    return fallback ? `post-${fallback}` : `post-${Date.now().toString().slice(-4)}`;
  }

  const text = rawText.trim();
  const hasBengali = /[\u0980-\u09FF]/.test(text);

  if (!hasBengali) {
    const clean = cleanEnglishSlug(text);
    if (clean && clean.length >= 2) return clean;
  }

  const offlineTranslated = translateBengaliOffline(text);
  const clean = cleanEnglishSlug(offlineTranslated);

  if (clean && clean.length >= 2) {
    return clean;
  }

  return fallback ? `post-${fallback}` : `post-${Date.now().toString().slice(-4)}`;
}

/**
 * পূর্ববর্তী কোডের সাথে শতভাগ সামঞ্জস্য রক্ষার জন্য এক্সপোর্ট
 * পূর্বে এটি বর্ণভিত্তিক ফোনেটিক বাংলিশ বানাত, এখন এটি স্বয়ংক্রিয়ভাবে অর্থপূর্ণ সংক্ষিপ্ত ইংরেজি স্লাগ দেয়
 */
export function bnToEnSlug(rawText: string, fallback = ""): string {
  return generateConciseEnglishSlugSync(rawText, fallback);
}


// Backward compatibility alias
export const generatePhoneticSlug = bnToEnSlug;
