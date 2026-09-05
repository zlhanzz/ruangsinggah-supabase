import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { notifyAdminIdentityVerification } from '../emailService';
import { Page, Kost } from '../types';
import KostCard from '../components/KostCard';
import { 
  getUserFavoriteIds, 
  getFavoritePropertiesDetails, 
  toggleFavoriteProperty, 
  FAVORITES_UPDATED_EVENT 
} from '../favoriteService';
import { createKostSlug } from '../utils/slugUtils';
import { 
  getUserAllTransactionsHistory, 
  NormalizedTransaction,
  getUserRentalHistory,
  UserRentalHistoryItem
} from '../userService';
import DigitalReceiptModal, { ReceiptData } from '../components/DigitalReceiptModal';
import { FORMAT_CURRENCY } from '../constants';
import { 
  ArrowLeft, Edit3, Lock, CheckCircle2, ShieldCheck, Calendar, 
  Briefcase, Building2, User, Users, MapPin, Sparkles, Heart, 
  Phone, MessageSquare, MessageCircle, Check, X, Shield, Key, Camera, Trash2, 
  Mail, RefreshCw, AlertCircle, Eye, EyeOff, ChevronRight, CreditCard,
  Bell, HelpCircle, FileText, LogOut, ExternalLink, Receipt, Layers, RotateCcw, Zap,
  Settings
} from 'lucide-react';

interface ProfileProps {
  user: any;
  onLogout: () => void;
  onSaveSuccess?: () => void;
  forceEdit?: boolean;
  initialMode?: 'hub' | 'edit_personal_data' | 'favorites' | 'transactions' | 'rental_history';
  onBack?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onSaveSuccess, forceEdit, initialMode, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const determineInitialMode = (): 'hub' | 'edit_personal_data' | 'favorites' | 'transactions' | 'rental_history' => {
    if (forceEdit) return 'edit_personal_data';
    if (initialMode) return initialMode;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') || searchParams.get('tab');
    if (viewParam === 'edit' || viewParam === 'personal_data' || searchParams.get('edit') === 'true') {
      return 'edit_personal_data';
    }
    if (viewParam === 'favorites') return 'favorites';
    if (viewParam === 'transactions') return 'transactions';
    if (viewParam === 'rental_history') return 'rental_history';
    return 'hub';
  };

