// src/lib/postExportImportEngine.ts
// Comprehensive Post Export & Import Engine for Quran Explore Pro (কুরআন অন্বেষা)
// Supports WordPress WXR (XML), Blogger XML, Full JSON Backup, Excel CSV (with UTF-8 BOM), and Markdown ZIP.

import JSZip from "jszip";
import { bnToEnSlug } from "@/lib/slugHelper";

export interface ArticleExportItem {
  id: string;
  slug: string;
  title_bn: string;
  title_en?: string | null;
  excerpt_bn?: string | null;
  excerpt_en?: string | null;
  content_bn?: string | null;
  content_en?: string | null;
  cover_image_url?: string | null;
  published: boolean;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  author_id?: string | null;
  category_id?: string | null;
  category_ids?: string[];
  tags?: string[];
  category?: { id?: string; name_bn?: string; name_en?: string; slug?: string } | null;
  categories?: Array<{ id?: string; name_bn?: string; name_en?: string; slug?: string }>;
  author?: { id?: string; name_bn?: string; name_en?: string; bio_bn?: string; image_url?: string } | null;
}

export interface ExportFilterOptions {
  format: "wordpress" | "json" | "csv" | "markdown-zip";
  scope: "all" | "category" | "author" | "status" | "date" | "selected";
  categoryId?: string;
  authorId?: string;
  status?: "published" | "draft" | "trash" | "all";
  startDate?: string;
  endDate?: string;
  selectedIds?: string[];
  includeFullContent?: boolean;
}

export interface ParsedImportPost {
  title_bn: string;
  title_en?: string;
  slug: string;
  content_bn: string;
  content_en?: string;
  excerpt_bn?: string;
  excerpt_en?: string;
  cover_image_url?: string | null;
  author_name?: string;
  category_name?: string;
  tags: string[];
  published: boolean;
  published_at: string;
}

export interface ParsedImportResult {
  posts: ParsedImportPost[];
  detectedAuthors: string[];
  detectedCategories: string[];
  type: "wordpress" | "blogger" | "json" | "csv";
}

/* ========================================================================== */
/* 1. FILTER ARTICLES HELPER                                                  */
/* ========================================================================== */

export function filterArticlesForExport(
  articles: ArticleExportItem[],
  options: ExportFilterOptions
): ArticleExportItem[] {
  let filtered = [...articles];

  // Selected IDs take highest precedence
  if (options.scope === "selected" && options.selectedIds && options.selectedIds.length > 0) {
    const set = new Set(options.selectedIds);
    return filtered.filter((a) => set.has(a.id));
  }

  // Filter by status
  if (options.scope === "status" && options.status && options.status !== "all") {
    if (options.status === "trash") {
      filtered = filtered.filter((a) => !!a.deleted_at);
    } else if (options.status === "published") {
      filtered = filtered.filter((a) => a.published && !a.deleted_at);
    } else if (options.status === "draft") {
      filtered = filtered.filter((a) => !a.published && !a.deleted_at);
    }
  } else if (options.scope !== "status") {
    // By default, exclude trashed items unless scope is explicitly trash
    filtered = filtered.filter((a) => !a.deleted_at);
  }

  // Filter by category
  if (options.scope === "category" && options.categoryId) {
    filtered = filtered.filter(
      (a) =>
        a.category_id === options.categoryId ||
        (Array.isArray(a.category_ids) && a.category_ids.includes(options.categoryId!)) ||
        a.category?.id === options.categoryId
    );
  }

  // Filter by author
  if (options.scope === "author" && options.authorId) {
    filtered = filtered.filter((a) => a.author_id === options.authorId || a.author?.id === options.authorId);
  }

  // Filter by date range
  if (options.scope === "date") {
    if (options.startDate) {
      const start = new Date(options.startDate).getTime();
      filtered = filtered.filter((a) => {
        const time = new Date(a.published_at || a.created_at || 0).getTime();
        return time >= start;
      });
    }
    if (options.endDate) {
      // include the entire end date till 23:59:59
      const end = new Date(options.endDate).getTime() + 86400000;
      filtered = filtered.filter((a) => {
        const time = new Date(a.published_at || a.created_at || 0).getTime();
        return time <= end;
      });
    }
  }

  return filtered;
}

