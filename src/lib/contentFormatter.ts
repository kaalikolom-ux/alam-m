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
    // [text](url) -> <a>
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');
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

    return htmlBlocks.join("");
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

  return html;
}
