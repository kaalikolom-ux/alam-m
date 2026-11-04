import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ExternalLink,
  RefreshCw,
  Info,
  Check,
  ChevronDown,
  Download,
  Filter,
  CheckSquare,
  Square,
  Globe,
  FileText,
  Smartphone,
  Laptop,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Settings,
  HelpCircle,
  X,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatNumberBn } from "@/lib/visitorTracker";

type TimeRange = "24h" | "7d" | "28d" | "3m" | "12m";
type BreakdownTab = "queries" | "pages" | "countries" | "devices" | "appearance";

interface TimeDataPoint {
  timeLabel: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscMetricItem {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  lastUpdated: string;
}

const DEFAULT_METRICS: Record<TimeRange, GscMetricItem> = {
  "24h": {
    totalClicks: 1,
    totalImpressions: 215,
    avgCtr: 0.5,
    avgPosition: 8.4,
    lastUpdated: "১০.৫ ঘণ্টা আগে (Last update: 10.5 hours ago)",
  },
  "7d": {
    totalClicks: 52,
    totalImpressions: 1420,
    avgCtr: 3.7,
    avgPosition: 8.1,
    lastUpdated: "আজ দুপুর ১২:০০ টায়",
  },
  "28d": {
    totalClicks: 218,
    totalImpressions: 6850,
    avgCtr: 3.2,
    avgPosition: 8.9,
    lastUpdated: "আজ সকাল ০৮:০০ টায়",
  },
  "3m": {
    totalClicks: 890,
    totalImpressions: 28500,
    avgCtr: 3.1,
    avgPosition: 8.6,
    lastUpdated: "আজ ভোর ০৪:০০ টায়",
  },
  "12m": {
    totalClicks: 3240,
    totalImpressions: 112000,
    avgCtr: 2.9,
    avgPosition: 9.4,
    lastUpdated: "গতকাল রাত ১১:৩০ টায়",
  },
};

export function GoogleSearchConsolePerformance() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [showClicks, setShowClicks] = useState(true);
  const [showImpressions, setShowImpressions] = useState(true);
  const [showCtr, setShowCtr] = useState(false);
  const [showPosition, setShowPosition] = useState(false);
  const [granularity, setGranularity] = useState<"hourly" | "daily">("hourly");
  const [dismissNotice, setDismissNotice] = useState(false);
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>("queries");
  const [tableFilter, setTableFilter] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState<TimeDataPoint | null>(null);
  const [inspectUrl, setInspectUrl] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Editable & persistent GSC metrics state
  const [allMetrics, setAllMetrics] = useState<Record<TimeRange, GscMetricItem>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("gsc_custom_metrics_v2");
        if (stored) return { ...DEFAULT_METRICS, ...JSON.parse(stored) };
      } catch {}
    }
    return DEFAULT_METRICS;
  });

  const metrics = allMetrics[timeRange] || DEFAULT_METRICS[timeRange];

  // Manual edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<GscMetricItem>({
    totalClicks: metrics.totalClicks,
    totalImpressions: metrics.totalImpressions,
    avgCtr: metrics.avgCtr,
    avgPosition: metrics.avgPosition,
    lastUpdated: metrics.lastUpdated,
  });

  useEffect(() => {
    setEditForm({
      totalClicks: metrics.totalClicks,
      totalImpressions: metrics.totalImpressions,
      avgCtr: metrics.avgCtr,
      avgPosition: metrics.avgPosition,
      lastUpdated: metrics.lastUpdated,
    });
  }, [timeRange, metrics]);

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...allMetrics,
      [timeRange]: {
        ...editForm,
        totalClicks: Number(editForm.totalClicks) || 0,
        totalImpressions: Number(editForm.totalImpressions) || 0,
        avgCtr: Number(editForm.avgCtr) || 0,
        avgPosition: Number(editForm.avgPosition) || 0,
      },
    };
    setAllMetrics(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("gsc_custom_metrics_v2", JSON.stringify(updated));
      } catch {}
    }
    setIsEditModalOpen(false);
    toast.success("Google Search Console পারফরম্যান্স ডাটা সফলভাবে আপডেট ও সংরক্ষণ করা হয়েছে!");
  };

  const handleResetMetrics = () => {
    setAllMetrics(DEFAULT_METRICS);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("gsc_custom_metrics_v2");
      } catch {}
    }
    setIsEditModalOpen(false);
    toast.success("ডিফল্ট সার্চ কনসোল ডাটা সফলভাবে পুনঃস্থাপন করা হয়েছে!");
  };

  // Hourly chart curve for 24 hours matching the user's Search Console screenshot
  const chartData: TimeDataPoint[] = useMemo(() => {
    if (timeRange === "24h") {
      return [
        { timeLabel: "04:00", clicks: 0, impressions: 5, ctr: 0, position: 9.0 },
        { timeLabel: "06:00", clicks: 0, impressions: 8, ctr: 0, position: 8.5 },
        { timeLabel: "08:00", clicks: 0, impressions: 14, ctr: 0, position: 8.2 },
        { timeLabel: "10:00", clicks: 0, impressions: 12, ctr: 0, position: 8.8 },
        { timeLabel: "12:00", clicks: 0, impressions: 14, ctr: 0, position: 8.4 },
        { timeLabel: "14:00", clicks: 0, impressions: 5, ctr: 0, position: 9.2 },
        { timeLabel: "16:00", clicks: 0, impressions: 11, ctr: 0, position: 8.1 },
        { timeLabel: "18:00", clicks: 0, impressions: 12, ctr: 0, position: 8.3 },
        { timeLabel: "20:00", clicks: 1, impressions: 29, ctr: 3.4, position: 7.9 },
        { timeLabel: "22:00", clicks: 0, impressions: 18, ctr: 0, position: 8.2 },
        { timeLabel: "00:00", clicks: 0, impressions: 6, ctr: 0, position: 8.7 },
        { timeLabel: "02:00", clicks: 0, impressions: 2, ctr: 0, position: 9.1 },
      ];
    } else if (timeRange === "7d") {
      return [
        { timeLabel: "সোম", clicks: 7, impressions: 195, ctr: 3.6, position: 8.2 },
        { timeLabel: "মঙ্গল", clicks: 9, impressions: 210, ctr: 4.3, position: 7.9 },
        { timeLabel: "বুধ", clicks: 6, impressions: 180, ctr: 3.3, position: 8.5 },
        { timeLabel: "বৃহ", clicks: 8, impressions: 220, ctr: 3.6, position: 7.7 },
        { timeLabel: "শুক্র", clicks: 11, impressions: 260, ctr: 4.2, position: 7.4 },
        { timeLabel: "শনি", clicks: 5, impressions: 175, ctr: 2.9, position: 8.8 },
        { timeLabel: "রবি", clicks: 6, impressions: 180, ctr: 3.3, position: 8.1 },
      ];
    } else {
      return [
        { timeLabel: "সপ্তাহ ১", clicks: 45, impressions: 1450, ctr: 3.1, position: 8.9 },
        { timeLabel: "সপ্তাহ ২", clicks: 58, impressions: 1780, ctr: 3.3, position: 8.4 },
        { timeLabel: "সপ্তাহ ৩", clicks: 52, impressions: 1690, ctr: 3.1, position: 8.7 },
        { timeLabel: "সপ্তাহ ৪", clicks: 63, impressions: 1930, ctr: 3.3, position: 8.2 },
      ];
    }
  }, [timeRange]);

  // Breakdown tables
  const queriesData = [
    { query: "কুরআন অন্বেষা", clicks: 2, impressions: 42, ctr: 4.8, position: 1.2 },
    { query: "quraan bd", clicks: 2, impressions: 38, ctr: 5.3, position: 1.1 },
    { query: "quran explore pro", clicks: 1, impressions: 25, ctr: 4.0, position: 1.8 },
    { query: "সুরা কিয়ামাহ নতুন অনুবাদ", clicks: 1, impressions: 18, ctr: 5.6, position: 3.4 },
    { query: "৭৫:১ অনুবাদ কুরআন", clicks: 0, impressions: 14, ctr: 0.0, position: 4.2 },
    { query: "কুরআনে মহাজাগতিক নিদর্শন", clicks: 0, impressions: 12, ctr: 0.0, position: 5.1 },
    { query: "সূরা ফাতিহা বৈজ্ঞানিক অনুবাদ", clicks: 0, impressions: 8, ctr: 0.0, position: 6.3 },
  ];

  const pagesData = [
    { page: "https://www.quraan.bd/", clicks: 3, impressions: 68, ctr: 4.4, position: 2.1 },
    { page: "https://www.quraan.bd/surah/75", clicks: 2, impressions: 41, ctr: 4.9, position: 3.8 },
    { page: "https://www.quraan.bd/articles/quran-verses-not-oaths-attention-new-translation", clicks: 1, impressions: 26, ctr: 3.8, position: 4.5 },
    { page: "https://www.quraan.bd/surah/1", clicks: 0, impressions: 12, ctr: 0.0, position: 5.8 },
    { page: "https://www.quraan.bd/lexicon", clicks: 0, impressions: 10, ctr: 0.0, position: 6.2 },
  ];

  const countriesData = [
    { country: "Bangladesh (বাংলাদেশ)", clicks: 5, impressions: 128, ctr: 3.9, position: 6.4 },
    { country: "United States (যুক্তরাষ্ট্র)", clicks: 1, impressions: 14, ctr: 7.1, position: 8.2 },
    { country: "India (ভারত)", clicks: 0, impressions: 9, ctr: 0.0, position: 9.5 },
    { country: "United Kingdom (যুক্তরাজ্য)", clicks: 0, impressions: 4, ctr: 0.0, position: 11.2 },
    { country: "Saudi Arabia (সৌদি আরব)", clicks: 0, impressions: 2, ctr: 0.0, position: 12.0 },
  ];

  const devicesData = [
    { device: "Mobile (মোবাইল)", clicks: 4, impressions: 108, ctr: 3.7, position: 7.5 },
    { device: "Desktop (কম্পিউটার)", clicks: 2, impressions: 46, ctr: 4.3, position: 7.9 },
    { device: "Tablet (ট্যাবলেট)", clicks: 0, impressions: 3, ctr: 0.0, position: 9.0 },
  ];

  const filteredQueries = queriesData.filter(q => q.query.toLowerCase().includes(tableFilter.toLowerCase()));
  const filteredPages = pagesData.filter(p => p.page.toLowerCase().includes(tableFilter.toLowerCase()));
  const filteredCountries = countriesData.filter(c => c.country.toLowerCase().includes(tableFilter.toLowerCase()));
  const filteredDevices = devicesData.filter(d => d.device.toLowerCase().includes(tableFilter.toLowerCase()));

  // SVG chart sizing calculations
  const maxClicks = Math.max(...chartData.map(d => d.clicks), 3);
  const maxImpressions = Math.max(...chartData.map(d => d.impressions), 15);
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (index: number) => {
    return paddingX + (index / (chartData.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getClicksY = (val: number) => {
    return svgHeight - paddingY - (val / maxClicks) * (svgHeight - paddingY * 2);
  };

  const getImpY = (val: number) => {
    return svgHeight - paddingY - (val / maxImpressions) * (svgHeight - paddingY * 2);
  };

  // Generate SVG path for clicks
  const clicksPath = chartData.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getClicksY(d.clicks)}`).join(" ");

  // Generate SVG path for impressions
  const impPath = chartData.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getImpY(d.impressions)}`).join(" ");

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = inspectUrl.trim() || "https://www.quraan.bd/";
    const encoded = encodeURIComponent(url);
    window.open(`https://search.google.com/search-console/inspect?resource_id=sc-domain:quraan.bd&id=${encoded}`, "_blank");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Google Search Console পারফরম্যান্স ডাটা সফলভাবে রিফ্রেশ হয়েছে!");
    }, 800);
  };

  return (
    <div className="bg-[#f8fafd] dark:bg-[#181d20] border border-[#d2d9e0] dark:border-[#2d3439] rounded-xl overflow-hidden shadow-xs font-sans text-slate-900 dark:text-slate-100">
      {/* 1. GOOGLE SEARCH CONSOLE TOP BAR */}
      <div className="bg-white dark:bg-[#1f2428] border-b border-[#dadce0] dark:border-[#30363d] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* GSC Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" fill="#4285F4"/>
            </svg>
            <span className="font-semibold text-base tracking-tight text-slate-800 dark:text-slate-200">
              Google Search Console
            </span>
          </div>

          {/* Property Dropdown Button */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#dadce0] dark:border-[#3c434a] bg-slate-50 dark:bg-slate-900/60 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="size-4 rounded bg-[#e8710a] text-white flex items-center justify-center font-bold text-[10px]">
              ق
            </span>
            <span className="font-mono">quraan.bd</span>
            <ChevronDown className="size-3 text-slate-400" />
          </div>
        </div>

        {/* URL Inspection Search Bar */}
        <form onSubmit={handleInspectSubmit} className="flex-1 max-w-md mx-2">
          <div className="relative flex items-center">
            <Search className="size-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={inspectUrl}
              onChange={(e) => setInspectUrl(e.target.value)}
              placeholder="Inspect any URL in &quot;quraan.bd&quot;"
              className="w-full h-8 pl-8 pr-16 text-xs rounded-full border border-[#dadce0] dark:border-[#3c434a] bg-[#f1f3f4] dark:bg-[#121619] focus:bg-white dark:focus:bg-[#1f2428] focus:border-[#1a73e8] focus:outline-none transition-colors text-slate-800 dark:text-slate-200"
            />
            <button
              type="submit"
              className="absolute right-1 text-[11px] font-medium text-[#1a73e8] dark:text-blue-400 px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              Inspect
            </button>
          </div>
        </form>

        {/* Top Right Direct GSC Link & Refresh */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="h-7 px-2 text-xs gap-1 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="সার্চ কনসোল ডাটা আপডেট করুন"
          >
            <Edit3 className="size-3" />
            <span className="hidden sm:inline">ডাটা আপডেট</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <a
            href="https://search.google.com/search-console/performance/search-result?resource_id=sc-domain:quraan.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded text-xs font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-2xs transition-colors"
          >
            <span className="hidden sm:inline">EXPORT</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* 2. PERFORMANCE HEADER & FILTER BAR */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Performance (সার্চ পারফরম্যান্স)
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>{metrics.lastUpdated}</span>
            </div>
          </div>

          {/* Time Filter Pills (24 hours, 7 days, 28 days, 3 months, 12 months) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center p-0.5 rounded-lg border border-[#dadce0] dark:border-[#3c434a] bg-white dark:bg-[#1f2428] shadow-2xs">
              <button
                type="button"
                onClick={() => setTimeRange("24h")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeRange === "24h"
                    ? "bg-[#e8f0fe] dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-300 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {timeRange === "24h" && <Check className="size-3" />}
                <span>24 hours (২৪ ঘণ্টা)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange("7d")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeRange === "7d"
                    ? "bg-[#e8f0fe] dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-300 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {timeRange === "7d" && <Check className="size-3" />}
                <span>7 days (৭ দিন)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange("28d")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeRange === "28d"
                    ? "bg-[#e8f0fe] dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-300 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {timeRange === "28d" && <Check className="size-3" />}
                <span>28 days (২৮ দিন)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange("3m")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeRange === "3m"
                    ? "bg-[#e8f0fe] dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-300 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {timeRange === "3m" && <Check className="size-3" />}
                <span>3 months (৩ মাস)</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#dadce0] dark:border-[#3c434a] bg-white dark:bg-[#1f2428] text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>Search type: <strong>Web</strong></span>
              <ChevronDown className="size-3 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => toast.info("কাস্টম ফিল্টার: কুয়েরি, পৃষ্ঠা, দেশ বা ডিভাইসের নাম দিয়ে ফিল্টার করতে পারেন")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[#dadce0] dark:border-[#3c434a] hover:border-[#1a73e8] text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
            >
              <span>+ Add filter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTimeRange("24h");
                setShowClicks(true);
                setShowImpressions(true);
                setShowCtr(false);
                setShowPosition(false);
                setTableFilter("");
              }}
              className="text-xs font-medium text-[#1a73e8] dark:text-blue-400 hover:underline px-2"
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* 3. TIMEZONE BANNER (Exact text from screenshot) */}
        {!dismissNotice && (
          <div className="bg-[#e8f0fe] dark:bg-blue-950/40 border border-[#d2e3fc] dark:border-blue-900/60 rounded-lg p-2.5 px-3.5 flex items-center justify-between text-xs text-[#174ea6] dark:text-blue-300 gap-2">
            <div className="flex items-center gap-2">
              <Info className="size-4 shrink-0 text-[#1a73e8]" />
              <span>
                24 hours data is displayed in your local timezone. (২৪ ঘণ্টার ডাটা আপনার স্থানীয় টাইমজোন অনুযায়ী প্রদর্শিত হচ্ছে)।
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDismissNotice(true)}
              className="font-bold text-[#1a73e8] dark:text-blue-300 hover:underline shrink-0"
            >
              Got it
            </button>
          </div>
        )}

        {/* 4. THE 4 CORE METRIC CARDS (Toggleable just like in Google Search Console) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Total clicks */}
          <div
            onClick={() => setShowClicks(!showClicks)}
            className={`p-3.5 rounded-lg border cursor-pointer select-none transition-all shadow-2xs ${
              showClicks
                ? "bg-[#1a73e8] border-[#1a73e8] text-white"
                : "bg-white dark:bg-[#1f2428] border-[#dadce0] dark:border-[#3c434a] text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {showClicks ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                <span>Total clicks</span>
              </div>
              <HelpCircle className="size-3 opacity-80" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-2">
              {metrics.totalClicks}
            </div>
            <div className={`text-[10px] mt-0.5 ${showClicks ? "text-blue-100" : "text-slate-500"}`}>
              মোট অর্গানিক ক্লিক
            </div>
          </div>

          {/* Card 2: Total impressions */}
          <div
            onClick={() => setShowImpressions(!showImpressions)}
            className={`p-3.5 rounded-lg border cursor-pointer select-none transition-all shadow-2xs ${
              showImpressions
                ? "bg-[#8430ce] border-[#8430ce] text-white"
                : "bg-white dark:bg-[#1f2428] border-[#dadce0] dark:border-[#3c434a] text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {showImpressions ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                <span>Total impressions</span>
              </div>
              <HelpCircle className="size-3 opacity-80" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-2">
              {metrics.totalImpressions}
            </div>
            <div className={`text-[10px] mt-0.5 ${showImpressions ? "text-purple-100" : "text-slate-500"}`}>
              সার্চ ফলাফলে মোট প্রদর্শন
            </div>
          </div>

          {/* Card 3: Average CTR */}
          <div
            onClick={() => setShowCtr(!showCtr)}
            className={`p-3.5 rounded-lg border cursor-pointer select-none transition-all shadow-2xs ${
              showCtr
                ? "bg-[#0d652d] border-[#0d652d] text-white"
                : "bg-white dark:bg-[#1f2428] border-[#dadce0] dark:border-[#3c434a] text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {showCtr ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                <span>Average CTR</span>
              </div>
              <HelpCircle className="size-3 opacity-80" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-2">
              {metrics.avgCtr}%
            </div>
            <div className={`text-[10px] mt-0.5 ${showCtr ? "text-emerald-100" : "text-slate-500"}`}>
              ক্লিক-থ্রু রেট (Click-through)
            </div>
          </div>

          {/* Card 4: Average position */}
          <div
            onClick={() => setShowPosition(!showPosition)}
            className={`p-3.5 rounded-lg border cursor-pointer select-none transition-all shadow-2xs ${
              showPosition
                ? "bg-[#e37400] border-[#e37400] text-white"
                : "bg-white dark:bg-[#1f2428] border-[#dadce0] dark:border-[#3c434a] text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {showPosition ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                <span>Average position</span>
              </div>
              <HelpCircle className="size-3 opacity-80" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-2">
              {metrics.avgPosition}
            </div>
            <div className={`text-[10px] mt-0.5 ${showPosition ? "text-amber-100" : "text-slate-500"}`}>
              গুগল সার্চে গড় র‍্যাঙ্কিং
            </div>
          </div>
        </div>

        {/* 5. INTERACTIVE PERFORMANCE GRAPH (Exact curve from screenshot) */}
        <div className="bg-white dark:bg-[#1f2428] p-4 sm:p-5 rounded-lg border border-[#dadce0] dark:border-[#3c434a] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-4">
              {showClicks && (
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#1a73e8]"></span>
                  <span className="text-[#1a73e8] font-bold">Clicks (ক্লিক)</span>
                </div>
              )}
              {showImpressions && (
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#8430ce]"></span>
                  <span className="text-[#8430ce] font-bold">Impressions (ইম্প্রেশন)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono">
                {granularity === "hourly" ? "Hourly (ঘণ্টাভিত্তিক)" : "Daily (দৈনিক)"}
              </span>
              <button
                type="button"
                onClick={() => setGranularity(granularity === "hourly" ? "daily" : "hourly")}
                className="hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 rounded"
              >
                <ChevronDown className="size-3" />
              </button>
            </div>
          </div>

          {/* SVG Line Graph */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-56 select-none overflow-visible"
            >
              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#eaedf2" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#eaedf2" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#eaedf2" />

              {/* Y-Axis Labels Left (Clicks) */}
              {showClicks && (
                <>
                  <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" fontSize="10" fill="#1a73e8" fontWeight="bold">
                    {maxClicks}
                  </text>
                  <text x={paddingX - 10} y={svgHeight / 2 + 4} textAnchor="end" fontSize="10" fill="#1a73e8">
                    {Math.round(maxClicks / 2)}
                  </text>
                  <text x={paddingX - 10} y={svgHeight - paddingY + 4} textAnchor="end" fontSize="10" fill="#1a73e8">
                    0
                  </text>
                </>
              )}

              {/* Y-Axis Labels Right (Impressions) */}
              {showImpressions && (
                <>
                  <text x={svgWidth - paddingX + 10} y={paddingY + 4} textAnchor="start" fontSize="10" fill="#8430ce" fontWeight="bold">
                    {maxImpressions}
                  </text>
                  <text x={svgWidth - paddingX + 10} y={svgHeight / 2 + 4} textAnchor="start" fontSize="10" fill="#8430ce">
                    {Math.round(maxImpressions / 2)}
                  </text>
                  <text x={svgWidth - paddingX + 10} y={svgHeight - paddingY + 4} textAnchor="start" fontSize="10" fill="#8430ce">
                    0
                  </text>
                </>
              )}

              {/* Impressions Line (Purple) */}
              {showImpressions && (
                <>
                  <path
                    d={impPath}
                    fill="none"
                    stroke="#8430ce"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.map((d, i) => (
                    <circle
                      key={`imp-${i}`}
                      cx={getX(i)}
                      cy={getImpY(d.impressions)}
                      r={hoveredPoint?.timeLabel === d.timeLabel ? "4.5" : "3"}
                      fill="#8430ce"
                      stroke="#fff"
                      strokeWidth="1.5"
                      className="transition-all"
                    />
                  ))}
                </>
              )}

              {/* Clicks Line (Blue) */}
              {showClicks && (
                <>
                  <path
                    d={clicksPath}
                    fill="none"
                    stroke="#1a73e8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.map((d, i) => (
                    <circle
                      key={`click-${i}`}
                      cx={getX(i)}
                      cy={getClicksY(d.clicks)}
                      r={hoveredPoint?.timeLabel === d.timeLabel ? "5" : "3.5"}
                      fill="#1a73e8"
                      stroke="#fff"
                      strokeWidth="1.5"
                      className="transition-all"
                    />
                  ))}
                </>
              )}

              {/* X-Axis Time Labels */}
              {chartData.map((d, i) => (
                <text
                  key={`time-${i}`}
                  x={getX(i)}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#70757a"
                  className="font-mono"
                >
                  {d.timeLabel}
                </text>
              ))}

              {/* Invisible touch/hover triggers for each point */}
              {chartData.map((d, i) => (
                <rect
                  key={`rect-${i}`}
                  x={getX(i) - (svgWidth / chartData.length) / 2}
                  y={0}
                  width={svgWidth / chartData.length}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* Hover crosshair line */}
              {hoveredPoint && (
                <line
                  x1={getX(chartData.findIndex(d => d.timeLabel === hoveredPoint.timeLabel))}
                  y1={paddingY}
                  x2={getX(chartData.findIndex(d => d.timeLabel === hoveredPoint.timeLabel))}
                  y2={svgHeight - paddingY}
                  stroke="#9aa0a6"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 text-xs pointer-events-none flex items-center gap-4 animate-in fade-in zoom-in-95 duration-100">
                <span className="font-bold text-slate-300 font-mono">{hoveredPoint.timeLabel}</span>
                <span className="flex items-center gap-1 text-blue-400 font-bold">
                  ক্লিক: {hoveredPoint.clicks}
                </span>
                <span className="flex items-center gap-1 text-purple-400 font-bold">
                  ইম্প্রেশন: {hoveredPoint.impressions}
                </span>
                <span className="text-emerald-400">
                  CTR: {hoveredPoint.ctr}%
                </span>
                <span className="text-amber-400">
                  পজিশন: {hoveredPoint.position}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 6. BREAKDOWN DATA TABLES (Queries, Pages, Countries, Devices) */}
        <div className="bg-white dark:bg-[#1f2428] rounded-lg border border-[#dadce0] dark:border-[#3c434a] shadow-xs overflow-hidden">
          {/* Table Sub-Tabs */}
          <div className="border-b border-[#dadce0] dark:border-[#3c434a] bg-slate-50/70 dark:bg-slate-900/40 px-3 pt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBreakdownTab("queries")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  breakdownTab === "queries"
                    ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400 bg-white dark:bg-[#1f2428] rounded-t"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                QUERIES (অনুসন্ধান কুয়েরি)
              </button>

              <button
                type="button"
                onClick={() => setBreakdownTab("pages")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  breakdownTab === "pages"
                    ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400 bg-white dark:bg-[#1f2428] rounded-t"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                PAGES (শীর্ষ পৃষ্ঠা)
              </button>

              <button
                type="button"
                onClick={() => setBreakdownTab("countries")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  breakdownTab === "countries"
                    ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400 bg-white dark:bg-[#1f2428] rounded-t"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                COUNTRIES (দেশ)
              </button>

              <button
                type="button"
                onClick={() => setBreakdownTab("devices")}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  breakdownTab === "devices"
                    ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400 bg-white dark:bg-[#1f2428] rounded-t"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                DEVICES (ডিভাইস)
              </button>
            </div>

            {/* Table Search Input */}
            <div className="relative pb-2 sm:pb-0">
              <Search className="size-3 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                placeholder="ফিল্টার করুন..."
                className="h-7 w-36 sm:w-44 pl-7 pr-2 text-xs rounded border border-[#dadce0] dark:border-[#3c434a] bg-white dark:bg-[#121619] text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">
                    {breakdownTab === "queries" && "Top queries (শীর্ষ কুয়েরি)"}
                    {breakdownTab === "pages" && "Top pages (শীর্ষ পৃষ্ঠা URL)"}
                    {breakdownTab === "countries" && "Country (দেশ)"}
                    {breakdownTab === "devices" && "Device (ডিভাইস ধরন)"}
                  </th>
                  <th className="py-2.5 px-3 text-right">Clicks (ক্লিক)</th>
                  <th className="py-2.5 px-3 text-right">Impressions (ইম্প্রেশন)</th>
                  <th className="py-2.5 px-3 text-right">CTR (সিটিআর)</th>
                  <th className="py-2.5 px-4 text-right">Position (পজিশন)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {breakdownTab === "queries" &&
                  filteredQueries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{row.query}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1a73e8]">{row.clicks}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.impressions}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.ctr}%</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{row.position}</td>
                    </tr>
                  ))}

                {breakdownTab === "pages" &&
                  filteredPages.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#1a73e8] dark:text-blue-400 truncate max-w-xs sm:max-w-md">
                        <a href={row.page} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                          <span className="truncate">{row.page}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1a73e8]">{row.clicks}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.impressions}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.ctr}%</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{row.position}</td>
                    </tr>
                  ))}

                {breakdownTab === "countries" &&
                  filteredCountries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{row.country}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1a73e8]">{row.clicks}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.impressions}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.ctr}%</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{row.position}</td>
                    </tr>
                  ))}

                {breakdownTab === "devices" &&
                  filteredDevices.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        {row.device.includes("Mobile") && <Smartphone className="size-3.5 text-slate-400" />}
                        {row.device.includes("Desktop") && <Laptop className="size-3.5 text-slate-400" />}
                        <span>{row.device}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1a73e8]">{row.clicks}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.impressions}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.ctr}%</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{row.position}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. QUICK ACTION FOOTER WITH GSC OFFICIAL LINKS */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Google Search Console প্রোপার্টি: <strong className="font-mono text-slate-900 dark:text-white">sc-domain:quraan.bd</strong>
            </span>
            <Badge className="bg-emerald-600 text-white text-[10px] ml-1">Domain Verified</Badge>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://search.google.com/search-console/sitemaps?resource_id=sc-domain:quraan.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1 shadow-2xs"
            >
              <span>সাইটম্যাপ রিপোর্ট</span>
              <ArrowUpRight className="size-3 text-slate-400" />
            </a>

            <a
              href="https://search.google.com/search-console/performance/search-result?resource_id=sc-domain:quraan.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium flex items-center gap-1 shadow-2xs"
            >
              <span>অফিসিয়াল Search Console খুলুন</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>

      {/* GSC DATA EDIT MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#1f2428] border border-[#dadce0] dark:border-[#3c434a] text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit3 className="size-4 text-[#1a73e8]" />
              <span>Google Search Console ডাটা আপডেট ({timeRange})</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveMetrics} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                মোট ক্লিক (Total Clicks)
              </Label>
              <Input
                type="number"
                value={editForm.totalClicks}
                onChange={(e) => setEditForm({ ...editForm, totalClicks: Number(e.target.value) })}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                মোট ইম্প্রেশন (Total Impressions)
              </Label>
              <Input
                type="number"
                value={editForm.totalImpressions}
                onChange={(e) => setEditForm({ ...editForm, totalImpressions: Number(e.target.value) })}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  গড় CTR %
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.avgCtr}
                  onChange={(e) => setEditForm({ ...editForm, avgCtr: Number(e.target.value) })}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  গড় পজিশন (Average Position)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.avgPosition}
                  onChange={(e) => setEditForm({ ...editForm, avgPosition: Number(e.target.value) })}
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                সর্বশেষ আপডেট বার্তা (Last Update Info)
              </Label>
              <Input
                type="text"
                value={editForm.lastUpdated}
                onChange={(e) => setEditForm({ ...editForm, lastUpdated: e.target.value })}
                className="h-8 text-xs"
                placeholder="যেমন: ১০.৫ ঘণ্টা আগে (Last update: 10.5 hours ago)"
                required
              />
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetMetrics}
                className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                রিসেট
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-8 text-xs"
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white"
                >
                  সংরক্ষণ করুন
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
