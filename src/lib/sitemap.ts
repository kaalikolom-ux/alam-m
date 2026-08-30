import { supabase } from "@/integrations/supabase/client";

export async function generateSitemapXml(origin: string): Promise<string> {
  const cleanOrigin = origin.replace(/\/$/, "");

  // Fetch all published articles
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at, published_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  // Fetch all categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, created_at");

  // Fetch all custom pages
  const { data: pages } = await supabase
    .from("pages")
    .select("slug, updated_at");

  const staticUrls = [
    { loc: `${cleanOrigin}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${cleanOrigin}/articles`, priority: "0.9", changefreq: "daily" },
    { loc: `${cleanOrigin}/about`, priority: "0.8", changefreq: "weekly" },
    { loc: `${cleanOrigin}/contact`, priority: "0.7", changefreq: "monthly" },
    { loc: `${cleanOrigin}/bookmarks`, priority: "0.5", changefreq: "monthly" },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static URLs
  for (const item of staticUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${item.loc}</loc>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // Dynamic Articles
  if (articles && articles.length > 0) {
    for (const article of articles) {
      const lastmod = article.updated_at || article.published_at || new Date().toISOString();
      xml += '  <url>\n';
      xml += `    <loc>${cleanOrigin}/articles/${encodeURIComponent(article.slug)}</loc>\n`;
      xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.85</priority>\n';
      xml += '  </url>\n';
    }
  }

  // Dynamic Categories
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      xml += '  <url>\n';
      xml += `    <loc>${cleanOrigin}/c/${encodeURIComponent(cat.slug)}</loc>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }
  }

  // Dynamic Pages
  if (pages && pages.length > 0) {
    for (const page of pages) {
      if (page.slug === "about" || page.slug === "contact") continue;
      const lastmod = page.updated_at || new Date().toISOString();
      xml += '  <url>\n';
      xml += `    <loc>${cleanOrigin}/p/${encodeURIComponent(page.slug)}</loc>\n`;
      xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }
  }

  xml += '</urlset>';
  return xml;
}
