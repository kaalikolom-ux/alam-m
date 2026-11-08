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
  heroImageBase64?: string;
  authorName?: string;
  domain?: string;
}

export function generateHomeOgSvg({
  heroImageBase64 = "",
}: HomeOgSvgOptions = {}): string {
  const bgImageElement = heroImageBase64
    ? `<image href="data:image/webp;base64,${heroImageBase64}" width="1200" height="675" x="0" y="-22" preserveAspectRatio="xMidYMid slice" />`
    : `<rect width="1200" height="630" fill="#020617" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Gold Gradient for "আলম —" -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fcd34d" />
      <stop offset="45%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Overlay Vignette & Dark Dimming -->
    <linearGradient id="heroVignette" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" stop-opacity="0.82" />
      <stop offset="50%" stop-color="#020617" stop-opacity="0.68" />
      <stop offset="85%" stop-color="#020617" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.95" />
    </linearGradient>

    <!-- Horizontal subtle radial vignette -->
    <radialGradient id="sideVignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0" />
      <stop offset="70%" stop-color="#020617" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.75" />
    </radialGradient>

    <!-- Primary Button Gradient -->
    <linearGradient id="btnPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Text Drop Shadows -->
    <filter id="heroTextGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="0.9" />
    </filter>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- 1. Background Photo (Author & Field) -->
  ${bgImageElement}

  <!-- 2. Dark Overlays (Matching Website bg-slate-950/75) -->
  <rect width="1200" height="630" fill="url(#heroVignette)" />
  <rect width="1200" height="630" fill="url(#sideVignette)" />

  <!-- 3. TOP NAVBAR (1:1 with Screenshot) -->
  <g id="navbar">
    <!-- Brand Logo Left -->
    <g transform="translate(60, 24)">
      <text x="0" y="24" font-family="'Kaushan Script', 'Brush Script MT', 'Segoe Script', cursive" font-size="26" font-weight="bold" fill="#38bdf8" filter="url(#softShadow)">Alam M</text>
      <text x="1" y="38" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="10" font-weight="500" fill="#94a3b8" letter-spacing="1.8">শব্দ আমার ক্যানভাস</text>
    </g>

    <!-- Navigation Menu Items -->
    <g transform="translate(195, 24)" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="14" font-weight="500">
      <text x="0" y="26" fill="#cbd5e1" opacity="0.85">গল্প</text>
      
      <!-- 'হোম' Active Item (Sky blue) -->
      <text x="44" y="26" fill="#38bdf8" font-weight="700">হোম</text>
      
      <text x="96" y="26" fill="#cbd5e1" opacity="0.85">কবিতা</text>
      <text x="156" y="26" fill="#cbd5e1" opacity="0.85">স্মৃতিকথা</text>
      <text x="228" y="26" fill="#cbd5e1" opacity="0.85">আমার পাতা</text>
      <text x="312" y="26" fill="#cbd5e1" opacity="0.85">যোগাযোগ</text>
    </g>

    <!-- Right Controls: Search Pill & Utility Icons -->
    <g transform="translate(860, 32)">
      <!-- Search Pill -->
      <rect x="0" y="0" width="135" height="30" rx="15" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.16)" stroke-width="1" />
      <circle cx="16" cy="15" r="4.5" fill="none" stroke="#94a3b8" stroke-width="1.2" />
      <line x1="19.5" y1="18.5" x2="23" y2="22" stroke="#94a3b8" stroke-width="1.2" />
      <text x="28" y="19" font-family="'Hind Siliguri', sans-serif" font-size="11" fill="#94a3b8">অনুসন্ধান...</text>
      <rect x="94" y="8" width="30" height="14" rx="3" fill="rgba(255,255,255,0.1)" />
      <text x="109" y="18" font-family="monospace" font-size="8.5" fill="#cbd5e1" text-anchor="middle">⌘K</text>

      <!-- Language Icon 文A -->
      <g transform="translate(155, 7)">
        <text x="4" y="12" font-family="sans-serif" font-size="12" fill="#cbd5e1">文A</text>
      </g>

      <!-- Sun / Theme Toggle -->
      <g transform="translate(195, 7)" opacity="0.8" stroke="#cbd5e1" fill="none" stroke-width="1.2">
        <circle cx="8" cy="8" r="3.5" />
        <line x1="8" y1="1" x2="8" y2="3" />
        <line x1="8" y1="13" x2="8" y2="15" />
        <line x1="1" y1="8" x2="3" y2="8" />
        <line x1="13" y1="8" x2="15" y2="8" />
      </g>

      <!-- Bookmark Icon -->
      <g transform="translate(230, 7)" opacity="0.8" stroke="#cbd5e1" fill="none" stroke-width="1.2">
        <path d="M 3 2 L 13 2 L 13 14 L 8 11 L 3 14 Z" />
      </g>

      <!-- User Avatar Icon -->
      <g transform="translate(262, 7)" opacity="0.8" stroke="#cbd5e1" fill="none" stroke-width="1.2">
        <circle cx="8" cy="6" r="3.5" />
        <path d="M 2 15 C 2 11, 14 11, 14 15" />
      </g>
    </g>
  </g>

  <!-- 4. CENTER HERO CONTENT (1:1 with Screenshot) -->
  <g id="heroContent" transform="translate(600, 190)">
    <!-- Pill Badge: ✨ সাহিত্য ও চিন্তন -->
    <g transform="translate(0, 0)">
      <rect x="-82" y="-16" width="164" height="32" rx="16" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1" filter="url(#softShadow)" />
      <!-- Sparkle Icon -->
      <path d="M -60 -1 Q -56 -1 -56 -5 Q -56 -1 -52 -1 Q -56 -1 -56 3 Q -56 -1 -60 -1 Z" fill="#f59e0b" />
      <circle cx="-56" cy="-1" r="1.2" fill="#fde68a" />
      <text x="6" y="5" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="13" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">সাহিত্য ও চিন্তন</text>
    </g>

    <!-- Main Title: আমি আলম — -->
    <text x="0" y="82" font-family="'Hind Siliguri', 'Noto Serif Bengali', serif" font-size="64" font-weight="800" text-anchor="middle" filter="url(#heroTextGlow)">
      <tspan fill="#ffffff">আমি </tspan>
      <tspan fill="url(#goldGrad)">আলম —</tspan>
    </text>

    <!-- Subtitle / Tagline: শব্দ আমার ক্যানভাস, গল্প আমার রঙ; লেখার তুলিতে আঁকি ভাবনা।| -->
    <g transform="translate(0, 148)">
      <text x="0" y="0" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="21" font-weight="500" fill="#ffffff" text-anchor="middle" filter="url(#heroTextGlow)">
        শব্দ আমার ক্যানভাস, গল্প আমার রঙ; লেখার তুলিতে আঁকি ভাবনা।<tspan fill="#f59e0b" font-weight="300"> |</tspan>
      </text>
    </g>

    <!-- Description Paragraph (3 Centered Lines) -->
    <g transform="translate(0, 205)" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="16" font-weight="400" fill="#f1f5f9" text-anchor="middle" filter="url(#softShadow)" opacity="0.92">
      <text x="0" y="0">শব্দের একজন লেখক এবং দৈনন্দিন মুহূর্তের মাঝে লুকানো গল্পগুলোর এক অনুসন্ধানী। আমার</text>
      <text x="0" y="26">লেখার মাধ্যমে আমি ক্ষণিকের ভাবনাগুলোকে এমন বাক্যে রূপ দিতে চাই, যা পাঠের অনেক পরেও</text>
      <text x="0" y="52">মনে রয়ে যায়।</text>
    </g>

    <!-- Action Buttons -->
    <g transform="translate(0, 310)">
      <!-- Left Button: সকল লেখা (Primary Blue) -->
      <g transform="translate(-135, 0)">
        <rect x="0" y="0" width="125" height="42" rx="10" fill="url(#btnPrimary)" filter="url(#softShadow)" />
        <text x="62.5" y="26" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="15" font-weight="600" fill="#ffffff" text-anchor="middle">সকল লেখা</text>
      </g>

      <!-- Right Button: আমার পাতা (Dark Outlined) -->
      <g transform="translate(10, 0)">
        <rect x="0" y="0" width="125" height="42" rx="10" fill="rgba(0, 0, 0, 0.45)" stroke="rgba(255, 255, 255, 0.38)" stroke-width="1.2" filter="url(#softShadow)" />
        <text x="62.5" y="26" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="15" font-weight="500" fill="#ffffff" text-anchor="middle">আমার পাতা</text>
      </g>
    </g>
  </g>
</svg>`;
}

