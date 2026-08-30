/**
 * বাংলা শিরোনাম থেকে অর্থপূর্ণ ও পরিষ্কার ইংরেজি ফোনেটিক স্লাগ (Slug / Permalink) তৈরির ইঞ্জিন
 * যেমন: "দুইবার মৃত্যু এবং দুইবার জীবন" -> "duibar-mrityu-ebong-duibar-jibon"
 */

const CONJUNCTS: [RegExp, string][] = [
  [/মৃত্যু/g, "mrityu"],
  [/স্মৃতি/g, "smriti"],
  [/কুরআন/g, "quran"],
  [/কোরআন/g, "quran"],
  [/আল্লাহ/g, "allah"],
  [/রসুল|রাসুল/g, "rasul"],
  [/নবী/g, "nobi"],
  [/হাদিস/g, "hadith"],
  [/বিজ্ঞান/g, "biggan"],
  [/জীবন/g, "jibon"],
  [/মানুষ/g, "manush"],
  [/পৃথিবী/g, "prithibi"],
  [/আকাশ/g, "akash"],
  [/চন্দ্র/g, "chondro"],
  [/সূর্য|সুর্য/g, "surjo"],
  [/নক্ষত্র/g, "nokkhotro"],
  [/সৃষ্টি/g, "srishti"],
  [/ইতিহাস/g, "itihas"],
  [/গল্প/g, "golpo"],
  [/কবিতা/g, "kobita"],
  [/উপন্যাস/g, "uponnash"],
  [/প্রবন্ধ/g, "probondho"],
  [/স্মৃতিকথা/g, "smritikotha"],
  [/স্ট্যাটাস/g, "status"],
  [/খসড়া|খসড়া/g, "khosra"],
  [/এবং/g, "ebong"],
  [/অথবা/g, "othoba"],
  [/কিন্তু/g, "kintu"],
  [/কারণ/g, "karon"],
  [/ক্ষ/g, "kkh"],
  [/জ্ঞ/g, "gg"],
  [/ঞ্চ/g, "nch"],
  [/ঞ্ছ/g, "nchh"],
  [/ঞ্জ/g, "nj"],
  [/ষ্ট/g, "sht"],
  [/ষ্ঠ/g, "shth"],
  [/স্ত/g, "st"],
  [/স্থ/g, "sth"],
  [/ষ্ণ/g, "shn"],
  [/হ্ম/g, "hm"],
  [/ম্প/g, "mp"],
  [/ম্ব/g, "mb"],
  [/ম্ভ/g, "mbh"],
  [/ন্দ/g, "nd"],
  [/ন্ধ/g, "ndh"],
  [/ন্ত/g, "nt"],
  [/ন্থ/g, "nth"],
  [/স্প/g, "sp"],
  [/স্ফ/g, "sph"],
  [/স্ট/g, "st"],
  [/ঙ্ক/g, "nk"],
  [/ঙ্গ/g, "ng"],
  [/ল্ক/g, "lk"],
  [/ল্গ/g, "lg"],
  [/ল্ট/g, "lt"],
  [/ল্ড/g, "ld"],
  [/ল্প/g, "lp"],
  [/ল্ফ/g, "lph"],
  [/ল্ব/g, "lb"],
  [/ল্ম/g, "lm"],
  [/ল্ল/g, "ll"],
  [/ব্ধ/g, "bdh"],
  [/ব্দ/g, "bd"],
  [/ব্জ/g, "bj"],
  [/ব্ব/g, "bb"],
  [/প্ত/g, "pt"],
  [/প্স/g, "ps"],
  [/প্ন/g, "pn"],
  [/প্প/g, "pp"],
  [/দ্ব/g, "dw"],
  [/দ্ম/g, "ddm"],
  [/দ্দ/g, "dd"],
  [/দ্ধ/g, "ddh"],
  [/ত্ম/g, "ttm"],
  [/ত্ত/g, "tt"],
  [/ত্থ/g, "tth"],
  [/চ্ছ/g, "cch"],
  [/চ্চ/g, "cc"],
  [/জ্জ/g, "jj"],
  [/শ্র/g, "shr"],
  [/শ্ব/g, "shw"],
  [/শ্ম/g, "shm"],
  [/শ্ন/g, "shn"],
  [/শ্ল/g, "shl"],
  [/স্ক্র/g, "skr"],
  [/স্ক/g, "sk"],
  [/স্খ/g, "skh"],
  [/স্ন/g, "sn"],
  [/স্ব/g, "sw"],
  [/স্ম/g, "sm"],
  [/স্ল/g, "sl"],
  [/ত্র/g, "tr"],
  [/প্র/g, "pr"],
  [/গ্র/g, "gr"],
  [/ব্র/g, "br"],
  [/দ্র/g, "dr"],
  [/ধ্র/g, "dhr"],
  [/ক্র/g, "kr"],
  [/ভ্র/g, "bhr"],
  [/মর/g, "mr"],
  [/হ্র/g, "hr"],
  [/র‌্য/g, "ry"],
];

