import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type Lang = "bn" | "en";

interface PrefsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  home: { bn: "হোম", en: "Home" },
  articles: { bn: "লেখালেখি", en: "Articles" },
  contact: { bn: "যোগাযোগ", en: "Contact" },
  dashboard: { bn: "ড্যাশবোর্ড", en: "Dashboard" },
  categoriesTab: { bn: "ক্যাটাগরি", en: "Categories" },
  pagesTab: { bn: "পাতা", en: "Pages" },
  menusTab: { bn: "মেন্যু", en: "Menus" },
  footerTab: { bn: "ফুটার", en: "Footer" },
  messagesTab: { bn: "বার্তা", en: "Messages" },
  subscribersTab: { bn: "সাবস্ক্রাইবার", en: "Subscribers" },
  loading: { bn: "লোড হচ্ছে...", en: "Loading..." },
  adminOnly: { bn: "এই পেজটি শুধুমাত্র অ্যাডমিনের জন্য।", en: "This page is restricted to administrators." },
  signIn: { bn: "লগইন করুন", en: "Sign In" },
  saved: { bn: "সফলভাবে সংরক্ষিত হয়েছে!", en: "Saved successfully!" },
  delete: { bn: "মুছে ফেলা হয়েছে!", en: "Deleted!" },
  newArticle: { bn: "নতুন লেখা", en: "New Article" },
  edit: { bn: "সম্পাদনা", en: "Edit" },
  published: { bn: "প্রকাশিত", en: "Published" },
  draft: { bn: "খসড়া", en: "Draft" },
  slug: { bn: "স্লাগ (URL)", en: "Slug (URL)" },
  titleBn: { bn: "শিরোনাম (বাংলা)", en: "Title (Bengali)" },
  titleEn: { bn: "শিরোনাম (ইংরেজি)", en: "Title (English)" },
  excerptBn: { bn: "সারসংক্ষেপ (বাংলা)", en: "Excerpt (Bengali)" },
  excerptEn: { bn: "সারসংক্ষেপ (ইংরেজি)", en: "Excerpt (English)" },
  contentBn: { bn: "মূল বিষয়বস্তু (বাংলা)", en: "Content (Bengali)" },
  contentEn: { bn: "মূল বিষয়বস্তু (ইংরেজি)", en: "Content (English)" },
  coverImage: { bn: "কভার ছবির URL", en: "Cover Image URL" },
  author: { bn: "লেখক", en: "Author" },
  noAuthor: { bn: "কোনো লেখক ছাড়া", en: "No Author" },
  categories: { bn: "ক্যাটাগরি সমূহ", en: "Categories" },
  noCategories: { bn: "কোনো ক্যাটাগরি তৈরি করা হয়নি", en: "No categories created" },
  save: { bn: "সংরক্ষণ করুন", en: "Save" },
  cancel: { bn: "বাতিল", en: "Cancel" },
  noArticles: { bn: "এখনো কোনো আর্টিকেল প্রকাশিত হয়নি।", en: "No articles published yet." },
  backToArticles: { bn: "সকল লেখায় ফিরে যান", en: "Back to Articles" },
  readMore: { bn: "বিস্তারিত পড়ুন", en: "Read More" },
  newsletter: { bn: "যুক্ত থাকুন", en: "Stay Connected" },
  newsletterSub: { bn: "নতুন লেখার নোটিফিকেশন সরাসরি পেতে ইমেইল দিয়ে সাবস্ক্রাইব করুন।", en: "Subscribe with your email to get latest posts directly." },
  tagline: { bn: "সাহিত্য ও চিন্তন", en: "Literature & Thoughts" },
};

const PrefsContext = createContext<PrefsContextType | undefined>(undefined);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });

  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lang") as Lang;
      if (saved === "bn" || saved === "en") return saved;
    }
    return "bn";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const setLang = (l: Lang) => setLangState(l);
  const toggleLang = () => setLangState((prev) => (prev === "bn" ? "en" : "bn"));

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <PrefsContext.Provider value={{ theme, setTheme, toggleTheme, lang, setLang, toggleLang, t }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const context = useContext(PrefsContext);
  if (!context) {
    throw new Error("usePrefs must be used within a PrefsProvider");
  }
  return context;
}
