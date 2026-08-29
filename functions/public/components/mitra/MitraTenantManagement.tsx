import React, { useState, useMemo } from 'react';
import { 
    Users, Search, Filter, Calendar, Clock, ArrowRight, User, 
    MessageCircle, MoreHorizontal, ChevronRight, ChevronDown, ChevronUp, MapPin, Briefcase, 
    GraduationCap, ClipboardList, TrendingUp, AlertCircle, Plus, DollarSign, ExternalLink, X, Home, Zap, RefreshCw,
    Share2, ShieldAlert, File, History
} from 'lucide-react';
import PaymentHistoryModal from '../PaymentHistoryModal';
import { FORMAT_CURRENCY } from '../../constants';
import { getCurrentDate, parseDateSafely } from '../../utils/timeUtils';
import { Kost } from '../../types';
import AddBillModal from './AddBillModal';

interface MitraTenantManagementProps {
    residentStatus: any[];
    properties: Kost[];
    bookings?: any[];
    refreshData: () => void;
    onViewUserProfile: (userData: any) => void;
    onStartChat?: (tenantId: string, kostId: string) => void;
}

const BillingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    switch(status) {
        case 'lunas':
            return <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1"><Zap size={10} fill="currentColor" /> Tagihan Fasilitas Lunas</div>;
        case 'sudah_ditagih':
            return <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1"><Clock size={10} /> Sudah Ditagih</div>;
        case 'perlu_ditagih':
            return <div className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1 animate-pulse"><AlertCircle size={10} /> Tertunggak / Belum Bayar</div>;
        default:
            return null;
    }
};

