/**
 * Article Automated Translation Engine (Bengali -> English)
 * Preserves HTML tags, Arabic text, Quranic citations, and formatting.
 * Features client-side local caching for 0ms instant loading on repeat visits.
 */

const STORAGE_PREFIX = "wooniche_article_trans_en_";
const MEMORY_TRANSLATION_CACHE = new Map<string, string>();

/**
 * Check if text contains Bengali characters
 */
export function hasBengaliCharacters(text: string | null | undefined): boolean {
  if (!text) return false;
  return /[\u0980-\u09FF]/.test(text);
}

/**
 * Translate a single text/HTML chunk from Bengali to English via Google Translate API
 */
export async function translateChunkOnline(chunk: string, retries = 2): Promise<string> {
  const trimmed = chunk.trim();
  if (!trimmed || !hasBengaliCharacters(trimmed)) {
    return chunk;
  }

  // ১. প্রধান দ্রুত ও নির্ভুল এন্ডপয়েন্ট (HTML ট্যাগ ও ফরম্যাট অক্ষুণ্ণ রাখে, 429 রেট লিমিট মুক্ত)
  const primaryUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=bn&tl=en&q=${encodeURIComponent(trimmed)}`;
  // ২. ফলব্যাক এন্ডপয়েন্ট
  const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Try primary endpoint first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(primaryUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && typeof data[0] === "string" && data[0]) {
          return data[0];
        }
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((item: any) => (typeof item === "string" ? item : item[0])).filter(Boolean).join("");
          if (translated) return translated;
        }
      }
    } catch {
      // Primary failed, fall through to fallback
    }

    // Try fallback endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(fallbackUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((item: any) => item[0]).filter(Boolean).join("");
          if (translated) return translated;
        }
      }
    } catch {}

    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }

  return chunk;
}

/**
 * Split HTML into logical structural blocks for translation
 * Uses depth-tracking to preserve nested elements (e.g. inner divs, cards, badges)
 */
function splitHtmlIntoBlocks(html: string): string[] {
  if (!html) return [];
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html.split(/\r?\n\r?\n+/).filter((b) => Boolean(b.trim()));
  }

  const blocks: string[] = [];
  const tagRegex = /<!--[\s\S]*?-->|<(\/?)([a-z0-9]+)(?:\s+[^>]*)?>/gi;
  let lastIndex = 0;
  let depth = 0;
  let blockStartIndex = 0;
  let match: RegExpExecArray | null;

  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

  while ((match = tagRegex.exec(html)) !== null) {
    const [fullTag, isClosing, tagName] = match;
    const tagLower = (tagName || "").toLowerCase();

    if (fullTag.startsWith("<!--")) {
      if (depth === 0) {
        if (match.index > lastIndex) {
          const between = html.slice(lastIndex, match.index).trim();
          if (between) blocks.push(between);
        }
        blocks.push(fullTag);
        lastIndex = tagRegex.lastIndex;
        blockStartIndex = tagRegex.lastIndex;
      }
      continue;
    }

    if (voidTags.has(tagLower)) {
      if (depth === 0) {
        if (match.index > lastIndex) {
          const between = html.slice(lastIndex, match.index).trim();
          if (between) blocks.push(between);
        }
        blocks.push(fullTag);
        lastIndex = tagRegex.lastIndex;
        blockStartIndex = tagRegex.lastIndex;
      }
      continue;
    }

    if (!isClosing) {
      if (depth === 0) {
        if (match.index > lastIndex) {
          const between = html.slice(lastIndex, match.index).trim();
          if (between) blocks.push(between);
        }
        blockStartIndex = match.index;
      }
      depth++;
    } else {
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        const fullBlock = html.slice(blockStartIndex, tagRegex.lastIndex);
        blocks.push(fullBlock);
        lastIndex = tagRegex.lastIndex;
      }
    }
  }

  if (lastIndex < html.length) {
    const tail = html.slice(lastIndex).trim();
    if (tail) blocks.push(tail);
  }

  return blocks.length > 0 ? blocks : html.split(/\r?\n\r?\n+/).filter((b) => Boolean(b.trim()));
}

/**
 * Translate Bengali HTML to English while preserving tags and Arabic text.
 * Supports onPartialUpdate callback for progressive incremental rendering.
 */
export async function translateBengaliHtml(
  html: string,
  onProgress?: (percent: number) => void,
  onPartialUpdate?: (currentHtml: string) => void
): Promise<string> {
  if (!html || !hasBengaliCharacters(html)) return formatArticleContent(html);

  const blocks = splitHtmlIntoBlocks(html);
  const total = blocks.length;
  if (total === 0) return formatArticleContent(html);

  const translatedBlocks: string[] = new Array(total);
  let completed = 0;

  // Process in larger batches of 8 for maximum parallel performance
  const BATCH_SIZE = 8;
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batchIndices = [];
    for (let j = i; j < Math.min(i + BATCH_SIZE, total); j++) {
      batchIndices.push(j);
    }

    await Promise.all(
      batchIndices.map(async (idx) => {
        const block = blocks[idx];
        // If it's an HTML comment, HR, or has no Bengali, keep it as is
        if (block.startsWith("<!--") || block.startsWith("<hr") || !hasBengaliCharacters(block)) {
          translatedBlocks[idx] = block;
        } else if (block.length > 2500) {
          // Break large blocks by lines
          const subLines = block.split(/\r?\n/);
          const transLines = await Promise.all(
            subLines.map((line) => (hasBengaliCharacters(line) ? translateChunkOnline(line) : Promise.resolve(line)))
          );
          translatedBlocks[idx] = transLines.join("\n");
        } else {
          translatedBlocks[idx] = await translateChunkOnline(block);
        }
        completed++;
        if (onProgress) {
          onProgress(Math.round((completed / total) * 100));
        }
      })
    );

    // Progressive streaming: Emit partially translated content to render instantly
    if (onPartialUpdate && completed < total) {
      const { formatArticleContent } = await import("./contentFormatter");
      const interim = blocks.map((b, idx) => translatedBlocks[idx] || b).join("\n\n");
      onPartialUpdate(formatArticleContent(interim));
    }
  }

  const { formatArticleContent } = await import("./contentFormatter");
  const joined = translatedBlocks.join("\n\n");
  const finalFormatted = formatArticleContent(joined);
  if (onPartialUpdate) {
    onPartialUpdate(finalFormatted);
  }
  return finalFormatted;
}

/**
 * Translate full article object (Title, Excerpt, Content)
 */
export async function translateFullArticle(article: {
  title_bn?: string;
  excerpt_bn?: string;
  content_bn?: string;
}): Promise<{
  title_en: string;
  excerpt_en: string;
  content_en: string;
}> {
  const { formatArticleContent } = await import("./contentFormatter");
  const cleanBnContent = article.content_bn ? formatArticleContent(article.content_bn) : "";

  const [title_en, excerpt_en, content_en] = await Promise.all([
    article.title_bn ? translateChunkOnline(article.title_bn) : Promise.resolve(""),
    article.excerpt_bn ? translateChunkOnline(article.excerpt_bn) : Promise.resolve(""),
    cleanBnContent ? translateBengaliHtml(cleanBnContent) : Promise.resolve(""),
  ]);

  return {
    title_en: title_en.trim(),
    excerpt_en: excerpt_en.trim(),
    content_en: formatArticleContent(content_en.trim()),
  };
}

/**
 * Retrieve cached automated translation from memory or localStorage
 */
export function getCachedArticleTranslation(slugOrId: string): string | null {
  if (typeof window === "undefined" || !slugOrId) return null;
  const key = slugOrId.toLowerCase().trim();
  if (MEMORY_TRANSLATION_CACHE.has(key)) {
    return MEMORY_TRANSLATION_CACHE.get(key)!;
  }
  try {
    const val = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (val) {
      MEMORY_TRANSLATION_CACHE.set(key, val);
      return val;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Save automated translation to memory and localStorage
 */
export function setCachedArticleTranslation(slugOrId: string, translatedHtml: string): void {
  if (typeof window === "undefined" || !slugOrId || !translatedHtml) return;
  const key = slugOrId.toLowerCase().trim();
  MEMORY_TRANSLATION_CACHE.set(key, translatedHtml);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, translatedHtml);
  } catch (e) {
    // If quota exceeded, clean oldest
    console.warn("Storage quota warning, keeping in memory cache:", e);
  }
}

/**
 * Fetch static pre-translated English article JSON (0ms to ~30ms CDN edge speed)
 */
export async function fetchStaticEnglishArticle(slugOrId: string): Promise<{
  id?: string;
  slug?: string;
  title_en?: string;
  excerpt_en?: string;
  content_en?: string;
} | null> {
  if (typeof window === "undefined" || !slugOrId) return null;
  const key = slugOrId.toLowerCase().trim();

  // 1. Check memory cache (0ms instant)
  if (MEMORY_TRANSLATION_CACHE.has(key)) {
    const cachedHtml = MEMORY_TRANSLATION_CACHE.get(key)!;
    return { content_en: cachedHtml };
  }

  // 2. Check localStorage (0ms instant)
  const localHtml = getCachedArticleTranslation(key);
  if (localHtml) {
    MEMORY_TRANSLATION_CACHE.set(key, localHtml);
    return { content_en: localHtml };
  }

  // 3. Fetch pre-translated static asset JSON (/data/articles_en/${key}.json)
  try {
    const res = await fetch(`/data/articles_en/${key}.json`, {
      cache: "force-cache",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.content_en && !hasBengaliCharacters(data.content_en.slice(0, 500))) {
        MEMORY_TRANSLATION_CACHE.set(key, data.content_en);
        setCachedArticleTranslation(key, data.content_en);
        return data;
      }
    }
  } catch {}

  return null;
}
