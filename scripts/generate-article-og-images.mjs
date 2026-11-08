// scripts/generate-article-og-images.mjs
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateArticleOgSvg, generateHomeOgSvg } from '../src/lib/ogImageSvg.ts';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const targetSlug = args.find(a => !a.startsWith('-'));

  const publicDir = path.resolve('public');
  const ogDir = path.resolve('public/og');
  const outputDir = path.resolve('public/og/articles');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const distOutputDir = path.resolve('.output/public/og/articles');
  if (fs.existsSync(path.resolve('.output/public')) && !fs.existsSync(distOutputDir)) {
    fs.mkdirSync(distOutputDir, { recursive: true });
  }

  console.log('🖼️  Generating luxury Open Graph (og:image) banners for Alam M (blog.wooniche.com)...');

  // 1. Generate Homepage OG Image (1200x630 HD) for https://blog.wooniche.com/
  try {
    const homeSvg = generateHomeOgSvg({
      siteName: 'Alam M',
      tagline: 'শব্দ আমার ক্যানভাস',
      description: 'কবিতা, গল্প, সাহিত্য ও চিন্তাভাবনার গভীর আলোড়নকারী সাহিত্যিক কাজ',
      subDescription: 'শব্দের একজন লেখক এবং জীবনের নীরব মুহূর্তের গল্পকথক',
      categoryBadge: 'অফিশিয়াল ওয়েবসাইট',
      authorName: 'আলম এম.',
      domain: 'blog.wooniche.com'
    });

    const homePngBuffer = await sharp(Buffer.from(homeSvg))
      .png({ quality: 95, compressionLevel: 8 })
      .toBuffer();

    const homeJpgBuffer = await sharp(Buffer.from(homeSvg))
      .jpeg({ quality: 92 })
      .toBuffer();

    // Write to public/
    fs.writeFileSync(path.join(publicDir, 'og-image.png'), homePngBuffer);
    fs.writeFileSync(path.join(publicDir, 'og-image.jpg'), homeJpgBuffer);
    if (!fs.existsSync(ogDir)) fs.mkdirSync(ogDir, { recursive: true });
    fs.writeFileSync(path.join(ogDir, 'home.png'), homePngBuffer);

    // Write to .output/public/ if dist exists
    const distPublic = path.resolve('.output/public');
    if (fs.existsSync(distPublic)) {
      fs.writeFileSync(path.join(distPublic, 'og-image.png'), homePngBuffer);
      fs.writeFileSync(path.join(distPublic, 'og-image.jpg'), homeJpgBuffer);
      const distOg = path.join(distPublic, 'og');
      if (!fs.existsSync(distOg)) fs.mkdirSync(distOg, { recursive: true });
      fs.writeFileSync(path.join(distOg, 'home.png'), homePngBuffer);
    }

    console.log('   ✅ Homepage OG Banner Generated: og-image.png, og-image.jpg, og/home.png (1200x630 HD)');
  } catch (err) {
    console.error('❌ Failed to generate Homepage OG image:', err.message);
  }

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
        domain: 'blog.wooniche.com'
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
