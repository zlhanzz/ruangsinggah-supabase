/**
 * Cloudflare Pages _worker.js — OG Meta Tag Server for Social Media Previews
 * 
 * - Bot (WhatsApp, Facebook, Telegram, dll) akses /kost/:id
 *   → Fetch dari Supabase, return HTML dengan OG tags spesifik per listing
 * - User biasa & semua path lain
 *   → Pass through ke static SPA via env.ASSETS
 */

const SUPABASE_URL = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const BOT_USER_AGENTS = [
  'whatsapp', 'facebookexternalhit', 'facebot', 'twitterbot',
  'telegrambot', 'linkedinbot', 'slackbot', 'discordbot',
  'googlebot', 'bingbot', 'applebot', 'preview', 'crawler',
  'spider', 'scraper', 'opengraph', 'iframely', 'embedly',
  'rogerbot', 'pinterest', 'quora link preview',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(b => ua.includes(b));
}

function formatRupiah(price) {
  if (!price) return '';
  return new Intl.NumberFormat('id-ID').format(price);
}

function getFirstImageUrl(kost) {
  // Kolom aktual di DB: image_urls = [{original: "..."}, ...]
  const imgs = kost.image_urls || kost.imageUrls || [];
  if (!imgs || imgs.length === 0) return 'https://ruangsinggah.id/logo.png';
  const first = imgs[0];
  if (!first) return 'https://ruangsinggah.id/logo.png';
  if (typeof first === 'string') return first;
  // Coba key: original, url, thumbnail
  return first.original || first.url || first.thumbnail || 'https://ruangsinggah.id/logo.png';
}

function buildOgHtml({ kost, kostId }) {
  // Kolom aktual: title (bukan name), property_type/type (bukan gender)
  const name = kost.title || kost.name || 'Kost di Makassar';
  const area = kost.area || kost.city || kost.address?.split(',')[0] || 'Makassar';
  const price = kost.price ? `Rp ${formatRupiah(kost.price)}/bulan` : '';

  // property_type atau type: "Putri", "Putra", "Campur"
  const typeRaw = (kost.property_type || kost.type || '').toLowerCase();
  const genderLabel = typeRaw === 'putri' ? 'Kost Putri'
    : typeRaw === 'putra' ? 'Kost Putra'
    : typeRaw === 'campur' ? 'Kost Campur'
    : 'Kost';

  const campuses = Array.isArray(kost.campuses) ? kost.campuses : [];
  const nearestCampus = campuses[0]?.name || '';
  const campusText = nearestCampus ? ` dekat ${nearestCampus}` : '';

  const facilities = Array.isArray(kost.facilities)
    ? kost.facilities.slice(0, 4).join(', ')
    : '';

  const description = [
    `${genderLabel} di ${area}${campusText}.`,
    price ? `Harga ${price}.` : '',
    facilities ? `Fasilitas: ${facilities}.` : '',
    'Cek detail dan booking di RuangSinggah.id!'
  ].filter(Boolean).join(' ');

  const imageUrl = getFirstImageUrl(kost);
  const pageUrl = `https://ruangsinggah.id/kost/${kostId}`;
  const title = nearestCampus
    ? `${name} - Dekat ${nearestCampus} | RuangSinggah.id`
    : `${name} - ${area} | RuangSinggah.id`;

  const esc = s => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="id_ID">
<meta property="og:site_name" content="RuangSinggah.id">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(imageUrl)}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<a href="${esc(pageUrl)}">Lihat detail kost di RuangSinggah.id</a>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const kostMatch = pathname.match(/^\/kost\/([^/]+)$/);
    const userAgent = request.headers.get('User-Agent') || '';

    if (kostMatch && isBot(userAgent)) {
      const kostId = kostMatch[1];
      try {
        // Gunakan kolom yang sesuai schema DB aktual
        const apiUrl = `${SUPABASE_URL}/rest/v1/properties`
          + `?id=eq.${encodeURIComponent(kostId)}`
          + `&select=id,title,area,city,address,price,property_type,type,facilities,image_urls,campuses`
          + `&limit=1`;

        const res = await fetch(apiUrl, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          const kost = data?.[0];
          if (kost) {
            return new Response(buildOgHtml({ kost, kostId }), {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
              },
            });
          }
        }
      } catch (err) {
        console.error('[OG Worker] Error:', err);
      }
    }

    // User biasa atau error → serve SPA
    return env.ASSETS.fetch(request);
  },
};
