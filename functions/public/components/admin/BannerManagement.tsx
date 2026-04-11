import React, { useState } from 'react';
import { Banner } from '../../types';
import { supabase } from '../../supabase';
import { deleteBanner } from '../../adminService';

interface BannerManagementProps {
    banners: Banner[];
    refreshData: () => void;
}

const BannerManagement: React.FC<BannerManagementProps> = ({
    banners,
    refreshData
}) => {
    // --- LOCAL HANDLERS ---
    const handleDeleteBanner = async (id: string) => {
        if (!window.confirm('Hapus banner ini?')) return;
        try {
            await deleteBanner(id);
            alert('Banner dihapus');
            refreshData();
        } catch (error) {
            console.error("Gagal menghapus banner:", error);
            alert('Gagal menghapus banner');
        }
    };

    // --- LOCAL UI STATE ---
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
    const [bannerForm, setBannerForm] = useState({
        title: '',
        image_url: '',
        link_url: '',
        sort_order: 1,
        is_active: true
    });
    const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openAddBannerModal = () => {
        setEditingBannerId(null);
        setBannerForm({ title: '', image_url: '', link_url: '', sort_order: banners.length + 1, is_active: true });
        setBannerImageFile(null);
        setIsBannerModalOpen(true);
    };

    const openEditBannerModal = (banner: Banner) => {
        setEditingBannerId(banner.id);
        setBannerForm({ 
            title: banner.title || '', 
            image_url: banner.image_url, 
            link_url: banner.link_url || '', 
            sort_order: banner.sort_order, 
            is_active: banner.is_active 
        });
        setBannerImageFile(null);
        setIsBannerModalOpen(true);
    };

    const handleBannerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let finalImageUrl = bannerForm.image_url;

            if (bannerImageFile) {
                const fileExt = bannerImageFile.name.split('.').pop();
                const fileName = `banner_${Math.random()}.${fileExt}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('banners')
                    .upload(fileName, bannerImageFile);

                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(data.path);
                finalImageUrl = publicUrl;
            }

            if (editingBannerId) {
                await supabase.from('banners').update({
                    ...bannerForm,
                    image_url: finalImageUrl
                }).eq('id', editingBannerId);
            } else {
                await supabase.from('banners').insert({
                    ...bannerForm,
                    image_url: finalImageUrl
                });
            }

            setIsBannerModalOpen(false);
            refreshData();
            alert('Banner berhasil disimpan!');
        } catch (error) {
            console.error('Error saving banner:', error);
            alert('Gagal menyimpan banner.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manajemen Banner Promo</h2>
                    <p className="text-gray-500 text-sm mt-1">Total {banners.length} banner terdaftar.</p>
                </div>
                <button 
                    onClick={openAddBannerModal}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    Tambah Banner
                </button>
            </div>

            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-orange-500 shrink-0">🖼️</span>
                <p className="text-sm font-medium text-orange-900">Kelola banner promosi yang muncul di carousel halaman utama. Gunakan gambar berasio 16:9 untuk hasil terbaik.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Preview</th>
                                <th className="px-6 py-4">Judul & Link</th>
                                <th className="px-6 py-4 text-center">Urutan</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {banners.map(banner => (
                                <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <img 
                                            src={banner.image_url} 
                                            alt={banner.title} 
                                            className="w-32 aspect-video rounded-lg object-cover bg-gray-100 border border-gray-100"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-black text-gray-900 leading-tight">{banner.title || '(Tanpa Judul)'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 truncate max-w-[200px]">
                                            {banner.link_url || 'Tidak ada link'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-900">
                                        {banner.sort_order}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {banner.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => openEditBannerModal(banner)}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteBanner(banner.id)}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {banners.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        Belum ada banner promo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL BANNER MANAGEMENT */}
            {isBannerModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={() => setIsBannerModalOpen(false)}>
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase text-gray-900">{editingBannerId ? 'Edit Banner' : 'Tambah Banner Promo'}</h3>
                            <button onClick={() => setIsBannerModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleBannerSubmit} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Nama / Judul Promo</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="Contoh: Promo Ramadhan"
                                    value={bannerForm.title}
                                    onChange={e => setBannerForm({...bannerForm, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                                    Gambar Banner (Format 16:9 disarankan)
                                </label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
                                    onChange={e => setBannerImageFile(e.target.files?.[0] || null)}
                                    required={!editingBannerId}
                                />
                                {editingBannerId && !bannerImageFile && bannerForm.image_url && (
                                    <p className="text-[9px] text-gray-400 mt-2 ml-1 italic">* Biarkan kosong jika tidak ingin mengubah gambar</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Link URL (Opsional)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="https://..."
                                    value={bannerForm.link_url}
                                    onChange={e => setBannerForm({...bannerForm, link_url: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Urutan (Sort)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        value={bannerForm.sort_order}
                                        onChange={e => setBannerForm({...bannerForm, sort_order: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Status Keaktifan</label>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setBannerForm({...bannerForm, is_active: !bannerForm.is_active})}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bannerForm.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bannerForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-xs font-bold text-gray-600">{bannerForm.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerManagement;