const VOWEL_SIGNS: [RegExp, string][] = [
  [/া/g, "a"],
  [/ি/g, "i"],
  [/ী/g, "i"],
  [/ু/g, "u"],
  [/ূ/g, "u"],
  [/ৃ/g, "ri"],
  [/ে/g, "e"],
  [/ৈ/g, "oi"],
  [/ো/g, "o"],
  [/ৌ/g, "ou"],
  [/্/g, ""],
  [/ৎ/g, "t"],
  [/ং/g, "ng"],
  [/ঃ/g, "h"],
  [/ঁ/g, ""],
];

const VOWELS: [RegExp, string][] = [
  [/অ/g, "o"],
  [/আ/g, "a"],
  [/ই/g, "i"],
  [/ঈ/g, "i"],
  [/উ/g, "u"],
  [/ঊ/g, "u"],
  [/ঋ/g, "ri"],
  [/এ/g, "e"],
  [/ঐ/g, "oi"],
  [/ও/g, "o"],
  [/ঔ/g, "ou"],
];

const CONSONANTS: [RegExp, string][] = [
  [/ক/g, "k"],
  [/খ/g, "kh"],
  [/গ/g, "g"],
  [/ঘ/g, "gh"],
  [/ঙ/g, "ng"],
  [/চ/g, "ch"],
  [/ছ/g, "chh"],
  [/জ/g, "j"],
  [/ঝ/g, "jh"],
  [/ঞ/g, "n"],
  [/ট/g, "t"],
  [/ঠ/g, "th"],
  [/ড/g, "d"],
  [/ঢ/g, "dh"],
  [/ণ/g, "n"],
  [/ত/g, "t"],
  [/থ/g, "th"],
  [/দ/g, "d"],
  [/ধ/g, "dh"],
  [/ন/g, "n"],
  [/প/g, "p"],
  [/ফ/g, "f"],
  [/ব/g, "b"],
  [/ভ/g, "bh"],
  [/ম/g, "m"],
  [/য/g, "j"],
  [/র/g, "r"],
  [/ল/g, "l"],
  [/শ/g, "sh"],
  [/ষ/g, "sh"],
  [/স/g, "s"],
  [/হ/g, "h"],
  [/ড়/g, "r"],
  [/ঢ়/g, "rh"],
  [/য়/g, "y"],
  [/ৎ/g, "t"],
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

export function bnToEnSlug(rawText: string, fallback = ""): string {
  if (!rawText || typeof rawText !== "string") {
    return fallback ? `post-${fallback}` : `post-${Date.now().toString().slice(-4)}`;
  }

  let text = rawText.trim();

  // ১. যুক্তাক্ষর প্রতিস্থাপন
  for (const [pattern, rep] of CONJUNCTS) {
    text = text.replace(pattern, rep);
  }

  // ২. কার চিহ্ন প্রতিস্থাপন
  for (const [pattern, rep] of VOWEL_SIGNS) {
    text = text.replace(pattern, rep);
  }

  // ৩. স্বরবর্ণ প্রতিস্থাপন
  for (const [pattern, rep] of VOWELS) {
    text = text.replace(pattern, rep);
  }

  // ৪. ব্যঞ্জনবর্ণ প্রতিস্থাপন
  for (const [pattern, rep] of CONSONANTS) {
    text = text.replace(pattern, rep);
  }

  // ৫. সংখ্যা প্রতিস্থাপন
  for (const [pattern, rep] of NUMBERS) {
    text = text.replace(pattern, rep);
  }

  // ৬. ক্লিন স্লাগ ফরম্যাটিং (lowercase, alphanumerics and hyphens only)
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  if (!clean || clean.length < 2) {
    return fallback ? `post-${fallback}` : `post-${Date.now().toString().slice(-4)}`;
  }

  return clean;
}
