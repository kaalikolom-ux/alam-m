import fs from "node:fs";
import path from "node:path";

const serverPath = path.resolve(process.cwd(), "src", "server.ts");
let code = fs.readFileSync(serverPath, "utf8");

// Replace SECURITY_HEADERS block
const newBlock = `const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.cloudflare.com https://api.coindyna.com https://res.cloudinary.com; frame-src 'self' https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self';",
};`;

code = code.replace(/const SECURITY_HEADERS: Record<string, string> = \{[\s\S]*?\};/, newBlock);

fs.writeFileSync(serverPath, code, { encoding: "utf8" });
console.log("Updated SECURITY_HEADERS in src/server.ts");
