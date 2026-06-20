import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FORMAT_CURRENCY } from '../../constants';
import {
    saveManualInvoice,
    getManualInvoices,
    deleteManualInvoice,
    updateManualInvoiceStatus,
    ManualInvoice
} from '../../adminService';

// ============================================================
// TYPES
// ============================================================
interface BillItem {
    id: string;
    name: string;
    qty: number;
    unitPrice: number;
}

type BillCategory = 'sewa' | 'survey' | 'database';

interface BillData {
    billNumber: string;
    billDate: string;
    dueDate: string;
    category: BillCategory;
    recipientName: string;
    recipientAddress: string;
    recipientPhone: string;
    kostName: string;
    rentalAmount: number;
    commissionPercent: number;
    items: BillItem[];
    notes: string;
}

// ============================================================
// HELPERS
// ============================================================
const generateBillNumber = (): string => {
    const now = new Date();
    const ymd = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RS-BILL-${ymd}-${rand}`;
};

const toISODate = (d: Date) => d.toISOString().split('T')[0];
const formatDate = (iso: string): string => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const calcTotal = (bill: BillData): number => {
    if (bill.category === 'sewa') {
        return Math.round((bill.rentalAmount || 0) * (bill.commissionPercent || 0) / 100);
    }
    return bill.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
};

const STATUS_CONFIG = {
    issued: { label: 'Terbit', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    paid: { label: 'Lunas', color: 'bg-green-50 text-green-600 border-green-100' },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-50 text-red-500 border-red-100' },
};

// ============================================================
// BILL PREVIEW (reusable by both form & history)
// ============================================================
interface BillPreviewProps {
    bill: BillData | null;
    invoiceData?: ManualInvoice | null; // if from history
    printRef?: React.RefObject<HTMLDivElement>;
}

const BillPreviewContent: React.FC<BillPreviewProps> = ({ bill, invoiceData, printRef }) => {
    // Normalise: either from live form or from DB record
    const billNumber = bill?.billNumber ?? invoiceData?.bill_number ?? '';
    const billDate = bill?.billDate ?? invoiceData?.bill_date ?? '';
    const dueDate = bill?.dueDate ?? invoiceData?.due_date ?? '';
    const category = (bill?.category ?? invoiceData?.category ?? 'sewa') as BillCategory;
    const recipientName = bill?.recipientName ?? invoiceData?.recipient_name ?? '';
    const recipientPhone = bill?.recipientPhone ?? invoiceData?.recipient_phone ?? '';
    const recipientAddress = bill?.recipientAddress ?? invoiceData?.recipient_address ?? '';
    const kostName = bill?.kostName ?? invoiceData?.kost_name ?? '';
    const rentalAmount = bill?.rentalAmount ?? invoiceData?.rental_amount ?? 0;
    const commissionPercent = bill?.commissionPercent ?? invoiceData?.commission_percent ?? 0;
    const commissionAmount = invoiceData?.commission_amount ??
        Math.round(rentalAmount * commissionPercent / 100);
    const items = bill?.items ?? invoiceData?.items ?? [];
    const notes = bill?.notes ?? invoiceData?.notes ?? '';
    const total = bill ? calcTotal(bill) : (invoiceData?.total ?? 0);

    return (
        <div
            ref={printRef}
            id="bill-print-area"
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* ---- HEADER ---- */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-400 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <img
                                src="/logo.png"
                                alt="RuangSinggah.id"
                                className="h-12 w-auto"
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                            />
                            <h1 className="text-xl font-black text-white tracking-tight leading-none">
                                RuangSinggah<span className="text-yellow-200">.id</span>
                            </h1>
                        </div>
                        <p className="text-orange-100 text-xs font-medium">PT Ruang Singgah Nusantara</p>
                        <p className="text-orange-100 text-xs mt-1">Makassar, Sulawesi Selatan</p>
                        <p className="text-orange-100 text-xs">ruangsinggah.id | cs@ruangsinggah.id</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">Tagihan Resmi</p>
                        <p className="text-white font-black text-lg leading-tight">{billNumber}</p>
                        <div className="mt-2 space-y-0.5">
                            <p className="text-[10px] text-orange-100"><span className="font-bold">Tanggal:</span> {formatDate(billDate)}</p>
                            <p className="text-[10px] text-orange-100"><span className="font-bold">Jatuh Tempo:</span> {formatDate(dueDate)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- KATEGORI ---- */}
            <div className="px-6 sm:px-8 pt-5 flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    category === 'sewa' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    category === 'survey' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    'bg-green-50 text-green-600 border-green-100'
                }`}>
                    {category === 'sewa' ? '🏠 Komisi Penyewaan Kost' :
                     category === 'survey' ? '📋 Jasa Survey Kost' :
                     '🗄️ Database Kost'}
                </span>
            </div>

            {/* ---- PENERIMA ---- */}
            <div className="px-6 sm:px-8 pt-4 pb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ditagihkan Kepada:</p>
                <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-black text-gray-900 text-sm">{recipientName || <span className="text-gray-300 italic">Nama Penerima</span>}</p>
                    {recipientPhone && <p className="text-xs text-gray-500 mt-0.5">📱 {recipientPhone}</p>}
                    {recipientAddress && <p className="text-xs text-gray-500 mt-0.5">📍 {recipientAddress}</p>}
                </div>
            </div>

            {/* ---- TABEL ---- */}
            <div className="px-6 sm:px-8 py-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Rincian Tagihan:</p>
                {category === 'sewa' ? (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Nama Kost</th>
                                    <th className="text-right px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Nominal Sewa</th>
                                    <th className="text-right px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Komisi</th>
                                    <th className="text-right px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Nilai Komisi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-800">{kostName || <span className="text-gray-300 italic">—</span>}</td>
                                    <td className="px-4 py-3 text-right text-gray-700">{FORMAT_CURRENCY(rentalAmount)}</td>
                                    <td className="px-4 py-3 text-right text-gray-700">{commissionPercent}%</td>
                                    <td className="px-4 py-3 text-right font-bold text-orange-600">{FORMAT_CURRENCY(commissionAmount)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="px-4 py-2 bg-orange-50 border-t border-orange-100">
                            <p className="text-[10px] text-orange-500 font-medium">
                                * Komisi dihitung sebesar {commissionPercent}% dari nominal sewa {FORMAT_CURRENCY(rentalAmount)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Nama Barang / Jasa</th>
                                    <th className="text-right px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Harga Satuan</th>
                                    <th className="text-right px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th className="text-right px-4 py-3 font-black text-gray-500 uppercase tracking-wider">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(items as BillItem[]).map((item, idx) => (
                                    <tr key={item.id || idx} className={`border-t border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                                        <td className="px-4 py-3 font-semibold text-gray-800">{item.name || <span className="text-gray-300 italic">—</span>}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{FORMAT_CURRENCY(item.unitPrice)}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{item.qty}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{FORMAT_CURRENCY(item.qty * item.unitPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ---- CATATAN ---- */}
            {notes && (
                <div className="px-6 sm:px-8 pb-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Catatan:</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{notes}</p>
                    </div>
                </div>
            )}

            {/* ---- TOTAL ---- */}
            <div className="px-6 sm:px-8 pb-6">
                <div className="border-t-2 border-dashed border-gray-200 pt-4 flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Total Tagihan</p>
                    <div className="text-right">
                        <p className="text-2xl font-black text-orange-600 leading-tight">{FORMAT_CURRENCY(total)}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">
                            Jatuh Tempo: {formatDate(dueDate)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ---- FOOTER ---- */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pembayaran via</p>
                    <p className="text-xs font-bold text-gray-600 mt-0.5">Transfer Bank / QRIS RuangSinggah.id</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-400">Dokumen ini dibuat secara digital</p>
                    <p className="text-[10px] font-bold text-orange-500">ruangsinggah.id</p>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ManualBillManagement: React.FC = () => {
    const printRef = useRef<HTMLDivElement>(null);

    // --- TAB STATE ---
    const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

    // --- FORM STATE ---
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 14);

    const emptyItem = (): BillItem => ({ id: Date.now().toString(), name: '', qty: 1, unitPrice: 0 });

    const [bill, setBill] = useState<BillData>({
        billNumber: generateBillNumber(),
        billDate: toISODate(today),
        dueDate: toISODate(due),
        category: 'sewa',
        recipientName: '',
        recipientAddress: '',
        recipientPhone: '',
        kostName: '',
        rentalAmount: 0,
        commissionPercent: 10,
        items: [emptyItem()],
        notes: '',
    });

    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // --- HISTORY STATE ---
    const [invoices, setInvoices] = useState<ManualInvoice[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<ManualInvoice | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [historyFilter, setHistoryFilter] = useState<'all' | 'issued' | 'paid' | 'cancelled'>('all');
    const [historySearch, setHistorySearch] = useState('');

    useEffect(() => { if (window.innerWidth >= 1024) setShowPreview(true); }, []);

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const data = await getManualInvoices();
            setInvoices(data);
        } catch (e: any) {
            console.error('Gagal memuat riwayat:', e.message);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'history') loadHistory();
    }, [activeTab, loadHistory]);

    const total = calcTotal(bill);
    const commissionAmount = bill.category === 'sewa'
        ? Math.round((bill.rentalAmount || 0) * (bill.commissionPercent || 0) / 100)
        : 0;

    // --- FORM HANDLERS ---
    const handleChange = <K extends keyof BillData>(key: K, value: BillData[K]) =>
        setBill(prev => ({ ...prev, [key]: value }));

    const handleItemChange = (id: string, key: keyof BillItem, value: string | number) =>
        setBill(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, [key]: value } : i) }));

    const addItem = () => setBill(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
    const removeItem = (id: string) => setBill(prev => ({
        ...prev,
        items: prev.items.length > 1 ? prev.items.filter(i => i.id !== id) : prev.items,
    }));

    const handlePrint = () => window.print();

    const handleSave = async () => {
        if (!bill.recipientName) return alert('Nama penerima wajib diisi.');
        setIsSaving(true);
        try {
            await saveManualInvoice({
                bill_number: bill.billNumber,
                bill_date: bill.billDate,
                due_date: bill.dueDate,
                category: bill.category,
                recipient_name: bill.recipientName,
                recipient_phone: bill.recipientPhone,
                recipient_address: bill.recipientAddress,
                kost_name: bill.kostName,
                rental_amount: bill.rentalAmount,
                commission_percent: bill.commissionPercent,
                commission_amount: commissionAmount,
                items: bill.items,
                notes: bill.notes,
                total,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e: any) {
            alert('Gagal menyimpan tagihan: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const resetBill = () => {
        const newToday = new Date();
        const newDue = new Date(newToday);
        newDue.setDate(newDue.getDate() + 14);
        setBill({
            billNumber: generateBillNumber(),
            billDate: toISODate(newToday),
            dueDate: toISODate(newDue),
            category: 'sewa',
            recipientName: '',
            recipientAddress: '',
            recipientPhone: '',
            kostName: '',
            rentalAmount: 0,
            commissionPercent: 10,
            items: [emptyItem()],
            notes: '',
        });
        setShowPreview(false);
    };

    // --- HISTORY HANDLERS ---
    const handleDeleteInvoice = async (id: string, billNum: string) => {
        if (!window.confirm(`Hapus tagihan ${billNum}? Tindakan ini tidak dapat dibatalkan.`)) return;
        try {
            await deleteManualInvoice(id!);
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        } catch (e: any) {
            alert('Gagal menghapus: ' + e.message);
        }
    };

    const handleStatusChange = async (id: string, status: 'issued' | 'paid' | 'cancelled') => {
        try {
            await updateManualInvoiceStatus(id, status);
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
        } catch (e: any) {
            alert('Gagal mengubah status: ' + e.message);
        }
    };

    const openPreviewModal = (inv: ManualInvoice) => {
        setSelectedInvoice(inv);
        setIsPreviewModalOpen(true);
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchStatus = historyFilter === 'all' || inv.status === historyFilter;
        const search = historySearch.toLowerCase();
        const matchSearch = !search ||
            inv.bill_number.toLowerCase().includes(search) ||
            inv.recipient_name.toLowerCase().includes(search);
        return matchStatus && matchSearch;
    });

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <>
            {/* ===== PRINT CSS ===== */}
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #bill-print-area, #bill-print-area * { visibility: visible !important; }
                    #bill-print-area {
                        position: fixed !important; top: 0 !important; left: 0 !important;
                        width: 100% !important; border-radius: 0 !important;
                        border: none !important; box-shadow: none !important; padding: 0 !important;
                    }
                    @page { margin: 1.5cm; size: A4; }
                }
            `}</style>

            {/* ===== PREVIEW MODAL (dari Riwayat) ===== */}
            {isPreviewModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setIsPreviewModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Preview Invoice</p>
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="text-xs font-black text-orange-600 border border-orange-200 px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors">
                                    🖨️ Cetak PDF
                                </button>
                                <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <BillPreviewContent invoiceData={selectedInvoice} bill={null} printRef={printRef} />
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* ===== PAGE HEADER ===== */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">🧾 Tagihan Manual</h2>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">Buat & kelola invoice resmi RuangSinggah</p>
                    </div>
                </div>

                {/* ===== TABS ===== */}
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
                    {([
                        { key: 'form', icon: '✏️', label: 'Buat Tagihan' },
                        { key: 'history', icon: '📋', label: 'Riwayat' },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === tab.key
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                            {tab.key === 'history' && invoices.length > 0 && (
                                <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">{invoices.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ===== SUCCESS TOAST ===== */}
                {saveSuccess && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <span className="text-xl">✅</span>
                        <div>
                            <p className="text-xs font-black text-green-700">Tagihan berhasil disimpan!</p>
                            <p className="text-[10px] text-green-500 font-medium">Invoice tersimpan di database dan bisa dilihat di tab Riwayat.</p>
                        </div>
                    </div>
                )}

                {/* =========================================== */}
                {/* TAB: BUAT TAGIHAN                           */}
                {/* =========================================== */}
                {activeTab === 'form' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* --- FORM PANEL --- */}
                        <div className="space-y-4">
                            {/* Kategori */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis Tagihan</p>
                                    <button onClick={resetBill} className="text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                                        🔄 Reset
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {([
                                        { val: 'sewa', icon: '🏠', label: 'Komisi Sewa' },
                                        { val: 'survey', icon: '📋', label: 'Jasa Survey' },
                                        { val: 'database', icon: '🗄️', label: 'Database' },
                                    ] as const).map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => handleChange('category', opt.val)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all ${
                                                bill.category === opt.val
                                                    ? 'border-orange-400 bg-orange-50 text-orange-600'
                                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                        >
                                            <span className="text-xl">{opt.icon}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info Bill */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Bill</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">No. Tagihan</label>
                                        <input type="text" value={bill.billNumber} onChange={e => handleChange('billNumber', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-orange-400 bg-gray-50" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Tanggal Bill</label>
                                        <input type="date" value={bill.billDate} onChange={e => handleChange('billDate', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-orange-400" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Jatuh Tempo</label>
                                        <input type="date" value={bill.dueDate} onChange={e => handleChange('dueDate', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-orange-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Penerima */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ditagihkan Kepada</p>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nama Penerima <span className="text-red-400">*</span></label>
                                    <input type="text" placeholder="Contoh: Budi Santoso / CV Kost Jaya" value={bill.recipientName}
                                        onChange={e => handleChange('recipientName', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">No. HP / WhatsApp</label>
                                    <input type="text" placeholder="08XXXXXXXXXX" value={bill.recipientPhone}
                                        onChange={e => handleChange('recipientPhone', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Alamat (opsional)</label>
                                    <input type="text" placeholder="Jl. Contoh No. 1, Makassar" value={bill.recipientAddress}
                                        onChange={e => handleChange('recipientAddress', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400" />
                                </div>
                            </div>

                            {/* Item Tagihan (kondisional) */}
                            {bill.category === 'sewa' ? (
                                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Komisi Penyewaan</p>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nama Kost <span className="text-red-400">*</span></label>
                                        <input type="text" placeholder="Contoh: Kost Pak Budi — Jl. Veteran" value={bill.kostName}
                                            onChange={e => handleChange('kostName', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nominal Sewa (Rp) <span className="text-red-400">*</span></label>
                                        <input type="number" placeholder="0" min="0" value={bill.rentalAmount || ''}
                                            onChange={e => handleChange('rentalAmount', Number(e.target.value))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Persentase Komisi (%)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" min="0" max="100" step="0.5" value={bill.commissionPercent}
                                                onChange={e => handleChange('commissionPercent', Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400" />
                                            <span className="text-sm font-black text-gray-400">%</span>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Nilai Komisi (Otomatis)</p>
                                            <p className="text-xs text-orange-600 font-medium mt-0.5">
                                                {FORMAT_CURRENCY(bill.rentalAmount || 0)} × {bill.commissionPercent}%
                                            </p>
                                        </div>
                                        <p className="text-xl font-black text-orange-600">{FORMAT_CURRENCY(commissionAmount)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Tagihan</p>
                                        <button onClick={addItem} className="text-[10px] font-black text-orange-500 uppercase tracking-wider border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors">
                                            + Tambah Item
                                        </button>
                                    </div>
                                    {bill.items.map((item, idx) => (
                                        <div key={item.id} className="border border-gray-100 rounded-2xl p-3 space-y-2 bg-gray-50/50">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item {idx + 1}</p>
                                                {bill.items.length > 1 && (
                                                    <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-400 font-bold hover:text-red-600">Hapus</button>
                                                )}
                                            </div>
                                            <input type="text" placeholder="Nama barang/jasa..." value={item.name}
                                                onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Harga Satuan (Rp)</label>
                                                    <input type="number" min="0" value={item.unitPrice || ''}
                                                        onChange={e => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Jumlah (Qty)</label>
                                                    <input type="number" min="1" value={item.qty}
                                                        onChange={e => handleItemChange(item.id, 'qty', Math.max(1, Number(e.target.value)))}
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white" />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400">Subtotal: <span className="text-orange-600">{FORMAT_CURRENCY(item.qty * item.unitPrice)}</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Catatan */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Catatan (opsional)</label>
                                <textarea rows={2} placeholder="Contoh: Pembayaran harap dilakukan sebelum jatuh tempo..."
                                    value={bill.notes} onChange={e => handleChange('notes', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 resize-none" />
                            </div>

                            {/* Total & CTA */}
                            <div className="bg-gradient-to-r from-orange-500 to-amber-400 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-lg shadow-orange-100">
                                <div>
                                    <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest">Total Tagihan</p>
                                    <p className="text-2xl font-black text-white leading-tight mt-0.5">{FORMAT_CURRENCY(total)}</p>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={!bill.recipientName || isSaving}
                                            className="bg-white/20 text-white border border-white/30 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl hover:bg-white/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSaving ? '⏳ Menyimpan...' : '💾 Simpan'}
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            disabled={!bill.recipientName}
                                            className="bg-white text-orange-600 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl hover:bg-orange-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                                        >
                                            🖨️ Cetak
                                        </button>
                                    </div>
                                    <button onClick={() => setShowPreview(p => !p)} className="text-[10px] font-black text-orange-100 uppercase tracking-wider lg:hidden">
                                        {showPreview ? 'Sembunyikan Preview' : 'Lihat Preview'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- PREVIEW PANEL --- */}
                        <div className={`${showPreview ? 'block' : 'hidden lg:block'}`}>
                            <div className="sticky top-6">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview Bill</p>
                                    <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Real-time</span>
                                </div>
                                <BillPreviewContent bill={bill} printRef={printRef} />
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================== */}
                {/* TAB: RIWAYAT                                */}
                {/* =========================================== */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {/* Filter & Search */}
                        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
                            <input
                                type="text"
                                placeholder="🔍 Cari no. tagihan atau nama penerima..."
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                                className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                            />
                            <div className="flex gap-1.5 flex-wrap">
                                {(['all', 'issued', 'paid', 'cancelled'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setHistoryFilter(f)}
                                        className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all ${
                                            historyFilter === f
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {f === 'all' ? 'Semua' : STATUS_CONFIG[f].label}
                                    </button>
                                ))}
                            </div>
                            <button onClick={loadHistory} className="text-[10px] font-black text-gray-400 uppercase tracking-wider border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                🔄 Refresh
                            </button>
                        </div>

                        {/* List */}
                        {loadingHistory ? (
                            <div className="bg-white rounded-3xl p-12 border border-gray-100 flex items-center justify-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat riwayat...</p>
                            </div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 border border-gray-100 flex flex-col items-center justify-center gap-3 text-center">
                                <span className="text-4xl">🧾</span>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                                    {invoices.length === 0 ? 'Belum ada tagihan tersimpan' : 'Tidak ada hasil'}
                                </p>
                                <p className="text-xs text-gray-300 font-medium">
                                    {invoices.length === 0
                                        ? 'Buat tagihan di tab "Buat Tagihan" dan klik tombol 💾 Simpan'
                                        : 'Coba ubah filter atau kata kunci pencarian'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredInvoices.map(inv => {
                                    const statusCfg = STATUS_CONFIG[inv.status || 'issued'];
                                    return (
                                        <div key={inv.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
                                            {/* Info utama */}
                                            <div className="flex-1 min-w-48">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-xs font-black text-gray-900">{inv.bill_number}</p>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                        inv.category === 'sewa' ? 'bg-blue-50 text-blue-500' :
                                                        inv.category === 'survey' ? 'bg-purple-50 text-purple-500' :
                                                        'bg-green-50 text-green-500'
                                                    }`}>
                                                        {inv.category === 'sewa' ? 'Komisi Sewa' : inv.category === 'survey' ? 'Survey' : 'Database'}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">{inv.recipient_name}</p>
                                                {inv.recipient_phone && <p className="text-[10px] text-gray-400 mt-0.5">📱 {inv.recipient_phone}</p>}
                                                <p className="text-[10px] text-gray-400 mt-0.5">📅 {formatDate(inv.bill_date)} · Jatuh tempo: {formatDate(inv.due_date)}</p>
                                            </div>

                                            {/* Total */}
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                                                <p className="text-lg font-black text-orange-600">{FORMAT_CURRENCY(inv.total)}</p>
                                            </div>

                                            {/* Aksi */}
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <button onClick={() => openPreviewModal(inv)}
                                                    className="text-[10px] font-black text-orange-500 border border-orange-200 px-3 py-2 rounded-xl hover:bg-orange-50 transition-colors">
                                                    👁️ Preview
                                                </button>
                                                <select
                                                    value={inv.status || 'issued'}
                                                    onChange={e => handleStatusChange(inv.id!, e.target.value as any)}
                                                    className="text-[10px] font-black text-gray-600 border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:border-orange-400 bg-gray-50"
                                                >
                                                    <option value="issued">Terbit</option>
                                                    <option value="paid">Lunas</option>
                                                    <option value="cancelled">Dibatalkan</option>
                                                </select>
                                                <button onClick={() => handleDeleteInvoice(inv.id!, inv.bill_number)}
                                                    className="text-[10px] font-black text-red-400 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                                                    🗑️ Hapus
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ManualBillManagement;
