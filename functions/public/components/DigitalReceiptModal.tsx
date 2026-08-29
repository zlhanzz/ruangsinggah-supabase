import React, { useRef } from 'react';
import { 
    X, 
    Printer, 
    Share2, 
    CheckCircle2, 
    Building2, 
    Calendar, 
    CreditCard, 
    ShieldCheck, 
    FileText, 
    ExternalLink,
    Clock,
    Sparkles,
    User,
    Home
} from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';
import { generateRentReceiptWhatsAppMessage } from '../rentBillingService';

export interface ReceiptData {
    receiptNumber: string;
    paidAt?: string;
    tenantName: string;
    tenantPhone?: string;
    propertyTitle: string;
    roomNumber: string;
    billingPeriod?: string;
    previousPeriodStart?: string;
    previousPeriodEnd?: string;
    newPeriodStart?: string;
    newPeriodEnd?: string;
    baseRent: number;
    extraFee?: number;
    extraFeeName?: string;
    totalAmount: number;
    paymentMethod?: string;
    status?: string;
    notes?: string;
}

interface DigitalReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receipt: ReceiptData | null;
}

const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
    isOpen,
    onClose,
    receipt
}) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !receipt) return null;

    const formatDate = (d?: string) => {
        if (!d || d === 'Sewa Berjalan') return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch {
            return d;
        }
    };

    const formattedPaidAt = receipt.paidAt 
        ? new Date(receipt.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const cleanReceiptNo = (receipt.receiptNumber || 'RS-INV').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();

    const handlePrint = () => {
        window.print();
    };

    const handleShareWA = () => {
        const { message } = generateRentReceiptWhatsAppMessage({
            phone: (receipt.tenantPhone || '').replace(/[^0-9]/g, ''),
            tenantName: receipt.tenantName,
            propertyTitle: receipt.propertyTitle,
            roomNumber: receipt.roomNumber,
            amount: receipt.totalAmount,
            paymentMethod: receipt.paymentMethod,
            orderId: receipt.receiptNumber,
            paidAt: receipt.paidAt,
            billingPeriod: receipt.billingPeriod,
            newPeriodStart: receipt.newPeriodStart,
            newPeriodEnd: receipt.newPeriodEnd,
            extraFee: receipt.extraFee,
            extraFeeName: receipt.extraFeeName,
            basePrice: receipt.baseRent
        });

        const cleanPhone = (receipt.tenantPhone || '').replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
        const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl my-auto shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full" onClick={e => e.stopPropagation()}>
                
                {/* Modal Controls Bar (Hidden during Print) */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                            <FileText size={15} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">Kwitansi Pembayaran Resmi</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Printer size={13} /> Cetak / PDF
                        </button>
                        <button
                            type="button"
                            onClick={handleShareWA}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Share2 size={13} /> WhatsApp
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div ref={printAreaRef} className="p-6 sm:p-10 bg-white relative print:p-8">
                    
                    {/* Official Corporate Header */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                                        RS
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">RUANGSINGGAH</h2>
                                        <p className="text-[10px] font-black text-orange-600 tracking-wider uppercase mt-0.5">PT RUANG SINGGAH NUSANTARA</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-sm mt-2">
                                    NIB: 1008250025911 • Perizinan Berusaha Berbasis Risiko<br />
                                    Jl. Komunikasi IV No. H 23/125, Kec. Manggala, Kota Makassar, Sulsel<br />
                                    Situs Resmi: https://ruangsinggah.id
                                </p>
                            </div>

                            <div className="text-left sm:text-right">
                                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[11px] uppercase tracking-widest rounded-full border border-emerald-200 mb-2">
                                    BUKTI PEMBAYARAN LUNAS
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Kwitansi</p>
                                <p className="text-sm font-mono font-black text-slate-900">#{cleanReceiptNo}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-1">{formattedPaidAt}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tenant & Property Overview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 mb-6">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <User size={11} className="text-orange-500" /> Informasi Penyewa
                            </p>
                            <p className="text-sm font-black text-slate-900">{receipt.tenantName}</p>
                            {receipt.tenantPhone && (
                                <p className="text-xs font-bold text-slate-600 font-mono">+{receipt.tenantPhone.replace(/[^0-9]/g, '')}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Home size={11} className="text-orange-500" /> Properti & Kamar
                            </p>
                            <p className="text-sm font-black text-slate-900">{receipt.propertyTitle}</p>
                            <p className="text-xs font-bold text-orange-600">Kamar No. {receipt.roomNumber}</p>
                        </div>
                    </div>

                    {/* Smart Lease Period Banner (Bersambung) */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={13} className="text-emerald-600" /> Periode Sewa Diperpanjang
                            </span>
                            <span className="text-[10px] font-black bg-emerald-200/70 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                Skema: {receipt.billingPeriod || 'Bulanan'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 pt-1">
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Tanggal Mulai Baru</span>
                                <span className="font-black text-slate-900">{formatDate(receipt.newPeriodStart || receipt.previousPeriodEnd)}</span>
                            </div>
                            <span className="text-slate-400 font-black">s/d</span>
                            <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Tanggal Berakhir Baru</span>
                                <span className="font-black text-emerald-700">{formatDate(receipt.newPeriodEnd)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Billing Breakdown Table */}
                    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                                    <th className="py-3 px-4">Deskripsi Item Tagihan</th>
                                    <th className="py-3 px-4 text-center">Durasi / Skema</th>
                                    <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                <tr>
                                    <td className="py-3.5 px-4">
                                        <p className="font-black text-slate-900">Sewa Pokok Kamar</p>
                                        <p className="text-[10px] text-slate-500">{receipt.propertyTitle} - Kamar No. {receipt.roomNumber}</p>
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">{receipt.billingPeriod || '1 Bulan'}</td>
                                    <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900">{FORMAT_CURRENCY(receipt.baseRent)}</td>
                                </tr>

                                {Boolean(receipt.extraFee && receipt.extraFee > 0) && (
                                    <tr>
                                        <td className="py-3.5 px-4">
                                            <p className="font-black text-slate-900">{receipt.extraFeeName || 'Biaya Tambahan'}</p>
                                            <p className="text-[10px] text-slate-500">Layanan tambahan kamar / denda keterlambatan</p>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">1x</td>
                                        <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900">{FORMAT_CURRENCY(receipt.extraFee || 0)}</td>
                                    </tr>
                                )}

                                <tr className="bg-slate-50/80 font-black">
                                    <td colSpan={2} className="py-4 px-4 text-slate-900 uppercase text-xs tracking-wider">
                                        TOTAL DIBAYAR (LUNAS)
                                    </td>
                                    <td className="py-4 px-4 text-right text-base text-emerald-700 font-mono">
                                        {FORMAT_CURRENCY(receipt.totalAmount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Method & Digital Seal */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-2">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                <CreditCard size={14} className="text-orange-500" />
                                <span>Metode Pembayaran: <b>{receipt.paymentMethod || 'Payment Gateway / QRIS'}</b></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                <span>Status Transaksi: <b>VERIFIED & LUNAS</b></span>
                            </div>
                            <p className="text-[9px] text-slate-400 italic max-w-xs leading-tight">
                                Dokumen ini diterbitkan secara elektronik oleh sistem KostManager RuangSinggah dan sah tanpa tanda tangan basah.
                            </p>
                        </div>

                        {/* Visual Digital Stamp */}
                        <div className="border-2 border-dashed border-emerald-500 rounded-2xl p-3 bg-emerald-50/50 text-center min-w-[170px] shadow-sm transform -rotate-1">
                            <div className="flex items-center justify-center gap-1 text-emerald-700 mb-0.5">
                                <CheckCircle2 size={16} />
                                <span className="font-black text-xs uppercase tracking-wider">LUNAS</span>
                            </div>
                            <p className="text-[8px] font-black text-emerald-800 uppercase tracking-widest leading-none">PT RUANG SINGGAH NUSANTARA</p>
                            <p className="text-[8px] font-bold text-emerald-600 font-mono mt-0.5">{formattedPaidAt.split(' ')[0]}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls (Print-Hidden) */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center print:hidden">
                    <p className="text-[10px] text-slate-400 font-bold">
                        KostManager Billing Automation • RuangSinggah.id
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalReceiptModal;
