import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Globe,
  Layers,
  Headphones,
  HardDrive,
  Mail,
  Shield,
  Check,
  RefreshCw,
  Download,
  Lock,
  ExternalLink,
  Eye,
  Type,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  Save,
  AlertCircle,
  Database,
  User,
  Moon,
  Sun,
  Smartphone,
  EyeOff,
  Zap,
  Server,
  Cpu,
  Activity,
  Trash2,
  Key,
  Info,
  Gauge,
  Cloud,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Share2,
  PanelTop,
  PanelBottom,
  Plus
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  type HeaderSettings,
  type FooterSettings,
  type SocialMediaSettings,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_SOCIAL_MEDIA_SETTINGS,
  useHeaderSettings,
  useFooterSettings,
  useSocialMediaSettings
} from "@/lib/site";
import { socialIconFor } from "@/components/SocialLinks";
import {
  type RedisSettings,
  DEFAULT_REDIS_SETTINGS,
  testRedisConnection,
  getRedisDbSize,
  flushRedisCache,
  runMultiTierBenchmark,
  type BenchmarkResults,
  type CloudflareCacheSettings,
  DEFAULT_CLOUDFLARE_SETTINGS,
  purgeCloudflareCache
} from "@/lib/redis";
import {
  usePrefs,
  type Prefs,
  type ThemeMode,
  type TranslationAudioPermissions,
  type PublicDisplayPermissions,
  savePrefs,
  PUBLIC_PERMS_STORAGE_KEY,
  getBaseApiUrl
} from "@/lib/prefs";
import { useSession } from "@/lib/auth";
import { saveSurahOffline, clearAllOfflineStorage } from "@/lib/offline";
import { TurnstileAdmin } from "@/components/TurnstileAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export type SettingsSubTab =
  | "general"
  | "header-footer"
  | "social-media"
  | "reading"
  | "audio"
  | "offline"
  | "discussion"
  | "security";

interface WordPressSettingsAdminProps {
  initialSubTab?: string;
  setActiveTab: (tab: string) => void;
  hideSubTabSelector?: boolean;
}

