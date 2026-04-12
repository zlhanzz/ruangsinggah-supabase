
import React, { useState } from 'react';
import { updateMitraRequestStatus } from '../../adminService';

interface MitraManagementProps {
    mitraRequests: any[];
    activeMitra: any[];
    loadMitraRequests: () => void;
    loadActiveMitra: () => void;
    loading: boolean;
    onTransferProperty?: (mitra: any) => void;
}

const MitraManagement: React.FC<MitraManagementProps> = ({
    mitraRequests,
    activeMitra,
    loadMitraRequests,
    loadActiveMitra,
    loading
}) => {
    // --- LOCAL UI STATE ---
    const [isAddingManualMitra, setIsAddingManualMitra] = useState(false);
    const [manualMitraForm, setManualMitraForm] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [tab, setTab] = useState<'requests' | 'active'>('requests');
    const [searchQuery, setSearchQuery] = useState('');

    const handleManualMitraSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            alert('Fitur tambah mitra manual akan segera dihubungkan ke database. Saat ini data hanya disimulasikan di sesi browser.');
            setIsAddingManualMitra(false);
            setManualMitraForm({});
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredMitra = activeMitra.filter(mitra => 
        (mitra.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mitra.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mitra.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderRequests = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Pendaftar Mitra</h2>
                <button onClick={() => setIsAddingManualMitra(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    Tambah Manual
                </button>
            </div>
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-orange-500 shrink-0">🤝</span>
                <p className="text-sm font-medium text-orange-900">Daftar pendaftar yang ingin bergabung sebagai <strong>Mitra Pemilik Kost</strong>. Hubungi via WA untuk verifikasi dan onboarding.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {mitraRequests.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
                        <div className="text-4xl mb-4">📭</div>
                        <h3 className="text-gray-900 font-bold mb-1">Belum Ada Pendaftar</h3>
                        <p className="text-gray-500 text-sm">Pendaftaran mitra yang masuk akan muncul di sini.</p>
                    </div>
                ) : mitraRequests.map((mitra: any) => (
                    <div key={mitra.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{mitra.id.substring(0, 8)}</span>
                                        <span className="text-xs text-gray-400">{new Date(mitra.timestamp || mitra.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <p className="font-medium text-gray-500 text-sm">Nama: <span className="font-black text-gray-900 text-base">{mitra.name}</span></p>
                                </div>
                                <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                                    mitra.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-100' : 
                                    mitra.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 
                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                }`}>
                                    {mitra.status === 'accepted' ? 'Diterima' : mitra.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. WA</p><p className="font-bold text-gray-900 text-sm mt-0.5">{mitra.phone}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kost</p><p className="font-bold text-gray-900 text-sm mt-0.5">{mitra.property_name || '-'}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p><p className="font-bold text-gray-900 text-[11px] break-all leading-tight mt-1">{mitra.email || '-'}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat</p><p className="font-bold text-orange-600 text-[11px] leading-tight mt-1 line-clamp-1">{mitra.property_address || '-'}</p></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:w-44 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-5 justify-center">
                            {mitra.status !== 'accepted' && mitra.status !== 'rejected' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={async () => {
                                            if (window.confirm(`Terima pendaftaran ${mitra.name} sebagai Mitra Pemilik? Ini akan memperbarui role akun mereka.`)) {
                                                try {
                                                    await updateMitraRequestStatus(mitra.id, 'accepted', mitra.user_id);
                                                    alert('Mitra diterima dan role akun diperbarui!');
                                                    loadMitraRequests();
                                                    loadActiveMitra();
                                                } catch (err) {
                                                    alert('Gagal menerima mitra: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                                }
                                            }
                                        }} 
                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-bold active:scale-95 flex justify-center items-center gap-1 shadow-sm"
                                    >
                                        Terima
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (window.confirm(`Tolak pendaftaran ${mitra.name}?`)) {
                                                try {
                                                    await updateMitraRequestStatus(mitra.id, 'rejected');
                                                    alert('Pendaftaran ditolak.');
                                                    loadMitraRequests();
                                                } catch (err) {
                                                    alert('Gagal menolak mitra: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                                }
                                            }
                                        }} 
                                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-xs font-bold border border-red-200 active:scale-95 flex justify-center items-center gap-1"
                                    >
                                        Tolak
                                    </button>
                                </div>
                            )}
                            <button onClick={() => window.open(`https://wa.me/${mitra.phone}?text=${encodeURIComponent(`Halo ${mitra.name}, kami dari Admin RuangSinggah.id. Terima kasih sudah mendaftar sebagai Mitra. Kami ingin melanjutkan proses verifikasi Anda.`)}`, '_blank')} className="w-full bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                Follow Up WA
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderActive = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Cari mitra berdasarkan nama, email, atau HP..." 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMitra.map((mitra: any) => (
                    <div key={mitra.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl overflow-hidden">
                                {mitra.photo_url ? (
                                    <img src={mitra.photo_url} className="w-full h-full object-cover" />
                                ) : (
                                    <span>🏢</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight">{mitra.name || mitra.display_name}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Mitra Pemilik Kost</p>
                            </div>
                        </div>
                        <div className="space-y-2 mb-6 text-xs transition-all">
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-bold">WHATSAPP</span>
                                <span className="text-gray-900 font-black">{mitra.phone || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-bold">EMAIL</span>
                                <span className="text-gray-900 font-black truncate max-w-[150px]">{mitra.email || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-bold">TERDAFTAR</span>
                                <span className="text-gray-900 font-black">{new Date(mitra.created_at).toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => window.open(`https://wa.me/${mitra.phone}`, '_blank')}
                                    className="flex-1 py-2.5 bg-green-50 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all border border-green-100"
                                >
                                    Chat
                                </button>
                                <button 
                                    className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                                >
                                    Detail
                                </button>
                            </div>
                            {onTransferProperty && (
                                <button 
                                    onClick={() => onTransferProperty(mitra)}
                                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" /></svg>
                                    Transfer Properti Baru
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manajemen Mitra</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola pendaftaran dan status mitra pemilik kost.</p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all sm:w-fit">
                <button 
                    onClick={() => setTab('requests')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${tab === 'requests' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Antrean Pendaftar
                    {mitraRequests.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </button>
                <button 
                    onClick={() => setTab('active')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${tab === 'active' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Mitra Aktif
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Data...</div>
            ) : (
                tab === 'requests' ? renderRequests() : renderActive()
            )}

            {/* MODAL: MANUAL ADD MITRA */}
            {isAddingManualMitra && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsAddingManualMitra(false)}>
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-10 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center group">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tight">Tambah Mitra Manual</h2>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-2">Onboarding Offline</p>
                            </div>
                            <button onClick={() => setIsAddingManualMitra(false)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl text-gray-300 hover:text-red-500 hover:border-red-500 transition-all active:scale-90 shadow-sm">&times;</button>
                        </div>
                        
                        <form onSubmit={handleManualMitraSubmit} className="flex-grow overflow-y-auto p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <FormField label="Nama Lengkap" placeholder="Cth: Budi" value={manualMitraForm.name || ''} onChange={val => setManualMitraForm({...manualMitraForm, name: val})} />
                                <FormField label="No. WhatsApp" placeholder="62..." value={manualMitraForm.phone || ''} onChange={val => setManualMitraForm({...manualMitraForm, phone: val})} />
                                <div className="col-span-2">
                                    <FormField label="Email Akun" placeholder="Cth: budi@mail.com" value={manualMitraForm.email || ''} onChange={val => setManualMitraForm({...manualMitraForm, email: val})} />
                                </div>
                                <div className="col-span-2">
                                    <FormField label="Nama Kost / Properti" placeholder="Cth: Kost Mawar" value={manualMitraForm.propertyName || ''} onChange={val => setManualMitraForm({...manualMitraForm, propertyName: val})} />
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl transition-all mt-4">{isSubmitting ? '📦 Mendaftarkan...' : '💾 Daftarkan Mitra'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const FormField = ({ label, placeholder, value, onChange, type = "text" }: { label: string, placeholder?: string, value: string, onChange: (val: string) => void, type?: string }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <input 
            required
            type={type} 
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all placeholder:text-gray-300"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export default MitraManagement;