  const [viewMode, setViewMode] = useState<'hub' | 'edit_personal_data' | 'favorites' | 'transactions' | 'rental_history'>(determineInitialMode);
  const [isEditing, setIsEditing] = useState(forceEdit || false);
  const [loading, setLoading] = useState(false);
  const [activeKostCount, setActiveKostCount] = useState<number>(0);
  const [favoriteKosts, setFavoriteKosts] = useState<Kost[]>([]);
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
  const [userTransactions, setUserTransactions] = useState<NormalizedTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  const [selectedTrxCategory, setSelectedTrxCategory] = useState<string>('all');
  const [rentalHistoryList, setRentalHistoryList] = useState<UserRentalHistoryItem[]>([]);
  const [rentalHistoryLoading, setRentalHistoryLoading] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showDigitalReceiptModal, setShowDigitalReceiptModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Ganti Kata Sandi
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Preferensi Notifikasi
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    emailNotif: true,
    waNotif: true,
    promoNotif: false,
  });

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
    if (forceEdit) {
      setIsEditing(true);
      setViewMode('edit_personal_data');
      return;
    }
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') || searchParams.get('tab');
    if (viewParam === 'edit' || viewParam === 'personal_data' || searchParams.get('edit') === 'true') {
      setIsEditing(true);
      setViewMode('edit_personal_data');
    } else if (location.pathname === Page.SETTINGS || location.pathname === '/settings') {
      setViewMode('hub');
    } else if (viewParam === 'favorites') {
      setViewMode('favorites');
    } else if (viewParam === 'transactions') {
      setViewMode('transactions');
    } else if (viewParam === 'rental_history') {
      setViewMode('rental_history');
    } else if (!viewParam && location.pathname === Page.PROFILE) {
      setViewMode(initialMode || 'hub');
    }
  }, [location.pathname, location.search, forceEdit, initialMode]);

  useEffect(() => {
    if (!user?.uid) return;
    supabase
      .from('resident_status')
      .select('id, end_date')
      .eq('user_id', user.uid)
      .then(({ data }) => {
        if (data) {
          const now = new Date();
          const active = data.filter((r: any) => !r.end_date || new Date(r.end_date) >= now).length;
          setActiveKostCount(active);
        }
      })
      .catch(() => {});
  }, [user]);

  const loadFavoriteList = async () => {
    setFavoriteLoading(true);
    try {
      const items = await getFavoritePropertiesDetails(user?.uid || user?.id);
      setFavoriteKosts(items);
      setFavoriteCount(items.length);
    } catch (err) {
      console.error('Error loading favorite properties:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const loadUserTransactions = async () => {
    if (!user?.uid) return;
    setTransactionsLoading(true);
    try {
      const list = await getUserAllTransactionsHistory(user.uid);
      setUserTransactions(list);
    } catch (err) {
      console.error('Error fetching user transactions in Profile:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadRentalHistory = async () => {
    if (!user?.uid) return;
    setRentalHistoryLoading(true);
    try {
      const list = await getUserRentalHistory(user.uid);
      setRentalHistoryList(list);
      const active = list.filter(r => r.isCurrentlyActive).length;
      setActiveKostCount(active);
    } catch (err) {
      console.error('Error fetching rental history in Profile:', err);
    } finally {
      setRentalHistoryLoading(false);
    }
  };

  useEffect(() => {
    getUserFavoriteIds(user?.uid || user?.id).then((ids) => {
      setFavoriteCount(ids.length);
    }).catch(() => {});

    if (user?.uid) {
      loadUserTransactions();
      loadRentalHistory();
    }
  }, [user]);

  useEffect(() => {
    if (viewMode === 'favorites') {
      loadFavoriteList();
    } else if (viewMode === 'transactions') {
      loadUserTransactions();
    } else if (viewMode === 'rental_history') {
      loadRentalHistory();
    }
  }, [viewMode, user?.uid, user?.id]);

  useEffect(() => {
    const handleFavUpdate = (e: any) => {
      if (e.detail?.totalFavorites !== undefined) {
        setFavoriteCount(e.detail.totalFavorites);
      }
      if (viewMode === 'favorites') {
        loadFavoriteList();
      }
    };
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdate);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdate);
    };
  }, [viewMode, user?.uid, user?.id]);

  const handleOpenReceiptFromTransaction = (trx: NormalizedTransaction) => {
    const meta = trx.metadata || {};
    setSelectedReceipt({
      receiptNumber: trx.invoiceNumber,
      paidAt: trx.updatedAt || trx.createdAt || new Date().toISOString(),
      tenantName: meta.tenantName || meta.userName || user?.displayName || user?.name || 'Pengguna RuangSinggah',
      tenantPhone: meta.userPhone || meta.phone || user?.phoneNumber || user?.phone || '',
      propertyTitle: trx.propertyTitle || trx.title || 'Layanan RuangSinggah',
      roomNumber: trx.roomNumber || meta.roomNumber || (trx.category === 'booking' || trx.category === 'extension' ? '1' : '-'),
      billingPeriod: trx.billingPeriod || meta.periodLabel || (trx.category === 'extension' ? `${meta.extensionPeriod || 1} Bulan` : 'Bulanan'),
      newPeriodStart: trx.periodStart || meta.startDate || meta.moveInDate || '',
      newPeriodEnd: trx.periodEnd || meta.endDate || '',
      baseRent: Number(meta.basePrice || meta.baseRent || trx.amount - (trx.extraFee || 0)),
      extraFee: trx.extraFee || Number(meta.extraPersonFee || 0),
      extraFeeName: trx.extraFeeName || (Number(meta.extraPersonFee || 0) > 0 ? 'Biaya Ekstra Penghuni' : undefined),
      totalAmount: trx.amount,
      paymentMethod: trx.paymentMethod
    });
    setShowDigitalReceiptModal(true);
  };

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
      setViewMode('hub');
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
    setViewMode('hub');
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

  const isPersonalDataComplete = Boolean(
    formData.displayName &&
    formData.phone &&
    formData.occupation &&
    formData.institution &&
    formData.address &&
    formData.gender &&
    formData.religion &&
    formData.birthDate
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-4 sm:py-8 lg:py-12 font-sans selection:bg-orange-100 selection:text-orange-900 pb-28 sm:pb-16">
      
      {/* ── PROFILE HUB DASHBOARD VIEW ───────────────────────────────────────── */}
      {viewMode === 'hub' ? (
        <div className="max-w-md lg:max-w-xl mx-auto px-4 sm:px-6">
          
          {/* MAIN PROFILE CARD */}
          <div className="bg-gradient-to-b from-orange-50/40 via-white to-white rounded-3xl p-5 sm:p-6 border border-orange-100 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar Circle */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#0b1c30] text-white flex items-center justify-center font-black text-xl overflow-hidden shadow-md">
                  {formData.photoURL ? (
                    <img 
                      src={formData.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    getInitials(formData.displayName)
                  )}
                </div>
                {/* Verified Badge */}
                <div className="absolute -bottom-1 -right-1 bg-[#ff7a00] text-white p-1 rounded-full border-2 border-white shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">
                    {formData.displayName || user.displayName || user.name || 'Pengguna RuangSinggah'}
                  </h2>
                  <CheckCircle2 className="w-4 h-4 text-[#ff7a00] fill-orange-100 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                  {user.email}
                </p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    {getRoleBadge()}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Action: Edit Profil & Data Kontak Pribadi */}
            <button
              onClick={() => {
                setIsEditing(true);
                setViewMode('edit_personal_data');
              }}
              className="w-full mt-5 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-200 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between transition-all group active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-xs font-bold text-gray-800">
                <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Edit Profil & Data Kontak Pribadi</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-orange-600 shrink-0 ml-2">
                <span>{isPersonalDataComplete ? 'Ubah' : 'Lengkapi'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* ── GROUP 1: AKTIVITAS SEWA & TRANSAKSI ── */}
          <div className="mb-6">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 px-1">
              AKTIVITAS SEWA & TRANSAKSI
            </h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-50 overflow-hidden">
              
              {/* Riwayat Sewa Kost */}
              <button
                onClick={() => setViewMode('rental_history')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Riwayat Sewa Kost
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Daftar kost yang pernah Anda sewa & riwayat hunian
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {rentalHistoryList.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black border border-orange-200">
                      {rentalHistoryList.length} Kost
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Kost Favorit Saya */}
              <button
                onClick={() => setViewMode('favorites')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Kost Favorit Saya
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Daftar hunian kost tersimpan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {favoriteCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-200">
                      {favoriteCount} Disimpan
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Riwayat Transaksi & Tagihan */}
              <button
                onClick={() => setViewMode('transactions')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Riwayat Transaksi & Tagihan
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Bukti transfer, invoice & DP sewa
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {userTransactions.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200">
                      {userTransactions.length} Transaksi
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            </div>
          </div>

          {/* ── GROUP 2: PENGATURAN AKUN & KEAMANAN ── */}
          <div className="mb-6">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 px-1">
              PENGATURAN AKUN & KEAMANAN
            </h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-50 overflow-hidden">
              
              {/* Keamanan & Kata Sandi */}
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Keamanan & Kata Sandi
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Ganti PIN, password & autentikasi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Preferensi Notifikasi */}
              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Preferensi Notifikasi
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Email, WhatsApp & promo kost
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            </div>
          </div>

          {/* ── GROUP 3: BANTUAN & INFORMASI LEGAL ── */}
          <div className="mb-6">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 px-1">
              BANTUAN & INFORMASI LEGAL
            </h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-50 overflow-hidden">
              
              {/* Pusat Bantuan 24/7 */}
              <button
                onClick={() => navigate(Page.CONTACT)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Pusat Bantuan 24/7
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Live chat WhatsApp & FAQ sewa
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-200">
                    Online
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Syarat & Ketentuan Sewa */}
              <button
                onClick={() => navigate(Page.TERMS)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Syarat & Ketentuan Sewa
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Aturan pemesanan & pembatalan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Kebijakan Privasi Data */}
              <button
                onClick={() => navigate(Page.TERMS)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                      Kebijakan Privasi Data
                    </h4>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                      Keamanan data pribadi pengguna
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            </div>
          </div>

          {/* ── TOMBOL KELUAR ── */}
          <div className="mb-8">
            <button
              onClick={onLogout}
              className="w-full py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Keluar dari Akun</span>
            </button>
          </div>

          {/* ── FOOTER INFORMASI APLIKASI ── */}
          <div className="text-center pb-6">
            <p className="text-xs font-bold text-gray-500">
              RuangSinggah.id • Solusi Hunian Kost Terpercaya
            </p>
            <p className="text-[10px] font-semibold text-gray-400 mt-1 tracking-wider">
              Versi Aplikasi v2.4.1 (Build 2026.2)
            </p>
          </div>
        </div>
      ) : viewMode === 'favorites' ? (
        /* ── SUB-VIEW: KOST FAVORIT SAYA ──────────────────────────────────────── */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Navigation */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              onClick={() => setViewMode('hub')}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:-translate-x-1 transition-transform" />
              <span>Kembali ke Menu Profil</span>
            </button>

            <button
              onClick={() => navigate(Page.LISTINGS)}
              className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Jelajahi Listing</span>
            </button>
          </div>

          {/* Title Section */}
          <div className="bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-transparent border border-rose-100 rounded-3xl p-5 sm:p-7 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Heart className="w-6 h-6 fill-white text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      Kost Favorit Saya
                    </h1>
                    {favoriteCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                        {favoriteCount} Tersimpan
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                    Daftar hunian kost pilihan yang Anda simpan untuk perbandingan dan pemesanan mudah.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          {favoriteLoading ? (
            /* Skeleton Loading */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                  <div className="h-48 bg-slate-200 w-full"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : favoriteKosts.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-gray-100 shadow-sm max-w-md mx-auto my-6">
              <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-xs">
                <Heart className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">
                Belum Ada Kost Favorit
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6">
                Anda belum menyimpan kost apa pun. Klik tombol <span className="font-bold text-gray-800">"Simpan"</span> di halaman detail kost untuk menambahkan hunian favorit Anda ke daftar ini.
              </p>
              <button
                onClick={() => navigate(Page.LISTINGS)}
                className="w-full py-3.5 px-6 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Cari Kost Sekarang</span>
              </button>
            </div>
          ) : (
            /* Listing Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteKosts.map((kost) => (
                <div key={kost.id} className="relative group">
                  <KostCard
                    kost={kost}
                    onClick={() => {
                      const slug = createKostSlug(kost);
                      navigate(`/kost/${slug || kost.id}`);
                    }}
                  />
                  {/* Floating Remove Button */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await toggleFavoriteProperty(kost.id, user?.uid || user?.id);
                      setFavoriteKosts(prev => prev.filter(k => k.id !== kost.id));
                      setFavoriteCount(prev => Math.max(0, prev - 1));
                    }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs hover:bg-rose-50 text-rose-500 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border border-rose-100 group/btn"
                    title="Hapus dari daftar favorit"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500 group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'transactions' ? (
        /* ── SUB-VIEW: RIWAYAT TRANSAKSI & TAGIHAN (MINIMALIS MURNI) ───────── */
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header Navigation */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setViewMode('hub')}
              className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali ke Menu Profil</span>
            </button>

            <button
              onClick={loadUserTransactions}
              disabled={transactionsLoading}
              className="p-2 sm:px-3 sm:py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Muat Ulang Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${transactionsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          </div>

          {/* Category Tabs Filter */}
          <div className="mb-4 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 min-w-max">
              {[
                { id: 'all', label: 'Semua', count: userTransactions.length },
                { id: 'booking', label: 'Sewa Kost', count: userTransactions.filter(t => t.category === 'booking').length },
                { id: 'extension', label: 'Perpanjangan', count: userTransactions.filter(t => t.category === 'extension').length },
                { id: 'facility', label: 'Fasilitas', count: userTransactions.filter(t => t.category === 'facility').length },
                { id: 'survey', label: 'Jasa Survey', count: userTransactions.filter(t => t.category === 'survey').length },
                { id: 'database', label: 'Database Kontak', count: userTransactions.filter(t => t.category === 'database').length },
              ].map((tab) => {
                const isActive = selectedTrxCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTrxCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isActive
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Cards List */}
          {transactionsLoading ? (
            <div className="space-y-2.5 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-2/3">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-20 shrink-0"></div>
                </div>
              ))}
            </div>
          ) : userTransactions.filter(t => selectedTrxCategory === 'all' || t.category === selectedTrxCategory).length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-2xs max-w-sm mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Tidak Ada Transaksi
              </h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                {selectedTrxCategory === 'all'
                  ? 'Anda belum memiliki riwayat transaksi atau tagihan.'
                  : `Belum ada riwayat transaksi pada kategori ini.`
                }
              </p>
              <button
                onClick={() => {
                  if (selectedTrxCategory === 'database') navigate(Page.PRODUCTS);
                  else if (selectedTrxCategory === 'survey') navigate(Page.SURVEY_SERVICE);
                  else navigate(Page.LISTINGS);
                }}
                className="w-full py-2.5 px-4 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {selectedTrxCategory === 'database' ? 'Lihat Database Kontak' :
                   selectedTrxCategory === 'survey' ? 'Pesan Jasa Survey' : 'Jelajahi Kost'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {userTransactions
                .filter(t => selectedTrxCategory === 'all' || t.category === selectedTrxCategory)
                .map((trx) => (
                  <div
                    key={trx.id}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 hover:border-gray-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Icon & Details (Jenis Transaksi, Title, Info) */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      {/* Category Icon / Compact Thumbnail */}
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden text-gray-600">
                        {trx.propertyImage ? (
                          <img
                            src={trx.propertyImage}
                            alt={trx.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : trx.category === 'database' ? (
                          <FileText className="w-4 h-4 text-emerald-600" />
                        ) : trx.category === 'survey' ? (
                          <MapPin className="w-4 h-4 text-purple-600" />
                        ) : trx.category === 'facility' ? (
                          <Zap className="w-4 h-4 text-amber-600" />
                        ) : trx.category === 'extension' ? (
                          <RotateCcw className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Building2 className="w-4 h-4 text-orange-600" />
                        )}
                      </div>

                      {/* Text Description */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-mono text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            {trx.invoiceNumber}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${trx.categoryBadgeClass}`}>
                            {trx.categoryLabel}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${trx.statusBadgeClass}`}>
                            {trx.statusLabel}
                          </span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {trx.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-0.5 flex-wrap">
                          {trx.subtitle && (
                            <span className="truncate max-w-[200px] text-gray-600">{trx.subtitle}</span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          {trx.paymentMethod && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-gray-600">{trx.paymentMethod}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Nominal & Pending Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-sm sm:text-base font-black text-gray-900">
                          {FORMAT_CURRENCY(trx.amount)}
                        </p>
                      </div>

                      {trx.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/order-status/${trx.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Bayar Sekarang</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : viewMode === 'rental_history' ? (
        /* ── SUB-VIEW: RIWAYAT SEWA KOST (KHUSUS KOST PERNAH DISEWA) ───────── */
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header Navigation */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setViewMode('hub')}
              className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali ke Menu Profil</span>
            </button>

            <button
              onClick={loadRentalHistory}
              disabled={rentalHistoryLoading}
              className="p-2 sm:px-3 sm:py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Muat Ulang Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${rentalHistoryLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          </div>

          {/* Rental Cards List */}
          {rentalHistoryLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-3.5 w-full sm:w-2/3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-xl shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded-xl w-28 shrink-0"></div>
                </div>
              ))}
            </div>
          ) : rentalHistoryList.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-2xs max-w-sm mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff7a00] border border-orange-100 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Belum Ada Riwayat Sewa
              </h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                Anda belum memiliki riwayat hunian kost yang pernah disewa sebelumnya.
              </p>
              <button
                onClick={() => navigate(Page.LISTINGS)}
                className="w-full py-2.5 px-4 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Jelajahi Listing Kost</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rentalHistoryList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 hover:border-gray-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  {/* Left: Image & Details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden text-gray-400">
                      {item.kostImage ? (
                        <img
                          src={item.kostImage}
                          alt={item.kostTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-orange-400" />
                      )}
                    </div>

                    {/* Info Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          Pernah Disewa (Selesai)
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          Kamar {item.roomNumber} • {item.roomType}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {item.kostTitle}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{item.kostAddress || item.kostCity || 'Makassar'}</span>
                      </div>

                      {/* Period Dates */}
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium mt-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>
                            {item.startDate ? new Date(item.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Mulai -'}
                            {' s/d '}
                            {item.endDate ? new Date(item.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selesai'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-50 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tarif Sewa Terakhir</span>
                      <p className="text-sm sm:text-base font-black text-gray-900">
                        {item.price > 0 ? FORMAT_CURRENCY(item.price) : 'Sesuai Kontrak'}
                        <span className="text-[10px] font-semibold text-gray-400 ml-1">/{item.rentPackage}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (item.kostSlug) navigate(`/kost/${item.kostSlug}`);
                        else if (item.kostId) navigate(`/kost/${item.kostId}`);
                        else navigate(Page.LISTINGS);
                      }}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-[#ff7a00] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      <span>Sewa Lagi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── SUB-VIEW: EDIT DATA PRIBADI FORM ────────────────────────────────── */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* TOP BACK TO HUB BUTTON & HEADER */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setViewMode('hub');
              }}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
              <span>Kembali ke Menu Profil</span>
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>

          {/* DESKTOP BREADCRUMB & HEADER SECTION */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-3">
              <span className="text-gray-300">/</span>
              <span className="text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => setViewMode('hub')}>
                Menu Profil
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-[#ff7a00] font-bold">Edit Data Kontak Pribadi</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    Edit Data Kontak Pribadi
                  </h1>
                  <span className="bg-orange-50 text-[#ff7a00] border border-orange-200 text-xs font-extrabold px-3 py-0.5 rounded-full shadow-2xs">
                    {getRoleBadge()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                  Kelola data personal, aksesibilitas sistem, dan parameter verifikasi identitas Anda.
                </p>
              </div>
            </div>
          </div>

        {/* Force Edit Message Alert */}
        {forceEdit && isEditing && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">Wajib Dilengkapi</p>
              <p className="text-xs text-amber-700 mt-0.5">Silakan lengkapi seluruh data diri wajib Anda sebelum melanjutkan transaksi.</p>
            </div>
          </div>
        )}

        {/* MAIN GRID LAYOUT (Responsive Desktop 2-Col & Mobile Stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: TOP PROFILE CARD (Desktop: Sidebar with 4-box stats & buttons, Mobile: Top Banner Card) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
            
            {/* Header Cover Gradient */}
            <div className="h-28 bg-gradient-to-r from-[#ff7a00] to-[#ea580c] relative p-3 flex justify-end items-start">
              <span className="hidden lg:inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-full border border-white/30 shadow-xs">
                {isAdmin ? 'SISTEM UTAMA' : 'AKUN AKTIF'}
              </span>
            </div>

            {/* Avatar & Photo Area */}
            <div className="px-5 pb-6">
              <div className="-mt-14 flex justify-center relative">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg bg-[#0b1c30] text-white flex items-center justify-center relative overflow-hidden">
                    {/* Layer 1: Initials */}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-black">
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
                  <div className="absolute bottom-0 right-0 bg-[#ff7a00] text-white p-1 rounded-full border-2 border-white shadow-xs z-20" title="Akun Terverifikasi">
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
              <div className="text-center mt-3 mb-3">
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
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center justify-center gap-1.5">
                    {formData.displayName || 'Pengguna Tanpa Nama'}
                    <CheckCircle2 className="w-4 h-4 text-[#ff7a00] fill-orange-50 shrink-0" />
                  </h2>
                )}
                <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{user.email}</p>
              </div>

              {/* Role Badge Pill */}
              <div className="flex justify-center mb-1 lg:mb-6">
                <span className="px-3.5 py-1 bg-orange-50/80 border border-orange-200 text-[#ff7a00] text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                  {isAdmin ? 'Administrator Terverifikasi' : isAgent ? 'Agen Survey Terverifikasi' : isOwner ? 'Mitra Pemilik Kost' : 'Pengguna Terverifikasi'}
                </span>
              </div>

              {/* Desktop Only: 4-Box Meta Grid */}
              <div className="hidden lg:grid grid-cols-2 gap-2.5 mb-6">
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

              {/* Desktop Only: Action Buttons in Sidebar */}
              <div className="hidden lg:block space-y-2.5">
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

          {/* RIGHT COLUMN: INFORMATION & SETTINGS PANELS (Desktop: 8 Cols, Mobile: Stacked Cards) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">

            {/* BANNER ADMINISTRATOR / OTORITAS TERVERIFIKASI */}
            <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/40 border border-orange-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-start justify-between gap-3 sm:gap-4 relative shadow-2xs">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ff7a00] text-white rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-xs sm:shadow-md sm:shadow-orange-500/20">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight">
                    {isAdmin ? 'ADMINISTRATOR TERVERIFIKASI' : isAgent ? 'AGEN SURVEY RESMI' : isOwner ? 'MITRA PEMILIK TERVERIFIKASI' : 'AKUN PENGGUNA TERVERIFIKASI'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed mt-0.5 sm:mt-1">
                    {isAdmin
                      ? 'Akun ini memiliki hak akses penuh untuk pengelolaan dan pengawasan sistem.'
                      : isAgent
                      ? 'Akses terverifikasi untuk menerima penugasan survey, verifikasi lapangan, dan pelaporan kondisi properti di platform RuangSinggah.id.'
                      : isOwner
                      ? 'Akses manajemen properti hunian, manajemen kamar, penagihan sewa, dan penerimaan transaksi sewa kost.'
                      : 'Akun Anda aktif dan siap digunakan untuk mencari hunian, memesan kost, dan memanfaatkan layanan survey resmi.'}
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-block px-3 py-1 bg-[#ff7a00] text-white text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 shadow-xs">
                Resmi
              </span>
            </div>

            {/* CARD 1: INFORMASI KONTAK & PEKERJAAN */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8">
              
              {/* Header Title with Orange Dot */}
              <div className="flex items-center gap-2 mb-4 sm:mb-6 sm:pb-4 sm:border-b sm:border-gray-50">
                <span className="w-2 h-2 rounded-full bg-[#ff7a00] shrink-0"></span>
                <h3 className="text-xs sm:text-base font-black text-gray-900 uppercase tracking-wider sm:tracking-tight">
                  INFORMASI KONTAK & PEKERJAAN
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-bold text-gray-900">{formData.phone ? `+62${formData.phone}` : '-'}</span>
                      </div>
                      <span className="hidden sm:inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <Briefcase className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0" />
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <Building2 className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0" />
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <Users className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.gender || <span className="text-gray-400 italic">Belum dipilih</span>}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* CARD 2: IDENTITAS & DOMISILI */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8">
              
              {/* Header Title with Slate Dot */}
              <div className="flex items-center gap-2 mb-4 sm:mb-6 sm:pb-4 sm:border-b sm:border-gray-50">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                <h3 className="text-xs sm:text-base font-black text-gray-900 uppercase tracking-wider sm:tracking-tight">
                  IDENTITAS & DOMISILI
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <Sparkles className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.religion || <span className="text-gray-400 italic">Belum dipilih</span>}</span>
                    </div>
                  )}
                </div>

                {/* Status Hubungan */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    STATUS <span className="text-red-500">*</span>
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <Heart className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.relationshipStatus || <span className="text-gray-400 italic">Belum dipilih</span>}</span>
                    </div>
                  )}
                </div>

                {/* Tempat Lahir (Col Span 2 on Mobile) */}
                <div className="col-span-2 space-y-1.5">
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <Building2 className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{formData.birthPlace || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Tanggal Lahir (Col Span 2 on Mobile) */}
                <div className="col-span-2 space-y-1.5">
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <Calendar className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">
                        {formData.birthDate
                          ? new Date(formData.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alamat Asal / Domisili Lengkap (Col Span 2) */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    ALAMAT ASAL <span className="text-red-500">*</span>
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
                    <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-start gap-2.5 min-h-[3.5rem]">
                      <MapPin className="hidden sm:inline-block w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-bold text-gray-900 leading-relaxed">{formData.address || '-'}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* KHUSUS AGEN: VERIFIKASI IDENTITAS KTP */}
            {isAgent && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-orange-100 shadow-sm p-5 sm:p-8">
                <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-gray-50">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">Verifikasi Identitas Agen</h3>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Wajib bagi Agen Survey RuangSinggah</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                      <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 font-mono font-bold text-gray-900">
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
                        <div className="px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100 text-xs font-bold text-red-400 italic">Belum upload foto KTP</div>
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

            {/* ACTION BUTTONS (Responsive) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onBack ? onBack() : navigate(Page.HOME)}
                className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-white hover:bg-gray-50 border border-orange-200 text-[#ff7a00] rounded-2xl sm:rounded-xl text-sm sm:text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer text-center order-2 sm:order-1"
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
                className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-[#0b1c30] hover:bg-[#132840] text-white rounded-2xl sm:rounded-xl text-sm sm:text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 order-1 sm:order-2"
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
      )}

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
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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

      {/* ── MODAL PREFERENSI NOTIFIKASI ───────────────────────────────────────── */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative">
            <button 
              onClick={() => setIsNotifModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Preferensi Notifikasi</h3>
                <p className="text-xs text-gray-400">Atur kanal notifikasi akun Anda</p>
              </div>
            </div>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-gray-800">Notifikasi WhatsApp</p>
                  <p className="text-[10px] text-gray-500">Pengingat sewa & update pesanan</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifSettings.waNotif} 
                  onChange={(e) => setNotifSettings(prev => ({ ...prev, waNotif: e.target.checked }))}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer" 
                />
              </div>
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-gray-800">Notifikasi Email</p>
                  <p className="text-[10px] text-gray-500">Kwitansi digital & laporan akun</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifSettings.emailNotif} 
                  onChange={(e) => setNotifSettings(prev => ({ ...prev, emailNotif: e.target.checked }))}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer" 
                />
              </div>
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-gray-800">Promo & Rekomendasi</p>
                  <p className="text-[10px] text-gray-500">Diskon kamar kost terbaru</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifSettings.promoNotif} 
                  onChange={(e) => setNotifSettings(prev => ({ ...prev, promoNotif: e.target.checked }))}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer" 
                />
              </div>
            </div>
            <button 
              onClick={() => {
                setIsNotifModalOpen(false);
                alert('Preferensi notifikasi berhasil disimpan.');
              }}
              className="w-full mt-6 py-3.5 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              Simpan Preferensi
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL KWITANSI DIGITAL RESMI ─────────────────────────────────────── */}
      <DigitalReceiptModal
        isOpen={showDigitalReceiptModal}
        onClose={() => setShowDigitalReceiptModal(false)}
        receipt={selectedReceipt}
      />

    </div>
  );
};

export default Profile;
