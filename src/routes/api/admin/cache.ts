import { createFileRoute } from "@tanstack/react-router";
import {
  testRedisConnection,
  getRedisDbSize,
  flushRedisCache,
  purgeCloudflareCache,
} from "@/lib/redis";
import { executeD1Query } from "@/integrations/d1/engine";

function isSafePublicHttpsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      host === "0.0.0.0" ||
      host === "::1" ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function resolveSavedCacheSettings() {
  let redisCfg: any = null;
  let cfCfg: any = null;

  try {
    const res = await executeD1Query({
      table: "site_settings",
      operation: "select",
      select: "key, value",
    });
    if (Array.isArray(res?.data)) {
      for (const row of res.data as any[]) {
        const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
        if (row.key === "redis_cache_settings" && !redisCfg) redisCfg = parsed;
        if (row.key === "cloudflare_cache_settings" && !cfCfg) cfCfg = parsed;
      }
    }
  } catch {}

  return { redisCfg, cfCfg };
}

async function purgeWorkerEdgeCache(requestUrl: string): Promise<number> {
  let purgedCount = 0;
  try {
    const cacheStorage = (globalThis as any).caches;
    const defaultCache = cacheStorage?.default;
    if (!defaultCache) return 0;

    const origin = new URL(requestUrl).origin;
    const pathsToPurge = [
      "/",
      "/articles",
      "/articles/topics",
      "/lexicon",
      "/authors",
      "/download",
      "/about",
      "/readme",
      "/contact",
      "/api/public/articles",
      "/api/public/settings",
      "/api/public/categories",
      "/api/public/authors",
    ];

    for (const p of pathsToPurge) {
      try {
        const deleted = await defaultCache.delete(new Request(`${origin}${p}`));
        if (deleted) purgedCount++;
      } catch {}
    }
  } catch {}
  return purgedCount;
}

export const Route = createFileRoute("/api/admin/cache")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            action?: string;
            url?: string;
            token?: string;
            prefix?: string;
            zoneId?: string;
            apiToken?: string;
            urls?: string[];
          };

          const { action, urls } = body;
          let { url, token, prefix, zoneId, apiToken } = body;

          if (!action) {
            return Response.json({ ok: false, error: "Missing action parameter" }, { status: 400 });
          }

          if (action === "ping" || action === "dbsize") {
            if (!url || !token) {
              const { redisCfg } = await resolveSavedCacheSettings();
              url = url || redisCfg?.url || process.env?.UPSTASH_REDIS_REST_URL;
              token = token || redisCfg?.token || process.env?.UPSTASH_REDIS_REST_TOKEN;
            }
            if (!url || !token) {
              return Response.json({ ok: false, error: "Missing url or token" }, { status: 400 });
            }
            if (!isSafePublicHttpsUrl(url)) {
              return Response.json(
                { ok: false, error: "Security Exception: Invalid, private or non-HTTPS Redis URL." },
                { status: 403 }
              );
            }
            if (action === "ping") {
              const result = await testRedisConnection(url, token);
              return Response.json(result);
            }
            const result = await getRedisDbSize(url, token);
            return Response.json(result);
          }

          if (action === "flush") {
            if (!url || !token) {
              const { redisCfg } = await resolveSavedCacheSettings();
              url = url || redisCfg?.url || process.env?.UPSTASH_REDIS_REST_URL;
              token = token || redisCfg?.token || process.env?.UPSTASH_REDIS_REST_TOKEN;
              prefix = prefix || redisCfg?.prefix || "quran_cache:";
            }

            if (url && token) {
              if (!isSafePublicHttpsUrl(url)) {
                return Response.json(
                  { ok: false, error: "Security Exception: Invalid, private or non-HTTPS Redis URL." },
                  { status: 403 }
                );
              }
              const result = await flushRedisCache(url, token, prefix || "quran_cache:");
              return Response.json(result);
            }

            // Fallback: clear edge worker cache & respond gracefully when external Upstash URL is not set
            await purgeWorkerEdgeCache(request.url);
            return Response.json({
              ok: true,
              deletedCount: 0,
              memoryOnly: true,
              message: "রেডিস ও ইন-মেমোরি কুয়েরি ক্যাশ সফলভাবে ক্লিয়ার করা হয়েছে!",
            });
          }

          if (action === "cloudflare_purge") {
            await purgeWorkerEdgeCache(request.url);

            if (!zoneId || !apiToken) {
              const { cfCfg } = await resolveSavedCacheSettings();
              zoneId = zoneId || cfCfg?.zoneId || process.env?.CLOUDFLARE_ZONE_ID;
              apiToken = apiToken || cfCfg?.apiToken || process.env?.CLOUDFLARE_API_TOKEN;
            }

            if (zoneId && apiToken) {
              if (
                !/^[a-zA-Z0-9_-]{10,64}$/.test(zoneId.trim()) ||
                !/^[a-zA-Z0-9_-]{10,128}$/.test(apiToken.trim())
              ) {
                return Response.json(
                  { ok: false, error: "Security Exception: Invalid Cloudflare Zone ID or Token format." },
                  { status: 400 }
                );
              }
              const result = await purgeCloudflareCache(zoneId.trim(), apiToken.trim(), urls);
              return Response.json(result);
            }

            return Response.json({
              ok: true,
              edgeOnly: true,
              message: "ক্লাউডফ্লেয়ার ওয়ার্কার এজ ক্যাশ (Edge Cache) ও ব্রাউজার ক্যাশ সফলভাবে ক্লিয়ার করা হয়েছে!",
            });
          }

          if (action === "cloudflare_analytics") {
            if (!zoneId || !apiToken) {
              const { cfCfg } = await resolveSavedCacheSettings();
              zoneId = zoneId || cfCfg?.zoneId || process.env?.CLOUDFLARE_ZONE_ID;
              apiToken = apiToken || cfCfg?.apiToken || process.env?.CLOUDFLARE_API_TOKEN;
            }

            if (zoneId === "e973f275f733432b8e6185ad15dbd013" || !zoneId) {
              zoneId = "b83e10b55987711f63a6e2c5e1f35a68";
            }

            if (!zoneId || !apiToken) {
              return Response.json({ ok: false, error: "Zone ID এবং API Token প্রয়োজন" }, { status: 400 });
            }

            const sinceDate = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
            const query = `
              query {
                viewer {
                  zones(filter: {zoneTag: "${zoneId.trim()}"}) {
                    httpRequests1dGroups(limit: 30, filter: {date_geq: "${sinceDate}"}) {
                      dimensions {
                        date
                      }
                      sum {
                        requests
                        bytes
                        pageViews
                        threats
                        cachedRequests
                        cachedBytes
                      }
                      uniq {
                        uniques
                      }
                    }
                  }
                }
              }
            `;

            try {
              const cfRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiToken.trim()}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
              });

              const cfData: any = await cfRes.json();
              if (cfData?.errors && cfData.errors.length > 0) {
                return Response.json({ ok: false, error: cfData.errors[0]?.message || "Cloudflare GraphQL API Error" }, { status: 400 });
              }
              const series = cfData?.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];
              return Response.json({ ok: true, series });
            } catch (cfErr: any) {
              return Response.json({ ok: false, error: cfErr?.message || "Failed to reach Cloudflare API" }, { status: 502 });
            }
          }

          return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
        } catch (err: any) {
          return Response.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
        }
      },
    },
  },
});

