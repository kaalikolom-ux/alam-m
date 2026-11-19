import {
  Home,
  BookOpen,
  Feather,
  Scroll,
  Cpu,
  User,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export function getMenuIcon(url: string, label?: string): LucideIcon {
  const cleanUrl = (url || "").toLowerCase().trim();
  const cleanLabel = (label || "").toLowerCase().trim();

  if (cleanUrl === "/" || cleanLabel === "হোম" || cleanLabel === "home") {
    return Home;
  }
  if (
    cleanUrl.includes("golpo") ||
    cleanLabel === "গল্প" ||
    cleanLabel === "story" ||
    cleanLabel === "stories"
  ) {
    return BookOpen;
  }
  if (
    cleanUrl.includes("kobita") ||
    cleanLabel === "কবিতা" ||
    cleanLabel === "poem" ||
    cleanLabel === "poems" ||
    cleanLabel === "poetry"
  ) {
    return Feather;
  }
  if (
    cleanUrl.includes("smritikotha") ||
    cleanLabel === "স্মৃতিকথা" ||
    cleanLabel.includes("memoir")
  ) {
    return Scroll;
  }
  if (
    cleanUrl.includes("tech-tips") ||
    cleanUrl.includes("tech") ||
    cleanLabel === "টেক টিপস" ||
    cleanLabel.includes("tech") ||
    cleanLabel.includes("tecj")
  ) {
    return Cpu;
  }
  if (cleanUrl.includes("about") || cleanLabel === "আমার পাতা" || cleanLabel === "about") {
    return User;
  }
  if (cleanUrl.includes("contact") || cleanLabel === "যোগাযোগ" || cleanLabel === "contact") {
    return Mail;
  }
  if (
    cleanUrl.includes("privacy") ||
    cleanLabel.includes("privacy") ||
    cleanLabel.includes("প্রাইভেসি")
  ) {
    return ShieldCheck;
  }
  return BookOpen;
}

export const ORDERED_MENU_ITEMS = [
  { id: "home", url: "/", label_bn: "হোম", label_en: "Home", sort_order: 1 },
  { id: "story", url: "/c/golpo", label_bn: "গল্প", label_en: "Story", sort_order: 2 },
  { id: "poem", url: "/c/kobita", label_bn: "কবিতা", label_en: "Poem", sort_order: 3 },
  { id: "memoirs", url: "/c/smritikotha", label_bn: "স্মৃতিকথা", label_en: "Memoirs", sort_order: 4 },
  { id: "tech-tips", url: "/c/tech-tips", label_bn: "টেক টিপস", label_en: "Tech Tips", sort_order: 5 },
  { id: "about", url: "/about", label_bn: "আমার পাতা", label_en: "About", sort_order: 6 },
  { id: "contact", url: "/contact", label_bn: "যোগাযোগ", label_en: "Contact", sort_order: 7 },
  { id: "privacy-policy", url: "/privacy-policy", label_bn: "প্রাইভেসি পলিসি", label_en: "Privacy Policy", sort_order: 8 },
];

export const MENU_ORDER_MAP: Record<string, number> = {
  "/": 1,
  "/c/golpo": 2,
  "/c/kobita": 3,
  "/c/smritikotha": 4,
  "/c/tech-tips": 5,
  "/about": 6,
  "/contact": 7,
  "/privacy-policy": 8,
};

export function sortMenuItems<T extends { url: string; sort_order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderA = MENU_ORDER_MAP[a.url] ?? a.sort_order ?? 99;
    const orderB = MENU_ORDER_MAP[b.url] ?? b.sort_order ?? 99;
    return orderA - orderB;
  });
}
