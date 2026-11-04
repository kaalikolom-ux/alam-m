import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  FileImage,
  Sparkles,
  Upload,
  Copy,
  Check,
  Download,
  RotateCw,
  Sliders,
  Type,
  Trash2,
  Send,
  RefreshCw,
  Languages,
  FileCode,
  Scan
} from "lucide-react";
import { PageHeroBackground } from "@/components/PageHeroBackground";
import { toast } from "sonner";

interface ImageToTextAdminProps {
  onSendToArticleDraft?: (draftContent: string, title?: string) => void;
  onBackToDashboard?: () => void;
}

export function ImageToTextAdmin({
  onSendToArticleDraft,
  onBackToDashboard,
}: ImageToTextAdminProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>("ben+eng");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Statistics
  const stats = useMemo(() => {
    if (!extractedText.trim()) {
      return { words: 0, characters: 0, lines: 0 };
    }
    const words = extractedText.trim().split(/\s+/).filter(Boolean).length;
    const characters = extractedText.length;
    const lines = extractedText.split("\n").filter((l) => l.trim().length > 0).length;
    return { words, characters, lines };
  }, [extractedText]);

  // Handle file select
  const handleFileChange = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("অনুগ্রহ করে একটি সঠিক ইমেজ ফাইল (PNG, JPG, WEBP) নির্বাচন করুন");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setExtractedText("");
      setConfidence(null);
      setRotation(0);
      toast.success("ছবি সফলভাবে আপলোড হয়েছে!");
    };
    reader.readAsDataURL(file);
  };

  // Global clipboard paste listener (Ctrl+V screenshot support)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileChange(blob);
            toast.info("ক্লিপবোর্ড থেকে স্ক্রিনশট গ্রহণ করা হয়েছে!");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Rotate image
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Run Tesseract OCR in browser WebAssembly
  const handleExtractText = async () => {
    if (!imageSrc) {
      toast.error("অনুগ্রহ করে প্রথমে একটি ছবি আপলোড করুন");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatusText("OCR ইঞ্জিন প্রস্তুত হচ্ছে...");
    setConfidence(null);

    try {
      // Dynamic import to avoid SSR bundling issues
      const { createWorker } = await import("tesseract.js");

      setStatusText(`ভাষা মডেল লোড হচ্ছে (${selectedLang})...`);
      const worker = await createWorker(selectedLang, 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            const pct = Math.round((m.progress || 0) * 100);
            setProgress(pct);
            setStatusText(`টেক্সট শনাক্তকরণ চলছে (${pct}%)...`);
          } else if (m.status) {
            setStatusText(`${m.status}...`);
          }
        },
      });

      // If rotation is applied, apply canvas transformation
      let imageToProcess: string | HTMLCanvasElement = imageSrc;
      if (rotation !== 0 || highContrast) {
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (rotation === 90 || rotation === 270) {
            canvas.width = img.height;
            canvas.height = img.width;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          if (highContrast) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
              const threshold = avg > 128 ? 255 : 0;
              d[i] = threshold;
              d[i + 1] = threshold;
              d[i + 2] = threshold;
            }
            ctx.putImageData(imgData, 0, 0);
          }

          imageToProcess = canvas;
        }
      }

      setStatusText("অক্ষর ও লাইন বিশ্লেষণ করা হচ্ছে...");
      const ret = await worker.recognize(imageToProcess);

      const cleaned = ret.data.text || "";
      setExtractedText(cleaned);
      setConfidence(Math.round(ret.data.confidence || 0));

      await worker.terminate();

      if (cleaned.trim()) {
        toast.success(`সফলভাবে টেক্সট এক্সট্রাক্ট করা হয়েছে! (${Math.round(ret.data.confidence || 0)}% নির্ভুলতা)`);
      } else {
        toast.info("ছবিতে কোনো স্পষ্ট পাঠ্য শনাক্ত করা যায়নি। অন্য ছবি বা ভাষা পরিবর্তন করে চেষ্টা করুন।");
      }
    } catch (err: any) {
      console.error("[OCR Extraction Error]:", err);
      toast.error(err?.message || "ওসিআর প্রক্রিয়ায় সমস্যা হয়েছে।");
      setStatusText("ত্রুটি: টেক্সট এক্সট্রাক্ট করা যায়নি।");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    if (!extractedText.trim()) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success("টেক্সট সফলভাবে কপি করা হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean / Normalize extracted text
  const handleCleanText = () => {
    if (!extractedText) return;
    const cleaned = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();
    setExtractedText(cleaned);
    toast.success("অতিরিক্ত স্পেস ও লাইন পরিচ্ছন্ন করা হয়েছে!");
  };

  // Download TXT or Markdown
  const handleDownload = (format: "txt" | "md") => {
    if (!extractedText.trim()) return;
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted_text_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} ফাইল ডাউনলোড সম্পন্ন হয়েছে!`);
  };

  // Convert to article draft
  const handleSendToDraft = () => {
    if (!extractedText.trim()) return;
    const paragraphs = extractedText
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

    const htmlContent = `
      <h2>ছবি থেকে সংগৃহীত টেক্সট ও নোট</h2>
      ${paragraphs}
    `.trim();

    if (onSendToArticleDraft) {
      onSendToArticleDraft(htmlContent, "ছবি থেকে সংগৃহীত পাণ্ডুলিপি / নোট");
    } else {
      navigator.clipboard.writeText(htmlContent);
      toast.success("আর্টিকেল ড্রাফট ফরম্যাটে ক্লিপবোর্ডে কপি করা হয়েছে!");
    }
  };

  // Load sample image
  const handleLoadSample = (type: "bengali" | "arabic") => {
    // Generate high-resolution canvas text sample for instant test
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1e150f";
      ctx.font = type === "bengali" ? "bold 28px sans-serif" : "bold 32px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (type === "bengali") {
        ctx.fillText("কুরআন অন্বেষা — প্রতিটি শব্দের অর্থ ও সহজ বাংলা অনুবাদ", 400, 100);
        ctx.font = "20px sans-serif";
        ctx.fillText("পবিত্র কুরআন নিয়ে চিন্তা-গবেষণা ও সমকালীন জীবনবোধ।", 400, 160);
        setSelectedLang("ben+eng");
      } else {
        ctx.fillText("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", 400, 100);
        ctx.font = "24px serif";
        ctx.fillText("الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", 400, 160);
        setSelectedLang("ara+eng");
      }

      setImageSrc(canvas.toDataURL("image/png"));
      setExtractedText("");
      setConfidence(null);
      toast.success("নমুনা ছবি লোড করা হয়েছে! এখন 'টেক্সট এক্সট্র্যাক্ট করুন' এ ক্লিক করুন।");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HERO SECTION CONTAINER (MATCHING HOME PAGE HERO AESTHETIC) */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c4aa82]/60 dark:border-[#b88e58]/35 shadow-xl bg-[var(--gradient-hero)] contain-paint text-foreground">
        <PageHeroBackground intensity="normal" fadeBottom={false} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10">
          {/* Top Tag & Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-primary/20 border border-[#b88e58]/40 text-amber-800 dark:text-[#ecd599] text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-500 dark:text-[#ecd599] animate-pulse" />
              <span>কুরআন অন্বেষা — ইমেজ টু টেক্সট ও স্মার্ট ওসিআর ইঞ্জিন</span>
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
              ছবি থেকে বাংলা, আরবি ও ইংরেজি টেক্সট এক্সট্রাকশন
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm md:text-base text-[#4b3c2e] dark:text-white/80 font-medium leading-relaxed">
              যেকোনো বইয়ের পাতা, আয়াতের স্ক্রিনশট, ক্যালিগ্রাফি বা পাণ্ডুলিপির ছবি আপলোড করুন অথবা সরাসরি ক্লিপবোর্ড (Ctrl+V) থেকে পেস্ট করুন। মুহূর্তের মধ্যে সম্পূর্ণ টেক্সট এডিট ও কপি করার উপযোগী হবে।
            </p>
          </div>

          {/* 3D Compact Info Strip (Same as Home Hero Manifesto) */}
          <div className="hero-3d-compact-card mt-5 p-3 sm:py-2.5 sm:px-4 max-w-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#a16e03] dark:text-[#ecd599] font-bold font-serif">
                <Scan className="size-4 shrink-0 text-[#b07818] dark:text-[#b88e58]" />
                <span>ক্লায়েন্ট-সাইড ব্রাউজার এআই (নিরাপদ ও সীমাহীন)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#4b3c2e] dark:text-white/80 font-medium">
                <span>• বাংলা হরফ শনাক্তকরণ</span>
                <span>• আরবি নোকতা ও হরকত</span>
                <span>• Ctrl+V পেস্ট সুবিধা</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Samples & Tips */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#4b3c2e] dark:text-muted-foreground">
            <span className="font-semibold text-foreground">দ্রুত পরীক্ষা করতে ক্লিক করুন:</span>
            <button
              type="button"
              onClick={() => handleLoadSample("bengali")}
              className="px-2.5 py-1 rounded-lg border border-[#c4aa82]/60 dark:border-[#b88e58]/30 hover:bg-[#b88e58]/15 text-[#a16e03] dark:text-[#ecd599] transition-colors cursor-pointer"
            >
              📄 নমুনা বাংলা লেখা
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample("arabic")}
              className="px-2.5 py-1 rounded-lg border border-[#c4aa82]/60 dark:border-[#b88e58]/30 hover:bg-[#b88e58]/15 text-[#a16e03] dark:text-[#ecd599] transition-colors cursor-pointer font-serif"
            >
              📖 নমুনা কুরআনিক আয়াত
            </button>
            <span className="text-[11px] text-muted-foreground italic ml-2">
              (টিপস: কীবোর্ডের Ctrl + V চাপলে সরাসরি স্ক্রিনশট পেস্ট হবে)
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN OCR WORKSPACE: DUAL-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: IMAGE UPLOAD & CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dropzone Container */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all p-6 text-center bg-card/60 backdrop-blur-md flex flex-col items-center justify-center min-h-[260px] ${
              imageSrc
                ? "border-[#b88e58]/40"
                : "border-[#c4aa82]/60 dark:border-[#b88e58]/30 hover:border-[#b88e58]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />

            {imageSrc ? (
              <div className="w-full space-y-3">
                <div className="relative max-h-[300px] overflow-hidden rounded-xl bg-black/5 dark:bg-black/40 flex items-center justify-center p-2 border border-border">
                  <img
                    src={imageSrc}
                    alt="Upload preview"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      filter: highContrast ? "contrast(200%) grayscale(100%)" : "none",
                    }}
                    className="max-h-[260px] w-auto object-contain transition-all duration-200 rounded"
                  />
                </div>

                {/* Image Edit Controls Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="ছবি ৯০ ডিগ্রি ঘুরান"
                  >
                    <RotateCw className="size-3.5" />
                    <span>ঘুরান ({rotation}°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      highContrast
                        ? "bg-[#b88e58]/20 border-[#b88e58] text-[#a16e03] dark:text-[#ecd599]"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                    title="হাই-কনট্রাস্ট ব্ল্যাক অ্যান্ড হোয়াইট মোড (স্পষ্টতার জন্য)"
                  >
                    <Sliders className="size-3.5" />
                    <span>কনট্রাস্ট বুস্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Upload className="size-3.5" />
                    <span>অন্য ছবি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      setExtractedText("");
                      setConfidence(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>রিমুভ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer space-y-3 p-4"
              >
                <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-amber-500/15 to-[#b88e58]/25 text-[#a16e03] dark:text-[#ecd599] shadow-inner">
                  <Upload className="size-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    ছবি টেনে এনে এখানে ছাড়ুন অথবা ক্লিক করুন
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP, BMP ফরম্যাট সমর্থিত। যেকোনো সাইজের বই বা টেক্সটের ছবি।
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#b88e58] text-white hover:bg-[#a16e03] shadow-xs transition-colors">
                    <FileImage className="size-3.5" />
                    ছবি নির্বাচন করুন
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* OCR Config & Trigger */}
          <div className="p-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md space-y-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <Languages className="size-3.5 text-primary" />
                <span>টেক্সটের ভাষা নির্বাচন করুন:</span>
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#b88e58] cursor-pointer"
              >
                <option value="ben+eng">বাংলা + ইংরেজি (মেশানো টেক্সট - প্রস্তাবিত)</option>
                <option value="ben">শুধু বাংলা (Bengali)</option>
                <option value="ara+eng">আরবি + ইংরেজি (Quranic / Arabic)</option>
                <option value="ara">শুধু আরবি (العربية)</option>
                <option value="eng">শুধু ইংরেজি (English)</option>
                <option value="ben+ara+eng">বাংলা + আরবি + ইংরেজি (তিনটি একত্রে)</option>
              </select>
            </div>

            {/* URL Fetch Input Option */}
            <div className="pt-1">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                বা ওয়েব ইমেজ লিঙ্ক থেকে লোড করুন:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#b88e58]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      setImageSrc(imageUrlInput.trim());
                      setExtractedText("");
                      toast.success("ইমেজ লিঙ্ক লোড করা হয়েছে!");
                    }
                  }}
                  className="px-3 h-9 rounded-lg text-xs font-semibold border border-border hover:bg-muted text-foreground cursor-pointer"
                >
                  লোড
                </button>
              </div>
            </div>

            {/* Run OCR Button */}
            <button
              type="button"
              onClick={handleExtractText}
              disabled={isProcessing || !imageSrc}
              className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#b07818] to-[#b88e58] hover:from-[#a16e03] hover:to-[#a17830] text-white shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>বিশ্লেষণ চলছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>টেক্সট এক্সট্র্যাক্ট করুন (OCR Run)</span>
                </>
              )}
            </button>

            {/* Real-time Progress Bar */}
            {isProcessing && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{statusText}</span>
                  <span className="font-mono font-bold text-[#b88e58]">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-[#b88e58] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EXTRACTED TEXT & ACTIONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm space-y-3 flex flex-col h-full min-h-[460px]">
            {/* Header & Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div className="flex items-center gap-3">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <Type className="size-4 text-primary" />
                  <span>এক্সট্র্যাক্টকৃত টেক্সট ফলাফল</span>
                </h2>
                {confidence !== null && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                    নির্ভুলতা: {confidence}%
                  </span>
                )}
              </div>

              {/* Statistics Counters */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span>শব্দ: <strong className="text-foreground">{stats.words}</strong></span>
                <span>অক্ষর: <strong className="text-foreground">{stats.characters}</strong></span>
                <span>লাইন: <strong className="text-foreground">{stats.lines}</strong></span>
              </div>
            </div>

            {/* Editable Text Area */}
            <div className="flex-1 relative">
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="ছবি আপলোড করে 'টেক্সট এক্সট্র্যাক্ট করুন' এ ক্লিক করলে শনাক্তকৃত পাঠ্য এখানে প্রদর্শিত হবে। আপনি চাইলে সরাসরি এখানে যেকোনো অংশ সম্পাদনা বা পরিমার্জন করতে পারবেন..."
                className="w-full h-full min-h-[320px] p-4 rounded-xl border border-border/80 bg-background text-foreground text-xs sm:text-sm font-sans leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#b88e58] select-text"
              />
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/70">
              <div className="flex flex-wrap items-center gap-2">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopyText}
                  disabled={!extractedText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#b88e58] hover:bg-[#a16e03] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "কপি হয়েছে!" : "টেক্সট কপি"}</span>
                </button>

                {/* Clean Format Button */}
                <button
                  type="button"
                  onClick={handleCleanText}
                  disabled={!extractedText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="অতিরিক্ত ফাঁকা স্থান ও অপ্রয়োজনীয় ভাঙা লাইন দূর করুন"
                >
                  <Sliders className="size-3.5" />
                  <span>পরিচ্ছন্ন করুন</span>
                </button>

                {/* Download TXT */}
                <button
                  type="button"
                  onClick={() => handleDownload("txt")}
                  disabled={!extractedText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="size-3.5" />
                  <span>TXT</span>
                </button>

                {/* Download Markdown */}
                <button
                  type="button"
                  onClick={() => handleDownload("md")}
                  disabled={!extractedText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileCode className="size-3.5" />
                  <span>Markdown</span>
                </button>
              </div>

              {/* Send to Article Draft */}
              <button
                type="button"
                onClick={handleSendToDraft}
                disabled={!extractedText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="এই টেক্সটটিকে একটি নতুন ব্লগ বা গবেষণামূলক আর্টিকেলে ড্রাফট হিসেবে পাঠান"
              >
                <Send className="size-3.5" />
                <span>আর্টিকেলে ড্রাফট পাঠান</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
