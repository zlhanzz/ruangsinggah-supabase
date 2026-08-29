import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
    Printer, 
    Share2, 
    CheckCircle2, 
    Building2, 
    Calendar, 
    CreditCard, 
    ShieldCheck, 
    FileText, 
    ArrowLeft,
    Home,
    User,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';
import { generateRentReceiptWhatsAppMessage } from '../rentBillingService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DigitalReceiptPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<any>(null);
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReceipt = async () => {
            if (!orderId) {
                setError('ID Kwitansi tidak ditemukan.');
                setLoading(false);
                return;
            }

            try {
                const isUuid = UUID_REGEX.test(orderId);
                let txData: any = null;

                if (isUuid) {
                    const { data } = await supabase.from('transactions').select('*').eq('id', orderId).maybeSingle();
                    txData = data;
                }

                if (!txData) {
                    const { data } = await supabase.from('transactions').select('*').eq('pakasir_order_id', orderId).maybeSingle();
                    txData = data;
                }

                if (!txData) {
                    // Try looking in manual_invoices table as fallback
                    const { data: invData } = await supabase.from('manual_invoices').select('*').eq('id', orderId).maybeSingle();
                    if (invData) {
                        txData = {
                            id: invData.id,
                            amount: invData.total || invData.rental_amount,
                            status: invData.status === 'paid' ? 'PAID' : invData.status,
                            created_at: invData.bill_date || invData.created_at,
                            product_id: invData.kost_id,
                            metadata: {
                                tenantName: invData.recipient_name,
                                tenantPhone: invData.recipient_phone,
                                kostName: invData.kost_name,
                                roomNumber: invData.notes?.match(/Kamar\s*([0-9a-zA-Z]+)/i)?.[1] || '1',
                                basePrice: invData.rental_amount,
                                extraFee: (invData.total || 0) - (invData.rental_amount || 0),
                                billingPeriod: 'Bulanan'
                            }
                        };
                    }
                }

                if (!txData) {
                    throw new Error('Data kwitansi tidak ditemukan atau telah kedaluwarsa.');
                }

                setOrder(txData);

                if (txData.product_id) {
                    const { data: pData } = await supabase.from('properties').select('title, address, city').eq('id', txData.product_id).maybeSingle();
                    if (pData) setProperty(pData);
                }
            } catch (err: any) {
                console.error('Error fetching receipt data:', err);
                setError(err.message || 'Gagal memuat kwitansi.');
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [orderId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Memuat Kwitansi Resmi...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-200 space-y-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl mx-auto flex items-center justify-center">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Kwitansi Tidak Ditemukan</h2>
                    <p className="text-xs text-slate-500">{error || 'Dokumen yang Anda cari tidak tersedia.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black transition-all cursor-pointer"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    const meta = order.metadata || {};
    const tenantName = meta.tenantName || meta.userName || order.tenant_name || 'Penghuni Kost';
    const tenantPhone = meta.tenantPhone || meta.userPhone || order.user_email || '';
    const propTitle = property?.title || meta.kostName || meta.propertyTitle || 'Kost RuangSinggah';
    const roomNumber = meta.roomNumber || meta.room_number || meta.roomType || '1';
    const totalAmount = Number(order.amount || order.total_price || 0);
    const baseRent = Number(meta.baseRent || meta.basePrice || (totalAmount - Number(meta.extraFee || 0)));
    const extraFee = Number(meta.extraFee || meta.facilityFee || meta.extraPersonFee || 0);
    const extraFeeName = meta.extraFeeName || (meta.extraPersonFee ? 'Biaya Tambahan Orang' : 'Biaya Tambahan');
    const billingPeriod = meta.billingPeriod || meta.period || 'Bulanan';
    const newPeriodStart = meta.newPeriodStart || meta.startDate || meta.moveInDate;
    const newPeriodEnd = meta.newPeriodEnd || meta.endDate || meta.due_date;
    const cleanReceiptNo = (order.id || orderId || '').split('-').pop()?.toUpperCase() || orderId;

    const formatDate = (d?: string) => {
        if (!d || d === 'Sewa Berjalan') return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch {
            return d;
        }
    };

    const formattedPaidAt = order.created_at
        ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const handleShareWA = () => {
        const { message } = generateRentReceiptWhatsAppMessage({
            phone: (tenantPhone || '').replace(/[^0-9]/g, ''),
            tenantName,
            propertyTitle: propTitle,
            roomNumber,
            amount: totalAmount,
            paymentMethod: order.payment_method || 'Payment Gateway / QRIS',
            orderId: order.id || orderId,
            paidAt: order.created_at,
            billingPeriod,
            newPeriodStart,
            newPeriodEnd,
            extraFee,
            extraFeeName,
            basePrice: baseRent
        });

        const cleanPhone = (tenantPhone || '').replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
        const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white flex flex-col items-center">
            
            {/* Top Navigation Bar (Hidden on Print) */}
            <div className="max-w-2xl w-full flex items-center justify-between mb-4 print:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
                >
                    <ArrowLeft size={14} /> Kembali
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                        <Printer size={14} /> Cetak / PDF
                    </button>
                    <button
                        onClick={handleShareWA}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                        <Share2 size={14} /> WhatsApp
                    </button>
                </div>
            </div>

            {/* Main Document Box */}
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-xl overflow-hidden border border-slate-200 p-6 sm:p-10 print:shadow-none print:border-none print:rounded-none print:p-8">
                
                {/* Header PT RUANG SINGGAH NUSANTARA */}
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
                            <p className="text-sm font-mono font-black text-slate-900">#INV-{cleanReceiptNo}</p>
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
                        <p className="text-sm font-black text-slate-900">{tenantName}</p>
                        {tenantPhone && (
                            <p className="text-xs font-bold text-slate-600 font-mono">+{tenantPhone.replace(/[^0-9]/g, '')}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Home size={11} className="text-orange-500" /> Properti & Kamar
                        </p>
                        <p className="text-sm font-black text-slate-900">{propTitle}</p>
                        <p className="text-xs font-bold text-orange-600">Kamar No. {roomNumber}</p>
                    </div>
                </div>

                {/* Smart Lease Period Banner (Bersambung) */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={13} className="text-emerald-600" /> Periode Sewa Diperpanjang
                        </span>
                        <span className="text-[10px] font-black bg-emerald-200/70 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            Skema: {billingPeriod}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 pt-1">
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Tanggal Mulai Baru</span>
                            <span className="font-black text-slate-900">{formatDate(newPeriodStart)}</span>
                        </div>
                        <span className="text-slate-400 font-black">s/d</span>
                        <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Tanggal Berakhir Baru</span>
                            <span className="font-black text-emerald-700">{formatDate(newPeriodEnd)}</span>
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
                                    <p className="text-[10px] text-slate-500">{propTitle} - Kamar No. {roomNumber}</p>
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-slate-600">{billingPeriod}</td>
                                <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900">{FORMAT_CURRENCY(baseRent)}</td>
                            </tr>

                            {Boolean(extraFee && extraFee > 0) && (
                                <tr>
                                    <td className="py-3.5 px-4">
                                        <p className="font-black text-slate-900">{extraFeeName}</p>
                                        <p className="text-[10px] text-slate-500">Layanan tambahan kamar / denda keterlambatan</p>
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">1x</td>
                                    <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900">{FORMAT_CURRENCY(extraFee)}</td>
                                </tr>
                            )}

                            <tr className="bg-slate-50/80 font-black">
                                <td colSpan={2} className="py-4 px-4 text-slate-900 uppercase text-xs tracking-wider">
                                    TOTAL DIBAYAR (LUNAS)
                                </td>
                                <td className="py-4 px-4 text-right text-base text-emerald-700 font-mono">
                                    {FORMAT_CURRENCY(totalAmount)}
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
                            <span>Metode Pembayaran: <b>{order.payment_method || 'Payment Gateway / QRIS'}</b></span>
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

                {/* Bottom Action (Print-Hidden) */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
                    <button
                        onClick={() => navigate('/my-bookings/aktif')}
                        className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Home size={14} /> Akses Kost Saya
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold">
                        RuangSinggah • KostManager Billing Automation
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DigitalReceiptPage;
