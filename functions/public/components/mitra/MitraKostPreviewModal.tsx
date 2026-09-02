import React, { useState, useEffect } from 'react';
import { Kost, RoomType } from '../../types';
import { FORMAT_CURRENCY } from '../../constants';
import { 
    X, Edit3, Eye, CheckCircle2, Clock, AlertCircle, MapPin, 
    Home, Bed, Sparkles, Shield, Wifi, ChevronLeft, ChevronRight,
    Info, Calendar, Phone, Check, Layers, AlertTriangle
} from 'lucide-react';

interface MitraKostPreviewModalProps {
    kost: Kost;
    onClose: () => void;
    onEdit: (kost: Kost) => void;
}

export const MitraKostPreviewModal: React.FC<MitraKostPreviewModalProps> = ({ kost, onClose, onEdit }) => {
    // Flatten / extract image URLs safely
    const images = React.useMemo(() => {
        if (!kost.imageUrls || !Array.isArray(kost.imageUrls)) return [];
        return kost.imageUrls.map(img => {
            if (typeof img === 'string') return img;
            return (img as any)?.url || (img as any)?.thumbnail || '';
        }).filter(Boolean);
    }, [kost.imageUrls]);

    const [activeImgIndex, setActiveImgIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'rooms' | 'facilities' | 'rules'>('rooms');

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const kostName = kost.title || kost.name || kost.namaKost || 'Kost Tanpa Nama';
    const isPublished = kost.status === 'published';
    const isSuspended = kost.status === 'suspended';
    const isInReview = !isPublished && !isSuspended;

    const lowestPrice = React.useMemo(() => {
        if (kost.room_types && kost.room_types.length > 0) {
            const prices = kost.room_types
                .map(r => Number(r.price_monthly || r.price || 0))
                .filter(p => p > 0);
            if (prices.length > 0) return Math.min(...prices);
        }
        return Number(kost.price_monthly || kost.price || 0);
    }, [kost]);

    const propertyTypeLabel = React.useMemo(() => {
        const t = (kost.property_type || kost.type || '').toLowerCase();
        if (t.includes('putra') || t === 'pria') return { text: 'KOST PUTRA', color: 'bg-blue-600 text-white' };
        if (t.includes('putri') || t === 'wanita') return { text: 'KOST PUTRI', color: 'bg-pink-600 text-white' };
        return { text: 'KOST CAMPUR', color: 'bg-purple-600 text-white' };
    }, [kost]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
            {/* Modal Window Container */}
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-gray-100 max-h-[92vh]">
                
                {/* 1. Header Bilah Kontrol Mitra (Fixed Topbar) */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gray-900 text-white border-b border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                            <Eye size={16} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black tracking-tight truncate text-white">
                                    Pratinjau Listing Mitra
                                </h2>
                                {/* Status Pill */}
                                {isPublished ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                        <CheckCircle2 size={10} /> Tayang Publik
                                    </span>
                                ) : isSuspended ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                                        <AlertCircle size={10} /> Ditangguhkan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 animate-pulse">
                                        <Clock size={10} /> Sedang Ditinjau Admin
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate">
                                {kostName} &bull; Lingkup Dashboard Mitra
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => onEdit(kost)}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                            title="Edit Data Kost Ini"
                        >
                            <Edit3 size={13} />
                            <span className="hidden sm:inline">Edit Kost</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Tutup Pratinjau (Esc)"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 2. Educational Status Banner */}
                <div className="bg-linear-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-200/50 px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 shrink-0">
                    <Info size={15} className="text-amber-600 shrink-0" />
                    <span className="truncate">
                        <strong>Simulasi Pratinjau:</strong> Ini adalah tampilan bagaimana calon penyewa melihat kost Anda setelah diverifikasi admin. Tombol transaksi sewa dinonaktifkan.
                    </span>
                </div>

                {/* 3. Modal Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    
                    {/* Visual Media Gallery */}
                    <div className="space-y-3">
                        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-gray-950 border border-gray-100 shadow-inner">
                            {images.length > 0 ? (
                                <img
                                    src={images[activeImgIndex] || images[0]}
                                    alt={kostName}
                                    className="w-full h-full object-cover transition-all duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <Home size={40} className="stroke-1 text-gray-300" />
                                    <p className="text-xs">Belum ada foto yang diunggah</p>
                                </div>
                            )}

                            {/* Overlay Badges */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md ${propertyTypeLabel.color}`}>
                                    {propertyTypeLabel.text}
                                </span>
                            </div>

                            {/* Gallery Navigation Controls */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setActiveImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-transform active:scale-90"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-transform active:scale-90"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[11px] font-bold backdrop-blur-xs">
                                        {activeImgIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImgIndex(idx)}
                                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                            activeImgIndex === idx 
                                                ? 'border-orange-500 ring-2 ring-orange-500/20 scale-95' 
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Basic Property Header Info */}
                    <div className="border-b border-gray-100 pb-5">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                    {kostName}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1.5">
                                    <MapPin size={15} className="text-orange-500 shrink-0" />
                                    <span>
                                        {kost.address || 'Alamat belum diatur'}
                                        {(kost.area || kost.city) ? ` • ${[kost.area, kost.city].filter(Boolean).join(', ')}` : ''}
                                    </span>
                                </p>
                            </div>

                            {/* Price Card */}
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 shrink-0 text-left md:text-right">
                                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                                    Mulai Dari
                                </span>
                                <div className="text-xl sm:text-2xl font-black text-gray-900">
                                    {lowestPrice > 0 ? FORMAT_CURRENCY(lowestPrice) : 'Hubungi Pemilik'}
                                    <span className="text-xs font-semibold text-gray-500"> / bulan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-100 gap-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('rooms')}
                            className={`pb-3 text-xs sm:text-sm font-black transition-colors relative cursor-pointer ${
                                activeTab === 'rooms' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            Tipe Kamar ({kost.room_types?.length || 0})
                            {activeTab === 'rooms' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('facilities')}
                            className={`pb-3 text-xs sm:text-sm font-black transition-colors relative cursor-pointer ${
                                activeTab === 'facilities' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            Fasilitas Umum ({[...(kost.facilities || []), ...(kost.public_facilities || [])].length})
                            {activeTab === 'facilities' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('rules')}
                            className={`pb-3 text-xs sm:text-sm font-black transition-colors relative cursor-pointer ${
                                activeTab === 'rules' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            Peraturan & Deskripsi
                            {activeTab === 'rules' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Tab 1: Tipe Kamar */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-4">
                            {kost.room_types && kost.room_types.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {kost.room_types.map((room, idx) => {
                                        const roomPhotos = room.photos || (room as any).images || [];
                                        const roomPhoto = Array.isArray(roomPhotos) && roomPhotos.length > 0 ? roomPhotos[0] : null;
                                        return (
                                            <div key={idx} className="border border-gray-200 rounded-2xl p-4 bg-white hover:border-orange-200 transition-all shadow-2xs space-y-3">
                                                <div className="flex gap-3">
                                                    {roomPhoto ? (
                                                        <img
                                                            src={typeof roomPhoto === 'string' ? roomPhoto : (roomPhoto as any).url}
                                                            alt={room.name}
                                                            className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-100"
                                                        />
                                                    ) : (
                                                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                            <Bed size={22} />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-black text-gray-900 truncate">
                                                            {room.name || `Tipe Kamar ${idx + 1}`}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {room.size ? `Ukuran: ${room.size}` : 'Ukuran standar'} &bull; {room.total_rooms ? `${room.total_rooms} Kamar` : 'Tersedia'}
                                                        </p>
                                                        <div className="text-sm font-black text-orange-600 mt-1">
                                                            {FORMAT_CURRENCY(Number(room.price_monthly || room.price || 0))}
                                                            <span className="text-[10px] text-gray-400 font-medium"> / bulan</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Fasilitas Kamar */}
                                                {room.facilities && room.facilities.length > 0 && (
                                                    <div className="pt-2 border-t border-gray-50 flex flex-wrap gap-1.5">
                                                        {room.facilities.map((f: string, fIdx: number) => (
                                                            <span key={fIdx} className="px-2 py-0.5 rounded-md bg-gray-50 text-[10px] font-semibold text-gray-600 flex items-center gap-1">
                                                                <Check size={9} className="text-emerald-500" /> {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 text-xs">
                                    Belum ada tipe kamar yang ditambahkan ke kost ini.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Fasilitas Bersama */}
                    {activeTab === 'facilities' && (
                        <div className="space-y-4">
                            {([...(kost.facilities || []), ...(kost.public_facilities || [])].length > 0) ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                    {Array.from(new Set([...(kost.facilities || []), ...(kost.public_facilities || [])])).map((fac: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700 font-medium">
                                            <Sparkles size={13} className="text-orange-500 shrink-0" />
                                            <span className="truncate">{fac}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 text-xs">
                                    Tidak ada fasilitas umum yang dipilih.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Peraturan & Deskripsi */}
                    {activeTab === 'rules' && (
                        <div className="space-y-6">
                            {/* Deskripsi */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                                    Deskripsi Kost
                                </h3>
                                <div className="p-4 bg-gray-50 rounded-2xl text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line border border-gray-100">
                                    {kost.description || 'Tidak ada deskripsi yang disediakan oleh pemilik kost.'}
                                </div>
                            </div>

                            {/* Aturan */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                                    Peraturan Kost
                                </h3>
                                {kost.rules && kost.rules.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {kost.rules.map((rule, idx) => (
                                            <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-100">
                                                <Shield size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                                <span>{rule}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Tidak ada aturan khusus yang ditentukan.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Footer Bilah Aksi Bawah */}
                <div className="sticky bottom-0 z-20 px-4 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                        <span>Mode Pratinjau Terisolasi &bull; Calon penyewa hanya dapat melihat setelah verifikasi disetujui.</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => onEdit(kost)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gray-900 hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Edit3 size={13} />
                            <span>Edit Listing Ini</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs transition-colors cursor-pointer"
                        >
                            Tutup Pratinjau
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MitraKostPreviewModal;
