/**
 * ফেসবুক, ওয়ার্ড, চ্যাটজিপিটি বা নোটপ্যাড থেকে কপি করা মার্কডাউন টেক্সট
 * (**bold**, *italic*, > blockquote) এবং আন-পার্সড HTML কে ক্লিন ও সুন্দর ফরম্যাটেড HTML-এ রূপান্তর
 */

function formatInlineText(str: string): string {
  return str
    // **bold** বা __bold__ -> <strong>
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    // *italic* বা _italic_ -> <em>
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    // `code` -> <code ...>
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary font-semibold select-text cursor-text">$1</code>')
    // [text](url) -> <a>
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium hover:text-primary/80">$1</a>');
}

function wrapCodeBlocks(html: string): string {
  // If already wrapped in clickable-code-block, skip
  return html.replace(/(?<!<div class="clickable-code-block[^>]*>[\s\S]*?)<pre><code(?:\s+class="([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi, (match, cls, innerCode) => {
    const rawText = innerCode
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .trim();

    const clsLower = (cls || "").toLowerCase();
    const lang = clsLower.includes("bash") || clsLower.includes("sh") ? "Bash" :
                 clsLower.includes("sql") ? "SQL" :
                 clsLower.includes("toml") ? "TOML" :
                 clsLower.includes("html") ? "HTML" :
                 clsLower.includes("javascript") || clsLower.includes("js") ? "JavaScript" :
                 "Bash";

    const defaultFilename = clsLower.includes("sql") ? "schema.sql" :
                            clsLower.includes("toml") ? "wrangler.toml" :
                            clsLower.includes("html") ? "index.html" :
                            clsLower.includes("javascript") || clsLower.includes("js") ? "messages.js" :
                            "command.sh";

    return `<div class="clickable-code-block group relative my-4 overflow-hidden rounded-2xl border border-zinc-800 bg-[#141417] text-zinc-100 shadow-md" data-code="${encodeURIComponent(rawText)}">
  <div class="flex items-center justify-between border-b border-zinc-800/80 bg-[#1c1c22] px-4 py-2 text-xs">
    <span class="font-semibold text-zinc-300 font-sans">${lang}</span>
    <div class="flex items-center gap-1.5">
      <button type="button" class="code-download-btn flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white" data-code="${encodeURIComponent(rawText)}" data-filename="${defaultFilename}" title="ডাউনলোড করুন">
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      </button>
      <button type="button" class="code-copy-btn flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white bg-zinc-800/60 transition-colors" data-code="${encodeURIComponent(rawText)}" title="কপি করুন">
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>কপি</span>
      </button>
    </div>
  </div>
  <pre class="p-4 text-xs sm:text-sm font-mono overflow-x-auto text-zinc-100 selection:bg-primary/40 select-text cursor-text"><code class="${cls || ""} select-text cursor-text">${innerCode}</code></pre>
</div>`;
  });
}

export function formatArticleContent(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  // ১. জিরো-উইডথ ও অদৃশ্য ক্ষতিকর চিহ্ন দূর করা
  let text = rawHtml
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/\u00A0/g, " ");

  // ২. যদি টেক্সটটি প্লেইন টেক্সট হয় (কোনো HTML ট্যাগ ছাড়া)
  if (!text.includes("<p") && !text.includes("<div") && !text.includes("<blockquote")) {
    const rawBlocks = text.split(/\r?\n\r?\n+/);
    const htmlBlocks: string[] = [];

    for (let block of rawBlocks) {
      block = block.trim();
      if (!block) continue;

      // ব্লককোট হ্যান্ডলিং (> "...")
      if (block.startsWith(">") || block.startsWith("&gt;")) {
        const quoteLines = block
          .split(/\r?\n/)
          .map((l) => formatInlineText(l.replace(/^(?:&gt;|>)\s*/, "").trim()))
          .filter(Boolean)
          .join("<br>");
        htmlBlocks.push(`<blockquote><p>${quoteLines}</p></blockquote>`);
        continue;
      }

      // হেডিং হ্যান্ডলিং
      if (block.startsWith("### ")) {
        htmlBlocks.push(`<h3>${formatInlineText(block.replace(/^###\s+/, ""))}</h3>`);
        continue;
      }
      if (block.startsWith("## ")) {
        htmlBlocks.push(`<h2>${formatInlineText(block.replace(/^##\s+/, ""))}</h2>`);
        continue;
      }
      if (block.startsWith("# ")) {
        htmlBlocks.push(`<h1>${formatInlineText(block.replace(/^#\s+/, ""))}</h1>`);
        continue;
      }

      // সাধারণ প্যারাগ্রাফ
      const lines = block
        .split(/\r?\n/)
        .map((l) => formatInlineText(l.trim()))
        .join("<br>");
      htmlBlocks.push(`<p>${lines}</p>`);
    }

    return wrapCodeBlocks(htmlBlocks.join(""));
  }

  // ৩. যদি টেক্সটের ভেতরে HTML থাকে কিন্তু আন-পার্সড ** বা > থেকে যায়
  let html = text
    // **bold** রূপান্তর
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    // *italic* রূপান্তর
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    // প্যারাগ্রাফের ভেতরে থাকা > বা &gt; কে blockquote এ রূপান্তর
    .replace(/<p>\s*(?:&gt;|>)\s*([\s\S]*?)<\/p>/gi, "<blockquote><p>$1</p></blockquote>");

  return wrapCodeBlocks(html);
}
