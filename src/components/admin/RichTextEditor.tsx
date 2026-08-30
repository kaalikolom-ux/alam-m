import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  List,
  ListOrdered,
  Sparkles,
  MessageSquareQuote,
  Feather,
  Highlighter,
  Code,
  Eye,
  Eraser
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export function RichTextEditor({ label, value, onChange }: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isHtmlMode]);

  const executeCommand = (command: string, arg?: string) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertCustomBlock = (htmlBlock: string) => {
    if (isHtmlMode) {
      onChange(`${value || ""}\n${htmlBlock}`);
      toast.success("ব্লক যুক্ত করা হয়েছে!");
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertHTML", false, htmlBlock);
      onChange(editorRef.current.innerHTML);
      toast.success("স্টাইলিশ ব্লক যুক্ত হয়েছে! এখন বক্সের ভেতরের লেখা পরিবর্তন করুন।");
    }
  };

  // ১. কোট বক্স (Quote Card with Watermark Quote)
  const insertQuoteCard = () => {
    const html = `<div class="quote-card my-6 relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 shadow-sm"><div class="quote-mark absolute -left-2 -top-4 text-7xl font-serif text-primary/20 pointer-events-none select-none leading-none">“</div><p class="relative z-10 italic text-base leading-relaxed text-foreground font-medium">"শব্দেরও প্রাণ আছে। তুই যদি ঠিকমতো ডাক দিতে শিখিস, তারা নিজেরাই গল্প বলতে আসবে।"</p></div><p><br></p>`;
    insertCustomBlock(html);
  };

  // ২. বিশেষ কার্ড (Kaushan Script Highlight Card)
  const insertSpecialCard = () => {
    const html = `<div class="special-card my-6 rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm"><p class="kaushan-title text-2xl text-primary font-semibold mb-2" style="font-family: 'Kaushan Script', cursive;">I am Alam. A writer of words. A wanderer of stories.</p><p class="text-sm text-muted-foreground leading-relaxed">Thank you for gracing my page with your valuable time. Let us weave some stories together.</p></div><p><br></p>`;
    insertCustomBlock(html);
  };

  // ৩. কবিতার স্তবক (Poetry Stanza Block)
  const insertPoetryBlock = () => {
    const html = `<div class="poetry-stanza my-6 rounded-xl border-l-4 border-primary bg-muted/20 py-4 px-6 italic text-sm leading-loose"><p>এখানে কবিতার প্রথম চরণ...</p><p>এখানে কবিতার দ্বিতীয় চরণ...</p></div><p><br></p>`;
    insertCustomBlock(html);
  };

  // ৪. হাইলাইট নোট বক্স (Highlight Callout Box)
  const insertHighlightBox = () => {
    const html = `<div class="highlight-box my-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 text-sm"><p class="font-semibold mb-1">📌 বিশেষ দ্রষ্টব্য:</p><p class="text-xs leading-relaxed">এখানে আপনার গুরুত্বপূর্ণ নোট বা বার্তা লিখুন...</p></div><p><br></p>`;
    insertCustomBlock(html);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const textData = clipboardData.getData("text/plain");
    const htmlData = clipboardData.getData("text/html");

    if (htmlData && !textData.includes("**")) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, "text/html");

      doc.body.querySelectorAll("*").forEach((node) => {
        if (node instanceof HTMLElement) {
          // Keep our custom classes if present, else clean inline styles
          if (!node.classList.contains("quote-card") && !node.classList.contains("special-card") && !node.classList.contains("poetry-stanza")) {
            node.style.backgroundColor = "";
            node.style.background = "";
            node.style.color = "";
            node.style.fontFamily = "";
          }
        }
      });

      document.execCommand("insertHTML", false, doc.body.innerHTML);
    } else {
      const formattedHtml = textData
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim())
        .map((line) => (line ? `<p>${line}</p>` : `<p><br></p>`))
        .join("");

      document.execCommand("insertHTML", false, formattedHtml);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs font-medium"
          onClick={() => setIsHtmlMode(!isHtmlMode)}
        >
          {isHtmlMode ? (
            <>
              <Eye className="size-3.5" /> সাধারণ ভিউ
            </>
          ) : (
            <>
              <Code className="size-3.5" /> HTML কোড ভিউ
            </>
          )}
        </Button>
      </div>

      <div className="rounded-xl border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden">
        {/* Primary Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5">
          <button
            type="button"
            title="বোল্ড (Bold)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("bold")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            title="ইটালিক (Italic)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("italic")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            title="আন্ডারলাইন (Underline)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("underline")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <UnderlineIcon className="size-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          <button
            type="button"
            title="বামে সারিবদ্ধ (Left)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyLeft")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignLeft className="size-4" />
          </button>
          <button
            type="button"
            title="মাঝখানে সারিবদ্ধ (Center)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyCenter")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignCenter className="size-4" />
          </button>
          <button
            type="button"
            title="ডানে সারিবদ্ধ (Right)"
            disabled={isHtmlMode}
            onClick={() => executeCommand("justifyRight")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <AlignRight className="size-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          <button
            type="button"
            title="বুলেট লিস্ট"
            disabled={isHtmlMode}
            onClick={() => executeCommand("insertUnorderedList")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            title="নাম্বার লিস্ট"
            disabled={isHtmlMode}
            onClick={() => executeCommand("insertOrderedList")}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ListOrdered className="size-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Quick Styling Blocks Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pl-1">
            <button
              type="button"
              title="উদ্ধৃতি বক্স (Quote Card)"
              onClick={insertQuoteCard}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <MessageSquareQuote className="size-3.5" />
              <span>💬 কোট বক্স</span>
            </button>

            <button
              type="button"
              title="বিশেষ কার্ড (Kaushan Script Card)"
              onClick={insertSpecialCard}
              className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors"
            >
              <Sparkles className="size-3.5" />
              <span>✨ বিশেষ কার্ড</span>
            </button>

            <button
              type="button"
              title="কবিতার স্তবক (Poetry Stanza)"
              onClick={insertPoetryBlock}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
            >
              <Feather className="size-3.5" />
              <span>🖋️ কবিতা স্তবক</span>
            </button>

            <button
              type="button"
              title="হাইলাইট বক্স (Note Box)"
              onClick={insertHighlightBox}
              className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Highlighter className="size-3.5" />
              <span>📌 নোট বক্স</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {isHtmlMode ? (
          <Textarea
            rows={12}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="এখানে সরাসরি কাস্টম HTML কোড লিখুন বা এডিট করুন..."
            className="w-full rounded-b-xl border-0 bg-background font-mono text-xs text-foreground focus-visible:ring-0 p-4"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onPaste={handlePaste}
            onInput={() => {
              if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
              }
            }}
            className="min-h-[260px] p-4 text-base text-foreground focus:outline-none [&_p]:mb-3 [&_p:empty]:h-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          />
        )}
      </div>
    </div>
  );
}
