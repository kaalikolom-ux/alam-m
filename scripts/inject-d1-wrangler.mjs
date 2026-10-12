import fs from "node:fs";
import path from "node:path";

const wranglerJsonPath = path.resolve(process.cwd(), ".output", "server", "wrangler.json");

if (fs.existsSync(wranglerJsonPath)) {
  try {
    const raw = fs.readFileSync(wranglerJsonPath, "utf8");
    const config = JSON.parse(raw);
    config.d1_databases = [
      {
        binding: "DB",
        database_name: "alam-m",
        database_id: "addf217c-a0a6-4ffe-83b9-3d945a1091cb",
      },
    ];
    fs.writeFileSync(wranglerJsonPath, JSON.stringify(config, null, 2) + "\n", "utf8");
    console.log("[D1] Injected D1 binding (alam-m) into .output/server/wrangler.json");
  } catch (err) {
    console.error("[D1] Failed to update .output/server/wrangler.json:", err);
  }
}
