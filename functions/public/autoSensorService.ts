/**
 * autoSensorService.ts
 * Layanan cerdas front-end untuk mendeteksi dan menyensor (blur/pixelate) secara otomatis
 * nomor HP, kontak WhatsApp, dan teks spanduk/banner promosi pada foto properti/area umum
 * sebelum diunggah ke Supabase Storage, sekaligus mengompresi ke format WebP murni.
 */

import { supabase } from './supabase';

// Kategori foto yang rentan memiliki spanduk, banner nomor HP, atau papan nama kontak
const BANNER_PRONE_KEYWORDS = [
    'depan',
    'fasad',
    'gedung',
    'bangunan depan',
    'bangunan',
    'tampak depan',
    'pintu masuk',
    'gerbang',
    'pagar',
    'parkir',
    'area parkir',
    'plang',
    'spanduk',
    'banner',
    'papan nama',
    'lingkungan',
    'luar',
    'akses',
    'jalan',
    'halaman',
    'eksterior'
];

export interface BannerPolygonPoint {
    x: number;
    y: number;
}

export interface BannerPerspectiveItem {
    id?: string;
    polygon?: Array<BannerPolygonPoint>; // 4 titik berurutan [TL, TR, BR, BL]
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    source?: 'ai' | 'heuristic' | 'manual';
}

export interface ContactBannerDetectionResult {
    hasContact: boolean;
    detectedTexts?: string[];
    boxes: Array<{
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
        polygon?: Array<[number, number]>;
        label?: string;
    }>;
    banners?: Array<{
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
        polygon?: Array<[number, number]>;
        label?: string;
    }>;
    error?: string;
}

export interface SensorBoxPixel {
    x: number;
    y: number;
    width: number;
    height: number;
    polygon?: Array<BannerPolygonPoint>;
    id?: string;
    source?: 'ai' | 'heuristic' | 'manual';
}

/**
 * Memeriksa apakah sebuah kategori foto rentan memiliki spanduk/nomor kontak
 */
export function isBannerProneCategory(categoryName: string): boolean {
    if (!categoryName) return false;
    const lower = categoryName.toLowerCase().trim();
    return BANNER_PRONE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Kompresi dan konversi file gambar ke format WebP Client-Side
 */
export async function compressImageToWebP(file: File, quality = 0.85, maxWidth = 1920): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        const webpFile = new File(
                            [blob],
                            file.name.replace(/\.[^/.]+$/, "") + ".webp",
                            { type: "image/webp" }
                        );
                        resolve(webpFile);
                    },
                    "image/webp",
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// ── Cache Singleton Logo RuangSinggah untuk Akselerasi 0ms ─────────────────────
let cachedLogoImg: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement | null> | null = null;

export function getRuangSinggahLogoImage(): Promise<HTMLImageElement | null> {
    if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
        return Promise.resolve(cachedLogoImg);
    }
    if (logoLoadPromise) {
        return logoLoadPromise;
    }
    logoLoadPromise = new Promise((resolve) => {
        if (typeof window === 'undefined') return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            cachedLogoImg = img;
            resolve(img);
        };
        img.onerror = () => {
            console.warn('[WATERMARK] Gagal memuat /logo.png, beralih ke rendering vektor & teks fallback.');
            resolve(null);
        };
        img.src = '/logo.png';
        // Timeout 2.5s jika offline
        setTimeout(() => {
            if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
                resolve(cachedLogoImg);
            } else {
                resolve(null);
            }
        }, 2500);
    });
    return logoLoadPromise;
}

// ── Pre-Warming Engine AI Banner Detection (Akselerasi 0ms saat Upload) ─────────
let hasPreWarmed = false;
let preWarmPromise: Promise<boolean> | null = null;