/* ========================================================================== */
/* 2. EXPORT IMPLEMENTATIONS                                                  */
/* ========================================================================== */

/**
 * Generates official WordPress eXtended RSS (WXR 1.2) XML compliant with WordPress exporter.
 */
export function exportToWordPressXml(articles: ArticleExportItem[]): string {
  const now = new Date().toUTCString();

  // Gather unique categories & authors
  const categoryMap = new Map<string, { name: string; slug: string }>();
  const authorMap = new Map<string, { name: string; slug: string }>();

  articles.forEach((a) => {
    const catName = a.category?.name_bn || a.category?.name_en || "কুরআনিক";
    const catSlug = a.category?.slug || bnToEnSlug(catName, "cat");
    if (!categoryMap.has(catSlug)) {
      categoryMap.set(catSlug, { name: catName, slug: catSlug });
    }

    const authName = a.author?.name_bn || a.author?.name_en || "আলম এম.";
    const authSlug = bnToEnSlug(authName, "author");
    if (!authorMap.has(authSlug)) {
      authorMap.set(authSlug, { name: authName, slug: authSlug });
    }
  });

  const categoriesXml = Array.from(categoryMap.values())
    .map(
      (c) => `
    <wp:category>
      <wp:term_id>${Math.abs(hashString(c.slug))}</wp:term_id>
      <wp:category_nicename><![CDATA[${c.slug}]]></wp:category_nicename>
      <wp:category_parent><![CDATA[]]></wp:category_parent>
      <wp:cat_name><![CDATA[${c.name}]]></wp:cat_name>
    </wp:category>`
    )
    .join("");

  const authorsXml = Array.from(authorMap.values())
    .map(
      (a) => `
    <wp:author>
      <wp:author_id>${Math.abs(hashString(a.slug))}</wp:author_id>
      <wp:author_login><![CDATA[${a.slug}]]></wp:author_login>
      <wp:author_email><![CDATA[${a.slug}@quraan.bd]]></wp:author_email>
      <wp:author_display_name><![CDATA[${a.name}]]></wp:author_display_name>
      <wp:author_first_name><![CDATA[${a.name}]]></wp:author_first_name>
      <wp:author_last_name><![CDATA[]]></wp:author_last_name>
    </wp:author>`
    )
    .join("");

  const itemsXml = articles
    .map((art, idx) => {
      const pubDate = art.published_at ? new Date(art.published_at) : new Date();
      const dateGmt = pubDate.toISOString().replace("T", " ").replace(/\..+/, "");
      const dateLocal = dateGmt;
      const catName = art.category?.name_bn || art.category?.name_en || "কুরআনিক";
      const catSlug = art.category?.slug || bnToEnSlug(catName, "cat");
      const authName = art.author?.name_bn || art.author?.name_en || "আলম এম.";
      const postStatus = art.published && !art.deleted_at ? "publish" : "draft";

      const tagsXml = (art.tags || [])
        .map((t) => {
          const cleanTag = String(t).trim().replace(/^#/, "");
          const tagSlug = bnToEnSlug(cleanTag, "tag");
          return `<category domain="post_tag" nicename="${escapeXml(tagSlug)}"><![CDATA[${cleanTag}]]></category>`;
        })
        .join("\n      ");

      return `
    <item>
      <title><![CDATA[${art.title_bn || art.title_en || "শিরোনামহীন"}]]></title>
      <link>https://www.quraan.bd/articles/${art.slug}</link>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <dc:creator><![CDATA[${authName}]]></dc:creator>
      <guid isPermaLink="false">https://www.quraan.bd/?p=${art.id}</guid>
      <description></description>
      <content:encoded><![CDATA[${art.content_bn || art.content_en || ""}]]></content:encoded>
      <excerpt:encoded><![CDATA[${art.excerpt_bn || art.excerpt_en || ""}]]></excerpt:encoded>
      <wp:post_id>${idx + 1000}</wp:post_id>
      <wp:post_date><![CDATA[${dateLocal}]]></wp:post_date>
      <wp:post_date_gmt><![CDATA[${dateGmt}]]></wp:post_date_gmt>
      <wp:comment_status><![CDATA[open]]></wp:comment_status>
      <wp:ping_status><![CDATA[closed]]></wp:ping_status>
      <wp:post_name><![CDATA[${art.slug}]]></wp:post_name>
      <wp:status><![CDATA[${postStatus}]]></wp:status>
      <wp:post_parent>0</wp:post_parent>
      <wp:menu_order>0</wp:menu_order>
      <wp:post_type><![CDATA[post]]></wp:post_type>
      <wp:post_password><![CDATA[]]></wp:post_password>
      <wp:is_sticky>0</wp:is_sticky>
      <category domain="category" nicename="${escapeXml(catSlug)}"><![CDATA[${catName}]]></category>
      ${tagsXml}
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<!-- generator="Quran Explore Pro/3.3.0" created="${new Date().toISOString()}" -->
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
  <channel>
    <title>কুরআন অন্বেষা (Quran Explore Pro)</title>
    <link>https://www.quraan.bd</link>
    <description>পবিত্র কুরআন অন্বেষা, অনুবাদ ও শব্দার্থতাত্ত্বিক গবেষণা প্ল্যাটফর্ম</description>
    <pubDate>${now}</pubDate>
    <language>bn</language>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:base_site_url>https://www.quraan.bd</wp:base_site_url>
    <wp:base_blog_url>https://www.quraan.bd</wp:base_blog_url>
    ${authorsXml}
    ${categoriesXml}
    ${itemsXml}
  </channel>
</rss>`;
}

/**
 * Generates a full high-fidelity JSON backup.
 */
export function exportToJson(articles: ArticleExportItem[]): string {
  const exportPayload = {
    source: "Quran Explore Pro (কুরআন অন্বেষা)",
    platform: "Wooniche Cloud",
    version: "3.3.0",
    exported_at: new Date().toISOString(),
    total_articles: articles.length,
    articles: articles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title_bn: a.title_bn,
      title_en: a.title_en || null,
      excerpt_bn: a.excerpt_bn || null,
      excerpt_en: a.excerpt_en || null,
      content_bn: a.content_bn || null,
      content_en: a.content_en || null,
      cover_image_url: a.cover_image_url || null,
      published: a.published,
      published_at: a.published_at || null,
      created_at: a.created_at || null,
      updated_at: a.updated_at || null,
      deleted_at: a.deleted_at || null,
      author: a.author
        ? {
            id: a.author.id,
            name_bn: a.author.name_bn,
            name_en: a.author.name_en,
            bio_bn: a.author.bio_bn,
            image_url: a.author.image_url,
          }
        : null,
      category: a.category
        ? {
            id: a.category.id,
            name_bn: a.category.name_bn,
            name_en: a.category.name_en,
            slug: a.category.slug,
          }
        : null,
      tags: a.tags || [],
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generates an Excel-friendly CSV with UTF-8 BOM to prevent Bengali character corruption.
 */
export function exportToCsv(articles: ArticleExportItem[]): string {
  const headers = [
    "ID",
    "Slug",
    "Title (Bangla)",
    "Title (English)",
    "Category",
    "Author",
    "Status",
    "Published At",
    "Created At",
    "Tags",
    "Excerpt",
    "Word Count",
    "Cover Image URL",
    "Content",
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = articles.map((a) => {
    const rawContent = (a.content_bn || a.content_en || "").replace(/<[^>]*>/g, " ").trim();
    const wordCount = rawContent ? rawContent.split(/\s+/).filter(Boolean).length : 0;
    const catName = a.category?.name_bn || a.category?.name_en || "";
    const authName = a.author?.name_bn || a.author?.name_en || "";
    const tagsStr = (a.tags || []).join(", ");
    const status = a.deleted_at ? "Trash" : a.published ? "Published" : "Draft";

    return [
      escapeCsv(a.id),
      escapeCsv(a.slug),
      escapeCsv(a.title_bn),
      escapeCsv(a.title_en || ""),
      escapeCsv(catName),
      escapeCsv(authName),
      escapeCsv(status),
      escapeCsv(a.published_at || ""),
      escapeCsv(a.created_at || ""),
      escapeCsv(tagsStr),
      escapeCsv(a.excerpt_bn || a.excerpt_en || ""),
      escapeCsv(wordCount),
      escapeCsv(a.cover_image_url || ""),
      escapeCsv(a.content_bn || a.content_en || ""),
    ].join(",");
  });

  // \uFEFF is the UTF-8 BOM so Microsoft Excel renders Bengali unicode cleanly
  return "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
}

/**
 * Generates a ZIP archive containing individual Markdown files for each post with YAML frontmatter.
 */
export async function exportToMarkdownZip(articles: ArticleExportItem[]): Promise<Blob> {
  const zip = new JSZip();

  articles.forEach((art) => {
    const catName = art.category?.name_bn || art.category?.name_en || "কুরআনিক";
    const authName = art.author?.name_bn || art.author?.name_en || "আলম এম.";
    const status = art.deleted_at ? "trash" : art.published ? "published" : "draft";
    const tagsFormatted = (art.tags || []).map((t) => `"${t.replace(/"/g, "")}"`).join(", ");

    const frontmatter = `---
title: "${(art.title_bn || art.title_en || "Untitled").replace(/"/g, '\\"')}"
slug: "${art.slug}"
author: "${authName}"
category: "${catName}"
tags: [${tagsFormatted}]
status: "${status}"
date: "${art.published_at || art.created_at || new Date().toISOString()}"
excerpt: "${(art.excerpt_bn || art.excerpt_en || "").replace(/"/g, '\\"')}"
cover_image: "${art.cover_image_url || ""}"
---

# ${art.title_bn || art.title_en || "Untitled"}

${art.content_bn || art.content_en || ""}
`;

    // Folder structure: posts/slug.md
    const safeFilename = `${art.slug || art.id}.md`;
    zip.file(`posts/${safeFilename}`, frontmatter);
  });

  return await zip.generateAsync({ type: "blob" });
}

/* ========================================================================== */
/* 3. PARSERS FOR IMPORT                                                      */
/* ========================================================================== */

/**
 * Parses WordPress WXR XML.
 */
export function parseWordPressXml(text: string): ParsedImportResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) throw new Error("ওয়ার্ডপ্রেস XML ফাইলটি সঠিক নয় বা ক্ষতিগ্রস্থ।");

  const detectedAuthors = new Set<string>();
  const detectedCategories = new Set<string>();
  const posts: ParsedImportPost[] = [];

  const items = xmlDoc.querySelectorAll("item");
  items.forEach((item, index) => {
    const postType = item.querySelector("post_type")?.textContent || "post";
    const status = item.querySelector("status")?.textContent || "publish";

    if (postType === "post" || postType === "") {
      const title = item.querySelector("title")?.textContent?.trim() || "শিরোনামহীন পোস্ট";
      const content =
        item.getElementsByTagNameNS("*", "encoded")[0]?.textContent ||
        item.querySelector("content")?.textContent ||
        "";
      const excerpt =
        item.getElementsByTagNameNS("*", "encoded")[1]?.textContent ||
        item.querySelector("excerpt")?.textContent ||
        "";
      const postDate = item.querySelector("post_date")?.textContent || new Date().toISOString();
      const postName = item.querySelector("post_name")?.textContent?.trim();
      const creator = item.getElementsByTagNameNS("*", "creator")[0]?.textContent?.trim() || "";

      if (creator) detectedAuthors.add(creator);

      const categoryElements = item.querySelectorAll('category[domain="category"]');
      const tagElements = item.querySelectorAll('category[domain="post_tag"]');

      const rawCategory = categoryElements.length > 0 ? categoryElements[0].textContent?.trim() : "";
      if (rawCategory && rawCategory !== "Uncategorized") detectedCategories.add(rawCategory);

      const rawTags: string[] = [];
      tagElements.forEach((t) => {
        if (t.textContent) rawTags.push(t.textContent.trim());
      });

      const cleanExcerpt = (excerpt || content.replace(/<[^>]*>?/gm, "")).slice(0, 200).trim();
      const slug = postName || bnToEnSlug(title, String(index));

      posts.push({
        title_bn: title,
        title_en: title,
        slug,
        content_bn: content,
        content_en: content,
        excerpt_bn: cleanExcerpt,
        excerpt_en: cleanExcerpt,
        cover_image_url: extractFirstImage(content),
        author_name: creator || undefined,
        category_name: rawCategory || undefined,
        tags: rawTags,
        published: status === "publish",
        published_at: new Date(postDate).toISOString(),
      });
    }
  });

  return {
    posts,
    detectedAuthors: Array.from(detectedAuthors),
    detectedCategories: Array.from(detectedCategories),
    type: "wordpress",
  };
}

/**
 * Parses Blogger Atom XML.
 */
export function parseBloggerXml(text: string): ParsedImportResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) throw new Error("ব্লগার XML ফাইলটি সঠিক নয় বা ক্ষতিগ্রস্থ।");

  const detectedAuthors = new Set<string>();
  const detectedCategories = new Set<string>();
  const posts: ParsedImportPost[] = [];

  const entries = xmlDoc.querySelectorAll("entry");
  entries.forEach((entry, index) => {
    const idText = entry.querySelector("id")?.textContent || "";
    if (idText.includes(".post-") || entry.querySelector('category[term*="#post"]')) {
      const title = entry.querySelector("title")?.textContent?.trim() || "শিরোনামহীন পোস্ট";
      const content = entry.querySelector("content")?.textContent || "";
      const publishedAt = entry.querySelector("published")?.textContent || new Date().toISOString();
      const authorName = entry.querySelector("author > name")?.textContent?.trim() || "";
      if (authorName) detectedAuthors.add(authorName);

      const draftElement = entry.querySelector("app\\:control > app\\:draft, draft");
      const isDraft = draftElement?.textContent === "yes";

      const categoryElements = entry.querySelectorAll('category[scheme="http://www.blogger.com/atom/ns#"]');
      const rawTags: string[] = [];
      categoryElements.forEach((cat) => {
        const term = cat.getAttribute("term");
        if (term && !term.includes("#")) {
          const clean = term.trim();
          rawTags.push(clean);
          detectedCategories.add(clean);
        }
      });

      const cleanExcerpt = content.replace(/<[^>]*>?/gm, "").slice(0, 200).trim();
      const slug = bnToEnSlug(title, String(index));

      posts.push({
        title_bn: title,
        title_en: title,
        slug,
        content_bn: content,
        content_en: content,
        excerpt_bn: cleanExcerpt,
        excerpt_en: cleanExcerpt,
        cover_image_url: extractFirstImage(content),
        author_name: authorName || undefined,
        category_name: rawTags[0] || undefined,
        tags: rawTags,
        published: !isDraft,
        published_at: new Date(publishedAt).toISOString(),
      });
    }
  });

  return {
    posts,
    detectedAuthors: Array.from(detectedAuthors),
    detectedCategories: Array.from(detectedCategories),
    type: "blogger",
  };
}

/**
 * Parses JSON backup files.
 */
export function parseJsonBackup(text: string): ParsedImportResult {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e: any) {
    throw new Error("JSON ফাইলটি পার্স করা যায়নি: " + e.message);
  }

  const rawList: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed.articles) ? parsed.articles : [];
  if (rawList.length === 0) {
    throw new Error("JSON ফাইলে কোনো পোস্টের তালিকা পাওয়া যায়নি।");
  }

  const detectedAuthors = new Set<string>();
  const detectedCategories = new Set<string>();
  const posts: ParsedImportPost[] = [];

  rawList.forEach((item, index) => {
    const titleBn = item.title_bn || item.title || "শিরোনামহীন পোস্ট";
    const titleEn = item.title_en || titleBn;
    const contentBn = item.content_bn || item.content || "";
    const contentEn = item.content_en || contentBn;
    const authorName = item.author?.name_bn || item.author?.name_en || item.author_name || "";
    const catName = item.category?.name_bn || item.category?.name_en || item.category_name || "";

    if (authorName) detectedAuthors.add(authorName);
    if (catName) detectedCategories.add(catName);

    const tags = Array.isArray(item.tags)
      ? item.tags.map((t: any) => String(t).trim().replace(/^#/, "")).filter(Boolean)
      : [];

    const slug = item.slug ? String(item.slug).trim() : bnToEnSlug(titleBn, String(index));
    const cleanExcerpt =
      item.excerpt_bn ||
      item.excerpt ||
      contentBn.replace(/<[^>]*>?/gm, "").slice(0, 200).trim();

    posts.push({
      title_bn: titleBn,
      title_en: titleEn,
      slug,
      content_bn: contentBn,
      content_en: contentEn,
      excerpt_bn: cleanExcerpt,
      excerpt_en: item.excerpt_en || cleanExcerpt,
      cover_image_url: item.cover_image_url || extractFirstImage(contentBn),
      author_name: authorName || undefined,
      category_name: catName || undefined,
      tags,
      published: item.published !== false,
      published_at: item.published_at || item.created_at || new Date().toISOString(),
    });
  });

  return {
    posts,
    detectedAuthors: Array.from(detectedAuthors),
    detectedCategories: Array.from(detectedCategories),
    type: "json",
  };
}

/**
 * Parses simple CSV format.
 */
export function parseCsvPosts(text: string): ParsedImportResult {
  const lines = parseCsvRows(text);
  if (lines.length < 2) {
    throw new Error("CSV ফাইলটিতে হেডার ছাড়াও অন্তত একটি রো থাকা আবশ্যক।");
  }

  const headers = lines[0].map((h) => h.toLowerCase().trim());
  const findIdx = (keywords: string[]) =>
    headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const titleBnIdx = findIdx(["title (bangla)", "title_bn", "শিরোনাম", "title"]);
  const titleEnIdx = findIdx(["title (english)", "title_en", "english title"]);
  const slugIdx = findIdx(["slug", "স্লাগ", "permalink"]);
  const contentIdx = findIdx(["content", "কনটেন্ট", "body", "বিবরণ"]);
  const excerptIdx = findIdx(["excerpt", "সারসংক্ষেপ"]);
  const catIdx = findIdx(["category", "ক্যাটাগরি"]);
  const authorIdx = findIdx(["author", "লেখক"]);
  const tagsIdx = findIdx(["tags", "ট্যাগ"]);
  const statusIdx = findIdx(["status", "স্ট্যাটাস"]);
  const dateIdx = findIdx(["published at", "date", "তারিখ", "created at"]);

  const detectedAuthors = new Set<string>();
  const detectedCategories = new Set<string>();
  const posts: ParsedImportPost[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

    const titleBn = (titleBnIdx >= 0 ? row[titleBnIdx] : row[0])?.trim() || "শিরোনামহীন পোস্ট";
    const titleEn = (titleEnIdx >= 0 ? row[titleEnIdx] : "")?.trim() || titleBn;
    const content = (contentIdx >= 0 ? row[contentIdx] : "")?.trim() || "";
    const excerpt = (excerptIdx >= 0 ? row[excerptIdx] : "")?.trim() || content.replace(/<[^>]*>?/gm, "").slice(0, 200).trim();
    const slug = (slugIdx >= 0 && row[slugIdx]?.trim()) ? row[slugIdx].trim() : bnToEnSlug(titleBn, String(i));
    const cat = (catIdx >= 0 ? row[catIdx] : "")?.trim();
    const auth = (authorIdx >= 0 ? row[authorIdx] : "")?.trim();
    const rawTags = (tagsIdx >= 0 ? row[tagsIdx] : "")
      ?.split(/[,;]/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean) || [];

    if (cat) detectedCategories.add(cat);
    if (auth) detectedAuthors.add(auth);

    const statusVal = (statusIdx >= 0 ? row[statusIdx] : "")?.toLowerCase().trim();
    const isPublished = !statusVal || statusVal === "published" || statusVal === "publish" || statusVal === "প্রকাশিত";

    posts.push({
      title_bn: titleBn,
      title_en: titleEn,
      slug,
      content_bn: content,
      content_en: content,
      excerpt_bn: excerpt,
      excerpt_en: excerpt,
      cover_image_url: extractFirstImage(content),
      author_name: auth || undefined,
      category_name: cat || undefined,
      tags: rawTags,
      published: isPublished,
      published_at: (dateIdx >= 0 && row[dateIdx]?.trim()) ? new Date(row[dateIdx].trim()).toISOString() : new Date().toISOString(),
    });
  }

  return {
    posts,
    detectedAuthors: Array.from(detectedAuthors),
    detectedCategories: Array.from(detectedCategories),
    type: "csv",
  };
}

/* ========================================================================== */
/* 4. UTILITIES                                                               */
/* ========================================================================== */

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function extractFirstImage(htmlContent: string): string | null {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Robust CSV parser that handles multi-line fields and double quotes.
 */
function parseCsvRows(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, ""); // remove BOM
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++; // handle CRLF
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}
