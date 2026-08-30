const commonBengaliWordMap: Record<string, string> = {
  "আমার": "amar",
  "সোনার": "sonar",
  "বাংলা": "bangla",
  "ভুলু": "bhulu",
  "একটা": "ekta",
  "লাল": "lal",
  "কুকুরের": "kukurer",
  "কুকুর": "kukur",
  "নাম": "nam",
  "বেলাশেষের": "belashesher",
  "বেলাশেষে": "belasheshe",
  "গোধুলী": "godhuli",
  "গোধূলি": "godhuli",
  "ছেলে": "chele",
  "ধরা": "dhora",
  "জীবন": "jibon",
  "থেকে": "theke",
  "নেয়া": "neya",
  "নেওয়া": "neya",
  "হিপনোটিজম": "hypnotism",
  "শিক্ষিত": "shikkhito",
  "এবং": "ebong",
  "সুশিক্ষিত": "sushikkhito",
  "অতীত": "otit",
  "বর্তমান": "bortoman",
  "ভবিষ্যত": "bhobisshot",
  "ভবিষ্যৎ": "bhobisshot",
  "আড়ি": "aari",
  "আড়ি": "aari",
  "গোপন": "gopon",
  "সত্যি": "sotyi",
  "নীল": "neel",
  "প্রজাপতি": "projapoti",
  "প্রেম": "prem",
  "একটাই": "ektai",
  "তবে": "tobe",
  "অনেক": "onek",
  "পাগলি": "pagli",
  "খুশি": "khushi",
  "সুলতানা": "sultana",
  "মামালুর": "mamalur",
  "সংসার": "songsar",
  "কি": "ki",
  "কী": "ki",
  "স্বপ্ন": "swopno",
  "দেখলাম": "dekhlam",
  "কিছুক্ষণ": "kichukkhon",
  "কিছুক্ষন": "kichukkhon",
  "আগে": "age",
  "মোটা": "mota",
  "বই": "boi",
  "সাইকেল": "cycle",
  "ভ্রমন": "bhromon",
  "ভ্রমণ": "bhromon",
  "ও": "o",
  "হারিয়ে": "hariye",
  "হারিয়ে": "hariye",
  "যাওয়া": "jaowa",
  "যাওয়া": "jaowa",
  "সুইটি": "sweety",
  "কিরো": "cheiro",
  "হাতের": "hater",
  "রেখা": "rekha",
  "কথা": "kotha",
  "বলে": "bole",
  "পর্ব": "porbo",
  "শেষ": "shesh",
  "যে": "je",
  "চিঠি": "chithi",
  "পোস্ট": "post",
  "করা": "kora",
  "যায়না": "jayna",
  "যায়": "jay",
  "না": "na",
  "আপনি": "apni",
  "দিয়ে": "diye",
  "দিয়ে": "diye",
  "ভাত": "bhat",
  "খেয়েছেন": "kheyechhen",
  "খেয়েছেন": "kheyechhen",
  "হৃদয়ের": "hridoyer",
  "হৃদয়": "hridoy",
  "ক্ষত": "khoto",
  "আছি": "achhi",
  "ভালোবাসার": "bhalobashar",
  "ভালোবাসা": "bhalobasha",
  "বুনো": "buno",
  "হাঁস": "hash",
  "ছোঁয়া": "chhowa",
  "নিষিদ্ধ": "nishiddho",
  "গল্প": "golpo",
  "কবিতা": "kobita",
  "স্মৃতিকথা": "smritikotha",
  "স্মৃতি": "smriti",
  "স্ট্যাটাস": "status"
};

const charMap: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
  '্': '', 'ঽ': '',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const conjuncts = [
  { bn: /ক্ষ/g, en: 'kkh' },
  { bn: /জ্ঞ/g, en: 'gyo' },
  { bn: /ঙ্ক/g, en: 'nk' },
  { bn: /ঙ্গ/g, en: 'ng' },
  { bn: /ঞ্চ/g, en: 'nch' },
  { bn: /ঞ্জ/g, en: 'nj' },
  { bn: /ন্ত/g, en: 'nt' },
  { bn: /ন্থ/g, en: 'nth' },
  { bn: /ন্দ/g, en: 'nd' },
  { bn: /ন্ধ/g, en: 'ndh' },
  { bn: /ম্প/g, en: 'mp' },
  { bn: /ম্ব/g, en: 'mb' },
  { bn: /ম্ভ/g, en: 'mbh' },
  { bn: /ষ্ট/g, en: 'sht' },
  { bn: /ষ্ঠ/g, en: 'shth' },
  { bn: /স্থ/g, en: 'sth' },
  { bn: /স্প/g, en: 'sp' },
  { bn: /স্ফ/g, en: 'sph' },
  { bn: /স্ব/g, en: 'sw' },
  { bn: /স্ম/g, en: 'sm' },
  { bn: /হ্ম/g, en: 'hm' },
  { bn: /হ্ন/g, en: 'hn' },
  { bn: /হ্ল/g, en: 'hl' },
  { bn: /হ্ব/g, en: 'hb' },
  { bn: /ত্ত/g, en: 'tt' },
  { bn: /ত্র/g, en: 'tr' },
  { bn: /প্র/g, en: 'pr' },
  { bn: /গ্র/g, en: 'gr' },
  { bn: /ক্র/g, en: 'kr' },
  { bn: /ব্র/g, en: 'br' },
  { bn: /ভ্র/g, en: 'bhr' },
  { bn: /শ্র/g, en: 'shr' },
  { bn: /দ্র/g, en: 'dr' },
  { bn: /ধ্ব/g, en: 'dhw' },
  { bn: /দ্ব/g, en: 'dw' },
  { bn: /ত্ব/g, en: 'tw' },
  { bn: /র্ক/g, en: 'rk' },
  { bn: /র্ম/g, en: 'rm' },
  { bn: /র্য/g, en: 'ry' },
  { bn: /র্ব/g, en: 'rb' }
];

function transliterateWord(word: string): string {
  let str = word;
  for (const c of conjuncts) {
    str = str.replace(c.bn, c.en);
  }

  let res = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    res += charMap[ch] !== undefined ? charMap[ch] : ch;
  }
  return res;
}

export function generatePhoneticSlug(text: string): string {
  if (!text) return "";

  // Clean punctuation
  const clean = text
    .replace(/[!?,;:()[\]"'\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(" ");
  const translatedWords = words.map((w) => {
    const trimmed = w.trim();
    if (!trimmed) return "";
    if (commonBengaliWordMap[trimmed]) {
      return commonBengaliWordMap[trimmed];
    }
    // Check for English word
    if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    return transliterateWord(trimmed);
  });

  return translatedWords
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
