import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { generateSitemapXml } from "./lib/sitemap";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Dynamic Sitemap endpoint
    if (url.pathname === "/sitemap.xml") {
      try {
        const sitemapXml = await generateSitemapXml(url.origin);
        return new Response(sitemapXml, {
          status: 200,
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        });
      } catch (err) {
        console.error("Error generating dynamic sitemap:", err);
      }
    }

    // Dynamic Robots.txt endpoint
    if (url.pathname === "/robots.txt") {
      const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`;
      return new Response(robotsContent, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      });
    }

    // Dynamic llms.txt endpoint
    if (url.pathname === "/llms.txt") {
      const llmsContent = `# Alam M (আলম) — শব্দ আমার ক্যানভাস

> Alam M is a Bengali writer, essayist, and story seeker crafting evocative Bengali prose, poetry, and memoirs.

Alam M (${url.origin}/) is a personal literary website celebrating the nuances of the Bengali language through short stories, poetry, nostalgic memoirs, and philosophical reflections.

## Core Navigation & Pages
- [Home](${url.origin}/): Official homepage featuring author intro, highlighted stories, latest articles, and newsletter.
- [About Me (আমার পাতা)](${url.origin}/about): The author's literary profile, reflections on writing, philosophy, and personal memoirs.
- [All Articles (লেখালেখি)](${url.origin}/articles): Complete categorized collection of stories, poems, and essays with search and filter.
- [Contact (যোগাযোগ)](${url.origin}/contact): Direct contact form and email access to author Alam M.
- [Bookmarks (বুকমার্ক সমূহ)](${url.origin}/bookmarks): User's saved favorite articles and reading list.
- [Sitemap](${url.origin}/sitemap.xml): Dynamic XML sitemap listing all published articles and pages.

## Literary Categories
- [Stories (গল্প)](${url.origin}/articles?q=গল্প): Narrative short stories capturing everyday human experiences.
- [Poems (কবিতা)](${url.origin}/articles?q=কবিতা): Lyrical Bengali poetry and contemplative rhythmic verses.
- [Memories (স্মৃতিকথা)](${url.origin}/articles?q=স্মৃতিকথা): Nostalgic reflections and autobiographical essays.

## Full AI Context
- [Full LLMs Context (llms-full.txt)](${url.origin}/llms-full.txt): Comprehensive multi-page content summary for AI systems and research agents.
`;
      return new Response(llmsContent, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      });
    }

    // Dynamic llms-full.txt endpoint
    if (url.pathname === "/llms-full.txt") {
      const llmsFullContent = `# Alam M (আলম) — Comprehensive AI Context & Literary Corpus

> Official literary archive and context document for AI agents, research crawlers, and large language models.

Website: ${url.origin}/
Author: Alam M
Language: Bengali (বাংলা) & English
Genre: Literary Prose, Short Stories, Poetry, Memoirs, Essays

## Author Bio & Philosophy
Alam M is a Bengali writer and storyteller who views words as a living canvas. Writing from personal introspection, Alam seeks the quiet poetry hidden in daily life—from the steam rising at roadside tea stalls to the flutter of birds returning at dusk.

## Core Sections & Links
- [Homepage](${url.origin}/): Primary portal with featured articles, category badges, and quick search.
- [About Author (আমার পাতা)](${url.origin}/about): Complete author statement, philosophy, and literary journey.
- [Articles Feed (লেখালেখি)](${url.origin}/articles): Searchable archive of all writings.
- [Contact Portal (যোগাযোগ)](${url.origin}/contact): Author correspondence channel.
- [Sitemap](${url.origin}/sitemap.xml): Machine-readable XML sitemap.
`;
      return new Response(llmsFullContent, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
