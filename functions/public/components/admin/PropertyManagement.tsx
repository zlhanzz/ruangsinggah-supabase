import React, { useState, useMemo } from 'react';
import { BasicPropertyInfo, updatePropertyStatus, freezeProperty, unfreezeProperty, togglePropertyVerification } from '../../adminService';
import {
    Building2, Search, Filter, Sparkles, ShieldCheck, CheckCircle2,
    AlertCircle, Clock, X, Phone, ExternalLink, Eye, Trash2, Snowflake,
    Check, MapPin, Bed, User, RefreshCcw, SlidersHorizontal, ArrowRight,
    HelpCircle, ChevronRight, AlertTriangle, ShieldAlert, ArrowLeftRight,
    Camera, Video, BookOpen, Wifi, Map, DollarSign, Calendar
} from 'lucide-react';

interface PropertyManagementProps {
    adminListings: BasicPropertyInfo[];
    loading: boolean;
    refreshData: () => Promise<void> | void;
    FORMAT_CURRENCY: (val: number) => string;
    onTransferProperty: (property: BasicPropertyInfo) => void;
    onDeleteProperty: (id: string, name: string) => void;
}

type TabType = 'all' | 'kostmanager' | 'self_listing' | 'pending_draft' | 'suspended';

const PropertyManagement: React.FC<PropertyManagementProps> = ({
    adminListings,
    loading,
    refreshData,
    FORMAT_CURRENCY,
    onTransferProperty,
    onDeleteProperty
}) => {
    // ── Filter & Search States ────────────────────────────────────────────────
    const [currentTab, setCurrentTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'Putra' | 'Putri' | 'Campur'>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ── Action Modals State ───────────────────────────────────────────────────
    const [selectedPropertyForReview, setSelectedPropertyForReview] = useState<BasicPropertyInfo | null>(null);
    const [propertyToFreeze, setPropertyToFreeze] = useState<BasicPropertyInfo | null>(null);
    const [freezeReason, setFreezeReason] = useState('');
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    // Dynamic unique cities for dropdown
    const availableCities = useMemo(() => {
        const cities = adminListings
            .map(p => p.city)
            .filter((c): c is string => Boolean(c && c.trim() !== ''));
        return Array.from(new Set(cities)).sort();
    }, [adminListings]);

    // ── Metric Counters ───────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = adminListings.length;
        const kmCount = adminListings.filter(p => p.isManaged).length;
        const selfCount = adminListings.filter(p => !p.isManaged).length;
        const publishedCount = adminListings.filter(p => p.status === 'published').length;
        const pendingOrDraftCount = adminListings.filter(p => p.status === 'draft' || p.status === 'pending_review' || !p.status).length;
        const suspendedCount = adminListings.filter(p => p.status === 'suspended').length;

        return {
            total,
            kmCount,
            selfCount,
            publishedCount,
            pendingOrDraftCount,
            suspendedCount
        };
    }, [adminListings]);

    // ── Filtered Listings ─────────────────────────────────────────────────────
    const filteredListings = useMemo(() => {
        return adminListings.filter(item => {
            // Tab condition
            if (currentTab === 'kostmanager' && !item.isManaged) return false;
            if (currentTab === 'self_listing' && item.isManaged) return false;
            if (currentTab === 'pending_draft' && item.status !== 'draft' && item.status !== 'pending_review' && item.status) return false;
            if (currentTab === 'suspended' && item.status !== 'suspended') return false;

            // Property type filter
            if (typeFilter !== 'all' && item.type?.toLowerCase() !== typeFilter.toLowerCase()) return false;

            // City filter
            if (cityFilter !== 'all' && item.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (item.title || item.namaKost || '').toLowerCase().includes(q);
                const matchOwner = (item.ownerName || '').toLowerCase().includes(q);
                const matchPhone = (item.ownerPhone || item.omnichannelContactPhone || '').includes(q);
                const matchCity = (item.city || '').toLowerCase().includes(q);
                const matchArea = (item.area || '').toLowerCase().includes(q);
                const matchAddress = (item.address || '').toLowerCase().includes(q);
                if (!matchTitle && !matchOwner && !matchPhone && !matchCity && !matchArea && !matchAddress) {
                    return false;
                }
            }

            return true;
        });
    }, [adminListings, currentTab, typeFilter, cityFilter, searchQuery]);

    // ── Action Handlers ───────────────────────────────────────────────────────
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshData();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handlePublish = async (prop: BasicPropertyInfo) => {
        if (!window.confirm(`Publikasikan listing "${prop.title || prop.namaKost}" agar aktif tayang di katalog publik?`)) return;
        setIsProcessingAction(true);
        try {
            await updatePropertyStatus(prop.id, 'published');
            await refreshData();
            if (selectedPropertyForReview?.id === prop.id) {
                setSelectedPropertyForReview(prev => prev ? { ...prev, status: 'published' } : null);
            }
            alert('Listing berhasil dipublikasikan!');
        } catch (e: any) {
            alert('Gagal mempublikasikan listing: ' + (e.message || e));
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleUnpublishToDraft = async (prop: BasicPropertyInfo) => {
        if (!window.confirm(`Jadikan listing "${prop.title || prop.namaKost}" sebagai Draft (disembunyikan dari katalog)?`)) return;
        setIsProcessingAction(true);
        try {
            await updatePropertyStatus(prop.id, 'draft');
            await refreshData();
            if (selectedPropertyForReview?.id === prop.id) {
                setSelectedPropertyForReview(prev => prev ? { ...prev, status: 'draft' } : null);
            }
            alert('Listing dialihkan ke status Draft.');
        } catch (e: any) {
            alert('Gagal mengubah status: ' + (e.message || e));
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleOpenFreeze = (prop: BasicPropertyInfo) => {
        setPropertyToFreeze(prop);
        setFreezeReason(prop.suspendReason || '');
    };

    const handleConfirmFreeze = async () => {
        if (!propertyToFreeze) return;
        if (!freezeReason.trim()) {
            alert('Harap masukkan alasan pembekuan / catatan penalti agar mitra dapat memperbaikinya.');
            return;
        }

        setIsProcessingAction(true);
        try {
            await freezeProperty(propertyToFreeze.id, freezeReason.trim());
            await refreshData();
            if (selectedPropertyForReview?.id === propertyToFreeze.id) {
                setSelectedPropertyForReview(prev => prev ? { ...prev, status: 'suspended', suspendReason: freezeReason.trim() } : null);
            }
            setPropertyToFreeze(null);
            setFreezeReason('');
            alert('Listing berhasil dibekukan.');
        } catch (e: any) {
            alert('Gagal membekukan listing: ' + (e.message || e));
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleUnfreeze = async (prop: BasicPropertyInfo) => {
        if (!window.confirm(`Buka pembekuan listing "${prop.title || prop.namaKost}" dan aktifkan kembali ke katalog?`)) return;
        setIsProcessingAction(true);
        try {
            await unfreezeProperty(prop.id);
            await refreshData();
            if (selectedPropertyForReview?.id === prop.id) {
                setSelectedPropertyForReview(prev => prev ? { ...prev, status: 'published', suspendReason: '' } : null);
            }
            alert('Pembekuan berhasil dibuka, listing kembali aktif!');
        } catch (e: any) {
            alert('Gagal membuka pembekuan: ' + (e.message || e));
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleToggleVerification = async (prop: BasicPropertyInfo) => {
        const nextState = !prop.isVerified;
        const actionLabel = nextState ? 'memberikan centang biru (Terverifikasi)' : 'mencabut status verifikasi';
        if (!window.confirm(`Yakin ingin ${actionLabel} pada listing "${prop.title || prop.namaKost}"?`)) return;

        setIsProcessingAction(true);
        try {
            await togglePropertyVerification(prop.id, nextState);
            await refreshData();
            if (selectedPropertyForReview?.id === prop.id) {
                setSelectedPropertyForReview(prev => prev ? { ...prev, isVerified: nextState } : null);
            }
            alert(`Berhasil memperbarui status verifikasi.`);
        } catch (e: any) {
            alert('Gagal mengubah verifikasi: ' + (e.message || e));
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleOpenWhatsApp = (phone?: string, kostTitle?: string, isSuspended?: boolean, reason?: string) => {
        if (!phone) {
            alert('Nomor WhatsApp pemilik tidak tersedia.');
            return;
        }
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
        if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

        let message = `Halo Bapak/Ibu Pemilik ${kostTitle || 'Kost'}, kami dari Tim Admin RuangSinggah.id ingin berkoordinasi mengenai listing kost Anda.`;
        if (isSuspended) {
            message = `Halo Bapak/Ibu Pemilik ${kostTitle || 'Kost'}, kami dari Tim Admin RuangSinggah.id memberitahukan bahwa listing Anda sementara dibekukan dengan catatan: "${reason || 'Perlu penyesuaian data'}". Mohon lengkapi dan perbaiki data di Dashboard Mitra Anda agar dapat kami aktifkan kembali. Terima kasih.`;
        }

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
            {/* ── Processing Overlay ── */}
            {isProcessingAction && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4 animate-in zoom-in-95">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent" />
                        <span className="font-black text-gray-900 text-sm">Memproses Perubahan...</span>
                    </div>
                </div>
            )}

            {/* ── Header & Title ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest">
                        <Building2 size={13} />
                        Pusat Moderasi & Supervisi Listing
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        Pengawasan Kost Masuk
                    </h1>
                    <p className="text-xs text-gray-500 font-medium max-w-2xl">
                        Pantau listing yang diposting langsung oleh para pemilik kost/mitra, tinjau kelayakan data, lakukan verifikasi, atau bekukan sementara jika ada data yang perlu direvisi.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading}
                        className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        title="Segarkan Data"
                    >
                        <RefreshCcw size={14} className={isRefreshing || loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Stat Cards (Ringkasan Metrik) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* 1. Total Listing */}
                <div
                    onClick={() => setCurrentTab('all')}
                    className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        currentTab === 'all' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Properti</span>
                        <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                            <Building2 size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{stats.total}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Seluruh Listing</p>
                </div>

                {/* 2. KostManager (Terverifikasi) */}
                <div
                    onClick={() => setCurrentTab('kostmanager')}
                    className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        currentTab === 'kostmanager' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-100'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">KostManager</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 tracking-tight">{stats.kmCount}</p>
                    <p className="text-[10px] text-emerald-600/80 font-bold mt-1 uppercase tracking-wider">Terverifikasi Survey</p>
                </div>

                {/* 3. Self Listing (Mandiri) */}
                <div
                    onClick={() => setCurrentTab('self_listing')}
                    className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        currentTab === 'self_listing' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-100'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Self Listing</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Home size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-blue-600 tracking-tight">{stats.selfCount}</p>
                    <p className="text-[10px] text-blue-600/80 font-bold mt-1 uppercase tracking-wider">Mandiri Oleh Mitra</p>
                </div>

                {/* 4. Menunggu Review / Draft */}
                <div
                    onClick={() => setCurrentTab('pending_draft')}
                    className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        currentTab === 'pending_draft' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-100'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Draft / Review</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-600 tracking-tight">{stats.pendingOrDraftCount}</p>
                    <p className="text-[10px] text-amber-600/80 font-bold mt-1 uppercase tracking-wider">Belum Tayang</p>
                </div>

                {/* 5. Dibekukan (Penalti / Revisi) */}
                <div
                    onClick={() => setCurrentTab('suspended')}
                    className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md col-span-2 lg:col-span-1 ${
                        currentTab === 'suspended' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-100'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Dibekukan</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Snowflake size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-rose-600 tracking-tight">{stats.suspendedCount}</p>
                    <p className="text-[10px] text-rose-600/80 font-bold mt-1 uppercase tracking-wider">Penalti / Butuh Edit</p>
                </div>
            </div>

            {/* ── Filter Bar & Tabs ── */}
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-100 scrollbar-none">
                    {[
                        { id: 'all', label: 'Semua Properti', count: stats.total },
                        { id: 'kostmanager', label: 'KostManager (Terverifikasi)', count: stats.kmCount, badgeColor: 'bg-emerald-100 text-emerald-700' },
                        { id: 'self_listing', label: 'Self Listing (Mandiri)', count: stats.selfCount, badgeColor: 'bg-blue-100 text-blue-700' },
                        { id: 'pending_draft', label: 'Draft / Belum Tayang', count: stats.pendingOrDraftCount, badgeColor: 'bg-amber-100 text-amber-700' },
                        { id: 'suspended', label: 'Dibekukan / Penalti', count: stats.suspendedCount, badgeColor: 'bg-rose-100 text-rose-700' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id as TabType)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                                currentTab === tab.id
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                currentTab === tab.id ? 'bg-white/20 text-white' : (tab.badgeColor || 'bg-gray-100 text-gray-600')
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search & Dropdown Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6 relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cari nama kost, pemilik, WhatsApp, atau kota..."
                            className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="sm:col-span-3">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as any)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="all">Tipe: Semua (Putra/Putri/Campur)</option>
                            <option value="Putra">Kost Putra</option>
                            <option value="Putri">Kost Putri</option>
                            <option value="Campur">Kost Campur</option>
                        </select>
                    </div>

                    <div className="sm:col-span-3">
                        <select
                            value={cityFilter}
                            onChange={e => setCityFilter(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="all">Kota: Semua Wilayah</option>
                            {availableCities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Table Moderasi Listing ── */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50/80 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Informasi Kost</th>
                                <th className="px-6 py-4">Status & Model</th>
                                <th className="px-6 py-4">Pemilik / Mitra</th>
                                <th className="px-6 py-4">Tarif & Kamar</th>
                                <th className="px-6 py-4">Lokasi</th>
                                <th className="px-6 py-4 text-right">Moderasi / Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredListings.map(item => {
                                const isKm = Boolean(item.isManaged);
                                const isSuspended = item.status === 'suspended';
                                const isPublished = item.status === 'published';
                                const isDraft = item.status === 'draft' || item.status === 'pending_review' || !item.status;
                                const firstPhoto = item.imageUrls?.[0] || 'https://via.placeholder.com/150';
                                const totalRooms = item.roomTypes?.length || 0;

                                return (
                                    <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                                        {/* 1. Info Kost */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-sm">
                                                    <img
                                                        src={firstPhoto}
                                                        alt={item.title || item.namaKost}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {isKm && (
                                                        <div className="absolute top-1 left-1 bg-emerald-600 text-white rounded-md p-0.5 shadow-sm" title="Terkelola KostManager">
                                                            <Sparkles size={10} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="font-black text-gray-900 text-sm hover:text-orange-600 transition-colors cursor-pointer" onClick={() => setSelectedPropertyForReview(item)}>
                                                            {item.title || item.namaKost || 'Kost Tanpa Nama'}
                                                        </p>
                                                        {item.isVerified && (
                                                            <span title="Terverifikasi" className="text-blue-500 inline-flex">
                                                                <CheckCircle2 size={14} fill="#3b82f6" className="text-white" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                                                            {item.type || 'Campur'}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 font-medium">
                                                            {totalRooms} Tipe Kamar
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. Status & Model */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5">
                                                {/* Moderation Status */}
                                                <div>
                                                    {isPublished && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                                            <CheckCircle2 size={11} /> Aktif / Terbit
                                                        </span>
                                                    )}
                                                    {isDraft && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                                            <Clock size={11} /> Draft / Pending
                                                        </span>
                                                    )}
                                                    {isSuspended && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider" title={item.suspendReason}>
                                                            <Snowflake size={11} /> Dibekukan
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Model: KostManager vs Self */}
                                                <div>
                                                    {isKm ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                            <Sparkles size={10} /> KostManager
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                            <Home size={10} /> Self Listing
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* 3. Pemilik / Mitra */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={13} className="text-gray-400" />
                                                    <p className="font-bold text-gray-900 text-xs truncate max-w-[160px]">
                                                        {item.ownerName || 'Mitra'}
                                                    </p>
                                                    {item.ownerVerificationStatus === 'verified' && (
                                                        <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1 py-0.2 rounded" title="Mitra Terverifikasi KTP">
                                                            KTP ✓
                                                        </span>
                                                    )}
                                                </div>

                                                {(item.ownerPhone || item.omnichannelContactPhone) && (
                                                    <button
                                                        onClick={() => handleOpenWhatsApp(item.ownerPhone || item.omnichannelContactPhone, item.title || item.namaKost, isSuspended, item.suspendReason)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 transition-colors"
                                                    >
                                                        <Phone size={11} />
                                                        <span>{item.ownerPhone || item.omnichannelContactPhone}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* 4. Tarif & Kamar */}
                                        <td className="px-6 py-4">
                                            <p className="font-black text-gray-900 text-xs">
                                                {FORMAT_CURRENCY(item.price || 0)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                Mulai / Bulan
                                            </p>
                                        </td>

                                        {/* 5. Lokasi */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-gray-900 text-xs flex items-center gap-1">
                                                    <MapPin size={11} className="text-orange-500 shrink-0" />
                                                    {item.city || 'Kota -'}
                                                </p>
                                                <p className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">
                                                    {item.area || item.address || '-'}
                                                </p>
                                            </div>
                                        </td>

                                        {/* 6. Moderasi / Aksi */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                {/* Tinjau Detail */}
                                                <button
                                                    onClick={() => setSelectedPropertyForReview(item)}
                                                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all shadow-sm active:scale-95"
                                                    title="Tinjau Detail Properti"
                                                >
                                                    <Eye size={15} />
                                                </button>

                                                {/* Buka Halaman Publik */}
                                                <button
                                                    onClick={() => window.open(`/kost/${item.id}`, '_blank')}
                                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all active:scale-95"
                                                    title="Kunjungi Halaman Publik"
                                                >
                                                    <ExternalLink size={15} />
                                                </button>

                                                {/* Approval / Toggle Publish */}
                                                {isPublished ? (
                                                    <button
                                                        onClick={() => handleUnpublishToDraft(item)}
                                                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                        title="Tarik ke Draft"
                                                    >
                                                        Draftkan
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePublish(item)}
                                                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95"
                                                        title="Publikasikan Listing"
                                                    >
                                                        Publish
                                                    </button>
                                                )}

                                                {/* Freeze / Unfreeze */}
                                                {isSuspended ? (
                                                    <button
                                                        onClick={() => handleUnfreeze(item)}
                                                        className="px-2.5 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                                        title="Buka Pembekuan"
                                                    >
                                                        Buka Blokir
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenFreeze(item)}
                                                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all active:scale-95"
                                                        title="Bekukan Listing (Penalti / Revisi)"
                                                    >
                                                        <Snowflake size={15} />
                                                    </button>
                                                )}

                                                {/* Transfer Kepemilikan */}
                                                <button
                                                    onClick={() => onTransferProperty(item)}
                                                    className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-all active:scale-95"
                                                    title="Transfer Kepemilikan ke Mitra Lain"
                                                >
                                                    <ArrowLeftRight size={15} />
                                                </button>

                                                {/* Hapus Properti */}
                                                <button
                                                    onClick={() => onDeleteProperty(item.id, item.namaKost || item.title || 'Kost')}
                                                    className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all active:scale-95"
                                                    title="Hapus Properti"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredListings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-3">
                                            <Building2 size={32} />
                                        </div>
                                        <p className="font-black text-gray-700 text-base">Tidak ada listing yang sesuai kriteria.</p>
                                        <p className="text-xs text-gray-400 mt-1">Coba sesuaikan tab atau kata kunci pencarian Anda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL 1: TINJAUAN & SUPERVISI DETAIL LISTING ── */}
            {selectedPropertyForReview && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedPropertyForReview(null)} />
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 via-white to-white">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        selectedPropertyForReview.isManaged ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {selectedPropertyForReview.isManaged ? 'KostManager (Terverifikasi)' : 'Self Listing (Mandiri)'}
                                    </span>
                                    {selectedPropertyForReview.status === 'suspended' && (
                                        <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Dibekukan
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                    {selectedPropertyForReview.title || selectedPropertyForReview.namaKost}
                                </h3>
                                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                    <MapPin size={13} className="text-orange-500 shrink-0" />
                                    {selectedPropertyForReview.address || selectedPropertyForReview.city}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPropertyForReview(null)}
                                className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-left">
                            {/* Suspended Alert Banner (If Frozen) */}
                            {selectedPropertyForReview.status === 'suspended' && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1 text-xs text-rose-900">
                                        <p className="font-black uppercase tracking-wider">Listing Sedang Dibekukan</p>
                                        <p className="leading-relaxed">{selectedPropertyForReview.suspendReason || 'Listing dinonaktifkan sementara karena pelanggaran atau data yang perlu direvisi oleh mitra.'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Foto Galeri */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Camera size={14} className="text-orange-500" />
                                    Galeri Foto ({selectedPropertyForReview.imageUrls?.length || 0})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {selectedPropertyForReview.imageUrls?.map((img, idx) => (
                                        <div key={idx} className="relative h-28 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group">
                                            <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <a href={img} target="_blank" rel="noopener noreferrer" className="absolute bottom-1 right-1 p-1 bg-black/60 text-white rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                Lihat
                                            </a>
                                        </div>
                                    ))}
                                    {(!selectedPropertyForReview.imageUrls || selectedPropertyForReview.imageUrls.length === 0) && (
                                        <p className="col-span-4 text-xs text-gray-400 italic py-4">Belum ada foto yang diunggah.</p>
                                    )}
                                </div>
                            </div>

                            {/* Info Mitra & Kontak */}
                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Nama Pemilik / Mitra</span>
                                    <p className="font-black text-gray-900 text-sm">{selectedPropertyForReview.ownerName || 'Mitra'}</p>
                                    <span className="text-[10px] text-gray-400 font-medium">{selectedPropertyForReview.ownerEmail || '-'}</span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">WhatsApp Pemilik</span>
                                    <p className="font-black text-gray-900 text-sm">{selectedPropertyForReview.ownerPhone || selectedPropertyForReview.omnichannelContactPhone || '-'}</p>
                                    <button
                                        onClick={() => handleOpenWhatsApp(selectedPropertyForReview.ownerPhone || selectedPropertyForReview.omnichannelContactPhone, selectedPropertyForReview.title, selectedPropertyForReview.status === 'suspended', selectedPropertyForReview.suspendReason)}
                                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors"
                                    >
                                        <Phone size={10} /> Chat WhatsApp
                                    </button>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Status Verifikasi</span>
                                    <p className="font-bold text-xs text-gray-800">
                                        Akun KTP: <span className="font-black text-orange-600">{selectedPropertyForReview.ownerVerificationStatus === 'verified' ? 'Terverifikasi ✓' : 'Belum Verifikasi'}</span>
                                    </p>
                                    <p className="font-bold text-xs text-gray-800 mt-0.5">
                                        Listing Kost: <span className="font-black text-blue-600">{selectedPropertyForReview.isVerified ? 'Centang Biru ✓' : 'Standar'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Deskripsi Kost</h4>
                                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    {selectedPropertyForReview.description || 'Tidak ada deskripsi.'}
                                </p>
                            </div>

                            {/* Tipe Kamar & Harga */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Bed size={14} className="text-orange-500" />
                                    Tipe Kamar & Skema Harga ({selectedPropertyForReview.roomTypes?.length || 0})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedPropertyForReview.roomTypes?.map((room, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <h5 className="font-black text-gray-900 text-xs uppercase">{room.name || `Kamar Tipe ${idx + 1}`}</h5>
                                                <span className="text-[10px] font-bold text-gray-400">{room.size || '-'}</span>
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                {room.pricing && room.pricing.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {room.pricing.map((p, pIdx) => (
                                                            <span key={pIdx} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-bold">
                                                                {p.period}: {FORMAT_CURRENCY(p.price)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="font-black text-orange-600">{FORMAT_CURRENCY(room.price || 0)} / Bulan</p>
                                                )}
                                            </div>
                                            {room.roomFacilities && room.roomFacilities.length > 0 && (
                                                <p className="text-[10px] text-gray-500">
                                                    <span className="font-bold">Fasilitas: </span>{room.roomFacilities.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fasilitas Gedung & Peraturan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <Wifi size={12} /> Fasilitas Umum
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedPropertyForReview.facilities?.map((f, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200">
                                                {f}
                                            </span>
                                        ))}
                                        {(!selectedPropertyForReview.facilities || selectedPropertyForReview.facilities.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">Tidak ada fasilitas dicantumkan.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <BookOpen size={12} /> Peraturan Kost
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedPropertyForReview.rules?.map((r, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200">
                                                {r}
                                            </span>
                                        ))}
                                        {(!selectedPropertyForReview.rules || selectedPropertyForReview.rules.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">Tidak ada aturan khusus.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Sticky Footer (Aksi Moderasi) */}
                        <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handleToggleVerification(selectedPropertyForReview)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                        selectedPropertyForReview.isVerified
                                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                                >
                                    <ShieldCheck size={14} />
                                    {selectedPropertyForReview.isVerified ? 'Hapus Centang Biru' : 'Beri Centang Biru'}
                                </button>

                                {selectedPropertyForReview.status === 'suspended' ? (
                                    <button
                                        onClick={() => handleUnfreeze(selectedPropertyForReview)}
                                        className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-700 transition-all flex items-center gap-1.5"
                                    >
                                        <Check size={14} /> Buka Pembekuan
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleOpenFreeze(selectedPropertyForReview)}
                                        className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-1.5"
                                    >
                                        <Snowflake size={14} /> Bekukan Kost
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={() => window.open(`/kost/${selectedPropertyForReview.id}`, '_blank')}
                                    className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all flex items-center gap-1.5"
                                >
                                    <ExternalLink size={14} /> Halaman Publik
                                </button>

                                {selectedPropertyForReview.status === 'published' ? (
                                    <button
                                        onClick={() => handleUnpublishToDraft(selectedPropertyForReview)}
                                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                                    >
                                        Jadikan Draft
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handlePublish(selectedPropertyForReview)}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                                    >
                                        Setujui & Publikasikan
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: PEMBEKUAN LISTING (SUSPEND / PENALTI) ── */}
            {propertyToFreeze && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in" onClick={() => setPropertyToFreeze(null)} />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200 space-y-5">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                <Snowflake size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                Bekukan Listing Kost
                            </h3>
                            <p className="text-xs text-gray-500">
                                Properti <span className="font-bold text-gray-900">"{propertyToFreeze.title || propertyToFreeze.namaKost}"</span> akan disembunyikan dari pencarian publik sampai mitra memperbaikinya.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                Alasan Pembekuan / Catatan Revisi untuk Mitra:
                            </label>
                            <textarea
                                value={freezeReason}
                                onChange={e => setFreezeReason(e.target.value)}
                                placeholder="Contoh: Alamat tidak sesuai dengan titik peta, mohon perbaiki lokasi dan foto kamar mandi yang belum diunggah..."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all min-h-[110px]"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setPropertyToFreeze(null)}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmFreeze}
                                disabled={isProcessingAction || !freezeReason.trim()}
                                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50"
                            >
                                {isProcessingAction ? 'Memproses...' : 'Bekukan Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyManagement;
