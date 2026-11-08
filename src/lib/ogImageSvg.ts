// src/lib/ogImageSvg.ts

export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function wrapTitle(text: string, maxCharsPerLine = 32, maxLines = 3): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  if (currentLine && lines.length < maxLines) {
    const remainingWords = words.slice(words.indexOf(currentLine.split(' ')[0]));
    lines.push(remainingWords.join(' '));
  }

  if (lines.length >= maxLines && words.length > lines.join(' ').split(' ').length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:!?]+$/, '') + '...';
  }

  return lines;
}

export function wrapSubtitle(text: string, maxCharsPerLine = 66, maxLines = 2): string[] {
  if (!text) return [];
  const clean = text.replace(/<[^>]*>/g, '').replace(/[*_#`]/g, '').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  if (lines.length >= maxLines && words.length > lines.join(' ').split(' ').length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:!?]+$/, '') + '...';
  }
  return lines;
}

export interface OgSvgOptions {
  title: string;
  excerpt?: string;
  categoryName?: string;
  authorName?: string;
  domain?: string;
}

export function generateArticleOgSvg({
  title,
  excerpt = '',
  categoryName = 'কবিতা ও চিন্তাভাবনা',
  authorName = 'আলম এম.',
  domain = 'blog.wooniche.com'
}: OgSvgOptions): string {
  const titleLines = wrapTitle(title, 30, 3);
  const subtitleLines = wrapSubtitle(excerpt, 64, 2);

  let titleFontSize = 50;
  let titleLineHeight = 72;
  if (titleLines.length === 3) {
    titleFontSize = 42;
    titleLineHeight = 62;
  } else if (titleLines.length === 1) {
    titleFontSize = 56;
    titleLineHeight = 78;
  }

  const titleBlockHeight = titleLines.length * titleLineHeight;
  const subtitleBlockHeight = subtitleLines.length > 0 ? (subtitleLines.length * 34 + 35) : 0;
  const totalContentHeight = titleBlockHeight + subtitleBlockHeight;
  const contentStartY = Math.max(165, Math.floor(140 + (375 - totalContentHeight) / 2));

  const titleSvgElements = titleLines
    .map((line, idx) => {
      const y = contentStartY + (idx * titleLineHeight);
      return `<text x="85" y="${y}" font-family="'Noto Serif Bengali', 'Hind Siliguri', 'Nirmala UI', serif" font-size="${titleFontSize}" font-weight="800" fill="#ffffff" filter="url(#textGlow)">${escapeXml(line)}</text>`;
    })
    .join('\n    ');

  const dividerY = contentStartY + titleBlockHeight - 12;
  const subtitleStartY = dividerY + 44;

  const subtitleSvgElements = subtitleLines
    .map((line, idx) => {
      const y = subtitleStartY + (idx * 32);
      return `<text x="85" y="${y}" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="20" font-weight="400" fill="#cbd5e1">${escapeXml(line)}</text>`;
    })
    .join('\n    ');

  const authorInitials = authorName.replace(/[^অ-হa-zA-Z]/g, '').slice(0, 3) || 'আলম';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Cosmic Obsidian Gradient (Matching Website #050b14) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#040810" />
      <stop offset="45%" stop-color="#070e1b" />
      <stop offset="85%" stop-color="#0b1426" />
      <stop offset="100%" stop-color="#050a12" />
    </linearGradient>

    <!-- Celestial Sky-Blue Radial Core Glow (Matching primary) -->
    <radialGradient id="centerGlow" cx="40%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.14" />
      <stop offset="45%" stop-color="#0284c7" stop-opacity="0.06" />
      <stop offset="85%" stop-color="#0369a1" stop-opacity="0.01" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Top Right Celestial Aura -->
    <radialGradient id="topAura" cx="85%" cy="15%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.12" />
      <stop offset="50%" stop-color="#0ea5e9" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Signature Sky-Blue Surface & Bevel -->
    <linearGradient id="blueSurface" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="blueBevel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.5" />
    </linearGradient>

    <!-- Glass Pill Gradient -->
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#0c1829" stop-opacity="0.75" />
    </linearGradient>

    <!-- Divider Celestial Cyan Line Gradient -->
    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
      <stop offset="25%" stop-color="#38bdf8" stop-opacity="0.85" />
      <stop offset="50%" stop-color="#7dd3fc" stop-opacity="1" />
      <stop offset="75%" stop-color="#38bdf8" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
    </linearGradient>

    <!-- Soft Drop Shadows -->
    <filter id="textGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.65" />
    </filter>

    <filter id="shadowBox" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- Base Solid Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Atmospheric Glows -->
  <rect width="1200" height="630" fill="url(#centerGlow)" />
  <rect width="1200" height="630" fill="url(#topAura)" />

  <!-- Subtle Celestial Motifs -->
  <g opacity="0.05" stroke="#38bdf8" stroke-width="1" fill="none">
    <circle cx="1060" cy="180" r="140" stroke-dasharray="4,8" />
    <circle cx="1060" cy="180" r="80" stroke-dasharray="2,6" />
    <polygon points="1060,100 1085,155 1140,180 1085,205 1060,260 1035,205 980,180 1035,155" />
    <line x1="80" y1="315" x2="1120" y2="315" stroke-dasharray="2,14" />
  </g>

  <!-- Elegant Inner Border Frame (Celestial Cyan) -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#38bdf8" stroke-opacity="0.32" stroke-width="1.5" />
  <rect x="30" y="30" width="1140" height="570" rx="16" fill="none" stroke="#7dd3fc" stroke-opacity="0.12" stroke-width="1" />

  <!-- Corner Brackets (Celestial Sky Blue) -->
  <g stroke="#38bdf8" stroke-width="2.5" fill="none" opacity="0.85">
    <path d="M 44 64 L 44 44 L 64 44" />
    <circle cx="44" cy="44" r="3" fill="#38bdf8" />
    <path d="M 1156 64 L 1156 44 L 1136 44" />
    <circle cx="1156" cy="44" r="3" fill="#38bdf8" />
    <path d="M 44 566 L 44 586 L 64 586" />
    <circle cx="44" cy="586" r="3" fill="#38bdf8" />
    <path d="M 1156 566 L 1156 586 L 1136 586" />
    <circle cx="1156" cy="586" r="3" fill="#38bdf8" />
  </g>

  <!-- ==================== HEADER (1:1 with Website Logo) ==================== -->
  <g transform="translate(85, 55)">
    <!-- Alam M (Signature Sky Blue, Matching Website Header text-primary) -->
    <text x="0" y="32" font-family="'Kaushan Script', 'Brush Script MT', 'Segoe Script', cursive" font-size="34" font-weight="bold" fill="#38bdf8" filter="url(#textGlow)">Alam M</text>
    <!-- শব্দ আমার ক্যানভাস (Muted Cool Gray with wide tracking, Matching Website Header text-muted-foreground) -->
    <text x="2" y="52" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="13" font-weight="500" fill="#94a3b8" letter-spacing="2.5">শব্দ আমার ক্যানভাস</text>
  </g>

  <!-- Category Pill Badge (Top Right) -->
  <g transform="translate(1132, 74)">
    <rect x="-260" y="-18" width="260" height="38" rx="19" fill="url(#glassGrad)" stroke="#38bdf8" stroke-opacity="0.6" stroke-width="1.3" />
    <circle cx="-238" cy="1" r="4.5" fill="#38bdf8" />
    <text x="-120" y="6" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="14" font-weight="700" fill="#bae6fd" text-anchor="middle">
      ${escapeXml(categoryName)}
    </text>
  </g>

  <!-- ==================== BODY (TITLE + SUBTITLE) ==================== -->
  <g>
    ${titleSvgElements}
  </g>

  <!-- Glowing Divider with Cyan Diamond -->
  <g transform="translate(85, ${dividerY})">
    <rect x="0" y="0" width="460" height="2.5" rx="1.25" fill="url(#lineGrad)" />
    <polygon points="18,-4 23,1 18,6 13,1" fill="#7dd3fc" />
  </g>

  <!-- Subtitle / Excerpt -->
  <g>
    ${subtitleSvgElements}
  </g>

  <!-- ==================== FOOTER ==================== -->
  <g transform="translate(85, 550)">
    <!-- Author Avatar Badge -->
    <circle cx="18" cy="0" r="18" fill="url(#blueSurface)" />
    <circle cx="18" cy="0" r="17" fill="none" stroke="url(#blueBevel)" stroke-width="1.2" />
    <text x="18" y="5" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="12" font-weight="bold" fill="#070c14" text-anchor="middle">${escapeXml(authorInitials)}</text>
    
    <text x="48" y="-2" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="15" font-weight="bold" fill="#ffffff">লেখক: ${escapeXml(authorName)}</text>
    <text x="48" y="16" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="12" fill="#7dd3fc">গল্প, কবিতা ও স্মৃতিকথা</text>
  </g>

  <!-- Domain Badge (Right Footer) -->
  <g transform="translate(1132, 550)">
    <rect x="-260" y="-16" width="260" height="34" rx="17" fill="#090f18" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="1.2" />
    <circle cx="-242" cy="1" r="4.5" fill="#38bdf8" />
    <text x="-120" y="6" font-family="Montserrat, Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#f8fafc" text-anchor="middle" letter-spacing="0.5">
      ${escapeXml(domain)} <tspan fill="#38bdf8">•</tspan> wooniche.com
    </text>
  </g>
</svg>`;
}

export interface HomeOgSvgOptions {
  siteName?: string;
  tagline?: string;
  description?: string;
  subDescription?: string;
  categoryBadge?: string;
  authorName?: string;
  domain?: string;
}

export function generateHomeOgSvg({
  siteName = "Alam M",
  tagline = "শব্দ আমার ক্যানভাস",
  description = "কবিতা, গল্প, সাহিত্য ও চিন্তাভাবনার গভীর আলোড়নকারী সাহিত্যিক কাজ",
  subDescription = "শব্দের একজন লেখক এবং জীবনের নীরব মুহূর্তের গল্পকথক",
  categoryBadge = "অফিশিয়াল ওয়েবসাইট",
  authorName = "আলম এম.",
  domain = "blog.wooniche.com",
}: HomeOgSvgOptions = {}): string {
  const authorInitials = authorName.replace(/[^অ-হa-zA-Z]/g, "").slice(0, 3) || "আলম";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Cosmic Obsidian Gradient -->
    <linearGradient id="homeBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#040810" />
      <stop offset="35%" stop-color="#070e1b" />
      <stop offset="70%" stop-color="#0b1426" />
      <stop offset="100%" stop-color="#050a12" />
    </linearGradient>

    <!-- Center Radial Glow (Brand Primary Sky-Blue / Cyan) -->
    <radialGradient id="homeCenterGlow" cx="50%" cy="48%" r="60%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18" />
      <stop offset="35%" stop-color="#0284c7" stop-opacity="0.08" />
      <stop offset="70%" stop-color="#0369a1" stop-opacity="0.02" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Top Left & Bottom Right Ambient Auras -->
    <radialGradient id="homeTopAura" cx="15%" cy="15%" r="45%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.12" />
      <stop offset="60%" stop-color="#0284c7" stop-opacity="0.02" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="homeBottomAura" cx="85%" cy="85%" r="45%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.10" />
      <stop offset="60%" stop-color="#0369a1" stop-opacity="0.02" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Title Gradient (Sky to Vibrant Cyan) -->
    <linearGradient id="homeTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>

    <!-- Avatar Surface & Bevel -->
    <linearGradient id="homeAvatarSurface" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="homeAvatarBevel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.5" />
    </linearGradient>

    <!-- Glass Pill Gradient -->
    <linearGradient id="homeGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#0c1829" stop-opacity="0.75" />
    </linearGradient>

    <!-- Center Line Gradient -->
    <linearGradient id="homeLineGradCenter" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
      <stop offset="25%" stop-color="#38bdf8" stop-opacity="0.85" />
      <stop offset="50%" stop-color="#7dd3fc" stop-opacity="1" />
      <stop offset="75%" stop-color="#38bdf8" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="homeTextGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.75" />
    </filter>
  </defs>

  <!-- Base Background -->
  <rect width="1200" height="630" fill="url(#homeBgGrad)" />
  <rect width="1200" height="630" fill="url(#homeCenterGlow)" />
  <rect width="1200" height="630" fill="url(#homeTopAura)" />
  <rect width="1200" height="630" fill="url(#homeBottomAura)" />

  <!-- Geometric Celestial Motifs -->
  <g opacity="0.05" stroke="#38bdf8" stroke-width="1" fill="none">
    <circle cx="600" cy="315" r="280" stroke-dasharray="4,10" />
    <circle cx="600" cy="315" r="200" stroke-dasharray="2,8" />
    <polygon points="600,165 640,275 750,315 640,355 600,465 560,355 450,315 560,275" />
  </g>

  <!-- Elegant Inner Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#38bdf8" stroke-opacity="0.32" stroke-width="1.5" />
  <rect x="30" y="30" width="1140" height="570" rx="16" fill="none" stroke="#7dd3fc" stroke-opacity="0.12" stroke-width="1" />

  <!-- Corner Brackets -->
  <g stroke="#38bdf8" stroke-width="2.5" fill="none" opacity="0.85">
    <path d="M 44 64 L 44 44 L 64 44" />
    <circle cx="44" cy="44" r="3" fill="#38bdf8" />
    <path d="M 1156 64 L 1156 44 L 1136 44" />
    <circle cx="1156" cy="44" r="3" fill="#38bdf8" />
    <path d="M 44 566 L 44 586 L 64 586" />
    <circle cx="44" cy="586" r="3" fill="#38bdf8" />
    <path d="M 1156 566 L 1156 586 L 1136 586" />
    <circle cx="1156" cy="586" r="3" fill="#38bdf8" />
  </g>

  <!-- ==================== HEADER ==================== -->
  <g transform="translate(85, 55)">
    <text x="0" y="32" font-family="'Kaushan Script', 'Brush Script MT', 'Segoe Script', cursive" font-size="34" font-weight="bold" fill="#38bdf8" filter="url(#homeTextGlow)">Alam M</text>
    <text x="2" y="52" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="13" font-weight="500" fill="#94a3b8" letter-spacing="2.5">শব্দ আমার ক্যানভাস</text>
  </g>

  <!-- Category Badge (Top Right) -->
  <g transform="translate(1132, 74)">
    <rect x="-260" y="-18" width="260" height="38" rx="19" fill="url(#homeGlassGrad)" stroke="#38bdf8" stroke-opacity="0.6" stroke-width="1.3" />
    <circle cx="-238" cy="1" r="4.5" fill="#38bdf8" />
    <text x="-120" y="6" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="14" font-weight="700" fill="#bae6fd" text-anchor="middle">
      ${escapeXml(categoryBadge)}
    </text>
  </g>

  <!-- ==================== CENTER HERO ==================== -->
  <g transform="translate(600, 235)">
    <!-- Brand Title in Kaushan Script -->
    <text x="0" y="0" font-family="'Kaushan Script', 'Brush Script MT', 'Segoe Script', cursive" font-size="82" font-weight="bold" fill="url(#homeTitleGrad)" text-anchor="middle" filter="url(#homeTextGlow)">${escapeXml(siteName)}</text>
    
    <!-- Subtitle in Bengali -->
    <text x="0" y="65" font-family="'Hind Siliguri', 'Noto Serif Bengali', serif" font-size="36" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${escapeXml(tagline)}</text>

    <!-- Center Glowing Divider Line with Diamond -->
    <rect x="-220" y="92" width="440" height="2.5" rx="1.25" fill="url(#homeLineGradCenter)" />
    <polygon points="0,87 6,93 0,100 -6,93" fill="#7dd3fc" />

    <!-- Description -->
    <text x="0" y="142" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="22" font-weight="500" fill="#cbd5e1" text-anchor="middle">${escapeXml(description)}</text>
    <text x="0" y="178" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="17" font-weight="400" fill="#94a3b8" text-anchor="middle">${escapeXml(subDescription)}</text>
  </g>

  <!-- ==================== FOOTER ==================== -->
  <g transform="translate(85, 550)">
    <!-- Author Avatar Badge -->
    <circle cx="18" cy="0" r="18" fill="url(#homeAvatarSurface)" />
    <circle cx="18" cy="0" r="17" fill="none" stroke="url(#homeAvatarBevel)" stroke-width="1.2" />
    <text x="18" y="5" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="12" font-weight="bold" fill="#070c14" text-anchor="middle">${escapeXml(authorInitials)}</text>
    
    <text x="48" y="-2" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="15" font-weight="bold" fill="#ffffff">লেখক: ${escapeXml(authorName)}</text>
    <text x="48" y="16" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="12" fill="#7dd3fc">গল্প, কবিতা ও চিন্তাভাবনা</text>
  </g>

  <!-- Domain Badge (Right Footer) -->
  <g transform="translate(1132, 550)">
    <rect x="-260" y="-16" width="260" height="34" rx="17" fill="#090f18" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="1.2" />
    <circle cx="-242" cy="1" r="4.5" fill="#38bdf8" />
    <text x="-120" y="6" font-family="Montserrat, Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#f8fafc" text-anchor="middle" letter-spacing="0.5">
      ${escapeXml(domain)}
    </text>
  </g>
</svg>`;
}

