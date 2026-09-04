/**
 * autoSensorService.ts
 * Layanan cerdas front-end untuk mendeteksi dan menyensor (blur/pixelate) secara otomatis
 * nomor HP, kontak WhatsApp, dan teks spanduk/banner promosi pada foto properti/area umum
 * sebelum diunggah ke Supabase Storage, sekaligus mengompresi ke format WebP murni.
 */

// Kategori foto yang rentan memiliki spanduk, banner nomor HP, atau papan nama kontak
const BANNER_PRONE_KEYWORDS = [
    'depan',
    'fasad',
    'gedung',
    'bangunan depan',
    'pintu masuk',
    'gerbang',
    'parkir',
    'area parkir',
    'plang',
    'spanduk',
    'banner',
    'tampak depan'
];

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
 * Deteksi heuristik area spanduk / teks kontak berbasis kontras & kluster horizontal
 */
function detectBannerRegions(ctx: CanvasRenderingContext2D, width: number, height: number): Array<{ x: number; y: number; width: number; height: number }> {
    const regions: Array<{ x: number; y: number; width: number; height: number }> = [];

    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Sampling grid untuk mendeteksi variasi kecerahan tinggi (teks/angka pada spanduk)
        const sampleStep = 12;
        const blockCols = Math.floor(width / sampleStep);
        const blockRows = Math.floor(height / sampleStep);
        const highVarianceGrid: boolean[][] = Array.from({ length: blockRows }, () => Array(blockCols).fill(false));

        for (let row = 0; row < blockRows; row++) {
            for (let col = 0; col < blockCols; col++) {
                const startX = col * sampleStep;
                const startY = row * sampleStep;

                let minLum = 255;
                let maxLum = 0;

                for (let dy = 0; dy < sampleStep; dy += 3) {
                    for (let dx = 0; dx < sampleStep; dx += 3) {
                        const px = Math.min(width - 1, startX + dx);
                        const py = Math.min(height - 1, startY + dy);
                        const idx = (py * width + px) * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];
                        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                        if (lum < minLum) minLum = lum;
                        if (lum > maxLum) maxLum = lum;
                    }
                }

                // Jika kontras dalam blok mikro sangat tajam (ciri khas teks putih di atas banner merah/biru atau sebaliknya)
                if (maxLum - minLum > 130) {
                    highVarianceGrid[row][col] = true;
                }
            }
        }

        // Cari deretan horizontal dengan kluster teks pekat (lebar minimal 4 blok dan tinggi 2-4 blok)
        for (let row = 1; row < blockRows - 2; row++) {
            let consecutive = 0;
            let startCol = -1;

            for (let col = 0; col < blockCols; col++) {
                // Periksa apakah baris ini dan baris atas/bawahnya memiliki teks
                const isDense = highVarianceGrid[row][col] && (highVarianceGrid[row - 1]?.[col] || highVarianceGrid[row + 1]?.[col]);

                if (isDense) {
                    if (consecutive === 0) startCol = col;
                    consecutive++;
                } else {
                    if (consecutive >= 4 && startCol !== -1) {
                        const regionX = Math.max(0, (startCol - 1) * sampleStep);
                        const regionY = Math.max(0, (row - 1) * sampleStep);
                        const regionW = Math.min(width - regionX, (consecutive + 2) * sampleStep);
                        const regionH = Math.min(height - regionY, 4 * sampleStep);

                        // Hindari menduplikasi region yang beririsan dekat
                        const overlaps = regions.some(r => 
                            Math.abs(r.x - regionX) < 50 && Math.abs(r.y - regionY) < 30
                        );

                        if (!overlaps) {
                            regions.push({ x: regionX, y: regionY, width: regionW, height: regionH });
                        }
                    }
                    consecutive = 0;
                    startCol = -1;
                }
            }

            if (consecutive >= 4 && startCol !== -1) {
                const regionX = Math.max(0, (startCol - 1) * sampleStep);
                const regionY = Math.max(0, (row - 1) * sampleStep);
                const regionW = Math.min(width - regionX, (consecutive + 2) * sampleStep);
                const regionH = Math.min(height - regionY, 4 * sampleStep);
                regions.push({ x: regionX, y: regionY, width: regionW, height: regionH });
            }
        }
    } catch (e) {
        console.warn('Gagal menganalisis banner regions:', e);
    }

    // Batasi maksimal 4 region terpenting agar tidak memburamkan area non-spanduk
    return regions.slice(0, 4);
}

/**
 * Terapkan efek blur/pixelate halus pada area yang terdeteksi
 */
function blurCanvasRegion(ctx: CanvasRenderingContext2D, region: { x: number; y: number; width: number; height: number }) {
    const { x, y, width, height } = region;
    if (width <= 0 || height <= 0) return;

    try {
        const pixelSize = 12;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.max(1, Math.floor(width / pixelSize));
        tempCanvas.height = Math.max(1, Math.floor(height / pixelSize));
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Matikan image smoothing untuk efek pixelasi sensor
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.drawImage(ctx.canvas, x, y, width, height, 0, 0, tempCanvas.width, tempCanvas.height);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, x, y, width, height);

        // Beri lapisan semi-transparan estetis di atas area sensor
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x, y, width, height);
    } catch (e) {
        console.warn('Gagal memburamkan region:', e);
    }
}

/**
 * Memproses file foto dengan auto-sensor jika berada dalam kategori rawan banner
 * Menghasilkan file WebP terkompresi yang siap diupload.
 */
export async function processPhotoWithAutoSensor(
    file: File,
    category: string,
    onDetected?: (info: { detectedCount: number }) => void
): Promise<File> {
    const shouldCheckBanner = isBannerProneCategory(category);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
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
                if (shouldCheckBanner) {
                    const bannerRegions = detectBannerRegions(ctx, width, height);
                    if (bannerRegions.length > 0) {
                        bannerRegions.forEach(r => blurCanvasRegion(ctx, r));
                        detectedCount = bannerRegions.length;
                        if (onDetected) {
                            onDetected({ detectedCount });
                        }
                    }
                }

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
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Memproses ulang gambar yang sudah terunggah di URL untuk di-sensor dan di-upload ulang
 */
export async function processImageUrlWithAutoSensor(
    imageUrl: string,
    category: string,
    uploadFn: (file: File, path: string) => Promise<string>
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
                const bannerRegions = detectBannerRegions(ctx, width, height);

                if (bannerRegions.length === 0) {
                    // Berikan sensor area default pada sepertiga atas/bawah jika kategori sangat rentan
                    const defaultUpperBanner = { x: 0, y: Math.floor(height * 0.05), width: width, height: Math.floor(height * 0.18) };
                    blurCanvasRegion(ctx, defaultUpperBanner);
                } else {
                    bannerRegions.forEach(r => blurCanvasRegion(ctx, r));
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
