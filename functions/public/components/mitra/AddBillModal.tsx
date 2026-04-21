import React, { useState } from 'react';
import { X, DollarSign, BookOpen, AlertCircle, Loader2, Send, Calendar } from 'lucide-react';
import { FORMAT_CURRENCY } from '../../constants';
import { createStandaloneBill } from '../../userService';

interface AddBillModalProps {
    resident: any;
    property: any;
    onClose: () => void;
    onSuccess: () => void;
}

const AddBillModal: React.FC<AddBillModalProps> = ({ resident, property, onClose, onSuccess }) => {
    const [billName, setBillName] = useState(property?.additionalFeeName || '');
    const [amount, setAmount] = useState<number>(Number(property?.additionalFeePrice) || 0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!billName.trim()) { setError('Nama tagihan wajib diisi'); return; }
        if (amount <= 0) { setError('Nominal harus lebih dari 0'); return; }

        setSubmitting(true);
        setError('');
        try {
            await createStandaloneBill({
                userId: resident.uid,
                productId: property.id,
                billName: billName,
                amount: amount,
                metadata: {
                    tenantName: resident.profile?.name,
                    kostName: property.title,
                    isManual: true
                }
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Gagal mengirim tagihan');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight">Tagih Biaya Tambahan</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Untuk: {resident.profile?.name}</p>
                        </div>
                        <button type="button" onClick={onClose} className="w-10 h-10 rounded-2xl hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2 animate-shake">
                                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-rose-600">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Tagihan</label>
                                <div className="relative">
                                    <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Contoh: WiFi Bulanan, Listrik..."
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:border-orange-500 transition-all"
                                        value={billName}
                                        onChange={(e) => setBillName(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400 font-medium italic ml-1">* Mengambil preset dari data kost</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 text-sm font-black text-gray-900 outline-none focus:border-orange-500 transition-all"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-orange-600" />
                                <p className="text-[10px] text-orange-900 font-black uppercase">Status Hunian: Bulan ke-{resident.currentMonth}</p>
                            </div>
                            
                            {property?.additionalFeeStartsFrom === 'month_2' && resident.currentMonth === 1 && (
                                <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-200">
                                    <p className="text-[9px] text-amber-800 font-bold leading-tight">
                                        ⚠️ Properti ini diatur untuk menagih biaya tambahan mulai <strong>Bulan Kedua</strong>. Penghuni saat ini masih di bulan pertama.
                                    </p>
                                </div>
                            )}

                            <p className="text-[10px] text-orange-700 font-bold leading-relaxed">
                                ℹ️ Tagihan ini akan langsung muncul di halaman "Kost Saya" milik penghuni sebagai tagihan yang harus dibayar.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 pt-0">
                        <button 
                            type="submit"
                            disabled={submitting}
                            className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Mengirim...</>
                            ) : (
                                <><Send size={16} /> Kirim Tagihan</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBillModal;
