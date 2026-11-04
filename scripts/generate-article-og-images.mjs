// scripts/generate-article-og-images.mjs
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateArticleOgSvg } from '../src/lib/ogImageSvg.ts';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const targetSlug = args.find(a => !a.startsWith('-'));

  const outputDir = path.resolve('public/og/articles');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const distOutputDir = path.resolve('.output/public/og/articles');
  if (fs.existsSync(path.resolve('.output/public')) && !fs.existsSync(distOutputDir)) {
    fs.mkdirSync(distOutputDir, { recursive: true });
  }

  console.log('🖼️  Generating luxury article Open Graph (og:image) banners...');

  // Read articles from src/integrations/d1/seed-data.ts
  const seedPath = path.resolve('src/integrations/d1/seed-data.ts');
  const seedRaw = fs.readFileSync(seedPath, 'utf8');
  const prefix = '// Auto-generated initial seed data from Supabase for Cloudflare D1 (SQLite)\nexport const INITIAL_SEED_DATA = ';
  const jsonStr = seedRaw.slice(prefix.length, seedRaw.lastIndexOf(' as const;'));
  const seedData = JSON.parse(jsonStr);

  const articles = seedData.articles || [];
  const categoriesMap = new Map();
  (seedData.categories || []).forEach(c => categoriesMap.set(c.id, c.name_bn || c.name_en));

  const articleCategoriesMap = new Map();
  (seedData.article_categories || []).forEach(ac => {
    if (!articleCategoriesMap.has(ac.article_id)) {
      articleCategoriesMap.set(ac.article_id, ac.category_id);
    }
  });

  const total = articles.length;
  console.log(`Found ${total} articles in seed-data.`);

  let generatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < total; i++) {
    const art = articles[i];
    if (!art || !art.slug) continue;

    if (targetSlug && art.slug !== targetSlug) {
      continue;
    }

    const outPath = path.join(outputDir, `${art.slug}.png`);
    if (fs.existsSync(outPath) && !force && !targetSlug) {
      skippedCount++;
      continue;
    }

    const title = art.title_bn || art.title_en || 'Alam M';
    const excerpt = art.excerpt_bn || art.excerpt_en || '';
    const authorName = 'আলম এম.';
    
    // Resolve Category
    const catId = articleCategoriesMap.get(art.id);
    const categoryName = categoriesMap.get(catId) || 'কবিতা';

    try {
      const svg = generateArticleOgSvg({
        title,
        excerpt,
        categoryName,
        authorName,
        domain: 'a.wooniche.com'
      });

      await sharp(Buffer.from(svg))
        .png({ quality: 95, compressionLevel: 8 })
        .toFile(outPath);

      if (fs.existsSync(distOutputDir)) {
        fs.copyFileSync(outPath, path.join(distOutputDir, `${art.slug}.png`));
      }

      generatedCount++;
      console.log(`   [${i + 1}/${total}] Generated: ${art.slug}.png`);
    } catch (err) {
      console.error(`❌ Failed to generate OG image for ${art.slug}:`, err.message);
    }
  }

  console.log(`✅ OG Image Generation Complete! Generated: ${generatedCount}, Cached/Skipped: ${skippedCount}.`);
  console.log(`   Output Directory: public/og/articles/`);
}

main().catch(err => {
  console.error('Fatal error in generate-article-og-images:', err);
  process.exit(1);
});