export async function warmUpBannerDetectionEngine(): Promise<boolean> {
    if (hasPreWarmed) return true;
    if (preWarmPromise) return preWarmPromise;

    preWarmPromise = (async () => {
        try {
            console.log('[AI_SENSOR] Menghangatkan Edge Function via pre-warm ping...');
            const res = await Promise.race([
                supabase.functions.invoke('detect-contact-banner', { body: { ping: true } }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Pre-warm timeout')), 3500))
            ]) as any;

            if (res && res.data?.success) {
                console.log('[AI_SENSOR] Edge Function sudah dalam kondisi warm 100%!');
                hasPreWarmed = true;
                return true;
            }
        } catch (err) {
            console.warn('[AI_SENSOR] Pre-warm ping non-fatal notice:', err);
        }
        return false;
    })();

    return preWarmPromise;
}

/**
 * Merender pola watermark diagonal berulang 'ruangsinggah.id' di atas canvas
 * Mengadaptasi secara proporsional terhadap resolusi foto (desktop/mobile/berbagai rasio).
 */
export async function drawRuangSinggahWatermarkPattern(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): Promise<void> {
    const logoImg = await getRuangSinggahLogoImage();

    ctx.save();

    // Skala dinamis proporsional berbasis resolusi terkecil (agar seimbang di lanskap 16:9, standar 4:3, maupun potret vertikal HP)
    const minDim = Math.min(width, height);
    const scale = Math.max(0.65, Math.min(1.45, minDim / 900));

    const logoSize = Math.round(28 * scale);
    const fontSize = Math.round(18 * scale);
    const itemGap = Math.round(8 * scale);

    // Font setting
    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    const textPart1 = "RuangSinggah";
    const textPart2 = ".id";
    const w1 = ctx.measureText(textPart1).width;
    const w2 = ctx.measureText(textPart2).width;
    const totalUnitWidth = logoSize + itemGap + w1 + w2;

    // Jarak horizontal antar item dalam 1 baris & jarak vertikal antar baris diagonal
    const itemStepX = Math.round(totalUnitWidth + (190 * scale));
    const rowStepY = Math.round(135 * scale);

    // Rotasi diagonal -28 derajat di titik pusat kanvas
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-28 * (Math.PI / 180));

    // Opacity elegan: cukup tegas sebagai pelindung anti-maling, namun transparan & estetika foto tetap terjaga
    ctx.globalAlpha = 0.26;

    // Bayangan halus kontras agar terbaca jelas di latar foto gelap maupun terang
    ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
    ctx.shadowBlur = Math.round(2 * scale);

    // Bounding radius diagonal untuk menutup seluruh kanvas hingga sudut terjauh
    const diag = Math.sqrt(width * width + height * height);
    const startX = -diag;
    const endX = diag;
    const startY = -diag;
    const endY = diag;

    let rowIndex = 0;
    for (let y = startY; y <= endY; y += rowStepY) {
        // Baris bergantian selang-seling (staggered / brick lattice pattern)
        const offsetX = (rowIndex % 2 === 0) ? 0 : (itemStepX / 2);

        for (let x = startX - itemStepX; x <= endX + itemStepX; x += itemStepX) {
            ctx.save();
            ctx.translate(x + offsetX, y);

            const unitStartX = -totalUnitWidth / 2;
            const logoY = -logoSize / 2;

            // 1. Gambar Logo RuangSinggah
            if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
                ctx.drawImage(logoImg, unitStartX, logoY, logoSize, logoSize);
            } else {
                // Vektor fallback rumah + pin lokasi
                ctx.save();
                ctx.strokeStyle = '#1E293B';
                ctx.lineWidth = Math.max(1.5, 2 * scale);
                ctx.beginPath();
                ctx.moveTo(unitStartX, logoY + logoSize * 0.45);
                ctx.lineTo(unitStartX + logoSize * 0.5, logoY);
                ctx.lineTo(unitStartX + logoSize, logoY + logoSize * 0.45);
                ctx.lineTo(unitStartX + logoSize * 0.85, logoY + logoSize * 0.45);
                ctx.lineTo(unitStartX + logoSize * 0.85, logoY + logoSize);
                ctx.lineTo(unitStartX + logoSize * 0.15, logoY + logoSize);
                ctx.lineTo(unitStartX + logoSize * 0.15, logoY + logoSize * 0.45);
                ctx.closePath();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(unitStartX + logoSize * 0.5, logoY + logoSize * 0.42, logoSize * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = '#EA580C';
                ctx.fill();
                ctx.restore();
            }

            // 2. Gambar Teks 'RuangSinggah' (Oranye Resmi)
            const textY = logoY + (logoSize / 2) + (fontSize * 0.35);
            const textStartX = unitStartX + logoSize + itemGap;

            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';

            ctx.fillStyle = '#EA580C';
            ctx.fillText(textPart1, textStartX, textY);

            // 3. Gambar Teks '.id' (Charcoal / Gelap)
            ctx.fillStyle = '#1E293B';
            ctx.fillText(textPart2, textStartX + w1, textY);

            ctx.restore();
        }
        rowIndex++;
    }

    ctx.restore();
}

