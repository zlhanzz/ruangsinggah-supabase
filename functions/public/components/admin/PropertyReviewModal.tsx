import React, { useState, useEffect } from 'react';
import { BasicPropertyInfo } from '../../adminService';
import { createKostSlug } from '../../utils/slugUtils';
import {
    Building2, Bed, ShieldCheck, MapPin, Phone, Mail, Sparkles, Snowflake,
    CheckCircle2, AlertTriangle, X, ExternalLink, ChevronLeft, ChevronRight,
    ZoomIn, Camera, Navigation, Wifi, BookOpen, Clock, Calendar, DollarSign,
    User, AlertCircle, Check, Info, Home, ShieldAlert
} from 'lucide-react';

interface PropertyReviewModalProps {
    property: BasicPropertyInfo;
    onClose: () => void;
    onPublish: (prop: BasicPropertyInfo) => Promise<void> | void;
    onUnpublishToDraft: (prop: BasicPropertyInfo) => Promise<void> | void;
    onRequestRevision: (prop: BasicPropertyInfo, notes: string) => Promise<void> | void;
    onToggleVerification: (prop: BasicPropertyInfo) => Promise<void> | void;
    onOpenFreeze: (prop: BasicPropertyInfo) => void;
    onUnfreeze: (prop: BasicPropertyInfo) => Promise<void> | void;
    FORMAT_CURRENCY: (val: number) => string;
}

