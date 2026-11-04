// src/lib/quranSearchEngine.ts

export interface SurahMeta {
  id: number;
  name_bn: string;
  name_en: string;
  name_arabic: string;
  meaning_bn: string;
  meaning_en: string;
  total_verses: number;
  type: "Meccan" | "Medinan";
  aliases: string[];
}

export const ALL_SURAHS_DATABASE: SurahMeta[] = [
  {
    id: 1,
    name_bn: "আল-ফাতিহা",
    name_en: "Al-Fatihah",
    name_arabic: "الفاتحة",
    meaning_bn: "উদ্বোধন / সূচনা",
    meaning_en: "The Opener",
    total_verses: 7,
    type: "Meccan",
    aliases: ["ফাতিহা", "ফাতেহা", "ফাতিহাহ", "উম্মুল কুরআন", "উম্মুল কিতাব", "সাবউল মাছানি", "fatiha", "fatihah", "al-fatihah"]
  },
  {
    id: 2,
    name_bn: "আল-বাকারাহ",
    name_en: "Al-Baqarah",
    name_arabic: "البقرة",
    meaning_bn: "গাভী",
    meaning_en: "The Cow",
    total_verses: 286,
    type: "Medinan",
    aliases: ["বাকারা", "বাকারাহ", "বাক্বারা", "গাভী", "বাছুর", "আয়াতুল কুরসি", "আয়াতুল কুরসী", "aytul kursi", "kursi", "baqara", "baqarah", "al-baqarah"]
  },
  {
    id: 3,
    name_bn: "আলে ইমরান",
    name_en: "Ali 'Imran",
    name_arabic: "آل عمران",
    meaning_bn: "ইমরানের পরিবার",
    meaning_en: "Family of Imran",
    total_verses: 200,
    type: "Medinan",
    aliases: ["ইমরান", "আলে ইমরান", "আলি ইমরান", "আল ইমরান", "imran", "ali imran", "aal imran"]
  },
  {
    id: 4,
    name_bn: "আন-নিসা",
    name_en: "An-Nisa",
    name_arabic: "النساء",
    meaning_bn: "মহিলা / নারী জাতি",
    meaning_en: "The Women",
    total_verses: 176,
    type: "Medinan",
    aliases: ["নিসা", "আন নিসা", "নারী", "মহিলা", "স্ত্রী", "nisa", "an-nisa", "women"]
  },
  {
    id: 5,
    name_bn: "আল-মায়িদাহ",
    name_en: "Al-Ma'idah",
    name_arabic: "المائدة",
    meaning_bn: "খাদ্য পরিবেশিত দস্তরখান",
    meaning_en: "The Table Spread",
    total_verses: 120,
    type: "Medinan",
    aliases: ["মায়িদাহ", "মায়েদা", "মায়িদা", "মায়েদা", "দস্তরখান", "খাবার", "maidah", "al-maidah", "maeda"]
  },
  {
    id: 6,
    name_bn: "আল-আন'আম",
    name_en: "Al-An'am",
    name_arabic: "الأنعام",
    meaning_bn: "গৃহপালিত পশু",
    meaning_en: "The Cattle",
    total_verses: 165,
    type: "Meccan",
    aliases: ["আনআম", "আন'আম", "গৃহপালিত পশু", "পশু", "anam", "al-anam"]
  },
  {
    id: 7,
    name_bn: "আল-আ'রাফ",
    name_en: "Al-A'raf",
    name_arabic: "الأعراف",
    meaning_bn: "উঁচু স্থানসমূহ",
    meaning_en: "The Heights",
    total_verses: 206,
    type: "Meccan",
    aliases: ["আরাফ", "আ'রাফ", "উঁচু স্থান", "araf", "al-araf"]
  },
  {
    id: 8,
    name_bn: "আল-আনফাল",
    name_en: "Al-Anfal",
    name_arabic: "الأنفال",
    meaning_bn: "যুদ্ধলব্ধ সম্পদ / গনীমত",
    meaning_en: "The Spoils of War",
    total_verses: 75,
    type: "Medinan",
    aliases: ["আনফাল", "গনীমত", "যুদ্ধলব্ধ সম্পদ", "বদর", "anfal", "al-anfal"]
  },
  {
    id: 9,
    name_bn: "আত-তাওবাহ",
    name_en: "At-Tawbah",
    name_arabic: "التوبة",
    meaning_bn: "অনুশোচনা / তওবা",
    meaning_en: "The Repentance",
    total_verses: 129,
    type: "Medinan",
    aliases: ["তাওবাহ", "তওবা", "তাওবা", "বারাআত", "অনুশোচনা", "ক্ষমা", "tawbah", "at-tawbah", "tawba", "repentance"]
  },
  {
    id: 10,
    name_bn: "ইউনুস",
    name_en: "Yunus",
    name_arabic: "يونس",
    meaning_bn: "নবী ইউনুস (আঃ)",
    meaning_en: "Jonah",
    total_verses: 109,
    type: "Meccan",
    aliases: ["ইউনুস", "ইউনুছ", "মাছের পেটে নবী", "নবী ইউনুস", "yunus", "jonah"]
  },
  {
    id: 11,
    name_bn: "হুদ",
    name_en: "Hud",
    name_arabic: "هود",
    meaning_bn: "নবী হুদ (আঃ)",
    meaning_en: "Hud",
    total_verses: 123,
    type: "Meccan",
    aliases: ["হুদ", "হূদ", "নবী হুদ", "আদ জাতি", "hud"]
  },
  {
    id: 12,
    name_bn: "ইউসুফ",
    name_en: "Yusuf",
    name_arabic: "يوسف",
    meaning_bn: "নবী ইউসুফ (আঃ)",
    meaning_en: "Joseph",
    total_verses: 111,
    type: "Meccan",
    aliases: ["ইউসুফ", "ইউছুফ", "আহসানুল কাসাস", "নবী ইউসুফ", "জুলাইখা", "yusuf", "joseph"]
  },
  {
    id: 13,
    name_bn: "আর-রাদ",
    name_en: "Ar-Ra'd",
    name_arabic: "الرعد",
    meaning_bn: "বজ্রপাত / মেঘের গর্জন",
    meaning_en: "The Thunder",
    total_verses: 43,
    type: "Medinan",
    aliases: ["রাদ", "বজ্রপাত", "মেঘের গর্জন", "rad", "ar-rad", "thunder"]
  },
  {
    id: 14,
    name_bn: "ইবরাহীম",
    name_en: "Ibrahim",
    name_arabic: "إبراهيم",
    meaning_bn: "নবী ইবরাহীম (আঃ)",
    meaning_en: "Abraham",
    total_verses: 52,
    type: "Meccan",
    aliases: ["ইব্রাহিম", "ইবরাহীম", "ইবরাহিম", "খলিলুল্লাহ", "নবী ইব্রাহিম", "ibrahim", "abraham"]
  },
  {
    id: 15,
    name_bn: "আল-হিজর",
    name_en: "Al-Hijr",
    name_arabic: "الحجر",
    meaning_bn: "পাথুরে পাহাড় / হিজর অঞ্চল",
    meaning_en: "The Rocky Tract",
    total_verses: 99,
    type: "Meccan",
    aliases: ["হিজর", "পাথুরে পাহাড়", "সামুদ জাতি", "hijr", "al-hijr"]
  },
  {
    id: 16,
    name_bn: "আন-নাহল",
    name_en: "An-Nahl",
    name_arabic: "النحل",
    meaning_bn: "মৌমাছি",
    meaning_en: "The Bee",
    total_verses: 128,
    type: "Meccan",
    aliases: ["নাহল", "মৌমাছি", "মধু", "nahl", "an-nahl", "bee"]
  },
  {
    id: 17,
    name_bn: "বনী ইসরাঈল",
    name_en: "Al-Isra",
    name_arabic: "الإسراء",
    meaning_bn: "রাত্রিকালীন ভ্রমণ / ইসরা",
    meaning_en: "The Night Journey",
    total_verses: 111,
    type: "Meccan",
    aliases: ["বনী ইসরাঈল", "বনি ইসরাইল", "ইসরা", "মিরাজ", "isra", "al-isra", "bani israel"]
  },
  {
    id: 18,
    name_bn: "আল-কাহফ",
    name_en: "Al-Kahf",
    name_arabic: "الكهف",
    meaning_bn: "গুহা",
    meaning_en: "The Cave",
    total_verses: 110,
    type: "Meccan",
    aliases: ["কাহফ", "কাহাফ", "গুহা", "আসহাবে কাহফ", "দাজ্জাল", "খিজির", "জুলকারনাইন", "kahf", "al-kahf", "cave"]
  },
  {
    id: 19,
    name_bn: "মারইয়াম",
    name_en: "Maryam",
    name_arabic: "مريم",
    meaning_bn: "মারইয়াম (আঃ)",
    meaning_en: "Mary",
    total_verses: 98,
    type: "Meccan",
    aliases: ["মারইয়াম", "মরিয়ম", "মারিয়াম", "ঈসা নবীর মাতা", "maryam", "mary"]
  },
  {
    id: 20,
    name_bn: "ত্বা-হা",
    name_en: "Taha",
    name_arabic: "طه",
    meaning_bn: "ত্বা-হা",
    meaning_en: "Ta-Ha",
    total_verses: 135,
    type: "Meccan",
    aliases: ["ত্বাহা", "তাহা", "তোহা", "ত্বা-হা", "মুসা ফেরাউন", "taha", "ta-ha"]
  },
  {
    id: 21,
    name_bn: "আল-আম্বিয়া",
    name_en: "Al-Anbiya",
    name_arabic: "الأنبياء",
    meaning_bn: "নবীগণ",
    meaning_en: "The Prophets",
    total_verses: 112,
    type: "Meccan",
    aliases: ["আম্বিয়া", "আম্বিয়া", "নবীগণ", "বিগ ব্যাং", "রতক", "anbiya", "al-anbiya", "prophets"]
  },
  {
    id: 22,
    name_bn: "আল-হাজ্জ",
    name_en: "Al-Hajj",
    name_arabic: "الحج",
    meaning_bn: "হজ্জ / তীর্থযাত্রা",
    meaning_en: "The Pilgrimage",
    total_verses: 78,
    type: "Medinan",
    aliases: ["হাজ্জ", "হজ", "হজ্জ", "কোরবানি", "কাবা", "hajj", "al-hajj"]
  },
  {
    id: 23,
    name_bn: "আল-মুমিনুন",
    name_en: "Al-Mu'minun",
    name_arabic: "المؤمنون",
    meaning_bn: "বিশ্বাসীগণ / মুমিনগণ",
    meaning_en: "The Believers",
    total_verses: 118,
    type: "Meccan",
    aliases: ["মুমিনুন", "মুমিনগণ", "ভ্রূণতত্ত্ব", "বিশ্বাসী", "muminun", "al-muminun", "believers"]
  },
  {
    id: 24,
    name_bn: "আন-নূর",
    name_en: "An-Nur",
    name_arabic: "النور",
    meaning_bn: "আলো / জ্যোতি",
    meaning_en: "The Light",
    total_verses: 64,
    type: "Medinan",
    aliases: ["নূর", "নুর", "আলো", "জ্যোতি", "পর্দা", "হিযাব", "ব্যভিচার", "nur", "an-nur", "light"]
  },
  {
    id: 25,
    name_bn: "আল-ফুরকান",
    name_en: "Al-Furqan",
    name_arabic: "الفرقان",
    meaning_bn: "সত্য ও মিথ্যার পার্থক্যকারী",
    meaning_en: "The Criterion",
    total_verses: 77,
    type: "Meccan",
    aliases: ["ফুরকান", "ফুরক্বান", "পার্থক্যকারী", "ইবাদুর রহমান", "furqan", "al-furqan"]
  },
  {
    id: 26,
    name_bn: "আশ-শু'আরা",
    name_en: "Ash-Shu'ara",
    name_arabic: "الشعراء",
    meaning_bn: "কবিগণ",
    meaning_en: "The Poets",
    total_verses: 227,
    type: "Meccan",
    aliases: ["শুয়ারা", "শু'আরা", "কবিগণ", "shuara", "ash-shuara"]
  },
  {
    id: 27,
    name_bn: "আন-নামল",
    name_en: "An-Naml",
    name_arabic: "النمل",
    meaning_bn: "পিপীলিকা / পিঁপড়া",
    meaning_en: "The Ant",
    total_verses: 93,
    type: "Meccan",
    aliases: ["নামল", "পিপীলিকা", "পিঁপড়া", "সুলাইমান হুদহুদ", "বিলকিস", "naml", "an-naml", "ant"]
  },
  {
    id: 28,
    name_bn: "আল-কাসাস",
    name_en: "Al-Qasas",
    name_arabic: "القصص",
    meaning_bn: "কাহিনীর বিবরণ",
    meaning_en: "The Stories",
    total_verses: 88,
    type: "Meccan",
    aliases: ["কাসাস", "ক্বাসাস", "কাহিনী", "কারুন", "মুসা", "qasas", "al-qasas"]
  },
  {
    id: 29,
    name_bn: "আল-আনকাবুত",
    name_en: "Al-'Ankabut",
    name_arabic: "العنكبوت",
    meaning_bn: "মাকড়সা",
    meaning_en: "The Spider",
    total_verses: 69,
    type: "Meccan",
    aliases: ["আনকাবুত", "মাকড়সা", "মাকড়সার জাল", "ankabut", "al-ankabut", "spider"]
  },
  {
    id: 30,
    name_bn: "আর-রূম",
    name_en: "Ar-Rum",
    name_arabic: "الروم",
    meaning_bn: "রোমবাসী",
    meaning_en: "The Romans",
    total_verses: 60,
    type: "Meccan",
    aliases: ["রূম", "রুম", "রোমান", "রোমবাসী", "rum", "ar-rum", "romans"]
  },
  {
    id: 31,
    name_bn: "লুকমান",
    name_en: "Luqman",
    name_arabic: "لقمان",
    meaning_bn: "বিজ্ঞ লুকমান",
    meaning_en: "Luqman",
    total_verses: 34,
    type: "Meccan",
    aliases: ["লুকমান", "লোকমান", "পিতা পুত্রের উপদেশ", "luqman"]
  },
  {
    id: 32,
    name_bn: "আস-সাজদাহ",
    name_en: "As-Sajdah",
    name_arabic: "السجدة",
    meaning_bn: "সিজদাহ / প্রণিপাত",
    meaning_en: "The Prostration",
    total_verses: 30,
    type: "Meccan",
    aliases: ["সাজদাহ", "সিজদাহ", "সেজদা", "sajdah", "as-sajdah"]
  },
  {
    id: 33,
    name_bn: "আল-আহযাব",
    name_en: "Al-Ahzab",
    name_arabic: "الأحزاب",
    meaning_bn: "সম্মিলিত বাহিনী / খন্দক",
    meaning_en: "The Combined Forces",
    total_verses: 73,
    type: "Medinan",
    aliases: ["আহযাব", "আহজাব", "খন্দকের যুদ্ধ", "খাতামুন্নাবিয়্যীন", "দুরুদ শরীফ", "ahzab", "al-ahzab"]
  },
  {
    id: 34,
    name_bn: "সাবা",
    name_en: "Saba",
    name_arabic: "سبأ",
    meaning_bn: "সাবা জাতি",
    meaning_en: "Sheba",
    total_verses: 54,
    type: "Meccan",
    aliases: ["সাবা", "শেবা", "দাউদ সুলাইমান", "saba", "sheba"]
  },
  {
    id: 35,
    name_bn: "ফাতির",
    name_en: "Fatir",
    name_arabic: "فاطر",
    meaning_bn: "আদি স্রষ্টা",
    meaning_en: "The Originator",
    total_verses: 45,
    type: "Meccan",
    aliases: ["ফাতির", "মালায়েকা", "স্রষ্টা", "ফেরেশতা", "fatir"]
  },
  {
    id: 36,
    name_bn: "ইয়াসীন",
    name_en: "Ya-Sin",
    name_arabic: "يس",
    meaning_bn: "ইয়াসীন (কুরআনের হৃৎপিণ্ড)",
    meaning_en: "Ya-Sin",
    total_verses: 83,
    type: "Meccan",
    aliases: ["ইয়াসিন", "ইয়াসীন", "ইয়াসিন", "ইয়াসীন", "কুরআনের দিল", "কুরআনের হৃদপিণ্ড", "yasin", "yaseen", "ya-sin"]
  },
  {
    id: 37,
    name_bn: "আস-সাফফাত",
    name_en: "As-Saffat",
    name_arabic: "الصافات",
    meaning_bn: "সারিবদ্ধভাবে দাঁড়ানো বাহিনী",
    meaning_en: "Those who set the Ranks",
    total_verses: 182,
    type: "Meccan",
    aliases: ["সাফফাত", "সারিবদ্ধ", "ইসমাঈল কোরবানি", "saffat", "as-saffat"]
  },
  {
    id: 38,
    name_bn: "সোয়াদ",
    name_en: "Sad",
    name_arabic: "ص",
    meaning_bn: "সোয়াদ",
    meaning_en: "The Letter Sad",
    total_verses: 88,
    type: "Meccan",
    aliases: ["সোয়াদ", "সাদ", "ছোয়াদ", "আইয়ুব নবী", "sad"]
  },
  {
    id: 39,
    name_bn: "আয-যুমার",
    name_en: "Az-Zumar",
    name_arabic: "الزمر",
    meaning_bn: "দলবদ্ধ মানবসমূহ",
    meaning_en: "The Troops",
    total_verses: 75,
    type: "Meccan",
    aliases: ["যুমার", "জুমার", "দলসমূহ", "আল্লাহর রহমত থেকে নিরাশ হয়ো না", "zumar", "az-zumar"]
  },
  {
    id: 40,
    name_bn: "গাফির",
    name_en: "Ghafir",
    name_arabic: "غافر",
    meaning_bn: "ক্ষমাশীল / আল-মুমিন",
    meaning_en: "The Forgiver",
    total_verses: 85,
    type: "Meccan",
    aliases: ["গাফির", "মুমিন", "আল-মুমিন", "ক্ষমাশীল", "ghafir", "al-mumin"]
  },
  {
    id: 41,
    name_bn: "ফুসসিলাত",
    name_en: "Fussilat",
    name_arabic: "فصلت",
    meaning_bn: "সুস্পষ্টভাবে বিবৃত",
    meaning_en: "Explained in Detail",
    total_verses: 54,
    type: "Meccan",
    aliases: ["ফুসসিলাত", "হা-মীম সিজদা", "fussilat", "ha mim sajdah"]
  },
  {
    id: 42,
    name_bn: "আশ-শুরা",
    name_en: "Ash-Shura",
    name_arabic: "الشورى",
    meaning_bn: "পরামর্শ / পরামর্শসভা",
    meaning_en: "The Consultation",
    total_verses: 53,
    type: "Meccan",
    aliases: ["শুরা", "পরামর্শ", "shura", "ash-shura"]
  },
  {
    id: 43,
    name_bn: "আয-যুখরুফ",
    name_en: "Az-Zukhruf",
    name_arabic: "الزخرف",
    meaning_bn: "স্বর্ণালঙ্কার / চাকচিক্য",
    meaning_en: "The Ornaments of Gold",
    total_verses: 89,
    type: "Meccan",
    aliases: ["যুখরুফ", "জুখরুফ", "স্বর্ণালঙ্কার", "zukhruf", "az-zukhruf"]
  },
  {
    id: 44,
    name_bn: "আদ-দুখান",
    name_en: "Ad-Dukhan",
    name_arabic: "الدخان",
    meaning_bn: "ধোঁয়া / কুয়াশা",
    meaning_en: "The Smoke",
    total_verses: 59,
    type: "Meccan",
    aliases: ["দুখান", "ধোঁয়া", "ধোঁয়া", "কিয়ামতের নিদর্শন", "dukhan", "ad-dukhan", "smoke"]
  },
  {
    id: 45,
    name_bn: "আল-জাসিয়াহ",
    name_en: "Al-Jathiyah",
    name_arabic: "الجاثية",
    meaning_bn: "নতজানু মানবজাতি",
    meaning_en: "The Kneeling",
    total_verses: 37,
    type: "Meccan",
    aliases: ["জাসিয়াহ", "জাসিয়া", "নতজানু", "jathiyah", "al-jathiyah"]
  },
  {
    id: 46,
    name_bn: "আল-আহকাফ",
    name_en: "Al-Ahqaf",
    name_arabic: "الأحقاف",
    meaning_bn: "বালিয়াড়ি / বালুর পাহাড়",
    meaning_en: "The Wind-Curved Sandhills",
    total_verses: 35,
    type: "Meccan",
    aliases: ["আহকাফ", "বালিয়াড়ি", "মাতাপিতার সেবা", "ahqaf", "al-ahqaf"]
  },
  {
    id: 47,
    name_bn: "মুহাম্মদ",
    name_en: "Muhammad",
    name_arabic: "محمد",
    meaning_bn: "নবী মুহাম্মদ (সাঃ)",
    meaning_en: "Muhammad",
    total_verses: 38,
    type: "Medinan",
    aliases: ["মুহাম্মদ", "মোহাম্মদ", "ক্বিতাল", "muhammad", "prophet"]
  },
  {
    id: 48,
    name_bn: "আল-ফাতহ",
    name_en: "Al-Fath",
    name_arabic: "الفتح",
    meaning_bn: "সুস্পষ্ট বিজয়",
    meaning_en: "The Victory",
    total_verses: 29,
    type: "Medinan",
    aliases: ["ফাতহ", "ফাতাহ", "বিজয়", "হুদায়বিয়ার সন্ধি", "fath", "al-fath", "victory"]
  },
  {
    id: 49,
    name_bn: "আল-হুজুরাত",
    name_en: "Al-Hujurat",
    name_arabic: "الحجرات",
    meaning_bn: "বাসগৃহের কক্ষসমূহ / শিষ্টাচার",
    meaning_en: "The Rooms",
    total_verses: 18,
    type: "Medinan",
    aliases: ["হুজুরাত", "কক্ষসমূহ", "গীবত", "শিষ্টাচার", "ভ্রাতৃত্ব", "hujurat", "al-hujurat"]
  },
  {
    id: 50,
    name_bn: "ক্বাফ",
    name_en: "Qaf",
    name_arabic: "ق",
    meaning_bn: "ক্বাফ",
    meaning_en: "The Letter Qaf",
    total_verses: 45,
    type: "Meccan",
    aliases: ["কাফ", "ক্বাফ", "মৃত্যুর যন্ত্রণা", "qaf"]
  },
  {
    id: 51,
    name_bn: "আয-যারিয়াত",
    name_en: "Adh-Dhariyat",
    name_arabic: "الذاريات",
    meaning_bn: "বিক্ষিপ্তকারী বাতাস",
    meaning_en: "The Winnowing Winds",
    total_verses: 60,
    type: "Meccan",
    aliases: ["যারিয়াত", "যারিয়াহ", "মহাবিশ্ব সম্প্রসারণ", "dhariyat", "adh-dhariyat"]
  },
  {
    id: 52,
    name_bn: "আত-তুর",
    name_en: "At-Tur",
    name_arabic: "الطور",
    meaning_bn: "তূর পর্বত",
    meaning_en: "The Mount",
    total_verses: 49,
    type: "Meccan",
    aliases: ["তুর", "তূর পাহাড়", "tur", "at-tur"]
  },
  {
    id: 53,
    name_bn: "আন-নাজম",
    name_en: "An-Najm",
    name_arabic: "النجم",
    meaning_bn: "নক্ষত্র / তারা",
    meaning_en: "The Star",
    total_verses: 62,
    type: "Meccan",
    aliases: ["নাজম", "নক্ষত্র", "তারা", "সিদরাতুল মুনতাহা", "মিরাজ", "najm", "an-najm", "star"]
  },
  {
    id: 54,
    name_bn: "আল-ক্বামার",
    name_en: "Al-Qamar",
    name_arabic: "القمر",
    meaning_bn: "চন্দ্র / চাঁদ",
    meaning_en: "The Moon",
    total_verses: 55,
    type: "Meccan",
    aliases: ["কামার", "ক্বামার", "চাঁদ দ্বিখণ্ডিত", "qamar", "al-qamar", "moon"]
  },
  {
    id: 55,
    name_bn: "আর-রাহমান",
    name_en: "Ar-Rahman",
    name_arabic: "الرحمن",
    meaning_bn: "পরম করুণাময় / কুরআনের বধূ",
    meaning_en: "The Beneficent",
    total_verses: 78,
    type: "Medinan",
    aliases: ["রহমান", "রাহমান", "আর রহমান", "উরূসুল কুরআন", "কোন অনুগ্রহ অস্বীকার করবে", "সমুদ্রের অন্তরাল", "rahman", "ar-rahman"]
  },
  {
    id: 56,
    name_bn: "আল-ওয়াকিয়াহ",
    name_en: "Al-Waqi'ah",
    name_arabic: "الواقعة",
    meaning_bn: "অবশ্যম্ভাবী ঘটনা / কিয়ামত",
    meaning_en: "The Inevitable",
    total_verses: 96,
    type: "Meccan",
    aliases: ["ওয়াকিয়া", "ওয়াকিয়াহ", "ওয়াকিয়া", "ওয়াকিয়াহ", "কেয়ামত", "waqiah", "al-waqiah"]
  },
  {
    id: 57,
    name_bn: "আল-হাদীদ",
    name_en: "Al-Hadid",
    name_arabic: "الحديد",
    meaning_bn: "লোহা",
    meaning_en: "The Iron",
    total_verses: 29,
    type: "Medinan",
    aliases: ["হাদিদ", "হাদীদ", "লোহা", "লোহার উৎপত্তি", "hadid", "al-hadid", "iron"]
  },
  {
    id: 58,
    name_bn: "আল-মুজাদালাহ",
    name_en: "Al-Mujadila",
    name_arabic: "المجادلة",
    meaning_bn: "বিতর্ককারিণী নারী",
    meaning_en: "The Pleading Woman",
    total_verses: 22,
    type: "Medinan",
    aliases: ["মুজাদালাহ", "মুজাদিলা", "জিহার", "mujadila", "al-mujadila"]
  },
  {
    id: 59,
    name_bn: "আল-হাশর",
    name_en: "Al-Hashr",
    name_arabic: "الحشر",
    meaning_bn: "সমাবেশ / নির্বাসন",
    meaning_en: "The Exile",
    total_verses: 24,
    type: "Medinan",
    aliases: ["হাশর", "সমাবেশ", "আল্লাহর সুন্দর নামসমূহ", "hashr", "al-hashr"]
  },
  {
    id: 60,
    name_bn: "আল-মুমতাহিনাহ",
    name_en: "Al-Mumtahanah",
    name_arabic: "الممتحنة",
    meaning_bn: "পরীক্ষিত নারী",
    meaning_en: "She that is to be examined",
    total_verses: 13,
    type: "Medinan",
    aliases: ["মুমতাহিনা", "মুমতাহিনাহ", "পরীক্ষিত নারী", "mumtahanah", "al-mumtahanah"]
  },
  {
    id: 61,
    name_bn: "আস-সাফ",
    name_en: "As-Saff",
    name_arabic: "الصف",
    meaning_bn: "সারিবদ্ধ সৈন্যদল",
    meaning_en: "The Ranks",
    total_verses: 14,
    type: "Medinan",
    aliases: ["সাফ", "সারিবদ্ধ", "ঈসা নবীর সুসংবাদ", "saff", "as-saff"]
  },
  {
    id: 62,
    name_bn: "আল-জুমুআহ",
    name_en: "Al-Jumu'ah",
    name_arabic: "الجمعة",
    meaning_bn: "শুক্রবার / জুমা",
    meaning_en: "The Congregation",
    total_verses: 11,
    type: "Medinan",
    aliases: ["জুমুআহ", "জুমা", "জুম্মা", "শুক্রবার", "jumuah", "al-jumuah", "friday"]
  },
  {
    id: 63,
    name_bn: "আল-মুনাফিকুন",
    name_en: "Al-Munafiqun",
    name_arabic: "المنافقون",
    meaning_bn: "কপট বিশ্বাসী / মুনাফিকগণ",
    meaning_en: "The Hypocrites",
    total_verses: 11,
    type: "Medinan",
    aliases: ["মুনাফিকুন", "মুনাফিক", "কপট", "munafiqun", "al-munafiqun", "hypocrites"]
  },
  {
    id: 64,
    name_bn: "আত-তাগাবুন",
    name_en: "At-Taghabun",
    name_arabic: "التغابن",
    meaning_bn: "ক্ষতি ও লাভের প্রকাশ / মোহভঙ্গ",
    meaning_en: "The Mutual Disillusion",
    total_verses: 18,
    type: "Medinan",
    aliases: ["তাগাবুন", "ক্ষতি লাভ", "taghabun", "at-taghabun"]
  },
  {
    id: 65,
    name_bn: "আত-ত্বালাক",
    name_en: "At-Talaq",
    name_arabic: "الطلاق",
    meaning_bn: "তালাক / বিবাহ বিচ্ছেদ",
    meaning_en: "The Divorce",
    total_verses: 12,
    type: "Medinan",
    aliases: ["তালাক", "ত্বালাক", "বিবাহ বিচ্ছেদ", "ইদ্দত", "talaq", "at-talaq", "divorce"]
  },
  {
    id: 66,
    name_bn: "আত-তাহরীম",
    name_en: "At-Tahrim",
    name_arabic: "التحريم",
    meaning_bn: "নিষিদ্ধকরণ",
    meaning_en: "The Prohibition",
    total_verses: 12,
    type: "Medinan",
    aliases: ["তাহরীম", "তাহরিম", "নিষিদ্ধকরণ", "আসিয়া মারিয়াম", "tahrim", "at-tahrim"]
  },
  {
    id: 67,
    name_bn: "আল-মুলক",
    name_en: "Al-Mulk",
    name_arabic: "الملك",
    meaning_bn: "সার্বভৌম কর্তৃত্ব / রাজত্ব",
    meaning_en: "The Sovereignty",
    total_verses: 30,
    type: "Meccan",
    aliases: ["মুলক", "মুলুক", "তাবারক", "কবরের আজাব থেকে মুক্তি", "রাজত্ব", "mulk", "al-mulk"]
  },
  {
    id: 68,
    name_bn: "আল-কলম",
    name_en: "Al-Qalam",
    name_arabic: "القلم",
    meaning_bn: "কলম / লেখনী",
    meaning_en: "The Pen",
    total_verses: 52,
    type: "Meccan",
    aliases: ["কলম", "নূন", "লেখনী", "qalam", "al-qalam", "pen"]
  },
  {
    id: 69,
    name_bn: "আল-হাক্কাহ",
    name_en: "Al-Haqqah",
    name_arabic: "الحاقة",
    meaning_bn: "নিশ্চিত সত্য ঘটনা / কিয়ামত",
    meaning_en: "The Reality",
    total_verses: 52,
    type: "Meccan",
    aliases: ["হাক্কাহ", "হাক্কা", "সত্য ঘটনা", "haqqah", "al-haqqah"]
  },
  {
    id: 70,
    name_bn: "আল-মাআরিজ",
    name_en: "Al-Ma'arij",
    name_arabic: "المعارج",
    meaning_bn: "উন্নয়নের সোপানসমূহ",
    meaning_en: "The Ascending Stairways",
    total_verses: 44,
    type: "Meccan",
    aliases: ["মাআরিজ", "সোপান", "ধৈর্য", "maarij", "al-maarij"]
  },
  {
    id: 71,
    name_bn: "নূহ",
    name_en: "Nuh",
    name_arabic: "نوح",
    meaning_bn: "নবী নূহ (আঃ)",
    meaning_en: "Noah",
    total_verses: 28,
    type: "Meccan",
    aliases: ["নূহ", "নুহ", "মহাপ্লাবন", "নূহ নবী", "nuh", "noah"]
  },
  {
    id: 72,
    name_bn: "আল-জ্বিন",
    name_en: "Al-Jinn",
    name_arabic: "الجن",
    meaning_bn: "জ্বিন জাতি",
    meaning_en: "The Jinn",
    total_verses: 28,
    type: "Meccan",
    aliases: ["জ্বিন", "জিন", "jinn", "al-jinn"]
  },
  {
    id: 73,
    name_bn: "আল-মুযযাম্মিল",
    name_en: "Al-Muzzammil",
    name_arabic: "المزمل",
    meaning_bn: "বস্ত্রাবৃত / চাদরাবৃত",
    meaning_en: "The Enshrouded One",
    total_verses: 20,
    type: "Meccan",
    aliases: ["মুযযাম্মিল", "মুজাম্মিল", "তাহাজ্জুদ নামাজ", "চাদরাবৃত", "muzzammil", "al-muzzammil"]
  },
  {
    id: 74,
    name_bn: "আল-মুদ্দাসসির",
    name_en: "Al-Muddaththir",
    name_arabic: "المدثر",
    meaning_bn: "পোশাক পরিহিত / কম্বলাবৃত",
    meaning_en: "The Cloaked One",
    total_verses: 56,
    type: "Meccan",
    aliases: ["মুদ্দাসসির", "কম্বলাবৃত", "muddaththir", "al-muddaththir"]
  },
  {
    id: 75,
    name_bn: "আল-কিয়ামাহ",
    name_en: "Al-Qiyamah",
    name_arabic: "القيامة",
    meaning_bn: "পুনরুত্থান / কিয়ামত",
    meaning_en: "The Resurrection",
    total_verses: 40,
    type: "Meccan",
    aliases: ["কিয়ামাহ", "কিয়ামত", "কেয়ামত", "আঙুলের ছাপ", "qiyamah", "al-qiyamah", "resurrection"]
  },
  {
    id: 76,
    name_bn: "আল-ইনসান",
    name_en: "Al-Insan",
    name_arabic: "الإنسان",
    meaning_bn: "মানবজাতি / আদ-দাহর",
    meaning_en: "The Human",
    total_verses: 31,
    type: "Medinan",
    aliases: ["ইনসান", "দাহর", "মানবজাতি", "মানুষ", "জান্নাতের নেয়ামত", "insan", "al-insan", "human"]
  },
  {
    id: 77,
    name_bn: "আল-মুরসালাত",
    name_en: "Al-Mursalat",
    name_arabic: "المرسلات",
    meaning_bn: "প্রেরিত বাতাসসমূহ",
    meaning_en: "The Emissaries",
    total_verses: 50,
    type: "Meccan",
    aliases: ["মুরসালাত", "বাতাস", "mursalat", "al-mursalat"]
  },
  {
    id: 78,
    name_bn: "আন-নাবা",
    name_en: "An-Naba",
    name_arabic: "النبأ",
    meaning_bn: "মহা সংবাদ / আম্মা",
    meaning_en: "The Tidings",
    total_verses: 40,
    type: "Meccan",
    aliases: ["নাবা", "আম্মা পারা", "মহা সংবাদ", "পাহাড় পেরেক", "naba", "an-naba"]
  },
  {
    id: 79,
    name_bn: "আন-নাযিয়াত",
    name_en: "An-Nazi'at",
    name_arabic: "النازعات",
    meaning_bn: "উৎপাটনকারী ফেরেশতা",
    meaning_en: "Those who drag forth",
    total_verses: 46,
    type: "Meccan",
    aliases: ["নাযিয়াত", "নাজিয়াত", "ফেরেশতা", "naziat", "an-naziat"]
  },
  {
    id: 80,
    name_bn: "আবাসা",
    name_en: "'Abasa",
    name_arabic: "عبس",
    meaning_bn: "ভ্রূকুটি করলেন",
    meaning_en: "He Frowned",
    total_verses: 42,
    type: "Meccan",
    aliases: ["আবাসা", "অন্ধ সাহাবী", "আব্দুল্লাহ ইবনে উম্মে মাকতুম", "abasa"]
  },
  {
    id: 81,
    name_bn: "আত-তাকবীর",
    name_en: "At-Takwir",
    name_arabic: "التكوير",
    meaning_bn: "অন্ধকারাচ্ছন্ন হওয়া / সূর্য গুটানো",
    meaning_en: "The Overthrowing",
    total_verses: 29,
    type: "Meccan",
    aliases: ["তাকবীর", "তাকউইর", "সূর্য আলোহীন", "জীবন্ত প্রোথিত কন্যা", "takwir", "at-takwir"]
  },
  {
    id: 82,
    name_bn: "আল-ইনফিতার",
    name_en: "Al-Infitar",
    name_arabic: "الانفطار",
    meaning_bn: "বিদীর্ণ হওয়া / আকাশ ফাটা",
    meaning_en: "The Cleaving",
    total_verses: 19,
    type: "Meccan",
    aliases: ["ইনফিতার", "আকাশ বিদীর্ণ", "কেরামান কাতিবীন", "infitar", "al-infitar"]
  },
  {
    id: 83,
    name_bn: "আল-মুতাফফিফীন",
    name_en: "Al-Mutaffifin",
    name_arabic: "المطففين",
    meaning_bn: "মাপে কম প্রদানকারী",
    meaning_en: "The Defrauding",
    total_verses: 36,
    type: "Meccan",
    aliases: ["মুতাফফিফীন", "মুতাফফিফিন", "মাপে কম", "ব্যবসা ওজনে কম", "mutaffifin", "al-mutaffifin"]
  },
  {
    id: 84,
    name_bn: "আল-ইনশিক্বাক্ব",
    name_en: "Al-Inshiqaq",
    name_arabic: "الانشقاق",
    meaning_bn: "খণ্ড-বিখণ্ড হওয়া",
    meaning_en: "The Sundering",
    total_verses: 25,
    type: "Meccan",
    aliases: ["ইনশিকাক", "ইনশিক্বাক্ব", "আমলনামা", "inshiqaq", "al-inshiqaq"]
  },
  {
    id: 85,
    name_bn: "আল-বুরূজ",
    name_en: "Al-Buruj",
    name_arabic: "البروج",
    meaning_bn: "নক্ষত্রপুঞ্জ / দুর্গসমূহ",
    meaning_en: "The Mansions of the Stars",
    total_verses: 22,
    type: "Meccan",
    aliases: ["বুরূজ", "বুরুজ", "নক্ষত্রপুঞ্জ", "আসহাবে উখদুদ", "লাওহে মাহফুজ", "buruj", "al-buruj"]
  },
  {
    id: 86,
    name_bn: "আত-ত্বারিক্ব",
    name_en: "At-Tariq",
    name_arabic: "الطارق",
    meaning_bn: "রাতের পথিক / উজ্জ্বল নক্ষত্র",
    meaning_en: "The Nightcommer",
    total_verses: 17,
    type: "Meccan",
    aliases: ["ত্বারিক", "তারিক", "উজ্জ্বল নক্ষত্র", "পালসার", "tariq", "at-tariq"]
  },
  {
    id: 87,
    name_bn: "আল-আ'লা",
    name_en: "Al-A'la",
    name_arabic: "الأعلى",
    meaning_bn: "সর্বোচ্চ মহান",
    meaning_en: "The Most High",
    total_verses: 19,
    type: "Meccan",
    aliases: ["আলা", "আ'লা", "সাব্বিহিসমা", "ala", "al-ala"]
  },
  {
    id: 88,
    name_bn: "আল-গাশিয়াহ",
    name_en: "Al-Ghashiyah",
    name_arabic: "الغاشية",
    meaning_bn: "আচ্ছন্নকারী মহাপ্রলয়",
    meaning_en: "The Overwhelming",
    total_verses: 26,
    type: "Meccan",
    aliases: ["গাশিয়াহ", "গাশিয়া", "মহাপ্রলয়", "উট সৃষ্টি", "ghashiyah", "al-ghashiyah"]
  },
  {
    id: 89,
    name_bn: "আল-ফাজর",
    name_en: "Al-Fajr",
    name_arabic: "الفجر",
    meaning_bn: "ঊষা / ভোরবেলা",
    meaning_en: "The Dawn",
    total_verses: 30,
    type: "Meccan",
    aliases: ["ফাজর", "ভোরবেলা", "দশ রাত", "ইরাম নগরী", "প্রশান্ত আত্মা", "fajr", "al-fajr"]
  },
  {
    id: 90,
    name_bn: "আল-বালাদ",
    name_en: "Al-Balad",
    name_arabic: "البلد",
    meaning_bn: "পবিত্র নগরী / মক্কা",
    meaning_en: "The City",
    total_verses: 20,
    type: "Meccan",
    aliases: ["বালাদ", "নগরী", "মক্কা", "balad", "al-balad"]
  },
  {
    id: 91,
    name_bn: "আশ-শামস",
    name_en: "Ash-Shams",
    name_arabic: "الشمس",
    meaning_bn: "সূর্য",
    meaning_en: "The Sun",
    total_verses: 15,
    type: "Meccan",
    aliases: ["শামস", "সূর্য", "আত্মার শুদ্ধি", "shams", "ash-shams", "sun"]
  },
  {
    id: 92,
    name_bn: "আল-লাইল",
    name_en: "Al-Layl",
    name_arabic: "الليل",
    meaning_bn: "রজনী / রাত্রি",
    meaning_en: "The Night",
    total_verses: 21,
    type: "Meccan",
    aliases: ["লাইল", "রাত্রি", "দানশীলতা", "layl", "al-layl", "night"]
  },
  {
    id: 93,
    name_bn: "আদ-দুহা",
    name_en: "Ad-Duha",
    name_arabic: "الضحى",
    meaning_bn: "পূর্বাহ্ণ / সকালের রোদ",
    meaning_en: "The Morning Hours",
    total_verses: 11,
    type: "Meccan",
    aliases: ["দুহা", "দোহা", "সকালের আলো", "এতিম", "duha", "ad-duha"]
  },
  {
    id: 94,
    name_bn: "আশ-শারহ",
    name_en: "Ash-Sharh",
    name_arabic: "الشرح",
    meaning_bn: "বক্ষ প্রশস্তকরণ / ইনশিরাহ",
    meaning_en: "The Relief",
    total_verses: 8,
    type: "Meccan",
    aliases: ["ইনশিরাহ", "শারহ", "আলম নাশরাহ", "কষ্টের পর স্বস্তি", "sharh", "ash-sharh", "inshirah"]
  },
  {
    id: 95,
    name_bn: "আত-তীন",
    name_en: "At-Tin",
    name_arabic: "التين",
    meaning_bn: "ডুমুর / আঞ্জির ফল",
    meaning_en: "The Fig",
    total_verses: 8,
    type: "Meccan",
    aliases: ["তীন", "তিন", "ডুমুর", "যয়তুন", "মানুষের সুন্দরতম অবয়ব", "tin", "at-tin", "fig"]
  },
  {
    id: 96,
    name_bn: "আল-আলাক",
    name_en: "Al-'Alaq",
    name_arabic: "العلق",
    meaning_bn: "রক্তপিণ্ড / ইকরা",
    meaning_en: "The Clot",
    total_verses: 19,
    type: "Meccan",
    aliases: ["আলাক", "ইকরা", "প্রথম ওহী", "রক্তপিণ্ড", "কলমের জ্ঞান", "alaq", "al-alaq", "iqra"]
  },
  {
    id: 97,
    name_bn: "আল-ক্বদর",
    name_en: "Al-Qadr",
    name_arabic: "القدر",
    meaning_bn: "মহিমান্বিত রজনী / শবে কদর",
    meaning_en: "The Power",
    total_verses: 5,
    type: "Meccan",
    aliases: ["কদর", "ক্বদর", "শবে কদর", "লাইলাতুল কদর", "হাজার মাসের চেয়ে উত্তম", "qadr", "al-qadr", "shab-e-qadr"]
  },
  {
    id: 98,
    name_bn: "আল-বাইয়িনাহ",
    name_en: "Al-Bayyinah",
    name_arabic: "البينة",
    meaning_bn: "সুস্পষ্ট প্রমাণ",
    meaning_en: "The Clear Proof",
    total_verses: 8,
    type: "Medinan",
    aliases: ["বাইয়িনাহ", "বাইয়িনা", "প্রমাণ", "bayyinah", "al-bayyinah"]
  },
  {
    id: 99,
    name_bn: "আল-যিলযাল",
    name_en: "Az-Zalzalah",
    name_arabic: "الزلزلة",
    meaning_bn: "মহাকম্পন / ভূমিকম্প",
    meaning_en: "The Earthquake",
    total_verses: 8,
    type: "Medinan",
    aliases: ["যিলযাল", "জিলজাল", "জালযালাহ", "ভূমিকম্প", "অণু পরিমাণ ভালো কাজ", "zalzalah", "az-zalzalah", "earthquake"]
  },
  {
    id: 100,
    name_bn: "আল-আদিয়াত",
    name_en: "Al-'Adiyat",
    name_arabic: "العاديات",
    meaning_bn: "ঊর্ধ্বশ্বাসে ধাবমান অশ্বসমূহ",
    meaning_en: "The Courser",
    total_verses: 11,
    type: "Meccan",
    aliases: ["আদিয়াত", "ঘোড়া", "অশ্ব", "adiyat", "al-adiyat"]
  },
  {
    id: 101,
    name_bn: "আল-ক্বারিআহ",
    name_en: "Al-Qari'ah",
    name_arabic: "القارعة",
    meaning_bn: "ভীতিপ্রদ মহাবিপদ / কিয়ামত",
    meaning_en: "The Calamity",
    total_verses: 11,
    type: "Meccan",
    aliases: ["কারিয়া", "ক্বারিআহ", "মহাবিপদ", "হাওয়িয়া", "qariah", "al-qariah"]
  },
  {
    id: 102,
    name_bn: "আত-তাকাসুর",
    name_en: "At-Takathur",
    name_arabic: "التكاثر",
    meaning_bn: "প্রাচুর্যের মোহ ও প্রতিযোগিতা",
    meaning_en: "The Rivalry in world increase",
    total_verses: 8,
    type: "Meccan",
    aliases: ["তাকাসুর", "প্রাচুর্যের মোহ", "কবর দর্শন", "takathur", "at-takathur"]
  },
  {
    id: 103,
    name_bn: "আল-আসর",
    name_en: "Al-'Asr",
    name_arabic: "العصر",
    meaning_bn: "মহাকাল / সময়",
    meaning_en: "The Declining Day",
    total_verses: 3,
    type: "Meccan",
    aliases: ["আসর", "সময়", "মহাকাল", "ক্ষতির মধ্যে মানুষ", "সবর", "asr", "al-asr", "time"]
  },
  {
    id: 104,
    name_bn: "আল-হুমাযাহ",
    name_en: "Al-Humazah",
    name_arabic: "الهمزة",
    meaning_bn: "পরনিন্দুক / পশ্চাতে অপবাদকারী",
    meaning_en: "The Traducer",
    total_verses: 9,
    type: "Meccan",
    aliases: ["হুমাযাহ", "হুমাজা", "পরনিন্দুক", "হুতামাহ", "humazah", "al-humazah"]
  },
  {
    id: 105,
    name_bn: "আল-ফীল",
    name_en: "Al-Fil",
    name_arabic: "الفيل",
    meaning_bn: "হাতি / হস্তীবাহিনী",
    meaning_en: "The Elephant",
    total_verses: 5,
    type: "Meccan",
    aliases: ["ফীল", "ফিল", "হাতি", "আবাবিল পাখি", "আবরাহা", "fil", "al-fil", "elephant"]
  },
  {
    id: 106,
    name_bn: "কুরাইশ",
    name_en: "Quraysh",
    name_arabic: "قريش",
    meaning_bn: "কুরাইশ বংশ",
    meaning_en: "Quraysh",
    total_verses: 4,
    type: "Meccan",
    aliases: ["কুরাইশ", "শীত ও গ্রীষ্মের সফর", "quraysh"]
  },
  {
    id: 107,
    name_bn: "আল-মাউন",
    name_en: "Al-Ma'un",
    name_arabic: "الماعون",
    meaning_bn: "গৃহস্থালির নিত্যপ্রয়োজনীয় বস্তু",
    meaning_en: "The Small Kindnesses",
    total_verses: 7,
    type: "Meccan",
    aliases: ["মাউন", "এতিমের হক", "লোক দেখানো নামাজ", "maun", "al-maun"]
  },
  {
    id: 108,
    name_bn: "আল-কাউসার",
    name_en: "Al-Kawthar",
    name_arabic: "الكوثر",
    meaning_bn: "প্রচুর কল্যাণ / জান্নাতের কাউসার ঝর্ণা",
    meaning_en: "The Abundance",
    total_verses: 3,
    type: "Meccan",
    aliases: ["কাউসার", "কাওসার", "প্রচুর কল্যাণ", "হওযে কাউসার", "কোরবানি", "kawthar", "al-kawthar"]
  },
  {
    id: 109,
    name_bn: "আল-কাফিরুন",
    name_en: "Al-Kafirun",
    name_arabic: "الكافرون",
    meaning_bn: "অবিশ্বাসীগণ / কাফিরগণ",
    meaning_en: "The Disbelievers",
    total_verses: 6,
    type: "Meccan",
    aliases: ["কাফিরুন", "কাফেরুন", "লা আকবুদু মা তাবুফুন", "তোমাদের দীন তোমাদের", "kafirun", "al-kafirun"]
  },
  {
    id: 110,
    name_bn: "আন-নাসর",
    name_en: "An-Nasr",
    name_arabic: "النصر",
    meaning_bn: "আল্লাহর সাহায্য ও বিজয়",
    meaning_en: "The Divine Support",
    total_verses: 3,
    type: "Medinan",
    aliases: ["নাসর", "ইযা যাআ নাসরুল্লাহ", "আল্লাহর সাহায্য", "মক্কা বিজয়", "nasr", "an-nasr", "help"]
  },
  {
    id: 111,
    name_bn: "আল-মাসাদ",
    name_en: "Al-Masad",
    name_arabic: "المسد",
    meaning_bn: "খেজুরের পাকানো রশি / লাহাব",
    meaning_en: "The Palm Fiber",
    total_verses: 5,
    type: "Meccan",
    aliases: ["লাহাব", "মাসাদ", "তাব্বাত ইয়াদা", "আবু লাহাব", "masad", "al-masad", "lahab"]
  },
  {
    id: 112,
    name_bn: "আল-ইখলাস",
    name_en: "Al-Ikhlas",
    name_arabic: "الإخلاص",
    meaning_bn: "একনিষ্ঠতা / একত্ববাদ",
    meaning_en: "The Sincerity",
    total_verses: 4,
    type: "Meccan",
    aliases: ["ইখলাস", "এখলাস", "কুলহু আল্লাহ", "কুল হু আল্লাহ", "তাওহীদ", "একত্ববাদ", "আল্লাহু সামাদ", "ikhlas", "al-ikhlas", "tawheed"]
  },
  {
    id: 113,
    name_bn: "আল-ফালাক",
    name_en: "Al-Falaq",
    name_arabic: "الفلق",
    meaning_bn: "ঊষাকাল / প্রভাত",
    meaning_en: "The Daybreak",
    total_verses: 5,
    type: "Meccan",
    aliases: ["ফালাক", "ফালাক্ব", "প্রভাত", "কুল আউযু বিরাব্বিল ফালাক", "জাদু টোনা থেকে আশ্রয়", "falaq", "al-falaq"]
  },
  {
    id: 114,
    name_bn: "আন-নাস",
    name_en: "An-Nas",
    name_arabic: "الناس",
    meaning_bn: "মানবজাতি",
    meaning_en: "Mankind",
    total_verses: 6,
    type: "Meccan",
    aliases: ["নাস", "কুল আউযু বিরাব্বিন নাস", "ওয়াসওয়াসা", "শয়তান থেকে আশ্রয়", "nas", "an-nas", "mankind"]
  }
];

