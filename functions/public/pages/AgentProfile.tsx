import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User, ShieldCheck, CreditCard, Landmark, Save, X, Edit2, Upload, BadgeCheck, AlertCircle, Clock } from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';

interface AgentProfileProps {
    uid: string;
    onEditModeChange?: (isEditing: boolean) => void;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ uid, onEditModeChange }) => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingKtp, setIsUploadingKtp] = useState(false);
    
    const [formData, setFormData] = useState({
        display_name: '',
        phone: '',
        address: '',
        ktp_number: '',
        ktp_address: '',
        ktp_photo_url: '',
        verification_status: 'unverified'
    });

    const [isExpandingVerification, setIsExpandingVerification] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [uid]);

    useEffect(() => {
        onEditModeChange?.(isEditing);
    }, [isEditing]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === uid) {
                const metadata = user.user_metadata || {};
                setFormData({
                    display_name: metadata.display_name || '',
                    phone: metadata.phone || '',
                    address: metadata.address || '',
                    ktp_number: metadata.ktp_number || '',
                    ktp_address: metadata.ktp_address || '',
                    ktp_photo_url: metadata.ktp_photo_url || '',
                    verification_status: metadata.verification_status || 'unverified'
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB');
            return;
        }

        setIsUploadingKtp(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uid}-${Math.random()}.${fileExt}`;
            const filePath = `ktp/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('survey-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('survey-photos')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, ktp_photo_url: publicUrl, verification_status: 'pending' }));
        } catch (error) {
            console.error('Error uploading KTP:', error);
            alert('Gagal upload KTP');
        } finally {
            setIsUploadingKtp(false);
        }
    };

    const handleSave = async () => {
        if (!formData.phone) {
            alert('Nomor WhatsApp wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: formData
            });

            if (error) throw error;
            setIsEditing(false);
            alert('Profile berhasil diperbarui');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Gagal menyimpan profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifySubmit = async () => {
        if (!formData.phone) {
            alert('Nomor WhatsApp wajib diisi sebelum verifikasi (untuk komunikasi)');
            const el = document.getElementById('basic-info-section');
            el?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        if (!formData.display_name || !formData.ktp_number || !formData.ktp_address || !formData.address || !formData.ktp_photo_url) {
            alert('Harap lengkapi semua data verifikasi termasuk Foto KTP');
            return;
        }
        setIsSubmitting(true);
        try {
            const updatedData = { ...formData, verification_status: 'pending' };
            const { error } = await supabase.auth.updateUser({
                data: updatedData
            });

            if (error) throw error;
            setFormData(updatedData);
            setIsExpandingVerification(false);
            alert('Verifikasi berhasil dikirim. Menunggu peninjauan admin.');
        } catch (error) {
            console.error('Error submitting verification:', error);
            alert('Gagal mengirim verifikasi');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Profile Header */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    <div className="w-32 h-32 bg-orange-100 rounded-[2.5rem] flex items-center justify-center text-4xl border-4 border-white shadow-lg shrink-0">
                        {formData.display_name?.charAt(0).toUpperCase() || <User size={48} />}
                    </div>
                    <div className="flex-grow">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                {formData.display_name || 'Agen Surveyor'}
                            </h2>
                            {formData.verification_status === 'verified' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                                    <BadgeCheck size={12} /> Verified Agent
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-6">
                            ID Agen: {uid.slice(0, 12).toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Identity Verification Section (Priority 1) */}
                <div id="verification-section" className="md:col-span-2">
                    {formData.verification_status === 'unverified' && !isExpandingVerification ? (
                        /* Simplified Unverified View */
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                    <ShieldCheck size={32} />
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Status Akun Belum Terverifikasi</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Selesaikan verifikasi untuk menerima orderan</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsExpandingVerification(true)}
                                className="w-full md:w-auto px-10 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <BadgeCheck size={16} /> Verifikasi Sekarang
                            </button>
                        </div>
                    ) : (
                        /* Full Verification UI (Form or Status) */
                        <div className="bg-orange-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-orange-100 relative overflow-hidden animate-in zoom-in-95 duration-500">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-bl-full -mr-32 -mt-32 blur-3xl"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight">
                                                {formData.verification_status === 'unverified' ? 'Input Data Verifikasi' : 'Proses Verifikasi'}
                                            </h3>
                                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Lengkapi data sesuai KTP asli Anda</p>
                                        </div>
                                    </div>
                                    {isExpandingVerification && formData.verification_status === 'unverified' && (
                                        <button 
                                            onClick={() => setIsExpandingVerification(false)}
                                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block ml-1">Nama Lengkap (Sesuai KTP)</label>
                                            {formData.verification_status === 'unverified' ? (
                                                <input 
                                                    name="display_name"
                                                    value={formData.display_name}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/30 focus:bg-white/20 outline-none transition-all"
                                                    placeholder="Nama Lengkap..."
                                                />
                                            ) : (
                                                <p className="px-6 py-4 bg-white/10 rounded-2xl text-sm font-black border border-white/5 uppercase">{formData.display_name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block ml-1">Nomor Induk Kependudukan (NIK)</label>
                                            {formData.verification_status === 'unverified' ? (
                                                <input 
                                                    name="ktp_number"
                                                    value={formData.ktp_number}
                                                    onChange={(e) => setFormData({...formData, ktp_number: e.target.value.replace(/\D/g, '').substring(0, 16)})}
                                                    maxLength={16}
                                                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/30 focus:bg-white/20 outline-none transition-all font-mono tracking-widest"
                                                    placeholder="16 Digit NIK..."
                                                />
                                            ) : (
                                                <p className="px-6 py-4 bg-white/10 rounded-2xl text-sm font-black border border-white/5 tracking-[0.2em] font-mono">
                                                    {formData.ktp_number.replace(/(\d{4})/g, '$1 ').trim()}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block ml-1">Alamat (Sesuai KTP)</label>
                                            {formData.verification_status === 'unverified' ? (
                                                <textarea 
                                                    name="ktp_address"
                                                    value={formData.ktp_address}
                                                    onChange={handleInputChange}
                                                    rows={2}
                                                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/30 focus:bg-white/20 outline-none transition-all resize-none"
                                                    placeholder="Alamat lengkap di KTP..."
                                                />
                                            ) : (
                                                <p className="px-6 py-4 bg-white/10 rounded-2xl text-sm font-bold border border-white/5 min-h-[4rem]">{formData.ktp_address}</p>
                                            )}
                                        </div>

                                        {/* Alamat Domisili */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block ml-1">Alamat Domisili (Saat Ini)</label>
                                            {formData.verification_status === 'unverified' ? (
                                                <textarea 
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    rows={2}
                                                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/30 focus:bg-white/20 outline-none transition-all resize-none"
                                                    placeholder="Alamat tinggal sekarang..."
                                                />
                                            ) : (
                                                <p className="px-6 py-4 bg-white/10 rounded-2xl text-sm font-bold border border-white/5 min-h-[4rem]">{formData.address}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-8 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block ml-1 text-center md:text-left">Foto KTP (Asli)</label>
                                            <div className="relative group aspect-[1.58/1] bg-white/10 rounded-[2rem] border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center transition-all hover:bg-white/20">
                                                {formData.ktp_photo_url ? (
                                                    <>
                                                        <img src={formData.ktp_photo_url} alt="KTP" className="w-full h-full object-cover" />
                                                        {formData.verification_status === 'unverified' && (
                                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer backdrop-blur-sm">
                                                                <Upload size={32} />
                                                                <span className="text-xs font-black uppercase tracking-widest">Ganti Foto</span>
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                                                            </label>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center p-8">
                                                        <label className="cursor-pointer space-y-4 block">
                                                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                                                                <Upload size={32} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black uppercase tracking-widest">{isUploadingKtp ? 'Uploading...' : 'Upload KTP'}</p>
                                                                <p className="text-[10px] font-bold opacity-60 uppercase">Max 2MB (JPG/PNG)</p>
                                                            </div>
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {formData.verification_status === 'verified' ? (
                                                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white"><BadgeCheck size={24} /></div>
                                                ) : formData.verification_status === 'pending' ? (
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/50 flex items-center justify-center text-white animate-pulse"><Clock size={24} /></div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-red-500/50 flex items-center justify-center text-white"><AlertCircle size={24} /></div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">Status Verifikasi</p>
                                                    <p className="text-xs font-black uppercase tracking-wider">
                                                        {formData.verification_status === 'verified' ? 'Telah Terverifikasi' : 
                                                         formData.verification_status === 'pending' ? 'Menunggu Peninjauan' : 
                                                         'Data Belum Lengkap'}
                                                    </p>
                                                </div>
                                            </div>
                                            {formData.verification_status === 'unverified' && (
                                                <button 
                                                    onClick={handleVerifySubmit}
                                                    disabled={isSubmitting || isUploadingKtp || !formData.ktp_photo_url || !formData.ktp_number || !formData.ktp_address || !formData.address}
                                                    className="px-8 py-3 bg-white text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? 'Mengirim...' : 'Submit Verifikasi'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Basic Information */}
                <div id="basic-info-section" className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">Informasi Dasar</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Data Kontak Surveyor</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={isSubmitting}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isEditing ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            {isSubmitting ? '...' : isEditing ? 'Simpan' : 'Edit'}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Nama Panggilan / Nama Agen</label>
                            {isEditing ? (
                                <input 
                                    name="display_name"
                                    value={formData.display_name}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 ring-orange-500/20 outline-none transition-all placeholder:text-gray-300"
                                    placeholder="Contoh: Arif Surveyor"
                                />
                            ) : (
                                <p className="text-sm font-black text-gray-900 uppercase bg-gray-50/50 px-5 py-3.5 rounded-2xl border border-gray-50">{formData.display_name || 'BELUM DIISI'}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">No. WhatsApp</label>
                            {isEditing ? (
                                <input 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 ring-orange-500/20 outline-none transition-all placeholder:text-gray-300"
                                    placeholder="Contoh: 0812..."
                                />
                            ) : (
                                <p className="text-sm font-black text-gray-900 bg-gray-50/50 px-5 py-3.5 rounded-2xl border border-gray-50">{formData.phone || 'BELUM DIISI'}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Alamat Domisili</label>
                            {isEditing ? (
                                <textarea 
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 ring-orange-500/20 outline-none transition-all placeholder:text-gray-300 resize-none"
                                    placeholder="Alamat lengkap..."
                                />
                            ) : (
                                <p className="text-sm font-bold text-gray-600 bg-gray-50/50 px-5 py-3.5 rounded-2xl border border-gray-50 min-h-[80px]">{formData.address || 'BELUM DIISI'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons (Edit Mode) */}
            {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 z-[120] bg-white border-t border-gray-100 p-6 sm:p-8 animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                loadProfile(); // Revert changes
                            }}
                            className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-100 transition-all active:scale-95"
                        >
                            <span className="flex items-center justify-center gap-2"><X size={14} /> Batalkan</span>
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSubmitting || isUploadingKtp}
                            className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Save size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentProfile;