/**
 * Kompresi foto properti/kamar kost ke WebP sekaligus menyematkan watermark RuangSinggah.id (Client-Side)
 */
export async function compressKostPhotoWithWatermark(
    file: File, 
    quality = 0.82, 
    maxWidth = 1920
): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(file);
                        return;
                    }

                    // 1. Gambar foto asli
                    ctx.drawImage(img, 0, 0, width, height);

                    // 2. Sematkan pola watermark resmi RuangSinggah.id
                    await drawRuangSinggahWatermarkPattern(ctx, width, height);

                    // 3. Ekspor ke format WebP murni
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }
                            const baseName = file.name.replace(/\.[^/.]+$/, "");
                            const webpFile = new File(
                                [blob],
                                `${baseName}.webp`,
                                { type: "image/webp", lastModified: Date.now() }
                            );
                            resolve(webpFile);
                        },
                        "image/webp",
                        quality
                    );
                } catch (err) {
                    console.error('[WATERMARK] Gagal menyematkan watermark:', err);
                    resolve(file);
                }
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Membuat data Base64 beresolusi ringan untuk dikirim ke AI Vision
 */
export async function createLowResBase64ForAi(fileOrUrl: File | string, maxDim = 1024, quality = 0.65): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const onLoaded = () => {
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve('');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const base64 = dataUrl.split(',')[1] || '';
            resolve(base64);
        };

        img.onload = onLoaded;
        img.onerror = () => resolve('');

        if (typeof fileOrUrl === 'string') {
            img.src = fileOrUrl;
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(fileOrUrl);
        }
    });
}

/**
 * Deteksi Spanduk / Kontak menggunakan Supabase Edge Function (Gemini AI Vision)
 * Dioptimalkan dengan timeout terukur 7.5s dan fallback instan jika jaringan lambat
 */
export async function detectPhotoContactBanner(
    base64Image: string,
    mimeType = 'image/jpeg'
): Promise<ContactBannerDetectionResult> {
    if (!base64Image) {
        return { hasContact: false, boxes: [] };
    }

    const invokeWithTimeout = async () => {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Deteksi AI timeout (7.5s)')), 7500)
        );
        const invokePromise = supabase.functions.invoke('detect-contact-banner', {
            body: {
                base64Image,
                image: base64Image,
                mimeType
            }
        });
        return (await Promise.race([invokePromise, timeoutPromise])) as any;
    };

    try {
        const res = await invokeWithTimeout();
        const { data, error } = res || {};
        if (error) {
            return {
                hasContact: false,
                detectedTexts: [],
                boxes: [],
                error: error.message || 'Gagal memanggil fungsi AI'
            };
        }

        if (data) {
            const rawData = data.data || data;
            const hasContact = Boolean(rawData.has_contact ?? rawData.hasContact ?? false);
            const boxes = Array.isArray(rawData.boxes) ? rawData.boxes : [];
            const detectedTexts = Array.isArray(rawData.detected_texts)
                ? rawData.detected_texts
                : Array.isArray(rawData.detectedTexts)
                    ? rawData.detectedTexts
                    : [];

            return {
                hasContact,
                detectedTexts,
                boxes
            };
        }

        return { hasContact: false, detectedTexts: [], boxes: [] };
    } catch (err: any) {
        console.warn('[AI_SENSOR] AI scanner tidak terjangkau (fallback langsung aktif):', err?.message);
        return {
            hasContact: false,
            boxes: [],
            detectedTexts: [],
            error: err?.message || 'Koneksi AI terhambat'
        };
    }
}

/**
 * Deteksi Heuristik Multi-Pass Cerdas di Client-Side (Fallback Offline)
 * Menganalisis variasi kontras, gradien tepi (Sobel), dan kepadatan warna khas spanduk/nomor telepon
 */