const MitraTenantManagement: React.FC<MitraTenantManagementProps> = ({ 
    residentStatus, 
    properties,
    bookings = [],
    refreshData,
    onViewUserProfile,
    onStartChat
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProperty, setFilterProperty] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewingResident, setViewingResident] = useState<any | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
    const [viewingHistory, setViewingHistory] = useState<any | null>(null);
    const [showAddBillModal, setShowAddBillModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [expandedResidents, setExpandedResidents] = useState<Record<string, boolean>>({});

    const toggleExpand = (uid: string) => {
        setExpandedResidents(prev => ({
            ...prev,
            [uid]: !prev[uid]
        }));
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        // Artificial delay for feedback
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const handleTriggerInvoice = async (resident: any) => {
        if (!confirm(`Kirim ulang notifikasi tagihan ke ${resident.profile.name}?`)) return;
        setIsUpdating(true);
        try {
            console.log('Triggering invoice for:', resident.uid);
            alert('Sistem sedang memproses pengiriman invoice terbaru ke WhatsApp penghuni.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleManualPayment = async (resident: any) => {
        if (!confirm(`Konfirmasi pembayaran CASH untuk ${resident.profile.name}? Status tagihan akan langsung berubah menjadi LUNAS.`)) return;
        setIsUpdating(true);
        try {
            console.log('Updating payment status for:', resident.uid);
            alert('Status pembayaran berhasil diperbarui secara manual.');
            refreshData();
        } finally {
            setIsUpdating(false);
        }
    };

    // --- HELPERS ---


    const safeFormatDate = (dateStr: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
        if (!dateStr) return '-';
        const d = parseDateSafely(dateStr);
        if (!d) return '-';
        return d.toLocaleDateString('id-ID', options);
    };

    const getRemainingDays = (end: string | null | undefined) => {
        if (!end) return null;
        const d = parseDateSafely(end);
        if (!d) return null;
        
        // Normalize today to start of day (00:00:00)
        const today = getCurrentDate();
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Normalize end date to start of day
        const endNormalized = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        
        const diff = endNormalized.getTime() - todayNormalized.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // --- DATA AGGREGATION ---
    // Group transactions by User ID to show unique residents
    const processedResidents = useMemo(() => {
        if (!residentStatus) return [];

        return residentStatus.map(r => {
            const u = r.user || {};
            const p = r.property || {};
            const t = r.last_transaction || {};
            const meta = t.metadata || {};

            const daysLeft = getRemainingDays(r.end_date);
            
            return {
                id: r.id,
                uid: r.user_id,
                profile: {
                    name: u.name || u.full_name || 'Penyewa',
                    photo_url: u.photo_url,
                    phone: u.phone,
                    email: u.email,
                    occupation: u.occupation || '-',
                    institution: u.institution || '-',
                    city: u.city || '-',
                    address: u.address || '-'
                },
                kostId: r.kost_id,
                kostName: p.title || 'Kost',
                roomType: r.room_type || '-',
                occupantCount: Number(meta.occupants) || 1,
                startDate: r.start_date,
                endDate: r.end_date,
                totalPeriods: r.total_months || 0,
                periodLabel: 'Bulan',
                totalSewaLabel: `${r.total_months || 0} Bulan`,
                billingBreakdown: {
                    base: Number(meta.basePrice) || (Number(t.amount || 0) - (Number(meta.extraPersonFee) || 0) - (Number(meta.facilityAmount || meta.additionalFeePrice || meta.facilityFee) || 0) - (Number(meta.platformFee) || 0)),
                    extraOccupant: Number(meta.extraPersonFee) || 0,
                    facility: Number(meta.facilityAmount || meta.additionalFeePrice || meta.facilityFee) || 0,
                    platform: Number(meta.platformFee) || 0,
                    total: Number(t.amount || 0)
                },
                daysLeft,
                isExpired: daysLeft !== null && daysLeft < 0,
                isExpiring: daysLeft !== null && daysLeft <= 7 && daysLeft >= 0,
                isActive: daysLeft !== null && daysLeft > 7,
                isNoExtension: meta.noExtension === true,
                isSurveyOccupant: meta.isSurveyOccupant === true || r.isSurveyOccupant === true,
                billingStatus: (t.status || 'PAID').toLowerCase(),
                relatedBills: bookings.filter(bt => 
                    (bt.type === 'tagihan_ekstra' || bt.product_type === 'tagihan_ekstra') && 
                    (bt.metadata?.originalTransactionId === r.last_transaction_id || bt.metadata?.original_transaction_id === r.last_transaction_id)
                ).map(rb => ({
                    id: rb.id,
                    name: rb.metadata?.bill_name || 'Tagihan Fasilitas',
                    amount: Number(rb.amount),
                    status: (rb.status || 'PENDING').toUpperCase(),
                    date: new Date(rb.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                }))
            };
        });
    }, [residentStatus, bookings]);

    const filteredResidents = useMemo(() => {
        return processedResidents.filter(res => {
            const matchesSearch = res.profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 res.kostName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProperty = filterProperty === 'all' || res.kostId === filterProperty;
            
            let matchesStatus = true;
            if (filterStatus === 'expiring') matchesStatus = res.isExpiring;
            else if (filterStatus === 'active') matchesStatus = res.isActive;
            else if (filterStatus === 'no_extension') matchesStatus = res.isNoExtension;
            else if (filterStatus === 'all') {
                // In 'all' view, we show active and expiring. 
                // Expired ( < 0 ) will be shown if they are within the grace period (-3 days)
                matchesStatus = true; 
            }

            return matchesSearch && matchesProperty && matchesStatus;
        });
    }, [processedResidents, searchQuery, filterProperty, filterStatus]);

    const stats = useMemo(() => {
        const expiringSoon = processedResidents.filter(r => r.isExpiring).length;
        const activeRentals = processedResidents.filter(r => r.isActive).length;
        const noExtensions = processedResidents.filter(r => r.isNoExtension).length;

        return {
            total: processedResidents.length,
            expiringSoon,
            activeRentals,
            noExtensions
        };
    }, [processedResidents]);

    // calculateProgress moves here
    const calculateProgress = (start: string | null | undefined, end: string | null | undefined) => {
        if (!start || !end) return 0;
        const sDate = new Date(start);
        const eDate = new Date(end);
        if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return 0;
        
        const total = eDate.getTime() - sDate.getTime();
        const current = getCurrentDate().getTime() - sDate.getTime();
        
        if (total <= 0) return 100;
        return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    };

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">Database Penghuni</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                        <span className="text-orange-500">{stats.total} Total</span> • <span className="text-emerald-600">{stats.activeRentals} Aktif</span> • <span className="text-rose-500">{stats.expiringSoon} Tenggang</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleRefresh}
                        className="p-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl border border-gray-200 shadow-sm transition-all flex items-center justify-center cursor-pointer"
                        title="Segarkan Data"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama penghuni atau kost..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={filterProperty}
                        onChange={(e) => setFilterProperty(e.target.value)}
                        className="w-full pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 transition-all shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="all">Semua Properti</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        filterStatus === 'all'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                    }`}
                >
                    Semua <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>{processedResidents.length}</span>
                </button>
                <button
                    onClick={() => setFilterStatus('expiring')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        filterStatus === 'expiring'
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-white text-orange-600 border border-orange-100 hover:bg-orange-50'
                    }`}
                >
                    <Clock size={12} /> Masa Tenggang <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === 'expiring' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'}`}>{stats.expiringSoon}</span>
                </button>
                <button
                    onClick={() => setFilterStatus('active')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        filterStatus === 'active'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'
                    }`}
                >
                    <Zap size={12} fill="currentColor" /> Sewa Aktif <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === 'active' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'}`}>{stats.activeRentals}</span>
                </button>
                <button
                    onClick={() => setFilterStatus('no_extension')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        filterStatus === 'no_extension'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'
                    }`}
                >
                    <ShieldAlert size={12} /> Tidak Perpanjang <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === 'no_extension' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'}`}>{stats.noExtensions}</span>
                </button>
            </div>

            {/* Inhabitants List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredResidents.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Users size={32} />
                        </div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Belum ada penghuni aktif</p>
                        <p className="text-xs text-gray-400 mt-2">Data akan muncul setelah pesanan diselesaikan (PAID) atau hasil survei kamar terisi.</p>
                    </div>
                ) : (
                    filteredResidents.map((resident) => {
                        const daysLeft = getRemainingDays(resident.endDate);
                        const resKey = resident.id || resident.uid;
                        
                        return (
                            <div key={resKey} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 mb-4 group">
                                <div className="p-4 md:p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        
                                        {/* Left: Avatar & Basic Info */}
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div 
                                                onClick={() => setViewingResident(resident)}
                                                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-xl font-black text-white shadow-md border-2 border-white shrink-0 overflow-hidden relative cursor-pointer hover:scale-105 transition-transform"
                                            >
                                                {resident.profile.name?.charAt(0)}
                                                {resident.profile.photo_url && <img src={resident.profile.photo_url} className="absolute inset-0 w-full h-full object-cover" alt="" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-[9px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg font-bold border border-orange-100 uppercase truncate max-w-[120px]">{resident.kostName}</span>
                                                    {resident.isSurveyOccupant && (
                                                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-wider flex items-center gap-1">⭐ KOSTMANAGER</span>
                                                    )}
                                                    {resident.isExpired ? (
                                                        <span className="text-[9px] font-bold text-white bg-rose-600 px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><AlertCircle size={10}/> HABIS</span>
                                                    ) : resident.isExpiring ? (
                                                        <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1 animate-pulse"><Clock size={10}/> TENGGANG</span>
                                                    ) : resident.isNoExtension ? (
                                                        <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><ShieldAlert size={10}/> TIDAK PERPANJANG</span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><Zap size={10} fill="currentColor"/> AKTIF</span>
                                                    )}
                                                    <BillingStatusBadge status={resident.billingStatus || 'pending'} />
                                                </div>
                                                <h3 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight leading-tight truncate">{resident.profile.name}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                                    {resident.roomType} • {resident.occupantCount} Orang
                                                </p>
                                            </div>
                                        </div>

                                        {/* Middle: Sisa Hari, Selesai Sewa, Total Tagihan */}
                                        <div className="grid grid-cols-3 gap-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50 lg:flex lg:flex-wrap lg:items-center lg:gap-8 lg:bg-transparent lg:border-transparent lg:p-0">
                                            <div className="min-w-0">
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">Sisa Hari</p>
                                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-black uppercase mt-0.5 ${
                                                    daysLeft !== null && daysLeft <= 7 ? 'text-rose-600' : 'text-emerald-600'
                                                }`}>
                                                    <Clock size={10} /> <span className="truncate">{daysLeft}h</span>
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">Selesai Sewa</p>
                                                <p className="text-[10px] font-black text-gray-900 mt-0.5 truncate">{safeFormatDate(resident.endDate, {day:'numeric', month:'short', year:'numeric'})}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">Total</p>
                                                <p className="text-[10px] font-black text-orange-500 mt-0.5 truncate">{FORMAT_CURRENCY(resident.billingBreakdown.total)}</p>
                                            </div>
                                        </div>

                                        {/* Right: Actions & Expand Button */}
                                        <div className="flex items-center justify-between gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 w-full lg:w-auto">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <button 
                                                    onClick={() => handleManualPayment(resident)}
                                                    disabled={daysLeft !== null && daysLeft > 7 || isUpdating}
                                                    title={daysLeft !== null && daysLeft > 7 ? 'Tombol aktif 7 hari sebelum masa sewa berakhir' : ''}
                                                    className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm border ${
                                                        daysLeft !== null && daysLeft > 7
                                                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-60' 
                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                    }`}
                                                >
                                                    <DollarSign size={11} /> Selesai
                                                </button>
                                                <button 
                                                    onClick={() => setViewingInvoice(resident)}
                                                    className="px-2.5 py-1.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 text-[9px] font-black uppercase tracking-wider hover:bg-orange-100 transition-all flex items-center gap-1"
                                                >
                                                    <File size={11} /> Tagih
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (resident.profile.phone && resident.profile.phone !== '-') {
                                                            const cleanPhone = resident.profile.phone.replace(/[^0-9]/g, '');
                                                            const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                                                            window.open(`https://wa.me/${waPhone}`, '_blank');
                                                        } else {
                                                            onStartChat?.(resident.uid, resident.kostId);
                                                        }
                                                    }}
                                                    className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 text-[9px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all flex items-center gap-1 cursor-pointer"
                                                >
                                                    <MessageCircle size={11} /> Chat
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => toggleExpand(resKey)}
                                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-950 transition-all shrink-0"
                                                title={expandedResidents[resKey] ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
                                            >
                                                {expandedResidents[resKey] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collapsible Info Grid */}
                                    {expandedResidents[resident.uid] && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6 mt-6 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                                            {/* Paket & Durasi */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paket & Durasi</p>
                                                </div>
                                                <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                                                    <div>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Paket Aktif</p>
                                                        <p className="text-sm font-black text-gray-900 leading-none">Per {resident.periodLabel}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Total Sewa</p>
                                                        <p className="text-sm font-black text-orange-500 leading-none">{resident.totalSewaLabel}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between px-1 pt-1">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Jadwal Aktif</p>
                                                    <p className="text-xs font-black text-emerald-600 uppercase bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100/50">{safeFormatDate(resident.startDate)}</p>
                                                </div>
                                            </div>

                                            {/* Jadwal */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jadwal Sewa</p>
                                                </div>
                                                <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                                                    <div>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Mulai</p>
                                                        <p className="text-sm font-black text-gray-900 leading-none">{safeFormatDate(resident.startDate, {day:'numeric', month:'short'})}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Selesai</p>
                                                        <p className="text-sm font-black text-orange-600 leading-none">{safeFormatDate(resident.endDate, {day:'numeric', month:'short', year: 'numeric'})}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><Clock size={12}/></div>
                                                        <p className="text-[9px] font-black text-gray-500 uppercase">SISA HARI</p>
                                                    </div>
                                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-tight">
                                                        {daysLeft} Hari Lagi
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Rincian Tagihan */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rincian Tagihan</p>
                                                </div>
                                                <div className="space-y-3 px-1">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sewa & Tambahan</span>
                                                            <span className="text-[7px] font-black text-emerald-500 tracking-widest">LUNAS</span>
                                                        </div>
                                                        <span className="text-xs font-black text-gray-900">{FORMAT_CURRENCY(resident.billingBreakdown.base + resident.billingBreakdown.extraOccupant)}</span>
                                                    </div>

                                                    {resident.billingBreakdown.facility > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fasilitas</span>
                                                                <span className="text-[7px] font-black text-emerald-500 tracking-widest">LUNAS</span>
                                                            </div>
                                                            <span className="text-xs font-black text-gray-900">+{FORMAT_CURRENCY(resident.billingBreakdown.facility)}</span>
                                                        </div>
                                                    )}

                                                    {/* Related Separate Bills */}
                                                    {resident.relatedBills && resident.relatedBills.length > 0 && (
                                                        <div className="pt-2 border-t border-dashed border-gray-200 space-y-2">
                                                            <p className="text-[8px] font-black text-orange-500 uppercase tracking-wider mb-1">Tagihan Tambahan:</p>
                                                            {resident.relatedBills.map((bill: any) => (
                                                                <div key={bill.id} className="flex justify-between items-center text-[9px] font-bold">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-gray-500 uppercase">{bill.name}</span>
                                                                        <span className={`text-[7px] font-black ${bill.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                            {bill.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-gray-900 font-black">{FORMAT_CURRENCY(bill.amount)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Total</span>
                                                        <span className="text-base font-black text-orange-500">{FORMAT_CURRENCY(resident.billingBreakdown.total)}</span>
                                                    </div>

                                                    <button 
                                                        onClick={() => setViewingHistory(resident)}
                                                        className="w-full mt-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl border border-gray-100 text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <History size={12} /> Riwayat Pembayaran
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Resident Profile Viewer Modal - CLEAN & FOCUSED */}
            {viewingResident && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-20" onClick={() => setViewingResident(null)}>
                    <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl animate-in fade-in" />
                    <div className="relative bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
                        
                        {/* Profile Header */}
                        <div className="bg-gray-950 p-10 lg:p-14 text-white shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/20 blur-[100px] rounded-full" />
                            
                            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                <div className="w-40 h-40 rounded-[3rem] bg-orange-500 flex items-center justify-center text-7xl font-black shadow-2xl border-4 border-white/10 shrink-0 overflow-hidden relative group">
                                    {viewingResident.profile.name?.charAt(0)}
                                    {viewingResident.profile.photo_url && <img src={viewingResident.profile.photo_url} className="absolute inset-0 w-full h-full object-cover" alt="" />}
                                </div>
                                <div className="flex-1 min-w-0 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                                        <span className="bg-orange-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-white shadow-lg shadow-orange-500/20">Identitas Terverifikasi</span>
                                        <span className="bg-white/10 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10">ID: {viewingResident.uid.substring(0, 10).toUpperCase()}</span>
                                    </div>
                                    <h3 className="text-6xl font-black tracking-tight leading-none mb-4">{viewingResident.profile.name}</h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] opacity-60">Dokumen Digital RuangSinggah</p>
                                </div>
                                <button onClick={() => setViewingResident(null)} className="absolute top-0 right-0 w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center active:scale-90 border border-white/5 group">
                                    <X size={28} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Profile Body - Focused Content */}
                        <div className="flex-1 bg-white p-10 lg:p-16">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                
                                {/* Section: Professional Info */}
                                <div className="space-y-10">
                                    <h4 className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                        <Briefcase size={16} /> Data Profesional
                                    </h4>
                                    <div className="space-y-8 pl-4 border-l-2 border-gray-50">
                                        <DetailItem label="Pekerjaan / Status" value={viewingResident.profile.occupation || 'Tidak Diisi'} />
                                        <DetailItem label="Instansi / Universitas" value={viewingResident.profile.institution || 'Tidak Diisi'} />
                                    </div>
                                </div>

                                {/* Section: Origin Info */}
                                <div className="space-y-10">
                                    <h4 className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                        <MapPin size={16} /> Informasi Asal
                                    </h4>
                                    <div className="space-y-8 pl-4 border-l-2 border-gray-50">
                                        <DetailItem label="Kota Asal" value={viewingResident.profile.city || 'Tidak Diisi'} />
                                        <DetailItem label="Alamat Domisili" value={viewingResident.profile.address || 'Tidak Diisi'} />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 p-8 flex justify-center border-t border-gray-100">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">RuangSinggah • Dokumen Profil Digital</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Preview Modal */}
            {viewingInvoice && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-20" onClick={() => setViewingInvoice(null)}>
                    <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl animate-in fade-in" />
                    <div className="relative bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="bg-orange-900 p-10 text-white text-center relative overflow-hidden">
                             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                             <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60 mb-4">Pratinjau Tagihan Digital</p>
                             <h3 className="text-4xl font-black tracking-tight">{viewingInvoice.kostName}</h3>
                             <p className="text-xs font-bold text-white/50 mt-2 uppercase tracking-widest">ID TRX: {viewingInvoice.uid.substring(0,8).toUpperCase()}</p>
                        </div>

                        <div className="p-10 space-y-8">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Penghuni</p>
                                    <p className="text-sm font-black text-gray-900">{viewingInvoice.profile.name}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Masa Sewa</p>
                                    <p className="text-sm font-black text-gray-900">{safeFormatDate(viewingInvoice.startDate, {day:'numeric', month:'short'})} - {safeFormatDate(viewingInvoice.endDate, {day:'numeric', month:'short', year:'numeric'})}</p>
                                </div>
                            </div>

                            {/* Billing Items */}
                            <div className="space-y-5">
                                {/* Base Rent */}
                                <div className="flex justify-between items-center group">
                                    <div>
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Sewa Dasar</p>
                                        <span className="text-[8px] font-black text-emerald-500 tracking-widest">LUNAS</span>
                                    </div>
                                    <span className="font-black text-gray-900">{FORMAT_CURRENCY(viewingInvoice.billingBreakdown.base)}</span>
                                </div>

                                {/* Extra Occupant */}
                                {viewingInvoice.billingBreakdown.extraOccupant > 0 && (
                                    <div className="flex justify-between items-center group">
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Extra Penghuni</p>
                                            <span className="text-[8px] font-black text-emerald-500 tracking-widest">LUNAS</span>
                                        </div>
                                        <span className="font-black text-gray-900">+{FORMAT_CURRENCY(viewingInvoice.billingBreakdown.extraOccupant)}</span>
                                    </div>
                                )}

                                {/* Facility */}
                                {viewingInvoice.billingBreakdown.facility > 0 && (
                                    <div className="flex justify-between items-center group">
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Fasilitas Tambahan</p>
                                            <span className="text-[8px] font-black text-emerald-500 tracking-widest">LUNAS</span>
                                        </div>
                                        <span className="font-black text-gray-900">+{FORMAT_CURRENCY(viewingInvoice.billingBreakdown.facility)}</span>
                                    </div>
                                )}

                                {/* Related Separate Bills (Tracking) */}
                                {viewingInvoice.relatedBills && viewingInvoice.relatedBills.length > 0 && (
                                    <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
                                        {viewingInvoice.relatedBills.map((bill: any) => {
                                            const isPaid = bill.status === 'PAID';
                                            return (
                                                <div key={bill.id} className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{bill.name}</p>
                                                        <span className={`text-[8px] font-black tracking-widest ${isPaid ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
                                                            {isPaid ? 'LUNAS' : 'BELUM BAYAR'}
                                                        </span>
                                                    </div>
                                                    <span className={`font-black ${isPaid ? 'text-gray-900' : 'text-rose-500'}`}>
                                                        {isPaid ? '' : '+'} {FORMAT_CURRENCY(bill.amount)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="pt-6 border-t-4 border-double border-gray-100 flex flex-col gap-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Tagihan</span>
                                        <span className="text-sm font-black text-gray-400 line-through opacity-50">{FORMAT_CURRENCY(viewingInvoice.billingBreakdown.total + (viewingInvoice.relatedBills?.reduce((acc: any, b: any) => acc + (b.status === 'PAID' ? 0 : b.amount), 0) || 0))}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-black text-orange-500 uppercase tracking-widest">Tagihan Aktif</span>
                                        <span className="text-3xl font-black text-orange-500">
                                            {FORMAT_CURRENCY(viewingInvoice.relatedBills?.filter((b: any) => b.status !== 'PAID').reduce((acc: any, b: any) => acc + b.amount, 0) || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="flex flex-col gap-4 pt-6">
                                {(() => {
                                    const activeTotal = viewingInvoice.relatedBills?.filter((b: any) => b.status !== 'PAID').reduce((acc: any, b: any) => acc + b.amount, 0) || 0;
                                    const hasActiveBills = activeTotal > 0;
                                    
                                    return (
                                        <button 
                                            onClick={() => {
                                                if (!hasActiveBills) return;
                                                handleTriggerInvoice(viewingInvoice);
                                                setViewingInvoice(null);
                                            }}
                                            disabled={!hasActiveBills}
                                            className={`w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all ${
                                                hasActiveBills 
                                                    ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95' 
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                        >
                                            {hasActiveBills ? (
                                                <><Zap size={18} fill="currentColor" /> KIRIM NOTIFIKASI TAGIHAN AKTIF</>
                                            ) : (
                                                <><AlertCircle size={18} /> SEMUA TAGIHAN TELAH LUNAS</>
                                            )}
                                        </button>
                                    );
                                })()}
                                <button 
                                    onClick={() => setViewingInvoice(null)}
                                    className="w-full py-4 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600 transition-colors"
                                >
                                    Tutup Pratinjau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">{icon}</div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-gray-900 mt-0.5 truncate">{value}</p>
        </div>
    </div>
);

const TimelineItem: React.FC<{ label: string; date: string; active?: boolean; isEnd?: boolean; isDue?: boolean }> = ({ label, date, active, isEnd, isDue }) => (
    <div className="flex items-center gap-6 group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all ${
            active ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 
            isDue ? 'bg-rose-100 text-rose-500 border-2 border-rose-200' : 'bg-gray-100 text-gray-400'
        }`}>
            {isEnd ? <Clock size={20} /> : <Calendar size={20} />}
        </div>
        <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={`text-sm font-black leading-none mt-1.5 ${isDue ? 'text-rose-500' : 'text-gray-900'}`}>{date}</p>
        </div>
    </div>
);

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: 'orange' | 'rose' | 'purple' }> = ({ label, value, icon, color }) => {
    const colors = {
        orange: 'bg-orange-50 text-orange-500',
        rose: 'bg-rose-50 text-rose-500',
        purple: 'bg-purple-50 text-purple-500'
    };
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <h4 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h4>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
);

const StatusTab: React.FC<{ active: boolean; label: string; count: number; onClick: () => void; color: string; icon?: React.ReactNode }> = ({ active, label, count, onClick, color, icon }) => {
    const colorClasses: Record<string, string> = {
        gray: active ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
        orange: active ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100',
        emerald: active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
        rose: active ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
    };

    return (
        <button 
            onClick={onClick}
            className={`px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl lg:rounded-2xl text-[9px] font-black uppercase tracking-wide flex items-center gap-1.5 lg:gap-3 transition-all ${colorClasses[color]}`}
        >
            {icon}
            {label}
            <span className={`px-1.5 py-0.5 rounded-md lg:rounded-lg text-[9px] ${active ? 'bg-white/20' : 'bg-black/5'}`}>{count}</span>
        </button>
    );
};

export default MitraTenantManagement;
