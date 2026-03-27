
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

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
    address: '',
    photoURL: ''
  });

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
        address: user.address || '',
        photoURL: user.photoURL || user.photo_url || user.avatar_url || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (forceEdit) setIsEditing(true);
  }, [forceEdit]);

  if (!user) return null;
  const isAdmin = user.role === 'admin';

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

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB');
      return;
    }

    setLoading(true);
    try {
      const sanitized = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${user.uid}/${Date.now()}_${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { contentType: file.type || 'image/jpeg', upsert: true });

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
      !formData.religion
    ) {
      alert('Mohon lengkapi semua data wajib (Nama, WhatsApp, Pekerjaan, Kampus, Gender, Agama, Status Hubungan, Alamat).');
      return;
    }

    setLoading(true);
    try {
      // 1. Update users table in Supabase
      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: formData.displayName,
          phone: finalPhone,
          occupation: formData.occupation,
          institution: formData.institution,
          gender: formData.gender,
          relationship_status: formData.relationshipStatus,
          religion: formData.religion,
          address: formData.address,
          photo_url: formData.photoURL,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.uid);

      if (dbError) throw dbError;

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
    if (user) {
      setFormData({
        displayName: user.displayName || user.name || user.full_name || '',
        phone: user.phone || user.phoneNumber || user.phone_number || '',
        occupation: user.occupation || '',
        institution: user.institution || '',
        gender: user.gender || '',
        relationshipStatus: user.relationshipStatus || user.relationship_status || user.maritalStatus || '',
        religion: user.religion || '',
        address: user.address || '',
        photoURL: user.photoURL || user.photo_url || user.avatar_url || ''
      });
    }
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
                {formData.photoURL ? (
                  <img
                    src={formData.photoURL}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-800 flex items-center justify-center text-white text-3xl font-black">
                    {getInitials(formData.displayName)}
                  </div>
                )}

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
                />
              ) : (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-3xl font-black text-gray-900 text-center">
                    {formData.displayName || 'Pengguna Tanpa Nama'}
                  </h1>
                  {isAdmin && (
                    <div className="relative group/tooltip">
                      <svg className="w-6 h-6 text-blue-500 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Administrator Terverifikasi
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
                    placeholder="Contoh: Mahasiswa, Karyawan" required />
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
                    placeholder="Contoh: Universitas Indonesia, PT. Gojek" required />
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

              {/* Alamat Domisili */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Alamat Domisili <span className="text-red-500">*</span></label>
                {isEditing ? (
                  <textarea name="address" rows={3} value={formData.address} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
                    placeholder="Alamat lengkap saat ini..." required />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900 min-h-[5rem]">{formData.address || '-'}</div>
                )}
              </div>

              {/* Read Only Fields */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">User ID (Tidak dapat diubah)</label>
                <div className="p-4 bg-gray-100 rounded-2xl border border-gray-200 font-mono text-xs text-gray-500">{user.uid}</div>
              </div>

              {/* Account Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status Akun</label>
                {isAdmin ? (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                      <p className="font-black text-blue-800 text-sm uppercase tracking-tight">Administrator Terverifikasi</p>
                      <p className="text-[10px] text-blue-600 font-bold">Akun ini memiliki akses pengelolaan sistem.</p>
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
                    Simpan Profile
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