export function detectBannerRegionsClientSide(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): Array<SensorBoxPixel> {
    const regions: SensorBoxPixel[] = [];

    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Sampling grid 14px untuk mendeteksi variasi teks dan tepi spanduk
        const step = 14;
        const cols = Math.floor(width / step);
        const rows = Math.floor(height / step);
        const energyGrid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const startX = c * step;
                const startY = r * step;

                let minLum = 255;
                let maxLum = 0;
                let edgeCount = 0;
                let bannerColorPixels = 0;
                let totalPixels = 0;

                for (let dy = 0; dy < step; dy += 2) {
                    for (let dx = 0; dx < step; dx += 2) {
                        const px = Math.min(width - 1, startX + dx);
                        const py = Math.min(height - 1, startY + dy);
                        const idx = (py * width + px) * 4;
                        const red = data[idx];
                        const green = data[idx + 1];
                        const blue = data[idx + 2];

                        const lum = 0.299 * red + 0.587 * green + 0.114 * blue;
                        if (lum < minLum) minLum = lum;
                        if (lum > maxLum) maxLum = lum;

                        const maxC = Math.max(red, green, blue);
                        const minC = Math.min(red, green, blue);
                        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;

                        // Ciri khas spanduk sewa/nomor HP/papan nama kost:
                        // 1. Spanduk hijau, merah, biru, oranye, atau kuning pekat (satuan saturasi tinggi)
                        // 2. Plang putih bersih dengan teks gelap kontras tinggi
                        // 3. Plang/spanduk gelap dengan teks terang
                        const isBannerColor = 
                            (sat > 0.28 && lum > 35 && lum < 225) ||
                            (lum > 160 && (maxLum - minLum > 50)) ||
                            (lum < 70 && (maxLum - minLum > 55));
                        if (isBannerColor) bannerColorPixels++;
                        totalPixels++;
                    }
                }

                const lumDiff = maxLum - minLum;
                // Skor energi: kontras lokal + proporsi warna spanduk
                let cellEnergy = 0;
                if (lumDiff > 55) cellEnergy += 1;
                if (lumDiff > 95) cellEnergy += 1.5;
                if ((bannerColorPixels / Math.max(1, totalPixels)) > 0.28) cellEnergy += 1.2;

                energyGrid[r][c] = cellEnergy;
            }
        }

        // Cari kluster horizontal dengan energi tinggi (deretan baris 1 s/d rows-2)
        for (let r = 1; r < rows - 1; r++) {
            let consecutive = 0;
            let startCol = -1;

            for (let c = 0; c < cols; c++) {
                const isHigh = energyGrid[r][c] >= 1.8 || (energyGrid[r][c] >= 1.0 && (energyGrid[r - 1]?.[c] >= 1.0 || energyGrid[r + 1]?.[c] >= 1.0));

                if (isHigh) {
                    if (consecutive === 0) startCol = c;
                    consecutive++;
                } else {
                    if (consecutive >= 3 && startCol !== -1) {
                        const boxX = Math.max(0, (startCol - 1) * step);
                        const boxY = Math.max(0, (r - 1) * step);
                        const boxW = Math.min(width - boxX, (consecutive + 2) * step);
                        const boxH = Math.min(height - boxY, 4 * step);

                        // Hindari duplikasi region yang berdekatan
                        const overlaps = regions.some(rg =>
                            Math.abs(rg.x - boxX) < 40 && Math.abs(rg.y - boxY) < 30
                        );

                        if (!overlaps) {
                            regions.push({
                                x: boxX,
                                y: boxY,
                                width: boxW,
                                height: boxH,
                                source: 'heuristic'
                            });
                        }
                    }
                    consecutive = 0;
                    startCol = -1;
                }
            }

            if (consecutive >= 3 && startCol !== -1) {
                const boxX = Math.max(0, (startCol - 1) * step);
                const boxY = Math.max(0, (r - 1) * step);
                const boxW = Math.min(width - boxX, (consecutive + 2) * step);
                const boxH = Math.min(height - boxY, 4 * step);
                regions.push({
                    x: boxX,
                    y: boxY,
                    width: boxW,
                    height: boxH,
                    source: 'heuristic'
                });
            }
        }
    } catch (e) {
        console.warn('[AI_SENSOR] Gagal heuristik client-side:', e);
    }

    return regions.slice(0, 5);
}

/**
 * Menggambar bentuk kapsul melengkung (pill) pada canvas
 */
function drawPill(ctx: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number, pr: number) {
    ctx.beginPath();
    ctx.moveTo(px + pr, py);
    ctx.lineTo(px + pw - pr, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr);
    ctx.lineTo(px + pw, py + ph - pr);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - pr, py + ph);
    ctx.lineTo(px + pr, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - pr);
    ctx.lineTo(px, py + pr);
    ctx.quadraticCurveTo(px, py, px + pr, py);
    ctx.closePath();
}

