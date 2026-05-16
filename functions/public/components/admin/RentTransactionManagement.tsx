import React, { useState, useEffect } from 'react';
import { AdminTransaction, updateTransactionStatus, deleteTransaction, deleteTransactions, getAdminProperties, BasicPropertyInfo, syncResidentStatus } from '../../adminService';
import { supabase } from '../../supabase';
import { notifyAdminTransaction } from '../../emailService';
import { FORMAT_CURRENCY } from '../../constants';
import { getCurrentDate } from '../../utils/timeUtils';

interface RentTransactionManagementProps {
    isAdmin: boolean;
    uid?: string;
    rentTransactions: AdminTransaction[];
    refreshData: () => void;
}

const RentTransactionManagement: React.FC<RentTransactionManagementProps> = ({
    isAdmin,
    uid,
    rentTransactions,
    refreshData
}) => {
    // --- LOCAL UI STATE ---
    const [rentFilter, setRentFilter] = useState<'all' | 'pengajuan' | 'menunggu_pembayaran' | 'realisasi'>('all');


    const [selectedRentTrxIds, setSelectedRentTrxIds] = useState<string[]>([]);
    
    const [isAddingManualRent, setIsAddingManualRent] = useState(false);
    const [manualRentForm, setManualRentForm] = useState<any>({});
    const [viewingProfile, setViewingProfile] = useState<any | null>(null);
    const [viewingProof, setViewingProof] = useState<{ id: string, name: string, proofUrl: string } | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectingTrxId, setRejectingTrxId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [userProperties, setUserProperties] = useState<BasicPropertyInfo[]>([]);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const props = await getAdminProperties(isAdmin ? undefined : uid);
                setUserProperties(props);
            } catch (err) {
                console.error("Gagal memuat properti:", err);
            }
        };
        fetchProperties();
    }, [isAdmin, uid]);

    // --- HANDLERS ---
    const handleUpdateStatus = async (id: string, newStatus: string, metadata: any = {}) => {
        if (newStatus !== 'REJECTED' && !window.confirm(`Ubah status transaksi ke ${newStatus}?`)) return;
        setIsSubmitting(true);
        try {
            await updateTransactionStatus(id, newStatus, { metadata });

            // Jika status diubah jadi PAID, sync ke resident_status
            // agar penyewa langsung muncul di dashboard aktif
            if (newStatus === 'PAID') {
                try {
                    await syncResidentStatus(id);
                    console.log(`[RentTrxMgmt] syncResidentStatus called for trx ${id}`);
                } catch (syncErr) {
                    console.error('[RentTrxMgmt] syncResidentStatus failed (non-fatal):', syncErr);
                }
            }

            alert('Status transaksi berhasil diperbarui');
            refreshData();
            setRejectingTrxId(null);
            setRejectionReason('');
        } catch (error) {
            alert('Gagal memperbarui status: ' + (error as any).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTrx = async (id: string) => {
        if (!window.confirm('Hapus transaksi ini?')) return;
        setIsSubmitting(true);
        try {
            await deleteTransaction(id);
            alert('Transaksi berhasil dihapus');
            refreshData();
        } catch (error) {
            alert('Gagal menghapus transaksi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRentTrxIds.length === 0) return;
        if (!window.confirm(`Hapus ${selectedRentTrxIds.length} transaksi terpilih?`)) return;
        setIsSubmitting(true);
        try {
            await deleteTransactions(selectedRentTrxIds);
            alert('Transaksi terpilih berhasil dihapus');
            setSelectedRentTrxIds([]);
            refreshData();
        } catch (error) {
            alert('Gagal menghapus transaksi massal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualRentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const payload = {
                type: 'rent',
                product_type: 'kost_booking',
                amount: Number(manualRentForm.amount),
                status: manualRentForm.status === 'Selesai' ? 'PAID' : 'PENDING_APPROVAL',
                product_id: manualRentForm.productId,
                metadata: {
                    isManualEntry: true,
                    tenantName: manualRentForm.name,
                    phone: manualRentForm.phone,
                    email: manualRentForm.email,
                    kostName: userProperties.find(p => p.id === manualRentForm.productId)?.title || manualRentForm.item,
                    roomType: manualRentForm.roomType,
                    periodLabel: manualRentForm.periodLabel,
                    startDate: manualRentForm.startDate,
                    endDate: manualRentForm.endDate,
                },
                created_at: getCurrentDate().toISOString()
            };

            const { data: inserted, error } = await supabase.from('transactions').insert([payload]).select('id').single();
            if (error) throw error;

            // Sync with resident_status if PAID
            if (payload.status === 'PAID') {
                await supabase
                    .from('resident_status')
                    .insert([{
                        user_id: manualRentForm.userId || manualRentForm.uid || null, // Might be null for manual offline entries
                        kost_id: manualRentForm.productId,
                        room_type: manualRentForm.roomType,
                        start_date: manualRentForm.startDate,
                        end_date: manualRentForm.endDate,
                        total_months: 1, // Default for manual
                        last_transaction_id: inserted.id,
                        created_at: getCurrentDate().toISOString(),
                        updated_at: getCurrentDate().toISOString()
                    }]);
            }

            alert('Pencatatan transaksi manual berhasil disimpan ke database.');
            setIsAddingManualRent(false);
            setManualRentForm({});
            refreshData();
        } catch (error: any) {
            alert('Gagal menyimpan: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    const formatRentTrx = (t: any) => {
        const meta = t.metadata || {};
        return {
            id: t.id,
            rawDate: t.created_at,
            date: new Date(t.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            name: t.user?.name || meta.name || meta.tenantName || 'Penyewa',
            email: t.user?.email || meta.email,
            phone: t.user?.phone || meta.phone,
            photoURL: t.user?.photo_url || meta.photoURL,
            gender: t.user?.gender || meta.gender,
            occupation: t.user?.occupation || meta.occupation,
            institution: t.user?.institution || meta.institution,
            religion: t.user?.religion || meta.religion,
            relationshipStatus: t.user?.relationship_status || meta.relationshipStatus,
            profileAddress: t.user?.address || meta.profileAddress,
            paymentType: (t.payment_method || '').toLowerCase().includes('transfer') ? 'transfer' : 'gateway',
            item: meta.kostName || meta.item || t.product_type || 'Sewa Kost',
            roomType: t.room_type || meta.roomType || meta.item || '-',
            periodLabel: meta.period || meta.periodLabel || '-',
            paymentMethod: t.payment_method || '-',
            amount: t.amount,
            status: (t.status === 'pending' || t.status === 'PENDING_APPROVAL') 
                ? 'Menunggu Konfirmasi' 
                : (t.status === 'AWAITING_PAYMENT') 
                    ? 'Menunggu Pembayaran' 
                    : ((t.status || '').toUpperCase() === 'PAID' || ['Selesai', 'success', 'Berhasil', 'COMPLETED'].includes(t.status)) 
                        ? 'Status Aktif' 
                        : (t.status === 'expired')
                            ? 'Status Outdated'
                            : (t.status === 'cancelled' || t.status === 'REJECTED' ? 'Ditolak' : t.status),
            rejectionReason: meta.rejection_reason || meta.rejectionReason,
            rawStatus: t.status,
            startDate: t.move_in_date || meta.startDate || meta.checkInDate || '-',
            endDate: t.end_date || meta.endDate || '-',
            transferProofUrl: meta.transferProofUrl || null,
            platformFee: Number(meta.platformFee) || 0,
            invoiceId: t.pakasir_order_id || `INV-${t.id.substring(0,8).toUpperCase()}`,
            type: t.type || t.product_type || 'rent'
        };
    };

    const filtered = rentTransactions.filter(t => {
        const meta = t.metadata || {};
        const isExtension = 
            t.product_type === 'perpanjangan_sewa' || 
            t.product_type === 'extension' ||
            t.type === 'perpanjangan_sewa' || 
            t.type === 'extension' ||
            meta.extensionType === 'manual_extension' ||
            meta.extensionPeriod !== undefined ||
            meta.originalTransactionId !== undefined ||
            (t.pakasir_order_id && String(t.pakasir_order_id).toUpperCase().includes('EXT'));
        
        // Exclude extensions from RentTransactionManagement
        if (isExtension) return false;

        if (rentFilter === 'all') return true;
        const isNewSubmission = t.status === 'pending' || t.status === 'PENDING_APPROVAL';
        const isAwaitingPayment = t.status === 'AWAITING_PAYMENT';
        const isPaid = ['PAID', 'paid', 'Selesai', 'success', 'Berhasil', 'COMPLETED', 'SUCCESS'].includes((t.status || '').toUpperCase());

        if (rentFilter === 'pengajuan') return isNewSubmission;
        if (rentFilter === 'menunggu_pembayaran') return isAwaitingPayment;
        if (rentFilter === 'realisasi') return isPaid;
        
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manajemen Transaksi Sewa Kost</h2>
                    {isAdmin && rentTransactions.length > 0 && (
                        <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:bg-orange-500 checked:border-orange-500 transition-all"
                                        checked={selectedRentTrxIds.length === rentTransactions.length && rentTransactions.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedRentTrxIds(rentTransactions.map(t => t.id));
                                            else setSelectedRentTrxIds([]);
                                        }}
                                    />
                                    <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-sm font-bold text-gray-600 group-hover:text-orange-600 transition-colors">Pilih Semua ({rentTransactions.length})</span>
                            </label>
                            
                            {selectedRentTrxIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 transition-all shadow-sm active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Hapus {selectedRentTrxIds.length} Terpilih
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {isAdmin && (
                    <button onClick={() => setIsAddingManualRent(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Tambah Manual
                    </button>
                )}
            </div>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
                <div className="text-blue-500 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm font-medium text-blue-900 leading-relaxed">
                    Transaksi via <strong>Transfer Bank</strong> memerlukan verifikasi bukti mutasi manual sebelum dikonfirmasi. Transaksi via <strong>Payment Gateway</strong> terkonfirmasi otomatis oleh sistem.
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'all', label: 'Semua Transaksi', icon: '📋' },
                    { id: 'pengajuan', label: 'Pengajuan Baru', icon: '📩' },
                    { id: 'menunggu_pembayaran', label: 'Menunggu Pembayaran', icon: '⏳' },
                    { id: 'realisasi', label: 'Penyewaan Terealisasi', icon: '✅' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setRentFilter(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${rentFilter === tab.id
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filtered.length === 0 ? (
                    <div className="bg-white border text-center border-gray-100 rounded-2xl p-12 shadow-sm">
                        <p className="text-gray-500 font-medium">Belum ada data transaksi untuk kategori ini.</p>
                    </div>
                ) : (
                    filtered.map((rawTrx) => {
                        const trx = formatRentTrx(rawTrx);
                        const isSelected = selectedRentTrxIds.includes(trx.id);
                        return (
                            <div key={trx.id} className={`bg-white border ${isSelected ? 'border-orange-400 ring-2 ring-orange-50 shadow-md' : 'border-gray-100 shadow-sm'} rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden group/card`}>
                                {isAdmin && (
                                    <div className="absolute top-4 left-4 z-[20]">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-orange-200 checked:bg-orange-500 checked:border-orange-500 transition-all shadow-sm"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedRentTrxIds([...selectedRentTrxIds, trx.id]);
                                                    else setSelectedRentTrxIds(selectedRentTrxIds.filter(id => id !== trx.id));
                                                }}
                                            />
                                            <svg className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    </div>
                                )}

                                {/* Customer Info Section */}
                                <div className="shrink-0 w-24 flex flex-col items-center gap-2 pt-4 pl-4 md:pl-0">
                                    <div 
                                        className="relative w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-black shadow-lg cursor-pointer overflow-hidden group/avatar transition-transform hover:scale-105"
                                        onClick={() => setViewingProfile(trx)}
                                    >
                                        {/* Layer 1: Initials */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {trx.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        
                                        {/* Layer 2: Photo */}
                                        {trx.photoURL && (
                                            <img
                                                src={trx.photoURL}
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20 font-black uppercase">Detail</div>
                                    </div>
                                    <div className="text-center">
                                        <button 
                                            onClick={() => setViewingProfile(trx)}
                                            className="text-[10px] font-black text-gray-900 uppercase tracking-tight hover:text-orange-600 transition-colors line-clamp-1 px-1"
                                        >
                                            {trx.name}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-gray-50 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">{trx.invoiceId}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${trx.paymentType === 'gateway' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                    {trx.paymentType === 'gateway' ? '⚡ Otomatis' : '🏦 Bank Transfer'}
                                                </span>

                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{trx.item}</h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Status: <span className={`ml-1 ${['Selesai/Diproses', 'Selesai', 'PAID'].includes((trx.rawStatus || '').toUpperCase()) ? 'text-green-600' : trx.status.includes('Menunggu') ? 'text-amber-500' : 'text-red-500'}`}>{trx.status}</span></p>
                                            {trx.rawStatus === 'REJECTED' && trx.rejectionReason && (
                                                <p className="text-[10px] text-red-400 font-bold italic mt-1 leading-relaxed">Alasan: {trx.rejectionReason}</p>
                                            )}

                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bayar</p>
                                                <p className="text-xl font-black text-orange-600 tracking-tight">{FORMAT_CURRENCY(trx.amount)}</p>
                                            </div>
                                            <button 
                                                onClick={() => setViewingInvoice(trx)}
                                                className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all uppercase tracking-widest"
                                            >
                                                📜 Lihat Invoice
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50 items-center justify-between">
                                        {isAdmin && trx.rawStatus === 'PENDING_APPROVAL' && (
                                            <div className="flex flex-col gap-2">
                                                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                    Menunggu persetujuan pemilik kost
                                                </p>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleUpdateStatus(trx.id, 'PAID')}
                                                        className="px-3 py-1.5 bg-gray-50 hover:bg-green-50 text-green-600 border border-green-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                        title="Terima Paksa (Admin)"
                                                    >
                                                        Terima
                                                    </button>
                                                    <button 
                                                        onClick={() => setRejectingTrxId(trx.id)}
                                                        className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        Tolak
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {isAdmin && (
                                            <button 
                                                onClick={() => handleDeleteTrx(trx.id)}
                                                className="py-1.5 px-3 bg-red-50/50 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg text-[9px] font-black uppercase transition-all"
                                            >
                                                Hapus Trx
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL: ALASAN PENOLAKAN */}
            {rejectingTrxId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-4 text-center">Alasan Penolakan</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6 text-center italic">Berikan alasan agar penyewa memahami mengapa pengajuan ini tidak disetujui.</p>
                        
                        <textarea
                            className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="Contoh: Maaf, kamar yang Anda pilih baru saja dipesan di platform lain secara manual..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        
                        <div className="flex gap-4 mt-8">
                            <button 
                                onClick={() => { setRejectingTrxId(null); setRejectionReason(''); }}
                                className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus(rejectingTrxId, 'REJECTED', { rejection_reason: rejectionReason })}
                                disabled={!rejectionReason || isSubmitting}
                                className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Memproses...' : 'Tolak Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* MODAL: PROFIL PENYEWA */}
            {viewingProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl" onClick={() => setViewingProfile(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white relative shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="relative w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-3xl font-black shadow-xl overflow-hidden">
                                    {/* Layer 1: Initials */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {viewingProfile.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    
                                    {/* Layer 2: Photo */}
                                    {viewingProfile.photoURL && (
                                        <img 
                                            src={viewingProfile.photoURL} 
                                            alt="" 
                                            className="absolute inset-0 w-full h-full object-cover z-10" 
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-gray-900 flex items-center justify-center text-[8px] z-20">✓</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 mb-1">Identitas Penyewa</p>
                                    <h3 className="text-2xl font-black truncate tracking-tight">{viewingProfile.name}</h3>
                                    <p className="text-sm opacity-60 font-medium truncate mt-0.5">{viewingProfile.email}</p>
                                </div>
                                <button onClick={() => setViewingProfile(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center group active:scale-90">
                                    <svg className="w-5 h-5 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <ProfileField label="WhatsApp" value={viewingProfile.phone} icon="📱" />
                                <ProfileField label="Gender" value={viewingProfile.gender} icon="🚻" />
                                <ProfileField label="Pekerjaan" value={viewingProfile.occupation} icon="💼" />
                                <ProfileField label="Institusi" value={viewingProfile.institution} icon="🏫" />
                                <ProfileField label="Agama" value={viewingProfile.religion} icon="🕌" />
                                <ProfileField label="Status" value={viewingProfile.relationshipStatus} icon="💍" />
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><span>🏠</span> Alamat Asal</label>
                                    <p className="font-bold text-gray-800 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">{viewingProfile.profileAddress || '-'}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Transaksi Properti Ini</p>
                                <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100 flex justify-between items-center group transition-colors hover:bg-orange-50">
                                    <div>
                                        <p className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase">{viewingProfile.item}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">{viewingProfile.roomType} · {viewingProfile.periodLabel}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${viewingProfile.status === 'Selesai' ? 'bg-white text-green-600 border border-green-100' : viewingProfile.status === 'Menunggu' ? 'bg-white text-amber-600 border border-amber-100' : 'bg-white text-red-600 border border-red-100'}`}>
                                        {viewingProfile.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 shrink-0 bg-gray-50">
                            <button
                                onClick={() => window.open(`https://wa.me/${viewingProfile.phone}?text=${encodeURIComponent(`Halo ${viewingProfile.name}, saya Admin RuangSinggah.id. Terkait pesanan ${viewingProfile.item}...`)}`, '_blank')}
                                className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-lg">🤳</span> Hubungi via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: BUKTI TRANSFER */}
            {viewingProof && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setViewingProof(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-8 border-b border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Lampiran Bayar</p>
                                <h3 className="text-xl font-black text-gray-900 leading-tight uppercase">{viewingProof.name}</h3>
                            </div>
                            <button onClick={() => setViewingProof(null)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center text-gray-400 hover:text-gray-900 active:scale-90">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="aspect-[3/4] rounded-3xl overflow-hidden border-4 border-gray-50 shadow-inner group relative">
                                <img src={viewingProof.proofUrl} alt="Bukti Transfer" className="w-full h-full object-contain bg-gray-50" />
                                <button onClick={() => window.open(viewingProof.proofUrl, '_blank')} className="absolute bottom-4 right-4 bg-white/90 backdrop-blur shadow-lg p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    <span className="text-[10px] font-black uppercase">Perbesar</span>
                                </button>
                            </div>
                        </div>
                        <div className="bg-orange-50 px-8 py-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl shrink-0">🏦</div>
                            <p className="text-[11px] text-orange-900 font-bold leading-relaxed">
                                Mohon verifikasi mutasi rekening Anda secara manual sebelum memvalidasi transaksi ini.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: INVOICE */}
            {viewingInvoice && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingInvoice(null)}>
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="bg-gray-900 p-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-sm">RS</div>
                                            <p className="text-xs font-black tracking-widest uppercase opacity-60">RuangSinggah.id</p>
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight">{viewingInvoice.invoiceId}</h3>
                                    </div>
                                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${viewingInvoice.status === 'Selesai' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : viewingInvoice.status === 'Menunggu' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {viewingInvoice.status}
                                    </span>
                                </div>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Waktu Transaksi: <span className="text-white/80 ml-2">{viewingInvoice.date}</span></p>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <InvoiceField label="Penyewa" value={viewingInvoice.name} />
                                <InvoiceField label="Metode" value={viewingInvoice.paymentMethod} />
                                <div className="col-span-2">
                                    <InvoiceField label="Properti" value={viewingInvoice.item} />
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5">{viewingInvoice.roomType} · {viewingInvoice.periodLabel}</p>
                                </div>
                                <div className="col-span-2 bg-gray-50 p-6 rounded-3xl border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Masa Sewa Kontrak</p>
                                        <div className="flex items-center gap-3 text-sm font-black text-gray-900">
                                            <span>{viewingInvoice.startDate}</span>
                                            <span className="text-gray-300">→</span>
                                            <span>{viewingInvoice.endDate}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Media Bayar</p>
                                        <span className="text-sm font-black text-gray-900">{viewingInvoice.paymentType === 'gateway' ? '⚡ Gateway' : '🏦 Transfer'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6">
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Subtotal</span>
                                    <span>{FORMAT_CURRENCY(viewingInvoice.amount - viewingInvoice.platformFee)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Biaya Admin</span>
                                    <span>{FORMAT_CURRENCY(viewingInvoice.platformFee)}</span>
                                </div>
                                <div className="flex justify-between items-center py-6 border-t border-gray-100 mt-4">
                                    <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total Tagihan</span>
                                    <span className="text-3xl font-black text-orange-600 tracking-tight">{FORMAT_CURRENCY(viewingInvoice.amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex gap-4 shrink-0">
                            <button onClick={() => setViewingInvoice(null)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                                Tutup Panel
                            </button>
                            <button onClick={() => window.print()} className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95 flex justify-center items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Cetak PDF/Kertas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MANUAL ADD RENT */}
            {isAddingManualRent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsAddingManualRent(false)}>
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-10 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center group">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tight">Input Transaksi Manual</h2>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-2">Pencatatan Offline / Luar Dashboard</p>
                            </div>
                            <button onClick={() => setIsAddingManualRent(false)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl text-gray-300 hover:text-red-500 hover:border-red-500 transition-all active:scale-90 shadow-sm">&times;</button>
                        </div>
                        
                        <form onSubmit={handleManualRentSubmit} className="flex-grow overflow-y-auto p-10 space-y-10">
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Dasar Penyewa</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField label="Nama Lengkap" placeholder="Cth: Budi Pratama" value={manualRentForm.name || ''} onChange={val => setManualRentForm({ ...manualRentForm, name: val })} />
                                    <FormField label="No. WhatsApp" placeholder="Cth: 62812345678" value={manualRentForm.phone || ''} onChange={val => setManualRentForm({ ...manualRentForm, phone: val })} />
                                    <div className="col-span-2">
                                        <FormField label="Email Akun (Opsional)" placeholder="Cth: budi@mail.com" value={manualRentForm.email || ''} onChange={val => setManualRentForm({ ...manualRentForm, email: val })} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Properti & Sewa</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Properti</label>
                                            <select 
                                                required
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
                                                value={manualRentForm.productId || ''} 
                                                onChange={e => setManualRentForm({ ...manualRentForm, productId: e.target.value })}
                                            >
                                                <option value="">-- Pilih Properti --</option>
                                                {userProperties.map(p => (
                                                    <option key={p.id} value={p.id}>{p.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <FormField label="Tipe Kamar" placeholder="Cth: Kamar A - AC" value={manualRentForm.roomType || ''} onChange={val => setManualRentForm({ ...manualRentForm, roomType: val })} />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Durasi</label>
                                        <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" value={manualRentForm.periodLabel || 'Bulanan'} onChange={e => setManualRentForm({ ...manualRentForm, periodLabel: e.target.value })}>
                                            <option value="Bulanan">Bulanan</option><option value="3 Bulanan">3 Bulanan</option><option value="6 Bulanan">6 Bulanan</option><option value="Tahunan">Tahunan</option>
                                        </select>
                                    </div>
                                    <FormField label="Tgl Check-in" type="date" value={manualRentForm.startDate || ''} onChange={val => setManualRentForm({ ...manualRentForm, startDate: val })} />
                                    <FormField label="Tgl Check-out" type="date" value={manualRentForm.endDate || ''} onChange={val => setManualRentForm({ ...manualRentForm, endDate: val })} />
                                </div>
                            </section>

                            <section className="space-y-6 bg-orange-50/30 p-8 rounded-[2rem] border border-orange-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                                    <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Detail Pembayaran Akhir</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1 block mb-2">Total Bayar</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</span>
                                            <input required type="number" className="w-full bg-white border border-orange-100 rounded-2xl pl-12 pr-5 py-4 text-lg font-black text-orange-600 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" value={manualRentForm.amount || ''} onChange={e => setManualRentForm({ ...manualRentForm, amount: e.target.value })} placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1 block mb-2">Keterangan Status</label>
                                        <select className="w-full bg-white border border-orange-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all" value={manualRentForm.status || 'Selesai'} onChange={e => setManualRentForm({ ...manualRentForm, status: e.target.value })}>
                                            <option value="Selesai">LUNAS / BERHASIL</option>
                                            <option value="Menunggu">PENDING / MENUNGGU</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-5 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 active:scale-95 transition-all mt-4"
                            >
                                {isSubmitting ? '📦 Sedang Menyimpan...' : '💾 Simpan Transaksi Permanen'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfileField: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span>{icon}</span> {label}
        </label>
        <p className="font-bold text-gray-800 text-sm">{value || '-'}</p>
    </div>
);

const InvoiceField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-black text-gray-900">{value || '-'}</p>
    </div>
);

const FormField: React.FC<{ label: string; placeholder?: string; value: string; onChange: (val: string) => void; type?: string }> = ({ label, placeholder, value, onChange, type = 'text' }) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <input 
            type={type}
            required 
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default RentTransactionManagement;
