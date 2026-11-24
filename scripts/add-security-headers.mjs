import fs from "node:fs";
import path from "node:path";

const serverPath = path.resolve(process.cwd(), "src", "server.ts");
let code = fs.readFileSync(serverPath, "utf8");

const startAnchor = 'const contentType = normalized.headers.get("content-type") || "";';
const endAnchor = '} catch (error) {';

const startIndex = code.indexOf(startAnchor);
const endIndex = code.indexOf(endAnchor, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newHtmlHandling = `const contentType = normalized.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return normalized;
      }

      const nonce = (
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
      ).slice(0, 24);

      let html = await normalized.text();

      const articleMatch = url.pathname.match(/^\\/articles\\/([^/]+)/);
      if (articleMatch) {
        const rawSlug = articleMatch[1];
        const decodedSlug = decodeURIComponent(rawSlug);
        const meta = STATIC_META_MAP.get(decodedSlug) || STATIC_META_MAP.get(rawSlug);

        const canonicalUrl = \`\${url.origin}/articles/\${rawSlug}\`;
        const ogImage = \`\${url.origin}/og/articles/\${rawSlug}.png\`;
        const title = meta?.title_bn ? \`\${meta.title_bn} - Alam M\` : "Alam M - শব্দ আমার ক্যানভাস";

        html = html.replace(/<link\\s+rel=["']canonical["'][^>]*>/gi, "");
        html = html.replace(/<meta\\s+property=["']og:url["'][^>]*>/gi, "");
        html = html.replace(/<meta\\s+property=["']og:image["'][^>]*>/gi, "");
        html = html.replace(/<meta\\s+property=["']og:image:secure_url["'][^>]*>/gi, "");

        const injection = \`
    <link rel="canonical" href="\${canonicalUrl}" />
    <meta property="og:url" content="\${canonicalUrl}" />
    <meta property="og:image" content="\${ogImage}" />
    <meta property="og:image:secure_url" content="\${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="\${escapeHtml(title)}" />
    <meta name="twitter:image" content="\${ogImage}" />\`;

        if (html.includes("</title>")) {
          html = html.replace("</title>", \`</title>\${injection}\`);
        } else if (html.includes("<head>")) {
          html = html.replace("<head>", \`<head>\${injection}\`);
        }
      }

      // Inject nonce into all <script> tags so CSP executes them without needing 'unsafe-inline'
      html = html.replace(/<script\\b(?![^>]*\\bnonce=)([^>]*)>/gi, \`<script nonce="\${nonce}"$1>\`);

      const newHeaders = new Headers(normalized.headers);
      if (articleMatch) {
        const canonicalUrl = \`\${url.origin}/articles/\${articleMatch[1]}\`;
        newHeaders.set("Link", \`<\${canonicalUrl}>; rel="canonical"\`);
        newHeaders.set("Cache-Control", "public, max-age=0, must-revalidate");
        newHeaders.set("Cloudflare-CDN-Cache-Control", "no-cache");
      }

      const csp = \`default-src 'self'; script-src 'self' 'nonce-\${nonce}' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.cloudflare.com https://api.coindyna.com https://res.cloudinary.com; frame-src 'self' https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self';\`;
      newHeaders.set("Content-Security-Policy", csp);

      return new Response(html, {
        status: normalized.status,
        headers: newHeaders,
      });
    `;

  code = code.slice(0, startIndex) + newHtmlHandling + code.slice(endIndex);
  fs.writeFileSync(serverPath, code, { encoding: "utf8" });
  console.log("Successfully replaced with nonce logic in src/server.ts");
} else {
  console.log("Anchors not found: startIndex=", startIndex, "endIndex=", endIndex);
}