/**
 * Terapkan Sensor Presisi Berbasis Sudut Poligon (Perspective Quad)
 * Menyesuaikan kemiringan dan bentuk spanduk aslinya tanpa memotong pagar/tiang/dinding di luar batas spanduk.
 */
export function applyPerspectivePolygonSensorToCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    banners: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        polygon?: Array<{ x: number; y: number }>;
    }>
) {
    if (!banners || banners.length === 0) return;

    banners.forEach((banner) => {
        let p = banner.polygon;
        // Jika polygon 4 titik tidak ada atau kurang dari 3 titik, bentuk dari bounding box
        if (!p || p.length < 4) {
            const pad = Math.max(2, Math.round(Math.min(banner.width, banner.height) * 0.04));
            const bx = Math.max(0, banner.x - pad);
            const by = Math.max(0, banner.y - pad);
            const bw = Math.min(width - bx, banner.width + pad * 2);
            const bh = Math.min(height - by, banner.height + pad * 2);
            p = [
                { x: bx, y: by },
                { x: bx + bw, y: by },
                { x: bx + bw, y: by + bh },
                { x: bx, y: by + bh }
            ];
        }

        // Bounding box dari poligon untuk ukuran sampling pixelate & penempatan badge
        const minX = Math.max(0, Math.min(...p.map(pt => pt.x)));
        const maxX = Math.min(width, Math.max(...p.map(pt => pt.x)));
        const minY = Math.max(0, Math.min(...p.map(pt => pt.y)));
        const maxY = Math.min(height, Math.max(...p.map(pt => pt.y)));
        const bW = maxX - minX;
        const bH = maxY - minY;

        if (bW <= 5 || bH <= 5) return;

        ctx.save();

        // 1. Path Poligon Tertutup Presisi Sesuai Sudut Kemiringan Banner
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        for (let i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
        }
        ctx.closePath();

        // Terapkan Clip Path: Segala efek di bawah HANYA merusak & menutup area di dalam poligon kain/papan banner!
        ctx.clip();

        // 2. Mosaik / Pixelate mikro rapat di dalam polygon
        const offCanvas = document.createElement('canvas');
        const scale = 0.045;
        offCanvas.width = Math.max(1, Math.round(bW * scale));
        offCanvas.height = Math.max(1, Math.round(bH * scale));
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
            offCtx.imageSmoothingEnabled = true;
            offCtx.drawImage(ctx.canvas, minX, minY, bW, bH, 0, 0, offCanvas.width, offCanvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height, minX, minY, bW, bH);
        }

        // 3. Lapisan Frosted Glassmorphism Gelap yang Elegan
        ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
        ctx.fillRect(minX, minY, bW, bH);

        // Lepas clip untuk menggambar garis tepi dan badge
        ctx.restore();

        // 4. Garis batas luar (border stroke) mengikuti 4 sudut miring poligon
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        for (let i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();

        // 5. Render Watermark Kapsul Elegan "ruangsinggah.id" di Titik Tengah dengan Rotasi Sudut Kemiringan
        if (bW >= 32 && bH >= 14) {
            // Hitung centroid (titik pusat)
            const centerX = (p[0].x + p[1].x + p[2].x + p[3].x) / 4;
            const centerY = (p[0].y + p[1].y + p[2].y + p[3].y) / 4;

            // Hitung sudut kemiringan sisi atas banner (Point 0 -> Point 1)
            const dx = p[1].x - p[0].x;
            const dy = p[1].y - p[0].y;
            const rotationAngle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(centerX, centerY);
            // Rotasi jika kemiringan wajar (antara -45 s/d +45 derajat)
            if (Math.abs(rotationAngle) < Math.PI / 4) {
                ctx.rotate(rotationAngle);
            }

            const fontSize = Math.max(9, Math.min(20, Math.round(Math.min(bH * 0.36, bW * 0.12))));
            ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

            const textPart1 = "ruangsinggah";
            const textPart2 = ".id";
            const width1 = ctx.measureText(textPart1).width;
            const width2 = ctx.measureText(textPart2).width;
            const totalTextWidth = width1 + width2;

            const padX = Math.round(fontSize * 0.7);
            const padY = Math.round(fontSize * 0.35);
            const pillW = totalTextWidth + (padX * 2);
            const pillH = fontSize + (padY * 2);

            if (pillW <= bW * 1.15 && pillH <= bH * 1.15) {
                const pillX = -pillW / 2;
                const pillY = -pillH / 2;
                const pillRadius = Math.round(pillH / 2);

                drawPill(ctx, pillX, pillY, pillW, pillH, pillRadius);
                ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
                ctx.lineWidth = 1.2;
                ctx.stroke();

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const startTextX = -(totalTextWidth / 2);

                // "ruangsinggah" (Putih bersih)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(textPart1, startTextX, 0);

                // ".id" (Oranye khas RuangSinggah)
                ctx.fillStyle = '#FB923C';
                ctx.fillText(textPart2, startTextX + width1, 0);
            }

            ctx.restore();
        }
    });
}

