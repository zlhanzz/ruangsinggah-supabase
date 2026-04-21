import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User, ShieldCheck, Landmark, Save, X, Edit2, Upload, BadgeCheck, AlertCircle, Clock, Search } from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';
import Tesseract from 'tesseract.js';

interface AgentProfileProps {
    uid: string;
    onEditModeChange?: (isEditing: boolean) => void;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ uid, onEditModeChange }) => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingKtp, setIsUploadingKtp] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    
    const [formData, setFormData] = useState({
        display_name: '',
        name: '', // sync with users.name
        phone: '',
        address: '',
        ktp_number: '',
        ktp_address: '',
        ktp_photo_url: '',
        photo_url: '',
        verification_status: 'unverified',
        verification_notes: ''
    });

    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const [isExpandingVerification, setIsExpandingVerification] = useState(false);
    const [sameAsKtp, setSameAsKtp] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [uid]);

    useEffect(() => {
        onEditModeChange?.(isEditing);
    }, [isEditing]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', uid)
                .single();

            if (profile) {
                setFormData({
                    display_name: profile.name || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    ktp_number: profile.ktp_number || '',
                    ktp_address: profile.ktp_address || '',
                    ktp_photo_url: profile.ktp_photo_url || '',
                    photo_url: profile.photo_url || '',
                    verification_status: profile.verification_status || 'unverified',
                    verification_notes: profile.verification_notes || '',
                    name: profile.name || ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const performOcr = async (imageUrl: string) => {
        setIsScanning(true);
        try {
            const { data: { text } } = await Tesseract.recognize(imageUrl, 'ind');
            const normalizedText = text.toUpperCase();
            
            let extractedNik = '';
            const nikLineMatch = normalizedText.match(/(?:NIK|MK|NK|NI K|N K|HIK|MIK|NX|H1K)[:\s]+([0-9?]{13,18})/i);
            if (nikLineMatch && nikLineMatch[1]) {
                extractedNik = nikLineMatch[1].replace(/\D/g, '').substring(0, 16);
            }

            const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
            let extractedName = '';
            const nameMatch = normalizedText.match(/(?:NAMA|HAMA|NANA|NAMA )[:\s]+([A-Z\s'.]+)/i);
            if (nameMatch && nameMatch[1]) {
                extractedName = nameMatch[1].split('\n')[0].trim();
            }

            let extractedAddress = '';
            const addressMatch = normalizedText.match(/(?:ALAMAT|ALAM AT)[:\s]+([\s\S]+?)(?:RT\/RW|KEL\/DESA|KECAMATAN|PROVINSI|KOTA)/i);
            if (addressMatch && addressMatch[1]) {
                extractedAddress = addressMatch[1].replace(/\n/g, ' ').trim();
            } else {
                // Fallback: look for lines that might be address
                const addressIndex = lines.findIndex(l => l.includes('ALAMAT') || l.includes('ALAM AT'));
                if (addressIndex !== -1 && lines[addressIndex + 1]) {
                    extractedAddress = lines[addressIndex + 1];
                    if (lines[addressIndex + 2] && !lines[addressIndex + 2].includes('RT/RW')) {
                        extractedAddress += ' ' + lines[addressIndex + 2];
                    }
                }
            }

            setFormData(prev => ({
                ...prev,
                ktp_number: extractedNik || prev.ktp_number,
                display_name: (extractedName && extractedName.length > 2) ? extractedName : prev.display_name,
                name: (extractedName && extractedName.length > 2) ? extractedName : prev.name,
                ktp_address: extractedAddress || prev.ktp_address
            }));

            if (extractedNik || extractedName || extractedAddress) {
                alert('Data KTP berhasil dipindai otomatis.');
            }
        } catch (error) {
            console.error('OCR Error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

            setFormData(prev => ({ ...prev, ktp_photo_url: publicUrl }));
            performOcr(publicUrl);
        } catch (error) {
            console.error('Error uploading KTP:', error);
        } finally {
            setIsUploadingKtp(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB');
            return;
        }

        setIsUploadingPhoto(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uid}-${Date.now()}.${fileExt}`;
            const filePath = `profiles/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('survey-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('survey-photos')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, photo_url: publicUrl }));
            alert('Foto profil berhasil diunggah. Jangan lupa klik "Simpan" di bawah!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Gagal mengunggah foto profil.');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!formData.phone) {
            alert('Nomor WhatsApp wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            await supabase.auth.updateUser({ data: formData });
            await supabase
                .from('users')
                .upsert({
                    id: uid,
                    name: formData.display_name,
                    full_name: formData.display_name,
                    email: formData.phone.includes('@') ? formData.phone : undefined, // Fallback if needed, but email is better from auth
                    phone: formData.phone,
                    address: formData.address,
                    photo_url: formData.photo_url,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
            setIsEditing(false);
            alert('Profile diperbarui');
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifySubmit = async () => {
        if (!formData.phone || !formData.ktp_photo_url) {
            alert('Lengkapi Foto KTP dan No WhatsApp');
            return;
        }
        setIsSubmitting(true);
        try {
            const updatedData = { ...formData, verification_status: 'pending' };
            await supabase.auth.updateUser({ data: updatedData });
            await supabase
                .from('users')
                .update({
                    name: formData.display_name,
                    full_name: formData.display_name,
                    phone: formData.phone,
                    address: formData.address,
                    ktp_number: formData.ktp_number,
                    ktp_address: formData.ktp_address,
                    ktp_photo_url: formData.ktp_photo_url,
                    verification_status: 'pending',
                    updated_at: new Date().toISOString()
                })
                .eq('id', uid);
            setFormData(updatedData as any);
            setIsExpandingVerification(false);
            alert('Verifikasi dikirim');
        } catch (error) {
            console.error('Error submitting verification:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20 text-left">
            {/* Header */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-4xl border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0 overflow-hidden relative">
                            {formData.photo_url ? (
                                <img src={formData.photo_url} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <span className="text-orange-200 font-black">{formData.display_name?.charAt(0).toUpperCase() || <User size={48} />}</span>
                            )}
                            
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-orange-600/40 backdrop-blur-sm flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center cursor-pointer hover:bg-orange-600 hover:text-white transition-all border border-gray-100 group-hover:scale-110">
                            <Upload size={18} />
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                        </label>
                    </div>
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                {formData.display_name || 'Agen Surveyor'}
                            </h2>
                            {formData.verification_status === 'verified' && (
                                <div className="bg-orange-600 text-white rounded-full p-1.5 shadow-lg shadow-orange-200" title="Terverifikasi">
                                    <BadgeCheck size={18} />
                                </div>
                            )}
                        </div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                            ID Agen: {uid.slice(0, 12).toUpperCase()}
                        </p>
                        
                        <div className="mt-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4 max-w-md">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Aksi Penting</p>
                                <p className="text-[10px] font-bold text-gray-700 leading-tight">
                                    Gunakan foto profil asli Anda (wajah terlihat jelas) untuk meningkatkan kepercayaan user & kredibilitas sebagai surveyor resmi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Verification */}
                <div id="verification-section" className="md:col-span-2">
                    {formData.verification_status === 'verified' ? (
                        <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-orange-600 text-white flex items-center justify-center shadow-xl shadow-orange-200">
                                    <BadgeCheck size={32} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-black text-orange-900 uppercase tracking-tight">Akun Terverifikasi</h3>
                                    <p className="text-xs font-bold text-orange-600/70 uppercase tracking-widest mt-1 italic">Selamat! Anda sudah bisa menerima orderan survey.</p>
                                </div>
                            </div>
                            <div className="px-6 py-2 bg-white/50 border border-orange-100 rounded-xl text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                Mitra Resmi RuangSinggah
                            </div>
                        </div>
                    ) : formData.verification_status === 'pending' ? (
                        <div className="bg-orange-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden text-center md:text-left">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center border border-white/30 animate-pulse">
                                        <Clock size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Verifikasi Sedang Ditinjau</h3>
                                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest leading-relaxed">Tim kami sedang melakukan validasi terhadap data Anda. Harap tunggu dalam 1x24 jam.</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 px-8 py-4 rounded-3xl border border-white/20 backdrop-blur-md">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Status: Menunggu</span>
                                </div>
                            </div>
                        </div>
                    ) : (formData.verification_status === 'rejected' && !isExpandingVerification) ? (
                        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5 text-left">
                                <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200">
                                    <AlertCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Verifikasi Ditolak</h3>
                                    <p className="text-xs font-bold text-red-600 uppercase mt-1 italic">Alasan: {formData.verification_notes || 'Data tidak sesuai.'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsExpandingVerification(true)} 
                                className="px-10 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                            >
                                Perbaiki Data & Ajukan Lagi
                            </button>
                        </div>
                    ) : (formData.verification_status === 'unverified' && !isExpandingVerification) ? (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100"><ShieldCheck size={32} /></div>
                                <div className="text-left">
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Belum Terverifikasi</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">Selesaikan verifikasi untuk menerima orderan</p>
                                </div>
                            </div>
                            <button onClick={() => setIsExpandingVerification(true)} className="px-10 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all">Verifikasi Sekarang</button>
                        </div>
                    ) : (
                        <div className="bg-orange-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20"><ShieldCheck size={24} /></div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight">
                                                {formData.verification_status === 'rejected' ? 'Perbaikan Data Verifikasi' : 'Input Data Verifikasi'}
                                            </h3>
                                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Pastikan data sesuai dengan KTP asli Anda</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsExpandingVerification(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><X size={20} /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Foto KTP (Asli)</label>
                                            <div className="relative aspect-[1.6/1] w-full rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                                                {formData.ktp_photo_url ? (
                                                    <img src={formData.ktp_photo_url} className="w-full h-full object-cover" alt="KTP" />
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center gap-3">
                                                        <Upload size={32} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{isUploadingKtp ? 'Uploading...' : 'Upload KTP'}</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                                                    </label>
                                                )}
                                                {isScanning && <div className="absolute inset-0 bg-orange-600/50 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs">Scanning...</div>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Nama (Sesuai KTP)</label>
                                            <input name="display_name" value={formData.display_name} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">NIK (16 Digit)</label>
                                            <input name="ktp_number" value={formData.ktp_number} onChange={handleInputChange} maxLength={16} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Alamat Sesuai KTP</label>
                                            <textarea name="ktp_address" value={formData.ktp_address} onChange={handleInputChange} rows={2} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none resize-none" />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Alamat Asal</label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={sameAsKtp} onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setSameAsKtp(checked);
                                                        if (checked) setFormData(prev => ({ ...prev, address: prev.ktp_address }));
                                                    }} className="w-4 h-4 rounded" />
                                                    <span className="text-[9px] font-black uppercase text-white/70">Sama dengan KTP</span>
                                                </label>
                                            </div>
                                            <textarea name="address" value={formData.address} onChange={handleInputChange} disabled={sameAsKtp} rows={2} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none resize-none disabled:opacity-50" />
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <div className="h-full bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col items-center justify-center text-center">
                                            <BadgeCheck size={40} className="mb-4 opacity-40" />
                                            <h4 className="text-sm font-black uppercase tracking-widest mb-4">Tips Verifikasi</h4>
                                            <ul className="text-[10px] font-bold text-white/60 space-y-3 text-left uppercase">
                                                <li>• Gunakan KTP asli</li>
                                                <li>• Tulisan harus terbaca</li>
                                                <li>• Cahaya cukup</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 text-left">
                                        {formData.verification_status === 'verified' ? <BadgeCheck className="text-green-400" /> : <Clock className="text-white/50" />}
                                        <div>
                                            <p className="text-[10px] font-black opacity-60 uppercase">Status Verifikasi</p>
                                            <p className="text-xs font-black uppercase">{formData.verification_status === 'verified' ? 'verified' : formData.verification_status === 'pending' ? 'menunggu' : 'belum lengkap'}</p>
                                        </div>
                                    </div>
                                    {(formData.verification_status === 'unverified' || formData.verification_status === 'rejected') && (
                                        <button onClick={handleVerifySubmit} disabled={isSubmitting || !formData.ktp_photo_url} className="w-full md:w-auto px-10 py-4 bg-white text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all">Submit Verifikasi</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div id="basic-info-section" className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden h-full">
                    <div className="flex items-center justify-between mb-8 text-left">
                        <h3 className="text-sm font-black uppercase text-gray-900">Informasi Dasar</h3>
                        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="px-6 py-2 bg-gray-50 text-gray-400 text-[10px] font-black uppercase rounded-xl hover:bg-gray-100">{isEditing ? 'Simpan' : 'Edit'}</button>
                    </div>
                    <div className="space-y-6 text-left">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nama Panggilan</label>
                            {isEditing ? <input name="display_name" value={formData.display_name} onChange={handleInputChange} className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold" /> : <p className="font-bold">{formData.display_name || '-'}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">WhatsApp</label>
                            {isEditing ? <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold" /> : <p className="font-bold">{formData.phone || '-'}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t p-6">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px]">Batal</button>
                        <button onClick={handleSave} className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px]">Simpan Perubahan</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentProfile;
