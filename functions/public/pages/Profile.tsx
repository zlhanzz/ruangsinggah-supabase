
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { notifyAdminIdentityVerification } from '../emailService';

interface ProfileProps {
  user: any;
  onLogout: () => void;
  onSaveSuccess?: () => void;
  forceEdit?: boolean;
  onBack?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onSaveSuccess, forceEdit, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    occupation: '',
    institution: '',
    gender: '',
    relationshipStatus: '',
    religion: '',
    birthPlace: '',
    birthDate: '',
    address: '',
    photoURL: '',
    ktp_number: '',
    ktp_photo_url: '',
    verification_status: 'unverified'
  });
  const [ktpPhotoFile, setKtpPhotoFile] = useState<File | null>(null);
  const [isUploadingKtp, setIsUploadingKtp] = useState(false);


  const religions = [
    'Islam', 'Kristen Protestan', 'Kristen Katolik',
    'Hindu', 'Buddha', 'Konghucu', 'Lainnya'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || user.name || user.full_name || '',
        phone: user.phone || user.phoneNumber || user.phone_number ? 
               (user.phone || user.phoneNumber || user.phone_number).replace(/^(\+62|62|0)/, '') : '',
        occupation: user.occupation || '',
        institution: user.institution || '',
        gender: user.gender || '',
        relationshipStatus: user.relationshipStatus || user.relationship_status || user.maritalStatus || '',
        religion: user.religion || '',
        birthPlace: user.birthPlace || user.birth_place || '',
        birthDate: user.birthDate || user.birth_date || '',
        address: user.address || '',
        photoURL: user.photoURL || user.photo_url || user.avatar_url || '',
        ktp_number: user.ktp_number || '',
        ktp_photo_url: user.ktp_photo_url || '',
        verification_status: user.verification_status || 'unverified'
      });
    }
  }, [user]);

  useEffect(() => {
    if (forceEdit) setIsEditing(true);
  }, [forceEdit]);

  if (!user) return null;
  const isAdmin = user.role === 'admin';
  const isAgent = user.role === 'survey_agent';

  const getInitials = (name: string) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto maksimal 5MB');
      return;
    }

    setLoading(true);
    try {
      const { convertToWebP } = await import('../adminService');
      const processedFile = await convertToWebP(file);
      const baseName = processedFile.name.substring(0, processedFile.name.lastIndexOf('.')) || processedFile.name;
      const filePath = `${user.uid}/${Date.now()}_${baseName}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, processedFile, { contentType: 'image/webp', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, photoURL: urlData.publicUrl }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Gagal mengupload foto.');
    } finally {
      setLoading(false);
    }
  };

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto KTP maksimal 5MB');
      return;
    }

    setIsUploadingKtp(true);
    try {
      const { convertToWebP } = await import('../adminService');
      const processedFile = await convertToWebP(file);
      const baseName = processedFile.name.substring(0, processedFile.name.lastIndexOf('.')) || processedFile.name;
      const filePath = `${user.uid}/ktp_${Date.now()}_${baseName}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('ktp-photos')
        .upload(filePath, processedFile, { contentType: 'image/webp', upsert: true });

      if (uploadError) {
        // Fallback to profile-photos if ktp-photos doesn't exist yet
        const { error: fallbackError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, processedFile, { contentType: 'image/webp', upsert: true });
        
        if (fallbackError) throw uploadError;
      }

      const { data: urlData } = supabase.storage.from(uploadError ? 'profile-photos' : 'ktp-photos').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, ktp_photo_url: urlData.publicUrl }));
    } catch (error) {
      console.error('Error uploading KTP:', error);
      alert('Gagal mengupload KTP.');
    } finally {
      setIsUploadingKtp(false);
    }
  };


  const handleDeletePhoto = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus foto profil?')) {
      setFormData(prev => ({ ...prev, photoURL: '' }));
    }
  };

  const handleSave = async () => {
    const normalizePhone = (p: string) => {
      if (!p) return '';
      let clean = p.replace(/\D/g, ''); 
      if (clean.startsWith('0')) clean = clean.substring(1);
      if (clean.startsWith('62')) clean = clean.substring(2);
      return `+62${clean}`;
    };

    const finalPhone = normalizePhone(formData.phone);

    if (
      !formData.displayName ||
      !finalPhone ||
      !formData.occupation ||
      !formData.institution ||
      !formData.address ||
      !formData.gender ||
      !formData.relationshipStatus ||
      !formData.religion ||
      !formData.birthDate
    ) {
      alert('Mohon lengkapi semua data wajib (Nama, WhatsApp, Pekerjaan, Kampus, Gender, Agama, Status Hubungan, Tanggal Lahir, Alamat).');
      return;
    }

    setLoading(true);
    try {
      // 1. Update users table in Supabase
      const { error: dbError } = await supabase
        .from('users')
        .upsert({
          id: user.uid,
          email: user.email,
          name: formData.displayName,
          full_name: formData.displayName,
          phone: finalPhone,
          occupation: formData.occupation,
          institution: formData.institution,
          gender: formData.gender,
          relationship_status: formData.relationshipStatus,
          religion: formData.religion,
          birth_place: formData.birthPlace,
          birth_date: formData.birthDate || null,
          address: formData.address,
          photo_url: formData.photoURL,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (dbError) throw dbError;

      // 1.1 Update user_verifications table in Supabase (if agent)
      if (isAgent) {
        const isNewAgentVerif = (formData.ktp_number !== user.ktp_number || formData.ktp_photo_url !== user.ktp_photo_url);
        const { error: verifError } = await supabase
          .from('user_verifications')
          .upsert({
            user_id: user.uid,
            ktp_number: formData.ktp_number,
            ktp_photo_url: formData.ktp_photo_url,
            verification_status: isNewAgentVerif ? 'pending' : formData.verification_status,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        if (verifError) throw verifError;

        if (isNewAgentVerif && formData.ktp_photo_url && formData.ktp_number) {
          notifyAdminIdentityVerification({
            role: 'agent',
            name: formData.displayName,
            email: user.email,
            phone: formData.phone,
            ktp_number: formData.ktp_number,
            ktp_photo_url: formData.ktp_photo_url,
            userId: user.uid
          }).catch(err => console.warn('Failed to notify admin via email:', err));
        }
      }

      // 2. Update Supabase Auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: formData.displayName,
          name: formData.displayName,
          avatar_url: formData.photoURL,
        }
      });

      // 3. Update localStorage
      const storedKey = `user_profile_${user.email}`;
      const storedData = localStorage.getItem(storedKey);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        localStorage.setItem(storedKey, JSON.stringify({ ...parsed, ...formData }));
      }

      setIsEditing(false);
      if (onSaveSuccess) {
        onSaveSuccess();
      } else {
        alert('Profil berhasil diperbarui!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
      setFormData({
        displayName: user.displayName || user.name || user.full_name || '',
        phone: user.phone || user.phoneNumber || user.phone_number ? 
               (user.phone || user.phoneNumber || user.phone_number).replace(/^(\+62|62|0)/, '') : '',
        occupation: user.occupation || '',
        institution: user.institution || '',
        gender: user.gender || '',
        relationshipStatus: user.relationshipStatus || user.relationship_status || user.maritalStatus || '',
        religion: user.religion || '',
        birthPlace: user.birthPlace || user.birth_place || '',
        birthDate: user.birthDate || user.birth_date || '',
        address: user.address || '',
        photoURL: user.photoURL || user.photo_url || user.avatar_url || '',
        ktp_number: user.ktp_number || '',
        ktp_photo_url: user.ktp_photo_url || '',
        verification_status: user.verification_status || 'unverified'
      });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">

          {/* Header Cover */}
          <div className="h-40 bg-gradient-to-r from-orange-400 to-orange-600 relative">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 group">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-800 flex items-center justify-center text-white text-3xl font-black relative overflow-hidden">
                  {/* Layer 1: Initials */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {getInitials(formData.displayName)}
                  </div>
                  
                  {/* Layer 2: Image */}
                  {formData.photoURL && (
                    <img
                      src={formData.photoURL}
                      alt="Profile"
                      className="absolute inset-0 w-full h-full object-cover bg-white z-10"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {isEditing && (
                  <div className="absolute bottom-0 right-0 flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-gray-700 p-2 rounded-full shadow-lg border border-gray-200 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                      title="Ganti Foto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    {formData.photoURL && (
                      <button
                        onClick={handleDeletePhoto}
                        className="bg-white text-red-500 p-2 rounded-full shadow-lg border border-gray-200 hover:bg-red-50 transition-colors"
                        title="Hapus Foto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-20 pb-12 px-6 sm:px-12">
            <div className="text-center mb-10">
              {isEditing ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="text-2xl font-black text-gray-900 text-center border-b-2 border-orange-200 focus:border-orange-500 focus:outline-none bg-transparent w-full max-w-sm mb-1"
                  placeholder="Nama Lengkap"
                  maxLength={100}
                />
              ) : (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-3xl font-black text-gray-900 text-center">
                    {formData.displayName || 'Pengguna Tanpa Nama'}
                  </h1>
                  {(isAdmin || isAgent) && (
                    <div className="relative group/tooltip">
                      <svg className={`w-6 h-6 ${isAgent ? 'text-orange-500' : 'text-orange-500'} fill-current`} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {isAgent ? 'Agen Survey Terverifikasi' : 'Administrator Terverifikasi'}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-gray-500 font-medium">{user.email}</p>
            </div>

            {/* Force Edit Message */}
            {forceEdit && isEditing && (
              <div className="mb-8 bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <p className="font-bold text-orange-800 text-sm">Wajib Dilengkapi</p>
                  <p className="text-xs text-orange-700 mt-1">Silakan lengkapi data diri Anda sebelum melanjutkan transaksi.</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl mx-auto">

              {/* WhatsApp */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">No. WhatsApp <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <div className="flex bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all overflow-hidden group">
                    <div className="px-4 py-3 bg-gray-100 border-r border-gray-200 text-gray-400 font-black text-xs flex items-center group-focus-within:text-orange-500">+62</div>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.startsWith('0')) val = val.substring(1);
                        if (val.startsWith('62')) val = val.substring(2);
                        setFormData({ ...formData, phone: val });
                      }}
                      className="flex-1 px-4 py-3 text-sm font-bold text-gray-900 bg-transparent outline-none"
                      placeholder="8xxxxxxxxxx" required />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">
                    {formData.phone ? `+62 ${formData.phone}` : '-'}
                  </div>
                )}
              </div>

              {/* Pekerjaan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pekerjaan <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    placeholder="Contoh: Mahasiswa, Karyawan" required maxLength={100} />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">{formData.occupation || '-'}</div>
                )}
              </div>

              {/* Nama Kampus / Tempat Kerja */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nama Kampus / Tempat Kerja <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <input type="text" name="institution" value={formData.institution} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    placeholder="Contoh: Universitas Indonesia, PT. Gojek" required maxLength={150} />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">{formData.institution || '-'}</div>
                )}
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jenis Kelamin <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <select name="gender" value={formData.gender} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Pilih Jenis Kelamin</option>
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                  </select>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">
                    {formData.gender || <span className="text-red-400 italic font-normal">Belum dipilih</span>}
                  </div>
                )}
              </div>

              {/* Agama */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Agama <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <select name="religion" value={formData.religion} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Pilih Agama</option>
                    {religions.map(r => (<option key={r} value={r}>{r}</option>))}
                  </select>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">
                    {formData.religion || <span className="text-red-400 italic font-normal">Belum dipilih</span>}
                  </div>
                )}
              </div>

              {/* Status Hubungan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status Hubungan <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <select name="relationshipStatus" value={formData.relationshipStatus} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Pilih Status</option>
                    <option value="Single">Single</option>
                    <option value="Pacaran">Pacaran</option>
                    <option value="Menikah">Menikah</option>
                  </select>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">
                    {formData.relationshipStatus || <span className="text-red-400 italic font-normal">Belum dipilih</span>}
                  </div>
                )}
              </div>

              {/* Tempat Lahir */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tempat Lahir</label>
                {isEditing ? (
                  <input type="text" name="birthPlace" value={formData.birthPlace} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    placeholder="Contoh: Jakarta, Bandung, Surabaya" />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">{formData.birthPlace || '-'}</div>
                )}
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tanggal Lahir <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer"
                    onClick={(e) => (e.target as any).showPicker?.()}
                    max={new Date().toISOString().split('T')[0]} />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">
                    {formData.birthDate
                      ? new Date(formData.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'}
                  </div>
                )}
              </div>

              {/* Alamat Asal */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Alamat Asal <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <textarea name="address" rows={3} value={formData.address} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
                    placeholder="Alamat asal lengkap (sesuai KTP/identitas)..." required maxLength={500} />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900 min-h-[5rem]">{formData.address || '-'}</div>
                )}
              </div>


              {/* KHUSUS AGEN: VERIFIKASI IDENTITAS */}
              {isAgent && (
                <div className="md:col-span-2 mt-4 space-y-6">
                  <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Verifikasi Identitas Agen</h3>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">Wajib bagi Agen Survey RuangSinggah</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Nomor KTP */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nomor KTP (NIK) <span className="text-red-500">*</span></label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            name="ktp_number" 
                            value={formData.ktp_number} 
                            onChange={(e) => setFormData({...formData, ktp_number: e.target.value.replace(/\D/g, '').substring(0, 16)})}
                            className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                            placeholder="16 Digit NIK KTP" required />
                        ) : (
                          <div className="p-4 bg-white/50 rounded-2xl border border-white font-mono font-bold text-gray-900">
                            {formData.ktp_number ? formData.ktp_number.replace(/(\d{4})/g, '$1 ').trim() : '-'}
                          </div>
                        )}
                      </div>

                      {/* Foto KTP */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Foto KTP <span className="text-red-500">*</span></label>
                        {isEditing ? (
                          <div className="flex flex-col gap-3">
                            {formData.ktp_photo_url ? (
                              <div className="relative group aspect-[3/2] rounded-2xl overflow-hidden border-2 border-orange-200">
                                <img src={formData.ktp_photo_url} alt="KTP" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                  <label className="cursor-pointer bg-white text-gray-900 p-2 rounded-lg font-bold text-[10px] uppercase">Ganti
                                    <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-orange-200 bg-white rounded-2xl hover:bg-orange-100/50 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black text-orange-600 uppercase tracking-widest">{isUploadingKtp ? 'Sedang Upload...' : 'Upload Foto KTP'}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Maksimal 2MB (JPG/PNG)</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                              </label>
                            )}
                          </div>
                        ) : (
                          formData.ktp_photo_url ? (
                            <div className="aspect-[3/2] rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                              <img src={formData.ktp_photo_url} alt="KTP Verified" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="p-4 bg-white/50 rounded-2xl border border-white font-bold text-red-400 italic text-xs">Belum upload foto KTP</div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-orange-200 pt-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${formData.verification_status === 'verified' ? 'bg-green-500' : formData.verification_status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status Verifikasi:</span>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm
                        ${formData.verification_status === 'verified' ? 'bg-green-500 text-white' : 
                          formData.verification_status === 'pending' ? 'bg-orange-500 text-white' : 
                          'bg-red-500 text-white'}`}>
                        {formData.verification_status === 'verified' ? 'Terverifikasi' : 
                         formData.verification_status === 'pending' ? 'Menunggu Review' : 
                         'Belum Terverifikasi'}
                      </span>
                    </div>
                  </div>
                </div>
              )}



              {/* Account Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status Akun</label>
                {(isAdmin || isAgent) ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl border bg-orange-50 border-orange-200">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm bg-orange-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                      <p className="font-black tracking-tight text-sm uppercase text-orange-800">
                        {isAgent ? 'Agen Survey Terverifikasi' : 'Administrator Terverifikasi'}
                      </p>
                      <p className="text-[10px] font-bold text-orange-600">
                        {isAgent ? 'Akun ini memiliki akses khusus survey kost.' : 'Akun ini memiliki akses pengelolaan sistem.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-2xl border border-gray-200">
                    <div className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <p className="font-bold text-gray-900 text-xs">
                      {user.emailVerified ? 'Email Terverifikasi' : 'Belum Verifikasi Email'}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-12 pt-10 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-center">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Menyimpan...
                      </>
                    ) : 'Simpan Perubahan'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-8 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors active:scale-95"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit Profil
                  </button>
                  <button
                    onClick={onBack}
                    className="px-8 py-3 bg-white text-orange-500 border border-orange-200 rounded-xl font-bold hover:bg-orange-50 transition-colors active:scale-95"
                  >
                    Kembali
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