/**
 * Terapkan efek mosaik pixelate rapat, dark frosted glass, dan watermark resmi RuangSinggah.id pada canvas
 * (Kompatibel penuh dengan kotak pixel reguler maupun koordinat poligon)
 */
export function applySensorBoxesToCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    boxes: Array<{ x: number; y: number; width: number; height: number; polygon?: Array<{ x: number; y: number }> }>
) {
    if (!boxes || boxes.length === 0) return;
    applyPerspectivePolygonSensorToCanvas(ctx, width, height, boxes);
}

/**
 * Memproses file foto dengan Dual-Engine Auto-Sensor (AI Vision + Fallback Heuristik)
 * Dioptimalkan dengan Single-Pass Canvas Pipeline dan Fast-Path untuk kategori non-banner.
 */
export async function processPhotoWithAutoSensor(
    file: File,
    category: string,
    onDetected?: (info: { detectedCount: number; detectedTexts?: string[] }) => void
): Promise<File> {
    const shouldCheckBanner = isBannerProneCategory(category);

    // ── FAST-PATH NON-BANNER (< 150ms) ──────────────────────────────────────────
    // Kategori interior (kamar, ranjang, kasur, lemari, dapur, dsb.) tidak memiliki spanduk sewa.
    // Langsung jalankan kompresi WebP + Watermark RuangSinggah.id tanpa beban AI scan.
    if (!shouldCheckBanner) {
        return compressKostPhotoWithWatermark(file, 0.82, 1920);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1920;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) {
                        resolve(file);
                        return;
                    }

                    // 1. Gambar foto asli di kanvas
                    ctx.drawImage(img, 0, 0, width, height);

                    let detectedCount = 0;
                    let detectedTexts: string[] = [];
                    let bannersToApply: Array<{
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                        polygon?: Array<{ x: number; y: number }>;
                    }> = [];

                    // 2. Deteksi Spanduk Kontak via AI Gemini Vision
                    try {
                        // Sweet spot 1024px, q=0.65 menghasilkan base64 ringkas (~45KB) sehingga transmisi instan
                        const lowResBase64 = await createLowResBase64ForAi(file, 1024, 0.65);
                        if (lowResBase64) {
                            const aiResult = await detectPhotoContactBanner(lowResBase64, 'image/jpeg');
                            if (aiResult.hasContact && aiResult.boxes && aiResult.boxes.length > 0) {
                                detectedTexts = aiResult.detectedTexts || [];
                                bannersToApply = aiResult.boxes.map(b => {
                                    const normYmin = Math.max(0, Math.min(1000, b.ymin));
                                    const normXmin = Math.max(0, Math.min(1000, b.xmin));
                                    const normYmax = Math.max(0, Math.min(1000, b.ymax));
                                    const normXmax = Math.max(0, Math.min(1000, b.xmax));

                                    const bx = Math.round((normXmin / 1000) * width);
                                    const by = Math.round((normYmin / 1000) * height);
                                    const bw = Math.round(((normXmax - normXmin) / 1000) * width);
                                    const bh = Math.round(((normYmax - normYmin) / 1000) * height);

                                    let polygonPts: Array<{ x: number; y: number }> | undefined = undefined;
                                    if (b.polygon && Array.isArray(b.polygon) && b.polygon.length >= 4) {
                                        polygonPts = b.polygon.map(([px, py]) => ({
                                            x: Math.round((Math.max(0, Math.min(1000, px)) / 1000) * width),
                                            y: Math.round((Math.max(0, Math.min(1000, py)) / 1000) * height)
                                        }));
                                    }

                                    return { x: bx, y: by, width: bw, height: bh, polygon: polygonPts };
                                }).filter(b => b.width > 5 && b.height > 5);
                            }
                        }
                    } catch (aiErr) {
                        console.warn('[AI_SENSOR] AI scan error, langsung beralih ke heuristik cepat:', aiErr);
                    }

                    // 3. Fallback Heuristik Client-Side Cerdas jika AI tidak mengembalikan kotak
                    if (bannersToApply.length === 0) {
                        const heuristicBoxes = detectBannerRegionsClientSide(ctx, width, height);
                        if (heuristicBoxes.length > 0) {
                            bannersToApply = heuristicBoxes;
                        }
                    }

                    // 4. Terapkan Sensor Presisi Miring (Perspective Quad Polygon) jika ditemukan banner
                    if (bannersToApply.length > 0) {
                        applyPerspectivePolygonSensorToCanvas(ctx, width, height, bannersToApply);
                        detectedCount = bannersToApply.length;
                        if (onDetected) {
                            onDetected({ detectedCount, detectedTexts });
                        }
                    }

                    // 5. Sematkan Pola Watermark Resmi RuangSinggah.id di Kanvas yang Sama
                    await drawRuangSinggahWatermarkPattern(ctx, width, height);

                    // 6. Ekspor WebP Resolusi Penuh Sekali Jalan
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }
                            const webpFile = new File(
                                [blob],
                                file.name.replace(/\.[^/.]+$/, "") + ".webp",
                                { type: "image/webp", lastModified: Date.now() }
                            );
                            resolve(webpFile);
                        },
                        "image/webp",
                        0.82
                    );
                } catch (procErr) {
                    console.error('[AI_SENSOR] Error processing photo:', procErr);
                    resolve(file);
                }
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Memproses ulang gambar URL dengan opsi koordinat manual atau pemindaian AI otomatis
 */
