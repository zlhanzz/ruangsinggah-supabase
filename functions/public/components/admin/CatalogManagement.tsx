import React, { useState } from 'react';
import { DatabaseProduct } from '../../types';
import { addDatabaseProduct, updateDatabaseProduct, deleteDatabase, saveSurveyCatalogSettings } from '../../adminService';

interface CatalogManagementProps {
    // Verification Props
    verifikasiPrice: number;
    setVerifikasiPrice: (price: number) => void;
    verifikasiDiscount: number;
    setVerifikasiDiscount: (discount: number) => void;
    verifikasiDescription: string;
    setVerifikasiDescription: (desc: string) => void;
    isSavingVerifikasi: boolean;
    setIsSavingVerifikasi: (isSaving: boolean) => void;
    // Database Props
    dbProducts: DatabaseProduct[];
    loadDatabases: () => void;
    // Common Props
    FORMAT_CURRENCY: (val: number) => string;
    setActiveMenu: (menu: string) => void;
    activeTab?: 'verification' | 'database';
}

const CatalogManagement: React.FC<CatalogManagementProps> = ({
    verifikasiPrice,
    setVerifikasiPrice,
    verifikasiDiscount,
    setVerifikasiDiscount,
    verifikasiDescription,
    setVerifikasiDescription,
    isSavingVerifikasi,
    setIsSavingVerifikasi,
    dbProducts,
    loadDatabases,
    FORMAT_CURRENCY,
    setActiveMenu,
    activeTab: initialTab = 'verification'
}) => {
    const [currentTab, setCurrentTab] = useState<'verification' | 'database'>(initialTab);

    // Sync state with prop if it changes
    React.useEffect(() => {
        setCurrentTab(initialTab);
    }, [initialTab]);

    const [isDbModalOpen, setIsDbModalOpen] = useState(false);
    const [editingDbId, setEditingDbId] = useState<string | null>(null);
    const [dbForm, setDbForm] = useState<Partial<DatabaseProduct>>({
        campus: '', city: '', area: '', description: '', price: 0, totalData: 0, fileType: 'link'
    });
    const [dbCoverFile, setDbCoverFile] = useState<File | null>(null);
    const [dbDocFile, setDbDocFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openDbModal = (db?: DatabaseProduct) => {
        if (db) {
            setDbForm(db);
            setEditingDbId(db.id);
        } else {
            setDbForm({ campus: '', city: '', area: '', description: '', price: 0, totalData: 0, fileType: 'link' });
            setEditingDbId(null);
        }
        setDbCoverFile(null);
        setDbDocFile(null);
        setIsDbModalOpen(true);
    };

    const handleDbSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingDbId) {
                await updateDatabaseProduct(editingDbId, dbForm, dbCoverFile, dbDocFile);
                alert('Database berhasil diperbarui!');
            } else {
                await addDatabaseProduct(dbForm, dbCoverFile, dbDocFile);
                alert('Database berhasil ditambahkan!');
            }
            setIsDbModalOpen(false);
            loadDatabases();
        } catch (error: any) {
            alert('Gagal menyimpan database: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDb = async (id: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus database ${name}?`)) return;
        try {
            await deleteDatabase(id);
            alert('Database berhasil dihapus!');
            loadDatabases();
        } catch (error: any) {
            alert('Gagal menghapus database: ' + error.message);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
            {/* TAB SWITCHER - Only show if not specifically forced by prop or keep hidden for separate menu feel */}
            {/* The user requested separate sidebar items, so we can hide this for a cleaner experience */}
            {false && (
                <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 w-full sm:w-fit mx-auto shadow-sm">
                    <button
                        onClick={() => setCurrentTab('verification')}
                        className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'verification' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Jasa Survey
                    </button>
                    <button
                        onClick={() => setCurrentTab('database')}
                        className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'database' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Produk Database
                    </button>
                </div>
            )}

            {(currentTab === 'verification') ? (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                    <div className="bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-20"></div>
                        <div className="relative z-10">
                            <div className="inline-flex py-1 px-3 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm backdrop-blur-md">
                                ★ Katalog Jasa RuangSinggah
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm leading-tight max-w-2xl">
                                Kelola Layanan Jasa Survey
                            </h2>
                            <p className="text-violet-100 font-medium mt-3 text-sm lg:text-base max-w-xl leading-relaxed opacity-90">
                                Atur informasi harga, diskon, dan manfaat layanan Live Video Call Cek Lokasi yang terintegrasi langsung dengan Cart Pembayaran.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Pengaturan Harga Layanan</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                    Harga Normal (Biaya Dasar)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                    <input
                                        type="number"
                                        value={verifikasiPrice}
                                        onChange={(e) => setVerifikasiPrice(Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 font-bold text-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                                        placeholder="Misal: 70000"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Harga aktual yang tercermin di seluruh analitik Dashboard.</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                                    Harga Diskon (Opsional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                    <input
                                        type="number"
                                        value={verifikasiDiscount}
                                        onChange={(e) => setVerifikasiDiscount(Number(e.target.value))}
                                        className="w-full bg-orange-50/30 border border-orange-100 rounded-xl pl-12 pr-4 py-4 text-orange-900 font-bold text-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                                        placeholder="Harga setelah potongan, contoh: 50000"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Jika diisi, harga normal akan dicoret pada antarmuka Klien.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">KONTROL DESKRIPSI (LANDING PAGE)</h3>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                Teks Benefit Layanan Ekstra
                            </label>
                            <textarea
                                rows={5}
                                value={verifikasiDescription}
                                onChange={(e) => setVerifikasiDescription(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                                placeholder="Berikan deskripsi profesional untuk diiklankan kepada pengguna..."
                            />
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <div className="text-blue-500 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-sm font-medium text-blue-900 leading-relaxed">
                                <strong>Efek Analitik:</strong> Nilai harga "<strong>{FORMAT_CURRENCY(verifikasiPrice)}</strong>" saat ini langsung dihubungkan dengan Grafik Performa Verifikasi pada Tab <span className="underline cursor-pointer" onClick={() => setActiveMenu('analytics')}>Ringkasan Analisis</span>. Perubahan Anda akan instan merevisi seluruh peta pendapatan layanan!
                            </p>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={async () => {
                                    setIsSavingVerifikasi(true);
                                    try {
                                        await saveSurveyCatalogSettings({
                                            price: verifikasiPrice,
                                            discount_price: verifikasiDiscount,
                                            description: verifikasiDescription,
                                        });
                                        alert('✅ Katalog berhasil disimpan! Harga baru akan aktif untuk semua order baru.');
                                    } catch (err: any) {
                                        alert('❌ Gagal menyimpan: ' + err.message);
                                    } finally {
                                        setIsSavingVerifikasi(false);
                                    }
                                }}
                                className={`px-8 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isSavingVerifikasi ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
                                disabled={isSavingVerifikasi}
                            >
                                {isSavingVerifikasi ? 'Menyimpan ke Database...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-20"></div>
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div>
                                <div className="inline-flex py-1 px-3 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm backdrop-blur-md">
                                    ★ Katalog Produk Digital
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm leading-tight max-w-2xl">
                                    Kelola Data Kost Kampus
                                </h2>
                                <p className="text-blue-100 font-medium mt-3 text-sm lg:text-base max-w-xl leading-relaxed opacity-90">
                                    Kelola database kost untuk setiap kampus. Hubungkan link Google Drive atau upload file Excel/PDF untuk dijual kepada pengguna.
                                </p>
                            </div>
                            <button
                                onClick={() => openDbModal()}
                                className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-gray-50 transition-all active:scale-95"
                            >
                                + Tambah Produk
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dbProducts && Array.isArray(dbProducts) && dbProducts.length > 0 ? (
                            dbProducts.map((db) => (
                            <div key={db.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                <div className="h-40 bg-gray-100 relative overflow-hidden">
                                    {db.fileUrls?.coverImage?.original ? (
                                        <img src={db.fileUrls.coverImage.original} alt={db.campus} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase rounded-full shadow-sm text-blue-600">{db.city}</span>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 truncate uppercase">{db.campus}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{db.area}</p>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Harga Jual</p>
                                            <p className="text-xl font-black text-gray-900 mt-0.5">{FORMAT_CURRENCY(db.price)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openDbModal(db)} className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => handleDeleteDb(db.id, db.campus)} className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Belum ada data kost kampus</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DATABASE FORM */}
            {isDbModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsDbModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-70 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingDbId ? 'Edit Database' : 'Tambah Database Baru'}</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Lengkapi informasi paket data kost</p>
                            </div>
                            <button onClick={() => setIsDbModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleDbSubmit} className="flex-grow overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Kampus</label>
                                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={dbForm.campus} onChange={e => setDbForm({ ...dbForm, campus: e.target.value })} placeholder="Contoh: IPB University" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Estimasi Jumlah Data</label>
                                    <input required type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={dbForm.totalData} onChange={e => setDbForm({ ...dbForm, totalData: Number(e.target.value) })} placeholder="Jumlah baris data" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kota</label>
                                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={dbForm.city} onChange={e => setDbForm({ ...dbForm, city: e.target.value })} placeholder="Misal: Bogor" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Area (Kecamatan)</label>
                                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={dbForm.area} onChange={e => setDbForm({ ...dbForm, area: e.target.value })} placeholder="Misal: Dramaga" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Deskripsi Paket</label>
                                <textarea required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" rows={3} value={dbForm.description} onChange={e => setDbForm({ ...dbForm, description: e.target.value })} placeholder="Jelaskan isi database ini..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Harga Jual (IDR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                    <input required type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 font-black text-gray-900 text-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={dbForm.price} onChange={e => setDbForm({ ...dbForm, price: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="space-y-3 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block mb-2">Metode Akses File</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <input type="radio" name="fileType" checked={dbForm.fileType === 'link'} onChange={() => setDbForm({ ...dbForm, fileType: 'link' })} className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Google Drive / Link</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <input type="radio" name="fileType" checked={dbForm.fileType === 'upload'} onChange={() => setDbForm({ ...dbForm, fileType: 'upload' })} className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Upload File Langsung</span>
                                    </label>
                                </div>

                                {dbForm.fileType === 'link' ? (
                                    <div className="mt-4 animate-in slide-in-from-top-2">
                                        <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="https://drive.google.com/..." value={(dbForm as any).fileUrl || dbForm.fileUrls?.link || ''} onChange={e => setDbForm({ ...dbForm, fileUrls: { ...dbForm.fileUrls, link: e.target.value } })} />
                                    </div>
                                ) : (
                                    <div className="mt-4 animate-in slide-in-from-top-2 space-y-2">
                                        <input type="file" accept=".xlsx,.xls,.pdf" onChange={e => setDbDocFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                        {dbForm.fileName && <p className="text-xs text-blue-500 font-bold italic px-1">File saat ini: {dbForm.fileName}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cover Produk (Thumbnail)</label>
                                <input type="file" accept="image/*" onChange={e => setDbCoverFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                                {dbForm.fileUrls?.coverImage?.original && <p className="text-xs text-green-600 font-bold italic px-1">Cover sudah tersedia</p>}
                            </div>
                        </form>
                        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4 sticky bottom-0 z-10">
                            <button type="button" onClick={() => setIsDbModalOpen(false)} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-white hover:text-gray-600 transition-all active:scale-95">Batal</button>
                            <button onClick={handleDbSubmit} disabled={isSubmitting} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-400">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogManagement;
