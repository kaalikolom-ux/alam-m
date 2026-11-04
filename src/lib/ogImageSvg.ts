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
  domain = 'a.wooniche.com'
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
      return `<text x="85" y="${y}" font-family="Nirmala UI, Noto Sans Bengali, Hind Siliguri, sans-serif" font-size="${titleFontSize}" font-weight="800" fill="#ffffff" filter="url(#textGlow)">${escapeXml(line)}</text>`;
    })
    .join('\n    ');

  const dividerY = contentStartY + titleBlockHeight - 12;
  const subtitleStartY = dividerY + 44;

  const subtitleSvgElements = subtitleLines
    .map((line, idx) => {
      const y = subtitleStartY + (idx * 32);
      return `<text x="85" y="${y}" font-family="Nirmala UI, Noto Sans Bengali, Hind Siliguri, sans-serif" font-size="20" font-weight="400" fill="#cbd5e1">${escapeXml(line)}</text>`;
    })
    .join('\n    ');

  const authorInitials = authorName.replace(/[^অ-হa-zA-Z]/g, '').slice(0, 3) || 'আলম';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Cosmic Obsidian Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811" />
      <stop offset="45%" stop-color="#0a121e" />
      <stop offset="85%" stop-color="#0f1928" />
      <stop offset="100%" stop-color="#070c14" />
    </linearGradient>

    <!-- Warm Golden Radial Core Glow -->
    <radialGradient id="centerGlow" cx="40%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#b88e58" stop-opacity="0.22" />
      <stop offset="45%" stop-color="#916528" stop-opacity="0.09" />
      <stop offset="85%" stop-color="#b88e58" stop-opacity="0.02" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="topAura" cx="85%" cy="15%" r="50%">
      <stop offset="0%" stop-color="#dfb76c" stop-opacity="0.18" />
      <stop offset="50%" stop-color="#b88e58" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Deep Luxury Golden Gradient -->
    <linearGradient id="goldSurface" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ebd08e" />
      <stop offset="25%" stop-color="#dfb76c" />
      <stop offset="65%" stop-color="#b88e58" />
      <stop offset="100%" stop-color="#8a5c20" />
    </linearGradient>

    <!-- Golden Highlight Bevel -->
    <linearGradient id="goldBevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff8e7" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#69410d" stop-opacity="0.4" />
    </linearGradient>

    <!-- Radiant Gold Text Gradient -->
    <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f5e1a4" />
      <stop offset="50%" stop-color="#dfb76c" />
      <stop offset="100%" stop-color="#c99f66" />
    </linearGradient>

    <!-- Glass Pill Gradient -->
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b88e58" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#141c26" stop-opacity="0.65" />
    </linearGradient>

    <!-- Divider Gold Line Gradient -->
    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b88e58" stop-opacity="0" />
      <stop offset="25%" stop-color="#dfb76c" stop-opacity="0.85" />
      <stop offset="50%" stop-color="#f5e1a4" stop-opacity="1" />
      <stop offset="75%" stop-color="#dfb76c" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#b88e58" stop-opacity="0" />
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

  <!-- Subtle Literary Celestial Motifs -->
  <g opacity="0.06" stroke="#dfb76c" stroke-width="1" fill="none">
    <circle cx="1060" cy="180" r="140" stroke-dasharray="4,8" />
    <circle cx="1060" cy="180" r="80" stroke-dasharray="2,6" />
    <polygon points="1060,100 1085,155 1140,180 1085,205 1060,260 1035,205 980,180 1035,155" />
    <line x1="80" y1="315" x2="1120" y2="315" stroke-dasharray="2,14" />
  </g>

  <!-- Elegant Inner Golden Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#b88e58" stroke-opacity="0.32" stroke-width="1.5" />
  <rect x="30" y="30" width="1140" height="570" rx="16" fill="none" stroke="#dfb76c" stroke-opacity="0.12" stroke-width="1" />

  <!-- Luxury Corner Brackets -->
  <g stroke="#dfb76c" stroke-width="2.5" fill="none" opacity="0.85">
    <path d="M 44 64 L 44 44 L 64 44" />
    <circle cx="44" cy="44" r="3" fill="#dfb76c" />
    <path d="M 1156 64 L 1156 44 L 1136 44" />
    <circle cx="1156" cy="44" r="3" fill="#dfb76c" />
    <path d="M 44 566 L 44 586 L 64 586" />
    <circle cx="44" cy="586" r="3" fill="#dfb76c" />
    <path d="M 1156 566 L 1156 586 L 1136 586" />
    <circle cx="1156" cy="586" r="3" fill="#dfb76c" />
  </g>

  <!-- ==================== HEADER ==================== -->
  <g transform="translate(68, 62)">
    <!-- Golden Quill/Nib Logo Square Badge (54x54) -->
    <g filter="url(#shadowBox)">
      <rect width="54" height="54" rx="12" fill="url(#goldSurface)" />
      <rect x="2" y="2" width="50" height="50" rx="10" fill="none" stroke="url(#goldBevel)" stroke-width="1.5" />
      <g transform="translate(13, 11)" fill="#0b0f13">
        <path d="M14 2 C10 10, 5 18, 2 24 C1 26, 3 28, 6 28 L12 28 L14 34 L16 28 L22 28 C25 28, 27 26, 26 24 C23 18, 18 10, 14 2 Z" />
        <circle cx="14" cy="19" r="1.5" fill="#dfb76c" />
        <line x1="14" y1="21" x2="14" y2="34" stroke="#dfb76c" stroke-width="1" />
      </g>
    </g>

    <!-- Brand Typography -->
    <text x="70" y="26" font-family="Nirmala UI, Noto Sans Bengali, Hind Siliguri, sans-serif" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="0.5">আলম এম.</text>
    <text x="71" y="45" font-family="Montserrat, Cinzel, Segoe UI, sans-serif" font-size="11.5" font-weight="700" fill="url(#goldTextGrad)" letter-spacing="3">ALAM M • শব্দ আমার ক্যানভাস</text>
  </g>

  <!-- Category Pill Badge (Top Right) -->
  <g transform="translate(1132, 74)">
    <rect x="-260" y="-18" width="260" height="38" rx="19" fill="url(#glassGrad)" stroke="#b88e58" stroke-width="1.3" />
    <circle cx="-238" cy="1" r="4.5" fill="#dfb76c" />
    <text x="-120" y="6" font-family="Nirmala UI, Noto Sans Bengali, Hind Siliguri, sans-serif" font-size="14" font-weight="700" fill="#f5e1a4" text-anchor="middle">
      ${escapeXml(categoryName)}
    </text>
  </g>

  <!-- ==================== BODY (TITLE + SUBTITLE) ==================== -->
  <g>
    ${titleSvgElements}
  </g>

  <!-- Glowing Gold Divider with Diamond -->
  <g transform="translate(85, ${dividerY})">
    <rect x="0" y="0" width="460" height="2.5" rx="1.25" fill="url(#lineGrad)" />
    <polygon points="18,-4 23,1 18,6 13,1" fill="#f5e1a4" />
  </g>

  <!-- Subtitle / Excerpt -->
  <g>
    ${subtitleSvgElements}
  </g>

  <!-- ==================== FOOTER ==================== -->
  <g transform="translate(85, 550)">
    <!-- Author Avatar Badge -->
    <circle cx="18" cy="0" r="18" fill="url(#goldSurface)" />
    <circle cx="18" cy="0" r="17" fill="none" stroke="url(#goldBevel)" stroke-width="1.2" />
    <text x="18" y="5" font-family="Nirmala UI, Noto Sans Bengali, Hind Siliguri, sans-serif" font-size="12" font-weight="bold" fill="#0b0f13" text-anchor="middle">${escapeXml(authorInitials)}</text>
    
    <text x="48" y="-2" font-family="Nirmala UI, Noto Sans Bengali, Hind Siliguri, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">লেখক: ${escapeXml(authorName)}</text>
    <text x="48" y="16" font-family="Nirmala UI, Noto Sans Bengali, Hind Siliguri, sans-serif" font-size="12" fill="#dfb76c">গল্প, কবিতা ও স্মৃতিকথা</text>
  </g>

  <!-- Domain Badge (Right Footer) -->
  <g transform="translate(1132, 550)">
    <rect x="-260" y="-16" width="260" height="34" rx="17" fill="#090f18" stroke="#b88e58" stroke-opacity="0.45" stroke-width="1.2" />
    <circle cx="-242" cy="1" r="4.5" fill="#10b981" />
    <text x="-120" y="6" font-family="Montserrat, Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#f8fafc" text-anchor="middle" letter-spacing="0.5">
      ${escapeXml(domain)} <tspan fill="#dfb76c">•</tspan> wooniche.com
    </text>
  </g>
</svg>`;
}