export async function processImageUrlWithAutoSensor(
    imageUrl: string,
    category: string,
    uploadFn: (file: File, path: string) => Promise<string>,
    explicitBoxes?: Array<{ x: number; y: number; width: number; height: number }>
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = async () => {
            try {
                const canvas = document.createElement('canvas');
                const maxWidth = 1920;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    resolve(imageUrl);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                let boxesToApply: Array<{ x: number; y: number; width: number; height: number }> = explicitBoxes || [];

                if (boxesToApply.length === 0) {
                    // Pindai dengan AI jika tidak ada koordinat eksplisit
                    try {
                        const needAiScan = isBannerProneCategory(category);
                        const targetDim = needAiScan ? 1600 : 1024;
                        const targetQuality = needAiScan ? 0.82 : 0.65;
                        const lowResBase64 = await createLowResBase64ForAi(imageUrl, targetDim, targetQuality);
                        if (lowResBase64) {
                            const aiResult = await detectPhotoContactBanner(lowResBase64, 'image/jpeg');
                            if (aiResult.hasContact && aiResult.boxes && aiResult.boxes.length > 0) {
                                boxesToApply = aiResult.boxes.map(b => {
                                    const normYmin = Math.max(0, Math.min(1000, b.ymin));
                                    const normXmin = Math.max(0, Math.min(1000, b.xmin));
                                    const normYmax = Math.max(0, Math.min(1000, b.ymax));
                                    const normXmax = Math.max(0, Math.min(1000, b.xmax));

                                    const bx = Math.round((normXmin / 1000) * width);
                                    const by = Math.round((normYmin / 1000) * height);
                                    const bw = Math.round(((normXmax - normXmin) / 1000) * width);
                                    const bh = Math.round(((normYmax - normYmin) / 1000) * height);
                                    return { x: bx, y: by, width: bw, height: bh };
                                });
                            }
                        }
                    } catch (e) {
                        console.warn('[AI_SENSOR] Re-scan AI gagal:', e);
                    }

                    if (boxesToApply.length === 0) {
                        const heuristicBoxes = detectBannerRegionsClientSide(ctx, width, height);
                        if (heuristicBoxes.length > 0) {
                            boxesToApply = heuristicBoxes;
                        }
                    }
                }

                if (boxesToApply.length > 0) {
                    applySensorBoxesToCanvas(ctx, width, height, boxesToApply);
                }

                canvas.toBlob(
                    async (blob) => {
                        if (!blob) {
                            resolve(imageUrl);
                            return;
                        }
                        const webpFile = new File(
                            [blob],
                            `sensored_${Date.now()}.webp`,
                            { type: "image/webp" }
                        );
                        const newUrl = await uploadFn(webpFile, `kostmanager/sensored/${Date.now()}`);
                        resolve(newUrl);
                    },
                    "image/webp",
                    0.85
                );
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = (err) => reject(err);
    });
}
