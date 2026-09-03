/**
 * Utility untuk konversi nama properti menjadi URL slug ramah SEO
 * Format: /kost/{nama-kost}-{area/kota}-{uuid}
 */

export function slugifyText(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Ganti karakter beraksen
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Hapus karakter selain huruf, angka, spasi, dan tanda hubung
    .replace(/[^a-z0-9\s-]/g, '')
    // Ganti spasi atau underscore dengan tanda hubung
    .replace(/[\s_]+/g, '-')
    // Hilangkan tanda hubung berulang
    .replace(/-+/g, '-')
    // Trim tanda hubung di awal/akhir
    .replace(/^-+|-+$/g, '');
}

export function createKostSlug(kost: {
  id: string;
  title?: string;
  name?: string;
  namaKost?: string;
  area?: string;
  city?: string;
}): string {
  if (!kost || !kost.id) return '';

  const rawTitle = kost.title || kost.name || kost.namaKost || 'kost';
  const rawLocation = kost.area || kost.city || '';

  const cleanTitle = slugifyText(rawTitle);
  const cleanLocation = slugifyText(rawLocation);

  const prefixParts = [cleanTitle, cleanLocation].filter(Boolean).join('-');
  const finalPrefix = prefixParts || 'kost';

  return `${finalPrefix}-${kost.id}`;
}

const UUID_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function extractKostId(param: string): string {
  if (!param) return '';
  const match = param.match(UUID_REGEX);
  return match ? match[1] : param;
}
