/**
 * Cloudflare Pages Function: /kost/[id]
 * 
 * Intercepts requests to /kost/:id BEFORE the SPA.
 * - Bot (WhatsApp, Facebook, Telegram, dll) → Server-rendered HTML with OG meta tags
 * - User biasa → Serve SPA (index.html) seperti biasa
 * 
 * File ini harus ada di: functions/kost/[id].js
 * (relative ke Cloudflare Pages project root = functions/public/)
 */

const SUPABASE_URL = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

// Daftar User-Agent bot yang perlu server-rendered HTML
const BOT_AGENTS = [
  'whatsapp',
  'facebookexternalhit',
  'twitterbot',
  'telegrambot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'applebot',
  'preview',
  'crawler',
  'spider',
  'scraper'
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some(bot => ua.includes(bot));
}

function formatPrice(price) {
  if (!price) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
}

function buildOGHtml(kost, kostId) {
  const name = kost.name || kost.title || 'Kost di Makassar';
  const area = kost.area || kost.address || 'Makassar';
  const price = kost.price ? `${formatPrice(kost.price)}/bulan` : '';
  const gender = kost.gender === 'putra' ? 'Putra' : kost.gender === 'putri' ? 'Putri' : kost.gender === 'campur' ? 'Campur' : '';
  const genderLabel = gender ? `Kost ${gender}` : 'Kost';

  const campuses = kost.campuses || [];
  const nearestCampus = campuses[0]?.name || '';
  const campusLabel = nearestCampus ? ` dekat ${nearestCampus}` : '';

  const facilities = (kost.facilities || []).slice(0, 4).join(', ');

  const description = [
    `${genderLabel} di ${area}${campusLabel}.`,
    price ? `Harga ${price}.` : '',
    facilities ? `Fasilitas: ${facilities}.` : '',
    'Cek detail dan booking di RuangSinggah.id!'
  ].filter(Boolean).join(' ');

  // Get first image
  let imageUrl = 'https://ruangsinggah.id/logo.png';
  const imgs = kost.imageUrls || kost.image_urls || [];
  if (imgs.length > 0) {
    const first = imgs[0];
    if (typeof first === 'string') imageUrl = first;
    else if (first?.url) imageUrl = first.url;
    else if (first?.thumbnail) imageUrl = first.thumbnail;
  }

  const pageUrl = `https://ruangsinggah.id/kost/${kostId}`;
  const pageTitle = `${name}${campusLabel ? ` - ${nearestCampus}` : ''} | RuangSinggah.id`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${pageUrl}">

  <!-- Open Graph (WhatsApp, Facebook, etc.) -->
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="id_ID">
  <meta property="og:site_name" content="RuangSinggah.id">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Redirect user browser ke SPA (bukan bot) -->
  <script>
    // Hanya redirect jika ini bukan bot (sudah dicek di server, ini fallback)
    window.location.href = "${pageUrl}";
  </script>
</head>
<body>
  <h1>${pageTitle}</h1>
  <p>${description}</p>
  <p><a href="${pageUrl}">Lihat detail kost ini di RuangSinggah.id</a></p>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, params } = context;
  const { id } = params;
  const userAgent = request.headers.get('User-Agent') || '';

  // Jika bukan bot, serve SPA index.html seperti biasa
  if (!isBot(userAgent)) {
    // Fetch index.html dari static assets Cloudflare Pages
    const url = new URL(request.url);
    url.pathname = '/';
    return fetch(new Request(url.toString(), request));
  }

  // Ini bot → fetch kost data dari Supabase dan return HTML dengan OG tags
  try {
    const apiUrl = `${SUPABASE_URL}/rest/v1/properties?id=eq.${encodeURIComponent(id)}&select=id,name,title,area,address,price,gender,facilities,imageUrls,campuses&limit=1`;

    const response = await fetch(apiUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Supabase fetch failed');

    const data = await response.json();
    const kost = data?.[0];

    if (!kost) {
      // Kost tidak ditemukan, fallback ke generic
      return fetch(new Request(new URL('/', request.url).toString(), request));
    }

    const html = buildOGHtml(kost, id);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache 1 jam di CDN
      }
    });

  } catch (err) {
    // Error fallback: serve SPA
    console.error('OG Function error:', err);
    return fetch(new Request(new URL('/', request.url).toString(), request));
  }
}