const PropertyReviewModal: React.FC<PropertyReviewModalProps> = ({
    property,
    onClose,
    onPublish,
    onUnpublishToDraft,
    onRequestRevision,
    onToggleVerification,
    onOpenFreeze,
    onUnfreeze,
    FORMAT_CURRENCY
}) => {
    // ── Navigation & View States ──────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'info' | 'rooms' | 'legal'>('info');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
    const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

    // ── Revision Modal State ──────────────────────────────────────────────────
    const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
    const [revisionInput, setRevisionInput] = useState<string>('');
    const [isSubmittingRevision, setIsSubmittingRevision] = useState<boolean>(false);

    // Normalize Image URLs
    const allPhotos: string[] = React.useMemo(() => {
        if (!property.imageUrls || !Array.isArray(property.imageUrls)) return [];
        return property.imageUrls.filter((url): url is string => typeof url === 'string' && url.trim() !== '');
    }, [property.imageUrls]);

    // Handle Keyboard Navigation for Lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (lightboxPhoto) {
                    setLightboxPhoto(null);
                } else if (showRevisionModal) {
                    setShowRevisionModal(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxPhoto, showRevisionModal, onClose]);

    // Extract coordinates safely
    const lat = property.location?.lat ?? -5.147665;
    const lng = property.location?.lng ?? 119.432731;
    const hasValidCoordinates = Boolean(property.location?.lat && property.location?.lng);

    // WhatsApp handler
    const rawPhone = property.ownerPhone || property.omnichannelContactPhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const formattedWaLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}` : null;

    // Handle submit revision
    const handleSendRevision = async () => {
        if (!revisionInput.trim()) {
            alert('Harap masukkan catatan perbaikan yang jelas untuk mitra.');
            return;
        }
        setIsSubmittingRevision(true);
        try {
            await onRequestRevision(property, revisionInput.trim());
            setShowRevisionModal(false);
            setRevisionInput('');
        } finally {
            setIsSubmittingRevision(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Container */}
            <div 
                className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 border border-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* ── 1. MODAL HEADER ── */}
                <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {/* Model Badge */}
                            {property.isManaged ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                                    <Sparkles size={10} /> Terkelola KostManager
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                    <Home size={10} /> Self Listing (Mandiri)
                                </span>
                            )}

                            {/* Status Badge */}
                            {property.status === 'published' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Aktif / Terbit
                                </span>
                            )}
                            {(property.status === 'draft' || property.status === 'pending_review' || !property.status) && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                    <Clock size={10} /> Menunggu Review / Draft
                                </span>
                            )}
                            {property.status === 'suspended' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                    <Snowflake size={10} /> Dibekukan
                                </span>
                            )}

                            {/* Kost Type Badge */}
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                                {property.type || 'Campur'}
                            </span>

                            {/* Verification Badge */}
                            {property.isVerified && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                                    <ShieldCheck size={10} /> Centang Biru ✓
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight truncate">
                            {property.title || property.namaKost || 'Listing Properti'}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5 flex items-center gap-1">
                            <MapPin size={12} className="text-orange-500 shrink-0" />
                            {property.address || property.city || 'Alamat belum dispesifikasikan'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-2xl bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center border border-gray-200 transition-all font-bold shadow-xs cursor-pointer shrink-0"
                        title="Tutup (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── TOP INFO STRIP: PROFIL MITRA & KONTAK CEPAT ── */}
                <div className="bg-slate-100/70 px-5 sm:px-6 py-2.5 border-b border-gray-200/70 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {(property.ownerName || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pemilik / Mitra Kost</span>
                            <span className="font-black text-slate-800 truncate block text-xs">
                                {property.ownerName || 'Mitra'}
                            </span>
                        </div>
                        {property.ownerVerificationStatus === 'verified' ? (
                            <span className="ml-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black uppercase">
                                KTP Terverifikasi ✓
                            </span>
                        ) : (
                            <span className="ml-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[9px] font-bold">
                                KTP Belum Verifikasi
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {formattedWaLink && (
                            <a
                                href={formattedWaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                                <Phone size={11} /> WhatsApp
                            </a>
                        )}
                        {property.ownerEmail && (
                            <a
                                href={`mailto:${property.ownerEmail}`}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                                <Mail size={11} /> Email
                            </a>
                        )}
                    </div>
                </div>

                {/* ── 2. ALERT BANNERS (IF SUSPENDED OR REVISION REQUESTED) ── */}
                {property.status === 'suspended' && (
                    <div className="mx-6 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shrink-0">
                        <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs text-rose-900">
                            <p className="font-black uppercase tracking-wider">Listing Ini Sedang Dibekukan</p>
                            <p className="leading-relaxed font-medium">
                                {property.suspendReason || 'Listing dinonaktifkan sementara dari pencarian publik oleh admin.'}
                            </p>
                        </div>
                    </div>
                )}

                {property.revisionNotes && (
                    <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shrink-0">
                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs text-amber-900">
                            <p className="font-black uppercase tracking-wider">Catatan Evaluasi / Permintaan Revisi Terakhir:</p>
                            <p className="leading-relaxed font-medium whitespace-pre-line">{property.revisionNotes}</p>
                            {property.revisionRequestedAt && (
                                <p className="text-[10px] text-amber-700 font-bold mt-1">
                                    Dikirim pada: {new Date(property.revisionRequestedAt).toLocaleString('id-ID')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── 3. SISTEM TAB NAVIGASI (3-TAB SEPERTI KOSTMANAGER) ── */}
                <div className="flex border-b border-gray-100 bg-white px-4 sm:px-6 gap-2 overflow-x-auto shrink-0 mt-2">
                    {[
                        { key: 'info', icon: <Building2 size={14} />, label: '1. DATA PROPERTI & LOKASI', badge: allPhotos.length || null },
                        { key: 'rooms', icon: <Bed size={14} />, label: '2. DETAIL KAMAR & SKEMA TARIF', badge: property.roomTypes?.length || null },
                        { key: 'legal', icon: <ShieldCheck size={14} />, label: '3. DATA MITRA & LEGALITAS', badge: property.isVerified ? '✓' : null }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`py-3 px-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                                activeTab === tab.key
                                    ? 'border-orange-500 text-orange-600 bg-orange-50/40'
                                    : 'border-transparent text-gray-400 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.badge !== null && tab.badge !== 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                    activeTab === tab.key ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── 4. MODAL BODY (TAB CONTENT) ── */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                    {/* ========================================================= */}
                    {/* TAB 1: DATA PROPERTI & LOKASI */}
                    {/* ========================================================= */}
                    {activeTab === 'info' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* HERO PHOTO CAROUSEL WITH LIGHTBOX & THUMBNAIL STRIP */}
                            {allPhotos.length > 0 ? (
                                <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-950">
                                    {/* Main Hero Slide */}
                                    <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden">
                                        <img
                                            src={allPhotos[selectedPhotoIndex] || allPhotos[0]}
                                            alt={`Foto ${selectedPhotoIndex + 1}`}
                                            className="w-full h-full object-cover opacity-95 transition-all duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                                        {/* Top Badges */}
                                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                            <span className="px-3 py-1 rounded-xl bg-black/60 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5">
                                                <Camera size={12} className="text-orange-400" />
                                                Foto Properti #{selectedPhotoIndex + 1}
                                            </span>
                                            <div className="flex items-center gap-2 pointer-events-auto">
                                                <span className="px-3 py-1 rounded-xl bg-black/60 text-white text-[10px] font-black backdrop-blur-md border border-white/10 shadow-sm">
                                                    {selectedPhotoIndex + 1} / {allPhotos.length}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxPhoto(allPhotos[selectedPhotoIndex])}
                                                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors backdrop-blur-md border border-white/10 shadow-sm cursor-pointer"
                                                    title="Perbesar Foto Layar Penuh"
                                                >
                                                    <ZoomIn size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Prev / Next Navigation Arrows */}
                                        {allPhotos.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPhotoIndex(prev => Math.max(0, prev - 1))}
                                                    disabled={selectedPhotoIndex === 0}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all disabled:opacity-20 backdrop-blur-md border border-white/10 shadow-md active:scale-95 cursor-pointer"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPhotoIndex(prev => Math.min(allPhotos.length - 1, prev + 1))}
                                                    disabled={selectedPhotoIndex === allPhotos.length - 1}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all disabled:opacity-20 backdrop-blur-md border border-white/10 shadow-md active:scale-95 cursor-pointer"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Thumbnail Strip */}
                                    <div className="p-3 bg-slate-900 border-t border-white/10">
                                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                                            {allPhotos.map((p, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setSelectedPhotoIndex(i)}
                                                    className={`shrink-0 w-20 sm:w-24 h-14 rounded-xl overflow-hidden relative border transition-all cursor-pointer ${
                                                        i === selectedPhotoIndex
                                                            ? 'border-orange-500 ring-2 ring-orange-500/40 scale-[1.03]'
                                                            : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                                                    }`}
                                                >
                                                    <img src={p} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                                                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/75 text-[8px] font-mono text-white rounded font-bold backdrop-blur-xs">
                                                        #{i + 1}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-3xl space-y-2">
                                    <Camera size={32} className="mx-auto text-gray-300" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tidak ada foto properti yang diunggah</p>
                                </div>
                            )}

                            {/* LOKASI ADMINISTRATIF & GOOGLE MAPS LIVE PREVIEW */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Detail Alamat & Koordinat */}
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                <MapPin size={15} />
                                            </span>
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                                Alamat & Titik Koordinat GPS
                                            </span>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-wider flex items-center gap-1 hover:underline"
                                        >
                                            Buka Google Maps ↗
                                        </a>
                                    </div>

                                    <p className="text-xs text-slate-800 font-bold leading-relaxed bg-white p-3.5 rounded-2xl border border-slate-200">
                                        {property.address || 'Alamat belum diinput'}
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block">Kota / Wilayah</span>
                                            <span className="font-bold text-slate-800 truncate block">{property.city || '-'}</span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block">Kecamatan / Area</span>
                                            <span className="font-bold text-slate-800 truncate block">{property.area || '-'}</span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block">Provinsi</span>
                                            <span className="font-bold text-slate-800 truncate block">{property.province || 'Sulawesi Selatan'}</span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs col-span-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block">Latitude</span>
                                            <span className="font-mono font-bold text-slate-800 text-[11px] block">{lat}</span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs col-span-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block">Longitude</span>
                                            <span className="font-mono font-bold text-slate-800 text-[11px] block">{lng}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Iframe Google Maps Live Preview */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                            Peta Interaktif Lokasi
                                        </span>
                                        {!hasValidCoordinates && (
                                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                                <AlertTriangle size={11} /> Koordinat default
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-52 sm:h-60 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner bg-slate-100">
                                        <iframe
                                            title="property-location-map"
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                                            className="w-full h-full"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* KAMPUS & LANDMARK TERDEKAT */}
                            {property.campuses && property.campuses.length > 0 && (
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3.5 shadow-2xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <Navigation size={14} />
                                        </span>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                            Kampus & Landmark Terdekat
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {property.campuses.map((c, i) => (
                                            <div key={i} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-black text-slate-800 text-xs truncate">{c.name}</p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                                        {c.distance || 'Jarak dekat'}
                                                    </span>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 text-[10px] font-black shrink-0">
                                                    {c.motoDuration || c.walkDuration || 'Terdekat'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* FASILITAS UMUM & PERATURAN KOST */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Fasilitas Gedung */}
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-2xs">
                                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        <Wifi size={14} className="text-orange-500" /> Fasilitas Umum & Gedung
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {property.facilities && property.facilities.length > 0 ? (
                                            property.facilities.map((f, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs flex items-center gap-1.5">
                                                    <Check size={12} className="text-emerald-500" />
                                                    {f}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Belum ada fasilitas dicantumkan.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Peraturan Kost */}
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-2xs">
                                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        <BookOpen size={14} className="text-orange-500" /> Peraturan Kost
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {property.rules && property.rules.length > 0 ? (
                                            property.rules.map((r, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs">
                                                    {r}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Tidak ada aturan khusus yang dicantumkan.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* DESKRIPSI LENGKAP KOST */}
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-2 shadow-2xs">
                                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <Info size={14} className="text-orange-500" /> Deskripsi Properti
                                </h4>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-200">
                                    {property.description || 'Tidak ada deskripsi yang dicantumkan.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: DETAIL KAMAR & SKEMA TARIF */}
                    {/* ========================================================= */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                                    <Bed size={16} className="text-orange-500" />
                                    Daftar Tipe Kamar ({property.roomTypes?.length || 0})
                                </h4>
                                <span className="text-[10px] text-gray-500 font-bold">
                                    Tarif Terendah Mulai: <span className="text-orange-600 font-black">{FORMAT_CURRENCY(property.price || 0)} / Bulan</span>
                                </span>
                            </div>

                            {property.roomTypes && property.roomTypes.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5">
                                    {property.roomTypes.map((room, idx) => {
                                        const roomPhotos = (room.images || []).filter((u): u is string => typeof u === 'string' && u.trim() !== '');

                                        return (
                                            <div key={idx} className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4 hover:border-orange-300 transition-colors">
                                                {/* Header Kamar */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                                                                {idx + 1}
                                                            </span>
                                                            <h5 className="font-black text-gray-900 text-base uppercase tracking-tight">
                                                                {room.name || `Kamar Tipe ${idx + 1}`}
                                                            </h5>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-medium">
                                                            <span>Ukuran: <strong className="text-gray-900">{room.size || '-'}</strong></span>
                                                            <span>•</span>
                                                            <span>Maks. <strong className="text-gray-900">{room.maxOccupants || 1} Orang</strong></span>
                                                            {room.availableRoomCount !== undefined && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-emerald-600 font-bold">
                                                                        Sisa {room.availableRoomCount} kamar kosong
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Harga Pokok */}
                                                    <div className="text-left sm:text-right">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Tarif Pokok Bulanan</span>
                                                        <span className="text-lg font-black text-orange-600">
                                                            {FORMAT_CURRENCY(room.price || 0)} <span className="text-xs text-gray-400 font-bold">/ bln</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Galeri Foto Kamar (Jika Ada) */}
                                                {roomPhotos.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Camera size={11} /> Foto Kamar ({roomPhotos.length})
                                                        </span>
                                                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                                                            {roomPhotos.map((imgUrl, pIdx) => (
                                                                <div
                                                                    key={pIdx}
                                                                    onClick={() => setLightboxPhoto(imgUrl)}
                                                                    className="w-24 h-16 rounded-xl overflow-hidden relative border border-gray-200 shrink-0 group cursor-pointer hover:border-orange-500 transition-colors"
                                                                >
                                                                    <img src={imgUrl} alt={`Foto Kamar ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                        <ZoomIn size={14} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skema Harga Periodik Lengkap */}
                                                {room.pricing && room.pricing.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <DollarSign size={11} /> Skema Tarif Fleksibel
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {room.pricing.map((p, pIdx) => (
                                                                <div key={pIdx} className="px-3 py-1.5 bg-orange-50/70 border border-orange-200 rounded-xl text-xs font-bold text-orange-900 flex items-center gap-1.5">
                                                                    <span className="uppercase text-[10px] font-black text-orange-600">{p.period}:</span>
                                                                    <span>{FORMAT_CURRENCY(p.price)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fasilitas Kamar & Kamar Mandi */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                                                    {/* Fasilitas Ruangan */}
                                                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                                            Fasilitas Kamar
                                                        </span>
                                                        {room.roomFacilities && room.roomFacilities.length > 0 ? (
                                                            <p className="text-gray-700 font-medium leading-relaxed">
                                                                {room.roomFacilities.join(', ')}
                                                            </p>
                                                        ) : (
                                                            <p className="text-gray-400 italic">Belum ada rincian fasilitas.</p>
                                                        )}
                                                    </div>

                                                    {/* Fasilitas Kamar Mandi */}
                                                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                                            Kamar Mandi & Fitur
                                                        </span>
                                                        {room.bathroomFacilities && room.bathroomFacilities.length > 0 ? (
                                                            <p className="text-gray-700 font-medium leading-relaxed">
                                                                {room.bathroomFacilities.join(', ')}
                                                            </p>
                                                        ) : (
                                                            <p className="text-gray-400 italic">Belum ada rincian kamar mandi.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-3xl space-y-2">
                                    <Bed size={32} className="mx-auto text-gray-300" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Belum ada tipe kamar yang didaftarkan</p>
                                </div>
                            )}

                            {/* BIAYA TAMBAHAN LAINNYA */}
                            {(property.additionalFeePrice || property.additionalFeeName) && (
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs space-y-1">
                                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Biaya Tambahan / Iuran:</span>
                                    <p className="font-bold text-amber-900">
                                        {property.additionalFeeName || 'Biaya Tambahan'}: {FORMAT_CURRENCY(property.additionalFeePrice || 0)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: DATA MITRA & LEGALITAS */}
                    {/* ========================================================= */}
                    {activeTab === 'legal' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Kartu Profil Pemilik / Mitra */}
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4 shadow-2xs">
                                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <User size={14} className="text-orange-500" /> Profil Akun Mitra Pemilik
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nama Lengkap</span>
                                        <p className="font-black text-slate-900 text-sm">{property.ownerName || 'Mitra RuangSinggah'}</p>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{property.ownerRole || 'owner'}</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nomor WhatsApp / HP</span>
                                        <p className="font-black text-slate-900 text-sm">{property.ownerPhone || '-'}</p>
                                        {formattedWaLink && (
                                            <a
                                                href={formattedWaLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:underline"
                                            >
                                                <Phone size={10} /> Hubungi WhatsApp Langsung
                                            </a>
                                        )}
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Email Mitra</span>
                                        <p className="font-black text-slate-900 text-xs truncate">{property.ownerEmail || '-'}</p>
                                        <span className="text-[10px] text-slate-400 font-bold block mt-1">UID: {property.ownerUid || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Verifikasi KTP & Centang Biru Properti */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Status Verifikasi Identitas (KTP)</span>
                                    <div className="flex items-center gap-2">
                                        {property.ownerVerificationStatus === 'verified' ? (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase flex items-center gap-1.5">
                                                <CheckCircle2 size={13} /> Terverifikasi KTP
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black uppercase flex items-center gap-1.5">
                                                <AlertCircle size={13} /> Belum Verifikasi KTP
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium pt-1">
                                        {property.ownerVerificationStatus === 'verified'
                                            ? 'Identitas mitra telah diaudit dan sesuai dengan data kependudukan.'
                                            : 'Mitra belum mengunggah berkas KTP atau masih dalam antrean validasi.'}
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Status Centang Biru Listing</span>
                                    <div className="flex items-center gap-2">
                                        {property.isVerified ? (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black uppercase flex items-center gap-1.5">
                                                <ShieldCheck size={13} /> Centang Biru Aktif
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-black uppercase flex items-center gap-1.5">
                                                Standar (Tanpa Centang Biru)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium pt-1">
                                        Centang biru memberikan badge kepercayaan tinggi di hasil pencarian publik.
                                    </p>
                                </div>
                            </div>

                            {/* PIC / Caretaker Kost */}
                            {(property.omnichannelContactName || property.omnichannelContactPhone) && (
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-2 shadow-2xs">
                                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        <User size={14} className="text-orange-500" /> Kontak Pengelola / Penjaga Kost Lapangan
                                    </h4>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-black text-slate-900">{property.omnichannelContactName || 'Pengelola Kost'}</p>
                                            <p className="text-slate-500">{property.omnichannelContactPhone}</p>
                                        </div>
                                        {property.omnichannelContactPhone && (
                                            <a
                                                href={`https://wa.me/${property.omnichannelContactPhone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase hover:bg-emerald-100 transition-colors"
                                            >
                                                Chat PIC
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Metadata & Riwayat Listing */}
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-2xs text-xs">
                                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar size={14} className="text-orange-500" /> Metadata Sistem & Riwayat
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block">ID Listing</span>
                                        <span className="font-mono font-bold text-slate-800 text-[11px]">{property.id}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block">Tanggal Pendaftaran</span>
                                        <span className="font-bold text-slate-800">
                                            {property.createdAt ? new Date(property.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                                        </span>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block">Terakhir Diperbarui</span>
                                        <span className="font-bold text-slate-800">
                                            {property.updatedAt ? new Date(property.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 5. MODAL STICKY FOOTER (ACTION BAR MODERASI) ── */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    {/* Left Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {/* Toggle Centang Biru */}
                        <button
                            type="button"
                            onClick={() => onToggleVerification(property)}
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                property.isVerified
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                        >
                            <ShieldCheck size={14} />
                            {property.isVerified ? 'Cabut Centang Biru' : 'Beri Centang Biru'}
                        </button>

                        {/* Freeze / Unfreeze */}
                        {property.status === 'suspended' ? (
                            <button
                                type="button"
                                onClick={() => onUnfreeze(property)}
                                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <Check size={14} /> Buka Pembekuan
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onOpenFreeze(property)}
                                className="px-3.5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <Snowflake size={14} /> Bekukan Kost
                            </button>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                        {/* Buka Halaman Publik */}
                        <button
                            type="button"
                            onClick={() => window.open('/kost/' + createKostSlug(property), '_blank')}
                            className="px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <ExternalLink size={14} /> Halaman Publik
                        </button>

                        {/* Minta Revisi ke Mitra (Revision Request) */}
                        <button
                            type="button"
                            onClick={() => {
                                setRevisionInput(property.revisionNotes || '');
                                setShowRevisionModal(true);
                            }}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                            <AlertCircle size={14} />
                            Minta Revisi
                        </button>

                        {/* Setujui & Publikasikan / Jadikan Draft */}
                        {property.status === 'published' ? (
                            <button
                                type="button"
                                onClick={() => onUnpublishToDraft(property)}
                                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                                Jadikan Draft
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onPublish(property)}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                                <CheckCircle2 size={15} />
                                Setujui & Publikasikan
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 6. MODAL LIGHTBOX FULLSCREEN ZOOM ── */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxPhoto(null)}
                        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={lightboxPhoto}
                        alt="Foto Pembesar"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {/* ── 7. POPUP MODAL MINTA REVISI KE MITRA ── */}
            {showRevisionModal && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => !isSubmittingRevision && setShowRevisionModal(false)} />
                    <div
                        className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200 space-y-4 text-left"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                                    Minta Revisi Data Listing
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Properti akan dialihkan ke status <span className="font-bold text-amber-700">Draft</span> dengan instruksi perbaikan untuk mitra.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                Catatan / Instruksi Perbaikan untuk Mitra:
                            </label>
                            <textarea
                                value={revisionInput}
                                onChange={e => setRevisionInput(e.target.value)}
                                placeholder="Contoh: Foto kamar mandi belum diunggah, dan titik koordinat Google Maps belum tepat di atas gang masuk kost. Mohon perbaiki dan submit kembali..."
                                rows={4}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 outline-none focus:bg-white focus:border-amber-500 transition-all resize-none shadow-inner"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowRevisionModal(false)}
                                disabled={isSubmittingRevision}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSendRevision}
                                disabled={isSubmittingRevision || !revisionInput.trim()}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                                {isSubmittingRevision ? 'Mengirim...' : 'Kirim Catatan Revisi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyReviewModal;
