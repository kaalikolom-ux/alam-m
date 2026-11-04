import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Users,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Eye,
  Info,
  Database
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  formatDurationBn,
  formatDurationEn,
  formatNumberBn,
  getAnalyticsEndpoint
} from "@/lib/visitorTracker";

interface VisitedPage {
  path: string;
  title?: string;
  timestamp: string;
}

interface VisitorSession {
  id?: string;
  session_id: string;
  ip_address: string;
  country: string;
  city: string;
  user_agent: string;
  device_type: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
  initial_path: string;
  current_path: string;
  page_views: number;
  visited_pages: VisitedPage[];
  first_seen_at: string;
  last_active_at: string;
  duration_seconds: number;
  is_online: boolean;
  status_label?: "online" | "idle" | "offline";
  referrer?: string;
}

interface AnalyticsApiResponse {
  summary: {
    totalSessions: number;
    liveNow: number;
    uniqueIps: number;
    avgDurationSeconds: number;
    totalPageViews: number;
  };
  durationDistribution: Array<{
    id: string;
    labelBn: string;
    labelEn: string;
    count: number;
    percentage: number;
  }>;
  hourlyTraffic: Array<{
    hour: string;
    visitors: number;
    totalMinutes: number;
  }>;
  deviceBreakdown: Array<{
    type: string;
    key: string;
    count: number;
    percentage: number;
  }>;
  countryBreakdown: Array<{
    code: string;
    nameBn: string;
    nameEn: string;
    flag: string;
    count: number;
    percentage: number;
  }>;
  topPages: Array<{
    path: string;
    count: number;
  }>;
  sessions: VisitorSession[];
  databaseConnected?: boolean;
}

