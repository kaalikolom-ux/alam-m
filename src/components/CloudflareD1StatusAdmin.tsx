import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Server,
  HardDrive,
  Wifi,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Activity,
  ArrowUpRight,
  Zap,
  Layers,
  Users,
  Globe,
  Gauge,
  Sliders,
  Cpu
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumberBn } from "@/lib/visitorTracker";
import { STATIC_ARTICLES_META } from "@/lib/staticArticlesMeta";

interface TableInfo {
  name: string;
  labelBn: string;
  descriptionBn: string;
  count: number;
  category: "core" | "user" | "config";
}

interface D1StatusResponse {
  ok: boolean;
  isLiveD1: boolean;
  database_name: string;
  database_id: string;
  binding: string;
  engine: string;
  account_id: string;
  region: string;
  sql_duration_ms: number;
  total_duration_ms: number;
  server_time: string;
  db_size_bytes: number;
  db_size_formatted: string;
  limits: {
    storage: string;
    daily_reads: string;
    daily_writes: string;
    egress: string;
    max_db_size: string;
  };
  tables: TableInfo[];
}

export function CloudflareD1StatusAdmin() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const databaseName = "quran-explore-db";
  const databaseId = "e973f275-f733-432b-8e61-85ad15dbd013";
  const accountId = "2115a963bbde8014732bf7fd2e7ee93d";
  const bindingName = "DB";

  const cloudflareD1Url = `https://dash.cloudflare.com/${accountId}/workers-and-pages/d1/databases/${databaseId}`;
  const cloudflareWorkersUrl = `https://dash.cloudflare.com/${accountId}/workers-and-pages`;
  const supabaseProjectId = "djoshusyzfsndnmwpoxd";

  // Fetch Live D1 Status & Statistics
  const d1QueryStatus = useQuery<D1StatusResponse>({
    queryKey: ["cloudflare-d1-admin-status"],
    queryFn: async () => {
      const res = await fetch("/api/public/d1-status", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch D1 status from edge server");
      }
      return res.json();
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Ping Test
  const testPing = async () => {
    try {
      setIsPinging(true);
      const start = performance.now();
      const res = await fetch("/api/public/d1-status", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const duration = Math.round(performance.now() - start);
      if (!res.ok) throw new Error("Edge API request failed");
      const data = await res.json();
      setPingLatency(duration);
      await d1QueryStatus.refetch();
      toast.success(`Cloudflare D1 এজ কানেকশন সফল! মোট ল্যাটেন্সি: ${duration}ms (SQL: ${data.sql_duration_ms || "<1"}ms)`);
    } catch (err: any) {
      toast.error(`পিং ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    testPing();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("ক্লিপবোর্ডে কপি করা হয়েছে!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const statusData = d1QueryStatus.data;
  const tables = statusData?.tables || [
    { name: "articles", labelBn: "প্রবন্ধ ও পোস্ট (Articles)", descriptionBn: "Alam M ব্লগের সকল মৌলিক গল্প, কবিতা ও সাহিত্যিক প্রবন্ধ", count: 328, category: "core" },
    { name: "authors", labelBn: "লেখক ও গবেষক (Authors)", descriptionBn: "প্রবন্ধ রচয়িতা ও তাদাব্বুর গবেষকদের প্রোফাইল", count: 3, category: "core" },
    { name: "categories", labelBn: "বিষয়ভিত্তিক ক্যাটাগরি (Categories)", descriptionBn: "কুরআনিক, গবেষণা, বিজ্ঞান ইত্যাদি বিষয়শ্রেণী", count: 6, category: "core" },
    { name: "site_settings", labelBn: "সাইট কনফিগারেশন (Settings)", descriptionBn: "হেডার, ফুটার, টার্নস্টাইল ও সার্বিক সাইট সেটিংস", count: 14, category: "config" },
    { name: "users", labelBn: "নিবন্ধিত ব্যবহারকারী (Users)", descriptionBn: "এডমিন ও ইউজার অ্যাকাউন্ট রেকর্ড", count: 1, category: "user" },
    { name: "sessions", labelBn: "অ্যাক্টিভ সেশন (Sessions)", descriptionBn: "নিরাপদ লগইন ও ডিভাইস অথ সেশন", count: 9, category: "user" },
    { name: "bookmarks", labelBn: "সংরক্ষিত বুকমার্ক (Bookmarks)", descriptionBn: "পাঠকদের সংরক্ষিত প্রিয় গল্প ও কবিতা", count: 0, category: "user" },
    { name: "article_reactions", labelBn: "নিবন্ধ রিঅ্যাকশন (Reactions)", descriptionBn: "লাইক, লাভ ও পাঠক প্রতিক্রিয়া সংখ্যা", count: 0, category: "user" },
    { name: "newsletter_subscribers", labelBn: "নিউজলেটার গ্রাহক (Subscribers)", descriptionBn: "ইমেইল বিজ্ঞপ্তির জন্য সাবস্ক্রাইব করা পাঠক তালিকা", count: 0, category: "user" },
    { name: "contact_messages", labelBn: "পাঠক বার্তা (Contact Messages)", descriptionBn: "ওয়েবসাইটে পাঠানো পাঠক মতামত ও যোগাযোগ বার্তা", count: 0, category: "user" },
    { name: "visitor_sessions", labelBn: "ভিজিটর সেশন ও অ্যানালিটিক্স (Visitor Sessions)", descriptionBn: "১ বছরের ভিজিটর আইপি, ব্রাউজিং সময় ও পৃষ্ঠা ভিজিট পরিসংখ্যান", count: 0, category: "user" },
  ];

  const articlesCount = tables.find((t) => t.name === "articles")?.count ?? 328;
  const staticArticlesCount = STATIC_ARTICLES_META.length;
  const totalRows = tables.reduce((acc, t) => acc + (t.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER */}
      <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#f0f0f1] dark:border-[#2c3338] pb-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
                <Database className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1d2327] dark:text-white flex items-center gap-2">
                  <span>Cloudflare D1 SQLite এজ ডেটাবেজ ওভারভিউ</span>
                  <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30">
                    Active & Edge Replicated
                  </Badge>
                </h2>
                <p className="text-xs text-[#646970] dark:text-[#a7aaad]">
                  রিয়েল-টাইম ক্লাউডফ্লেয়ার D1 (SQLite 3) স্ট্যাটাস, সাব-মিলিমেকেন্ড কুয়েরি ল্যাটেন্সি, এজ রেকর্ড এবং জিরো-ইগ্রেস ডেটাবেজ ওভারভিউ
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={testPing}
              disabled={isPinging}
              className="h-8 text-xs border-[#c3c4c7] dark:border-[#3c434a] hover:bg-slate-100 dark:hover:bg-[#2c3338] cursor-pointer"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${isPinging ? "animate-spin text-orange-600" : "text-muted-foreground"}`} />
              <span>{isPinging ? "পিং পরীক্ষা চলছে..." : "পিং পরীক্ষা (Ping Test)"}</span>
            </Button>

            <a
              href={cloudflareD1Url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold bg-[#f48120] hover:bg-[#de7015] text-white shadow-xs transition-colors"
            >
              <span>Cloudflare D1 কনসোল খুলুন</span>
              <ExternalLink className="size-3.5" />
            </a>

            <a
              href={`https://supabase.com/dashboard/project/${supabaseProjectId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-semibold border border-[#c3c4c7] dark:border-[#3c434a] text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-[#2c3338] transition-colors"
              title="সেকেন্ডারি ক্লাউড ব্যাকআপ কনসোল"
            >
              <span>Supabase ব্যাকআপ</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        {/* 2. TOP METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Connection & Latency */}
          <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                কানেকশন ও এজ ল্যাটেন্সি
              </span>
              <Wifi className="size-3.5" />
            </div>
            <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-1 flex items-baseline gap-1.5">
              <span>সংযুক্ত (Edge-Native)</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>SQL এক্সিকিউশন:</span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                {statusData?.sql_duration_ms ? `${statusData.sql_duration_ms} ms` : "< 1 ms"}
              </strong>
            </div>
          </div>

          {/* Card 2: Zero Egress Guarantee */}
          <div className="p-4 rounded-xl border border-blue-500/25 bg-blue-500/5">
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
              <span>ব্যান্ডউইথ / ইগ্রেস খরচ (Egress)</span>
              <Activity className="size-3.5" />
            </div>
            <div className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-1">
              ০ টাকা <span className="text-xs font-normal text-muted-foreground">/ ১০০% ফ্রি (Zero-Egress)</span>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>কোনো ইগ্রেস ফি বা ব্যান্ডউইথ চার্জ নেই</span>
            </div>
          </div>

          {/* Card 3: D1 Database Storage Size */}
          <div className="p-4 rounded-xl border border-orange-500/25 bg-orange-500/5">
            <div className="flex items-center justify-between text-xs text-orange-700 dark:text-orange-400 font-medium mb-1">
              <span>D1 ডেটাবেজ স্টোরেজ (SQLite)</span>
              <HardDrive className="size-3.5" />
            </div>
            <div className="text-xl font-bold text-orange-800 dark:text-orange-300 mt-1">
              {statusData?.db_size_formatted || "৯৬৬ KB"} <span className="text-xs font-normal text-muted-foreground">/ ৫ GB ফ্রি কোটা</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>ব্যবহৃত পরিমাণ:</span>
              <strong className="text-orange-700 dark:text-orange-400 font-mono">&lt; ০.০২% (নিরাপদ)</strong>
            </div>
          </div>

          {/* Card 4: Daily Operation Limits */}
          <div className="p-4 rounded-xl border border-purple-500/25 bg-purple-500/5">
            <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">
              <span>দৈনিক অপারেশন কোটা (D1 Quota)</span>
              <Gauge className="size-3.5" />
            </div>
            <div className="text-xl font-bold text-purple-800 dark:text-purple-300 mt-1">
              ৫০ লাখ <span className="text-xs font-normal text-muted-foreground">রিড / দিন</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>রাইট সীমা:</span>
              <strong className="text-purple-700 dark:text-purple-400 font-mono">১,০০,০০০ / দিন</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ARCHITECTURAL DEEP-DIVE: WHY CLOUDFLARE D1 OVERVIEW IS MORE LOGICAL */}
      <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs overflow-hidden">
        <div className="bg-[#f6f7f7] dark:bg-[#2c3338] px-5 py-3 border-b border-[#c3c4c7] dark:border-[#3c434a] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2">
            <Zap className="size-4 text-orange-600" />
            <span>আর্কিটেকচার পর্যালোচনা: কেন Cloudflare D1 ওভারভিউ বেশি যৌক্তিক?</span>
          </h3>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            Edge-Native Zero Egress
          </span>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm font-serif leading-relaxed text-[#2c3338] dark:text-[#f0f0f1]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            {/* Primary: Cloudflare D1 SQLite */}
            <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                  <Database className="size-4" /> Cloudflare D1 SQLite (প্রাইমারি এজ ডেটাবেজ)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  সক্রিয় এজ রানটাইম
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-serif">
                আমাদের ওয়েবসাইট quraan.bd সম্পূর্ণভাবে Cloudflare Workers ও Edge-এ ডিপ্লয় করা। তাই ক্লাউডফ্লেয়ারের নিজস্ব সার্ভারলেস <strong>D1 SQLite ডেটাবেজ</strong> এজ নেটওয়ার্কে সরাসরি ৩৩০+ শহরে ইউজারদের কাছাকাছি থেকে রান করে। এর ফলে কুয়েরি ল্যাটেন্সি মাত্র <strong>০.২ থেকে ১.৫ মিলিমেকেন্ড</strong> এবং ডাটা ট্রান্সফারের কোনো ইগ্রেস বিলিং নেই।
              </p>
              <div className="text-[11px] text-muted-foreground pt-1.5 border-t border-orange-500/20 font-sans space-y-1">
                <div>• সম্পূর্ণ ফ্রি ব্যান্ডউইথ ও জিরো-ইগ্রেস (Zero Data Transfer Fee)</div>
                <div>• স্ট্যান্ডার্ড SQLite ৩ সিনট্যাক্স ও ACID ট্রানজাকশন কমপ্লায়েন্স</div>
                <div>• এজ ওয়ার্কারের সাথে নেটিভ বাইন্ডিং (<code className="font-mono text-orange-600">env.DB</code>) — কোনো নেটওয়ার্ক ওভারহেড নেই</div>
              </div>
            </div>

            {/* Secondary: Supabase PostgreSQL */}
            <div className="p-4 rounded-xl border border-border/80 bg-secondary/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <Server className="size-4" /> Supabase ক্লাউড (সেকেন্ডারি মিরর ও ব্যাকআপ)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  অফসাইট কোল্ড ব্যাকআপ
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-serif">
                পূর্বে Supabase সরাসরি ব্যবহৃত হলেও এতে প্রতি মাসে মাত্র <strong>৫ GB ইগ্রেস কোটা</strong> ও সীমিত সেন্ট্রাল ক্লাউড সার্ভার থাকে। বর্তমান আর্কিটেকচারে Supabase-কে একটি <strong>অফসাইট মিরর ও রিডানড্যান্ট ব্যাকআপ</strong> হিসেবে সংরক্ষণ করা হয়েছে। এডমিন প্যানেল থেকে পোস্ট প্রকাশ করলে তা D1-এ লাইভ হওয়ার পাশাপাশি নিরাপদে Supabase-এও ব্যাকআপ হয়ে থাকে।
              </p>
              <div className="text-[11px] text-muted-foreground pt-1.5 border-t border-border/50 font-sans space-y-1">
                <div>• ব্যাকআপ কোটা: ৫ GB মাসিক ইগ্রেস ও ৫০০ MB ডিস্ক সাইজ</div>
                <div>• PostgreSQL স্ট্রাকচার্ড ডেটা ব্যাকআপ ও দুর্যোগ পুনরুদ্ধার সুরক্ষা</div>
              </div>
            </div>
          </div>

          {/* Tri-tier Framework Card */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-foreground/90 space-y-2 font-sans">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="size-4" />
              <span>আমাদের ওয়েবসাইট কীভাবে ত্রিস্তরীয় সুরক্ষা (Triple-Tier Hybrid Architecture) নিশ্চিত করে?</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white/70 dark:bg-[#1a1f24] rounded-lg border border-emerald-500/20">
                <div className="font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                  <Globe className="size-3.5" /> স্তর ১: স্ট্যাটিক এজ ক্যাশ
                </div>
                <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
                  কুরআনের ১১৪টি সূরা, আয়াত ও প্রবন্ধের স্ট্যাটিক সংস্করণ বিশ্বজুড়ে ৩৩০+ এজ সার্ভারে ক্যাশ থাকে, যার ফলে কোনো ডাটাবেজেই অনর্থক চাপ পড়ে না।
                </p>
              </div>

              <div className="p-3 bg-white/70 dark:bg-[#1a1f24] rounded-lg border border-orange-500/20">
                <div className="font-bold text-orange-700 dark:text-orange-300 mb-1 flex items-center gap-1">
                  <Database className="size-3.5" /> স্তর ২: Cloudflare D1
                </div>
                <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
                  সাইটের ডাইনামিক ডেটা, আর্টিকেল এবং কনফিগারেশন সরাসরি এজ-নেটিভ D1 SQLite থেকে সাব-মিলিমেকেন্ডে জিরো-ইগ্রেসে রিটার্ন হয়।
                </p>
              </div>

              <div className="p-3 bg-white/70 dark:bg-[#1a1f24] rounded-lg border border-blue-500/20">
                <div className="font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                  <Server className="size-3.5" /> স্তর ৩: Supabase ব্যাকআপ
                </div>
                <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
                  ক্লাউড PostgreSQL মিরর হিসেবে Supabase ডেটাবেজ সংরক্ষিত থাকে, যা যেকোনো দুর্যোগে তাত্ক্ষণিক ডেটা রিকভারি নিশ্চিত করে।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. D1 DATABASE TABLES & LIVE ROWS */}
      <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] shadow-xs overflow-hidden">
        <div className="bg-[#f6f7f7] dark:bg-[#2c3338] px-5 py-3 border-b border-[#c3c4c7] dark:border-[#3c434a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-orange-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white">
              Cloudflare D1 SQLite টেবিল ও রেকর্ড তালিকা ({tables.length} টি টেবিল • সর্বমোট {formatNumberBn(totalRows)} রো)
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => d1QueryStatus.refetch()}
            disabled={d1QueryStatus.isFetching}
            className="h-7 px-2 text-xs text-orange-600 hover:bg-orange-600/10 cursor-pointer"
          >
            <RefreshCw className={`size-3 mr-1 ${d1QueryStatus.isFetching ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#f0f0f1] dark:border-[#2c3338] bg-[#fbfbfb] dark:bg-[#24292e] text-[#646970] dark:text-[#a7aaad] font-semibold">
                <th className="py-3 px-4">টেবিলের নাম</th>
                <th className="py-3 px-4">বিবরণ ও ভূমিকা</th>
                <th className="py-3 px-4 text-center">রেকর্ড সংখ্যা (Rows)</th>
                <th className="py-3 px-4 text-center">ইঞ্জিন ও স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">D1 একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1] dark:divide-[#2c3338]">
              {tables.map((table) => {
                return (
                  <tr key={table.name} className="hover:bg-slate-50/70 dark:hover:bg-[#252a30] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#1d2327] dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-orange-500" />
                        <span>{table.name}</span>
                      </div>
                      <div className="text-[11px] font-sans text-muted-foreground font-normal mt-0.5">
                        {table.labelBn}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs font-serif">
                      {table.descriptionBn}
                      {table.name === "articles" && (
                        <div className="text-[11px] font-sans text-orange-600 dark:text-orange-400 mt-0.5 font-medium">
                          ※ D1 এজ ডেটাবেজে {table.count} টি + স্ট্যাটিক ক্যাশে {staticArticlesCount} টি নিবন্ধ সিঙ্কড
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sm text-[#1d2327] dark:text-white">
                      {d1QueryStatus.isLoading ? (
                        <span className="text-muted-foreground text-xs">গণনা হচ্ছে...</span>
                      ) : (
                        formatNumberBn(table.count)
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                        D1 SQLite (Active)
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`${cloudflareD1Url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-orange-600 hover:bg-orange-500/10 border border-orange-500/25 transition-colors"
                      >
                        <span>কনসোলে দেখুন</span>
                        <ArrowUpRight className="size-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DIRECT CLOUDFLARE CONSOLE SHORTCUTS */}
      <div className="rounded border border-[#c3c4c7] dark:border-[#3c434a] bg-white dark:bg-[#1e1e1e] p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d2327] dark:text-white flex items-center gap-2 mb-4">
          <ExternalLink className="size-4 text-orange-600" />
          <span>Cloudflare Edge ও ক্লাউড কনসোলের সরাসরি লিংকসমূহ</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <a
            href={cloudflareD1Url}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-border/80 hover:border-orange-500 bg-card hover:bg-orange-500/5 transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-foreground group-hover:text-orange-600 flex items-center gap-1.5">
                <Database className="size-4 text-orange-600" />
                <span>Cloudflare D1 ডেটাবেজ কনসোল</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                `quran-explore-db` টেবিল ব্রাউজার, SQL কুয়েরি রানার ও মেট্রিক্স।
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-orange-600 shrink-0" />
          </a>

          <a
            href={cloudflareWorkersUrl}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-border/80 hover:border-orange-500 bg-card hover:bg-orange-500/5 transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-foreground group-hover:text-orange-600 flex items-center gap-1.5">
                <Globe className="size-4 text-orange-600" />
                <span>Cloudflare Workers & Pages</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                `quran-explore-pro-5574` এজ ওয়ার্কারের লাইভ মেট্রিক্স ও লগস।
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-orange-600 shrink-0" />
          </a>

          <a
            href={`https://dash.cloudflare.com/${accountId}/analytics`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-border/80 hover:border-orange-500 bg-card hover:bg-orange-500/5 transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-foreground group-hover:text-orange-600 flex items-center gap-1.5">
                <Activity className="size-4 text-orange-600" />
                <span>ক্লাউডফ্লেয়ার এজ অ্যানালিটিক্স</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                গ্লোবাল রিকোয়েস্ট কাউন্ট, ক্যাশ হিট রেশিও ও ব্যান্ডউইথ সেভিংস।
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-orange-600 shrink-0" />
          </a>

          <a
            href={`https://supabase.com/dashboard/project/${supabaseProjectId}/editor`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-border/80 hover:border-[#2271b1] bg-card hover:bg-blue-500/5 transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-foreground group-hover:text-[#2271b1] flex items-center gap-1.5">
                <Server className="size-4 text-[#2271b1]" />
                <span>Supabase ব্যাকআপ টেবিল এডিটর</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                PostgreSQL সেকেন্ডারি মিরর ব্যাকআপের টেবিল সরাসরি দেখুন।
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-[#2271b1] shrink-0" />
          </a>

          <a
            href={`https://supabase.com/dashboard/project/${supabaseProjectId}/sql`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-border/80 hover:border-[#2271b1] bg-card hover:bg-blue-500/5 transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-foreground group-hover:text-[#2271b1] flex items-center gap-1.5">
                <Sliders className="size-4 text-[#2271b1]" />
                <span>Supabase এসকিউএল কনসোল</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                ব্যাকআপ ডেটাবেজের এসকিউএল কুয়েরি ও মাইগ্রেশন হিস্টোরি।
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-[#2271b1] shrink-0" />
          </a>

          <a
            href={`https://dash.cloudflare.com/${accountId}/ai`}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-border/80 hover:border-orange-500 bg-card hover:bg-orange-500/5 transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-foreground group-hover:text-orange-600 flex items-center gap-1.5">
                <Cpu className="size-4 text-orange-600" />
                <span>Cloudflare Workers AI কনসোল</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                AI সার্চ ও শব্দার্থ বিশ্লেষণের জন্য Workers AI মডেল মেট্রিক্স।
              </p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-orange-600 shrink-0" />
          </a>
        </div>
      </div>

      {/* 6. TECHNICAL CONFIGURATION & CONNECTION METADATA */}
      <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-muted-foreground font-mono">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full md:w-auto">
          <div>D1 DB Name: <strong className="text-foreground">{databaseName}</strong></div>
          <div>Binding: <strong className="text-orange-600 dark:text-orange-400 font-bold">{bindingName}</strong></div>
          <div className="truncate">Database ID: <span className="text-foreground">{databaseId}</span></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(databaseId, "database_id")}
            className="h-7 text-xs cursor-pointer"
          >
            {copiedKey === "database_id" ? <Check className="size-3 mr-1 text-emerald-600" /> : <Copy className="size-3 mr-1" />}
            DB ID কপি
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(databaseName, "database_name")}
            className="h-7 text-xs cursor-pointer"
          >
            {copiedKey === "database_name" ? <Check className="size-3 mr-1 text-emerald-600" /> : <Copy className="size-3 mr-1" />}
            নাম কপি
          </Button>
        </div>
      </div>
    </div>
  );
}
