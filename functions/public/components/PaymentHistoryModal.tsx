
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { FORMAT_CURRENCY } from '../constants';
import { X, Clock, CreditCard, Calendar, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface PaymentHistoryModalProps {
    userId: string;
    kostId: string;
    residentName: string;
    onClose: () => void;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ userId, kostId, residentName, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                // Fetch all paid transactions for this user and kost
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .or(`kost_id.eq.${kostId},metadata->>kostId.eq.${kostId}`)
                    .eq('status', 'PAID')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setTransactions(data || []);
            } catch (err) {
                console.error("Error fetching payment history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [userId, kostId]);

    const getTransactionTypeLabel = (trx: any) => {
        const type = trx.product_type || '';
        const meta = trx.metadata || {};
        
        if (type === 'rent' || type === 'kost_booking') return 'Booking Pertama';
        if (type === 'perpanjangan_sewa') return 'Perpanjangan Sewa';
        if (type === 'tagihan_ekstra' || meta.billPayment) return 'Tagihan Fasilitas/Layanan';
        return 'Lainnya';
    };

    const getTransactionIcon = (trx: any) => {
        const type = trx.product_type || '';
        if (type === 'rent' || type === 'kost_booking' || type === 'perpanjangan_sewa') 
            return <Calendar className="text-orange-500" size={18} />;
        return <CheckCircle2 className="text-emerald-500" size={18} />;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Riwayat Pembayaran</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{residentName} • ID: {userId.substring(0,8)}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat data transaksi...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200">
                                <FileText size={32} />
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Belum ada riwayat pembayaran lunas</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((trx, idx) => (
                                <div key={trx.id} className="relative group">
                                    {/* Timeline line */}
                                    {idx !== transactions.length - 1 && (
                                        <div className="absolute left-[25px] top-14 bottom-[-20px] w-0.5 bg-gray-100 group-last:hidden" />
                                    )}
                                    
                                    <div className="flex gap-5">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center relative z-10 shadow-sm group-hover:border-orange-200 transition-colors">
                                            {getTransactionIcon(trx)}
                                        </div>
                                        
                                        <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-5 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{getTransactionTypeLabel(trx)}</p>
                                                    <h3 className="text-sm font-black text-gray-900 uppercase">
                                                        {trx.metadata?.billName || trx.metadata?.kostName || 'Pembayaran Kost'}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-gray-900 tracking-tighter leading-none">{FORMAT_CURRENCY(trx.amount)}</p>
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">LUNAS</span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                                        <Clock size={12} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tanggal Bayar</p>
                                                        <p className="text-[10px] font-bold text-gray-700">
                                                            {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                                        <CreditCard size={12} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Metode</p>
                                                        <p className="text-[10px] font-bold text-gray-700 uppercase">{trx.payment_method || 'OTOMATIS'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {trx.metadata?.composition && (
                                                <div className="mt-4 p-3 bg-gray-50/50 rounded-2xl border border-gray-50 space-y-1.5">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Rincian:</p>
                                                    {trx.metadata.composition.baseRent > 0 && (
                                                        <div className="flex justify-between text-[9px] font-bold text-gray-600 uppercase">
                                                            <span>Sewa Pokok</span>
                                                            <span>{FORMAT_CURRENCY(trx.metadata.composition.baseRent)}</span>
                                                        </div>
                                                    )}
                                                    {trx.metadata.composition.extraPersonFee > 0 && (
                                                        <div className="flex justify-between text-[9px] font-bold text-gray-600 uppercase">
                                                            <span>Extra Orang</span>
                                                            <span>+{FORMAT_CURRENCY(trx.metadata.composition.extraPersonFee)}</span>
                                                        </div>
                                                    )}
                                                    {trx.metadata.composition.facilityFee > 0 && (
                                                        <div className="flex justify-between text-[9px] font-bold text-emerald-600 uppercase">
                                                            <span>Fasilitas</span>
                                                            <span>+{FORMAT_CURRENCY(trx.metadata.composition.facilityFee)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Real-time dari Database</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistoryModal;
