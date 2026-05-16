import React, { useState, useEffect, useMemo } from 'react';
import { AdminTransaction, updateTransactionStatus, deleteTransaction, deleteTransactions, getAdminProperties, BasicPropertyInfo } from '../../adminService';
import { supabase } from '../../supabase';
import { FORMAT_CURRENCY } from '../../constants';
import { getCurrentDate, calculateDaysRemaining, parseDateSafely } from '../../utils/timeUtils';
import { X, Clock, CreditCard, Calendar, CheckCircle2, FileText, History, Info, User, Trash2, Search, Filter, ArrowRight, Home, RefreshCcw, Zap, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import PaymentHistoryModal from '../PaymentHistoryModal';

interface ExtensionTransactionManagementProps {
    rentTransactions: AdminTransaction[];
    residentStatus?: any[];
    isAdmin: boolean;
    uid?: string;
    refreshData: () => void;
}

const ExtensionTransactionManagement: React.FC<ExtensionTransactionManagementProps> = ({
    rentTransactions,
    residentStatus = [],
    isAdmin,
    uid,
    refreshData
}) => {
    const [rentFilter, setRentFilter] = useState<'all' | 'grace_period' | 'success' | 'no_extension'>('all');
    const [selectedRentTrxIds, setSelectedRentTrxIds] = useState<string[]>([]);
    const [viewingHistory, setViewingHistory] = useState<{ userId: string, kostId: string, name: string } | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectingTrxId, setRejectingTrxId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const formatRentTrx = (t: any) => {
        const meta = t.metadata || {};
        const userId = t.user_id;
        const kostId = t.kost_id || meta.kostId || t.product_id;
        const roomType = t.room_type || meta.roomType || meta.item || '-';

        const resident = residentStatus.find(r => 
            r.user_id === userId && 
            r.kost_id === kostId && 
            (roomType === '-' || r.room_type === roomType || r.room_type?.includes(roomType) || roomType.includes(r.room_type || ''))
        );

        return {
            id: t.id,
            name: t.user?.name || meta.tenantName || meta.name || 'Penyewa',
            photoURL: t.user?.photo_url || meta.photoURL,
            item: meta.kostName || meta.item || t.product_type || 'Perpanjangan Sewa',
            roomType: roomType,
            amount: Number(t.amount || 0),
            status: (t.status || '').toUpperCase(),
            startDate: resident?.start_date || meta.startDate || t.move_in_date,
            endDate: resident?.end_date || meta.endDate || t.end_date,
            userId: userId,
            kostId: kostId,
            paymentMethod: t.payment_method || (meta.isManualEntry ? 'Manual/Cash' : 'Gateway'),
            rawCreatedAt: t.created_at,
            metadata: meta,
            type: t.type || t.product_type,
            invoiceId: t.pakasir_order_id || `TRX-${t.id?.substring(0,8).toUpperCase()}`,
            // Price breakdown
            basePrice: Number(meta.basePrice || (t.amount - (meta.facilityAmount || 0) - (meta.platformFee || 0))),
            facilityAmount: Number(meta.facilityAmount || 0),
            facilityName: meta.facilityName || 'Fasilitas',
            platformFee: Number(meta.platformFee || 0),
            extraPersonFee: Number(meta.extraPersonFee || 0),
            occupantsCount: Number(meta.occupants || 1),
            firstBooking: meta.startDate || t.move_in_date
        };
    };

    const processedItems = useMemo(() => {
        // 1. All extension transactions (type: perpanjangan_sewa)
        const extensionTrxs = rentTransactions.filter(t => {
            const meta = t.metadata || {};
            const isExtension = t.type === 'perpanjangan_sewa' || meta.extensionPeriod !== undefined;
            const isPaid = ['PAID', 'SUCCESS', 'BERHASIL'].includes((t.status || '').toUpperCase());
            const isPending = ['PENDING', 'PENDING_APPROVAL'].includes((t.status || '').toUpperCase());
            return isExtension && (isPaid || isPending);
        });

        // 2. Residents approaching grace period (≤7 days) or already expired — from residentStatus
        const gracePeriodResidents = residentStatus.filter(r => {
            const daysLeft = calculateDaysRemaining(r.end_date);
            return daysLeft <= 7; // 7 days or less remaining (including expired)
        });

        // Build grace period summaries from resident_status data
        const graceSummaries = gracePeriodResidents.map(r => {
            const meta = r.metadata || {};
            const matchingTrx = rentTransactions.find(t => t.user_id === r.user_id && (t.kost_id === r.kost_id || t.product_id === r.kost_id));
            const trxMeta = matchingTrx?.metadata || {};
            const daysRemaining = calculateDaysRemaining(r.end_date);

            const historyTrxs = rentTransactions.filter(rt => rt.user_id === r.user_id && ['PAID', 'SUCCESS', 'BERHASIL'].includes((rt.status || '').toUpperCase()));
            const totalMonths = historyTrxs.reduce((acc, rt) => acc + (Number(rt.metadata?.extensionPeriod) || 1), 0);

            return {
                id: r.id || matchingTrx?.id || r.user_id,
                name: r.user?.full_name || r.user?.name || meta.userName || 'Penyewa',
                photoURL: r.user?.photo_url,
                item: r.property?.title || meta.kostName || trxMeta.kostName || 'Kost',
                roomType: r.room_type || '-',
                amount: Number(matchingTrx?.amount || 0),
                status: 'ACTIVE',
                startDate: r.start_date,
                endDate: r.end_date,
                userId: r.user_id,
                kostId: r.kost_id,
                paymentMethod: matchingTrx?.payment_method || 'Gateway',
                rawCreatedAt: r.created_at || matchingTrx?.created_at,
                metadata: { ...meta, ...trxMeta },
                type: 'kost_booking',
                invoiceId: matchingTrx?.pakasir_order_id || `TRX-${(matchingTrx?.id || r.id || '').substring(0, 8).toUpperCase()}`,
                basePrice: Number(trxMeta.basePrice || matchingTrx?.amount || 0),
                facilityAmount: Number(trxMeta.facilityAmount || 0),
                facilityName: trxMeta.facilityName || 'Fasilitas',
                platformFee: Number(trxMeta.platformFee || 0),
                extraPersonFee: Number(trxMeta.extraPersonFee || 0),
                occupantsCount: Number(trxMeta.occupants || 1),
                firstBooking: r.start_date,
                daysRemaining,
                history: { totalMonths },
                displayType: 'RESIDENT_STATUS'
            };
        });

        // 3. Individual successful extension transaction records (for Success tab)
        const successHistory = extensionTrxs
            .filter(t => ['PAID', 'SUCCESS', 'BERHASIL'].includes((t.status || '').toUpperCase()))
            .map(t => {
                const trx = formatRentTrx(t);
                const meta = t.metadata || {};
                return {
                    ...trx,
                    startDate: meta.startDate || t.created_at,
                    endDate: meta.endDate || t.end_date,
                    daysRemaining: calculateDaysRemaining(meta.endDate || t.end_date),
                    history: { totalMonths: Number(meta.extensionPeriod || 1) },
                    displayType: 'TRANSACTION_RECORD'
                };
            });

        // 4. Pending extensions (need approval)
        const pendingExtensions = extensionTrxs
            .filter(t => ['PENDING', 'PENDING_APPROVAL'].includes((t.status || '').toUpperCase()))
            .map(t => {
                const trx = formatRentTrx(t);
                return { ...trx, daysRemaining: calculateDaysRemaining(trx.endDate), history: { totalMonths: 1 }, displayType: 'RESIDENT_STATUS' };
            });

        // statusSummaries = grace period residents + pending extensions (deduplicated by userId)
        const seen = new Set<string>();
        const statusSummaries = [...graceSummaries, ...pendingExtensions].filter(item => {
            const key = `${item.userId}-${item.kostId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return { statusSummaries, successHistory };
    }, [rentTransactions, residentStatus]);

    const filtered = useMemo(() => {
        if (rentFilter === 'success') {
            return processedItems.successHistory.sort((a, b) => new Date(b.rawCreatedAt).getTime() - new Date(a.rawCreatedAt).getTime());
        }

        const list = processedItems.statusSummaries;
        if (rentFilter === 'all') return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
        if (rentFilter === 'grace_period') return list.filter(t => t.daysRemaining >= 0 && t.daysRemaining <= 7).sort((a, b) => a.daysRemaining - b.daysRemaining);
        if (rentFilter === 'no_extension') return list.filter(t => t.daysRemaining < 0).sort((a, b) => a.daysRemaining - b.daysRemaining);
        
        return list;
    }, [processedItems, rentFilter]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRentTrxIds(filtered.map(t => t.id));
        } else {
            setSelectedRentTrxIds([]);
        }
    };

    const handleUpdateStatus = async (id: string, status: string, additionalData = {}) => {
        if (!window.confirm(`Ubah status ke ${status}?`)) return;
        setIsSubmitting(true);
        try {
            await updateTransactionStatus(id, status, additionalData);
            setRejectingTrxId(null);
            setRejectionReason('');
            refreshData();
        } catch (err: any) {
            alert('Gagal memperbarui: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTrx = async (id: string) => {
        if (!window.confirm('Hapus data transaksi perpanjangan ini secara permanen?')) return;
        try {
            await deleteTransaction(id);
            refreshData();
        } catch (err: any) {
            alert('Gagal menghapus: ' + err.message);
        }
    };

    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualForm, setManualForm] = useState({
        userId: '',
        kostId: '',
        amount: 0,
        duration: 1,
        tenantName: ''
    });

    const handleCreateManualExtension = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualForm.userId || !manualForm.kostId || manualForm.amount <= 0) {
            alert('Mohon lengkapi seluruh data.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { createManualExtension } = await import('../../adminService');
            await createManualExtension({
                userId: manualForm.userId,
                kostId: manualForm.kostId,
                amount: manualForm.amount,
                durationMonths: manualForm.duration,
                metadata: {
                    tenantName: manualForm.tenantName
                }
            });
            alert('Perpanjangan manual berhasil dicatat!');
            setIsManualModalOpen(false);
            refreshData();
        } catch (err: any) {
            alert('Gagal mencatat perpanjangan: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section matching user's exact screenshot */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#B44B1D] uppercase tracking-tight leading-none">Manajemen Perpanjangan Sewa</h2>
                    <div className="flex items-center gap-2 mt-4">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-md border-gray-300 text-orange-500 focus:ring-orange-500"
                            checked={selectedRentTrxIds.length === filtered.length && filtered.length > 0}
                            onChange={handleSelectAll}
                        />
                        <span className="text-sm font-bold text-gray-500">Pilih Semua ({filtered.length})</span>
                    </div>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setIsManualModalOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-200"
                    >
                        + Tambah Perpanjangan Manual
                    </button>
                )}
            </div>

            {/* Info Banner */}
            <div className="bg-[#FFF4ED] border border-[#FFE4D4] rounded-2xl p-6 flex gap-4">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <Info size={14} />
                </div>
                <p className="text-sm font-bold text-[#8C4A2D] leading-relaxed">
                    Halaman ini khusus untuk mengelola <strong className="text-[#B44B1D]">Perpanjangan Sewa</strong>. Data ini terhubung ke transaksi awal untuk memastikan status sewa tenant tetap aktif secara otomatis setelah pembayaran dikonfirmasi.
                </p>
            </div>

            {/* Filter Tabs with Icons */}
            <div className="flex flex-wrap gap-4">
                {[
                    { id: 'all', label: 'Seluruh Transaksi', count: processedItems.statusSummaries.length, color: 'bg-orange-500', icon: <FileText size={14}/> },
                    { id: 'grace_period', label: 'Memasuki Masa Tenggang', count: processedItems.statusSummaries.filter(t => t.daysRemaining >= 0 && t.daysRemaining <= 7).length, color: 'bg-[#F2D7B6]', icon: <Clock size={14}/> },
                    { id: 'success', label: 'Perpanjangan Berhasil', count: processedItems.successHistory.length, color: 'bg-[#C6F6D5]', icon: <CheckCircle size={14}/> },
                    { id: 'no_extension', label: 'Tidak Diperpanjang', count: processedItems.statusSummaries.filter(t => t.daysRemaining < 0).length, color: 'bg-[#FED7D7]', icon: <Ban size={14}/> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setRentFilter(tab.id as any)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                            rentFilter === tab.id 
                            ? `${tab.color} text-white` 
                            : 'bg-white text-gray-500 border border-gray-100'
                        }`}
                    >
                        <span className={rentFilter === tab.id ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 gap-6">
                {filtered.length === 0 ? (
                    <div className="bg-white border text-center border-gray-100 rounded-[2.5rem] p-20 shadow-sm">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Tidak ada data perpanjangan ditemukan.</p>
                    </div>
                ) : (
                    filtered.map((trx) => {
                        const daysLeft = trx.daysRemaining;
                        const isGrace = daysLeft <= 7;
                        const isSelected = selectedRentTrxIds.includes(trx.id);

                        return (
                            <div key={trx.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 transition-all hover:shadow-xl hover:shadow-orange-500/5 relative overflow-hidden group/card">
                                <div className="absolute top-8 left-8 z-20">
                                    <input 
                                        type="checkbox" 
                                        className="w-6 h-6 rounded-lg border-2 border-gray-200 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedRentTrxIds([...selectedRentTrxIds, trx.id]);
                                            else setSelectedRentTrxIds(selectedRentTrxIds.filter(id => id !== trx.id));
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row gap-10">
                                    {/* Left: Avatar Section */}
                                    <div className="shrink-0 flex flex-col items-center gap-3 pt-4">
                                        <div className="relative w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-black shadow-lg overflow-hidden">
                                            {trx.name[0].toUpperCase()}
                                            {trx.photoURL && <img src={trx.photoURL} className="absolute inset-0 w-full h-full object-cover" alt="" />}
                                        </div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{trx.name}</p>
                                    </div>

                                    {/* Center: Content */}
                                    <div className="flex-1 space-y-8">
                                        <div className="flex flex-wrap justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                    <span className="text-[10px] bg-gray-100 text-gray-400 px-3 py-1 rounded-lg font-bold tracking-widest uppercase">{trx.id}</span>
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Zap size={12} fill="currentColor"/> OTOMATIS
                                                    </span>
                                                    <span className="text-[10px] bg-orange-50 text-orange-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest">
                                                        PERPANJANGAN
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{trx.item}</h3>
                                                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                                        👥 {trx.occupantsCount} ORANG
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                                    STATUS: <span className={trx.displayType === 'TRANSACTION_RECORD' ? 'text-emerald-500' : (daysLeft < 0 ? 'text-red-500' : isGrace ? 'text-orange-500' : 'text-emerald-500')}>
                                                        {trx.displayType === 'TRANSACTION_RECORD' ? 'BERHASIL DIPERPANJANG' : (daysLeft < 0 ? 'SUDAH HABIS' : isGrace ? 'MASA TENGGANG' : 'SEWA AKTIF')}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL BAYAR</p>
                                                <p className="text-3xl font-black text-[#F17336] tracking-tighter">Rp {trx.amount.toLocaleString('id-ID')}</p>
                                                <button 
                                                    onClick={() => setViewingInvoice(trx)}
                                                    className="mt-2 text-[10px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-2 justify-end uppercase tracking-widest"
                                                >
                                                    📜 LIHAT INVOICE
                                                </button>
                                            </div>
                                        </div>

                                        {/* Boxed Grid exactly as screenshot */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* PAKET & DURASI */}
                                            <div className="bg-[#FAFAFA] rounded-[1.5rem] p-6 border border-gray-100 flex flex-col justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">PAKET & DURASI</p>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">PAKET</p>
                                                            <p className="text-sm font-black text-gray-900">{trx.metadata?.duration || trx.metadata?.extensionPeriod || '1 Bulan'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{trx.displayType === 'TRANSACTION_RECORD' ? 'DURASI' : 'TOTAL SEWA'}</p>
                                                            <p className="text-sm font-black text-orange-500">{trx.history.totalMonths} Bulan</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-gray-200">
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-2">{trx.displayType === 'TRANSACTION_RECORD' ? 'TANGGAL TRANSAKSI' : 'RIWAYAT GABUNG'}</p>
                                                    <div className={trx.displayType === 'TRANSACTION_RECORD' ? 'bg-blue-50 px-4 py-2 rounded-xl border border-blue-100' : 'bg-[#F0FFF4] px-4 py-2 rounded-xl border border-[#C6F6D5]'}>
                                                        <p className={`text-[10px] font-black ${trx.displayType === 'TRANSACTION_RECORD' ? 'text-blue-700' : 'text-[#2F855A]'}`}>
                                                            {trx.displayType === 'TRANSACTION_RECORD' ? `Diproses: ${new Date(trx.rawCreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : `Booking Awal: ${parseDateSafely(trx.firstBooking)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* JADWAL SEWA */}
                                            <div className="bg-[#FAFAFA] rounded-[1.5rem] p-6 border border-gray-100 flex flex-col justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">JADWAL SEWA</p>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">MULAI</p>
                                                            <p className="text-sm font-black text-gray-900">{parseDateSafely(trx.startDate)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">SELESAI</p>
                                                            <p className="text-sm font-black text-gray-900">{parseDateSafely(trx.endDate)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-orange-400"></span> TAGIHAN BERIKUTNYA
                                                    </p>
                                                    <p className="text-[10px] font-black text-[#C05621] uppercase tracking-widest">
                                                        {daysLeft < 0 ? 'TELAH BERAKHIR' : `DALAM ${daysLeft} HARI LAGI`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* RINCIAN TAGIHAN */}
                                            <div className="bg-[#FAFAFA] rounded-[1.5rem] p-6 border border-gray-100 flex flex-col justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">RINCIAN TAGIHAN</p>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                                                            <span>SEWA & TAMBAHAN (PENGHUNI)</span>
                                                            <span className="text-gray-900">RP {trx.basePrice.toLocaleString('id-ID')}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                                                            <span>FASILITAS TAMBAHAN</span>
                                                            <span className="text-[#38A169]">+RP {trx.facilityAmount.toLocaleString('id-ID')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                                                    <p className="text-[10px] font-black text-[#F17336] uppercase">TOTAL TAGIHAN</p>
                                                    <p className="text-base font-black text-[#F17336]">RP {trx.amount.toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <button 
                                                onClick={() => handleDeleteTrx(trx.id)}
                                                className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
                                            >
                                                HAPUS TRX
                                            </button>
                                            <button 
                                                onClick={() => setViewingHistory({ userId: trx.userId, kostId: trx.kostId, name: trx.name })}
                                                className="px-6 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                                            >
                                                <History size={14}/> LIHAT RIWAYAT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODALS */}
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

export default ExtensionTransactionManagement;
