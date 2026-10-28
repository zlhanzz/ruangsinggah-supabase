/**
 * autoSensorService.ts
 * Layanan cerdas front-end untuk mendeteksi dan menyensor (blur/pixelate) secara otomatis
 * nomor HP, kontak WhatsApp, dan teks spanduk/banner promosi pada foto properti/area umum
 * sebelum diunggah ke Supabase Storage, sekaligus mengompresi ke format WebP murni.
 */

import { supabase } from './supabase';

// Kategori Baku Fasilitas Publik yang WAJIB dan KAKU disensor oleh AI Vision
export const FIXED_BANNER_PRONE_CATEGORIES = new Set([
    'Bangunan Depan',
    'Koridor',
    'Area Parkir',
    'Lingkungan'
]);

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
    'akses masuk',
    'koridor',
    'lorong',
    'gang',
    'tangga',
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

// Kata kunci interior kamar tidur/kamar mandi yang 100% bebas dari spanduk sewa properti
const INTERIOR_ROOM_KEYWORDS = [
    'kamar tidur',
    'ranjang',
    'kasur',
    'bed',
    'meja',
    'lemari',
    'wardrobe',
    'jendela',
    'kamar mandi',
    'toilet',
    'wc',
    'shower',
    'dapur dalam',
    'colokan',
    'ac',
    'cermin',
    'wastafel',
    'sprei'
];

/**
 * Memeriksa apakah sebuah kategori foto rentan memiliki spanduk/nomor kontak
 * Dioptimalkan untuk menghemat kuota AI hingga 80% dengan membedakan eksterior vs interior.
 * @param categoryName Nama kategori foto
 * @param isCustom Apakah kategori ini dibuat secara custom oleh mitra
 */
