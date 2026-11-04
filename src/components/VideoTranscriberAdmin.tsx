import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Video,
  Sparkles,
  Search,
  Copy,
  Check,
  Download,
  Clock,
  Play,
  RotateCcw,
  ExternalLink,
  Languages,
  Trash2,
  Send,
  AlertCircle,
  Filter,
  Mic,
  MicOff
} from "lucide-react";
import { PageHeroBackground } from "@/components/PageHeroBackground";
import { toast } from "sonner";

export interface TranscriptSegment {
  start: number;
  end: number;
  duration: number;
  timestamp: string;
  text: string;
}

interface TranscribeResponse {
  ok: boolean;
  source?: string;
  videoId?: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  durationFormatted?: string;
  totalSegments?: number;
  fullText?: string;
  segments?: TranscriptSegment[];
  message?: string;
  error?: string;
  available_languages?: Array<{ code: string; name: string; is_generated?: boolean }>;
}

interface VideoTranscriberAdminProps {
  onSendToArticleDraft?: (draftContent: string, title?: string) => void;
  onBackToDashboard?: () => void;
}

export function VideoTranscriberAdmin({
  onSendToArticleDraft,
  onBackToDashboard,
}: VideoTranscriberAdminProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedLang, setSelectedLang] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copyMode, setCopyMode] = useState<"with-timestamps" | "text-only">("with-timestamps");
  const [searchTerm, setSearchTerm] = useState("");
  const [activePlayerTime, setActivePlayerTime] = useState(0);
  const [translatedMap, setTranslatedMap] = useState<Record<number, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Fallback Web Speech Recognition
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // YouTube player reference for seeking
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract YouTube ID if valid
  const detectedYouTubeId = useMemo(() => {
    if (!videoUrl) return "";
    const m = videoUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
    );
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoUrl.trim())) return videoUrl.trim();
    return "";
  }, [videoUrl]);

  // Extract Facebook video ID or check if Facebook
  const isFacebookUrl = useMemo(() => {
    return /facebook\.com|fb\.watch/i.test(videoUrl);
  }, [videoUrl]);

  // Filtered segments based on search
  const filteredSegments = useMemo(() => {
    if (!result?.segments) return [];
    if (!searchTerm.trim()) return result.segments;
    const term = searchTerm.toLowerCase().trim();
    return result.segments.filter((s) => s.text.toLowerCase().includes(term));
  }, [result?.segments, searchTerm]);

  // Handle URL paste from clipboard
  const handlePasteUrl = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setVideoUrl(text.trim());
          toast.success("লিংক পেস্ট করা হয়েছে!");
        }
      }
    } catch {
      toast.error("ক্লিপবোর্ড থেকে পেস্ট করা যায়নি। সরাসরি ইনপুট বক্সে পেস্ট করুন।");
    }
  };

  // Perform transcription
  const handleTranscribe = async (overrideUrl?: string) => {
    const urlToFetch = overrideUrl || videoUrl.trim();
    if (!urlToFetch) {
      toast.error("অনুগ্রহ করে একটি ইউটিউব বা ফেসবুক ভিডিওর লিংক দিন");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const targetEndpoint =
        typeof window !== "undefined" && (window.location.hostname.includes("quraan.bd") || window.location.hostname.includes("wooniche.com"))
          ? "https://www.quraan.bd/api/public/transcribe-video"
          : "/api/public/transcribe-video";

      const res = await fetch(targetEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToFetch, lang: selectedLang }),
      });

      const data: TranscribeResponse = await res.json();

      if (data.ok && data.segments && data.segments.length > 0) {
        setResult(data);
        toast.success(`সফলভাবে ${data.segments.length}টি টাইমস্ট্যাম্প উদ্ধার করা হয়েছে!`);
      } else {
        // Fallback message
        setResult(data);
        toast.info(data.message || "ভিডিওটির সরাসরি ক্যাপশন পাওয়া যায়নি।");
      }
    } catch (err: any) {
      toast.error(err?.message || "ট্রান্সক্রিপশন রিকোয়েস্টে সমস্যা হয়েছে।");
      setResult({
        ok: false,
        error: "request_failed",
        message: "সার্ভারে যোগাযোগ করা যায়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Seek YouTube video in iframe
  const handleSeek = (seconds: number) => {
    setActivePlayerTime(seconds);
    if (iframeRef.current && detectedYouTubeId) {
      // PostMessage to YouTube iframe API
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [seconds, true],
        }),
        "*"
      );
    }
  };

  // Copy full transcript text
  const handleCopyAll = () => {
    if (!result?.segments) return;

    let textToCopy = "";
    if (copyMode === "with-timestamps") {
      textToCopy = result.segments
        .map((s) => `[${s.timestamp}] ${s.text}`)
        .join("\n\n");
    } else {
      textToCopy = result.segments.map((s) => s.text).join(" ");
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    toast.success(
      copyMode === "with-timestamps"
        ? "টাইমস্ট্যাম্পসহ সম্পূর্ণ টেক্সট কপি করা হয়েছে!"
        : "সম্পূর্ণ প্লেইন টেক্সট কপি করা হয়েছে!"
    );
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Translate all cues into Bengali
  const handleTranslateAll = async (targetLang = "bn") => {
    if (!result?.segments || result.segments.length === 0) return;
    setIsTranslating(true);
    toast.info("ট্রান্সক্রিপশন বাংলায় অনুবাদ করা হচ্ছে...");
    try {
      const newMap: Record<number, string> = {};
      const batchSize = 6;
      for (let i = 0; i < result.segments.length; i += batchSize) {
        const slice = result.segments.slice(i, i + batchSize);
        await Promise.all(
          slice.map(async (seg, offset) => {
            const index = i + offset;
            try {
              const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(seg.text)}`
              );
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && Array.isArray(data[0])) {
                  newMap[index] = data[0].map((item: any) => item[0]).join("");
                }
              }
            } catch {}
          })
        );
      }
      setTranslatedMap(newMap);
      toast.success("সবগুলো বাক্যের বাংলা অনুবাদ সফলভাবে সম্পন্ন হয়েছে!");
    } catch {
      toast.error("অনুবাদে সমস্যা হয়েছে।");
    } finally {
      setIsTranslating(false);
    }
  };

  // Copy individual segment
  const handleCopySegment = (seg: TranscriptSegment) => {
    navigator.clipboard.writeText(`[${seg.timestamp}] ${seg.text}`);
    toast.success(`কপি করা হয়েছে: [${seg.timestamp}]`);
  };

  // Download formats: TXT, SRT, VTT, JSON
  const handleDownload = (format: "txt" | "srt" | "vtt" | "json") => {
    if (!result?.segments) return;

    let content = "";
    let mime = "text/plain;charset=utf-8";
    let filename = `transcript_${result.videoId || "video"}.${format}`;

    if (format === "txt") {
      content = result.segments
        .map((s) => `[${s.timestamp}] ${s.text}`)
        .join("\n\n");
    } else if (format === "srt") {
      // SubRip format
      content = result.segments
        .map((s, idx) => {
          const sHour = Math.floor(s.start / 3600);
          const sMin = Math.floor((s.start % 3600) / 60);
          const sSec = Math.floor(s.start % 60);
          const sMs = Math.floor((s.start % 1) * 1000);

          const eHour = Math.floor(s.end / 3600);
          const eMin = Math.floor((s.end % 3600) / 60);
          const eSec = Math.floor(s.end % 60);
          const eMs = Math.floor((s.end % 1) * 1000);

          const formatSrtTime = (h: number, m: number, sec: number, ms: number) =>
            `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;

          return `${idx + 1}\n${formatSrtTime(sHour, sMin, sSec, sMs)} --> ${formatSrtTime(eHour, eMin, eSec, eMs)}\n${s.text}\n`;
        })
        .join("\n");
    } else if (format === "vtt") {
      // WebVTT format
      const vttLines = result.segments.map((s) => {
        const sHour = Math.floor(s.start / 3600);
        const sMin = Math.floor((s.start % 3600) / 60);
        const sSec = Math.floor(s.start % 60);
        const sMs = Math.floor((s.start % 1) * 1000);

        const eHour = Math.floor(s.end / 3600);
        const eMin = Math.floor((s.end % 3600) / 60);
        const eSec = Math.floor(s.end % 60);
        const eMs = Math.floor((s.end % 1) * 1000);

        const formatVttTime = (h: number, m: number, sec: number, ms: number) =>
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;

        return `${formatVttTime(sHour, sMin, sSec, sMs)} --> ${formatVttTime(eHour, eMin, eSec, eMs)}\n${s.text}\n`;
      });
      content = "WEBVTT\n\n" + vttLines.join("\n");
      mime = "text/vtt;charset=utf-8";
    } else if (format === "json") {
      content = JSON.stringify(result, null, 2);
      mime = "application/json;charset=utf-8";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} ফাইল ডাউনলোড সম্পন্ন হয়েছে!`);
  };

  // Convert to article draft
  const handleConvertToArticle = () => {
    if (!result?.segments) return;

    const title = result.title ? `ভিডিও নোট: ${result.title}` : "ভিডিও লেকচার ট্রান্সক্রিপশন ও আলোচনা";
    const bodyHtml = `
      <h2>ভিডিও পরিচিতি ও পটভূমি</h2>
      <p>মূল ভিডিও লিংক: <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${videoUrl}</a></p>
      ${result.durationFormatted ? `<p><strong>দৈর্ঘ্য:</strong> ${result.durationFormatted}</p>` : ""}
      <hr />
      <h3>টাইমস্ট্যাম্প সহ সম্পূর্ণ ট্রান্সক্রিপশন</h3>
      ${result.segments
        .map(
          (s) =>
            `<p><span style="color: #b88e58; font-weight: bold;">[${s.timestamp}]</span> ${s.text}</p>`
        )
        .join("\n")}
    `.trim();

    if (onSendToArticleDraft) {
      onSendToArticleDraft(bodyHtml, title);
    } else {
      navigator.clipboard.writeText(bodyHtml);
      toast.success("আর্টিকেল ফরম্যাটের এইচটিএমএল ক্লিপবোর্ডে কপি করা হয়েছে!");
    }
  };

  // Toggle client-side live speech recognition
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট নেই। Chrome বা Edge ব্যবহার করুন।");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      toast.info("ভয়েস রেকর্ডিং বন্ধ করা হয়েছে।");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang === "ar" ? "ar-SA" : selectedLang === "en" ? "en-US" : "bn-BD";

      recognition.onstart = () => {
        setIsRecording(true);
        toast.success(`লাইভ স্পিচ রিকগনিশন শুরু হয়েছে (${recognition.lang})`);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalCue = event.results[i][0].transcript.trim();
            if (finalCue) {
              const nowSeconds = Math.floor(Date.now() / 1000) % 3600;
              const formatSec = (s: number) =>
                `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

              setResult((prev) => {
                const currentSegments = prev?.segments || [];
                const newSeg: TranscriptSegment = {
                  start: nowSeconds,
                  end: nowSeconds + 4,
                  duration: 4,
                  timestamp: formatSec(nowSeconds),
                  text: finalCue,
                };
                return {
                  ok: true,
                  title: prev?.title || "লাইভ অডিও ট্রান্সক্রিপশন",
                  segments: [...currentSegments, newSeg],
                  totalSegments: currentSegments.length + 1,
                  fullText: (prev?.fullText ? prev.fullText + " " : "") + finalCue,
                };
              });
            }
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech error:", e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      toast.error("মাইক্রোফোন চালু করা সম্ভব হয়নি।");
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HERO SECTION (MATCHING HOME PAGE AESTHETIC) */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 shadow-xl bg-[var(--gradient-hero)] contain-paint text-foreground">
        <PageHeroBackground intensity="normal" fadeBottom={false} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10">
          {/* Top Back & Tag Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-primary/20 border border-[#b88e58]/40 text-amber-800 dark:text-[#ecd599] text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-500 dark:text-[#ecd599] animate-pulse" />
              <span>কুরআন অন্বেষা — এআই ও এজ ভিডিও ট্রান্সক্রাইবার হাব</span>
            </div>

            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-[#c4aa82] dark:border-[#b88e58]/40 hover:bg-[#b88e58]/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                ← ড্যাশবোর্ডে ফিরে যান
              </button>
            )}
          </div>

          {/* Heading */}
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-[#1e150f] dark:text-white leading-tight">
              ভিডিও থেকে টাইমস্ট্যাম্পসহ পূর্ণাঙ্গ টেক্সট ট্রান্সক্রিপশন
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm md:text-base text-[#4b3c2e] dark:text-white/80 font-medium leading-relaxed">
              ইউটিউব (YouTube) বা ফেসবুক (Facebook) ভিডিওর লিংক দিন। ১ ঘণ্টারও বেশি দীর্ঘ কোনো আলোচনা, লেকচার বা তিলাওয়াত মুহূর্তের মধ্যে প্রতিটি বাক্যের নিখুঁত টাইমস্ট্যাম্প সহ টেক্সটে রূপান্তরিত করুন।
            </p>
          </div>

          {/* 3D Compact Info Strip (Same as Home Hero Manifesto) */}
          <div className="hero-3d-compact-card mt-5 p-3 sm:py-2.5 sm:px-4 max-w-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#a16e03] dark:text-[#ecd599] font-bold font-serif">
                <Clock className="size-4 shrink-0 text-[#b07818] dark:text-[#b88e58]" />
                <span>যেকোনো দৈর্ঘ্যের ভিডিও (১+ ঘণ্টা সমর্থিত)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#4b3c2e] dark:text-white/80 font-medium">
                <span>• বহুভাষিক (বাংলা, আরবি, English)</span>
                <span>• ক্লিকযোগ্য টাইমস্ট্যাম্প</span>
                <span>• SRT/VTT এক্সপোর্ট</span>
              </div>
            </div>
          </div>

          {/* URL Input Form Box */}
          <div className="mt-6 max-w-3xl space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="ইউটিউব বা ফেসবুক ভিডিওর লিংক পেস্ট করুন (যেমন: https://www.youtube.com/watch?v=...)"
                  className="w-full h-12 pl-11 pr-24 rounded-xl border border-[#c4aa82] dark:border-[#b88e58]/45 bg-[#fbf7ee]/95 dark:bg-[#12171f]/90 text-foreground placeholder:text-muted-foreground/70 text-xs sm:text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#b88e58] focus:border-transparent transition-all backdrop-blur-md"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTranscribe();
                  }}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#a16e03] dark:text-[#b88e58]">
                  <Video className="size-5" />
                </div>
                {/* Clear / Paste Buttons inside input */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setVideoUrl("")}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePasteUrl}
                    className="px-2 py-1 text-[11px] font-medium rounded-md bg-[#b88e58]/15 hover:bg-[#b88e58]/25 text-[#a16e03] dark:text-[#ecd599] border border-[#b88e58]/30 transition-colors"
                  >
                    পেস্ট
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="sm:w-44">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-[#c4aa82] dark:border-[#b88e58]/45 bg-[#fbf7ee]/95 dark:bg-[#12171f]/90 text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#b88e58] cursor-pointer"
                >
                  <option value="">স্বয়ংক্রিয় ভাষা (Auto)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">English</option>
                  <option value="ur">اردو (Urdu)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>

              {/* Transcribe Button */}
              <button
                type="button"
                onClick={() => handleTranscribe()}
                disabled={isLoading || !videoUrl.trim()}
                className="h-12 px-6 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#b07818] to-[#b88e58] hover:from-[#a16e03] hover:to-[#a17830] text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="size-4 animate-spin" />
                    <span>বিশ্লেষণ চলছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>ট্রান্সক্রাইব করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo links row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#4b3c2e] dark:text-muted-foreground">
              <span className="font-semibold text-foreground">দ্রুত পরীক্ষা করুন:</span>
              <button
                type="button"
                onClick={() => {
                  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
                  setVideoUrl(url);
                  handleTranscribe(url);
                }}
                className="px-2.5 py-1 rounded-lg border border-[#c4aa82]/60 dark:border-[#b88e58]/30 hover:bg-[#b88e58]/15 text-[#a16e03] dark:text-[#ecd599] transition-colors cursor-pointer"
              >
                🎥 নমুনা ভিডিও ১
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = "https://youtube.com/shorts/BDTXW8qySFs?si=OtOG0gtflBgPY6G6";
                  setVideoUrl(url);
                  handleTranscribe(url);
                }}
                className="px-2.5 py-1 rounded-lg border border-[#c4aa82]/60 dark:border-[#b88e58]/30 hover:bg-[#b88e58]/15 text-[#a16e03] dark:text-[#ecd599] transition-colors cursor-pointer"
              >
                🎥 নমুনা ২ (শর্টস ভিডিও)
              </button>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  isRecording
                    ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {isRecording ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
                <span>{isRecording ? "লাইভ ভয়েস বন্ধ করুন" : "লাইভ স্পিচ/মাইক্রোফোন ট্রান্সক্রাইব"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LOADING STATE SKELETON */}
      {isLoading && (
        <div className="p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-md text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 text-[#b07818] dark:text-[#ecd599] animate-bounce">
            <Video className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">ভিডিও ট্রান্সক্রিপশন ও টাইমস্ট্যাম্প ডেটা তৈরি হচ্ছে...</h3>
            <p className="text-xs text-muted-foreground">
              ভিডিওর অডিও ট্র্যাক এবং দীর্ঘ সময়ের প্রতিটি বাক্যের টাইমস্ট্যাম্প সিঙ্ক করা হচ্ছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।
            </p>
          </div>
          <div className="w-48 h-1.5 mx-auto bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-primary animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      )}

      {/* 3. TRANSCRIPTION RESULT VIEW */}
      {result && result.segments && result.segments.length > 0 && (
        <div className="space-y-4">
          {/* Top Video Summary Banner */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {result.thumbnail && (
                <img
                  src={result.thumbnail}
                  alt={result.title || "Video thumbnail"}
                  className="w-20 h-14 sm:w-28 sm:h-18 object-cover rounded-xl border border-border shrink-0 shadow-xs"
                />
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-[#ecd599] border border-amber-500/25">
                    {result.source || "ভিডিও"}
                  </span>
                  {result.durationFormatted && (
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3.5 text-primary" />
                      {result.durationFormatted}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-muted-foreground">
                    • {result.segments.length} টি টাইমস্ট্যাম্প
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-foreground truncate max-w-xl">
                  {result.title || "ভিডিও ট্রান্সক্রিপশন ফলাফল"}
                </h2>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
              {/* Copy Toggle Mode */}
              <div className="inline-flex items-center p-1 rounded-lg border border-border bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => setCopyMode("with-timestamps")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    copyMode === "with-timestamps"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  টাইমস্ট্যাম্প সহ
                </button>
                <button
                  type="button"
                  onClick={() => setCopyMode("text-only")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    copyMode === "text-only"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  শুধু টেক্সট
                </button>
              </div>

              {/* Copy Full Button */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#b88e58] hover:bg-[#a16e03] text-white shadow-xs transition-colors cursor-pointer"
              >
                {copiedAll ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedAll ? "কপি হয়েছে!" : "সম্পূর্ণ কপি"}</span>
              </button>

              {/* Download Menu */}
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>ডাউনলোড</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-36 py-1 bg-popover border border-border rounded-xl shadow-lg z-30 hidden group-hover:block animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => handleDownload("txt")}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center justify-between"
                  >
                    <span>TXT ফাইল</span>
                    <span className="text-[10px] text-muted-foreground">.txt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("srt")}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center justify-between"
                  >
                    <span>SRT সাবটাইটেল</span>
                    <span className="text-[10px] text-muted-foreground">.srt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("vtt")}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center justify-between"
                  >
                    <span>WebVTT ফাইল</span>
                    <span className="text-[10px] text-muted-foreground">.vtt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("json")}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center justify-between"
                  >
                    <span>JSON ডেটা</span>
                    <span className="text-[10px] text-muted-foreground">.json</span>
                  </button>
                </div>
              </div>

              {/* Translate to Bengali Button */}
              <button
                type="button"
                onClick={() => handleTranslateAll("bn")}
                disabled={isTranslating}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-[#ecd599] transition-colors cursor-pointer"
                title="সম্পূর্ণ ট্রান্সক্রিপশন বাংলায় অনুবাদ করুন"
              >
                <Languages className="size-3.5" />
                <span>{isTranslating ? "অনুবাদ হচ্ছে..." : "বাংলায় অনুবাদ"}</span>
              </button>

              {/* Create Article Draft */}
              <button
                type="button"
                onClick={handleConvertToArticle}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                title="এই ট্রান্সক্রিপশন দিয়ে একটি নতুন ব্লগ বা গবেষণামূলক আর্টিকেলের ড্রাফট শুরু করুন"
              >
                <Send className="size-3.5" />
                <span>আর্টিকেলে ড্রাফট করুন</span>
              </button>
            </div>
          </div>

          {/* Dual-Pane View: Video Player (Left) + Interactive Timestamp Cues (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: VIDEO PLAYER */}
            <div className="lg:col-span-5 space-y-3">
              <div className="rounded-2xl border border-border/80 overflow-hidden bg-black shadow-md sticky top-20">
                {detectedYouTubeId ? (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      ref={iframeRef}
                      src={`https://www.youtube.com/embed/${detectedYouTubeId}?enablejsapi=1&autoplay=0&rel=0`}
                      title="YouTube video player"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : isFacebookUrl ? (
                  <div className="aspect-video w-full bg-black flex items-center justify-center p-4 text-center">
                    <div className="space-y-2">
                      <p className="text-xs text-white/80">ফেসবুক ভিডিও প্লেয়ার</p>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                      >
                        ফেসবুকে ভিডিওটি দেখুন <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-muted/40 flex items-center justify-center p-4 text-center">
                    <p className="text-xs text-muted-foreground">ভিডিও প্লেয়ার প্রিভিউ</p>
                  </div>
                )}

                {/* Player Helper Info */}
                <div className="p-3 bg-card border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Play className="size-3.5 text-primary" />
                    <span>টাইমস্ট্যাম্পে ক্লিক করলে ভিডিও স্বয়ংক্রিয়ভাবে সেই সময়ে চলে যাবে।</span>
                  </div>
                  {activePlayerTime > 0 && (
                    <span className="font-mono text-foreground font-semibold">
                      বর্তমান সময়: {Math.floor(activePlayerTime / 60)}:
                      {String(activePlayerTime % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE CUES STREAM */}
            <div className="lg:col-span-7 space-y-3">
              {/* Search Filter Box */}
              <div className="flex items-center gap-2 p-2 rounded-xl border border-border bg-card">
                <Search className="size-4 text-muted-foreground ml-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ট্রান্সক্রিপশনে কোনো নির্দিষ্ট শব্দ বা বাক্য ফিল্টার করুন..."
                  className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <span className="text-[11px] text-muted-foreground whitespace-nowrap px-2">
                  {filteredSegments.length} / {result.segments.length}
                </span>
              </div>

              {/* Segments List Scrollable Container */}
              <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 max-h-[640px] overflow-y-auto p-1 shadow-inner">
                {filteredSegments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                    <Filter className="size-6 mx-auto text-muted-foreground/50" />
                    <p>কোনো বাক্য মেলেনি। অন্য শব্দ দিয়ে খুঁজে দেখুন।</p>
                  </div>
                ) : (
                  filteredSegments.map((seg, index) => (
                    <div
                      key={index}
                      className="group p-3 sm:p-3.5 hover:bg-muted/40 transition-colors flex items-start gap-3 rounded-xl"
                    >
                      {/* Clickable Timestamp Badge */}
                      <button
                        type="button"
                        onClick={() => handleSeek(Math.floor(seg.start))}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#b88e58]/15 hover:bg-[#b88e58]/30 text-[#a16e03] dark:text-[#ecd599] font-mono text-xs font-bold border border-[#b88e58]/30 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                        title="এই সময়ে ভিডিওটি চালু করুন"
                      >
                        <Play className="size-3 fill-current" />
                        <span>{seg.timestamp}</span>
                      </button>

                      {/* Segment Text */}
                      <div className="flex-1 min-w-0 text-xs sm:text-sm text-foreground leading-relaxed pt-0.5 select-text">
                        <div className="font-medium">{seg.text}</div>
                        {translatedMap[index] && (
                          <div className="mt-1 text-xs text-amber-800 dark:text-[#ecd599] font-medium bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/25">
                            {translatedMap[index]}
                          </div>
                        )}
                      </div>

                      {/* Individual Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopySegment(seg)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-all shrink-0 cursor-pointer"
                        title="এই বাক্যটি কপি করুন"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. NO TRANSCRIPT NOTICE (FALLBACK) */}
      {result && (!result.segments || result.segments.length === 0) && (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-md space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-foreground">
                স্বয়ংক্রিয় ক্যাপশন পাওয়া যায়নি
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.message ||
                  "এই ভিডিওটিতে পূর্বে সংরক্ষিত কোনো স্বয়ংক্রিয় বা ম্যানুয়াল সাবটাইটেল ট্র্যাক নেই। আপনি নিচের লাইভ ভয়েস রিকগনিশন বোতাম ব্যবহার করে ভিডিও চলাকালীন লাইভ টেক্সট তৈরি করতে পারেন।"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isRecording
                  ? "bg-rose-500 text-white shadow-md animate-pulse"
                  : "bg-[#b88e58] hover:bg-[#a16e03] text-white shadow-sm"
              }`}
            >
              <Mic className="size-4" />
              <span>{isRecording ? "লাইভ ভয়েস ট্রান্সক্রাইব বন্ধ করুন" : "ভিডিও প্লে করে লাইভ স্পিচ শুনুন"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
