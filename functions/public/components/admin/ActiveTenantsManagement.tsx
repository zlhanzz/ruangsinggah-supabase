
import React, { useState, useEffect, useMemo } from 'react';
import { AdminTransaction, updateTransactionStatus, deleteTransaction, getAdminProperties, BasicPropertyInfo, syncResidentStatus, deleteResidentStatus } from '../../adminService';
import { supabase } from '../../supabase';
import { FORMAT_CURRENCY } from '../../constants';
import { getCurrentDate, parseDateSafely, calculateDaysRemaining } from '../../utils/timeUtils';
import { Search, User, Home, Calendar, Clock, MessageCircle, ExternalLink, Info, Trash2, RefreshCcw, History } from 'lucide-react';
import PaymentHistoryModal from '../PaymentHistoryModal';

interface ActiveTenantsManagementProps {
    residentStatus: any[];
    rentTransactions?: any[];
    refreshData: () => void;
    loading: boolean;
}

const ActiveTenantsManagement: React.FC<ActiveTenantsManagementProps> = ({
    residentStatus,
    rentTransactions = [],
    refreshData,
    loading
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingProfile, setViewingProfile] = useState<any | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
    const [viewingHistory, setViewingHistory] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [userProperties, setUserProperties] = useState<BasicPropertyInfo[]>([]);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const props = await getAdminProperties();
                setUserProperties(props);
            } catch (err) {
                console.error("Gagal memuat properti:", err);
            }
        };
        fetchProperties();
    }, []);

    // --- HELPERS ---




    const formatResident = (r: any) => {
        const u = r.user || {};
        const p = r.property || {};
        const t = r.last_transaction || {};
        const meta = t.metadata || {};
        const rMeta = r.metadata || {};
        
        return {
            id: r.id,
            name: u.full_name || u.name || rMeta.userName || 'Penyewa',
            email: u.email,
            phone: u.phone,
            photoURL: u.photo_url,
            item: p.title || rMeta.kostName || 'Sewa Kost',
            roomType: r.room_type || '-',
            amount: Number(t.amount || rMeta.amount || 0),
            paymentType: (t.payment_method || '').toLowerCase().includes('transfer') ? 'transfer' : (meta.isManualEntry ? 'manual' : 'gateway'),
            invoiceId: t.pakasir_order_id || `TRX-${t.id?.substring(0,8).toUpperCase() || (r.last_transaction_id ? r.last_transaction_id.substring(0,8).toUpperCase() : 'NEW')}`,
            startDate: r.start_date,
            endDate: r.end_date,
            totalMonths: r.total_months || 0,
            userId: r.user_id,
            kostId: r.kost_id,
            occupantsCount: Number(meta.occupants) || 1,
            // Profile
            occupation: u.occupation || '-',
            institution: u.institution || '-',
            gender: u.gender || '-',
            city: u.city || u.origin_city || '-',
            sosmed: u.sosmed || '-',
            emergencyContact: u.emergency_contact || '-',
            profileAddress: u.address || '-',
            // Calculation helpers
            basePrice: Number(meta.basePrice) || (Number(t.amount || 0) - (Number(meta.extraPersonFee) || 0) - (Number(meta.facilityAmount || meta.additionalFeePrice || meta.facilityFee) || 0) - (Number(meta.platformFee) || 0)),
            facilityAmount: Number(meta.facilityAmount || meta.additionalFeePrice || meta.facilityFee) || 0,
            facilityName: meta.additionalFeeName || meta.facilityName || 'Fasilitas/Layanan',
            extraPersonFee: Number(meta.extraPersonFee) || 0,
            platformFee: Number(meta.platformFee) || 0,
            relatedBills: rentTransactions.filter(rt => 
                (rt.type === 'tagihan_ekstra' || rt.product_type === 'tagihan_ekstra') && 
                (rt.metadata?.originalTransactionId === r.last_transaction_id || rt.metadata?.original_transaction_id === r.last_transaction_id)
            ).map(rb => ({
                id: rb.id,
                name: rb.metadata?.bill_name || 'Tagihan Fasilitas',
                amount: Number(rb.amount),
                status: (rb.status || 'PENDING').toUpperCase(),
                date: new Date(rb.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
            })),
            // Pass through the full resident_status metadata so UI can read paketSewa etc.
            metadata: { ...rMeta, ...meta }
        };
    };

    const activeTenants = useMemo(() => {
        if (!residentStatus) return [];
        
        return residentStatus.filter(r => {
            const matchesSearch = 
                (r.user?.name || r.user?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.property?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesSearch;
        }).sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
    }, [residentStatus, searchQuery]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!window.confirm(`Ubah status tagihan ini menjadi ${newStatus}?`)) return;
        setIsSubmitting(true);
        try {
            await updateTransactionStatus(id, newStatus);
            alert('Status tagihan berhasil diperbarui');
            refreshData();
        } catch (error: any) {
            alert('Gagal memperbarui: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSyncAll = async () => {
        if (!window.confirm('Sinkronisasi akan memeriksa seluruh transaksi LUNAS dan memastikan datanya masuk ke tabel Penghuni Aktif. Lanjutkan?')) return;
        setIsSyncing(true);
        try {
            const { data: trxs } = await supabase.from('transactions')
                .select('id')
                .in('product_type', ['rent', 'kost_booking', 'perpanjangan_sewa', 'property', 'kost'])
                .eq('status', 'PAID');
            
            if (trxs && trxs.length > 0) {
                for (const t of trxs) {
                    await syncResidentStatus(t.id);
                }
            }
            alert('Sinkronisasi data berhasil.');
            refreshData();
        } catch (err: any) {
            alert('Gagal sinkron: ' + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteResident = async (residentId: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin mengeluarkan (check-out) ${name} dari kost ini? Data ini akan dihapus permanen dari daftar penyewa aktif.`)) return;
        
        setIsSubmitting(true);
        try {
            await deleteResidentStatus(residentId);
            alert(`${name} berhasil dikeluarkan.`);
            refreshData();
        } catch (err: any) {
            console.error("[CHECKOUT] Delete failed:", err);
            alert("Gagal mengeluarkan penghuni: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWhatsApp = (trx: any) => {
        if (!trx.phone) return alert('Nomor HP tidak tersedia');
        const cleanPhone = trx.phone.replace(/\D/g, '');
        const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
        const days = calculateDaysRemaining(trx.endDate);
        const msg = `Halo Kak ${trx.name}, Saya Admin RuangSinggah. Menginfokan masa huni Kakak di ${trx.item} (${trx.roomType}) tersisa ${days} hari lagi. Semoga nyaman ya Kak!`;
        window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Database Penyewa Aktif</h2>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-3 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Seluruh Penghuni RuangSinggah saat ini
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penghuni Aktif</p>
                        <p className="text-xl font-black text-gray-900">{activeTenants.length}</p>
                    </div>
                    <button 
                        onClick={handleSyncAll} 
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Data
                    </button>
                    <button onClick={refreshData} className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 transition-all">
                        <svg className={`w-5 h-5 ${loading || isSubmitting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Cari nama penyewa atau nama kost..."
                    className="w-full pl-16 pr-6 py-5 bg-white border border-transparent rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 shadow-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Banner Info */}
            <div className="bg-purple-50/50 border border-orange-100 rounded-2xl p-4 flex gap-3 mb-2">
                <Info className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-sm font-medium text-orange-900 leading-relaxed">
                    Halaman ini menampilkan <strong>seluruh penghuni aktif</strong> di semua properti. Gunakan menu ini untuk memantau detail tagihan, durasi huni, dan profil penyewa secara lengkap.
                </p>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 gap-6">
                {activeTenants.length === 0 ? (
                    <div className="bg-white border text-center border-gray-100 rounded-[2.5rem] p-20 shadow-sm">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Tidak ada penyewa aktif yang ditemukan.</p>
                    </div>
                ) : (
                    activeTenants.map((rawResident) => {
                        const resident = formatResident(rawResident);
                        const daysLeft = calculateDaysRemaining(resident.endDate);
                        const isGrace = daysLeft <= 7;

                        return (
                            <div key={resident.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl hover:shadow-orange-500/5 transition-all group/card relative overflow-hidden">
                                {/* Left Section: Profile */}
                                <div className="shrink-0 flex flex-col items-center gap-3">
                                    <div 
                                        onClick={() => setViewingProfile(resident)}
                                        className="relative w-24 h-24 rounded-[2rem] bg-orange-500 flex items-center justify-center text-white text-3xl font-black shadow-lg overflow-hidden group/avatar transition-transform hover:scale-105 cursor-pointer"
                                    >
                                        {resident.name?.charAt(0).toUpperCase()}
                                        {resident.photoURL && <img src={resident.photoURL} className="absolute inset-0 w-full h-full object-cover z-10" alt="" />}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20 font-black uppercase">Profile</div>
                                    </div>
                                    <div className="text-center cursor-pointer" onClick={() => setViewingProfile(resident)}>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight line-clamp-1 hover:text-orange-500 transition-colors">{resident.name}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">ID: {resident.userId?.substring(0,8)}</p>
                                    </div>
                                </div>

                                {/* Center Section: Content */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-black tracking-widest uppercase">{resident.invoiceId}</span>
                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${resident.paymentType === 'gateway' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                    {resident.paymentType === 'gateway' ? '⚡ Otomatis' : '✅ Manual/Cash'}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{resident.item}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 text-[10px] font-black uppercase flex items-center gap-1.5">
                                                    <User className="w-3 h-3" /> {resident.occupantsCount} Orang
                                                </div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                    Status: <span className={
                                                        daysLeft < 0 ? 'text-red-500' :
                                                        isGrace ? 'text-orange-500 animate-pulse' : 
                                                        'text-emerald-500'
                                                    }>
                                                        {daysLeft < 0 ? 'SUDAH HABIS' : isGrace ? 'Masa Tenggang' : 'Sewa Aktif'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                            <p className="text-2xl font-black text-orange-500 tracking-tight">{FORMAT_CURRENCY(resident.amount)}</p>
                                            <div className="flex flex-col gap-2 mt-2">
                                                <button onClick={() => setViewingInvoice(resident)} className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-all uppercase">📜 Lihat Invoice</button>
                                                <button 
                                                    onClick={() => handleDeleteResident(resident.id, resident.name, resident.userId, resident.kostId)} 
                                                    disabled={isSubmitting}
                                                    className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 transition-all uppercase flex items-center justify-center gap-1.5"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Check-out
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-6 bg-gray-50/50 rounded-[2rem] px-6 border border-gray-100/50">
                                        {/* Paket & Durasi */}
                                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paket & Durasi</p>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Sewa Terakhir</p>
                                                        <p className="text-sm font-black text-gray-900">{resident.roomType}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Total Masa Huni</p>
                                                        <p className="text-sm font-black text-orange-500">{resident.totalMonths} Bulan</p>
                                                    </div>
                                                </div>

                                                {/* PAKET SEWA - Paket yang sedang berjalan saat ini */}
                                                <div className="flex items-center justify-between bg-orange-50/60 px-3 py-2 rounded-xl border border-orange-100">
                                                    <p className="text-[9px] text-orange-400 font-bold uppercase">Paket Sewa Aktif</p>
                                                    <p className="text-[10px] font-black text-orange-600">
                                                        {(() => {
                                                            const meta = resident.metadata || {};
                                                            // Priority: from last sync metadata, then from formatResident
                                                            const fromMeta = meta.paketSewa;
                                                            if (fromMeta) return fromMeta;
                                                            // Fallback: reconstruct from extensionPeriod or duration
                                                            const dur = Number(meta.extensionPeriod || meta.duration || 1);
                                                            return `${dur} Bulan`;
                                                        })()}
                                                    </p>
                                                </div>

                                                <div className="pt-2 border-t border-gray-50">
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Jadwal Aktif</p>
                                                    <div className="px-2 py-1 bg-green-50 rounded-lg border border-green-100 inline-block">
                                                        <p className="text-[10px] font-black text-green-700">
                                                            Mulai: {new Date(resident.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Jadwal */}
                                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sisa Masa Sewa</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Berakhir Pada</p>
                                                    <p className="text-xs font-black text-orange-600">{new Date(resident.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3"/> Hitung Mundur</p>
                                                <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${isGrace ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {daysLeft} Hari Lagi
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rincian Tagihan */}
                                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Terakhir</p>
                                            <div className="space-y-2">
                                                 <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                                     <span className="text-gray-400">Sewa & Tambahan (Penghuni)</span>
                                                     <span className="text-gray-900">{FORMAT_CURRENCY(resident.basePrice + resident.extraPersonFee)}</span>
                                                 </div>

                                                 {resident.facilityAmount > 0 && (
                                                     <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                                         <span className="text-gray-400">{resident.facilityName}</span>
                                                         <span className="text-emerald-600">+{FORMAT_CURRENCY(resident.facilityAmount)}</span>

                                                    </div>
                                                )}

                                                 {resident.platformFee > 0 && (
                                                     <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                                         <span className="text-gray-400">Biaya Layanan</span>
                                                         <span className="text-emerald-600">+{FORMAT_CURRENCY(resident.platformFee)}</span>
                                                     </div>
                                                 )}

                                                 <div className="pt-3 mt-1 border-t border-gray-100 flex justify-between items-center">
                                                    <span className="text-[11px] font-black text-orange-500 uppercase tracking-wider">Total</span>
                                                    <span className="text-sm font-black text-orange-500">{FORMAT_CURRENCY(resident.amount)}</span>
                                                </div>

                                                <button 
                                                    onClick={() => setViewingHistory(resident)}
                                                    className="w-full mt-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                >
                                                    <History size={14} /> Lihat Riwayat Pembayaran
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Profile Modal */}
            {viewingProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingProfile(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-orange-900 p-10 text-white relative">
                            <button onClick={() => setViewingProfile(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="relative w-20 h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center text-white text-3xl font-black overflow-hidden shadow-xl border-4 border-white/10">
                                    {viewingProfile.name?.charAt(0).toUpperCase()}
                                    {viewingProfile.photoURL && <img src={viewingProfile.photoURL} alt="" className="absolute inset-0 w-full h-full object-cover z-10" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black tracking-widest uppercase opacity-50 mb-1">Informasi Lengkap Penyewa</p>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">{viewingProfile.name}</h3>
                                    <p className="text-sm opacity-60 font-bold">{viewingProfile.email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 space-y-8 overflow-y-auto">
                            {/* Primary Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <DetailItem label="WhatsApp" value={viewingProfile.phone} />
                                <DetailItem label="Pekerjaan" value={viewingProfile.occupation || 'Belum diisi'} />
                                <DetailItem label="Instansi" value={viewingProfile.institution || '-'} />
                                <DetailItem label="Jenis Kelamin" value={viewingProfile.gender || '-'} />
                                <DetailItem label="Kota Asal" value={viewingProfile.city || viewingProfile.originCity || '-'} />
                                <DetailItem label="Sosial Media" value={viewingProfile.sosmed || '-'} />
                            </div>

                            {/* Registered Occupants */}
                            {viewingProfile.occupantsCount > 1 && (
                                <div className="pt-6 border-t border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Daftar Penghuni Terdaftar ({viewingProfile.occupantsCount})</p>
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                        <p className="text-sm font-bold text-gray-900">{viewingProfile.name} (Utama)</p>
                                        {/* Display others if stored in metadata */}
                                        <p className="text-xs text-gray-400 italic">Data penghuni tambahan diverifikasi saat check-in</p>
                                    </div>
                                </div>
                            )}

                            {/* Secondary Info */}
                            <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-8">
                                <DetailItem label="Kontak Darurat" value={viewingProfile.emergencyContact || '-'} />
                                <DetailItem label="Alamat Profil" value={viewingProfile.profileAddress || '-'} />
                            </div>
                        </div>
                        <div className="p-10 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button onClick={() => window.open(`https://wa.me/${viewingProfile.phone}`, '_blank')} className="flex-1 py-4 bg-emerald-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">Chat WhatsApp</button>
                            <button onClick={() => setViewingProfile(null)} className="px-8 py-4 bg-white text-gray-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border border-gray-200 active:scale-95 transition-all">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal (Simplified) */}
            {viewingInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setViewingInvoice(null)}>
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-orange-900 p-10 text-white text-center">
                            <p className="text-xs font-black tracking-widest uppercase opacity-60 mb-2">Ringkasan Invoice Aktif</p>
                            <h3 className="text-3xl font-black tracking-tight">{viewingInvoice.invoiceId}</h3>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="flex justify-between border-b border-gray-100 pb-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Tenant</span>
                                <span className="text-sm font-black text-gray-900">{viewingInvoice.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Masa Huni</span>
                                <span className="text-sm font-black text-gray-900">{new Date(viewingInvoice.startDate).toLocaleDateString()} - {new Date(viewingInvoice.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="pt-6 flex justify-between items-center">
                                <span className="text-lg font-black text-orange-500 uppercase tracking-widest">Total Bayar</span>
                                <span className="text-3xl font-black text-orange-500">{FORMAT_CURRENCY(viewingInvoice.amount)}</span>
                            </div>
                        </div>
                        <div className="p-10 pt-0">
                            <button onClick={() => setViewingInvoice(null)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Tutup Pratinjau</button>
                        </div>
                    </div>
                </div>
            )}
            {viewingHistory && (
                <PaymentHistoryModal 
                    userId={viewingHistory.userId}
                    kostId={viewingHistory.kostId}
                    residentName={viewingHistory.name}
                    onClose={() => setViewingHistory(null)}
                />
            )}
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
);

export default ActiveTenantsManagement;