export function isBannerProneCategory(categoryName: string, isCustom = false): boolean {
    if (!categoryName) return false;
    const trimmed = categoryName.trim();
    const lower = trimmed.toLowerCase();

    // 1. Cek kecocokan kaku dengan ID kategori baku fasilitas publik eksterior
    if (FIXED_BANNER_PRONE_CATEGORIES.has(trimmed)) return true;

    // 2. Jika nama kategori mengandung kata kunci eksterior/spanduk (depan, gerbang, pagar, fasad, plang, spanduk, luar),
    // selalu wajib scan AI
    if (BANNER_PRONE_KEYWORDS.some(kw => lower.includes(kw))) {
        return true;
    }

    // 3. Jika ini adalah kategori kamar interior / sub-kategori kustom unit kamar
    // (misal: "Kamar Tidur Utama", "Kamar Mandi Dalam", "Tipe Deluxe - Meja Belajar", "Tipe A - Lemari"),
    // kecualikan langsung dari AI scan untuk menghemat kuota
    if (
        lower.startsWith('kamar:') ||
        lower.startsWith('kamar mandi:') ||
        lower.startsWith('dapur dalam:') ||
        INTERIOR_ROOM_KEYWORDS.some(kw => lower.includes(kw))
    ) {
        return false;
    }

    // 4. Kategori custom umum/publik lainnya (seperti "Rooftop", "Balkon", "Taman") tetap di-scan
    if (isCustom) return true;

    return false;
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
 * Resolusi 800px q=0.55 menghasilkan base64 ringkas (~25-35KB) sehingga transmisi super cepat
 */
export async function createLowResBase64ForAi(fileOrUrl: File | string, maxDim = 800, quality = 0.55): Promise<string> {
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
 * Dioptimalkan dengan timeout terukur 20s dan fallback instan jika jaringan lambat
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
            setTimeout(() => reject(new Error('Deteksi AI timeout (20s)')), 20000)
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
            // Jika edge function mengembalikan success: false atau ada pesan error AI
            if (data.success === false || data.error) {
                console.warn('[AI_SENSOR] Edge Function AI mengembalikan kegagalan/kuota habis:', data.error);
                return {
                    hasContact: false,
                    detectedTexts: [],
                    boxes: [],
                    error: data.error || 'Pemindaian AI tidak tersedia'
                };
            }

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

    // Batas geometris keras: spanduk sewa/plang kontak di dunia nyata
    // tidak pernah menutupi sebagian besar foto rumah.
    const MAX_ALLOWED_W = Math.round(width * 0.38);
    const MAX_ALLOWED_H = Math.round(height * 0.28);
    const MAX_ALLOWED_AREA = Math.round((width * height) * 0.08);

    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Sampling grid 16px
        const step = 16;
        const cols = Math.floor(width / step);
        const rows = Math.floor(height / step);
        const energyGrid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const startX = c * step;
                const startY = r * step;

                let minLum = 255;
                let maxLum = 0;
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

                        // Ciri khas spanduk sewa/nomor HP/plang kost:
                        // 1. Spanduk kain dengan warna solid jenuh tinggi (merah, kuning, oranye, biru, hijau)
                        // 2. Plang/kertas putih kontras tinggi dengan teks gelap pekat
                        // 3. Plang gelap kontras tinggi dengan teks putih/kuning terang
                        const isBannerColor = 
                            (sat > 0.35 && lum > 35 && lum < 220) ||
                            (lum > 165 && (maxLum - minLum > 65)) ||
                            (lum < 65 && (maxLum - minLum > 65));
                        if (isBannerColor) bannerColorPixels++;
                        totalPixels++;
                    }
                }

                const lumDiff = maxLum - minLum;
                let cellEnergy = 0;
                // Hanya berikan skor energi jika ada kontras teks kuat atau warna jenuh tinggi
                if (lumDiff > 60) cellEnergy += 1;
                if (lumDiff > 100) cellEnergy += 1.5;
                if ((bannerColorPixels / Math.max(1, totalPixels)) > 0.35) cellEnergy += 1.5;

                energyGrid[r][c] = cellEnergy;
            }
        }

        // Cari segmen horizontal pada tiap baris
        const candidateSegments: Array<{ r: number; startCol: number; endCol: number; avgEnergy: number }> = [];
        for (let r = 1; r < rows - 1; r++) {
            let consecutive = 0;
            let startCol = -1;
            let sumEnergy = 0;

            for (let c = 0; c < cols; c++) {
                // Sel harus memiliki energi signifikan (>= 2.0)
                const isHigh = energyGrid[r][c] >= 2.0;

                if (isHigh) {
                    if (consecutive === 0) startCol = c;
                    consecutive++;
                    sumEnergy += energyGrid[r][c];
                } else {
                    // Lebar segmen minimal 3 sel (48px) dan maksimal tidak melebihi MAX_ALLOWED_W
                    if (consecutive >= 3 && startCol !== -1) {
                        const segW = (consecutive + 1) * step;
                        if (segW <= MAX_ALLOWED_W) {
                            candidateSegments.push({
                                r,
                                startCol,
                                endCol: startCol + consecutive,
                                avgEnergy: sumEnergy / consecutive
                            });
                        }
                    }
                    consecutive = 0;
                    startCol = -1;
                    sumEnergy = 0;
                }
            }

            if (consecutive >= 3 && startCol !== -1) {
                const segW = (consecutive + 1) * step;
                if (segW <= MAX_ALLOWED_W) {
                    candidateSegments.push({
                        r,
                        startCol,
                        endCol: startCol + consecutive,
                        avgEnergy: sumEnergy / consecutive
                    });
                }
            }
        }

        if (candidateSegments.length === 0) {
            return [];
        }

        // Kelompokkan segmen baris yang bertetangga vertikal (r and r+1) HANYA jika overlap horizontal kuat
        interface BoxCluster {
            minCol: number;
            maxCol: number;
            minRow: number;
            maxRow: number;
            totalEnergy: number;
            segmentCount: number;
        }

        const clusters: BoxCluster[] = [];

        for (const seg of candidateSegments) {
            let merged = false;
            for (const cl of clusters) {
                // Baris harus bersebelahan (jarak vertikal <= 1 baris)
                const rowDist = Math.abs(seg.r - cl.maxRow);
                if (rowDist <= 1) {
                    // Hitung overlap horizontal
                    const overlapStart = Math.max(seg.startCol, cl.minCol);
                    const overlapEnd = Math.min(seg.endCol, cl.maxCol);
                    const overlapWidth = Math.max(0, overlapEnd - overlapStart);
                    const minLen = Math.min(seg.endCol - seg.startCol, cl.maxCol - cl.minCol);

                    // Overlap minimal 40% dari segmen terkecil
                    if (minLen > 0 && (overlapWidth / minLen) >= 0.40) {
                        const newMinCol = Math.min(cl.minCol, seg.startCol);
                        const newMaxCol = Math.max(cl.maxCol, seg.endCol);
                        const newMinRow = Math.min(cl.minRow, seg.r);
                        const newMaxRow = Math.max(cl.maxRow, seg.r);

                        const proposedW = (newMaxCol - newMinCol + 1) * step;
                        const proposedH = (newMaxRow - newMinRow + 1) * step;

                        // Pastikan hasil penggabungan TIDAK MELEBIHI batas spanduk yang wajar
                        if (proposedW <= MAX_ALLOWED_W && proposedH <= MAX_ALLOWED_H && (proposedW * proposedH) <= MAX_ALLOWED_AREA) {
                            cl.minCol = newMinCol;
                            cl.maxCol = newMaxCol;
                            cl.minRow = newMinRow;
                            cl.maxRow = newMaxRow;
                            cl.totalEnergy += seg.avgEnergy;
                            cl.segmentCount++;
                            merged = true;
                            break;
                        }
                    }
                }
            }

            if (!merged) {
                clusters.push({
                    minCol: seg.startCol,
                    maxCol: seg.endCol,
                    minRow: seg.r,
                    maxRow: seg.r,
                    totalEnergy: seg.avgEnergy,
                    segmentCount: 1
                });
            }
        }

        // Filter kluster yang valid:
        // Spanduk sewa/plang harus memiliki setidaknya 2 baris segmen atau energi sangat pekat (totalEnergy >= 5)
        const validClusters = clusters
            .filter(cl => {
                const boxW = (cl.maxCol - cl.minCol + 1) * step;
                const boxH = Math.max(step * 2, (cl.maxRow - cl.minRow + 1) * step);
                const area = boxW * boxH;

                if (boxW < 40 || boxH < 25) return false;
                if (boxW > MAX_ALLOWED_W || boxH > MAX_ALLOWED_H || area > MAX_ALLOWED_AREA) return false;
                return cl.segmentCount >= 2 || cl.totalEnergy >= 5.0;
            })
            .sort((a, b) => b.totalEnergy - a.totalEnergy)
            .slice(0, 2); // Maksimal 2 kotak terbaik

        for (const cl of validClusters) {
            const rawX = cl.minCol * step;
            const rawY = cl.minRow * step;
            const rawW = (cl.maxCol - cl.minCol + 1) * step;
            const rawH = Math.max(step * 2, (cl.maxRow - cl.minRow + 1) * step);

            // Tambahkan margin outward kecil (6-10px) agar tepi spanduk tertutup rapat
            const padX = Math.min(10, Math.round(rawW * 0.08));
            const padY = Math.min(8, Math.round(rawH * 0.08));

            const finalX = Math.max(0, rawX - padX);
            const finalY = Math.max(0, rawY - padY);
            const finalW = Math.min(width - finalX, rawW + padX * 2);
            const finalH = Math.min(height - finalY, rawH + padY * 2);

            regions.push({
                x: finalX,
                y: finalY,
                width: finalW,
                height: finalH,
                source: 'heuristic'
            });
        }
    } catch (e) {
        console.warn('[AI_SENSOR] Gagal heuristik client-side:', e);
    }

    return regions;
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

        // Ekspansi Margin Presisi Outward dari Centroid (+8 s/d 18px) agar menutupi 100% lembaran & border spanduk
        const cx = (p[0].x + p[1].x + p[2].x + p[3].x) / 4;
        const cy = (p[0].y + p[1].y + p[2].y + p[3].y) / 4;
        p = p.map(pt => {
            const vx = pt.x - cx;
            const vy = pt.y - cy;
            const dist = Math.sqrt(vx * vx + vy * vy);
            if (dist > 0) {
                const expansionPx = Math.max(6, Math.min(18, Math.round(dist * 0.10)));
                const factor = (dist + expansionPx) / dist;
                return {
                    x: Math.max(0, Math.min(width, Math.round(cx + vx * factor))),
                    y: Math.max(0, Math.min(height, Math.round(cy + vy * factor)))
                };
            }
            return pt;
        });

        // Bounding box dari poligon untuk ukuran sampling pixelate & penempatan badge
        const minX = Math.max(0, Math.min(...p.map(pt => pt.x)));
        const maxX = Math.min(width, Math.max(...p.map(pt => pt.x)));
        const minY = Math.max(0, Math.min(...p.map(pt => pt.y)));
        const maxY = Math.min(height, Math.max(...p.map(pt => pt.y)));
        const bW = maxX - minX;
        const bH = maxY - minY;

        if (bW <= 5 || bH <= 5) return;

        // HARD SAFETY GUARDRAIL: Jangan pernah menggelapkan foto jika kotak lebih besar dari batas spanduk wajar
        const maxAreaAllowed = (width * height) * 0.10;
        if (bW > width * 0.42 || bH > height * 0.32 || (bW * bH) > maxAreaAllowed) {
            console.warn('[AI_SENSOR] Mengabaikan kotak sensor abnormal (mencegah over-blur layar penuh):', { bW, bH, width, height });
            return;
        }

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
    onDetected?: (info: { detectedCount: number; detectedTexts?: string[] }) => void,
    isCustom = false
): Promise<File> {
    const shouldCheckBanner = isBannerProneCategory(category, isCustom);

    // ── FAST-PATH NON-BANNER (< 150ms) ──────────────────────────────────────────
    // Kategori interior (kamar, ranjang, kasur, lemari, dapur dalam, dsb.) tidak memiliki spanduk sewa.
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

                    let aiScanSucceeded = false;

                    // 2. Deteksi Spanduk Kontak via AI Gemini Vision
                    try {
                        // Payload ringkas 800px, q=0.55 (~28KB) untuk transmisi super cepat (< 120ms di jaringan seluler)
                        const lowResBase64 = await createLowResBase64ForAi(file, 800, 0.55);
                        if (lowResBase64) {
                            const aiResult = await detectPhotoContactBanner(lowResBase64, 'image/jpeg');
                            if (!aiResult.error) {
                                aiScanSucceeded = true;
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
                                            polygonPts = b.polygon.map((pt: any) => {
                                                let px = 0;
                                                let py = 0;
                                                if (Array.isArray(pt)) {
                                                    px = pt[0];
                                                    py = pt[1];
                                                } else if (typeof pt === 'object' && pt !== null) {
                                                    px = pt.x ?? pt.col ?? 0;
                                                    py = pt.y ?? pt.row ?? 0;
                                                }

                                                // Defensive check: jika titik [py, px] terbalik dengan sumbu Y/X
                                                if (Math.abs(px - normYmin) < Math.abs(px - normXmin) && Math.abs(py - normXmin) < Math.abs(py - normYmin)) {
                                                    const temp = px;
                                                    px = py;
                                                    py = temp;
                                                }

                                                return {
                                                    x: Math.round((Math.max(0, Math.min(1000, px)) / 1000) * width),
                                                    y: Math.round((Math.max(0, Math.min(1000, py)) / 1000) * height)
                                                };
                                            });
                                        }

                                        return { x: bx, y: by, width: bw, height: bh, polygon: polygonPts };
                                    }).filter(b => b.width > 5 && b.height > 5);
                                }
                            }
                        }
                    } catch (aiErr) {
                        console.warn('[AI_SENSOR] AI scan error, langsung beralih ke heuristik cepat:', aiErr);
                    }

                    // 3. Fallback Heuristik Client-Side Cerdas HANYA jika AI gagal terhubung/offline (bukan jika AI menyatakan bersih)
                    if (!aiScanSucceeded && bannersToApply.length === 0) {
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
    explicitBoxes?: Array<{ x: number; y: number; width: number; height: number }>,
    isCustom = false
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
                        const needAiScan = isBannerProneCategory(category, isCustom);
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
