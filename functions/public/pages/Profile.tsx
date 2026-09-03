import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { notifyAdminIdentityVerification } from '../emailService';
import { Page } from '../types';
import { 
  ArrowLeft, Edit3, Lock, CheckCircle2, ShieldCheck, Calendar, 
  Briefcase, Building2, User, Users, MapPin, Sparkles, Heart, 
  Phone, MessageSquare, Check, X, Shield, Key, Camera, Trash2, 
  Mail, RefreshCw, AlertCircle, Eye, EyeOff
} from 'lucide-react';

interface ProfileProps {
  user: any;
  onLogout: () => void;
  onSaveSuccess?: () => void;
  forceEdit?: boolean;
  onBack?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onSaveSuccess, forceEdit, onBack }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Ganti Kata Sandi
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const isOwner = user.role === 'owner' || user.role === 'mitra';

  const getRoleTitle = () => {
    if (isAdmin) return 'Administrator';
    if (isAgent) return 'Agen Survey';
    if (isOwner) return 'Mitra Pemilik';
    return 'Pengguna';
  };

  const getRoleBadge = () => {
    if (isAdmin) return 'Super Admin';
    if (isAgent) return 'Surveyor Resmi';
    if (isOwner) return 'Owner Mitra';
    return 'Pencari Kost';
  };

  const getJoinYear = () => {
    if (user.created_at) {
      const year = new Date(user.created_at).getFullYear();
      if (!isNaN(year)) return year.toString();
    }
    return '2024';
  };

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
      alert('Mohon lengkapi semua data wajib (Nama, WhatsApp, Pekerjaan, Kampus/Tempat Kerja, Gender, Agama, Status Hubungan, Tanggal Lahir, Alamat).');
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage(null);
      }, 1500);
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login?mode=recovery`
      });
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: `Link reset sandi telah dikirim ke ${user.email}.` });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Gagal mengirim email reset.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 font-sans selection:bg-orange-100 selection:text-orange-900 pb-28 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BREADCRUMB & HEADER SECTION */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-3">
            <span className="text-gray-300">/</span>
            <span className="text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => onBack ? onBack() : navigate(Page.HOME)}>
              Pengaturan Akun
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-[#ff7a00] font-bold">Profil {getRoleTitle()}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Profil {getRoleTitle()}
                </h1>
                <span className="bg-orange-50 text-[#ff7a00] border border-orange-200 text-xs font-extrabold px-3 py-0.5 rounded-full shadow-2xs">
                  {getRoleBadge()}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Kelola data personal, aksesibilitas sistem, dan parameter verifikasi identitas Anda.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onBack ? onBack() : navigate(Page.HOME)}
                className="px-4 sm:px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
                Kembali ke Beranda
              </button>

              <button
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={loading}
                className="px-5 sm:px-6 py-2.5 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Edit Profil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Force Edit Message Alert */}
        {forceEdit && isEditing && (
          <div className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">Wajib Dilengkapi</p>
              <p className="text-xs text-amber-700 mt-0.5">Silakan lengkapi seluruh data diri wajib Anda sebelum melanjutkan transaksi.</p>
            </div>
          </div>
        )}

        {/* 2-COLUMN MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: SIDEBAR PROFILE CARD (4 COLS) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            
            {/* Header Cover Gradient */}
            <div className="h-28 bg-gradient-to-r from-[#ff7a00] to-[#ea580c] relative p-3 flex justify-end items-start">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-full border border-white/30 shadow-xs">
                {isAdmin ? 'SISTEM UTAMA' : 'AKUN AKTIF'}
              </span>
            </div>

            {/* Avatar & Photo Area */}
            <div className="px-6 pb-6">
              <div className="-mt-14 flex justify-center relative">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-[#0b1c30] text-white flex items-center justify-center relative overflow-hidden">
                    {/* Layer 1: Initials */}
                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-black">
                      {getInitials(formData.displayName)}
                    </div>
                    
                    {/* Layer 2: Image */}
                    {formData.photoURL && (
                      <img
                        src={formData.photoURL}
                        alt="Profile"
                        className="absolute inset-0 w-full h-full object-cover bg-white z-10 transition-opacity"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Verified Badge on Avatar */}
                  <div className="absolute bottom-1 right-1 bg-[#ff7a00] text-white p-1 rounded-full border-2 border-white shadow-sm z-20" title="Akun Terverifikasi">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  {/* Photo Actions in Edit Mode */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-orange-50 hover:text-orange-500 transition-colors"
                        title="Unggah Foto Baru"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      {formData.photoURL && (
                        <button
                          type="button"
                          onClick={handleDeletePhoto}
                          className="bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>

              {/* Name & Identity */}
              <div className="text-center mt-3 mb-4">
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="text-lg font-black text-gray-900 text-center border-b-2 border-orange-300 focus:border-orange-500 focus:outline-none bg-transparent w-full py-1"
                      placeholder="Nama Lengkap"
                      maxLength={100}
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Edit Nama Tampilan</p>
                  </div>
                ) : (
                  <h2 className="text-xl font-black text-gray-900 flex items-center justify-center gap-1.5">
                    {formData.displayName || 'Pengguna Tanpa Nama'}
                    <CheckCircle2 className="w-4 h-4 text-[#ff7a00] fill-orange-50 shrink-0" />
                  </h2>
                )}
                <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{user.email}</p>
              </div>

              {/* Role Badge Pill */}
              <div className="flex justify-center mb-6">
                <span className="px-3.5 py-1 bg-orange-50 border border-orange-200 text-[#ff7a00] text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Check className="w-3 h-3 text-orange-500 stroke-[3]" />
                  {isAdmin ? 'ADMINISTRATOR TERVERIFIKASI' : isAgent ? 'AGEN SURVEY TERVERIFIKASI' : isOwner ? 'MITRA PEMILIK KOST' : 'PENGGUNA TERVERIFIKASI'}
                </span>
              </div>

              {/* 4-Box Meta Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">ROLE OTORITAS</span>
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mt-1 truncate">
                    <Key className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>{getRoleBadge()}</span>
                  </div>
                </div>

                <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">STATUS AKUN</span>
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mt-1 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-emerald-700">Aktif & Valid</span>
                  </div>
                </div>

                <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">BERGABUNG</span>
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mt-1 truncate">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{getJoinYear()}</span>
                  </div>
                </div>

                <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">TINGKAT AKSES</span>
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mt-1 truncate">
                    <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{isAdmin ? 'Full Access' : isOwner ? 'Partner Access' : isAgent ? 'Agent Access' : 'User Access'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Sidebar */}
              <div className="space-y-2.5">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 bg-[#0b1c30] hover:bg-[#132840] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-orange-400" />
                    Edit Profil Sekarang
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={loading}
                      className="py-3 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={loading}
                      className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Batal
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-gray-400" />
                  Ganti Kata Sandi
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: INFORMATION & SETTINGS PANELS (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: INFORMASI KONTAK & PEKERJAAN */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 bg-orange-100/70 text-[#ff7a00] rounded-2xl flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Informasi Kontak & Pekerjaan</h3>
                  <p className="text-xs text-gray-400 font-medium">Detail nomor kontak dan institusi kerja Anda yang terdaftar.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                {/* No. WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    NO. WHATSAPP <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <div className="flex bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all overflow-hidden group">
                      <div className="px-3.5 py-3 bg-gray-100 border-r border-gray-200 text-gray-500 font-bold text-xs flex items-center group-focus-within:text-orange-500">+62</div>
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
                        className="flex-1 px-3.5 py-3 text-sm font-bold text-gray-900 bg-transparent outline-none"
                        placeholder="8xxxxxxxxxx" 
                        required 
                      />
                    </div>
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-bold text-gray-900">{formData.phone ? `+62 ${formData.phone}` : '-'}</span>
                      </div>
                      {formData.phone && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Pekerjaan */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    PEKERJAAN <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="occupation" 
                      value={formData.occupation} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                      placeholder="Contoh: Mahasiswa, Karyawan Swasta" 
                      required 
                      maxLength={100} 
                    />
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.occupation || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Nama Kampus / Tempat Kerja */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    NAMA KAMPUS / TEMPAT KERJA <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="institution" 
                      value={formData.institution} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                      placeholder="Contoh: Universitas Hasanuddin, PT. Telkom" 
                      required 
                      maxLength={150} 
                    />
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900 truncate">{formData.institution || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Jenis Kelamin */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    JENIS KELAMIN <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <select 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Pilih Jenis Kelamin</option>
                      <option value="Pria">Pria</option>
                      <option value="Wanita">Wanita</option>
                    </select>
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.gender || <span className="text-gray-400 italic">Belum dipilih</span>}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* CARD 2: DATA KELAHIRAN & DOMISILI */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 bg-blue-100/70 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Data Kelahiran & Domisili</h3>
                  <p className="text-xs text-gray-400 font-medium">Informasi identitas kependudukan dan tempat tinggal saat ini.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Agama */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    AGAMA <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <select 
                      name="religion" 
                      value={formData.religion} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Pilih Agama</option>
                      {religions.map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.religion || <span className="text-gray-400 italic">Belum dipilih</span>}</span>
                    </div>
                  )}
                </div>

                {/* Status Hubungan */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    STATUS HUBUNGAN <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <select 
                      name="relationshipStatus" 
                      value={formData.relationshipStatus} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Pilih Status</option>
                      <option value="Single">Single</option>
                      <option value="Pacaran">Pacaran</option>
                      <option value="Menikah">Menikah</option>
                    </select>
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.relationshipStatus || <span className="text-gray-400 italic">Belum dipilih</span>}</span>
                    </div>
                  )}
                </div>

                {/* Tempat Lahir */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    TEMPAT LAHIR
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="birthPlace" 
                      value={formData.birthPlace} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                      placeholder="Contoh: Makassar, Jakarta, Surabaya" 
                    />
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.birthPlace || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    TANGGAL LAHIR <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input 
                      type="date" 
                      name="birthDate" 
                      value={formData.birthDate} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer"
                      onClick={(e) => (e.target as any).showPicker?.()}
                      max={new Date().toISOString().split('T')[0]} 
                    />
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">
                        {formData.birthDate
                          ? new Date(formData.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alamat Asal / Domisili Lengkap (Full Width) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    ALAMAT ASAL / DOMISILI LENGKAP <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <textarea 
                      name="address" 
                      rows={3} 
                      value={formData.address} 
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
                      placeholder="Alamat asal lengkap (sesuai KTP/identitas domisili)..." 
                      required 
                      maxLength={500} 
                    />
                  ) : (
                    <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-start gap-2.5 min-h-[4rem]">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-bold text-gray-900 leading-relaxed">{formData.address || '-'}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* KHUSUS AGEN: VERIFIKASI IDENTITAS KTP */}
            {isAgent && (
              <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-gray-50">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">Verifikasi Identitas Agen</h3>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Wajib bagi Agen Survey RuangSinggah</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* NIK KTP */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      NOMOR KTP (NIK) <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="ktp_number" 
                        value={formData.ktp_number} 
                        onChange={(e) => setFormData({...formData, ktp_number: e.target.value.replace(/\D/g, '').substring(0, 16)})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                        placeholder="16 Digit NIK KTP" 
                        required 
                      />
                    ) : (
                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 font-mono font-bold text-gray-900">
                        {formData.ktp_number ? formData.ktp_number.replace(/(\d{4})/g, '$1 ').trim() : '-'}
                      </div>
                    )}
                  </div>

                  {/* Foto KTP */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      FOTO KTP <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        {formData.ktp_photo_url ? (
                          <div className="relative group aspect-[3/2] rounded-xl overflow-hidden border-2 border-orange-200">
                            <img src={formData.ktp_photo_url} alt="KTP" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                              <label className="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg font-bold text-xs uppercase">
                                Ganti
                                <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-xl hover:bg-orange-100/50 transition-all cursor-pointer">
                            <Camera className="w-6 h-6 text-orange-500" />
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">{isUploadingKtp ? 'Sedang Upload...' : 'Upload Foto KTP'}</p>
                            <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                          </label>
                        )}
                      </div>
                    ) : (
                      formData.ktp_photo_url ? (
                        <div className="aspect-[3/2] rounded-xl overflow-hidden border border-gray-200 shadow-xs max-w-[200px]">
                          <img src={formData.ktp_photo_url} alt="KTP Verified" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-red-400 italic">Belum upload foto KTP</div>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.verification_status === 'verified' ? 'bg-emerald-500' : formData.verification_status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status Verifikasi:</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xs
                    ${formData.verification_status === 'verified' ? 'bg-emerald-500 text-white' : 
                      formData.verification_status === 'pending' ? 'bg-orange-500 text-white' : 
                      'bg-red-500 text-white'}`}>
                    {formData.verification_status === 'verified' ? 'Terverifikasi' : 
                     formData.verification_status === 'pending' ? 'Menunggu Review' : 
                     'Belum Terverifikasi'}
                  </span>
                </div>
              </div>
            )}

            {/* CARD 3: BANNER ADMINISTRATOR / OTORITAS TERVERIFIKASI */}
            <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/40 border border-orange-200/80 rounded-3xl p-5 sm:p-6 flex items-start justify-between gap-4 relative shadow-2xs">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#ff7a00] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    {isAdmin ? 'ADMINISTRATOR TERVERIFIKASI' : isAgent ? 'AGEN SURVEY RESMI' : isOwner ? 'MITRA PEMILIK TERVERIFIKASI' : 'AKUN PENGGUNA TERVERIFIKASI'}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">
                    {isAdmin
                      ? 'Akses penuh ke pengelolaan sistem RuangSinggah.id termasuk manajemen kost, transaksi mitra, validasi data pengguna, dan survei lapangan.'
                      : isAgent
                      ? 'Akses terverifikasi untuk menerima penugasan survey, verifikasi lapangan, dan pelaporan kondisi properti di platform RuangSinggah.id.'
                      : isOwner
                      ? 'Akses manajemen properti hunian, manajemen kamar, penagihan sewa, dan penerimaan transaksi sewa kost.'
                      : 'Akun Anda aktif dan siap digunakan untuk mencari hunian, memesan kost, dan memanfaatkan layanan survey resmi.'}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-[#ff7a00] text-white text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 shadow-xs">
                Resmi
              </span>
            </div>

            {/* BOTTOM ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onBack ? onBack() : navigate(Page.HOME)}
                className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Kembali
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={loading}
                className="px-6 py-3 bg-[#0b1c30] hover:bg-[#132840] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 text-orange-400" />
                    Edit Profil
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL GANTI KATA SANDI */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-[#ff7a00] rounded-2xl flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Ganti Kata Sandi</h3>
                  <p className="text-xs text-gray-400 font-medium">Perbarui kata sandi akun Anda secara aman.</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordMessage && (
              <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  KATA SANDI BARU
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  KONFIRMASI KATA SANDI BARU
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  placeholder="Ulangi kata sandi baru"
                  required
                />
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Perbarui Kata Sandi
                </button>

                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={passwordLoading}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  Kirim Link Reset ke Email ({user.email})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
