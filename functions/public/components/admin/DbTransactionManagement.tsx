import React, { useState } from 'react';
import { AdminTransaction, deleteTransaction, deleteTransactions } from '../../adminService';
import { FORMAT_CURRENCY } from '../../constants';

interface DbTransactionManagementProps {
    dbTransactions: AdminTransaction[];
    isAdmin: boolean;
    refreshData: () => void;
}

const DbTransactionManagement: React.FC<DbTransactionManagementProps> = ({
    dbTransactions,
    isAdmin,
    refreshData
}) => {
    // --- LOCAL UI STATE ---
    const [selectedDbTrxIds, setSelectedDbTrxIds] = useState<string[]>([]);
    
    const [isAddingManualDb, setIsAddingManualDb] = useState(false);
    const [viewingDbProfile, setViewingDbProfile] = useState<any | null>(null);
    const [viewingDbProof, setViewingDbProof] = useState<any | null>(null);
    const [viewingDbInvoice, setViewingDbInvoice] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- HANDLERS ---
    const handleDeleteTransactionLocal = async (id: string) => {
        if (!window.confirm('Hapus riwayat transaksi ini?')) return;
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

    const handleBulkDeleteTransactionsLocal = async () => {
        if (selectedDbTrxIds.length === 0) return;
        if (!window.confirm(`Hapus ${selectedDbTrxIds.length} transaksi terpilih?`)) return;
        setIsSubmitting(true);
        try {
            await deleteTransactions(selectedDbTrxIds);
            alert('Transaksi terpilih berhasil dihapus');
            setSelectedDbTrxIds([]);
            refreshData();
        } catch (error) {
            alert('Gagal menghapus transaksi massal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualDbSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        alert('Fitur tambah manual dinonaktifkan sementara.');
        setIsAddingManualDb(false);
    };

    const handleDbSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        alert('Fitur manajemen database produk (Tambah/Edit) akan segera diintegrasikan. Silakan gunakan dashboard utama untuk saat ini.');
    };
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manajemen Pembelian Database</h2>
                    <p className="text-gray-500 text-sm mt-1">Total {dbTransactions.length} transaksi tercatat.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {selectedDbTrxIds.length > 0 && (
                        <button 
                            onClick={handleBulkDeleteTransactionsLocal}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Hapus Terpilih ({selectedDbTrxIds.length})
                        </button>
                    )}
                    <button onClick={() => setIsAddingManualDb(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Tambah Manual
                    </button>
                </div>
            </div>

            {dbTransactions.length > 0 && (
                <div className="flex items-center gap-2 px-1 py-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                            checked={dbTransactions.length > 0 && selectedDbTrxIds.length === dbTransactions.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedDbTrxIds(dbTransactions.map(t => t.id));
                                } else {
                                    setSelectedDbTrxIds([]);
                                }
                            }}
                        />
                        <span className="text-sm font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Pilih Semua</span>
                    </label>
                </div>
            )}

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-blue-500 shrink-0">📦</span>
                <p className="text-sm font-medium text-blue-900">Transaksi via <strong>Transfer Bank</strong> perlu verifikasi bukti pembayaran sebelum akses database diberikan kepada pembeli.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                {dbTransactions.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Belum Ada Transaksi</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium">Semua pembelian database melalui website akan otomatis muncul di sini secara real-time.</p>
                    </div>
                ) : dbTransactions.map((trx: any) => {
                    const metadata = trx.metadata || {};
                    const buyer = trx.user || { name: 'Unknown', email: '-', phone: '-' };
                    const dbInfo = trx.database || { campus: '', city: '', area: '', file_type: '', price: 0 };
                    const createdAtDate = new Date(trx.created_at);
                    const createdAt = createdAtDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                    const dbName = metadata.dbName || (dbInfo.campus ? `${dbInfo.campus} - ${dbInfo.city}` : '-');
                    const dbType = metadata.dbType || (dbInfo.file_type === 'link' ? 'Link Drive/Excel' : dbInfo.file_type === 'upload' ? 'File PDF/Original' : '-');
                    const dbCity = metadata.dbCity || dbInfo.city || '-';
                    const dbYear = metadata.dbYear || createdAtDate.getFullYear().toString();
                    const paymentMethod = trx.payment_method || (trx.payment_method === null ? 'Belum dipilih' : '-');

                    const displayStatus = (trx.status || '').toUpperCase() === 'PAID' ? 'Selesai' : trx.status === 'pending' ? 'Menunggu' : 'Dibatalkan';
                    const isManual = (paymentMethod || '').toLowerCase().includes('manual') || (paymentMethod || '').toLowerCase().includes('transfer');
                    
                    const isSelected = selectedDbTrxIds.includes(trx.id);

                    const invoiceData = {
                        ...trx,
                        ...metadata,
                        ...buyer,
                        dbName,
                        dbType,
                        dbCity,
                        dbYear,
                        paymentMethod,
                        date: createdAt,
                        invoiceId: trx.pakasir_order_id || trx.id.substring(0, 12).toUpperCase(),
                        amount: Number(trx.amount) || 0,
                        platformFee: Number(metadata.platformFee) || 0
                    };

                    return (
                        <div key={trx.id} className={`bg-white border ${isSelected ? 'border-blue-400 ring-2 ring-blue-50 shadow-md' : 'border-gray-100 shadow-sm'} rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all relative overflow-hidden group`}>
                            {(trx.status || '').toUpperCase() === 'PAID' && <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -z-0"></div>}
                            
                            <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
                                <input 
                                    type="checkbox" 
                                    className="w-6 h-6 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedDbTrxIds([...selectedDbTrxIds, trx.id]);
                                        } else {
                                            setSelectedDbTrxIds(selectedDbTrxIds.filter(id => id !== trx.id));
                                        }
                                    }}
                                />
                                
                                <div 
                                    className="relative w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white text-base font-black shadow-md cursor-pointer overflow-hidden group/avatar transition-transform hover:scale-110"
                                    onClick={() => setViewingDbProfile({ ...buyer, ...metadata, dbName, dbType, dbCity, dbYear, status: displayStatus, id: trx.id, date: createdAt })}
                                >
                                    {/* Layer 1: Initials */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {buyer.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    
                                    {/* Layer 2: Photo */}
                                    {buyer.photo_url && (
                                        <img
                                            src={buyer.photo_url}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover z-10"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 relative z-10 pl-10">
                                <div className="flex flex-wrap justify-between items-start border-b border-gray-50 pb-4 gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider">{trx.id.substring(0, 8)}</span>
                                            <span className="text-xs text-gray-400 font-medium">Dipesan: {createdAt}</span>
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${!isManual ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>{!isManual ? '⚡ Gateway' : '🏦 Transfer Manual'}</span>
                                        </div>
                                        <p className="font-medium text-gray-500 text-sm">Pembeli: <button onClick={() => setViewingDbProfile({ ...buyer, ...metadata, dbName, dbType, dbCity, dbYear, status: displayStatus, id: trx.id, date: createdAt })} className="font-black text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors text-base">{buyer.name}</button></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${(trx.status || '').toUpperCase() === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : (trx.status || '').toUpperCase() === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{displayStatus}</span>
                                        <button 
                                            onClick={() => handleDeleteTransactionLocal(trx.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                            title="Hapus Transaksi"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-blue-500 pl-2">Informasi Produk</p>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-sm font-black text-gray-800 leading-tight">{dbName}</p>
                                            <div className="flex gap-4 mt-2">
                                                <div><p className="text-[9px] text-gray-400 font-bold uppercase">City</p><p className="text-xs font-bold text-gray-600">{dbCity}</p></div>
                                                <div><p className="text-[9px] text-gray-400 font-bold uppercase">Type</p><p className="text-xs font-bold text-gray-600">{dbType}</p></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-orange-500 pl-2">Pembayaran</p>
                                        <div className="bg-orange-50/50 p-3 rounded-xl">
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">Total Bayar</p>
                                            <p className="text-lg font-black text-orange-600">{FORMAT_CURRENCY(trx.amount)}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Metode</p>
                                            <p className="text-xs font-bold text-gray-700 truncate">{paymentMethod}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-green-500 pl-2">Aksi Cepat</p>
                                        <div className="flex flex-col gap-2">
                                            {isManual && metadata.transferProofUrl && (
                                                <button onClick={() => setViewingDbProof({ id: trx.id, name: buyer.name, proofUrl: metadata.transferProofUrl })} className="w-full bg-white border border-green-200 text-green-600 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                                    🖼️ Bukti Bayar
                                                </button>
                                            )}
                                            <button onClick={() => setViewingDbInvoice(invoiceData)} className="w-full bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                                🧾 Invoice / Detail
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* --- MODALS SECTION --- */}

            {/* MODAL: PROFIL PEMBELI DB */}
            {viewingDbProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl" onClick={() => setViewingDbProfile(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 text-white relative shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="relative w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl border border-white/20 overflow-hidden">
                                    {/* Layer 1: Initials */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {viewingDbProfile.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    
                                    {/* Layer 2: Photo */}
                                    {viewingDbProfile.photo_url && (
                                        <img
                                            src={viewingDbProfile.photo_url}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover z-10"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 mb-1">Identitas Pembeli</p>
                                    <h3 className="text-2xl font-black truncate tracking-tight">{viewingDbProfile.name}</h3>
                                    <p className="text-sm opacity-60 font-medium truncate mt-0.5">{viewingDbProfile.email}</p>
                                </div>
                                <button onClick={() => setViewingDbProfile(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center group active:scale-90">
                                    <svg className="w-5 h-5 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><span>📱</span> WhatsApp</label>
                                    <p className="font-bold text-gray-800 text-sm">{viewingDbProfile.phone}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><span>📍</span> Lokasi</label>
                                    <p className="font-bold text-gray-800 text-sm">{viewingDbProfile.dbCity || '-'}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Database Dibeli</p>
                                <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex justify-between items-center group transition-colors hover:bg-blue-50">
                                    <div>
                                        <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{viewingDbProfile.dbName}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">{viewingDbProfile.dbType} · {viewingDbProfile.dbYear}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${viewingDbProfile.status === 'Selesai' ? 'bg-white text-green-600 border border-green-100' : viewingDbProfile.status === 'Menunggu' ? 'bg-white text-amber-600 border border-amber-100' : 'bg-white text-red-600 border border-red-100'}`}>
                                        {viewingDbProfile.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 shrink-0 bg-gray-50">
                            <button
                                onClick={() => window.open(`https://wa.me/${viewingDbProfile.phone}`, '_blank')}
                                className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-lg">🤳</span> Hubungi via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: BUKTI BAYAR DB */}
            {viewingDbProof && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setViewingDbProof(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-8 border-b border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Lampiran Transfer</p>
                                <h3 className="text-xl font-black text-gray-900 leading-tight uppercase">{viewingDbProof.name}</h3>
                            </div>
                            <button onClick={() => setViewingDbProof(null)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center text-gray-400 hover:text-gray-900 active:scale-90">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="aspect-[3/4] rounded-3xl overflow-hidden border-4 border-gray-50 shadow-inner group relative">
                                <img src={viewingDbProof.proofUrl} alt="Bukti Transfer" className="w-full h-full object-contain bg-gray-50" />
                            </div>
                        </div>
                        <div className="bg-amber-50 px-8 py-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl shrink-0">🏛️</div>
                            <p className="text-[11px] text-amber-900 font-bold leading-relaxed">
                                Verifikasi payment manual diperlukan untuk database ini. Pastikan dana sudah masuk.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: INVOICE / DETAIL DB */}
            {viewingDbInvoice && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingDbInvoice(null)}>
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="bg-blue-900 p-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-sm text-white">DB</div>
                                            <p className="text-xs font-black tracking-widest uppercase opacity-60">RuangSinggah Database</p>
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight">{viewingDbInvoice.invoiceId}</h3>
                                    </div>
                                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${(viewingDbInvoice.status || '').toUpperCase() === 'PAID' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                        {(viewingDbInvoice.status || '').toUpperCase() === 'PAID' ? 'SUKSES' : 'PENDING'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Waktu Beli: <span className="text-white/80 ml-2">{viewingDbInvoice.date}</span></p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8 text-sm">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pembeli</p><p className="font-black text-gray-900">{viewingDbInvoice.name}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Metode</p><p className="font-black text-gray-900">{viewingDbInvoice.paymentMethod}</p></div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Produk Database</p>
                                    <p className="font-black text-gray-900 text-lg uppercase">{viewingDbInvoice.dbName}</p>
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">{viewingDbInvoice.dbType} · {viewingDbInvoice.dbYear}</p>
                                </div>
                                <div className="col-span-2 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-900 uppercase">Harga Produk</span>
                                        <span className="text-lg font-black text-blue-600">{FORMAT_CURRENCY(viewingDbInvoice.amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex gap-4 shrink-0">
                            <button onClick={() => setViewingDbInvoice(null)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                                Tutup Panel
                            </button>
                            <button onClick={() => window.print()} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Cetak Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MANUAL ADD DB */}
            {isAddingManualDb && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsAddingManualDb(false)}>
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-10 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center group">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tight">Input DB Manual</h2>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2">Penjualan Luar Sistem</p>
                            </div>
                            <button onClick={() => setIsAddingManualDb(false)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl text-gray-300 hover:text-red-500 hover:border-red-500 transition-all active:scale-90 shadow-sm">&times;</button>
                        </div>
                        
                        <form onSubmit={handleManualDbSubmit} className="flex-grow overflow-y-auto p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Buyer Name</label>
                                <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" placeholder="Cth: Budi" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Database Campus</label>
                                <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" placeholder="Cth: IPB University" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nominal (IDR)</label>
                                <input required type="number" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" placeholder="0" />
                            </div>
                            <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl transition-all mt-4">Simpan Data Manual</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DbTransactionManagement;