export function VisitorAnalyticsAdmin() {
  const queryClient = useQueryClient();
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d" | "90d" | "1y" | "all">("today");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(20000); // 20s
  const [selectedSession, setSelectedSession] = useState<VisitorSession | null>(null);
  const [showSqlDialog, setShowSqlDialog] = useState(false);

  // Fetch Analytics from API
  const { data, isLoading, isFetching, refetch } = useQuery<AnalyticsApiResponse>({
    queryKey: ["admin-visitor-analytics", timeframe, statusFilter, searchQuery],
    queryFn: async () => {
      const endpoint = getAnalyticsEndpoint();
      const params = new URLSearchParams();
      if (timeframe) params.set("timeframe", timeframe);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) {
        throw new Error("ভিজিটর অ্যানালিটিক্স ডেটা লোড করা সম্ভব হয়নি");
      }
      return res.json();
    },
    refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval : false,
  });

  // Handle Copy IP
  const handleCopyIp = (ip: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      toast.success(`আইপি ${ip} কপি করা হয়েছে`);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!data?.sessions || data.sessions.length === 0) {
      toast.error("এক্সপোর্ট করার মতো কোনো ডেটা নেই");
      return;
    }

    const headers = [
      "Session ID",
      "IP Address",
      "Country",
      "City",
      "Duration (Seconds)",
      "Duration (Formatted)",
      "Page Views",
      "Current Path",
      "Device",
      "Browser",
      "OS",
      "First Seen",
      "Last Active",
      "Status",
    ];

    const rows = data.sessions.map((s) => [
      `"${s.session_id}"`,
      `"${s.ip_address}"`,
      `"${s.country}"`,
      `"${s.city || ""}"`,
      s.duration_seconds || 0,
      `"${formatDurationEn(s.duration_seconds || 0)}"`,
      s.page_views || 1,
      `"${s.current_path}"`,
      `"${s.device_type}"`,
      `"${s.browser}"`,
      `"${s.os}"`,
      `"${s.first_seen_at}"`,
      `"${s.last_active_at}"`,
      `"${s.is_online ? "Online" : "Offline"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visitor_analytics_${timeframe}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ভিজিটর ডেটা CSV ফরম্যাটে ডাউনলোড হয়েছে");
  };

  // Calculations for charts
  const maxHourlyVisitors = useMemo(() => {
    if (!data?.hourlyTraffic) return 10;
    const max = Math.max(...data.hourlyTraffic.map((h) => h.visitors), 0);
    return Math.max(max, 5);
  }, [data?.hourlyTraffic]);

  const summary = data?.summary || {
    totalSessions: 0,
    liveNow: 0,
    uniqueIps: 0,
    avgDurationSeconds: 0,
    totalPageViews: 0,
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] p-3.5 sm:p-4 rounded shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-[#2271b1]/10 text-[#2271b1] flex items-center justify-center">
            <Activity className="size-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#1d2327] dark:text-white flex items-center gap-2">
              <span>ভিজিটর ট্র্যাকিং ও অ্যানালিটিক্স</span>
              {summary.liveNow > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span>{formatNumberBn(summary.liveNow)} জন লাইভ</span>
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[#646970] dark:text-[#a7aaad] mt-0.5">
              ওয়েবসাইটের ভিজিটরদের আইপি এড্রেস, অবস্থান, সক্রিয় ব্রাউজিং সময় ও বিস্তারিত পরিসংখ্যান।
            </p>
          </div>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-[#f6f7f7] dark:bg-[#2c3338] p-0.5 text-xs">
            {(
              [
                { id: "today", label: "আজ (২৪ ঘণ্টা)" },
                { id: "7d", label: "৭ দিন" },
                { id: "30d", label: "৩০ দিন" },
                { id: "90d", label: "৩ মাস" },
                { id: "1y", label: "১ বছর" },
                { id: "all", label: "সব" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                  timeframe === t.id
                    ? "bg-[#2271b1] text-white shadow-2xs"
                    : "text-[#646970] dark:text-[#c3c4c7] hover:text-[#1d2327] dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Auto Refresh selector */}
          <select
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            className="h-8 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] px-2 text-xs text-[#2c3338] dark:text-[#f0f0f1] focus:ring-1 focus:ring-[#2271b1]"
            title="স্বয়ংক্রিয় রিফ্রেশ সময়"
          >
            <option value={10000}>প্রতি ১০ সেকেন্ড</option>
            <option value={20000}>প্রতি ২০ সেকেন্ড</option>
            <option value={30000}>প্রতি ৩০ সেকেন্ড</option>
            <option value={60000}>প্রতি ১ মিনিট</option>
            <option value={0}>অটো-রিফ্রেশ বন্ধ</option>
          </select>

          {/* Manual Refresh */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2.5 text-xs border-[#c3c4c7] dark:border-[#3c434a] hover:bg-[#f6f7f7] dark:hover:bg-[#2c3338] cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`size-3.5 mr-1 text-[#2271b1] ${isFetching ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </Button>

          {/* Export CSV */}
          <Button
            size="sm"
            onClick={handleExportCsv}
            className="h-8 px-2.5 text-xs bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer shadow-2xs"
            title="CSV ফাইলে এক্সপোর্ট করুন"
          >
            <FileSpreadsheet className="size-3.5 mr-1" />
            <span>CSV এক্সপোর্ট</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: লাইভ ভিজিটর এখন */}
        <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad] flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>লাইভ ভিজিটর এখন</span>
            </span>
            <div className="text-2xl font-bold text-[#1d2327] dark:text-white mt-1">
              {formatNumberBn(summary.liveNow)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              গত ৪৫ সেকেন্ডে সক্রিয় ব্রাউজিং
            </div>
          </div>
          <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="size-6" />
          </div>
        </div>

        {/* Card 2: ইউনিক ভিজিটর / আইপি */}
        <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad]">
              ইউনিক আইপি এড্রেস ({timeframe === "today" ? "আজ" : timeframe === "7d" ? "৭ দিন" : timeframe === "30d" ? "৩০ দিন" : timeframe === "90d" ? "৩ মাস" : timeframe === "1y" ? "১ বছর" : "ALL"})
            </span>
            <div className="text-2xl font-bold text-[#1d2327] dark:text-white mt-1">
              {formatNumberBn(summary.uniqueIps)}
            </div>
            <div className="text-[11px] text-[#646970] dark:text-[#a7aaad] mt-0.5">
              মোট সেশন: {formatNumberBn(summary.totalSessions)} টি
            </div>
          </div>
          <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="size-6" />
          </div>
        </div>

        {/* Card 3: গড় ব্রাউজিং সময় */}
        <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad]">
              গড় ব্রাউজিং সময় (কতোক্ষণ ব্রাউজ করেছে)
            </span>
            <div className="text-2xl font-bold text-[#1d2327] dark:text-white mt-1">
              {formatDurationBn(summary.avgDurationSeconds)}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              {formatDurationEn(summary.avgDurationSeconds)} গড় সক্রিয় সময়
            </div>
          </div>
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="size-6" />
          </div>
        </div>

        {/* Card 4: মোট পেজভিউ */}
        <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#646970] dark:text-[#a7aaad]">
              মোট পেজভিউ (Page Views)
            </span>
            <div className="text-2xl font-bold text-[#1d2327] dark:text-white mt-1">
              {formatNumberBn(summary.totalPageViews)}
            </div>
            <div className="text-[11px] text-[#646970] dark:text-[#a7aaad] mt-0.5">
              গড়ে প্রতি সেশনে{" "}
              {summary.totalSessions > 0
                ? formatNumberBn(Number((summary.totalPageViews / summary.totalSessions).toFixed(1)))
                : "১"}{" "}
              টি পেজ
            </div>
          </div>
          <div className="size-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="size-6" />
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE CHARTS & VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 1: ব্রাউজিং সময় ডিস্ট্রিবিউশন (Duration Breakdown) */}
        <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs overflow-hidden">
          <div className="bg-[#f6f7f7] dark:bg-[#2c3338] px-4 py-2.5 border-b border-[#c3c4c7] dark:border-[#3c434a] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
              <BarChart3 className="size-3.5 text-[#2271b1]" />
              <span>ভিজিটরদের ব্রাউজিং সময় বণ্টন (Duration Breakdown)</span>
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              মোট: {formatNumberBn(summary.totalSessions)}
            </span>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-[#646970] dark:text-[#a7aaad] leading-relaxed">
              পাঠকরা সাইটে কতোক্ষণ সময় কাটিয়েছেন তার বিভাজন। এটি পাঠকদের সম্পৃক্ততা (Engagement) পরিমাপ করতে সহায়তা করে:
            </p>

            <div className="space-y-3 pt-1">
              {data?.durationDistribution?.map((bucket) => {
                const isDeep = bucket.id === "deep" || bucket.id === "engaged";
                const barColor =
                  bucket.id === "deep"
                    ? "bg-emerald-500"
                    : bucket.id === "engaged"
                    ? "bg-[#2271b1]"
                    : bucket.id === "medium"
                    ? "bg-amber-500"
                    : bucket.id === "short"
                    ? "bg-blue-400"
                    : "bg-slate-400";

                return (
                  <div key={bucket.id} className="space-y-1 group">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1d2327] dark:text-white flex items-center gap-1.5">
                        <span className={`size-2.5 rounded-full ${barColor}`} />
                        <span>{bucket.labelBn}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">({bucket.labelEn})</span>
                      </span>
                      <span className="font-bold text-[#1d2327] dark:text-white">
                        {formatNumberBn(bucket.count)} জন ({formatNumberBn(bucket.percentage)}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-[#2c3338] rounded-full overflow-hidden flex">
                      <div
                        className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(bucket.percentage, bucket.count > 0 ? 3 : 0)}%` }}
                        title={`${bucket.labelBn}: ${bucket.count} জন`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#f0f0f1] dark:border-[#2c3338] flex items-center justify-between text-[11px] text-[#646970] dark:text-[#a7aaad]">
              <span>💡 <strong className="text-foreground">১৫+ মিনিট</strong> পাঠকরা গভীর অধ্যয়নকারী ও ক্বারী।</span>
              <span>গড় সময়: <strong>{formatDurationBn(summary.avgDurationSeconds)}</strong></span>
            </div>
          </div>
        </div>

        {/* GRAPH 2: সময়ভিত্তিক ট্রাফিক ট্রেন্ড (24-Hour Traffic Curve) */}
        <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs overflow-hidden">
          <div className="bg-[#f6f7f7] dark:bg-[#2c3338] px-4 py-2.5 border-b border-[#c3c4c7] dark:border-[#3c434a] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
              <TrendingUp className="size-3.5 text-emerald-600" />
              <span>২৪ ঘণ্টার ভিজিটর ট্রাফিক ট্রেন্ড (Hourly Traffic)</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">আজকের ঘণ্টাওয়ারি ভিজিটর</span>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            {/* Interactive SVG Chart */}
            <div className="h-44 w-full relative">
              <svg viewBox="0 0 480 140" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2271b1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2271b1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 35, 70, 105].map((y, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={y}
                    x2="480"
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-[#3c434a]"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                ))}

                {/* Data Points & Polygon */}
                {data?.hourlyTraffic && data.hourlyTraffic.length > 0 && (
                  <>
                    {/* Area Polygon */}
                    <polygon
                      points={`0,120 ${data.hourlyTraffic
                        .map((h, i) => {
                          const x = (i / (data.hourlyTraffic.length - 1)) * 480;
                          const y = 120 - (h.visitors / maxHourlyVisitors) * 105;
                          return `${x},${y}`;
                        })
                        .join(" ")} 480,120`}
                      fill="url(#trafficGradient)"
                    />

                    {/* Line Stroke */}
                    <polyline
                      fill="none"
                      stroke="#2271b1"
                      strokeWidth="2.5"
                      points={data.hourlyTraffic
                        .map((h, i) => {
                          const x = (i / (data.hourlyTraffic.length - 1)) * 480;
                          const y = 120 - (h.visitors / maxHourlyVisitors) * 105;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />

                    {/* Data Point Circles */}
                    {data.hourlyTraffic.map((h, i) => {
                      if (h.visitors === 0 && i % 3 !== 0) return null;
                      const x = (i / (data.hourlyTraffic.length - 1)) * 480;
                      const y = 120 - (h.visitors / maxHourlyVisitors) * 105;
                      return (
                        <g key={i} className="group cursor-pointer">
                          <circle
                            cx={x}
                            cy={y}
                            r={h.visitors > 0 ? 3.5 : 2}
                            className={
                              h.visitors > 0
                                ? "fill-[#2271b1] stroke-white dark:stroke-[#1e1e1e] stroke-2"
                                : "fill-slate-300 dark:fill-slate-700"
                            }
                          />
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1 font-mono">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Device & Country Mini Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#f0f0f1] dark:border-[#2c3338] text-xs">
              {/* Devices */}
              <div>
                <span className="font-semibold text-[#1d2327] dark:text-white block mb-1.5">
                  ডিভাইস ব্যবহারকারী:
                </span>
                <div className="space-y-1 text-[11px]">
                  {data?.deviceBreakdown?.map((dev) => (
                    <div key={dev.key} className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {dev.key === "mobile" ? (
                          <Smartphone className="size-3 text-[#2271b1]" />
                        ) : dev.key === "tablet" ? (
                          <Tablet className="size-3 text-amber-500" />
                        ) : (
                          <Monitor className="size-3 text-emerald-600" />
                        )}
                        <span>{dev.type}</span>
                      </span>
                      <strong className="text-[#1d2327] dark:text-white font-mono">
                        {formatNumberBn(dev.percentage)}% ({formatNumberBn(dev.count)})
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countries */}
              <div>
                <span className="font-semibold text-[#1d2327] dark:text-white block mb-1.5">
                  শীর্ষ দেশসমূহ:
                </span>
                <div className="space-y-1 text-[11px]">
                  {data?.countryBreakdown && data.countryBreakdown.length > 0 ? (
                    data.countryBreakdown.slice(0, 3).map((c) => (
                      <div key={c.code} className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{c.flag}</span>
                          <span className="truncate">{c.nameBn}</span>
                        </span>
                        <strong className="text-[#1d2327] dark:text-white font-mono shrink-0">
                          {formatNumberBn(c.count)} জন
                        </strong>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-[11px]">কোনো দেশের তথ্য নেই</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DETAILED VISITOR DATA TABLE */}
      <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs overflow-hidden">
        {/* Table Header with Search & Filter */}
        <div className="bg-[#f6f7f7] dark:bg-[#2c3338] px-4 py-3 border-b border-[#c3c4c7] dark:border-[#3c434a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
              <Users className="size-3.5 text-[#2271b1]" />
              <span>ভিজিটরদের আইপি ও ব্রাউজিং বিবরণী তালিকা ({formatNumberBn(data?.sessions?.length || 0)} টি সেশন)</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">
              প্রতিটি ভিজিটরের রিয়েল আইপি, কতোক্ষণ ব্রাউজ করেছে এবং কোন পেজে আছে
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="আইপি, দেশ বা পেজ খুঁজুন..."
                className="h-8 pl-8 pr-3 text-xs w-48 sm:w-60 rounded border-[#8c8f94] focus-visible:ring-[#2271b1]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-8 rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] px-2 text-xs text-[#2c3338] dark:text-[#f0f0f1]"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="online">🟢 শুধুমাত্র অনলাইন</option>
              <option value="offline">⚪ অফলাইন</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="size-6 animate-spin text-[#2271b1]" />
              <span>ভিজিটর ডেটা লোড হচ্ছে...</span>
            </div>
          ) : !data?.sessions || data.sessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <Info className="size-8 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-sm text-[#1d2327] dark:text-white">কোনো ভিজিটর ডেটা পাওয়া যায়নি</p>
              <p className="text-[11px]">অন্য ব্রাউজার বা ট্যাবে ওয়েবসাইটটি ভিজিট করলে এখানে তাৎক্ষণিক আইপি ও সময় দেখা যাবে।</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#c3c4c7] dark:border-[#3c434a] bg-[#f6f7f7]/60 dark:bg-[#2c3338]/60 text-[11px] font-bold text-[#1d2327] dark:text-white uppercase">
                  <th className="py-2.5 px-3.5">আইপি এড্রেস (IP Address)</th>
                  <th className="py-2.5 px-3.5">অবস্থান (Location)</th>
                  <th className="py-2.5 px-3.5">কতোক্ষণ ব্রাউজ করেছে (Duration)</th>
                  <th className="py-2.5 px-3.5">বর্তমান পেজ ও পেজভিউ</th>
                  <th className="py-2.5 px-3.5">ডিভাইস ও ব্রাউজার</th>
                  <th className="py-2.5 px-3.5">সর্বশেষ সক্রিয়</th>
                  <th className="py-2.5 px-3.5 text-center">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1] dark:divide-[#2c3338]">
                {data.sessions.map((session) => {
                  const isOnline = session.is_online;
                  const durationBn = formatDurationBn(session.duration_seconds || 0);
                  const durationEn = formatDurationEn(session.duration_seconds || 0);

                  // Color coding for duration
                  const isHighDuration = (session.duration_seconds || 0) >= 300;
                  const isMediumDuration = (session.duration_seconds || 0) >= 60;

                  return (
                    <tr
                      key={session.session_id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#252525] transition-colors"
                    >
                      {/* IP Address */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-semibold text-[#1d2327] dark:text-white">
                            {session.ip_address === "127.0.0.1" || session.ip_address === "::1"
                              ? "127.0.0.1 (লোকালহোস্ট)"
                              : session.ip_address}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyIp(session.ip_address)}
                            className="p-1 text-muted-foreground hover:text-[#2271b1] transition-colors rounded cursor-pointer"
                            title="আইপি কপি করুন"
                          >
                            {copiedIp === session.ip_address ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                          ID: {session.session_id.slice(0, 14)}...
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">
                            {session.country === "BD"
                              ? "🇧🇩"
                              : session.country === "US"
                              ? "🇺🇸"
                              : session.country === "SA"
                              ? "🇸🇦"
                              : session.country === "GB"
                              ? "🇬🇧"
                              : session.country === "IN"
                              ? "🇮🇳"
                              : session.country === "MY"
                              ? "🇲🇾"
                              : session.country === "AE"
                              ? "🇦🇪"
                              : "🌐"}
                          </span>
                          <div>
                            <div className="font-medium text-[#1d2327] dark:text-white">
                              {session.city && session.city !== "Unknown" ? session.city : session.country}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {session.country}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Browsing Duration */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs ${
                              isHighDuration
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                : isMediumDuration
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                : "bg-slate-200/80 dark:bg-[#2c3338] text-[#2c3338] dark:text-[#c3c4c7]"
                            }`}
                          >
                            <Clock className="size-3" />
                            <span>{durationBn}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {durationEn} ({formatNumberBn(session.duration_seconds || 0)} সেকেন্ড)
                          </div>
                        </div>
                      </td>

                      {/* Current Page & Page Views */}
                      <td className="py-3 px-3.5">
                        <div className="max-w-[200px]">
                          <a
                            href={session.current_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#2271b1] hover:underline flex items-center gap-1 truncate"
                            title={session.current_path}
                          >
                            <span className="truncate">{session.current_path}</span>
                            <ArrowUpRight className="size-3 shrink-0" />
                          </a>
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] h-4.5 px-1 font-mono">
                              {formatNumberBn(session.page_views || 1)} পেজভিউ
                            </Badge>
                            <span>•</span>
                            <span className="truncate">
                              {session.visited_pages?.length || 1} টি পাতা ব্রাউজ
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-medium text-[#1d2327] dark:text-white">
                            {session.device_type === "mobile" ? (
                              <Smartphone className="size-3 text-[#2271b1]" />
                            ) : session.device_type === "tablet" ? (
                              <Tablet className="size-3 text-amber-500" />
                            ) : (
                              <Monitor className="size-3 text-emerald-600" />
                            )}
                            <span>{session.device_type === "mobile" ? "মোবাইল" : session.device_type === "tablet" ? "ট্যাবলেট" : "ডেস্কটপ"}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {session.browser} • {session.os}
                          </div>
                        </div>
                      </td>

                      {/* Last Active Timestamp */}
                      <td className="py-3 px-3.5">
                        <div className="text-[#1d2327] dark:text-white font-medium text-[11px]">
                          {new Date(session.last_active_at).toLocaleTimeString("bn-BD")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          শুরু: {new Date(session.first_seen_at).toLocaleTimeString("bn-BD")}
                        </div>
                      </td>

                      {/* Online Status */}
                      <td className="py-3 px-3.5 text-center">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                            <span>অনলাইন</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <span>অফলাইন</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSession(session)}
                          className="h-7 px-2 text-xs text-[#2271b1] hover:bg-[#2271b1]/10 cursor-pointer"
                        >
                          <Eye className="size-3 mr-1" />
                          <span>ডিটেইলস</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3.5 bg-[#f6f7f7] dark:bg-[#2c3338] border-t border-[#c3c4c7] dark:border-[#3c434a] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#646970] dark:text-[#a7aaad] gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="size-3.5 text-[#2271b1]" />
            <span>
              আইপি অ্যাড্রেস ক্লাউডফ্লেয়ার এজ হেডার (CF-Connecting-IP) থেকে সরাসরি সুরক্ষিতভাবে নির্ণয় করা হয়।
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlDialog(true)}
            className="text-[#2271b1] hover:underline font-medium flex items-center gap-1 cursor-pointer"
          >
            <Database className="size-3" />
            <span>ডেটাবেস স্কিমা ও মাইগ্রেশন দেখুন</span>
          </button>
        </div>
      </div>

      {/* 5. MODAL: DETAILED VISITOR CLICK-STREAM HISTORY */}
      {selectedSession && (
        <Dialog open={Boolean(selectedSession)} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="size-4 text-[#2271b1]" />
                <span>ভিজিটর সেশন বিবরণী — {selectedSession.ip_address}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                সেশন আইডি: <code className="font-mono">{selectedSession.session_id}</code>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground block">মোট ব্রাউজিং সময়:</span>
                  <strong className="text-foreground text-sm font-semibold">
                    {formatDurationBn(selectedSession.duration_seconds || 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">মোট পেজভিউ:</span>
                  <strong className="text-foreground text-sm font-semibold">
                    {formatNumberBn(selectedSession.page_views || 1)} টি পেজ
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">লাইভ স্ট্যাটাস:</span>
                  <strong className={selectedSession.is_online ? "text-emerald-600 font-bold" : "text-slate-500"}>
                    {selectedSession.is_online ? "🟢 অনলাইন" : "⚪ অফলাইন"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">অবস্থান:</span>
                  <span className="text-foreground font-medium">
                    {selectedSession.city || ""}, {selectedSession.country}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">ডিভাইস / ওএস:</span>
                  <span className="text-foreground font-medium">
                    {selectedSession.device_type} • {selectedSession.os}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">ব্রাউজার:</span>
                  <span className="text-foreground font-medium">{selectedSession.browser}</span>
                </div>
              </div>

              {/* Visited Pages Clickstream */}
              <div>
                <h4 className="font-bold text-foreground text-xs mb-2 flex items-center gap-1.5">
                  <Layers className="size-3.5 text-[#2271b1]" />
                  <span>ভিজিট করা পেজসমূহের ক্রম (Click-stream):</span>
                </h4>
                {selectedSession.visited_pages && selectedSession.visited_pages.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedSession.visited_pages.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border border-border/60 bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <a
                            href={p.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#2271b1] hover:underline flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{p.path}</span>
                            <ArrowUpRight className="size-3 shrink-0" />
                          </a>
                          {p.title && (
                            <div className="text-[11px] text-muted-foreground truncate">{p.title}</div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono ml-2">
                          {new Date(p.timestamp).toLocaleTimeString("bn-BD")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs italic">
                    বর্তমান পাথ: {selectedSession.current_path}
                  </p>
                )}
              </div>

              {/* User Agent & Referrer */}
              <div className="space-y-1 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                <div>
                  <strong>ইউজার এজেন্ট:</strong> <span className="font-mono">{selectedSession.user_agent}</span>
                </div>
                {selectedSession.referrer && (
                  <div>
                    <strong>রেফারার:</strong> <span className="font-mono">{selectedSession.referrer}</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. MODAL: SQL SCHEMA INFO */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Database className="size-4 text-[#2271b1]" />
              <span>ভিজিটর সেশন ডেটাবেস স্কিমা (Postgres / Supabase)</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              এই টেবিলটিতে কমপক্ষে ১ বছর (৩৬৫ দিন) এর ভিজিটর আইপি, সময় ও সেশন ডেটা সংরক্ষিত হয়। ১ বছরের বেশি পুরানো ডেটা স্বয়ংক্রিয়ভাবে মুছে যায়।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs pt-1">
            <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed">
              {`-- ১. টেবিল তৈরি
CREATE TABLE public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  current_path TEXT,
  page_views INTEGER DEFAULT 1,
  visited_pages JSONB DEFAULT '[]'::jsonb,
  duration_seconds INTEGER DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_online BOOLEAN DEFAULT true
);

-- ২. ১ বছর (৩৬৫ দিন) এর বেশি পুরানো ডেটা স্বয়ংক্রিয়ভাবে মুছে ফেলার ফাংশন
CREATE OR REPLACE FUNCTION public.cleanup_old_visitor_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.visitor_sessions
  WHERE last_active_at < now() - INTERVAL '365 days';
END;
$$;`}
            </div>
            <p className="text-[11px] text-muted-foreground">
              মাইগ্রেশন ফাইল <code>supabase/migrations/20260918210000_create_visitor_sessions.sql</code> এ সংকলিত আছে।
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
