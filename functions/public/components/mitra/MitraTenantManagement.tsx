import React, { useState, useMemo } from 'react';
import { 
    Users, Search, Filter, Calendar, Clock, ArrowRight, User, 
    MessageCircle, MoreHorizontal, ChevronRight, MapPin, Briefcase, 
    GraduationCap, ClipboardList, TrendingUp, AlertCircle
} from 'lucide-react';
import { FORMAT_CURRENCY } from '../../constants';
import { Kost } from '../../types';

interface MitraTenantManagementProps {
    tenancyData: any[];
    properties: Kost[];
    refreshData: () => void;
}

const MitraTenantManagement: React.FC<MitraTenantManagementProps> = ({ 
    tenancyData, 
    properties,
    refreshData 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProperty, setFilterProperty] = useState('all');
    const [viewingResident, setViewingResident] = useState<any | null>(null);

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
                    transactions: [],
                    startDate: null,
                    endDate: null,
                    status: 'active'
                };
            }

            groups[uid].transactions.push(trx);

            // Update dates based on earliest/latest
            const currentStart = trx.metadata?.startDate || trx.startDate;
            const currentEnd = trx.metadata?.endDate || trx.endDate;

            if (currentStart) {
                const sDate = new Date(currentStart);
                if (!groups[uid].startDate || sDate < new Date(groups[uid].startDate)) {
                    groups[uid].startDate = currentStart;
                }
            }

            if (currentEnd) {
                const eDate = new Date(currentEnd);
                if (!groups[uid].endDate || eDate > new Date(groups[uid].endDate)) {
                    groups[uid].endDate = currentEnd;
                }
            }
        });

        return Object.values(groups).filter(res => {
            const matchesSearch = res.profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                res.kostName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProperty = filterProperty === 'all' || res.kostId === filterProperty;
            return matchesSearch && matchesProperty;
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

    const calculateProgress = (start: string | null, end: string | null) => {
        if (!start || !end) return 0;
        const total = new Date(end).getTime() - new Date(start).getTime();
        const elapsed = Date.now() - new Date(start).getTime();
        return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    };

    const getRemainingDays = (end: string | null) => {
        if (!end) return null;
        const diff = new Date(end).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Penghuni</p>
                        <h4 className="text-2xl font-black text-gray-900">{stats.total} Orang</h4>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Segera Habis (7 Hari)</p>
                        <h4 className="text-2xl font-black text-gray-900">{stats.expiringSoon} Kamar</h4>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Riwayat Perpanjangan</p>
                        <h4 className="text-2xl font-black text-gray-900">{stats.recentExtensions} Kali</h4>
                    </div>
                </div>
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
                                        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-100">
                                            {resident.profile.photo_url ? (
                                                <img src={resident.profile.photo_url} className="w-full h-full object-cover rounded-2xl" alt="" />
                                            ) : (
                                                resident.profile.name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-black text-gray-900 tracking-tight text-lg line-clamp-1">{resident.profile.name}</h5>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{resident.roomType}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${isExpiring ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-500'}`}>
                                        {isExpiring ? 'Hampir Habis' : 'Aktif'}
                                    </div>
                                </div>

                                {/* Property Info */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <MapPin size={14} />
                                        <p className="text-xs font-bold truncate">{resident.kostName}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Calendar size={14} />
                                        <p className="text-xs font-bold">{resident.startDate} — {resident.endDate}</p>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Masa Sewa</p>
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
                                    <p className="text-[10px] font-black uppercase tracking-widest">Detail Penghuni</p>
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
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" />
                    <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="bg-gray-900 p-8 text-white shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-3xl bg-orange-500 flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/10 shrink-0">
                                    {viewingResident.profile.photo_url ? (
                                        <img src={viewingResident.profile.photo_url} className="w-full h-full object-cover rounded-2xl" alt="" />
                                    ) : (
                                        viewingResident.profile.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-orange-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">RESIDENT</span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-white/20`}>
                                            ID: {viewingResident.uid.substring(0, 8).toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tight truncate">{viewingResident.profile.name}</h3>
                                    <p className="text-sm text-white/50 font-bold truncate mt-1">{viewingResident.profile.email}</p>
                                </div>
                                <button onClick={() => setViewingResident(null)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center active:scale-90">
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10">
                            {/* Personal Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <InfoItem icon={<MessageCircle size={18} className="text-green-500" />} label="WhatsApp" value={viewingResident.profile.phone || '-'} />
                                <InfoItem icon={<User size={18} className="text-blue-500" />} label="Gender" value={viewingResident.profile.gender || '-'} />
                                <InfoItem icon={<Briefcase size={18} className="text-purple-500" />} label="Pekerjaan" value={viewingResident.profile.occupation || '-'} />
                                <InfoItem icon={<GraduationCap size={18} className="text-amber-500" />} label="Institusi" value={viewingResident.profile.institution || '-'} />
                            </div>

                            <hr className="border-gray-50" />

                            {/* Tenancy History */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-black text-gray-900 border-l-4 border-orange-500 pl-4 uppercase text-xs tracking-widest">Riwayat Transaksi</h4>
                                    <span className="text-[10px] font-black text-gray-400">{viewingResident.transactions.length} Records</span>
                                </div>
                                <div className="space-y-4">
                                    {viewingResident.transactions.map((trx: any) => (
                                        <div key={trx.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                                        trx.type === 'perpanjangan_sewa' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {trx.type === 'perpanjangan_sewa' ? 'Perpanjangan' : 'Booking Awal'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-gray-400">{new Date(trx.created_at).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                <p className="text-xs font-black text-gray-900 uppercase">{trx.metadata?.roomType || 'Standard'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1">{trx.metadata?.startDate} — {trx.metadata?.endDate}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-orange-600">{FORMAT_CURRENCY(trx.amount)}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{trx.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-gray-50 bg-gray-50/50 shrink-0">
                            <button 
                                onClick={() => {
                                    const waLink = `https://wa.me/${viewingResident.profile.phone}?text=${encodeURIComponent(`Halo ${viewingResident.profile.name}, saya pengelola ${viewingResident.kostName}. Terkait sewa kamar anda...`)}`;
                                    window.open(waLink, '_blank');
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                <MessageCircle size={20} fill="currentColor" />
                                Hubungi via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">{icon}</div>
        <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-gray-900 mt-0.5 break-all">{value}</p>
        </div>
    </div>
);

export default MitraTenantManagement;
