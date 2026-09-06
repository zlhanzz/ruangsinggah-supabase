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

export interface ContactBannerDetectionResult {
    hasContact: boolean;
    detectedTexts?: string[];
    boxes: Array<{
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
        label?: string;
    }>;
    error?: string;
}

export interface SensorBoxPixel {
    x: number;
    y: number;
    width: number;
    height: number;
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
 */
export async function detectPhotoContactBanner(
    base64Image: string,
    mimeType = 'image/jpeg'
): Promise<ContactBannerDetectionResult> {
    if (!base64Image) {
        return { hasContact: false, boxes: [] };
    }

    const invokeWithTimeout = async (attempt: number) => {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Deteksi AI timeout (15s) - Percobaan ${attempt}`)), 15000)
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
        let res: any;
        try {
            res = await invokeWithTimeout(1);
        } catch (firstErr) {
            console.warn('[AI_SENSOR] Percobaan 1 gagal, mencoba retry...', firstErr);
            await new Promise(r => setTimeout(r, 600));
            res = await invokeWithTimeout(2);
        }

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
        console.warn('[AI_SENSOR] AI scanner tidak terjangkau, menggunakan fallback cerdas:', err);
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
 * Terapkan efek mosaik pixelate rapat, dark frosted glass, dan watermark resmi RuangSinggah.id pada canvas
 */
export function applySensorBoxesToCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    boxes: Array<{ x: number; y: number; width: number; height: number }>
) {
    if (!boxes || boxes.length === 0) return;

    boxes.forEach(box => {
        let { x, y, width: w, height: h } = box;
        if (w <= 0 || h <= 0) return;

        // Tambahkan padding pengaman 4px agar tepi teks benar-benar tertutup
        const pad = Math.max(2, Math.round(Math.min(w, h) * 0.04));
        const clampedX = Math.max(0, x - pad);
        const clampedY = Math.max(0, y - pad);
        const clampedW = Math.min(width - clampedX, w + pad * 2);
        const clampedH = Math.min(height - clampedY, h + pad * 2);

        ctx.save();

        // 1. Mosaik / Pixelate mikro rapat
        const offCanvas = document.createElement('canvas');
        const scale = 0.045;
        offCanvas.width = Math.max(1, Math.round(clampedW * scale));
        offCanvas.height = Math.max(1, Math.round(clampedH * scale));
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
            offCtx.imageSmoothingEnabled = true;
            offCtx.drawImage(ctx.canvas, clampedX, clampedY, clampedW, clampedH, 0, 0, offCanvas.width, offCanvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height, clampedX, clampedY, clampedW, clampedH);
        }

        // 2. Lapisan Frosted Glassmorphism Gelap yang Elegan
        ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
        ctx.fillRect(clampedX, clampedY, clampedW, clampedH);

        // Garis batas luar halus
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(clampedX, clampedY, clampedW, clampedH);

        // 3. Render Watermark Kapsul Elegan "ruangsinggah.id"
        if (clampedW >= 32 && clampedH >= 14) {
            const centerX = clampedX + clampedW / 2;
            const centerY = clampedY + clampedH / 2;

            const fontSize = Math.max(8, Math.min(20, Math.round(Math.min(clampedH * 0.38, clampedW * 0.13))));
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

            if (pillW <= clampedW * 1.12 && pillH <= clampedH * 1.12) {
                const pillX = centerX - (pillW / 2);
                const pillY = centerY - (pillH / 2);
                const pillRadius = Math.round(pillH / 2);

                drawPill(ctx, pillX, pillY, pillW, pillH, pillRadius);
                ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
                ctx.lineWidth = 1.2;
                ctx.stroke();

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const startTextX = centerX - (totalTextWidth / 2);

                // "ruangsinggah" (Putih bersih)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(textPart1, startTextX, centerY);

                // ".id" (Oranye khas RuangSinggah)
                ctx.fillStyle = '#FB923C';
                ctx.fillText(textPart2, startTextX + width1, centerY);
            }
        }

        ctx.restore();
    });
}

/**
 * Memproses file foto dengan Dual-Engine Auto-Sensor (AI Vision + Fallback Heuristik)
 * Menghasilkan file WebP terkompresi yang siap diupload.
 */
export async function processPhotoWithAutoSensor(
    file: File,
    category: string,
    onDetected?: (info: { detectedCount: number; detectedTexts?: string[] }) => void
): Promise<File> {
    const shouldCheckBanner = isBannerProneCategory(category);

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

                    ctx.drawImage(img, 0, 0, width, height);

                    let detectedCount = 0;
                    let detectedTexts: string[] = [];

                    if (shouldCheckBanner) {
                        // 1. Coba AI Gemini Vision Edge Function
                        let boxesToApply: Array<{ x: number; y: number; width: number; height: number }> = [];

                        try {
                            // Gunakan resolusi 1600px (kualitas 0.82) untuk kategori rentan banner agar detail teks spanduk/plang kecil di kejauhan tajam terbaca AI
                            const targetDim = shouldCheckBanner ? 1600 : 1024;
                            const targetQuality = shouldCheckBanner ? 0.82 : 0.65;
                            const lowResBase64 = await createLowResBase64ForAi(file, targetDim, targetQuality);
                            if (lowResBase64) {
                                const aiResult = await detectPhotoContactBanner(lowResBase64, 'image/jpeg');
                                if (aiResult.hasContact && aiResult.boxes && aiResult.boxes.length > 0) {
                                    detectedTexts = aiResult.detectedTexts || [];
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
                                    }).filter(b => b.width > 5 && b.height > 5);
                                }
                            }
                        } catch (aiErr) {
                            console.warn('[AI_SENSOR] AI scan exception, beralih ke fallback:', aiErr);
                        }

                        // 2. Jika AI tidak menemukan atau gagal, gunakan Fallback Heuristik Cerdas
                        if (boxesToApply.length === 0) {
                            const heuristicBoxes = detectBannerRegionsClientSide(ctx, width, height);
                            if (heuristicBoxes.length > 0) {
                                boxesToApply = heuristicBoxes;
                            }
                        }

                        // 3. Terapkan Sensor jika ditemukan area kontak/spanduk
                        if (boxesToApply.length > 0) {
                            applySensorBoxesToCanvas(ctx, width, height, boxesToApply);
                            detectedCount = boxesToApply.length;
                            if (onDetected) {
                                onDetected({ detectedCount, detectedTexts });
                            }
                        }
                    }

                    // 4. Kompresi WebP
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
                        0.85
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
