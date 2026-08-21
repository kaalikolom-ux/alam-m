export type Lang = "bn" | "en";

export type DictEntry = { bn: string; en: string };
export type Dict = Record<string, DictEntry>;

export const dict: Dict = {
  // সাধারণ / General & Meta
  siteName: { bn: "ব্লগ", en: "Blog" },
  tagline: {
    bn: "শব্দ আমার ক্যানভাস, গল্প আমার রঙ; লেখার তুলিতে আঁকি ভাবনা",
    en: "Words are my canvas, stories my colours; with the brush of writing I paint thoughts",
  },
  heroSub: {
    bn: "প্রযুক্তি, ভাবনা এবং বিবিধ বিষয়ের ওপর নিয়মিত আর্টিকেল ও বিশ্লেষণমূলক লেখা পড়ুন।",
    en: "Read regular articles, essays, and analytical thoughts on technology and beyond.",
  },
  home: { bn: "হোম", en: "Home" },
  articles: { bn: "আর্টিকেল", en: "Articles" },
  article: { bn: "আর্টিকেল", en: "Article" },
  latestArticles: { bn: "সাম্প্রতিক আর্টিকেল", en: "Latest articles" },
  noArticles: { bn: "এখনো কোনো আর্টিকেল প্রকাশিত হয়নি।", en: "No articles published yet." },
  readMore: { bn: "পড়ুন", en: "Read more" },
  backToArticles: { bn: "সব আর্টিকেল", en: "All articles" },
  aboutMe: { bn: "আমার পরিচিতি", en: "About Me" },
  contact: { bn: "যোগাযোগ", en: "Contact" },
  loading: { bn: "লোড হচ্ছে...", en: "Loading..." },
  error: { bn: "কিছু একটা ভুল হয়েছে", en: "Something went wrong" },
  pageNotFound: { bn: "পৃষ্ঠাটি পাওয়া যায়নি।", en: "Page not found." },
  
  // প্রদর্শন ও থিম / Display & Theme
  displaySettings: { bn: "প্রদর্শন সেটিংস", en: "Display settings" },
  darkMode: { bn: "ডার্ক মোড", en: "Dark mode" },
  language: { bn: "ভাষা", en: "Language" },

  // অথেন্টিকেশন ও ইউজার / Auth & User
  signIn: { bn: "সাইন ইন", en: "Sign in" },
  signUp: { bn: "রেজিস্ট্রেশন", en: "Sign up" },
  signOut: { bn: "সাইন আউট", en: "Sign out" },
  email: { bn: "ইমেইল", en: "Email" },
  password: { bn: "পাসওয়ার্ড", en: "Password" },
  createAccount: { bn: "অ্যাকাউন্ট খুলুন", en: "Create account" },
  haveAccount: { bn: "আগেই অ্যাকাউন্ট আছে? সাইন ইন", en: "Already have an account? Sign in" },
  noAccount: { bn: "অ্যাকাউন্ট নেই? সাবস্ক্রাইব করুন", en: "No account? Subscribe" },
  forgotPassword: { bn: "পাসওয়ার্ড ভুলে গেছেন?", en: "Forgot password?" },
  resetPassword: { bn: "পাসওয়ার্ড রিসেট", en: "Reset password" },
  sendResetLink: { bn: "রিসেট লিংক পাঠান", en: "Send reset link" },
  resetSent: {
    bn: "রিসেট লিংক ইমেইলে পাঠানো হয়েছে। ইনবক্স চেক করুন।",
    en: "A reset link has been sent to your email. Check your inbox.",
  },
  newPassword: { bn: "নতুন পাসওয়ার্ড", en: "New password" },
  updatePassword: { bn: "পাসওয়ার্ড আপডেট করুন", en: "Update password" },
  passwordUpdated: { bn: "পাসওয়ার্ড আপডেট হয়েছে", en: "Password updated" },
  backToSignIn: { bn: "সাইন ইনে ফিরুন", en: "Back to sign in" },

  // বুকমার্ক / Bookmarks
  bookmarks: { bn: "বুকমার্ক", en: "Bookmarks" },
  bookmark: { bn: "বুকমার্ক", en: "Bookmark" },
  bookmarked: { bn: "বুকমার্ক করা হয়েছে", en: "Bookmarked" },
  myBookmarks: { bn: "আমার বুকমার্ক", en: "My Bookmarks" },
  removeBookmark: { bn: "বুকমার্ক সরান", en: "Remove bookmark" },
  emptyBookmarks: { bn: "এখনো কোনো বুকমার্ক সংরক্ষণ করা হয়নি।", en: "Nothing bookmarked yet." },
  signInPrompt: { bn: "বুকমার্ক করতে সাইন ইন করুন", en: "Sign in to bookmark" },

  // নিউজলেটার / Newsletter
  newsletter: { bn: "নিউজলেটার", en: "Newsletter" },
  newsletterSub: {
    bn: "নতুন আর্টিকেল প্রকাশিত হলে ইমেইলে জানতে চান? আপনার ইমেইল দিন।",
    en: "Want an email when new articles are published? Enter your email.",
  },
  subscribe: { bn: "সাবস্ক্রাইব", en: "Subscribe" },
  thanks: { bn: "ধন্যবাদ! আপনি তালিকায় যুক্ত হয়েছেন।", en: "Thanks! You are on the list." },

  // ড্যাশবোর্ড ও সাধারণ অ্যাকশন / Dashboard & Actions
  admin: { bn: "অ্যাডমিন", en: "Admin" },
  dashboard: { bn: "ড্যাশবোর্ড", en: "Dashboard" },
  adminOnly: { bn: "এই পাতা কেবল অ্যাডমিনের জন্য।", en: "This page is for admins only." },
  save: { bn: "সংরক্ষণ করুন", en: "Save" },
  saved: { bn: "সংরক্ষিত হয়েছে", en: "Saved" },
  delete: { bn: "মুছুন", en: "Delete" },
  edit: { bn: "সম্পাদনা", en: "Edit" },
  cancel: { bn: "বাতিল", en: "Cancel" },
  published: { bn: "প্রকাশিত", en: "Published" },
  draft: { bn: "খসড়া", en: "Draft" },
  note: { bn: "নোট (ঐচ্ছিক)", en: "Note (optional)" },
  sortOrder: { bn: "ক্রম", en: "Order" },
  visible: { bn: "দৃশ্যমান", en: "Visible" },
  hidden: { bn: "লুকানো", en: "Hidden" },
  description: { bn: "বর্ণনা", en: "Description" },

  // পোস্ট ও আর্টিকেল এডিটর / Post Editor
  newArticle: { bn: "নতুন আর্টিকেল", en: "New article" },
  postSettings: { bn: "পোস্ট সেটিংস", en: "Post settings" },
  slug: { bn: "স্লাগ (URL)", en: "Slug (URL)" },
  titleBn: { bn: "শিরোনাম (বাংলা)", en: "Title (Bangla)" },
  titleEn: { bn: "শিরোনাম (ইংরেজি)", en: "Title (English)" },
  excerptBn: { bn: "সারসংক্ষেপ (বাংলা)", en: "Excerpt (Bangla)" },
  excerptEn: { bn: "সারসংক্ষেপ (ইংরেজি)", en: "Excerpt (English)" },
  contentBn: { bn: "বিষয়বস্তু (বাংলা)", en: "Content (Bangla)" },
  contentEn: { bn: "বিষয়বস্তু (ইংরেজি)", en: "Content (English)" },
  coverImage: { bn: "কভার ছবির লিংক", en: "Cover image URL" },

  // ড্যাশবোর্ড ট্যাবসমূহ / Dashboard Tabs
  pagesTab: { bn: "পেইজ", en: "Pages" },
  menusTab: { bn: "মেন্যু", en: "Menus" },
  categoriesTab: { bn: "ক্যাটাগরি", en: "Categories" },
  subscribersTab: { bn: "সাবস্ক্রাইবার", en: "Subscribers" },
  messagesTab: { bn: "বার্তা", en: "Messages" },
  authorsTab: { bn: "লেখক", en: "Authors" },

  // মেন্যু সেটিংস / Menu Management
  newMenuItem: { bn: "নতুন মেন্যু আইটেম", en: "New menu item" },
  labelBn: { bn: "লেবেল (বাংলা)", en: "Label (Bangla)" },
  labelEn: { bn: "লেবেল (ইংরেজি)", en: "Label (English)" },
  linkUrl: { bn: "লিংক (URL)", en: "Link (URL)" },
  menuLocation: { bn: "অবস্থান", en: "Location" },
  header: { bn: "হেডার", en: "Header" },
  footer: { bn: "ফুটার", en: "Footer" },

  // লেখক সেটিংস / Author Management
  author: { bn: "লেখক", en: "Author" },
  newAuthor: { bn: "নতুন লেখক", en: "New author" },
  authorNameBn: { bn: "লেখকের নাম (বাংলা)", en: "Author name (Bangla)" },
  authorNameEn: { bn: "লেখকের নাম (ইংরেজি)", en: "Author name (English)" },
  authorImage: { bn: "লেখকের ছবির লিংক", en: "Author image URL" },
  authorBioBn: { bn: "পরিচিতি (বাংলা)", en: "Bio (Bangla)" },
  authorBioEn: { bn: "পরিচিতি (ইংরেজি)", en: "Bio (English)" },
  noAuthor: { bn: "কোনো লেখক পাওয়া যায়নি", en: "No author found" },

  // পেইজ ও ক্যাটাগরি / Pages & Categories
  newPage: { bn: "নতুন পেইজ", en: "New page" },
  newCategory: { bn: "নতুন ক্যাটাগরি", en: "New category" },
  nameBn: { bn: "নাম (বাংলা)", en: "Name (Bangla)" },
  nameEn: { bn: "নাম (ইংরেজি)", en: "Name (English)" },
  categories: { bn: "ক্যাটাগরি", en: "Categories" },
  noCategories: { bn: "কোনো ক্যাটাগরি নেই।", en: "No categories yet." },

  // ফুটার সেটিংস / Footer Settings
  footerTab: { bn: "ফুটার", en: "Footer" },
  footerAboutBn: { bn: "ফুটার বিবরণ (বাংলা)", en: "Footer text (Bangla)" },
  footerAboutEn: { bn: "ফুটার বিবরণ (ইংরেজি)", en: "Footer text (English)" },
  footerCopyrightBn: { bn: "কপিরাইট লেখা (বাংলা)", en: "Copyright text (Bangla)" },
  footerCopyrightEn: { bn: "কপিরাইট লেখা (ইংরেজি)", en: "Copyright text (English)" },

  // যোগাযোগ ও বার্তা / Contact & Messages
  yourName: { bn: "আপনার নাম", en: "Your name" },
  subject: { bn: "বিষয়", en: "Subject" },
  message: { bn: "বার্তা", en: "Message" },
  sendMessage: { bn: "বার্তা পাঠান", en: "Send message" },
  messageSent: { bn: "ধন্যবাদ! আপনার বার্তা সফলভাবে পাঠানো হয়েছে।", en: "Thanks! Your message has been sent." },
  noMessages: { bn: "এখনো কোনো বার্তা আসেনি।", en: "No messages yet." },
};

/**
 * যেকোনো ফরম্যাটে ট্রান্সলেশন হ্যান্ডেল করার জন্য নিরাপদ ফাংশন:
 * ১. translate("bn", "newMenuItem")
 * ২. translate("newMenuItem", "bn")
 * ৩. translate("newMenuItem") -> ডিফল্ট "bn"
 */
export function translate(arg1: string, arg2?: string): string {
  let lang: Lang = "bn";
  let key: string = "";

  if (arg1 === "bn" || arg1 === "en") {
    lang = arg1;
    key = arg2 || "";
  } else {
    key = arg1;
    if (arg2 === "bn" || arg2 === "en") {
      lang = arg2;
    }
  }

  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] || key;
}

export const t = translate;