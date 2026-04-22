import React, { useState, useMemo } from 'react';
import { 
    Users, Search, Filter, Calendar, Clock, ArrowRight, User, 
    MessageCircle, MoreHorizontal, ChevronRight, MapPin, Briefcase, 
    GraduationCap, ClipboardList, TrendingUp, AlertCircle, Plus, DollarSign, ExternalLink, X, Home, Zap, RefreshCw
} from 'lucide-react';
import { FORMAT_CURRENCY } from '../../constants';
import { Kost } from '../../types';
import AddBillModal from './AddBillModal';

interface MitraTenantManagementProps {
    tenancyData: any[];
    properties: Kost[];
    refreshData: () => void;
    onViewUserProfile: (userData: any) => void;
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
    tenancyData, 
    properties,
    refreshData,
    onViewUserProfile
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProperty, setFilterProperty] = useState('all');
    const [viewingResident, setViewingResident] = useState<any | null>(null);
    const [showAddBillModal, setShowAddBillModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        // Artificial delay for feedback
        setTimeout(() => setIsRefreshing(false), 800);
    };

    // --- HELPERS ---
    const safeFormatDate = (dateStr: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', options);
    };

    const getRemainingDays = (end: string | null | undefined) => {
        if (!end) return null;
        const d = new Date(end);
        if (isNaN(d.getTime())) return null;
        const diff = d.getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // --- DATA AGGREGATION ---
    // Group transactions by User ID to show unique residents
    const residents = useMemo(() => {
        const groups: Record<string, any> = {};

        tenancyData.forEach(trx => {
            const uid = trx.user_id;
            if (!uid) return;

            if (!groups[uid]) {
                groups[uid] = {
                    uid,
                    profile: trx.user || trx.metadata || {},
                    kostId: trx.kost_id || trx.product_id,
                    kostName: trx.metadata?.kostName || trx.kost_name || 'Kost',
                    roomType: trx.metadata?.roomType || trx.room_type || '-',
                    occupantCount: trx.metadata?.occupantCount || 1,
                    periodLabel: trx.metadata?.periodLabel || trx.metadata?.period || '-',
                    transactions: [],
                    startDate: null,
                    endDate: null,
                    lastRenewalDate: null,
                    initialStartDate: null,
                    status: 'active',
                    pendingBills: 0,
                    lastRentAmount: 0,
                    hasRentalTransaction: false // Flag to ensure they are real tenants
                };
            }

            groups[uid].transactions.push(trx);

            const isPrimaryRent = ['kost_booking', 'perpanjangan_sewa', 'kost'].includes(trx.product_type);
            if (isPrimaryRent) {
                groups[uid].hasRentalTransaction = true;
            }

            // Sort transactions by date (Oldest first)
            const sortedTrx = [...groups[uid].transactions].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            // Initial Rent Transaction (Oldest)
            const initialRent = sortedTrx.find(t => t.product_type === 'kost_booking' || t.product_type === 'kost');
            if (initialRent) {
                groups[uid].initialStartDate = initialRent.metadata?.startDate || initialRent.startDate;
            }

            // Latest Rent Transaction (Latest perpanjangan or booking)
            const rentTrx = [...sortedTrx].reverse().find(t => 
                ['kost_booking', 'perpanjangan_sewa', 'kost'].includes(t.product_type) && 
                t.status?.toUpperCase() === 'PAID'
            );

            if (rentTrx) {
                groups[uid].lastRentAmount = rentTrx.amount;
                groups[uid].roomType = rentTrx.metadata?.roomType || groups[uid].roomType;
                groups[uid].periodLabel = rentTrx.metadata?.periodLabel || groups[uid].periodLabel;
            }

            // Latest Renewal
            const lastRenewal = [...sortedTrx].reverse().find(t => t.product_type === 'perpanjangan_sewa' && t.status?.toUpperCase() === 'PAID');
            if (lastRenewal) {
                groups[uid].lastRenewalDate = lastRenewal.created_at;
            }

            // Calculate overall pending bills (standalone only)
            const unpaidBills = sortedTrx.filter(t => 
                t.product_type === 'tagihan_ekstra' && 
                ['PENDING', 'AWAITING_PAYMENT'].includes(t.status?.toUpperCase())
            ).reduce((acc, t) => acc + (t.amount || 0), 0);
            
            groups[uid].pendingBills = unpaidBills;

            // Current Active Dates
            const currentStart = trx.metadata?.startDate || trx.startDate;
            const currentEnd = trx.metadata?.endDate || trx.endDate;

            if (currentStart && !isNaN(new Date(currentStart).getTime())) {
                const sDate = new Date(currentStart);
                if (!groups[uid].startDate || sDate < new Date(groups[uid].startDate)) {
                    groups[uid].startDate = currentStart;
                }
            }

            if (currentEnd && !isNaN(new Date(currentEnd).getTime())) {
                const eDate = new Date(currentEnd);
                if (!groups[uid].endDate || eDate > new Date(groups[uid].endDate)) {
                    groups[uid].endDate = currentEnd;
                }
            }

            // Status Logic: Only show active if end date hasn't passed
            const now = new Date();
            if (groups[uid].endDate) {
                const eDate = new Date(groups[uid].endDate);
                groups[uid].status = eDate < now ? 'expired' : 'active';
            }

            // Calculate current month of stay
            const startOfLease = groups[uid].initialStartDate || groups[uid].startDate;
            if (startOfLease && !isNaN(new Date(startOfLease).getTime())) {
                const start = new Date(startOfLease);
                const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
                groups[uid].currentMonth = Math.max(1, totalMonths);
            } else {
                groups[uid].currentMonth = 1;
            }

            // --- VIRTUAL BILLING ENGINE (SYNCED WITH MYKOST) ---
            const property = properties.find(p => p.id === groups[uid].kostId);
            groups[uid].totalOutstanding = 0;
            groups[uid].missedMonthsCount = 0;
            
            if (property?.additionalFeePrice > 0) {
                const startOfLease = groups[uid].initialStartDate || groups[uid].startDate;
                if (startOfLease && !isNaN(new Date(startOfLease).getTime())) {
                    const start = new Date(startOfLease);
                    const now = new Date();
                    
                    // Iterate through each month from the SECOND month of stay
                    // Month 1 is assumed to be included in the initial booking transaction
                    let iter = new Date(start.getFullYear(), start.getMonth() + 1, 1);
                    const endIter = new Date(now.getFullYear(), now.getMonth(), 1);
                    
                    let billingStatus = 'lunas';
                    let hasMissing = false;

                    while (iter <= endIter) {
                        const isPaid = sortedTrx.some(t => {
                            if (t.product_type !== 'tagihan_ekstra') return false;
                            const d = new Date(t.created_at || t.startDate);
                            return d.getMonth() === iter.getMonth() && 
                                   d.getFullYear() === iter.getFullYear() && 
                                   ['PAID', 'SUCCESS', 'berhasil'].includes(t.status?.toUpperCase());
                        });

                        if (!isPaid) {
                            hasMissing = true;
                            groups[uid].missedMonthsCount++;
                            
                            // Calculate Penalty (5% per day after 10 days)
                            // Match MyKost.tsx logic: Due Date is 10 days after 1st of month
                            const billCreatedAt = new Date(iter.getFullYear(), iter.getMonth(), 1, 0, 0, 0);
                            const billDueDate = new Date(billCreatedAt);
                            billDueDate.setDate(billDueDate.getDate() + 10);
                            
                            if (now > billDueDate) {
                                const diffDays = Math.floor((now.getTime() - billDueDate.getTime()) / (1000 * 60 * 60 * 24));
                                const penalty = property.additionalFeePrice * 0.05 * diffDays;
                                groups[uid].totalOutstanding += (property.additionalFeePrice + penalty);
                            } else {
                                groups[uid].totalOutstanding += property.additionalFeePrice;
                            }
                        }
                        
                        // Move to next month
                        iter.setMonth(iter.getMonth() + 1);
                    }

                    if (hasMissing) {
                        billingStatus = 'perlu_ditagih';
                    }
                    groups[uid].billingStatus = billingStatus;
                } else {
                    groups[uid].billingStatus = 'not_needed';
                }
            } else {
                groups[uid].billingStatus = 'not_needed';
            }
        });

        return Object.values(groups).filter(res => {
            const matchesSearch = res.profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                res.kostName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProperty = filterProperty === 'all' || res.kostId === filterProperty;
            
            // CRITICAL: A legitimate resident must have a rental transaction (not just bills)
            return res.hasRentalTransaction && matchesSearch && matchesProperty;
        });
    }, [tenancyData, searchQuery, filterProperty]);

    const stats = useMemo(() => {
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        const expiringSoon = residents.filter(r => {
            if (!r.endDate) return false;
            const eDate = new Date(r.endDate);
            return eDate > now && eDate <= next7Days;
        }).length;

        return {
            total: residents.length,
            expiringSoon,
            recentExtensions: tenancyData.filter(t => t.type === 'perpanjangan_sewa' || t.product_type === 'perpanjangan_sewa').length
        };
    }, [residents, tenancyData]);

    // calculateProgress moves here
    const calculateProgress = (start: string | null | undefined, end: string | null | undefined) => {
        if (!start || !end) return 0;
        const sDate = new Date(start);
        const eDate = new Date(end);
        if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return 0;
        
        const total = eDate.getTime() - sDate.getTime();
        const elapsed = Date.now() - sDate.getTime();
        if (total <= 0) return 100;
        return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<Users size={24} />} color="orange" label="Total Penghuni" value={`${stats.total} Orang`} />
                <StatCard icon={<Clock size={24} />} color="rose" label="Segera Habis (7 Hari)" value={`${stats.expiringSoon} Kamar`} />
                <StatCard icon={<TrendingUp size={24} />} color="purple" label="Riwayat Perpanjangan" value={`${stats.recentExtensions} Kali`} />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama penghuni atau kost..."
                        className="w-full h-12 bg-gray-50 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all border border-transparent focus:border-orange-500/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="md:w-64 relative">
                    <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select 
                        className="w-full h-12 bg-gray-50 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all border border-transparent focus:border-orange-500/20 appearance-none"
                        value={filterProperty}
                        onChange={(e) => setFilterProperty(e.target.value)}
                    >
                        <option value="all">Semua Properti</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm ${isRefreshing ? 'opacity-50' : 'active:scale-90'}`}
                    title="Segarkan Data"
                >
                    <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Inhabitants List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {residents.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Users size={32} />
                        </div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Belum ada penghuni aktif</p>
                        <p className="text-xs text-gray-400 mt-2">Data akan muncul setelah pesanan diselesaikan (PAID)</p>
                    </div>
                ) : (
                    residents.map((resident) => {
                        const progress = calculateProgress(resident.startDate, resident.endDate);
                        const daysLeft = getRemainingDays(resident.endDate);
                        const isExpiring = daysLeft !== null && daysLeft <= 7;

                        return (
                            <div 
                                key={resident.uid}
                                className="group bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
                                onClick={() => setViewingResident(resident)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-100 relative overflow-hidden">
                                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                {resident.profile.name?.charAt(0) || '?'}
                                            </span>
                                            {resident.profile.photo_url && (
                                                <img 
                                                    src={resident.profile.photo_url} 
                                                    className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300" 
                                                    alt="" 
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-black text-gray-900 tracking-tight text-lg line-clamp-1">{resident.profile.name}</h5>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{resident.roomType}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${isExpiring ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-500'}`}>
                                            {isExpiring ? 'Hampir Habis' : 'Aktif'}
                                        </div>
                                        <BillingStatusBadge status={resident.billingStatus} />
                                    </div>
                                </div>

                                {/* Property Info */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <MapPin size={14} className="text-orange-500" />
                                        <p className="text-xs font-bold truncate">{resident.kostName}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Calendar size={14} className="text-orange-500" />
                                        <p className="text-xs font-bold">{safeFormatDate(resident.startDate, { day: 'numeric', month: 'short', year: 'numeric' })} — {safeFormatDate(resident.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sisa Sewa</p>
                                        <p className={`text-xs font-black ${isExpiring ? 'text-rose-500' : 'text-orange-500'}`}>
                                            {daysLeft !== null ? (daysLeft <= 0 ? 'Habis' : `${daysLeft} Hari Lagi`) : '-'}
                                        </p>
                                    </div>
                                    <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${isExpiring ? 'bg-rose-500' : 'bg-orange-500'}`} 
                                            style={{ width: `${progress}%` }} 
                                        />
                                    </div>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gray-900 translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-between text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Lengkap & Tagihan</p>
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Resident Detail Modal */}
            {viewingResident && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setViewingResident(null)}>
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" />
                    <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="bg-gray-900 p-8 lg:p-10 text-white shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                            
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-orange-500 flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white/10 shrink-0 relative overflow-hidden group">
                                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {viewingResident.profile.name?.charAt(0) || '?'}
                                    </span>
                                    {viewingResident.profile.photo_url && (
                                        <img 
                                            src={viewingResident.profile.photo_url} 
                                            className="absolute inset-0 w-full h-full object-cover z-10" 
                                            alt="" 
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="bg-orange-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest text-white">PENGHUNI</span>
                                        <span className="bg-blue-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest text-white">Bulan ke-{viewingResident.currentMonth}</span>
                                        <BillingStatusBadge status={viewingResident.billingStatus} />
                                        <span className="bg-white/10 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-white/10">ID: {viewingResident.uid.substring(0, 8).toUpperCase()}</span>
                                        <button 
                                            onClick={() => onViewUserProfile(viewingResident.profile)}
                                            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-blue-500/30 transition-all flex items-center gap-1"
                                        >
                                            <ExternalLink size={10} /> Lihat Profil Lengkap
                                        </button>
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tight truncate">{viewingResident.profile.name}</h3>
                                    <p className="text-sm text-white/50 font-bold truncate mt-1 flex items-center gap-2">
                                        <MessageCircle size={14} /> {viewingResident.profile.phone} 
                                        <span className="opacity-30">•</span>
                                        {viewingResident.profile.email}
                                    </p>
                                </div>
                                <button onClick={() => setViewingResident(null)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center active:scale-90 border border-white/10 shrink-0">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/30">
                            <div className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
                                {/* Col 1: Tenancy Details & Financials */}
                                <div className="lg:col-span-2 space-y-8">
                                    
                                    {/* Rent Status Card */}
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col md:flex-row gap-8">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-gray-900 border-l-4 border-orange-500 pl-4 uppercase text-xs tracking-widest">Detail Hunian</h4>
                                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">Sewa Aktif</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <InfoItem icon={<Home size={18} className="text-orange-500" />} label="Nama Kost" value={viewingResident.kostName} />
                                                <InfoItem icon={<ClipboardList size={18} className="text-blue-500" />} label="Jenis Kamar" value={viewingResident.roomType} />
                                                <InfoItem icon={<Users size={18} className="text-purple-500" />} label="Jumlah Penghuni" value={`${viewingResident.occupantCount} Orang`} />
                                                <InfoItem icon={<TrendingUp size={18} className="text-amber-500" />} label="Paket Sewa" value={viewingResident.periodLabel} />
                                            </div>
                                        </div>
                                        <div className="md:w-px bg-gray-100" />
                                        <div className="md:w-64 space-y-6">
                                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Rincian Keuangan</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                     <span className="text-[10px] font-bold text-gray-400 uppercase">Tunggakan Fasilitas</span>
                                                     <span className={`text-xs font-black ${viewingResident.totalOutstanding > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                         {FORMAT_CURRENCY(viewingResident.totalOutstanding)}
                                                         {viewingResident.missedMonthsCount > 0 && ` (${viewingResident.missedMonthsCount} Bln)`}
                                                     </span>
                                                 </div>
                                                 <hr className="border-dashed border-gray-200" />
                                                 <div className="flex justify-between items-center pt-1">
                                                     <span className="text-[10px] font-black text-gray-900 uppercase">Estimasi Total</span>
                                                     <span className="text-sm font-black text-orange-600">{FORMAT_CURRENCY(viewingResident.lastRentAmount + viewingResident.totalOutstanding)}</span>
                                                 </div>
                                            </div>
                                            <button 
                                                onClick={() => setShowAddBillModal(true)}
                                                className="w-full h-11 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                                            >
                                                <Plus size={14} strokeWidth={3} /> Tagih Biaya Mandiri
                                            </button>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                                        <h4 className="font-black text-gray-900 border-l-4 border-orange-500 pl-4 uppercase text-xs tracking-widest mb-8">Timeline Sewa</h4>
                                        <div className="relative">
                                            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-50 rounded-full" />
                                            <div className="space-y-10 relative">
                                                <TimelineItem 
                                                    active={true}
                                                    label="Tanggal Masuk Pertama" 
                                                    date={safeFormatDate(viewingResident.initialStartDate)}
                                                />
                                                {viewingResident.lastRenewalDate && (
                                                    <TimelineItem 
                                                        active={true}
                                                        label="Perpanjangan Terakhir" 
                                                        date={safeFormatDate(viewingResident.lastRenewalDate)}
                                                    />
                                                )}
                                                <TimelineItem 
                                                    label="Perpanjangan Selanjutnya" 
                                                    date={safeFormatDate(viewingResident.endDate)} 
                                                    isEnd={true}
                                                    isDue={getRemainingDays(viewingResident.endDate)! <= 7}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Transactions & Messages */}
                                <div className="space-y-8">
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Riwayat Transaksi</h4>
                                            <span className="text-[10px] font-black text-gray-300">{viewingResident.transactions.length} Records</span>
                                        </div>
                                        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2">
                                            {viewingResident.transactions.map((trx: any) => (
                                                <div key={trx.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                                            trx.product_type === 'perpanjangan_sewa' ? 'bg-purple-100 text-purple-600' : 
                                                            trx.product_type === 'tagihan_ekstra' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {trx.product_type === 'perpanjangan_sewa' ? 'Perpanjangan' : 
                                                             trx.product_type === 'tagihan_ekstra' ? 'Biaya Tambahan' : 'Sewa Awal'}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-gray-400">{safeFormatDate(trx.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-900 uppercase truncate">
                                                        {trx.product_type === 'tagihan_ekstra' ? (trx.metadata?.billName || 'Biaya Lainnya') : (trx.metadata?.roomType || 'Sewa Kamar')}
                                                    </p>
                                                    <div className="flex justify-between items-end mt-2">
                                                        <span className={`text-[8px] font-bold uppercase ${trx.status?.toUpperCase() === 'PAID' ? 'text-green-500' : 'text-orange-500'}`}>
                                                            {trx.status}
                                                        </span>
                                                        <span className="text-xs font-black text-gray-900">{FORMAT_CURRENCY(trx.amount)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const waLink = `https://wa.me/${viewingResident.profile.phone}?text=${encodeURIComponent(`Halo ${viewingResident.profile.name}, saya pengelola ${viewingResident.kostName}. Terkait sewa kamar anda...`)}`;
                                                window.open(waLink, '_blank');
                                            }}
                                            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                                        >
                                            <MessageCircle size={18} fill="currentColor" />
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Modal */}
            {showAddBillModal && viewingResident && (
                <AddBillModal 
                    resident={viewingResident}
                    property={properties.find(p => p.id === viewingResident.kostId)}
                    onClose={() => setShowAddBillModal(false)}
                    onSuccess={() => {
                        setShowAddBillModal(false);
                        refreshData();
                        alert('Tagihan tambahan berhasil dikirim ke penghuni.');
                    }}
                />
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

export default MitraTenantManagement;