// Helper: Convert Bengali digits to English digits
export function bnToEnDigits(str: string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[০-৯]/g, (w) => String(bnDigits.indexOf(w)));
}

// Clean & Normalize User Input Query
// Clean & Normalize User Input Query
// --- Robust Phonetic & Fuzzy Surah Name Search Engine ---
export function cleanSurahPrefixBn(s: string): string {
  return s.toLowerCase()
    .replace(/^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)\s+/gi, "")
    .replace(/^(?:আল-|আল\s+|আল|আন-|আন\s+|আন|আত-|আত\s+|আত|আশ-|আশ\s+|আশ|আস-|আস\s+|আস|আদ-|আদ\s+|আদ|আয-|আয\s+|আয|আর-|আর\s+|আর|আলে-|আলে\s+|আলি-|আলি\s+|আল্)/gi, "")
    .trim();
}

export function cleanSurahPrefixEn(s: string): string {
  return s.toLowerCase()
    .replace(/^(?:surah|surat|sura|chapter)\s+/gi, "")
    .replace(/^(?:al-|al\s+|al|an-|an\s+|an|at-|at\s+|at|ash-|ash\s+|ash|as-|as\s+|as|ad-|ad\s+|ad|az-|az\s+|az|ar-|ar\s+|ar|adh-|adh\s+|adh|ali-|ali\s+|aal-|aal\s+)/gi, "")
    .replace(/[-—–_\s'’‘`"\.\,:;!#\/\\|()\[\]]/g, "")
    .trim();
}

export function phoneticNormalizeBn(s: string): string {
  if (!s) return "";
  const r = s.toLowerCase()
    .replace(/^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura|অধ্যায়|অধ্যায়)\s+/gi, "")
    .replace(/^(?:আল-|আল\s+|আল|আন-|আন\s+|আন|আত-|আত\s+|আত|আশ-|আশ\s+|আশ|আস-|আস\s+|আস|আদ-|আদ\s+|আদ|আয-|আয\s+|আয|আর-|আর\s+|আর|আলে-|আলে\s+|আলি-|আলি\s+|আল্)/gi, "")
    .replace(/[-—–_\s'’‘`"\.\,:;!#\/\\|()\[\]]/g, "")
    .replace(/ক্ষ/g, "খ")
    .replace(/ঈ/g, "ই").replace(/ী/g, "ি")
    .replace(/ঊ/g, "উ").replace(/ূ/g, "ু")
    .replace(/ঐ/g, "ই").replace(/ৈ/g, "ি")
    .replace(/ৌ/g, "উ")
    .replace(/এ/g, "ই").replace(/ে/g, "ি")
    .replace(/ও/g, "উ").replace(/ো/g, "ু")
    .replace(/[শষছ]/g, "স")
    .replace(/[ঝয]/g, "জ")
    .replace(/(?:ক্ব|খ)/g, "ক")
    .replace(/(?:ত্ব|ট|থ)/g, "ত")
    .replace(/[ধডঢ]/g, "দ")
    .replace(/[ণংঙ]/g, "ন")
    .replace(/ভ/g, "ব")
    .replace(/[য়য়]/g, "ই")
    .replace(/[্ঁ]/g, "")
    .replace(/াহ্?$|হ্?$|ঃ$/g, "");
  return r.replace(/(.)\1+/g, "$1");
}

export function phoneticNormalizeEn(s: string): string {
  if (!s) return "";
  const r = s.toLowerCase()
    .replace(/^(?:surah|surat|sura|chapter)\s+/gi, "")
    .replace(/^(?:al-|al\s+|al|an-|an\s+|an|at-|at\s+|at|ash-|ash\s+|ash|as-|as\s+|as|ad-|ad\s+|ad|az-|az\s+|az|ar-|ar\s+|ar|adh-|adh\s+|adh|ali-|ali\s+|aal-|aal\s+)/gi, "")
    .replace(/[-—–_\s'’‘`"\.\,:;!#\/\\|()\[\]]/g, "")
    .replace(/ph/g, "f").replace(/v/g, "f")
    .replace(/(?:ck|kh|q)/g, "k")
    .replace(/(?:sh|th|c)/g, "s")
    .replace(/(?:zh|dh|j)/g, "z")
    .replace(/gh/g, "g")
    .replace(/w/g, "u")
    .replace(/(?:ee|ea|y|e)/g, "i")
    .replace(/(?:oo|ou|o)/g, "u")
    .replace(/aa/g, "a")
    .replace(/h$/g, "");
  return r.replace(/(.)\1+/g, "$1");
}

export function consonantSkeletonBn(s: string): string {
  if (!s) return "";
  return s.toLowerCase()
    .replace(/^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)\s+/gi, "")
    .replace(/^(?:আল-|আল\s+|আল|আন-|আন\s+|আন|আত-|আত\s+|আত|আশ-|আশ\s+|আশ|আস-|আস\s+|আস|আদ-|আদ\s+|আদ|আয-|আয\s+|আয|আর-|আর\s+|আর|আলে-|আলে\s+|আলে|আলি-|আলি\s+|আল্)/gi, "")
    .replace(/[-—–_\s'’‘`"\.\,:;!#\/\\|()\[\]]/g, "")
    .replace(/ক্ষ/g, "খ")
    .replace(/[ািীুূৃেৈোৌ্ঁ]/g, "")
    .replace(/[শষছ]/g, "স")
    .replace(/[ঝয]/g, "জ")
    .replace(/(?:ক্ব|খ)/g, "ক")
    .replace(/(?:ত্ব|ট|থ)/g, "ত")
    .replace(/[ধডঢ]/g, "দ")
    .replace(/[ণংঙ]/g, "ন")
    .replace(/ভ/g, "ব")
    .replace(/[য়য়]/g, "ই")
    .replace(/হ্?$|ঃ$/g, "")
    .replace(/(.)\1+/g, "$1");
}

export function scoreSurahAgainstQuery(surah: SurahMeta, query: string): number {
  const qRaw = query.trim().toLowerCase();
  if (!qRaw) return 0;
  const qCleanBn = cleanSurahPrefixBn(qRaw);
  const qCleanEn = cleanSurahPrefixEn(qRaw);
  const qPhonBn = phoneticNormalizeBn(qRaw);
  const qPhonEn = phoneticNormalizeEn(qRaw);
  const qSkelBn = consonantSkeletonBn(qRaw);

  const nameBnClean = cleanSurahPrefixBn(surah.name_bn);
  const nameEnClean = cleanSurahPrefixEn(surah.name_en);
  const nameBnPhon = phoneticNormalizeBn(surah.name_bn);
  const nameEnPhon = phoneticNormalizeEn(surah.name_en);
  const nameBnSkel = consonantSkeletonBn(surah.name_bn);

  const candidatesBn = [surah.name_bn.toLowerCase(), nameBnClean, ...surah.aliases.map(a => a.toLowerCase())];
  const candidatesEn = [surah.name_en.toLowerCase(), nameEnClean, ...surah.aliases.map(a => a.toLowerCase())];
  const candidatesPhonBn = [nameBnPhon, ...surah.aliases.map(a => phoneticNormalizeBn(a)).filter(Boolean)];
  const candidatesPhonEn = [nameEnPhon, ...surah.aliases.map(a => phoneticNormalizeEn(a)).filter(Boolean)];
  const candidatesSkelBn = [nameBnSkel, ...surah.aliases.map(a => consonantSkeletonBn(a)).filter(Boolean)];

  // Tier 1: Exact Raw Match
  if (candidatesBn.includes(qRaw) || candidatesEn.includes(qRaw)) {
    return 100;
  }
  // Tier 2: Exact Prefix-Cleaned Match
  if (qCleanBn && (candidatesBn.includes(qCleanBn) || nameBnClean === qCleanBn)) {
    return 98;
  }
  if (qCleanEn && (candidatesEn.includes(qCleanEn) || nameEnClean === qCleanEn)) {
    return 98;
  }
  // Tier 3: Exact Phonetic Match
  if (qPhonBn && candidatesPhonBn.includes(qPhonBn)) {
    return 94;
  }
  if (qPhonEn && candidatesPhonEn.includes(qPhonEn)) {
    return 94;
  }

  // Calculate minimum Levenshtein distance on clean strings
  let minRawDist = 999;
  if (qCleanBn.length >= 4) {
    for (const c of candidatesBn) {
      const cleanC = cleanSurahPrefixBn(c);
      if (cleanC && cleanC[0] === qCleanBn[0]) {
        const d = levenshteinDistance(qCleanBn, cleanC);
        if (d < minRawDist) minRawDist = d;
      }
    }
  }
  if (qCleanEn.length >= 4) {
    for (const c of candidatesEn) {
      const cleanC = cleanSurahPrefixEn(c);
      if (cleanC && cleanC[0] === qCleanEn[0]) {
        const d = levenshteinDistance(qCleanEn, cleanC);
        if (d < minRawDist) minRawDist = d;
      }
    }
  }

  // Tier 3b: Consonant Skeleton Match + edit distance
  // (Matched against canonical surah name and primary name aliases, not semantic topical keywords)
  const primarySkelBn = [nameBnSkel, ...surah.aliases.slice(0, 2).map(a => consonantSkeletonBn(a)).filter(Boolean)];
  if (qSkelBn && qSkelBn.length >= 2 && primarySkelBn.includes(qSkelBn)) {
    return 93 - minRawDist * 4;
  }

  // Tier 4: Exact Substring match on Names / Aliases (min 3 chars)
  if (
    qCleanBn.length >= 3 &&
    candidatesBn.some(c => c.length >= 3 && (c === qCleanBn || c.startsWith(qCleanBn) || qCleanBn.startsWith(c)))
  ) {
    return 80;
  }
  if (
    qCleanEn.length >= 3 &&
    candidatesEn.some(c => c.length >= 3 && (c === qCleanEn || c.startsWith(qCleanEn) || qCleanEn.startsWith(c)))
  ) {
    return 80;
  }

  // Tier 5: Fuzzy / Typo Distance Match (Levenshtein)
  // For queries of length <= 3, require exact match (no fuzzy distance to prevent false positive collisions).
  // For length >= 4, candidate must share the first consonant/character.
  let minPhonDist = 999;
  if (qPhonBn.length >= 4) {
    for (const c of candidatesPhonBn) {
      if (c && c[0] === qPhonBn[0]) {
        const d = levenshteinDistance(qPhonBn, c);
        if (d < minPhonDist) minPhonDist = d;
      }
    }
  }
  if (qPhonEn.length >= 4) {
    for (const c of candidatesPhonEn) {
      if (c && c[0] === qPhonEn[0]) {
        const d = levenshteinDistance(qPhonEn, c);
        if (d < minPhonDist) minPhonDist = d;
      }
    }
  }

  const bestDist = Math.min(minRawDist, minPhonDist);
  const qLen = Math.max(qCleanBn.length, qCleanEn.length);
  const maxAllowedDist = qLen <= 3 ? 0 : qLen <= 5 ? 1 : 2;
  if (maxAllowedDist > 0 && bestDist <= maxAllowedDist) {
    return 75 - bestDist * 10;
  }

  // Tier 6: Meaning match (ONLY for queries of length >= 4, and as distinct words!)
  if (qRaw.length >= 4) {
    const meaningBnWords = surah.meaning_bn.toLowerCase().split(/[\s,/\-–—]+/).map(w => w.trim());
    const meaningEnWords = surah.meaning_en.toLowerCase().split(/[\s,/\-–—]+/).map(w => w.trim());
    if (
      meaningBnWords.some(w => w === qRaw || (w.length >= 4 && w.startsWith(qRaw))) ||
      meaningEnWords.some(w => w === qRaw || (w.length >= 4 && w.startsWith(qRaw)))
    ) {
      return 45;
    }
  }

  return 0;
}

export function findBestSurahMatch(query: string, minScore = 50): SearchMatchedSurah | null {
  const q = query.trim();
  if (!q) return null;
  let best: SearchMatchedSurah | null = null;
  let maxScore = 0;

  for (const s of ALL_SURAHS_DATABASE) {
    const score = scoreSurahAgainstQuery(s, q);
    if (score > maxScore) {
      maxScore = score;
      best = { ...s, score };
    }
  }

  return maxScore >= minScore ? best : null;
}

export function normalizeQuranQuery(rawQuery: string): {
  clean: string;
  strippedPrefix: string;
  isAyahQuery: boolean;
  targetSurah?: number;
  targetAyah?: number;
  isPartialAyahQuery?: boolean;
} {
  let q = bnToEnDigits(rawQuery.trim().toLowerCase());
  if (!q) {
    return { clean: "", strippedPrefix: "", isAyahQuery: false };
  }

  // 1. Surah number + Ayah number (e.g. "সুরা ২ আয়াত ২৫৫", "সুরা ২ এর ২৫৫ নং আয়াত", "২ আয়াত ২৫৫", "সুরা ১৮ আয়াত ১০", "18 ayah 10")
  const numThenAyahRegex1 = /^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)?\s*(\d{1,3})\s*(?:এর)?\s*(?:নং)?\s*(?:আয়াত|আয়াত|verse|ayah)\s*(?:নং)?\s*(\d{1,3})$/i;
  const matchNumAyah1 = q.match(numThenAyahRegex1);
  if (matchNumAyah1) {
    const s = Number(matchNumAyah1[1]);
    const a = Number(matchNumAyah1[2]);
    if (s >= 1 && s <= 114) {
      return {
        clean: `${s}:${a}`,
        strippedPrefix: `${s}:${a}`,
        isAyahQuery: true,
        targetSurah: s,
        targetAyah: a,
      };
    }
  }

  // 1b. Surah number + Ayah number inverted suffix (e.g. "সুরা ২ এর ২৫৫ নং আয়াত", "২ এর ২৫৫ নং আয়াত")
  const numThenAyahRegex2 = /^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)?\s*(\d{1,3})\s*(?:এর)?\s*(\d{1,3})\s*(?:নং)?\s*(?:আয়াত|আয়াত|verse|ayah)$/i;
  const matchNumAyah2 = q.match(numThenAyahRegex2);
  if (matchNumAyah2) {
    const s = Number(matchNumAyah2[1]);
    const a = Number(matchNumAyah2[2]);
    if (s >= 1 && s <= 114) {
      return {
        clean: `${s}:${a}`,
        strippedPrefix: `${s}:${a}`,
        isAyahQuery: true,
        targetSurah: s,
        targetAyah: a,
      };
    }
  }

  // 2. Direct delimiter match: "2:183", "2/183", "2-183", "2 183", "2.183", "2ঃ183", "2,183", "2–183", "2—183", "2：183", "2\183", "2|183"
  const strippedPrefixQ = q.replace(/^(সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)\s+/i, "").trim();
  const directAyahMatch = strippedPrefixQ.match(/^(\d{1,3})\s*[:ঃ：\/\.\-–—−_\\|,\s]+\s*(\d{1,3})$/);
  if (directAyahMatch) {
    const s = Number(directAyahMatch[1]);
    const a = Number(directAyahMatch[2]);
    if (s >= 1 && s <= 114) {
      return {
        clean: `${s}:${a}`,
        strippedPrefix: `${s}:${a}`,
        isAyahQuery: true,
        targetSurah: s,
        targetAyah: a,
      };
    }
  }

  // 3. Named Surah + Ayah with "আয়াত / আয়াত / verse / ayah / delimiter" in between:
  // e.g. "সুরা বাকারা আয়াত ২৫৫", "বাকরা ২৫৫", "বাকারা:২৫৫", "fatiha 5", "কাহাফ ১০"
  const surahNameThenAyahRegex = /^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)?\s*(.+?)\s*(?:এর)?\s*(?:নং)?\s*(?:আয়াত|আয়াত|verse|ayah|[:ঃ：\/\.\-–—−_\\|,\s]+)\s*(?:নং)?\s*(\d{1,3})$/i;
  const matchNameAyah1 = q.match(surahNameThenAyahRegex);
  if (matchNameAyah1) {
    const rawName = matchNameAyah1[1].trim();
    const potentialAyah = Number(matchNameAyah1[2]);
    const foundSurah = findBestSurahMatch(rawName, 70);

    if (foundSurah) {
      return {
        clean: `${foundSurah.id}:${potentialAyah}`,
        strippedPrefix: foundSurah.name_bn,
        isAyahQuery: true,
        targetSurah: foundSurah.id,
        targetAyah: potentialAyah,
      };
    }
  }

  // 3b. Named Surah + Ayah number inverted (e.g. "সুরা বাকারা ২৫৫ নং আয়াত", "বাকারা ২৫৫ নং আয়াত")
  const surahNameThenAyahRegex2 = /^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)?\s*(.+?)\s*(?:এর)?\s*(\d{1,3})\s*(?:নং)?\s*(?:আয়াত|আয়াত|verse|ayah)$/i;
  const matchNameAyah2 = q.match(surahNameThenAyahRegex2);
  if (matchNameAyah2) {
    const rawName = matchNameAyah2[1].trim();
    const potentialAyah = Number(matchNameAyah2[2]);
    const foundSurah = findBestSurahMatch(rawName, 70);

    if (foundSurah) {
      return {
        clean: `${foundSurah.id}:${potentialAyah}`,
        strippedPrefix: foundSurah.name_bn,
        isAyahQuery: true,
        targetSurah: foundSurah.id,
        targetAyah: potentialAyah,
      };
    }
  }

  // 4. Standalone Ayah query: e.g. "আয়াত ২৫৫", "আয়াত ৫০", "২৫৫ নং আয়াত", "ayah 255"
  const onlyAyahRegex = /^(?:(?:আয়াত|আয়াত|verse|ayah)\s*(?:নং)?\s*(\d{1,3})|(\d{1,3})\s*(?:নং)?\s*(?:আয়াত|আয়াত|verse|ayah))$/i;
  const matchOnlyAyah = q.match(onlyAyahRegex);
  if (matchOnlyAyah) {
    const a = Number(matchOnlyAyah[1] || matchOnlyAyah[2]);
    return {
      clean: `ayah:${a}`,
      strippedPrefix: String(a),
      isAyahQuery: true,
      targetAyah: a,
    };
  }

  // 5. Partial verse typing: "2/", "2:", "2ঃ", "2-", "2."
  const partialAyahMatch = strippedPrefixQ.match(/^(\d{1,3})\s*[:ঃ：\/\.\-–—−_\\|]$/);
  if (partialAyahMatch) {
    const s = Number(partialAyahMatch[1]);
    if (s >= 1 && s <= 114) {
      return {
        clean: `${s}:`,
        strippedPrefix: `${s}`,
        isAyahQuery: false,
        isPartialAyahQuery: true,
        targetSurah: s,
      };
    }
  }

  // 6. Direct Surah number: "2" or "114", or "সুরা ২", "সূরা ১১৪"
  const surahNumOnlyRegex = /^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)?\s*(\d{1,3})$/i;
  const matchSurahNum = q.match(surahNumOnlyRegex);
  if (matchSurahNum) {
    const num = Number(matchSurahNum[1]);
    if (num >= 1 && num <= 114) {
      return {
        clean: String(num),
        strippedPrefix: String(num),
        isAyahQuery: false,
        targetSurah: num,
      };
    }
  }

  // 7. Named Surah only query with full typo & phonetic tolerance
  // (e.g. "বাকারা", "বাখারা", "বাকরা", "ফাতিহা", "ফাতেহা", "fatiha", "fateha", "এমরান", "কাফ", "কাহাফ", "yasin", "যাসিন")
  const prefixRegex = /^(সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura|অধ্যায়|অধ্যায়|পারা)\s+/i;
  const stripped = q.replace(prefixRegex, "").trim();
  const hasSurahPrefix = stripped !== q;
  // If the user explicitly wrote "সূরা ...", accept score >= 60 with typo tolerance.
  // Without an explicit prefix, require high confidence score >= 85 to prevent hijacking general search terms.
  const surahOnlyMatch = findBestSurahMatch(stripped || q, hasSurahPrefix ? 60 : 85);
  if (surahOnlyMatch) {
    return {
      clean: q,
      strippedPrefix: surahOnlyMatch.name_bn,
      isAyahQuery: false,
      targetSurah: surahOnlyMatch.id,
    };
  }

  return {
    clean: q,
    strippedPrefix: stripped,
    isAyahQuery: false,
  };
}

// Levenshtein distance for Bengali/English typo detection
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export interface SearchMatchedSurah extends SurahMeta {
  targetAyah?: number;
  score: number;
}

// Master Quran Search Engine with AI & Phonetic Typo Tolerance
export function searchQuranSurahs(query: string): {
  matches: SearchMatchedSurah[];
  didYouMean?: string;
  isDirectAyahMatch?: boolean;
} {
  const { clean, strippedPrefix, targetSurah, targetAyah } = normalizeQuranQuery(query);
  if (!clean) return { matches: [] };

  // 1. If directly resolved to surah + ayah
  if (targetSurah && targetAyah) {
    const s = ALL_SURAHS_DATABASE.find(item => item.id === targetSurah);
    return {
      matches: s ? [{ ...s, targetAyah, score: 100 }] : [],
      isDirectAyahMatch: Boolean(s),
    };
  }

  // 2. If standalone ayah query (e.g. "আয়াত ২৫৫" or "২৫৫ নং আয়াত")
  if (!targetSurah && targetAyah) {
    const candidates = ALL_SURAHS_DATABASE
      .filter((item) => item.total_verses >= targetAyah)
      .slice(0, 6)
      .map((item) => ({ ...item, targetAyah, score: 95 }));
    return {
      matches: candidates,
      isDirectAyahMatch: candidates.length > 0,
    };
  }

  // 3. If directly resolved to surah number via number or surah name
  if (targetSurah && !targetAyah) {
    const s = ALL_SURAHS_DATABASE.find(item => item.id === targetSurah);
    if (s) {
      const queryToScore = strippedPrefix || clean;
      const otherMatches = ALL_SURAHS_DATABASE
        .filter(item => item.id !== targetSurah)
        .map(item => ({ ...item, score: scoreSurahAgainstQuery(item, queryToScore) }))
        .filter(item => item.score >= 50)
        .sort((a, b) => b.score - a.score);
      return { matches: [{ ...s, score: 100 }, ...otherMatches] };
    }
  }

  // 4. General search across all surahs using multi-tier scoring
  const queryToScore = strippedPrefix || clean;
  const results: SearchMatchedSurah[] = [];
  let bestFuzzyMatch: { name: string; dist: number } | null = null;

  for (const surah of ALL_SURAHS_DATABASE) {
    const score = scoreSurahAgainstQuery(surah, queryToScore);
    if (score > 0) {
      results.push({
        ...surah,
        targetAyah,
        score,
      });
    }
  }

  // Sort by highest matching score
  results.sort((a, b) => b.score - a.score);

  return {
    matches: results,
    didYouMean: results.length === 0 && bestFuzzyMatch ? bestFuzzyMatch.name : undefined,
  };
}

export interface ParsedQuranReference {
  surahId?: number;
  fromAyah?: number;
  toAyah?: number;
  surahMeta?: SurahMeta;
  error?: string;
}

/**
 * Universal Quran reference parser.
 * Supports:
 * - "25/64", "25:64", "25-64", "25.64", "25 64", "25,64"
 * - Bengali numerals: "২৫/৬৪", "২৫:৬৪", "২৫-৬৪"
 * - Ranges: "25:64-66", "২৫/৬৪-৬৬", "২৫:৬৪–৬৬"
 * - Surah name + Ayah: "সুরা ফুরকান ৬৪", "সূরা ফুরকান ৬৪-৬৬", "ফুরকান:৬৪", "বাকারা ২৫৫"
 * - Standalone Surah: "২৫", "সুরা ২৫", "সূরা ফুরকান", "ফুরকান", "Al-Furqan"
 * - Well-known ayat: "আয়াতুল কুরসি", "ayatul kursi", "kursi"
 */
export function parseQuranReference(input: string): ParsedQuranReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Ayatul kursi / famous ayah special case
  const lower = trimmed.toLowerCase();
  if (/আয়াতুল\s*কুরসি|আয়াতুল\s*কুরসী|ayatul\s*kursi|kursi/i.test(lower)) {
    const meta = ALL_SURAHS_DATABASE.find((s) => s.id === 2);
    if (meta) {
      return { surahId: 2, fromAyah: 255, toAyah: 255, surahMeta: meta };
    }
  }

  // 2. Normalize Bengali digits to English
  const normalized = bnToEnDigits(trimmed);

  // 3. Strip leading surah prefix (e.g. "সুরা ", "সূরা ", "surah ")
  const withoutPrefix = normalized.replace(/^(?:সুরাহ্|সুরাহ|সূরাহ|সূরা|সুরা|সুরত|surah|surat|sura)\s+/i, "").trim();

  // 4. Match format: surah delimiter fromAyah (optional delimiter toAyah)
  // e.g. '25/64', '25:64', '25-64', '25.64', '25,64', '25 64', '25/64-66', '25:64–66'
  const rangeMatch = withoutPrefix.match(
    /^(\d{1,3})\s*[:ঃ：\/\.\-–—−_\\|,\s]+\s*(\d{1,3})(?:\s*[-–—−_:ঃ：\/\.\s]+\s*(\d{1,3}))?$/
  );
  if (rangeMatch) {
    const sId = parseInt(rangeMatch[1], 10);
    const aFrom = parseInt(rangeMatch[2], 10);
    const aTo = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : aFrom;

    const meta = ALL_SURAHS_DATABASE.find((s) => s.id === sId);
    if (!meta) {
      return { error: "১ থেকে ১১৪-এর মধ্যে সঠিক সূরা নম্বর দিন।" };
    }
    if (aFrom < 1 || aFrom > meta.total_verses) {
      return { error: `সূরা ${meta.name_bn}-এ আয়াত রয়েছে ১ থেকে ${meta.total_verses} পর্যন্ত।` };
    }
    const validTo = Math.max(aFrom, Math.min(aTo, meta.total_verses));
    return { surahId: sId, fromAyah: aFrom, toAyah: validTo, surahMeta: meta };
  }

  // 5. Standalone Surah number (e.g. '25', '২৫', 'সুরা ২৫', 'surah 25')
  const surahOnlyMatch = withoutPrefix.match(/^(\d{1,3})$/);
  if (surahOnlyMatch) {
    const sId = parseInt(surahOnlyMatch[1], 10);
    const meta = ALL_SURAHS_DATABASE.find((s) => s.id === sId);
    if (meta) {
      return { surahId: sId, fromAyah: 1, toAyah: 1, surahMeta: meta };
    }
    return { error: "১ থেকে ১১৪-এর মধ্যে সঠিক সূরা নম্বর দিন।" };
  }

  // 6. Named Surah + Ayah / Range (e.g. 'সুরা ফুরকান ৬৪', 'ফুরকান ৬৪-৬৬', 'ফুরকান:৬৪', 'বাকারা ২৫৫')
  const nameThenRangeRegex = /^(.+?)\s*(?:এর)?\s*(?:নং)?\s*(?:আয়াত|আয়াত|verse|ayah|[:ঃ：\/\.\-–—−_\\|,\s]+)\s*(?:নং)?\s*(\d{1,3})(?:\s*[-–—−_:ঃ：\/\.\s]+\s*(\d{1,3}))?$/i;
  const matchNameRange = withoutPrefix.match(nameThenRangeRegex);
  if (matchNameRange) {
    const sName = matchNameRange[1].trim();
    const aFrom = parseInt(matchNameRange[2], 10);
    const aTo = matchNameRange[3] ? parseInt(matchNameRange[3], 10) : aFrom;
    const found = findBestSurahMatch(sName, 60);
    if (found) {
      if (aFrom < 1 || aFrom > found.total_verses) {
        return { error: `সূরা ${found.name_bn}-এ আয়াত রয়েছে ১ থেকে ${found.total_verses} পর্যন্ত।` };
      }
      const validTo = Math.max(aFrom, Math.min(aTo, found.total_verses));
      return { surahId: found.id, fromAyah: aFrom, toAyah: validTo, surahMeta: found };
    }
  }

  // 7. Try normalizeQuranQuery as fallback
  const qRes = normalizeQuranQuery(trimmed);
  if (qRes.targetSurah) {
    const meta = ALL_SURAHS_DATABASE.find((s) => s.id === qRes.targetSurah);
    if (meta) {
      const aNum = qRes.targetAyah || 1;
      if (aNum < 1 || aNum > meta.total_verses) {
        return { error: `সূরা ${meta.name_bn}-এ আয়াত রয়েছে ১ থেকে ${meta.total_verses} পর্যন্ত।` };
      }
      return { surahId: meta.id, fromAyah: aNum, toAyah: aNum, surahMeta: meta };
    }
  }

  // 8. Standalone Surah name (e.g. 'ফুরকান', 'বাকারা', 'yasin', 'আল ফুরকান')
  const foundSurah = findBestSurahMatch(withoutPrefix, 60);
  if (foundSurah) {
    return { surahId: foundSurah.id, fromAyah: 1, toAyah: 1, surahMeta: foundSurah };
  }

  return null;
}