export function WordPressSettingsAdmin({
  initialSubTab = "general",
  setActiveTab,
  hideSubTabSelector = false,
}: WordPressSettingsAdminProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const {
    prefs,
    updatePref,
    publicPermissions,
    updatePublicPermission,
    bulkUpdateTranslationAudioPermissions,
    isTranslationAudioAllowed,
    updateTranslationAudioPermission,
    lang,
    themeMode,
    setThemeMode,
  } = usePrefs();

  // Normalize initialSubTab (e.g. "settings-general" -> "general")
  const getCleanSubTab = (t: string): SettingsSubTab => {
    if (t.includes("header") || t.includes("footer")) return "header-footer";
    if (t.includes("social")) return "social-media";
    if (t.includes("reading")) return "reading";
    if (t.includes("audio")) return "audio";
    if (t.includes("offline")) return "offline";
    if (t.includes("discussion")) return "discussion";
    if (t.includes("security") || t === "turnstile") return "security";
    return "general";
  };

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(() =>
    getCleanSubTab(initialSubTab)
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(getCleanSubTab(initialSubTab));
    }
  }, [initialSubTab]);

  const handleSwitchSubTab = (tab: SettingsSubTab) => {
    setActiveSubTab(tab);
    if (tab === "security") {
      setActiveTab("turnstile");
    } else if (tab === "header-footer") {
      setActiveTab("settings-header-footer");
    } else if (tab === "social-media") {
      setActiveTab("settings-social");
    } else {
      setActiveTab(`settings-${tab}`);
    }
  };

  // 1. GENERAL SETTINGS STATE
  const [generalSettings, setGeneralSettings] = useState({
    siteTitle: "Alam M - শব্দ আমার ক্যানভাস",
    tagline: "গল্প, কবিতা, স্মৃতিকথা ও চিন্তাভাবনা নিয়ে ব্যক্তিগত সাহিত্যিক ব্লগ",
    siteUrl: "https://blog.wooniche.com",
    adminEmail: user?.email || "alam@wooniche.com",
    membership: true,
    defaultRole: "subscriber",
    siteLanguage: "bn",
    timezone: "Asia/Dhaka",
    dateFormat: "Y-m-d",
    timeFormat: "g:i a",
  });

  const [savingGeneral, setSavingGeneral] = useState(false);

  // Fetch General Settings from site_settings table
  const generalQuery = useQuery({
    queryKey: ["admin-site-settings-general"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "general_site_settings")
        .maybeSingle();
      if (error) return null;
      if (data?.value) {
        return typeof data.value === "string"
          ? JSON.parse(data.value)
          : data.value;
      }
      return null;
    },
  });

  useEffect(() => {
    if (generalQuery.data) {
      setGeneralSettings((prev) => ({
        ...prev,
        ...generalQuery.data,
      }));
    } else if (user?.email) {
      setGeneralSettings((prev) => ({
        ...prev,
        adminEmail: user.email || prev.adminEmail,
      }));
    }
  }, [generalQuery.data, user?.email]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "general_site_settings",
          value: generalSettings,
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      queryClient.invalidateQueries({
        queryKey: ["admin-site-settings-general"],
      });
      toast.success("সাধারণ সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে (Settings saved)");
    } catch (err: any) {
      toast.error(err.message || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSavingGeneral(false);
    }
  };

  // 1.1 HEADER & FOOTER SETTINGS STATE
  const headerQuery = useHeaderSettings();
  const footerQuery = useFooterSettings();
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(DEFAULT_HEADER_SETTINGS);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [savingHeaderFooter, setSavingHeaderFooter] = useState(false);

  useEffect(() => {
    if (headerQuery.data) {
      setHeaderSettings(headerQuery.data);
    }
  }, [headerQuery.data]);

  useEffect(() => {
    if (footerQuery.data) {
      setFooterSettings(footerQuery.data);
    }
  }, [footerQuery.data]);

  const handleSaveHeaderFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHeaderFooter(true);
    try {
      const [hRes, fRes] = await Promise.all([
        supabase.from("site_settings").upsert(
          {
            key: "header_settings",
            value: headerSettings,
            is_public: true,
          },
          { onConflict: "key" }
        ),
        supabase.from("site_settings").upsert(
          {
            key: "footer_settings",
            value: footerSettings,
            is_public: true,
          },
          { onConflict: "key" }
        ),
      ]);
      if (hRes.error) throw hRes.error;
      if (fRes.error) throw fRes.error;
      queryClient.invalidateQueries({ queryKey: ["site-settings-header"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-footer"] });
      toast.success("হেডার ও ফুটার সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে (Header & Footer saved)");
    } catch (err: any) {
      toast.error(err.message || "হেডার ও ফুটার সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSavingHeaderFooter(false);
    }
  };

  // 1.2 SOCIAL MEDIA & POST SHARING SETTINGS STATE
  const socialQuery = useSocialMediaSettings();
  const [socialSettings, setSocialSettings] = useState<SocialMediaSettings>(DEFAULT_SOCIAL_MEDIA_SETTINGS);
  const [savingSocial, setSavingSocial] = useState(false);

  useEffect(() => {
    if (socialQuery.data) {
      setSocialSettings(socialQuery.data);
    }
  }, [socialQuery.data]);

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSocial(true);
    try {
      // 1. Save to site_settings with is_public: true
      const { error: sErr } = await supabase.from("site_settings").upsert(
        {
          key: "social_media_settings",
          value: socialSettings,
          is_public: true,
        },
        { onConflict: "key" }
      );
      if (sErr) throw sErr;

      // 2. Synchronize active links to social_links table
      try {
        await supabase.from("social_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const activeRows = socialSettings.links
          .filter((l) => l.enabled && l.url && l.url.trim() !== "")
          .map((l, idx) => ({
            platform: l.platform.toLowerCase().trim(),
            label: l.label || l.platform,
            url: l.url.trim(),
            sort_order: idx + 1,
            visible: true,
          }));
        if (activeRows.length > 0) {
          await supabase.from("social_links").insert(activeRows);
        }
      } catch (syncErr) {
        console.warn("social_links table sync error:", syncErr);
      }

      queryClient.invalidateQueries({ queryKey: ["site-settings-social-media"] });
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      queryClient.invalidateQueries({ queryKey: ["admin-social-links"] });
      toast.success("সোশ্যাল মিডিয়া ও শেয়ার সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে (Social settings saved)");
    } catch (err: any) {
      toast.error(err.message || "সোশ্যাল মিডিয়া সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSavingSocial(false);
    }
  };

  // 2. OFFLINE DOWNLOAD STATES
  const [downloadingSurahs, setDownloadingSurahs] = useState(false);
  const [downloadingAyahs, setDownloadingAyahs] = useState(false);
  const [surahProgress, setSurahProgress] = useState<number | null>(null);
  const [ayahProgress, setAyahProgress] = useState<number | null>(null);

  const handleDownloadAllSurahs = async () => {
    setDownloadingSurahs(true);
    setSurahProgress(0);
    try {
      for (let i = 1; i <= 114; i++) {
        const url = `/data/quran/surahs/${i}.json`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          await saveSurahOffline(i, data);
        }
        setSurahProgress(Math.round((i / 114) * 100));
      }
      toast.success("১১৪টি সুরার ডাটা অফলাইনে সম্পূর্ণ সংরক্ষিত হয়েছে!");
    } catch (e) {
      console.error(e);
      toast.error("ডাউনলোডে সমস্যা হয়েছে, ইন্টারনেট সংযোগ চেক করুন");
    } finally {
      setDownloadingSurahs(false);
      setTimeout(() => setSurahProgress(null), 3000);
    }
  };

  const handleDownloadAllAyahs = async () => {
    setDownloadingAyahs(true);
    setAyahProgress(0);
    try {
      for (let i = 1; i <= 114; i++) {
        const url = `/data/quran/surahs/${i}.json`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          await saveSurahOffline(i, data);
        }
        setAyahProgress(Math.round((i / 114) * 100));
      }
      toast.success("৬২৩৬টি আয়াত ও শব্দকোষ অফলাইনে সম্পূর্ণ সংরক্ষিত!");
    } catch (e) {
      console.error(e);
      toast.error("সংরক্ষণে ত্রুটি হয়েছে");
    } finally {
      setDownloadingAyahs(false);
      setTimeout(() => setAyahProgress(null), 3000);
    }
  };

  // Clear offline cache
  const handleClearCache = async () => {
    if (confirm("আপনি কি নিশ্চিত যে লোকাল অফলাইন ক্যাশ ডাটা মুছে ফেলতে চান?")) {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        }
        toast.success("অফলাইন ক্যাশ সফলভাবে মুছে ফেলা হয়েছে");
      } catch (err) {
        toast.error("ক্যাশ পরিষ্কার করতে সমস্যা হয়েছে");
      }
    }
  };

  // =========================================================================
  // REDIS & PERFORMANCE CACHE STATE & HANDLERS
  // =========================================================================
  const [redisSettings, setRedisSettings] = useState<RedisSettings>(DEFAULT_REDIS_SETTINGS);
  const [savingRedis, setSavingRedis] = useState(false);
  const [testingRedis, setTestingRedis] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs: number;
    message: string;
    error?: string;
  } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [flushingRedis, setFlushingRedis] = useState(false);
  const [redisDbSize, setRedisDbSize] = useState<number | null>(null);
  const [fetchingDbSize, setFetchingDbSize] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults | null>(null);

  // Fetch Redis Settings from site_settings table
  const redisSettingsQuery = useQuery({
    queryKey: ["admin-redis-cache-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "redis_cache_settings")
        .maybeSingle();
      if (error) return null;
      if (data?.value) {
        return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      }
      return null;
    },
  });

  useEffect(() => {
    if (redisSettingsQuery.data) {
      setRedisSettings((prev) => ({
        ...prev,
        ...redisSettingsQuery.data,
      }));
    }
  }, [redisSettingsQuery.data]);

  const handleSaveRedisSettings = async () => {
    setSavingRedis(true);
    try {
      const updated = {
        ...redisSettings,
        enabled: Boolean(redisSettings.url && redisSettings.token),
      };
      setRedisSettings(updated);
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "redis_cache_settings",
          value: updated,
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-redis-cache-settings"] });
      toast.success("রেডিস ও ক্যাশ কনফিগারেশন সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "রেডিস সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSavingRedis(false);
    }
  };

  const handleTestRedis = async () => {
    if (!redisSettings.url || !redisSettings.token) {
      toast.error("অনুগ্রহ করে রেডিস REST URL এবং Token প্রদান করুন");
      return;
    }
    setTestingRedis(true);
    setTestResult(null);
    try {
      let res: any;
      try {
        const srvRes = await fetch("/api/admin/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ping",
            url: redisSettings.url,
            token: redisSettings.token,
          }),
        });
        if (srvRes.ok) {
          res = await srvRes.json();
        }
      } catch {
        // Fallback to direct client ping
      }

      if (!res || typeof res.ok !== "boolean") {
        res = await testRedisConnection(redisSettings.url, redisSettings.token);
      }

      setTestResult(res);
      if (res.ok) {
        toast.success(`রেডিস সংযোগ সফল! লেটেন্সি: ${res.latencyMs} ms`);
        setRedisSettings((prev) => ({
          ...prev,
          lastTestedAt: new Date().toLocaleTimeString(),
          lastLatencyMs: res.latencyMs,
        }));
      } else {
        toast.error(`সংযোগ ত্রুটি: ${res.message}`);
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        latencyMs: 0,
        message: err?.message || "পরীক্ষা ব্যর্থ হয়েছে",
      });
      toast.error("রেডিস সংযোগ পরীক্ষা ব্যর্থ হয়েছে");
    } finally {
      setTestingRedis(false);
    }
  };

  const handleGetDbSize = async () => {
    if (!redisSettings.url || !redisSettings.token) {
      toast.error("অনুগ্রহ করে প্রথমে রেডিস ক্রেডেনশিয়াল প্রদান করুন");
      return;
    }
    setFetchingDbSize(true);
    try {
      const res = await getRedisDbSize(redisSettings.url, redisSettings.token);
      if (res.ok) {
        setRedisDbSize(res.size);
        toast.success(`রেডিসে বর্তমানে মোট ${res.size}টি কি সংরক্ষিত আছে`);
      } else {
        toast.error(res.error || "কি-কাউন্টার পড়তে ব্যর্থ হয়েছে");
      }
    } catch {
      toast.error("কি-কাউন্টার পড়তে সমস্যা হয়েছে");
    } finally {
      setFetchingDbSize(false);
    }
  };

  const handleFlushRedis = async () => {
    if (!redisSettings.url || !redisSettings.token) {
      toast.error("রেডিস কনফিগার করা নেই");
      return;
    }
    if (!confirm("আপনি কি নিশ্চিত যে রেডিস ক্যাশ সম্পূর্ণ খালি করতে চান?")) return;
    setFlushingRedis(true);
    try {
      const res = await flushRedisCache(redisSettings.url, redisSettings.token, redisSettings.prefix);
      if (res.ok) {
        toast.success(res.message);
        setRedisDbSize(0);
        queryClient.invalidateQueries();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("রেডিস ক্যাশ পরিষ্কার করতে ব্যর্থ হয়েছে");
    } finally {
      setFlushingRedis(false);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const results = await runMultiTierBenchmark(supabase, {
        url: redisSettings.url,
        token: redisSettings.token,
        enabled: redisSettings.enabled,
      });
      setBenchmarkResults(results);
      toast.success("লাইভ স্পিড টেস্ট সফলভাবে সম্পন্ন হয়েছে!");
    } catch (err: any) {
      toast.error("স্পিড টেস্ট সম্পন্ন করতে সমস্যা হয়েছে");
    } finally {
      setBenchmarking(false);
    }
  };

  const handleInvalidateQueryCache = () => {
    queryClient.invalidateQueries();
    toast.success("ব্রাউজার মেমোরি ক্যাশ রিফ্রেশ করা হয়েছে (Query Cache Invalidated)");
  };

  // =========================================================================
  // CLOUDFLARE CACHE STATE & HANDLERS
  // =========================================================================
  const [cfSettings, setCfSettings] = useState<CloudflareCacheSettings>(DEFAULT_CLOUDFLARE_SETTINGS);
  const [savingCf, setSavingCf] = useState(false);
  const [purgingCf, setPurgingCf] = useState(false);
  const [showCfToken, setShowCfToken] = useState(false);
  const [customPurgeUrls, setCustomPurgeUrls] = useState("");
  const [cfPurgeResult, setCfPurgeResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [cfGuideOpen, setCfGuideOpen] = useState(false);
  const [redisGuideOpen, setRedisGuideOpen] = useState(false);

  // Fetch Cloudflare settings from site_settings
  const cfSettingsQuery = useQuery({
    queryKey: ["admin-cloudflare-cache-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "cloudflare_cache_settings")
        .maybeSingle();
      if (error) return null;
      if (data?.value) {
        return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      }
      return null;
    },
  });

  useEffect(() => {
    if (cfSettingsQuery.data) {
      setCfSettings((prev) => ({
        ...prev,
        ...cfSettingsQuery.data,
      }));
    }
  }, [cfSettingsQuery.data]);

  const handleSaveCfSettings = async () => {
    setSavingCf(true);
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "cloudflare_cache_settings",
          value: cfSettings,
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-cloudflare-cache-settings"] });
      toast.success("ক্লাউডফ্লেয়ার ক্যাশ সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "ক্লাউডফ্লেয়ার সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSavingCf(false);
    }
  };

  const handlePurgeCloudflare = async (purgeAll = true) => {
    if (!cfSettings.zoneId || !cfSettings.apiToken) {
      toast.error("অনুগ্রহ করে প্রথমে Cloudflare Zone ID এবং API Token প্রদান করুন");
      return;
    }

    const urlsToPurge = !purgeAll && customPurgeUrls.trim()
      ? customPurgeUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)
      : undefined;

    if (!purgeAll && (!urlsToPurge || urlsToPurge.length === 0)) {
      toast.error("নির্দিষ্ট URL পার্জ করতে অন্তত একটি সম্পূর্ণ URL লিখুন");
      return;
    }

    if (
      purgeAll &&
      !confirm("আপনি কি নিশ্চিত যে ক্লাউডফ্লেয়ারের গ্লোবাল এজ ক্যাশ সম্পূর্ণরূপে খালি (Purge All) করতে চান?")
    ) {
      return;
    }

    setPurgingCf(true);
    setCfPurgeResult(null);
    try {
      const res = await purgeCloudflareCache(cfSettings.zoneId, cfSettings.apiToken, urlsToPurge);
      setCfPurgeResult(res);
      if (res.ok) {
        toast.success(res.message);
        setCfSettings((prev) => ({
          ...prev,
          lastPurgedAt: new Date().toLocaleTimeString(),
        }));
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setCfPurgeResult({ ok: false, message: err?.message || "ক্যাশ খালি করতে সমস্যা হয়েছে" });
      toast.error("ক্লাউডফ্লেয়ার ক্যাশ পার্জ করতে সমস্যা হয়েছে");
    } finally {
      setPurgingCf(false);
    }
  };

  // =========================================================================
  // 1-CLICK CLEAN EVERYTHING (All Cache & Offline Tiers)
  // =========================================================================
  const [cleaningEverything, setCleaningEverything] = useState(false);

  const handleCleanEverything = async () => {
    const cfActive = !!(cfSettings.zoneId && cfSettings.apiToken);
    const redisActive = !!(redisSettings.url && redisSettings.token);

    const message = [
      "আপনি কি নিশ্চিত যে ১-ক্লিকে সকল ক্যাশ স্তর সম্পূর্ণরূপে পরিষ্কার করতে চান?",
      "",
      "যেসব স্তর খালি করা হবে:",
      "• ১. ব্রাউজার মেমোরি ও React Query RAM Cache",
      "• ২. সার্ভিস ওয়ার্কার ও ব্রাউজার Cache Storage",
      "• ৩. অফলাইন IndexedDB ও অডিও ক্যাশ",
      redisActive
        ? "• ৪. আপস্ট্যাশ রেডিস (Upstash Redis) ইন-মেমোরি ক্যাশ"
        : "• ৪. আপস্ট্যাশ রেডিস (সেটআপ করা নেই)",
      cfActive
        ? "• ৫. ক্লাউডফ্লেয়ার গ্লোবাল এজ CDN ক্যাশ (Zone Purge All)"
        : "• ৫. ক্লাউডফ্লেয়ার এজ CDN (সেটআপ করা নেই)",
    ].join("\n");

    if (!confirm(message)) return;

    setCleaningEverything(true);
    const clearedList: string[] = [];
    const errorList: string[] = [];

    try {
      // 1. Browser RAM / React Query
      try {
        queryClient.clear();
        queryClient.invalidateQueries();
        clearedList.push("১. ব্রাউজার র‍্যাম");
      } catch (e: any) {
        errorList.push(`ব্রাউজার র‍্যাম: ${e?.message}`);
      }

      // 2 & 3. Browser Cache Storage & IndexedDB Offline Data
      try {
        await clearAllOfflineStorage();
        clearedList.push("২. ব্রাউজার ক্যাশ ও ৩. অফলাইন স্টোরেজ");
      } catch (e: any) {
        errorList.push(`অফলাইন স্টোরেজ: ${e?.message}`);
      }

      // 4. Redis Cache Flush
      if (redisActive) {
        try {
          const res = await flushRedisCache(redisSettings.url, redisSettings.token, redisSettings.prefix);
          if (res.ok) {
            setRedisDbSize(0);
            clearedList.push("৪. রেডিস ইন-মেমোরি");
          } else {
            errorList.push(`রেডিস: ${res.message}`);
          }
        } catch (e: any) {
          errorList.push(`রেডিস: ${e?.message}`);
        }
      }

      // 5. Cloudflare CDN Purge
      if (cfActive) {
        try {
          const res = await purgeCloudflareCache(cfSettings.zoneId, cfSettings.apiToken);
          if (res.ok) {
            setCfSettings((prev) => ({
              ...prev,
              lastPurgedAt: new Date().toLocaleTimeString(),
            }));
            clearedList.push("৫. ক্লাউডফ্লেয়ার এজ CDN");
          } else {
            errorList.push(`ক্লাউডফ্লেয়ার: ${res.message}`);
          }
        } catch (e: any) {
          errorList.push(`ক্লাউডফ্লেয়ার: ${e?.message}`);
        }
      }

      // Reset benchmarks
      setBenchmarkResults(null);

      if (errorList.length === 0) {
        toast.success("সব স্তর সফলভাবে সাফ করা হয়েছে! (" + clearedList.join(", ") + ")", {
          duration: 5000,
        });
      } else {
        toast.warning(
          `আংশিক সাফ সম্পন্ন:\nসফল: ${clearedList.join(", ")}\nত্রুটি: ${errorList.join(", ")}`,
          { duration: 6000 }
        );
      }
    } catch (err: any) {
      toast.error("ক্যাশ পরিষ্কার করতে অপ্রত্যাশিত ত্রুটি: " + (err?.message || String(err)));
    } finally {
      setCleaningEverything(false);
    }
  };

  // 1. Bulk toggle admin's personal reading view
  const handleBulkMyView = (visible: boolean) => {
    const updated: Prefs = { ...prefs };
    displayLayersList.forEach((layer) => {
      (updated as any)[layer.key] = visible;
    });
    savePrefs(updated);
    toast.success(
      visible
        ? "আপনার পড়ার ভিউতে সকল ডিসপ্লে লেয়ার সক্রিয় করা হয়েছে"
        : "আপনার পড়ার ভিউতে সকল লেয়ার লুকানো/হাইড করা হয়েছে"
    );
  };

  // 2. Bulk allow/restrict display layers for general public visitors
  const handleBulkLayerPermissions = async (allow: boolean) => {
    const updated: PublicDisplayPermissions = { ...(publicPermissions || {}) } as any;
    displayLayersList.forEach((layer) => {
      updated[layer.key] = allow;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(PUBLIC_PERMS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("public-perms-updated"));
    }

    try {
      await supabase.from("site_settings").upsert({
        key: "public_display_permissions",
        value: JSON.stringify(updated),
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

      const baseUrl = getBaseApiUrl();
      await fetch(`${baseUrl}/api/public/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "public_display_permissions", value: updated }),
      }).catch(() => {});

      toast.success(
        allow
          ? "সকল ডিসপ্লে লেয়ার সাধারণ ভিজিটরদের জন্য উন্মুক্ত করা হয়েছে"
          : "সকল ডিসপ্লে লেয়ার ভিজিটরদের জন্য সাময়িক স্থগিত করা হয়েছে"
      );
    } catch {
      toast.error("পারমিশন আপডেটে ত্রুটি হয়েছে");
    }
  };

  const displayLayersList: {
    key: keyof PublicDisplayPermissions;
    title: string;
    desc: string;
  }[] = [
    {
      key: "showSurahScientificMeaning",
      title: "১. সুরার নামের প্রচলিত ও আধুনিক বিজ্ঞানভিত্তিক অর্থ (Surah Meaning)",
      desc: "প্রতিটি সুরার শীর্ষে প্রচলিত অর্থ ও সমসাময়িক বিজ্ঞানভিত্তিক গবেষণামূলক অর্থ ও তাৎপর্য প্রদর্শন",
    },
    {
      key: "showArabic",
      title: "২. মূল আরবি পাঠ (Original Arabic Text)",
      desc: "প্রতিটি আয়াতের মূল নূরানী/উসমানি আরবি হরফ ও বিশুদ্ধ পাঠ প্রদর্শন",
    },
    {
      key: "showMetaData",
      title: "৩. আয়াত মেটাডাটা ও বিষয়ভিত্তিক ট্যাগ (Meta Data)",
      desc: "প্রতিটি আয়াতের নম্বরের পাশে প্রাসঙ্গিক বিষয়ভিত্তিক মেটা ডাটা ও টপিক ট্যাগ প্রদর্শন",
    },
    {
      key: "showWordByWord",
      title: "৪. শব্দে শব্দে অর্থ (Word by Word)",
      desc: "প্রতিটি আরবি শব্দের নিচে স্বতন্ত্র বাংলা/ইংরেজি অর্থ ও ব্যাকরণিক উচ্চারণ",
    },
    {
      key: "showTransliteration",
      title: "৫. আয়াত উচ্চারণ নির্দেশিকা (Transliteration)",
      desc: "সহজে বিশুদ্ধ উচ্চারণে পড়ার জন্য সম্পূর্ণ আয়াতের বাংলা ফোনেটিক উচ্চারণ",
    },
    {
      key: "showModernBn",
      title: "৬. কুরআন অন্বেষা (আধুনিক বাংলা অনুবাদ)",
      desc: "আমাদের সমসাময়িক গবেষণালব্ধ আধুনিক কুরআন অন্বেষা বাংলা অনুবাদ",
    },
    {
      key: "showModernEn",
      title: "৭. Qur'an Explorer (Modern English Translation)",
      desc: "Contemporary research-based Qur'an Explorer English translation",
    },
    {
      key: "showScientificBn",
      title: "৮. বৈজ্ঞানিক অনুবাদ (বাংলা)",
      desc: "মহাবিশ্ব, প্রকৃতি ও জ্যোতির্বিজ্ঞানের আয়াতের গবেষণালব্ধ আধুনিক বৈজ্ঞানিক অনুবাদ",
    },
    {
      key: "showScientificEn",
      title: "৯. Scientific Translation (English)",
      desc: "Contemporary scientific, cosmological & natural world English translation",
    },
    {
      key: "showConventionalBn",
      title: "১০. আক্ষরিক বাংলা অনুবাদ (Literal Bengali)",
      desc: "মুহিউদ্দীন খান / তাইসিরুল কুরআন স্ট্যান্ডার্ড ধ্রুপদী বাংলা অনুবাদ",
    },
    {
      key: "showSahih",
      title: "১১.১ Sahih International (সহীহ ইন্টারন্যাশনাল ইংরেজি)",
      desc: "Corpus Quran স্ট্যান্ডার্ড সহীহ ইন্টারন্যাশনাল আধুনিক স্পষ্ট ইংরেজি অনুবাদ",
    },
    {
      key: "showPickthall",
      title: "১১.২ Marmaduke Pickthall (মোহাম্মদ মারমাডিউক পিকথল)",
      desc: "ব্রিটিশ মুসলিম পণ্ডিত মারমাডিউক পিকথলের ধ্রুপদী প্রামাণ্য ইংরেজি অনুবাদ",
    },
    {
      key: "showYusufAli",
      title: "১১.৩ Abdullah Yusuf Ali (আব্দুল্লাহ ইউসুফ আলী)",
      desc: "বিশ্বখ্যাত আল্লামা আব্দুল্লাহ ইউসুফ আলীর ঐতিহ্যবাহী সাহিত্যমানসম্পন্ন ইংরেজি অনুবাদ",
    },
    {
      key: "showShakir",
      title: "১১.৪ M. H. Shakir (মোহাম্মদ হাবিব শাকির)",
      desc: "প্রখ্যাত পণ্ডিত এম. এইচ. শাকিরের প্রাঞ্জল ও সুপরিচিত ইংরেজি অনুবাদ",
    },
    {
      key: "showSarwar",
      title: "১১.৫ Muhammad Sarwar (শেখ মুহাম্মদ সারওয়ার)",
      desc: "সহজ ও প্রাতিষ্ঠানিক সুখপাঠ্য আধুনিক ইংরেজি অনুবাদ",
    },
    {
      key: "showMohsinKhan",
      title: "১১.৬ Al-Hilali & Mohsin Khan (মুহসিন খান ও আল-হিলালী)",
      desc: "মদিনা ইসলামিক বিশ্ববিদ্যালয় কর্তৃক স্বীকৃত ড. মুহসিন খান ও ড. হিলালীর ইংরেজি অনুবাদ",
    },
    {
      key: "showArberry",
      title: "১১.৭ Arthur John Arberry (আর্থার জন আর্বেরি - The Koran Interpreted)",
      desc: "কেমব্রিজ বিশ্ববিদ্যালয়ের খ্যাতিমান প্রাচ্যবিদ এ. জে. আর্বেরির ছন্দময় উচ্চাঙ্গ ইংরেজি অনুবাদ",
    },
    {
      key: "showLexicon",
      title: "১২.১ প্রচলিত আক্ষরিক অভিধান ও শব্দকোষ (Conventional Lexicon)",
      desc: "প্রতিটি আয়াতের শব্দের প্রচলিত আক্ষরিক অর্থ, ব্যাকরণ ও আরবি মূল ধাতু (Root)",
    },
    {
      key: "showLexiconModern",
      title: "১২.২ কুরআন অন্বেষা আধুনিক অভিধান (Explorer Modern Lexicon)",
      desc: "গবেষণাধর্মী সমসাময়িক পারিভাষিক অর্থ, আধুনিক ভাবার্থ ও শব্দকোষ বিশ্লেষণ",
    },
    {
      key: "showLexiconScientific",
      title: "১২.৩ বিজ্ঞানভিত্তিক অভিধান ও লেক্সিকন নোট (Scientific Lexicon & Notes)",
      desc: "মহাবিশ্ব, পদার্থ, জীববিজ্ঞান ও কসমোলজিক্যাল গবেষণালব্ধ আধুনিক বিজ্ঞানভিত্তিক পরিভাষা",
    },
    {
      key: "showLogicalConsistency",
      title: "১৪. লজিক্যাল কন্সিসট্যান্সি ফ্রেমওয়ার্ক (৪:৮২)",
      desc: "কুরআনের সার্বজনীন ইনফরমেশন আর্কিটেকচার ও অভ্যন্তরীণ সামঞ্জস্য বিশ্লেষণ",
    },
    {
      key: "showAudioPlayback",
      title: "১৫. সুরার অডিও প্লেব্যাক ও কন্ট্রোল (Audio Recitation & Player)",
      desc: "আরবি তেলাওয়াত ও বহুভাষিক AI অনুবাদ পাঠের সার্বজনীন প্লেয়ার",
    },
  ];

  const translationTracksList: {
    key: keyof TranslationAudioPermissions;
    label: string;
    desc: string;
  }[] = [
    {
      key: "conventional_bn",
      label: "মুহিউদ্দীন খান আক্ষরিক বাংলা অনুবাদ অডিও",
      desc: "স্ট্যান্ডার্ড বাংলা অনুবাদ পাঠ অডিও ফাইল",
    },
    {
      key: "conventional_en",
      label: "সহীহ ইন্টারন্যাশনাল ইংরেজি অনুবাদ অডিও",
      desc: "Sahih International English recitation",
    },
    {
      key: "modern_bn",
      label: "কুরআন অন্বেষা বাংলা অনুবাদ অডিও",
      desc: "আমাদের আধুনিক গবেষণার আলোকে অডিও পাঠ",
    },
    {
      key: "modern_en",
      label: "Qur'an Explorer English Audio",
      desc: "Scientific research translation narration",
    },
    {
      key: "arabic",
      label: "মূল আরবি তেলাওয়াত (Mishary Rashid Alafasy)",
      desc: "সম্পূর্ণ ১১৪টি সুরার মূল আরবি বিশুদ্ধ অডিও ট্র্যাক",
    },
  ];

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* UNIFIED SETTINGS SELECTOR (DESKTOP & MOBILE) */}
      {!hideSubTabSelector && activeSubTab !== "reading" && (
        <div className="bg-white dark:bg-[#1e1e1e] p-3 sm:p-4 rounded-lg border border-[#c3c4c7] dark:border-[#3c434a] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-md bg-[#2271b1]/10 text-[#2271b1] dark:bg-[#2271b1]/20 dark:text-[#72aee6] flex items-center justify-center shrink-0">
              <Settings className="size-4" />
            </div>
            <div>
              <label htmlFor="settings-subtab-select" className="text-xs font-bold text-foreground block cursor-pointer">
                সেটিংস বিভাগ নির্বাচন করুন:
              </label>
              <span className="text-[11px] text-muted-foreground">
                প্রয়োজনীয় কনফিগারেশন পেজ বেছে নিয়ে পরিবর্তন করুন
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-80 md:w-96 shrink-0">
            <select
              id="settings-subtab-select"
              value={activeSubTab}
              onChange={(e) => handleSwitchSubTab(e.target.value as SettingsSubTab)}
              className="w-full appearance-none bg-slate-50 dark:bg-[#2c3338] border border-[#c3c4c7] dark:border-[#3c434a] rounded-md px-3.5 py-2.5 pr-10 text-xs font-semibold text-[#1d2327] dark:text-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2271b1] cursor-pointer"
            >
              <option value="general">⚙️ সাধারণ সেটিংস (General)</option>
              <option value="header-footer">📑 হেডার ও ফুটার (Header & Footer)</option>
              <option value="social-media">🌐 সোশ্যাল মিডিয়া ও শেয়ার (Social & Sharing)</option>
              <option value="audio">🎧 অডিও ও মিডিয়া (Audio Settings)</option>
              <option value="offline">⚡ ক্লাউডফ্লেয়ার ও রেডিস ক্যাশ (Cloudflare & Redis)</option>
              <option value="discussion">💬 মন্তব্য ও যোগাযোগ (Discussion)</option>
              <option value="security">🛡️ টার্নস্টাইল সিকিউরিটি (Security)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. GENERAL SETTINGS TAB                                              */}
      {/* ==================================================================== */}
      {activeSubTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-[#1d2327] dark:text-white">
                সাধারণ সেটিংস (General Settings)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ওয়েবসাইটের শিরোনাম, বিবরণ, ভাষা এবং প্রশাসনিক সেটিংস পরিচালনা করুন।
              </p>
            </div>

            <div className="space-y-4 max-w-2xl text-xs">
              {/* Site Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center">
                <Label htmlFor="siteTitle" className="font-semibold text-foreground">
                  সাইটের শিরোনাম (Site Title)
                </Label>
                <div className="sm:col-span-2 space-y-1">
                  <Input
                    id="siteTitle"
                    value={generalSettings.siteTitle}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        siteTitle: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    ব্রাউজার ট্যাব ও সার্চ ইঞ্জিনে প্রদর্শিত মূল নাম।
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center">
                <Label htmlFor="tagline" className="font-semibold text-foreground">
                  ট্যাগলাইন (Tagline)
                </Label>
                <div className="sm:col-span-2 space-y-1">
                  <Input
                    id="tagline"
                    value={generalSettings.tagline}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        tagline: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    সংক্ষিপ্ত বাক্যে সাইটের মূল উদ্দেশ্য ও বৈশিষ্ট্য।
                  </p>
                </div>
              </div>

              {/* WordPress / Site URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center">
                <Label htmlFor="siteUrl" className="font-semibold text-foreground">
                  ওয়েবসাইট ঠিকানা (URL)
                </Label>
                <div className="sm:col-span-2 space-y-1">
                  <Input
                    id="siteUrl"
                    value={generalSettings.siteUrl}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        siteUrl: e.target.value,
                      })
                    }
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Admin Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center">
                <Label htmlFor="adminEmail" className="font-semibold text-foreground">
                  অ্যাডমিন ইমেইল ঠিকানা
                </Label>
                <div className="sm:col-span-2 space-y-1">
                  <Input
                    id="adminEmail"
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        adminEmail: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    জরুরি সিস্টেম বিজ্ঞপ্তি ও ফিডব্যাক মেসেজ এই ইমেইলে যাবে।
                  </p>
                </div>
              </div>

              {/* Membership */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-start pt-2 border-t border-border/50">
                <Label className="font-semibold text-foreground mt-1">সদস্যপদ (Membership)</Label>
                <div className="sm:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Switch
                      checked={generalSettings.membership}
                      onCheckedChange={(val) =>
                        setGeneralSettings({
                          ...generalSettings,
                          membership: val,
                        })
                      }
                    />
                    <span className="text-xs">যে কেউ নিবন্ধন করতে পারে (Anyone can register)</span>
                  </label>
                </div>
              </div>

              {/* Default Role */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center">
                <Label className="font-semibold text-foreground">
                  নতুন ব্যবহারকারীর প্রাথমিক ভূমিকা (Role)
                </Label>
                <div className="sm:col-span-2 space-y-1">
                  <select
                    value={generalSettings.defaultRole}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        defaultRole: e.target.value,
                      })
                    }
                    className="w-full sm:w-60 h-8 rounded border border-border bg-background px-2 text-xs"
                  >
                    <option value="subscriber">গ্রাহক / পাঠক (Subscriber)</option>
                    <option value="author">লেখক / গবেষক (Author)</option>
                    <option value="editor">সম্পাদক (Editor)</option>
                    <option value="admin">অ্যাডমিনিস্ট্রেটর (Administrator)</option>
                  </select>
                </div>
              </div>

              {/* Site Language */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center pt-2 border-t border-border/50">
                <Label className="font-semibold text-foreground">সাইটের ভাষা (Site Language)</Label>
                <div className="sm:col-span-2 space-y-1">
                  <select
                    value={generalSettings.siteLanguage}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        siteLanguage: e.target.value,
                      })
                    }
                    className="w-full sm:w-60 h-8 rounded border border-border bg-background px-2 text-xs"
                  >
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="en">English (United States)</option>
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center">
                <Label className="font-semibold text-foreground">টাইমজোন (Timezone)</Label>
                <div className="sm:col-span-2 space-y-1">
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        timezone: e.target.value,
                      })
                    }
                    className="w-full sm:w-60 h-8 rounded border border-border bg-background px-2 text-xs"
                  >
                    <option value="Asia/Dhaka">ঢাকা (Asia/Dhaka, UTC+6)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Asia/Riyadh">রিয়াদ (Asia/Riyadh, UTC+3)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center gap-3">
              <Button
                type="submit"
                disabled={savingGeneral}
                className="bg-[#2271b1] hover:bg-[#135e96] text-white text-xs h-8 px-4 cursor-pointer font-medium"
              >
                {savingGeneral ? (
                  <>
                    <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5 mr-1.5" />
                    পরিবর্তন সংরক্ষণ করুন (Save Changes)
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* 1.1 HEADER & FOOTER SETTINGS TAB                                     */}
      {/* ==================================================================== */}
      {activeSubTab === "header-footer" && (
        <form onSubmit={handleSaveHeaderFooter} className="space-y-6">
          {/* ১. হেডার সেটিংস কার্ড */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-6">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                <PanelTop className="size-4 text-[#2271b1]" />
                <span>হেডার সেটিংস (Site Header Configuration)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                সাইটের টপ নেভিগেশন বার, ব্র্যান্ডিং ট্যাগলাইন, ফিক্সড হেডার ও গ্লোবাল সার্চ কন্ট্রোল করুন।
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* সাইট টাইটেল */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  সাইট শিরোনাম (Site Title)
                </Label>
                <div className="md:col-span-3">
                  <Input
                    value={headerSettings.siteTitle}
                    onChange={(e) =>
                      setHeaderSettings({ ...headerSettings, siteTitle: e.target.value })
                    }
                    placeholder="Alam M — শব্দ আমার ক্যানভাস"
                    className="max-w-md h-8 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ব্রাউজার ট্যাব ও হেডার ব্র্যান্ডিংয়ে প্রদর্শিত মূল নাম।
                  </p>
                </div>
              </div>

              {/* ট্যাগলাইন */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  ট্যাগলাইন (Tagline / Subtitle)
                </Label>
                <div className="md:col-span-3">
                  <Input
                    value={headerSettings.tagline}
                    onChange={(e) =>
                      setHeaderSettings({ ...headerSettings, tagline: e.target.value })
                    }
                    placeholder="শব্দ আমার ক্যানভাস"
                    className="max-w-md h-8 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    হেডারের লোগোর নিচে ছোট অক্ষরে প্রদর্শিত স্লোগান।
                  </p>
                </div>
              </div>

              {/* স্টিকি হেডার সুইচ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-2">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  স্টিকি হেডার (Sticky Header)
                </Label>
                <div className="md:col-span-3 flex items-center gap-3">
                  <Switch
                    checked={headerSettings.stickyHeader !== false}
                    onCheckedChange={(val) =>
                      setHeaderSettings({ ...headerSettings, stickyHeader: val })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    পেজ স্ক্রোল করলেও হেডারটি স্ক্রিনের শীর্ষে আটকে থাকবে।
                  </span>
                </div>
              </div>

              {/* স্মার্ট সার্চ সুইচ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-2">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  স্মার্ট সার্চ বাটন (Global Search)
                </Label>
                <div className="md:col-span-3 flex items-center gap-3">
                  <Switch
                    checked={headerSettings.showSearch !== false}
                    onCheckedChange={(val) =>
                      setHeaderSettings({ ...headerSettings, showSearch: val })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    হেডারের ডান পাশে ⌘K স্মার্ট সার্চ বাটন প্রদর্শন করুন।
                  </span>
                </div>
              </div>

              {/* ভাষা পরিবর্তন বাটন */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-2">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  ভাষা পরিবর্তন (Language Switcher)
                </Label>
                <div className="md:col-span-3 flex items-center gap-3">
                  <Switch
                    checked={headerSettings.showLangSwitch !== false}
                    onCheckedChange={(val) =>
                      setHeaderSettings({ ...headerSettings, showLangSwitch: val })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    হেডারে BN / EN ভাষা পরিবর্তনের বাটন প্রদর্শন করুন।
                  </span>
                </div>
              </div>

              {/* নোটিশ ও ঘোষণা বার */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                      টপ অ্যানাউন্সমেন্ট বার (Top Announcement Bar)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      হেডারের একদম শীর্ষে জরুরি নোটিশ বা ঘোষণা বার্তা প্রদর্শন করুন।
                    </p>
                  </div>
                  <Switch
                    checked={headerSettings.announcement?.enabled || false}
                    onCheckedChange={(val) =>
                      setHeaderSettings({
                        ...headerSettings,
                        announcement: {
                          ...(headerSettings.announcement || { text: "", link: "" }),
                          enabled: val,
                        },
                      })
                    }
                  />
                </div>

                {headerSettings.announcement?.enabled && (
                  <div className="p-3.5 bg-muted/40 rounded-lg border border-border/70 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <Label className="text-xs">নোটিশ বার্তা</Label>
                      <Input
                        value={headerSettings.announcement?.text || ""}
                        onChange={(e) =>
                          setHeaderSettings({
                            ...headerSettings,
                            announcement: {
                              ...(headerSettings.announcement || { link: "" }),
                              enabled: true,
                              text: e.target.value,
                            },
                          })
                        }
                        placeholder="যেমন: নতুন কবিতা বা গল্প প্রকাশিত হয়েছে — এখনই পড়ুন!"
                        className="md:col-span-3 h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <Label className="text-xs">ক্লিক লিংক (ঐচ্ছিক)</Label>
                      <Input
                        value={headerSettings.announcement?.link || ""}
                        onChange={(e) =>
                          setHeaderSettings({
                            ...headerSettings,
                            announcement: {
                              ...(headerSettings.announcement || { text: "" }),
                              enabled: true,
                              link: e.target.value,
                            },
                          })
                        }
                        placeholder="https://www.quraan.bd/articles/... অথবা /surah/1"
                        className="md:col-span-3 h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ২. ফুটার সেটিংস কার্ড */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-6">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                <PanelBottom className="size-4 text-[#2271b1]" />
                <span>ফুটার সেটিংস (Site Footer Configuration)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                ফুটারের সর্ব বামের কলামের পরিচিতি টেক্সট, সোশ্যাল আইকন প্রদর্শন, মেনু লিংক কলাম ও কপিরাইট তথ্য কনফিগার করুন।
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* ফুটার পরিচিতি টেক্সট (সর্ব বামের কলাম) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                <div>
                  <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                    পরিচিতি টেক্সট (About / Bio)
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ফুটারের সর্ব বামের কলামে লোগোর ঠিক নিচে প্রদর্শিত হবে।
                  </p>
                </div>
                <div className="md:col-span-3">
                  <textarea
                    rows={3}
                    value={footerSettings.aboutText}
                    onChange={(e) =>
                      setFooterSettings({ ...footerSettings, aboutText: e.target.value })
                    }
                    placeholder="কুরআনের গভীর ভাবার্থ ও আয়াতের তাফসির উপলব্ধির আধুনিক ডিজিটাল প্ল্যাটফর্ম।"
                    className="w-full max-w-xl rounded-md border border-border bg-background p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* ফুটারের সর্ব বামের কলামের নিচে সোশ্যাল মিডিয়া আইকন এড/প্রদর্শন সুইচ (গুরুত্বপূর্ণ ইউজার রিকোয়ারমেন্ট) */}
              <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-200 dark:border-sky-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-[#2271b1] text-white">
                      <Share2 className="size-3.5" />
                    </span>
                    <div>
                      <Label className="text-xs font-bold text-[#1d2327] dark:text-white cursor-pointer">
                        ফুটারের সর্ব বামের কলামের নীচে সোশ্যাল মিডিয়া আইকন প্রদর্শন (Footer Social Icons)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        সক্রিয় থাকলে ফুটারের সর্ব বামের কলামের পরিচিতি টেক্সটের নিচে ফেসবুক, ইউটিউব, এক্স ইত্যাদি সোশ্যাল মিডিয়া আইকন প্রদর্শিত হবে।
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={footerSettings.showFooterSocialIcons !== false}
                    onCheckedChange={(val) =>
                      setFooterSettings({ ...footerSettings, showFooterSocialIcons: val })
                    }
                  />
                </div>
              </div>

              {/* মেনু লিংক কলাম প্রদর্শন সুইচ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-2">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  মেনু লিংক কলাম (Menu Links Column)
                </Label>
                <div className="md:col-span-3 flex items-center gap-3">
                  <Switch
                    checked={footerSettings.showMenuLinks !== false}
                    onCheckedChange={(val) =>
                      setFooterSettings({ ...footerSettings, showMenuLinks: val })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    ফুটারের মাঝের কলামে গুরুত্বপূর্ণ মেনু লিংকসমূহ প্রদর্শন করুন।
                  </span>
                </div>
              </div>

              {/* নিউজলেটার সেকশন প্রদর্শন সুইচ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-2">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  নিউজলেটার সেকশন (Newsletter Subscription)
                </Label>
                <div className="md:col-span-3 flex items-center gap-3">
                  <Switch
                    checked={footerSettings.showNewsletter !== false}
                    onCheckedChange={(val) =>
                      setFooterSettings({ ...footerSettings, showNewsletter: val })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    ফুটারের ডান পাশের কলামে নিউজলেটার সাবস্ক্রিপশন ফর্ম প্রদর্শন করুন।
                  </span>
                </div>
              </div>

              {/* কপিরাইট টেক্সট */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-2">
                <Label className="text-xs font-semibold text-[#1d2327] dark:text-gray-200">
                  কপিরাইট টেক্সট (Copyright Notice)
                </Label>
                <div className="md:col-span-3">
                  <Input
                    value={footerSettings.copyrightText}
                    onChange={(e) =>
                      setFooterSettings({ ...footerSettings, copyrightText: e.target.value })
                    }
                    placeholder="সর্বস্বত্ব সংরক্ষিত।"
                    className="max-w-md h-8 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ফুটারের সর্বনিম্নে বছরের সাথে প্রদর্শিত টেক্সট।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* সেভ বাটন */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={savingHeaderFooter}
              className="bg-[#2271b1] hover:bg-[#135e96] text-white text-xs h-9 px-5 cursor-pointer font-medium shadow-xs"
            >
              {savingHeaderFooter ? (
                <>
                  <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" />
                  হেডার ও ফুটার পরিবর্তন সংরক্ষণ করুন (Save Changes)
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* 1.2 SOCIAL MEDIA & POST SHARING SETTINGS TAB                         */}
      {/* ==================================================================== */}
      {activeSubTab === "social-media" && (
        <form onSubmit={handleSaveSocial} className="space-y-6">
          {/* গ্লোবাল সোশ্যাল কন্ট্রোল */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-5">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                <Share2 className="size-4 text-[#2271b1]" />
                <span>সোশ্যাল মিডিয়া ও শেয়ারিং কন্ট্রোল (Social & Sharing Settings)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                সাইটের প্রতিটি পোস্টের নিচে সোশ্যাল শেয়ার বাটন এবং ফুটারের সর্ব বামের কলামে সোশ্যাল আইকন প্রদর্শন নিয়ন্ত্রণ করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* পোস্টের নীচে সোশ্যাল শেয়ার সুবিধা সক্রিয়/নিষ্ক্রিয় */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
                      <Share2 className="size-3.5" />
                    </span>
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      পোস্টের নীচে সোশ্যাল শেয়ার সুবিধা
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    সক্রিয় থাকলে যেকোনো আর্টিকেলের নিচে ১-ক্লিকে ফেসবুক, টুইটার/এক্স, হোয়াটসঅ্যাপ, টেলিগ্রাম, লিঙ্কডইন ও লিংক কপি বাটন প্রদর্শিত হবে।
                  </p>
                </div>
                <Switch
                  checked={socialSettings.enablePostSharing !== false}
                  onCheckedChange={(val) =>
                    setSocialSettings({ ...socialSettings, enablePostSharing: val })
                  }
                />
              </div>

              {/* ফুটারের সর্ব বামের কলামে সোশ্যাল মিডিয়া আইকন এড/প্রদর্শন */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-[#2271b1] text-white">
                      <Globe className="size-3.5" />
                    </span>
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      ফুটারের সর্ব বামের কলামে সোশ্যাল আইকন
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    সক্রিয় থাকলে ফুটারের সর্ব বামের কলামের পরিচিতি টেক্সটের ঠিক নিচে সক্রিয় সোশ্যাল মিডিয়া প্রোফাইল আইকন প্রদর্শিত হবে।
                  </p>
                </div>
                <Switch
                  checked={socialSettings.showFooterSocial !== false}
                  onCheckedChange={(val) =>
                    setSocialSettings({ ...socialSettings, showFooterSocial: val })
                  }
                />
              </div>
            </div>
          </div>

          {/* ফেসবুক মেটা ট্যাগ ও অ্যাপ আইডি (Facebook Open Graph & App ID) */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded bg-[#1877F2] text-white text-[11px] font-bold">
                    f
                  </span>
                  <span>ফেসবুক মেটা ট্যাগ ও অ্যাপ আইডি (Facebook Open Graph & App ID)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Facebook Sharing Debugger এর <strong>&ldquo;Missing fb:app_id&rdquo;</strong> সতর্কবার্তা দূর করতে এবং ফেসবুক ইনসাইটস চালু করতে মেটা অ্যাপ আইডি যুক্ত করুন।
                </p>
              </div>

              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#1877F2] hover:underline font-medium"
              >
                <ExternalLink className="size-3.5" />
                <span>Meta Developer Portal</span>
              </a>
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-500/20 text-xs space-y-2 text-foreground">
              <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400">
                <Info className="size-4 shrink-0" />
                <span>ফেসবুক শেয়ারিং ওয়ার্নিং নির্দেশিকা (Why fb:app_id matters):</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ফেসবুক শেয়ারিং ডিবাগারে <em>&ldquo;Missing Properties: fb:app_id&rdquo;</em> একটি সাধারণ নন-ফ্যাটাল সতর্কবার্তা। এটি পেজের প্রিভিউতে কোনো সমস্যা করে না, তবে ফেসবুক অ্যানালিটিক্স, ডোমেইন ভেরিফিকেশন এবং ইনসাইটসের জন্য ফেসবুক একটি বৈধ অ্যাপ আইডি প্রত্যাশা করে। Meta Developer একাউন্টে ১ মিনিটে একটি অ্যাপ তৈরি করে প্রাপ্ত App ID নিচে বসিয়ে সংরক্ষণ (Save) করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>ফেসবুক অ্যাপ আইডি (Facebook App ID):</span>
                  <span className="text-[10px] text-rose-500 font-semibold">(fb:app_id)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="যেমন: 123456789012345"
                  value={socialSettings.facebookAppId || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, facebookAppId: e.target.value.trim() })
                  }
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  developers.facebook.com/apps থেকে প্রাপ্ত ১৫-১৬ ডিজিটের App ID।
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>ফেসবুক পেজ আইডি (Facebook Page ID):</span>
                  <span className="text-[10px] text-muted-foreground font-normal">(fb:pages — ঐচ্ছিক)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="যেমন: 100064893729182"
                  value={socialSettings.facebookPageId || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, facebookPageId: e.target.value.trim() })
                  }
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  আপনার অফিসিয়াল ফেসবুক পেজের সংখ্যাসূচক Numeric Page ID।
                </p>
              </div>
            </div>
          </div>

          {/* সোশ্যাল মিডিয়া প্রোফাইল লিংকসমূহ তালিকা */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1d2327] dark:text-white">
                  সোশ্যাল মিডিয়া প্রোফাইল লিংকসমূহ (Social Platform Profiles)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  নিচের প্ল্যাটফর্মগুলোতে আপনার অফিসিয়াল পেজ বা অ্যাকাউন্টের সম্পূর্ণ URL প্রদান করুন এবং সক্রিয় করুন।
                </p>
              </div>

              {/* নতুন সোশ্যাল প্ল্যাটফর্ম যুক্ত করার বাটন */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSocialSettings((prev) => ({
                    ...prev,
                    links: [
                      ...prev.links,
                      {
                        platform: "website",
                        label: "Custom Link",
                        url: "https://",
                        enabled: true,
                        sort_order: prev.links.length + 1,
                      },
                    ],
                  }));
                }}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Plus className="size-3.5 text-[#2271b1]" />
                <span>নতুন লিংক যোগ করুন</span>
              </Button>
            </div>

            {/* সোশ্যাল লিংক রিপিটার টেবিল / লিস্ট */}
            <div className="space-y-3">
              {socialSettings.links.map((link, idx) => {
                const Icon = socialIconFor(link.platform);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3 sm:w-1/4 shrink-0">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 border border-primary/20">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <Input
                          value={link.label || link.platform}
                          onChange={(e) => {
                            const newLinks = [...socialSettings.links];
                            newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                            setSocialSettings({ ...socialSettings, links: newLinks });
                          }}
                          className="h-7 text-xs font-semibold bg-background"
                          placeholder="Platform Label"
                        />
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                          {link.platform}
                        </span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div className="flex-1 min-w-0">
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...socialSettings.links];
                          newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                          setSocialSettings({ ...socialSettings, links: newLinks });
                        }}
                        placeholder={`https://${link.platform}.com/...`}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    {/* Actions: Enable Toggle & External Preview & Delete */}
                    <div className="flex items-center gap-3 shrink-0 justify-end">
                      {link.url && link.url.startsWith("http") && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="লিংকটি টেস্ট করুন"
                          className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={link.enabled}
                          onCheckedChange={(val) => {
                            const newLinks = [...socialSettings.links];
                            newLinks[idx] = { ...newLinks[idx], enabled: val };
                            setSocialSettings({ ...socialSettings, links: newLinks });
                          }}
                        />
                        <span className="text-[11px] font-medium w-12 text-muted-foreground">
                          {link.enabled ? "সক্রিয়" : "বন্ধ"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = socialSettings.links.filter((_, i) => i !== idx);
                          setSocialSettings({ ...socialSettings, links: newLinks });
                        }}
                        title="মুছে ফেলুন"
                        className="p-1 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* সেভ বাটন */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={savingSocial}
              className="bg-[#2271b1] hover:bg-[#135e96] text-white text-xs h-9 px-5 cursor-pointer font-medium shadow-xs"
            >
              {savingSocial ? (
                <>
                  <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" />
                  সোশ্যাল মিডিয়া ও শেয়ার সেটিংস সংরক্ষণ করুন (Save Social Settings)
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* 2. READING & DISPLAY LAYERS PERMISSIONS TAB                          */}
      {/* ==================================================================== */}
      {activeSubTab === "reading" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-5">
            {/* Header & Dual Bulk Action Bars */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                  <Layers className="size-4 text-[#2271b1]" />
                  <span>পঠন ও প্রদর্শন লেয়ার কন্ট্রোল (Reading & Display Layers)</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  এডমিন হিসেবে আপনার <strong>ব্যক্তিগত কুরআন পড়ার ভিউ</strong> (Personal Reading View) এবং সাধারণ ভিজিটরদের জন্য সাইটের <strong>সার্বজনীন এক্সেস পারমিশন</strong> (Public Visitor Access) উভয়ই এখান থেকে পৃথকভাবে নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                {/* Bulk Personal Reading View Controls */}
                <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 rounded-lg shadow-2xs">
                  <span className="text-[10px] font-bold text-blue-950 dark:text-blue-300 px-1.5 flex items-center gap-1 shrink-0">
                    <User className="size-3 text-blue-600 dark:text-blue-400" />
                    <span>আমার ভিউ:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkMyView(true)}
                      className="h-6 text-[11px] px-2 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer font-medium"
                    >
                      সব দেখান
                    </Button>
                    <span className="text-blue-300 dark:text-blue-700">|</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkMyView(false)}
                      className="h-6 text-[11px] px-2 text-slate-600 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer font-medium"
                    >
                      সব লুকান
                    </Button>
                  </div>
                </div>

                {/* Bulk Public Permission Controls */}
                <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 border border-border/80 rounded-lg shadow-2xs">
                  <span className="text-[10px] font-bold text-foreground px-1.5 flex items-center gap-1 shrink-0">
                    <Globe className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>ভিজিটর এক্সেস:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkLayerPermissions(true)}
                      className="h-6 text-[11px] px-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer font-medium"
                    >
                      সব উন্মুক্ত
                    </Button>
                    <span className="text-border">|</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkLayerPermissions(false)}
                      className="h-6 text-[11px] px-2 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer font-medium"
                    >
                      সব স্থগিত
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Master Layers Table with Dual Controls */}
            <div className="divide-y divide-border/60 border border-border/70 rounded-lg overflow-hidden">
              {displayLayersList.map((layer) => {
                const myPref = prefs[layer.key as keyof Prefs] ?? true;
                const isAllowed = publicPermissions[layer.key] ?? true;

                return (
                  <div
                    key={layer.key}
                    className="p-3 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0 pr-0 xl:pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground break-words">
                          {layer.title}
                        </span>
                        {/* Status Badge 1: Admin's Personal View */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                            myPref
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          <User className="size-3" />
                          {myPref ? "আমার ভিউ: সক্রিয়" : "আমার ভিউ: লুকানো"}
                        </span>
                        {/* Status Badge 2: Public Visitor Permission */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                            isAllowed
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <Globe className="size-3" />
                          {isAllowed ? "ভিজিটর: উন্মুক্ত" : "ভিজিটর: স্থগিত"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {layer.desc}
                      </p>
                    </div>

                    <div className="w-full xl:w-auto grid grid-cols-1 sm:grid-cols-2 xl:flex xl:items-center gap-2 shrink-0">
                      {/* Control 1: Admin's Personal Reading Switch */}
                      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 w-full sm:w-auto xl:min-w-[155px] shadow-2xs">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1">
                            <User className="size-3 text-blue-600 dark:text-blue-400" />
                            <span>আমার পড়ার ভিউ</span>
                          </span>
                          <span className="text-[10px] text-blue-700/80 dark:text-blue-300/80 font-medium">
                            {myPref ? "পড়তে চাই (দেখান)" : "হাইড (লুকান)"}
                          </span>
                        </div>
                        <Switch
                          id={`wp-mypref-${layer.key}`}
                          checked={myPref}
                          onCheckedChange={(val) => {
                            updatePref(layer.key as keyof Prefs, val);
                            toast.success(
                              `আপনার পড়ার ভিউতে "${layer.title}" ${
                                val ? "সক্রিয়" : "লুকানো"
                              } করা হয়েছে`
                            );
                          }}
                        />
                      </div>

                      {/* Control 2: Public Visitor Permission Switch */}
                      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-border/80 w-full sm:w-auto xl:min-w-[155px] shadow-2xs">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                            <Globe className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <span>ভিজিটর এক্সেস</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {isAllowed ? "উন্মুক্ত (Public)" : "লুকানো (Locked)"}
                          </span>
                        </div>
                        <Switch
                          id={`wp-perm-${layer.key}`}
                          checked={isAllowed}
                          onCheckedChange={async (val) => {
                            await updatePublicPermission(layer.key, val);
                            toast.success(
                              `ভিজিটরদের জন্য "${layer.title}" ${
                                val ? "উন্মুক্ত" : "লুকানো/স্থগিত"
                              } করা হয়েছে`
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Eye-Comfort Themes & Typography Section */}
            <div className="pt-5 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="size-4 text-[#2271b1]" />
                  <span>চক্ষু-বান্ধব থিম ও ফন্ট সাইজ কাস্টমাইজেশন</span>
                </h3>
                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                  আপনার ডিভাইস ও পড়ার সুবিধার জন্য ব্যক্তিগত থিম বেছে নিন
                </span>
              </div>

              {/* 2 Eye Comfort Themes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                {/* Option 1: Mushaf Sepia */}
                <button
                  type="button"
                  onClick={() => setThemeMode("sepia")}
                  className={`flex flex-col justify-between rounded-xl border-2 p-3 text-left transition-all cursor-pointer bg-[#f1e2cb] ${
                    themeMode === "sepia"
                      ? "border-[#a16e03] ring-2 ring-[#a16e03]/40 shadow-sm"
                      : "border-[#e2d3bb] hover:border-[#a16e03]/60 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#2c231b]">
                      <span className="size-3 rounded-full bg-[#fff9ef] border border-[#dbcebb] inline-block shadow-2xs shrink-0" />
                      মুসহাফ সেপিয়া
                    </span>
                    <Sun className="size-3 text-[#b07818]" />
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#796c5c] leading-relaxed">
                    মুদ্রিত কুরআনের মতো উষ্ণ ক্রিম টোন।
                  </p>
                  <div className="mt-2 border-t border-[#e2d3bb] pt-1.5 text-[10px]">
                    <span className="font-mono text-[#a16e03] font-bold">
                      {themeMode === "sepia" ? "✓ সক্রিয়" : "নির্বাচন করুন"}
                    </span>
                  </div>
                </button>

                {/* Option 2: Luxury Obsidian & Royal Gold Dark */}
                <button
                  type="button"
                  onClick={() => setThemeMode("dark")}
                  className={`flex flex-col justify-between rounded-xl border-2 p-3 text-left transition-all cursor-pointer bg-[#0b0f13] ${
                    themeMode === "dark"
                      ? "border-[#b88e58] ring-2 ring-[#b88e58]/40 shadow-sm"
                      : "border-white/15 hover:border-[#b88e58]/60 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#f4f4f6]">
                      <span className="size-3 rounded-full bg-[#12171f] border border-[#b88e58] inline-block shadow-2xs shrink-0" />
                      লাক্সারি ও গোল্ডেন
                    </span>
                    <Moon className="size-3 text-[#b88e58]" />
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#9ca3af] leading-relaxed">
                    প্রিমিয়াম অবসিডিয়ান ও রয়্যাল গোল্ডেন কন্ট্রাস্ট।
                  </p>
                  <div className="mt-2 border-t border-white/15 pt-1.5 text-[10px]">
                    <span className="font-mono text-[#b88e58] font-bold">
                      {themeMode === "dark" ? "✓ সক্রিয়" : "নির্বাচন করুন"}
                    </span>
                  </div>
                </button>
              </div>

              {/* Font Size Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">আরবি ফন্ট সাইজ ডিফল্ট</span>
                    <span className="font-mono font-bold text-[#2271b1]">{prefs.arabicFontSize}px</span>
                  </div>
                  <Slider
                    value={[prefs.arabicFontSize]}
                    min={20}
                    max={52}
                    step={1}
                    onValueChange={(val) => updatePref("arabicFontSize", val[0])}
                  />
                  <div className="text-center pt-2">
                    <p className="arabic text-foreground font-normal leading-relaxed" style={{ fontSize: `${prefs.arabicFontSize}px` }}>
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">অনুবাদ ফন্ট সাইজ ডিফল্ট</span>
                    <span className="font-mono font-bold text-[#2271b1]">{prefs.translationFontSize}px</span>
                  </div>
                  <Slider
                    value={[prefs.translationFontSize]}
                    min={12}
                    max={28}
                    step={1}
                    onValueChange={(val) => updatePref("translationFontSize", val[0])}
                  />
                  <div className="text-center pt-2">
                    <p className="text-muted-foreground leading-relaxed" style={{ fontSize: `${prefs.translationFontSize}px` }}>
                      পরম করুণাময় অতি দয়ালু আল্লাহর নামে
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. AUDIO & MEDIA SETTINGS TAB                                        */}
      {/* ==================================================================== */}
      {activeSubTab === "audio" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                  <Headphones className="size-4 text-[#2271b1]" />
                  <span>অডিও ও মিডিয়া সেটিংস (Audio & Reciters Management)</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  কুরআন তেলাওয়াত ও বিভিন্ন ভাষার অনুবাদ অডিও ট্র্যাকের সাধারণ ভিজিটর পারমিশন নিয়ন্ত্রণ।
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateTranslationAudioPermissions(true)}
                  className="h-7 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <Check className="size-3 mr-1 text-emerald-600" />
                  সকল অডিও উন্মুক্ত
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateTranslationAudioPermissions(false)}
                  className="h-7 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  <Lock className="size-3 mr-1 text-amber-600" />
                  সকল অডিও স্থগিত
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("surah-audio")}
                  className="h-7 text-xs bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer"
                >
                  <SlidersHorizontal className="size-3 mr-1" />
                  সুরার অডিও কন্ট্রোল প্যানেল →
                </Button>
              </div>
            </div>

            {/* Translation Tracks List */}
            <div className="divide-y divide-border/60 border border-border/70 rounded-lg overflow-hidden">
              {translationTracksList.map((track) => {
                const isAllowed = isTranslationAudioAllowed(track.key, false);

                return (
                  <div
                    key={track.key}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          {track.label}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAllowed
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isAllowed ? "✓ অডিও উন্মুক্ত" : "🔒 ভিজিটরদের জন্য লুকানো"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {track.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <Switch
                        id={`wp-audio-${track.key}`}
                        checked={isAllowed}
                        onCheckedChange={async (val) => {
                          await updateTranslationAudioPermission(track.key, val);
                          toast.success(
                            `"${track.label}" এর অডিও ${
                              val ? "উন্মুক্ত" : "স্থগিত"
                            } করা হয়েছে`
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. OFFLINE & CACHE SETTINGS TAB                                      */}
      {/* ==================================================================== */}
      {activeSubTab === "offline" && (
        <div className="space-y-6">
          {/* Header & Global Cache Actions */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                  <Zap className="size-4 text-amber-500 fill-amber-500" />
                  <span>অফলাইন, ক্যাশ ও স্পিড অপ্টিমাইজেশন (Offline, Cache & Speed Controls)</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  রেডিস ইন-মেমোরি ক্যাশ, ক্লাউডফ্লেয়ার এজ CDN, রিয়্যাক্ট কুয়েরি RAM এবং অফলাইন IndexedDB নিয়ন্ত্রণ।
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="default"
                  size="sm"
                  disabled={cleaningEverything}
                  onClick={handleCleanEverything}
                  className="h-8 text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-sm hover:shadow transition-all cursor-pointer border-0"
                >
                  {cleaningEverything ? (
                    <>
                      <RefreshCw className="size-3 mr-1.5 animate-spin" />
                      সবকিছু সাফ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 mr-1.5 text-amber-200 animate-pulse" />
                      সবকিছু একসাথে সাফ করুন (Clean Everything)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInvalidateQueryCache}
                  className="h-8 text-xs border-border/80 text-foreground hover:bg-muted cursor-pointer"
                >
                  <RefreshCw className="size-3 mr-1.5" />
                  ব্রাউজার র‍্যাম রিফ্রেশ (Invalidate)
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearCache}
                  className="h-8 text-xs cursor-pointer"
                >
                  <Trash2 className="size-3 mr-1.5" />
                  অফলাইন ক্যাশ খালি করুন (Clear Cache)
                </Button>
              </div>
            </div>

            {/* 5-Tier Cache Speed Hierarchy Banner */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50/50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-[#1e1e1e] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Activity className="size-3.5 text-[#2271b1]" />
                  <span>মাল্টি-লেয়ার ক্যাশিং সিস্টেম ও লেটেন্সি তুলনা (5-Tier Speed Hierarchy)</span>
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  গতি বৃদ্ধি: সর্বোচ্চ ১০০x গুণ পর্যন্ত
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                <div className="p-2.5 rounded-lg border border-border/70 bg-card/80 shadow-2xs">
                  <span className="text-[10px] text-muted-foreground block font-medium">১. ব্রাউজার র‍্যাম (RAM)</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">&lt; ১ ms</span>
                  <span className="text-[9px] text-muted-foreground">React Query Memory</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/70 bg-card/80 shadow-2xs">
                  <span className="text-[10px] text-muted-foreground block font-medium">২. লোকাল ডিস্ক (PWA)</span>
                  <span className="text-sm font-black text-teal-600 dark:text-teal-400 block">~১.৫ ms</span>
                  <span className="text-[9px] text-muted-foreground">IndexedDB Storage</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/70 bg-card/80 shadow-2xs">
                  <span className="text-[10px] text-muted-foreground block font-medium">৩. রেডিস ক্লাউড</span>
                  <span className={`text-sm font-black block ${redisSettings.lastLatencyMs && redisSettings.lastLatencyMs < 80 ? "text-emerald-600 dark:text-emerald-400" : "text-teal-600 dark:text-teal-400"}`}>
                    {redisSettings.lastLatencyMs && redisSettings.lastLatencyMs < 100
                      ? `${redisSettings.lastLatencyMs} ms`
                      : "~২০ ms"}
                  </span>
                  <span className="text-[9px] text-muted-foreground block truncate" title={redisSettings.lastLatencyMs ? `ক্লায়েন্ট পিং: ${redisSettings.lastLatencyMs} ms (সার্ভার এজ: ~২০ ms)` : undefined}>
                    {redisSettings.lastLatencyMs && redisSettings.lastLatencyMs >= 100
                      ? `Edge ~২০ms (Ping ${redisSettings.lastLatencyMs}ms)`
                      : "Upstash / Serverless"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/70 bg-card/80 shadow-2xs">
                  <span className="text-[10px] text-muted-foreground block font-medium">৪. এজ CDN</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 block">~১৫ ms</span>
                  <span className="text-[9px] text-muted-foreground">Cloudflare Global</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/70 bg-card/80 shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-muted-foreground block font-medium">৫. মূল ডেটাবেজ</span>
                  <span className="text-sm font-black text-rose-500 block">~১৮০ ms</span>
                  <span className="text-[9px] text-muted-foreground">Supabase PostgreSQL</span>
                </div>
              </div>
            </div>

            {/* CARD 1: REDIS IN-MEMORY CACHE (UPSTASH / SERVERLESS) */}
            <div className="p-4 sm:p-5 rounded-xl border border-[#c3c4c7] dark:border-[#3c434a] bg-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                    <Server className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground">
                        রেডিস ইন-মেমোরি ক্যাশ (Redis / Upstash Serverless Cache)
                      </h3>
                      {redisSettings.enabled ? (
                        testResult?.ok ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            সক্রিয় ও সংযুক্ত ({testResult.latencyMs} ms)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            সক্রিয় (কনফিগার করা হয়েছে)
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          নিষ্ক্রিয় (Disabled)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cloudflare Workers এজ এবং সুপাবেজের মধ্যে অতিদ্রুত ডেটা সরবরাহের জন্য সার্ভারলেস রেডিস ক্যাশ।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Label htmlFor="redis-enabled-switch" className="text-xs font-semibold text-foreground cursor-pointer">
                    রেডিস ক্যাশ সক্রিয়
                  </Label>
                  <Switch
                    id="redis-enabled-switch"
                    checked={redisSettings.enabled}
                    onCheckedChange={(val) =>
                      setRedisSettings((prev) => ({ ...prev, enabled: val }))
                    }
                  />
                </div>
              </div>

              {/* Upstash Setup Quick Guide Toggle */}
              <div className="border border-border/80 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/20">
                <button
                  type="button"
                  onClick={() => setRedisGuideOpen(!redisGuideOpen)}
                  className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[#2271b1] dark:text-[#72aee6] hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-[#2271b1]" />
                    <span>Upstash Redis কীভাবে ১ মিনিটে ফ্রিতে সেটআপ করবেন? (স্টেপ-বাই-স্টেপ গাইড)</span>
                  </span>
                  {redisGuideOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {redisGuideOpen && (
                  <div className="p-3.5 border-t border-border/60 text-xs space-y-2.5 text-muted-foreground bg-card">
                    <div className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-[#2271b1] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">১</span>
                      <div>
                        <strong className="text-foreground">Upstash কনসোলে প্রবেশ করুন:</strong>
                        <p className="mt-0.5">
                          ব্রাউজারে{" "}
                          <a
                            href="https://console.upstash.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#2271b1] underline font-medium inline-flex items-center gap-1"
                          >
                            console.upstash.com
                            <ExternalLink className="size-3" />
                          </a>{" "}
                          খুলুন এবং <strong>"Continue with GitHub"</strong> দিয়ে ১-ক্লিকে ফ্রি অ্যাকাউন্ট খুলুন (কোনো ক্রেডিট কার্ড লাগে না)।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-[#2271b1] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">২</span>
                      <div>
                        <strong className="text-foreground">নতুন ডেটাবেজ তৈরি করুন (Create Database):</strong>
                        <p className="mt-0.5">
                          <strong>"Create Database"</strong> বাটনে ক্লিক করুন। নাম দিন <code className="font-mono bg-muted px-1 rounded">quran-cache</code> এবং রিজিয়ন হিসেবে <strong>ap-southeast-1 (Singapore)</strong> বা নিকটবর্তী রিজিয়ন নির্বাচন করে Create চাপুন।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-[#2271b1] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">৩</span>
                      <div>
                        <strong className="text-foreground">REST API ক্রেডেনশিয়াল কপি করুন:</strong>
                        <p className="mt-0.5">
                          ডাটাবেজের বিবরণ পেজে নিচে স্ক্রল করে <strong>"REST API"</strong> ট্যাবে যান:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1 font-mono text-[11px] text-foreground">
                          <li><strong>UPSTASH_REDIS_REST_URL</strong> কপি করে নিচের "রেডিস REST URL" বক্সে দিন।</li>
                          <li><strong>UPSTASH_REDIS_REST_TOKEN</strong> কপি করে নিচের "রেডিস REST Token" বক্সে দিন।</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px] flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>
                        <strong>জরুরি সতর্কতা:</strong> এখানে আপনার জিমেইল/ব্যক্তিগত ইমেইল বা পাসওয়ার্ড দেবেন না। Upstash কনসোল থেকে প্রাপ্ত <code className="font-mono bg-amber-500/20 px-1 rounded">https://...upstash.io</code> লিঙ্ক ও টোকেন পেস্ট করুন।
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Redis Configuration Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    রেডিস প্রোভাইডার (Redis Provider)
                  </Label>
                  <select
                    value={redisSettings.provider}
                    onChange={(e) =>
                      setRedisSettings((prev) => ({
                        ...prev,
                        provider: e.target.value as any,
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-foreground text-xs"
                  >
                    <option value="upstash">Upstash Serverless Redis (Cloudflare Workers Ready - প্রস্তাবিত)</option>
                    <option value="custom">Custom Redis REST Endpoint / Proxy</option>
                    <option value="redis_cloud">Redis Cloud REST Proxy</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Upstash Redis ক্লাউডফ্লেয়ার এজের জন্য অপ্টিমাইজড (HTTP/REST প্রোটোকল)।
                  </p>
                </div>

                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    ডিফল্ট ক্যাশ স্থায়িত্ব (Default TTL)
                  </Label>
                  <select
                    value={redisSettings.ttl}
                    onChange={(e) =>
                      setRedisSettings((prev) => ({
                        ...prev,
                        ttl: Number(e.target.value),
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-foreground text-xs"
                  >
                    <option value="900">১৫ মিনিট (Testing &amp; Fast Updates)</option>
                    <option value="3600">১ ঘণ্টা (Standard Dynamic Data)</option>
                    <option value="21600">৬ ঘণ্টা (Balanced Performance)</option>
                    <option value="86400">২৪ ঘণ্টা (প্রস্তাবিত - High Traffic)</option>
                    <option value="604800">৭ দিন (Aggressive Caching)</option>
                    <option value="2592000">৩০ দিন (ম্যাক্সিমাম স্পিড)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    মেয়াদ শেষ হলে স্বয়ংক্রিয়ভাবে ব্যাকগ্রাউন্ডে রিফ্রেশ হবে।
                  </p>
                </div>

                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    রেডিস REST URL
                  </Label>
                  <Input
                    placeholder="https://stirring-moth-12345.upstash.io"
                    value={redisSettings.url}
                    onChange={(e) =>
                      setRedisSettings((prev) => ({ ...prev, url: e.target.value }))
                    }
                    className={`h-8 text-xs font-mono ${
                      redisSettings.url && (redisSettings.url.includes("@") || !redisSettings.url.startsWith("http"))
                        ? "border-amber-500 bg-amber-500/5 focus-visible:ring-amber-500"
                        : ""
                    }`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Upstash Console থেকে প্রাপ্ত REST URL পেস্ট করুন।
                  </p>

                  {/* Warning if URL is an email or doesn't start with http */}
                  {redisSettings.url && (redisSettings.url.includes("@") || !redisSettings.url.startsWith("http")) && (
                    <div className="mt-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px] flex items-start gap-1.5">
                      <AlertCircle className="size-3.5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <strong>সতর্কতা: এটি একটি ইমেইল ঠিকানা মনে হচ্ছে!</strong>
                        <p className="mt-0.5">
                          এখানে আপনার ইমেইল নয়, বরং Upstash-এর ডাটাবেজ লিংক দিন (যেমন:{" "}
                          <code className="font-mono bg-amber-500/20 px-1 rounded">https://stirring-moth-12345.upstash.io</code>)।
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    রেডিস REST Token (Bearer Token)
                  </Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="AXxxxx..."
                      value={redisSettings.token}
                      onChange={(e) =>
                        setRedisSettings((prev) => ({ ...prev, token: e.target.value }))
                      }
                      className="h-8 text-xs font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    টোকেনটি এনক্রিপ্টেড আকারে ডাটাবেজে সংরক্ষিত থাকে।
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    ক্যাশ কি-প্রিফিক্স (Key Namespace)
                  </Label>
                  <Input
                    placeholder="quran_cache:"
                    value={redisSettings.prefix}
                    onChange={(e) =>
                      setRedisSettings((prev) => ({ ...prev, prefix: e.target.value }))
                    }
                    className="h-8 text-xs font-mono max-w-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    অন্যান্য অ্যাপ্লিকেশনের কি-এর সাথে সংঘর্ষ এড়াতে প্রিফিক্স ব্যবহার করা হয়।
                  </p>
                </div>
              </div>

              {/* Granular Cache Target Scope Checkboxes */}
              <div className="p-3.5 rounded-lg border border-border/80 bg-slate-50 dark:bg-slate-800/20 space-y-2.5">
                <span className="text-xs font-bold text-foreground block">
                  কী কী ডাটা রেডিসে ক্যাশ করবেন (Selective Caching Targets):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redisSettings.cacheSettings}
                      onChange={(e) =>
                        setRedisSettings((prev) => ({ ...prev, cacheSettings: e.target.checked }))
                      }
                      className="rounded border-input text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>সাইট সেটিংস ও অনুমতি (Settings)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redisSettings.cacheSurahs}
                      onChange={(e) =>
                        setRedisSettings((prev) => ({ ...prev, cacheSurahs: e.target.checked }))
                      }
                      className="rounded border-input text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>১১৪ সুরার মেটাডাটা ও আয়াত</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redisSettings.cacheTts}
                      onChange={(e) =>
                        setRedisSettings((prev) => ({ ...prev, cacheTts: e.target.checked }))
                      }
                      className="rounded border-input text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>টেক্সট-টু-স্পিচ (TTS) অডিও ক্যাশ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redisSettings.cacheLexicon}
                      onChange={(e) =>
                        setRedisSettings((prev) => ({ ...prev, cacheLexicon: e.target.checked }))
                      }
                      className="rounded border-input text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>লেক্সিকন ও শব্দকোষ অনুসন্ধান</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redisSettings.cacheArticles}
                      onChange={(e) =>
                        setRedisSettings((prev) => ({ ...prev, cacheArticles: e.target.checked }))
                      }
                      className="rounded border-input text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>আর্টিকেল ও স্থির পেজ ডাটা</span>
                  </label>
                </div>
              </div>

              {/* Action Result Notification Banner if tested */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    testResult.ok
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.ok ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0 text-red-600" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.ok && (
                    <span className="font-mono font-bold shrink-0">{testResult.latencyMs} ms</span>
                  )}
                </div>
              )}

              {/* Redis Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testingRedis}
                    onClick={handleTestRedis}
                    className="h-8 text-xs cursor-pointer"
                  >
                    {testingRedis ? (
                      <>
                        <RefreshCw className="size-3 mr-1.5 animate-spin" />
                        টেস্ট হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Zap className="size-3 mr-1.5 text-amber-500" />
                        কানেকশন টেস্ট করুন (Ping)
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={fetchingDbSize}
                    onClick={handleGetDbSize}
                    className="h-8 text-xs cursor-pointer"
                  >
                    {fetchingDbSize ? (
                      <RefreshCw className="size-3 mr-1.5 animate-spin" />
                    ) : (
                      <Database className="size-3 mr-1.5 text-blue-500" />
                    )}
                    {redisDbSize !== null
                      ? `ক্যাশ আইটেম: ${redisDbSize}টি`
                      : "ক্যাশ কি-কাউন্টার (DB Size)"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={flushingRedis}
                    onClick={handleFlushRedis}
                    className="h-8 text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                  >
                    {flushingRedis ? (
                      <RefreshCw className="size-3 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3 mr-1.5" />
                    )}
                    রেডিস ক্যাশ ফ্লাশ করুন
                  </Button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={savingRedis}
                  onClick={handleSaveRedisSettings}
                  className="h-8 text-xs bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer"
                >
                  {savingRedis ? (
                    <>
                      <RefreshCw className="size-3 mr-1.5 animate-spin" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Save className="size-3 mr-1.5" />
                      রেডিস কনফিগারেশন সংরক্ষণ করুন
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* CARD 2: LIVE SPEED & LATENCY BENCHMARK TOOL */}
            <div className="p-4 sm:p-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-50/30 via-card to-card dark:from-amber-950/20 dark:via-[#1e1e1e] dark:to-[#1e1e1e] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Gauge className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      লাইভ স্পিড ও লেটেন্সি বেঞ্চমার্ক টুল (Live Latency Benchmark)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      রিয়েল-টাইমে ব্রাউজার র‍্যাম, লোকাল ডিস্ক, ক্লাউডফ্লেয়ার এজ, রেডিস ও মূল ডেটাবেজের রেসপন্স টাইম পরীক্ষা করুন।
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={benchmarking}
                  onClick={handleRunBenchmark}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  {benchmarking ? (
                    <>
                      <RefreshCw className="size-3 mr-1.5 animate-spin" />
                      টেস্ট চলছে...
                    </>
                  ) : (
                    <>
                      <Zap className="size-3 mr-1.5" />
                      লাইভ স্পিড টেস্ট চালান
                    </>
                  )}
                </Button>
              </div>

              {benchmarkResults ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                    {/* Tier 1 */}
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">১. র‍্যাম ক্যাশ</span>
                        <span className="font-mono font-bold text-emerald-600">{benchmarkResults.inMemoryMs} ms</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-full" />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">React Query (Instant)</span>
                    </div>

                    {/* Tier 2 */}
                    <div className="p-3 rounded-lg border border-teal-500/30 bg-teal-500/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-teal-700 dark:text-teal-400">২. লোকাল ডিস্ক</span>
                        <span className="font-mono font-bold text-teal-600">{benchmarkResults.indexedDbMs} ms</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 w-[92%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">IndexedDB (PWA Disk)</span>
                    </div>

                    {/* Tier 3 */}
                    <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">৩. এজ CDN</span>
                        <span className="font-mono font-bold text-blue-600">{benchmarkResults.edgeCdnMs} ms</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[80%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">Cloudflare Edge CDN</span>
                    </div>

                    {/* Tier 4 */}
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">৪. রেডিস ক্লাউড</span>
                        <span className="font-mono font-bold text-amber-600">
                          {benchmarkResults.redisMs !== null ? `${benchmarkResults.redisMs} ms` : "অফলাইন"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: benchmarkResults.redisMs ? "75%" : "0%",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">Upstash Serverless</span>
                    </div>

                    {/* Tier 5 */}
                    <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-rose-700 dark:text-rose-400">৫. সেন্ট্রাল DB</span>
                        <span className="font-mono font-bold text-rose-600">{benchmarkResults.supabaseDbMs} ms</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-[25%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">PostgreSQL Origin</span>
                    </div>
                  </div>

                  {/* Summary performance gain text */}
                  <div className="p-3 rounded-lg bg-card border border-border/80 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                      <span>
                        সর্বশেষ পরীক্ষা: <strong>{benchmarkResults.testedAt}</strong> — ক্যাশিং লেয়ার সক্রিয় থাকার ফলে সাইটের গতি মূল ডেটাবেজের চেয়ে প্রায়{" "}
                        <strong className="text-foreground">
                          {Math.round(
                            benchmarkResults.supabaseDbMs /
                              Math.max(1, benchmarkResults.redisMs || benchmarkResults.edgeCdnMs)
                          )}x গুণ দ্রুত
                        </strong>{" "}
                        এবং ডেটাবেজ ব্যান্ডউইথ ৯০% সাশ্রয় হয়।
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-card/60 border border-border/60 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    "লাইভ স্পিড টেস্ট চালান" বাটনে ক্লিক করে বর্তমান সংযোগের সঠিক রেসপন্স টাইম ও ক্যাশ কার্যকারিতা পরিমাপ করুন।
                  </p>
                </div>
              )}
            </div>

            {/* CARD 3: CLOUDFLARE EDGE CDN CACHE SETTINGS & PURGE */}
            <div className="p-4 sm:p-5 rounded-xl border border-[#c3c4c7] dark:border-[#3c434a] bg-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-[#f38020]/10 flex items-center justify-center text-[#f38020]">
                    <Cloud className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground">
                        ক্লাউডফ্লেয়ার এজ CDN ক্যাশ সেটিংস ও পার্জ (Cloudflare Edge Cache Controls)
                      </h3>
                      {cfSettings.zoneId && cfSettings.apiToken ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          API কনফিগারেশন সক্রিয়
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          API ক্রেডেনশিয়াল দিন (Purge এর জন্য)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      বিশ্বব্যাপী ৩০০+ এজ ডেটা সেন্টারে ক্যাশ পলিসি নিয়ন্ত্রণ ও এক ক্লিকে গ্লোবাল ক্যাশ পার্জ (Purge Cache)।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#f38020]/10 text-[#f38020] border border-[#f38020]/20 flex items-center gap-1.5">
                    <Globe className="size-3" />
                    <span>quraan.bd Edge Active</span>
                  </span>
                </div>
              </div>

              {/* Cloudflare Setup Guide Accordion */}
              <div className="border border-border/80 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/20">
                <button
                  type="button"
                  onClick={() => setCfGuideOpen(!cfGuideOpen)}
                  className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[#f38020] hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-[#f38020]" />
                    <span>Cloudflare Zone ID ও API Token কীভাবে সংগ্রহ করবেন? (সহায়িকা গাইড)</span>
                  </span>
                  {cfGuideOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {cfGuideOpen && (
                  <div className="p-3.5 border-t border-border/60 text-xs space-y-2.5 text-muted-foreground bg-card">
                    <div className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-[#f38020] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">১</span>
                      <div>
                        <strong className="text-foreground">Cloudflare ড্যাশবোর্ডে প্রবেশ করুন:</strong>
                        <p className="mt-0.5">
                          <a
                            href="https://dash.cloudflare.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#f38020] underline font-medium inline-flex items-center gap-1"
                          >
                            dash.cloudflare.com
                            <ExternalLink className="size-3" />
                          </a>{" "}
                          এ গিয়ে আপনার অ্যাকাউন্ট থেকে ডোমেন <strong>quraan.bd</strong> (বা wooniche.com) নির্বাচন করুন।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-[#f38020] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">২</span>
                      <div>
                        <strong className="text-foreground">Zone ID কপি করুন:</strong>
                        <p className="mt-0.5">
                          <strong>Overview</strong> পেজে ডানে নিচের দিকে স্ক্রল করলে <strong>API</strong> সেকশনে <strong>Zone ID</strong> দেখতে পাবেন। সেটি কপি করে নিচের "Cloudflare Zone ID" ইনপুট ফিল্ডে দিন।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-[#f38020] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">৩</span>
                      <div>
                        <strong className="text-foreground">Cache Purge API Token তৈরি করুন:</strong>
                        <p className="mt-0.5">
                          <a
                            href="https://dash.cloudflare.com/profile/api-tokens"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#f38020] underline font-medium inline-flex items-center gap-1"
                          >
                            dash.cloudflare.com/profile/api-tokens
                            <ExternalLink className="size-3" />
                          </a>{" "}
                          এ গিয়ে <strong>"Create Token"</strong> চাপুন। <strong>"Cache Purge"</strong> টেমপ্লেট নির্বাচন করে Zone হিসেবে <strong>quraan.bd</strong> (বা wooniche.com) সিলেক্ট করুন এবং টোকেনটি কপি করে এখানে পেস্ট করুন।
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cloudflare Configuration Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    Cloudflare Zone ID
                  </Label>
                  <Input
                    placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
                    value={cfSettings.zoneId}
                    onChange={(e) =>
                      setCfSettings((prev) => ({ ...prev, zoneId: e.target.value }))
                    }
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Cloudflare Overview পেজের ডান সাইডবারে Zone ID পাওয়া যায়।
                  </p>
                </div>

                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    Cloudflare API Token (Cache Purge Permission)
                  </Label>
                  <div className="relative">
                    <Input
                      type={showCfToken ? "text" : "password"}
                      placeholder="e.g. v6q7F_..."
                      value={cfSettings.apiToken}
                      onChange={(e) =>
                        setCfSettings((prev) => ({ ...prev, apiToken: e.target.value }))
                      }
                      className="h-8 text-xs font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCfToken(!showCfToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showCfToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    টোকেনটিতে Cache Purge অনুমতি থাকতে হবে।
                  </p>
                </div>

                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    এজ ক্যাশ পলিসি (Cache Strategy)
                  </Label>
                  <select
                    value={cfSettings.cacheLevel}
                    onChange={(e) =>
                      setCfSettings((prev) => ({
                        ...prev,
                        cacheLevel: e.target.value as any,
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-foreground text-xs"
                  >
                    <option value="aggressive">Aggressive (Cache Everything - সর্বোচ্চ স্পিড ও লো-সার্ভার লোড)</option>
                    <option value="standard">Standard (Query String সহ ক্যাশ)</option>
                    <option value="bypass">Bypass (ক্যাশ সাময়িকভাবে বাইপাস / ডেভেলপমেন্ট মোড)</option>
                  </select>
                </div>

                <div>
                  <Label className="font-semibold text-foreground text-xs block mb-1">
                    ব্রাউজার ক্যাশ TTL (Browser Cache-Control Max-Age)
                  </Label>
                  <select
                    value={cfSettings.browserTtl}
                    onChange={(e) =>
                      setCfSettings((prev) => ({
                        ...prev,
                        browserTtl: Number(e.target.value),
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-foreground text-xs"
                  >
                    <option value="14400">৪ ঘণ্টা (Fast changes)</option>
                    <option value="86400">২৪ ঘণ্টা / ১ দিন (প্রস্তাবিত)</option>
                    <option value="604800">৭ দিন (High performance)</option>
                    <option value="2592000">৩০ দিন (ম্যাক্সিমাম স্পিড)</option>
                  </select>
                </div>
              </div>

              {/* Granular Purge Specific URLs */}
              <div className="p-3 rounded-lg border border-border/70 bg-slate-50 dark:bg-slate-800/20 space-y-2">
                <Label className="font-semibold text-foreground text-xs block">
                  নির্দিষ্ট পেজের ক্যাশ মুছুন (Purge Specific URLs - ঐচ্ছিক):
                </Label>
                <textarea
                  rows={2}
                  value={customPurgeUrls}
                  onChange={(e) => setCustomPurgeUrls(e.target.value)}
                  placeholder={"https://www.quraan.bd/\nhttps://www.quraan.bd/download\nhttps://www.quraan.bd/api/public/tts"}
                  className="w-full p-2 text-xs font-mono rounded-md border border-input bg-background text-foreground resize-y"
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    একাধিক URL থাকলে প্রতি লাইনে একটি করে সম্পূর্ণ URL লিখুন।
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={purgingCf || !customPurgeUrls.trim()}
                    onClick={() => handlePurgeCloudflare(false)}
                    className="h-7 text-xs border-[#f38020]/40 text-[#f38020] hover:bg-[#f38020]/10 cursor-pointer"
                  >
                    {purgingCf ? (
                      <>
                        <RefreshCw className="size-3 mr-1.5 animate-spin" />
                        পার্জ হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-3 mr-1.5" />
                        চিহ্নিত URL ক্যাশ পার্জ করুন
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Notification Banner */}
              {cfPurgeResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    cfPurgeResult.ok
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cfPurgeResult.ok ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0 text-red-600" />
                    )}
                    <span>{cfPurgeResult.message}</span>
                  </div>
                  {cfSettings.lastPurgedAt && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      সময়: {cfSettings.lastPurgedAt}
                    </span>
                  )}
                </div>
              )}

              {/* Cloudflare Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={purgingCf}
                  onClick={() => handlePurgeCloudflare(true)}
                  className="h-8 text-xs text-[#f38020] border-[#f38020]/30 hover:bg-[#f38020]/10 cursor-pointer"
                >
                  {purgingCf ? (
                    <>
                      <RefreshCw className="size-3 mr-1.5 animate-spin" />
                      পার্জ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3 mr-1.5" />
                      ক্লাউডফ্লেয়ার এজ ক্যাশ সম্পূর্ণ খালি করুন (Purge Everything)
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={savingCf}
                  onClick={handleSaveCfSettings}
                  className="h-8 text-xs bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer"
                >
                  {savingCf ? (
                    <>
                      <RefreshCw className="size-3 mr-1.5 animate-spin" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Save className="size-3 mr-1.5" />
                      ক্লাউডফ্লেয়ার ক্যাশ সেটিংস সংরক্ষণ করুন
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* CARD 4: REACT QUERY MEMORY CACHE CONTROLS */}
            <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">ব্রাউজার মেমোরি ও React Query ক্যাশ</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ইউজার নেভিগেশনে নিমেষেই ০ms-এ পেজ ট্রানজিশন ও মেমোরি রিফ্রেশ নিয়ন্ত্রণ।
                  </p>
                </div>
                <Cpu className="size-5 text-indigo-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end text-xs">
                <div>
                  <Label className="text-[11px] text-muted-foreground block mb-1">
                    কুয়েরি স্টেল টাইম (Query StaleTime):
                  </Label>
                  <select
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-foreground text-xs"
                    defaultValue="300"
                  >
                    <option value="0">০ সেকেন্ড (সর্বদা নতুন ডাটা ফেচ)</option>
                    <option value="300">৫ মিনিট (ভারসাম্যপূর্ণ / স্ট্যান্ডার্ড)</option>
                    <option value="1800">৩০ মিনিট (দ্রুত নেভিগেশন)</option>
                    <option value="86400">২৪ ঘণ্টা (সর্বোচ্চ স্পিড ও লো-ব্যান্ডউইথ)</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleInvalidateQueryCache}
                  className="w-full h-8 text-xs border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                >
                  <RefreshCw className="size-3 mr-1.5" />
                  ব্রাউজার মেমোরি ক্যাশ রিফ্রেশ করুন (Invalidate)
                </Button>
              </div>
            </div>

            {/* CARD 5: OFFLINE PRELOADERS (114 SURAHS & 6236 AYAHS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 5a: 114 Surahs */}
              <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">১১৪টি সুরার সম্পূর্ণ ডাটা</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ১১৪টি সুরার টেক্সট ও অনুবাদ লোকাল IndexedDB ও ব্রাউজার ক্যাশে প্রিলোড করুন।
                    </p>
                  </div>
                  <Database className="size-5 text-[#2271b1]" />
                </div>

                {surahProgress !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>ডাউনলোড হচ্ছে...</span>
                      <span>{surahProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2271b1] transition-all duration-300"
                        style={{ width: `${surahProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  disabled={downloadingSurahs}
                  onClick={handleDownloadAllSurahs}
                  className="w-full text-xs h-8 bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer"
                >
                  {downloadingSurahs ? (
                    <>
                      <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                      সংরক্ষণ হচ্ছে ({surahProgress}%)
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5 mr-1.5" />
                      ১১৪টি সুরা প্রিলোড করুন
                    </>
                  )}
                </Button>
              </div>

              {/* Card 5b: 6236 Ayahs */}
              <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">৬২৩৬টি আয়াত ও শব্দকোষ</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      শব্দে শব্দে বিশ্লেষণ, মূল ধাতু (Root) ও ব্যাকরণ ডাটা ক্যাশ সংরক্ষণ।
                    </p>
                  </div>
                  <HardDrive className="size-5 text-emerald-600" />
                </div>

                {ayahProgress !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>সংরক্ষণ হচ্ছে...</span>
                      <span>{ayahProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${ayahProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  disabled={downloadingAyahs}
                  onClick={handleDownloadAllAyahs}
                  className="w-full text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                >
                  {downloadingAyahs ? (
                    <>
                      <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                      সংরক্ষণ হচ্ছে ({ayahProgress}%)
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5 mr-1.5" />
                      ৬২৩৬টি আয়াত অফলাইন সেভ করুন
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* CARD 6: ANDROID APP & GOOGLE PLAY STORE PUBLISHING PACKAGE */}
            <div className="p-4 sm:p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 via-card to-card dark:from-emerald-950/20 dark:via-[#1e1e1e] dark:to-[#1e1e1e] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground">
                        অ্যান্ড্রয়েড অ্যাপ (১০০% অফলাইন APK v4.0.0) ও প্লে স্টোর প্যাকেজ
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Play Console Ready
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      গুগল প্লে কনসোলে রিলিজের জন্য অফিসিয়াল .aab ফাইল, 1024x500 ব্যানার, 512px আইকন এবং সরাসরি ইনস্টলেশন ১০০% অফলাইন .apk ফাইল (২৩.৫ MB)।
                    </p>
                  </div>
                </div>

                <a
                  href="/download"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#2271b1] hover:underline font-medium shrink-0 self-start sm:self-auto"
                >
                  <span>পাবলিক ডাউনলোড পেজ</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Direct APK */}
                <div className="p-3 rounded-lg border border-border/80 bg-card flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      ১০০% অফলাইন APK (v3.3.7)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ১১৪ সূরা প্রি-ইনস্টল করা • সাইজ ~১৯.৫ MB
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                    <a href="/downloads/Quran-Explorer-Offline-v3.3.7.apk" download="Quran-Explorer-Offline-v3.3.7.apk">
                      <Download className="size-3 mr-1.5" />
                      APK ডাউনলোড
                    </a>
                  </Button>
                </div>

                {/* 2. Play Store AAB */}
                <div className="p-3 rounded-lg border border-border/80 bg-card flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Android App Bundle (.aab)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      গুগল প্লে কনসোলে আপলোডের ফাইল (~৮৮ KB)
                    </span>
                  </div>
                  <Button asChild size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                    <a href="/quran.aab" download="quran-v3.2.8.aab">
                      <Download className="size-3 mr-1.5" />
                      AAB বান্ডেল ডাউনলোড
                    </a>
                  </Button>
                </div>

                {/* 3. Full Package ZIP */}
                <div className="p-3 rounded-lg border border-border/80 bg-card flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      সম্পূর্ণ পাবলিশিং কিট (.zip)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      AAB + ব্যানার + আইকন + লিস্টিং টেক্সট
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                    <a href="/quran-playstore-package.zip" download="quran-playstore-package.zip">
                      <Download className="size-3 mr-1.5" />
                      সম্পূর্ণ কিট (.zip)
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. DISCUSSION & FEEDBACK SETTINGS TAB                                */}
      {/* ==================================================================== */}
      {activeSubTab === "discussion" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                <Mail className="size-4 text-[#2271b1]" />
                <span>মন্তব্য ও যোগাযোগ সেটিংস (Discussion & Contact Settings)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ব্যবহারকারীর মন্তব্য ও ফিডব্যাক ফর্মের স্প্যাম ফিল্টারিং ও মডারেশন পলিসি।
              </p>
            </div>

            <div className="space-y-4 max-w-2xl text-xs">
              <div className="p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/30 space-y-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="font-semibold text-foreground block">
                      কন্টাক্ট ফর্মে ক্লাউডফ্লেয়ার টার্নস্টাইল যাচাই সক্রিয়
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      বট ও স্প্যাম বার্তা প্রতিরোধে অদৃশ্য ক্লাউডফ্লেয়ার ক্যাপচা যুক্ত রাখবে।
                    </span>
                  </div>
                  <Switch checked={true} disabled />
                </label>
              </div>

              <div className="p-4 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-foreground block">
                      সরাসরি ইউজার মেসেজ ম্যানেজমেন্ট
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      সকল ভিজিটর বার্তা ও ফিডব্যাক দেখতে বার্তা প্যানেলে যান।
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("messages")}
                    className="h-8 text-xs bg-[#2271b1] hover:bg-[#135e96] text-white cursor-pointer"
                  >
                    বার্তা প্যানেল দেখুন →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. SECURITY & CLOUDFLARE TURNSTILE TAB                              */}
      {/* ==================================================================== */}
      {activeSubTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#c3c4c7] dark:border-[#3c434a] rounded shadow-2xs p-3.5 sm:p-5 md:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#1d2327] dark:text-white flex items-center gap-2">
                <Shield className="size-4 text-[#2271b1]" />
                <span>ক্লাউডফ্লেয়ার টার্নস্টাইল সিকিউরিটি কী (Security Keys)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ফর্ম প্রটেকশনের জন্য Cloudflare Turnstile সাইট কি এবং সিক্রেট কি পরিচালনা করুন।
              </p>
            </div>

            <TurnstileAdmin />
          </div>
        </div>
      )}
    </div>
  );
}
