import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Sparkles, Trash2, Check, Loader2, ShieldAlert, 
    RotateCcw, Info, MousePointerClick, CheckCircle2 
} from 'lucide-react';
import { 
    createLowResBase64ForAi, 
    detectPhotoContactBanner, 
    detectBannerRegionsClientSide, 
    applySensorBoxesToCanvas,
    SensorBoxPixel 
} from '../../autoSensorService';

interface PhotoSensorModalProps {
    isOpen: boolean;
    imageUrl: string;
    category: string;
    onClose: () => void;
    onApply: (newSensoredUrl: string) => Promise<void> | void;
    uploadFn: (file: File, path: string) => Promise<string>;
}

export const PhotoSensorModal: React.FC<PhotoSensorModalProps> = ({
    isOpen,
    imageUrl,
    category,
    onClose,
    onApply,
    uploadFn
}) => {
    const [boxes, setBoxes] = useState<SensorBoxPixel[]>([]);
    const [isScanningAi, setIsScanningAi] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const isDrawingRef = useRef(false);
    const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [currentDrawingBox, setCurrentDrawingBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    // Reset dan inisialisasi saat modal dibuka
    useEffect(() => {
        if (isOpen && imageUrl) {
            setBoxes([]);
            setNotice(null);
            setIsSaving(false);
            // Jalankan auto-scan AI awal
            runAiDetection(imageUrl);
        }
    }, [isOpen, imageUrl]);

    const runAiDetection = async (url: string) => {
        if (!url) return;
        setIsScanningAi(true);
        setNotice('Sedang memindai spanduk & nomor kontak via AI Vision...');

        try {
            const base64 = await createLowResBase64ForAi(url, 1024, 0.65);
            let detectedBoxes: SensorBoxPixel[] = [];

            if (base64) {
                const aiRes = await detectPhotoContactBanner(base64, 'image/jpeg');
                if (aiRes.hasContact && aiRes.boxes && aiRes.boxes.length > 0) {
                    const img = imgRef.current;
                    const naturalW = img?.naturalWidth || 1200;
                    const naturalH = img?.naturalHeight || 800;

                    detectedBoxes = aiRes.boxes.map((b, idx) => {
                        const ymin = Math.max(0, Math.min(1000, b.ymin));
                        const xmin = Math.max(0, Math.min(1000, b.xmin));
                        const ymax = Math.max(0, Math.min(1000, b.ymax));
                        const xmax = Math.max(0, Math.min(1000, b.xmax));

                        return {
                            id: `ai_${Date.now()}_${idx}`,
                            x: Math.round((xmin / 1000) * naturalW),
                            y: Math.round((ymin / 1000) * naturalH),
                            width: Math.round(((xmax - xmin) / 1000) * naturalW),
                            height: Math.round(((ymax - ymin) / 1000) * naturalH),
                            source: 'ai'
                        };
                    });
                }
            }

            // Fallback ke analisis heuristik jika AI tidak menemukan kotak
            if (detectedBoxes.length === 0 && imgRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = imgRef.current.naturalWidth;
                canvas.height = imgRef.current.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(imgRef.current, 0, 0);
                    const heuristicBoxes = detectBannerRegionsClientSide(ctx, canvas.width, canvas.height);
                    detectedBoxes = heuristicBoxes.map((b, idx) => ({
                        ...b,
                        id: `h_${Date.now()}_${idx}`,
                        source: 'heuristic'
                    }));
                }
            }

            if (detectedBoxes.length > 0) {
                setBoxes(detectedBoxes);
                setNotice(`✅ Berhasil mendeteksi ${detectedBoxes.length} area spanduk/kontak. Anda juga dapat menarik kotak sensor manual.`);
            } else {
                setNotice('ℹ️ AI tidak mendeteksi spanduk secara otomatis. Silakan tarik kotak manual pada foto untuk menandai area spanduk.');
            }
        } catch (err: any) {
            console.warn('[AI_MODAL] Gagal mendeteksi banner:', err);
            setNotice('⚠️ Pemindaian AI terhambat. Anda dapat menggambar kotak sensor manual di foto.');
        } finally {
            setIsScanningAi(false);
        }
    };

    if (!isOpen) return null;

    // Koordinat relatif layar ke koordinat natural image
    const getNaturalCoords = (e: React.MouseEvent | React.TouchEvent) => {
        if (!imgRef.current) return { x: 0, y: 0 };
        const rect = imgRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));

        const scaleX = (imgRef.current.naturalWidth || 1) / (rect.width || 1);
        const scaleY = (imgRef.current.naturalHeight || 1) / (rect.height || 1);

        return {
            x: Math.round(relX * scaleX),
            y: Math.round(relY * scaleY)
        };
    };

    // Event Handler Menggambar Kotak Sensor Manual
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getNaturalCoords(e);
        isDrawingRef.current = true;
        startPosRef.current = coords;
        setCurrentDrawingBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingRef.current) return;
        const coords = getNaturalCoords(e);
        const minX = Math.min(startPosRef.current.x, coords.x);
        const minY = Math.min(startPosRef.current.y, coords.y);
        const w = Math.abs(coords.x - startPosRef.current.x);
        const h = Math.abs(coords.y - startPosRef.current.y);

        setCurrentDrawingBox({ x: minX, y: minY, w, h });
    };

    const handlePointerUp = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        if (currentDrawingBox && currentDrawingBox.w > 15 && currentDrawingBox.h > 15) {
            const newBox: SensorBoxPixel = {
                id: `manual_${Date.now()}`,
                x: currentDrawingBox.x,
                y: currentDrawingBox.y,
                width: currentDrawingBox.w,
                height: currentDrawingBox.h,
                source: 'manual'
            };
            setBoxes(prev => [...prev, newBox]);
            setNotice(`➕ Kotak sensor manual berhasil ditambahkan (${boxes.length + 1} total).`);
        }
        setCurrentDrawingBox(null);
    };

    const handleDeleteBox = (id?: string) => {
        if (!id) return;
        setBoxes(prev => prev.filter(b => b.id !== id));
    };

    const handleSaveAndApply = async () => {
        if (!imgRef.current) return;
        if (boxes.length === 0) {
            const confirmEmpty = window.confirm('Belum ada kotak sensor yang ditandai. Apakah Anda yakin ingin menyimpan foto ini tanpa sensor tambahan?');
            if (!confirmEmpty) return;
        }

        setIsSaving(true);
        setNotice('Sedang membakar sensor & mengompresi ke WebP murni...');

        try {
            const naturalW = imgRef.current.naturalWidth || 1200;
            const naturalH = imgRef.current.naturalHeight || 800;

            const canvas = document.createElement('canvas');
            canvas.width = naturalW;
            canvas.height = naturalH;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error('Gagal menginisialisasi canvas context');

            ctx.drawImage(imgRef.current, 0, 0, naturalW, naturalH);

            if (boxes.length > 0) {
                applySensorBoxesToCanvas(ctx, naturalW, naturalH, boxes);
            }

            canvas.toBlob(
                async (blob) => {
                    if (!blob) throw new Error('Gagal menghasilkan blob WebP');
                    const webpFile = new File(
                        [blob],
                        `sensored_${Date.now()}.webp`,
                        { type: 'image/webp' }
                    );

                    const folder = `kostmanager/sensored/${Date.now()}`;
                    const newUrl = await uploadFn(webpFile, folder);

                    await onApply(newUrl);
                    setIsSaving(false);
                    onClose();
                },
                'image/webp',
                0.86
            );
        } catch (err: any) {
            console.error('[AI_MODAL] Gagal menyimpan sensor:', err);
            setNotice(`⚠️ Gagal memproses sensor: ${err.message}`);
            setIsSaving(false);
        }
    };

    // Hitung posisi display visual box relative to displayed image
    const renderBoxOverlays = () => {
        if (!imgRef.current) return null;
        const rect = imgRef.current.getBoundingClientRect();
        const naturalW = imgRef.current.naturalWidth || 1;
        const naturalH = imgRef.current.naturalHeight || 1;
        const scaleX = rect.width / naturalW;
        const scaleY = rect.height / naturalH;

        return (
            <>
                {boxes.map((b, idx) => {
                    const dispX = b.x * scaleX;
                    const dispY = b.y * scaleY;
                    const dispW = b.width * scaleX;
                    const dispH = b.height * scaleY;

                    return (
                        <div
                            key={b.id || idx}
                            style={{
                                left: `${dispX}px`,
                                top: `${dispY}px`,
                                width: `${dispW}px`,
                                height: `${dispH}px`
                            }}
                            className="absolute border-2 border-orange-500 bg-orange-500/25 rounded pointer-events-auto flex items-center justify-center group shadow-md transition-all"
                        >
                            <span className="absolute -top-5 left-0 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                                {b.source === 'ai' ? '🤖 AI Sensor' : b.source === 'manual' ? '✍️ Manual' : '📐 Heuristik'} #{idx + 1}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBox(b.id);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transform active:scale-95 transition-all"
                                title="Hapus kotak sensor ini"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}

                {currentDrawingBox && (
                    <div
                        style={{
                            left: `${currentDrawingBox.x * scaleX}px`,
                            top: `${currentDrawingBox.y * scaleY}px`,
                            width: `${currentDrawingBox.w * scaleX}px`,
                            height: `${currentDrawingBox.h * scaleY}px`
                        }}
                        className="absolute border-2 border-dashed border-amber-400 bg-amber-400/30 rounded pointer-events-none"
                    />
                )}
            </>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-orange-200 flex flex-col max-h-[92vh]">
                {/* Header Modal */}
                <div className="px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base leading-tight">Editor Sensor Foto & Spanduk Properti</h3>
                            <p className="text-[11px] text-orange-100">
                                Kategori: <span className="font-semibold uppercase tracking-wider">{category}</span> • WebP Protected
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar Instruksi & Tindakan Cepat */}
                <div className="px-5 py-2.5 bg-orange-50/80 border-b border-orange-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-stone-700">
                        <MousePointerClick className="w-4 h-4 text-orange-600 shrink-0" />
                        <span>
                            <strong>Petunjuk:</strong> Klik dan tarik pada foto untuk menggambar kotak sensor manual pada area spanduk/nomor kontak.
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={isScanningAi || isSaving}
                            onClick={() => runAiDetection(imageUrl)}
                            className="px-3 py-1.5 bg-white border border-orange-300 hover:bg-orange-100 text-orange-700 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 text-[11px]"
                        >
                            {isScanningAi ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                                    <span>Memindai AI...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Pindai Ulang AI</span>
                                </>
                            )}
                        </button>

                        {boxes.length > 0 && (
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => setBoxes([])}
                                className="px-2.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg font-bold flex items-center gap-1 transition-all shadow-sm text-[11px]"
                                title="Hapus semua kotak sensor"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Reset ({boxes.length})</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifikasi Status Pemindaian */}
                {notice && (
                    <div className="px-5 py-2 bg-amber-100/70 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                        <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="flex-1">{notice}</span>
                    </div>
                )}

                {/* Area Kanvas / Gambar Interaktif */}
                <div 
                    ref={containerRef}
                    className="flex-1 bg-stone-900 p-3 sm:p-5 flex items-center justify-center overflow-auto min-h-[360px] relative select-none cursor-crosshair"
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                >
                    <div className="relative inline-block max-w-full max-h-full">
                        <img
                            ref={imgRef}
                            src={imageUrl}
                            alt="Sensor preview"
                            crossOrigin="anonymous"
                            onLoad={() => {
                                if (imgRef.current) {
                                    setImageDimensions({
                                        width: imgRef.current.naturalWidth,
                                        height: imgRef.current.naturalHeight
                                    });
                                }
                            }}
                            className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none block"
                        />
                        {/* Overlay Kotak Sensor */}
                        {renderBoxOverlays()}
                    </div>
                </div>

                {/* Footer Aksi */}
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">
                        {boxes.length > 0 ? (
                            <span className="text-orange-600 font-bold">
                                {boxes.length} area spanduk/kontak akan disensor dengan Watermark RuangSinggah.id
                            </span>
                        ) : (
                            <span className="text-stone-400">Belum ada kotak sensor. Tarik kotak pada area yang ingin disensor.</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleSaveAndApply}
                            className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyimpan WebP...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Simpan &amp; Terapkan Sensor</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
