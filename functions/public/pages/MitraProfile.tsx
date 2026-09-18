import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
    User, ShieldCheck, MapPin, Phone, ChevronRight, LogOut, Upload, BadgeCheck, 
    AlertCircle, Clock, Search, X, Mail, Calendar, Gift, Lock, Wallet, Landmark, 
    Sparkles, HelpCircle, FileText, CheckCircle2, Edit3, ArrowLeft 
} from 'lucide-react';
import { sendWhatsAppTemplate, sendWaOtpVerification } from '../whatsappService';
import { notifyAdminIdentityVerification } from '../emailService';
import { FORMAT_CURRENCY } from '../constants';

interface MitraProfileProps {
    uid: string;
    user?: any;
    onBack?: () => void;
    onLogout?: () => void;
    autoOpenKmProgress?: boolean;
    onNavigateMenu?: (menuKey: string) => void;
    availableBalance?: number;
    onEditBank?: () => void;
}

const MitraProfile: React.FC<MitraProfileProps> = ({ 
    uid, 
    user: initialUser, 
    onBack, 
    onLogout, 
    autoOpenKmProgress,
    onNavigateMenu,
    availableBalance,
    onEditBank
}) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isEditingFromUrl = searchParams.get('edit') === 'true';
    const stepFromUrl = parseInt(searchParams.get('step') || '1', 10);

    const [loading, setLoading] = useState(!initialUser);
    const [isEditing, setIsEditing] = useState(isEditingFromUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingKtp, setIsUploadingKtp] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [currentStep, setCurrentStep] = useState(stepFromUrl);
    const [hasInitialReferral, setHasInitialReferral] = useState(false);

    // WhatsApp OTP states
    const [waOtpCode, setWaOtpCode] = useState('');
    const [waOtpInput, setWaOtpInput] = useState('');
    const [isVerifyingWaOtp, setIsVerifyingWaOtp] = useState(false);
    const [waOtpVerified, setWaOtpVerified] = useState(initialUser?.whatsapp_verified || false);
    const [waResendTimer, setWaResendTimer] = useState(0);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);

    // Double OTP states for WhatsApp change (verified Mitras)
    const [phoneEditStep, setPhoneEditStep] = useState<'none' | 'security_otp' | 'new_phone_input' | 'new_phone_otp'>('none');
    const [tempPhone, setTempPhone] = useState('');
    const [securityOtpCode, setSecurityOtpCode] = useState('');
    const [securityOtpInput, setSecurityOtpInput] = useState('');
    const [securityOtpDigits, setSecurityOtpDigits] = useState(['', '', '', '', '', '']);
    const securityOtpRefs = React.useRef<Array<HTMLInputElement | null>>([]);

    const [formData, setFormData] = useState({
        display_name: initialUser?.name || '',
        name: initialUser?.name || '',
        phone: initialUser?.phone || '',
        address: initialUser?.address || '',
        ktp_number: initialUser?.ktp_number || '',
        ktp_address: initialUser?.ktp_address || '',
        ktp_photo_url: initialUser?.ktp_photo_url || '',
        photo_url: initialUser?.photo_url || initialUser?.photoURL || '',
        verification_status: initialUser?.verification_status || 'unverified',
        verification_notes: initialUser?.verification_notes || '',
        email: initialUser?.email || '',
        birth_place: initialUser?.birth_place || '',
        birth_date: initialUser?.birth_date || '',
        referred_by: initialUser?.referred_by || '',
        gender: initialUser?.gender || '',
        religion: initialUser?.religion || '',
        occupation: initialUser?.occupation || '',
        relationship_status: initialUser?.relationship_status || ''
    });

    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // KostManager requests status tracking states
    const [kmRequests, setKmRequests] = useState<any[]>([]);
    const [loadingKm, setLoadingKm] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('regular');
    const [showKmProgressModal, setShowKmProgressModal] = useState(false);

    useEffect(() => {
        if (autoOpenKmProgress) {
            setShowKmProgressModal(true);
        } else {
            setShowKmProgressModal(false);
        }
    }, [autoOpenKmProgress]);

    useEffect(() => {
        if (!isEditing && uid) {
            loadKmRequests();
        }
    }, [isEditing, uid]);

    const loadKmRequests = async () => {
        setLoadingKm(true);
        try {
            const { data, error } = await supabase
                .from('kostmanager_requests')
                .select(`
                    *,
                    transaction:transaction_id (
                        amount,
                        status
                    )
                `)
                .eq('user_id', uid)
                .order('created_at', { ascending: false });
            if (!error && data) {
                setKmRequests(data);
            }
        } catch (e) {
            console.error('Error loading KM requests:', e);
        } finally {
            setLoadingKm(false);
        }
    };
    const getKmStepIndex = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'COMPLETED' || s === 'ACTIVE') return 5;
        if (s === 'PENDING_ONBOARDING') return 4;
        if (s === 'SURVEYING' || s === 'AGENT_ASSIGNED') return 3;
        if (s === 'PENDING_ASSIGNMENT' || s === 'PAID') return 2;
        return 1;
    };

    // Sync local state when URL params change (e.g. after background re-render)
    useEffect(() => {
        if (formData.verification_status === 'pending') {
            setIsEditing(false);
            if (isEditingFromUrl) {
                setSearchParams(new URLSearchParams());
            }
            return;
        }

        setIsEditing(isEditingFromUrl);
        if (formData.verification_status === 'verified' && stepFromUrl === 2) {
            setCurrentStep(1);
            setSearchParams({ edit: 'true', step: '1' });
        } else {
            setCurrentStep(stepFromUrl);
        }
    }, [isEditingFromUrl, stepFromUrl, formData.verification_status]);

    useEffect(() => {
        if (formData.verification_status === 'pending' && isEditing) {
            setIsEditing(false);
            setSearchParams(new URLSearchParams());
        }
        if (formData.verification_status === 'verified' && currentStep === 2) {
            setCurrentStep(1);
            setSearchParams({ edit: 'true', step: '1' });
        }
    }, [formData.verification_status, currentStep, isEditing]);

    useEffect(() => {
        loadProfile();
    }, [uid]);

    useEffect(() => {
        let interval: any;
        if (waResendTimer > 0) {
            interval = setInterval(() => {
                setWaResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [waResendTimer]);

    const loadData = async () => {
        loadProfile();
    };

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [profileRes, verifRes, mitraRes] = await Promise.all([
                supabase.from('users').select('*').eq('id', uid).maybeSingle(),
                supabase.from('user_verifications').select('*').eq('user_id', uid).maybeSingle(),
                supabase.from('mitra').select('referred_by, subscription_status').eq('user_id', uid).maybeSingle()
            ]);

            const profile = profileRes.data;
            const verif = verifRes.data || {};
            const mitraVal = mitraRes?.data?.referred_by || '';
            const subStatus = mitraRes?.data?.subscription_status || 'regular';
            setSubscriptionStatus(subStatus);

            if (profile) {
                setFormData({
                    display_name: profile.name || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    ktp_number: verif.ktp_number || '',
                    ktp_address: verif.ktp_address || '',
                    ktp_photo_url: verif.ktp_photo_url || '',
                    photo_url: profile.photo_url || '',
                    verification_status: profile.verification_status || 'unverified',
                    verification_notes: verif.verification_notes || '',
                    name: profile.name || '',
                    email: profile.email || initialUser?.email || '',
                    birth_place: profile.birth_place || '',
                    birth_date: profile.birth_date || '',
                    referred_by: mitraVal,
                    gender: profile.gender || '',
                    religion: profile.religion || '',
                    occupation: profile.occupation || '',
                    relationship_status: profile.relationship_status || ''
                });
                setWaOtpVerified(profile.whatsapp_verified || false);
                setHasInitialReferral(!!mitraVal);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentStep(1);
        // Hapus query params
        setSearchParams(new URLSearchParams());
        loadProfile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const saveStep1Draft = async () => {
        if (!waOtpVerified && !initialUser?.whatsapp_verified) {
            alert('Nomor WhatsApp wajib diverifikasi dengan kode OTP sebelum melanjutkan ke tahap berikutnya.');
            return;
        }
        setIsSubmitting(true);
        try {
            const updates: any = {
                name: formData.display_name,
                full_name: formData.display_name,
                phone: formData.phone,
                address: formData.address,
                photo_url: formData.photo_url,
                birth_place: formData.birth_place,
                birth_date: formData.birth_date || null,
                whatsapp_verified: waOtpVerified,
                gender: formData.gender,
                religion: formData.religion,
                occupation: formData.occupation,
                relationship_status: formData.relationship_status,
                updated_at: new Date().toISOString()
            };
            
            const { error: userErr } = await supabase.from('users').update(updates).eq('id', uid);
            if (userErr) throw userErr;

            if (!hasInitialReferral && formData.referred_by && formData.referred_by.trim() !== '') {
                const trimmedRef = formData.referred_by.trim();
                const { error: mitraErr } = await supabase
                    .from('mitra')
                    .update({
                        referred_by: trimmedRef,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', uid);
                
                if (mitraErr) throw mitraErr;
                setHasInitialReferral(true);
            }
            setSearchParams({ edit: 'true', step: '2' });
            window.dispatchEvent(new Event('RS_USER_UPDATED'));
        } catch (error: any) {
            console.error('Error saving draft:', error);
            alert('Gagal menyimpan draf: ' + (error.message || error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendWaOtp = async () => {
        if (!formData.phone || formData.phone.trim() === '') {
            alert('Silakan isi nomor WhatsApp Anda terlebih dahulu.');
            return;
        }
        setIsSubmitting(true);
        try {
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setWaOtpCode(generatedOtp);

            const res = await sendWaOtpVerification(formData.phone, generatedOtp);

            if (!res.success) {
                alert(`Gagal mengirim kode OTP ke WhatsApp: ${res.error || 'Terjadi kesalahan sistem'}. Mohon pastikan nomor WhatsApp aktif dan formatnya benar.`);
                return;
            }

            setIsVerifyingWaOtp(true);
            setWaResendTimer(60);
            setOtpDigits(['', '', '', '', '', '']);
            setWaOtpInput('');
            alert('Kode OTP 6 digit telah berhasil dikirim ke WhatsApp Anda. Silakan masukkan kode untuk menyelesaikan verifikasi.');
        } catch (error: any) {
            alert(`Gagal mengirim OTP: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyWaOtp = async () => {
        const enteredOtp = (waOtpInput || otpDigits.join('')).trim();
        if (enteredOtp && enteredOtp === waOtpCode && waOtpCode !== '') {
            setWaOtpVerified(true);
            setIsVerifyingWaOtp(false);
            try {
                await supabase.from('users').update({
                    phone: formData.phone,
                    whatsapp_verified: true,
                    updated_at: new Date().toISOString()
                }).eq('id', uid);
            } catch (dbErr) {
                console.warn('Gagal update whatsapp_verified ke database:', dbErr);
            }
            alert('Nomor WhatsApp berhasil diverifikasi resmi! Anda sekarang dapat melanjutkan ke pengisian data identitas KTP.');
        } else {
            alert('Kode OTP salah atau tidak sesuai. Silakan periksa kembali pesan WhatsApp Anda atau klik Kirim Ulang.');
        }
    };

    const handleInitiateChangePhone = () => {
        const confirmChange = window.confirm(
            'Apakah Anda yakin ingin mengganti nomor WhatsApp? Nomor yang baru wajib diverifikasi ulang dengan kode OTP WhatsApp sebelum Anda dapat melanjutkan.'
        );
        if (!confirmChange) return;

        setWaOtpVerified(false);
        setWaOtpCode('');
        setWaOtpInput('');
        setOtpDigits(['', '', '', '', '', '']);
        setIsVerifyingWaOtp(false);
        setWaResendTimer(0);
    };

    const handleOtpDigitChange = (index: number, value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        if (!cleanValue) {
            const newDigits = [...otpDigits];
            newDigits[index] = '';
            setOtpDigits(newDigits);
            setWaOtpInput(newDigits.join(''));
            return;
        }

        const lastChar = cleanValue[cleanValue.length - 1];
        const newDigits = [...otpDigits];
        newDigits[index] = lastChar;
        setOtpDigits(newDigits);
        setWaOtpInput(newDigits.join(''));

        if (index < 5 && lastChar) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const newDigits = [...otpDigits];
            if (otpDigits[index] === '') {
                if (index > 0) {
                    newDigits[index - 1] = '';
                    setOtpDigits(newDigits);
                    setWaOtpInput(newDigits.join(''));
                    otpRefs.current[index - 1]?.focus();
                }
            } else {
                newDigits[index] = '';
                setOtpDigits(newDigits);
                setWaOtpInput(newDigits.join(''));
            }
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pastedData[i] || '';
        }
        setOtpDigits(newDigits);
        setWaOtpInput(newDigits.join(''));
        const focusIndex = Math.min(pastedData.length, 5);
        otpRefs.current[focusIndex]?.focus();
    };

    const handleSendSecurityOtp = async () => {
        if (!formData.email) {
            alert('Alamat email tidak ditemukan.');
            return;
        }
        setIsSubmitting(true);
        try {
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setSecurityOtpCode(generatedOtp);

            const response = await fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendOtpEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: generatedOtp,
                    subject: '[RuangSinggah.id] Kode Keamanan Perubahan WhatsApp'
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengirim email OTP');
            }

            setWaResendTimer(60);
            setSecurityOtpDigits(['', '', '', '', '', '']);
            setSecurityOtpInput('');
            alert('Kode OTP Keamanan telah dikirim ke email terdaftar Anda.');
        } catch (error: any) {
            alert(`Gagal mengirim OTP Keamanan: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifySecurityOtp = () => {
        if (securityOtpInput.trim() === securityOtpCode) {
            setPhoneEditStep('new_phone_input');
            setTempPhone('');
            alert('Verifikasi kode keamanan berhasil. Silakan masukkan nomor WhatsApp baru Anda.');
        } else {
            alert('Kode OTP Keamanan salah atau tidak sesuai. Silakan coba lagi.');
        }
    };

    const handleSendNewWaOtp = async () => {
        if (!tempPhone || tempPhone.trim() === '') {
            alert('Silakan masukkan nomor WhatsApp baru terlebih dahulu.');
            return;
        }
        setIsSubmitting(true);
        try {
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setWaOtpCode(generatedOtp);

            const res = await sendWaOtpVerification(tempPhone, generatedOtp);

            if (!res.success) {
                alert(`Gagal mengirim kode OTP ke WhatsApp baru: ${res.error || 'Terjadi kesalahan'}.`);
                return;
            }

            setPhoneEditStep('new_phone_otp');
            setWaResendTimer(60);
            setOtpDigits(['', '', '', '', '', '']);
            setWaOtpInput('');
            alert('Kode OTP 6 digit telah dikirim ke nomor WhatsApp baru Anda.');
        } catch (error: any) {
            alert(`Gagal mengirim OTP WhatsApp: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyNewWaOtp = async () => {
        const enteredOtp = (waOtpInput || otpDigits.join('')).trim();
        if (enteredOtp && enteredOtp === waOtpCode && waOtpCode !== '') {
            setFormData(prev => ({ ...prev, phone: tempPhone }));
            setWaOtpVerified(true);
            setPhoneEditStep('none');
            try {
                await supabase.from('users').update({
                    phone: tempPhone,
                    whatsapp_verified: true,
                    updated_at: new Date().toISOString()
                }).eq('id', uid);
            } catch (dbErr) {
                console.warn('Gagal update phone baru ke database:', dbErr);
            }
            alert('Nomor WhatsApp baru berhasil diverifikasi!');
        } else {
            alert('Kode OTP salah atau tidak sesuai. Silakan coba lagi.');
        }
    };

    const handleSecurityOtpDigitChange = (index: number, value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        if (!cleanValue) {
            const newDigits = [...securityOtpDigits];
            newDigits[index] = '';
            setSecurityOtpDigits(newDigits);
            setSecurityOtpInput(newDigits.join(''));
            return;
        }

        const lastChar = cleanValue[cleanValue.length - 1];
        const newDigits = [...securityOtpDigits];
        newDigits[index] = lastChar;
        setSecurityOtpDigits(newDigits);
        setSecurityOtpInput(newDigits.join(''));

        if (index < 5 && lastChar) {
            securityOtpRefs.current[index + 1]?.focus();
        }
    };

    const handleSecurityOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const newDigits = [...securityOtpDigits];
            if (securityOtpDigits[index] === '') {
                if (index > 0) {
                    newDigits[index - 1] = '';
                    setSecurityOtpDigits(newDigits);
                    setSecurityOtpInput(newDigits.join(''));
                    securityOtpRefs.current[index - 1]?.focus();
                }
            } else {
                newDigits[index] = '';
                setSecurityOtpDigits(newDigits);
                setSecurityOtpInput(newDigits.join(''));
            }
        }
    };

    const handleSecurityOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
        const newDigits = [...securityOtpDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pastedData[i] || '';
        }
        setSecurityOtpDigits(newDigits);
        setSecurityOtpInput(newDigits.join(''));
        const focusIndex = Math.min(pastedData.length, 5);
        securityOtpRefs.current[focusIndex]?.focus();
    };

    const performOcr = async (imageUrl: string) => {
        setIsScanning(true);
        try {
            // Timeout guard 25 detik agar tetap fleksibel untuk jaringan seluler
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Waktu pemindaian melebihi batas waktu (25 detik)')), 25000)
            );

            const invokePromise = supabase.functions.invoke('analyze-ktp', {
                body: { 
                    imageUrl: imageUrl,
                    mimeType: 'image/webp'
                }
            });

            const res: any = await Promise.race([invokePromise, timeoutPromise]);
            const { data: aiRes, error: aiErr } = res || {};

            if (!aiErr && aiRes && aiRes.success && aiRes.data) {
                const aiData = aiRes.data;
                setFormData(prev => ({
                    ...prev,
                    ktp_number: aiData.nik || prev.ktp_number,
                    display_name: aiData.name || prev.display_name,
                    name: aiData.name || prev.name,
                    ktp_address: aiData.address || prev.ktp_address,
                    birth_place: aiData.birth_place || prev.birth_place,
                    birth_date: aiData.birth_date || prev.birth_date,
                    gender: aiData.gender || prev.gender,
                    religion: aiData.religion || prev.religion,
                    occupation: aiData.occupation || prev.occupation,
                    relationship_status: aiData.relationship_status || prev.relationship_status
                }));
                alert('Data KTP berhasil dipindai otomatis. Mohon periksa kembali kecocokan data Anda sebelum melanjutkan.');
            } else {
                let detailMsg = aiErr?.message || '';
                if (aiErr?.context) {
                    try {
                        const errJson = await aiErr.context.json();
                        if (errJson?.error) detailMsg = errJson.error;
                    } catch (_) {}
                }
                console.warn('AI Extraction response:', aiErr || aiRes, detailMsg);
                alert(`Pemindaian otomatis belum optimal${detailMsg ? ` (${detailMsg})` : ''}. Silakan periksa dan lengkapi data profil Anda secara manual.`);
            }
        } catch (error: any) {
            console.error('OCR Error:', error);
            alert('Pemindaian otomatis memerlukan waktu lebih lama. Silakan lanjutkan pengisian data profil secara manual.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'phone') {
            setWaOtpVerified(false);
            setIsVerifyingWaOtp(false);
            setWaOtpCode('');
            setWaOtpInput('');
            setOtpDigits(['', '', '', '', '', '']);
        }
    };

    const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingKtp(true);
        try {
            const { convertToWebP } = await import('../adminService');
            const processedFile = await convertToWebP(file);
            const rawBaseName = processedFile.name.substring(0, processedFile.name.lastIndexOf('.')) || processedFile.name;
            const safeBaseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `${uid}-${Date.now()}_${safeBaseName}.webp`;
            const filePath = `ktp/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('survey-photos')
                .upload(filePath, processedFile, {
                    contentType: 'image/webp'
                });

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
        if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB'); return; }

        setIsUploadingPhoto(true);
        try {
            const { convertToWebP } = await import('../adminService');
            const processedFile = await convertToWebP(file);
            const baseName = processedFile.name.substring(0, processedFile.name.lastIndexOf('.')) || processedFile.name;
            const fileName = `${uid}-${Date.now()}_${baseName}.webp`;
            const filePath = `profiles/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('survey-photos')
                .upload(filePath, processedFile, {
                    contentType: 'image/webp'
                });
                
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('survey-photos').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, photo_url: publicUrl }));
            alert('Foto profil berhasil diunggah.');
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Gagal mengunggah foto profil.');
        } finally { setIsUploadingPhoto(false); }
    };

    const handleSave = async () => {
        if (!formData.phone || formData.phone.trim() === '') { 
            alert('Nomor WhatsApp wajib diisi'); 
            return; 
        }
        if (!waOtpVerified && !initialUser?.whatsapp_verified) {
            alert('Nomor WhatsApp wajib diverifikasi dengan kode OTP sebelum menyimpan dan mengajukan verifikasi identitas.');
            return;
        }
        setIsSubmitting(true);
        try {
            const updates: any = {
                name: formData.display_name,
                full_name: formData.display_name,
                phone: formData.phone,
                address: formData.address,
                photo_url: formData.photo_url,
                birth_place: formData.birth_place,
                birth_date: formData.birth_date || null,
                whatsapp_verified: waOtpVerified,
                gender: formData.gender,
                religion: formData.religion,
                occupation: formData.occupation,
                relationship_status: formData.relationship_status,
                updated_at: new Date().toISOString()
            };

            // Process Verification if fields are provided
            let isNewVerificationSubmission = false;
            if (formData.ktp_photo_url && formData.ktp_number && formData.verification_status !== 'verified') {
                isNewVerificationSubmission = true;
                updates.verification_status = 'pending';
                const { error: verifErr } = await supabase.from('user_verifications').upsert({
                    user_id: uid,
                    ktp_number: formData.ktp_number,
                    ktp_address: formData.ktp_address,
                    ktp_photo_url: formData.ktp_photo_url,
                    verification_status: 'pending',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
                if (verifErr) throw verifErr;
                setFormData(prev => ({ ...prev, verification_status: 'pending' }));
            }

            const { error: userErr } = await supabase.from('users').update(updates).eq('id', uid);
            if (userErr) throw userErr;

            if (isNewVerificationSubmission) {
                notifyAdminIdentityVerification({
                    role: 'mitra',
                    name: formData.display_name,
                    email: initialUser?.email || formData.email,
                    phone: formData.phone,
                    userId: uid
                }).catch(err => console.warn('Failed to notify admin via email:', err));
            }

            // Save referral code to mitra table if not set initially and provided now
            if (!hasInitialReferral && formData.referred_by && formData.referred_by.trim() !== '') {
                const trimmedRef = formData.referred_by.trim();
                const { error: mitraErr } = await supabase
                    .from('mitra')
                    .update({
                        referred_by: trimmedRef,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', uid);
                
                if (mitraErr) throw mitraErr;
                setHasInitialReferral(true);
            }

            window.dispatchEvent(new Event('RS_USER_UPDATED'));
            setIsEditing(false);
            setCurrentStep(1);
            setSearchParams(new URLSearchParams());
            alert('Profil dan data verifikasi berhasil disimpan!');
        } catch (error: any) { 
            console.error('Error saving profile:', error);
            alert('Gagal menyimpan profil: ' + (error.message || error));
        }
        finally { setIsSubmitting(false); }
    };
    const CLOSED_KM_STATUSES = ['COMPLETED', 'ACTIVE', 'INACTIVE', 'CANCELLED', 'REJECTED', 'CLOSED', 'TERMINATED'];
    const activeKmReq = (kmRequests || []).find((r: any) => {
        const s = (r.status || '').toUpperCase();
        return s && !CLOSED_KM_STATUSES.includes(s);
    }) || null;
    const hasActiveKmRequest = Boolean(activeKmReq);

    if (loading && !initialUser) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20 space-y-6 text-left">
            {isEditing && formData.verification_status !== 'banned' ? (
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="relative z-10">
                        {/* Tombol Kembali ke Menu Profil Hub */}
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                            >
                                <ArrowLeft size={16} /> Kembali ke Menu Profil
                            </button>
                        </div>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500"><User size={24} /></div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Lengkapi Profil & Verifikasi</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
                                        {formData.verification_status === 'verified' ? 'Lengkapi data profil Anda' : `Langkah ${currentStep} dari 2: ${currentStep === 1 ? 'Data Profil' : 'Verifikasi Identitas'}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleCancel} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="space-y-10">
                            {currentStep === 1 ? (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-3 bg-orange-500 rounded-full"></span>
                                        Data Profil
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Foto Profil (Opsional) */}
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Foto Profil (Opsional)</label>
                                            <div className="flex items-center gap-5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                <div className="w-20 h-20 bg-orange-50 rounded-2xl border-2 border-white overflow-hidden relative flex items-center justify-center text-2xl font-black text-orange-200 shadow-md">
                                                    {formData.photo_url ? (
                                                        <img src={formData.photo_url} className="w-full h-full object-cover" alt="Preview" />
                                                    ) : (
                                                        <span>{formData.display_name?.charAt(0).toUpperCase() || 'M'}</span>
                                                    )}
                                                    {isUploadingPhoto && (
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer inline-block transition-all shadow-sm active:scale-95">
                                                        {isUploadingPhoto ? 'Mengunggah...' : 'Pilih Foto'}
                                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                                                    </label>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Format JPG/PNG, Maksimal 2MB</p>
                                                </div>
                                            </div>
                                        </div>

                                        <ProfileItemRead icon={<User size={18} />} label="Nama Lengkap" value={formData.display_name} isEditing={true} name="display_name" onChange={handleInputChange} />
                                        <div className="md:col-span-2">
                                            {formData.verification_status === 'verified' ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">No. WhatsApp</label>
                                                        {waOtpVerified && (
                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                                                <BadgeCheck size={12} className="text-green-500" /> WhatsApp Terverifikasi
                                                            </span>
                                                        )}
                                                    </div>
                                                    {phoneEditStep === 'none' ? (
                                                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                                                            <span className="font-bold text-sm text-gray-900">{formData.phone}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => {
                                                                    setPhoneEditStep('security_otp');
                                                                    setSecurityOtpDigits(['', '', '', '', '', '']);
                                                                    setSecurityOtpInput('');
                                                                    setSecurityOtpCode('');
                                                                }} 
                                                                className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:underline"
                                                            >
                                                                Ubah
                                                            </button>
                                                        </div>
                                                    ) : phoneEditStep === 'security_otp' ? (
                                                        <div className="space-y-3">
                                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                                                                <span className="font-bold text-sm text-gray-500">{formData.phone} (Terkunci)</span>
                                                                {!securityOtpCode && (
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={handleSendSecurityOtp} 
                                                                        className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:underline"
                                                                    >
                                                                        Kirim OTP Keamanan
                                                                    </button>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4 text-center">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Masukkan 6 Digit OTP Keamanan Email</span>
                                                                    {waResendTimer > 0 && securityOtpCode ? (
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Kirim ulang dalam {waResendTimer}s</span>
                                                                    ) : securityOtpCode ? (
                                                                        <button type="button" onClick={handleSendSecurityOtp} className="text-[9px] font-black text-orange-500 hover:underline uppercase">
                                                                            Kirim Ulang
                                                                        </button>
                                                                    ) : null}
                                                                </div>

                                                                <div className="flex justify-center gap-2">
                                                                    {securityOtpDigits.map((digit, idx) => (
                                                                        <input
                                                                            key={idx}
                                                                            ref={el => { securityOtpRefs.current[idx] = el; }}
                                                                            type="text"
                                                                            maxLength={1}
                                                                            value={digit}
                                                                            onChange={e => handleSecurityOtpDigitChange(idx, e.target.value)}
                                                                            onKeyDown={e => handleSecurityOtpKeyDown(idx, e)}
                                                                            onPaste={handleSecurityOtpPaste}
                                                                            className="w-10 h-12 text-center font-mono font-bold text-lg bg-white border border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-all shadow-sm"
                                                                        />
                                                                    ))}
                                                                </div>

                                                                <button 
                                                                    type="button" 
                                                                    onClick={handleVerifySecurityOtp} 
                                                                    disabled={securityOtpInput.length !== 6}
                                                                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs rounded-xl active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-orange-500/20"
                                                                >
                                                                    Verifikasi Kode Keamanan
                                                                </button>

                                                                {!securityOtpCode && (
                                                                    <p className="text-[10px] text-orange-600/80 font-bold leading-normal text-left px-1">
                                                                        ⚠️ Silakan klik tombol <span className="underline text-orange-700">Kirim OTP Keamanan</span> di atas terlebih dahulu untuk menerima kode verifikasi OTP via email terdaftar Anda.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : phoneEditStep === 'new_phone_input' ? (
                                                        <div className="space-y-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Masukkan nomor WhatsApp baru"
                                                                    value={tempPhone}
                                                                    onChange={e => setTempPhone(e.target.value)}
                                                                    className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white p-4 rounded-2xl outline-none font-bold text-sm text-gray-900 transition-colors"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setPhoneEditStep('none')} 
                                                                    className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all uppercase tracking-widest"
                                                                >
                                                                    Batal
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={handleSendNewWaOtp} 
                                                                    className="w-2/3 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-orange-500/20"
                                                                >
                                                                    Kirim OTP WhatsApp Baru
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : phoneEditStep === 'new_phone_otp' ? (
                                                        <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4 text-center">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Masukkan 6 Digit OTP WhatsApp Baru ({tempPhone})</span>
                                                                {waResendTimer > 0 ? (
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Kirim ulang dalam {waResendTimer}s</span>
                                                                ) : (
                                                                    <button type="button" onClick={handleSendNewWaOtp} className="text-[9px] font-black text-orange-500 hover:underline uppercase">
                                                                        Kirim Ulang
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="flex justify-center gap-2">
                                                                {otpDigits.map((digit, idx) => (
                                                                    <input
                                                                        key={idx}
                                                                        ref={el => { otpRefs.current[idx] = el; }}
                                                                        type="text"
                                                                        maxLength={1}
                                                                        value={digit}
                                                                        onChange={e => handleOtpDigitChange(idx, e.target.value)}
                                                                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                                                                        onPaste={handleOtpPaste}
                                                                        className="w-10 h-12 text-center font-mono font-bold text-lg bg-white border border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-all shadow-sm"
                                                                    />
                                                                ))}
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setPhoneEditStep('new_phone_input')} 
                                                                    className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all uppercase tracking-widest"
                                                                >
                                                                    Kembali
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={handleVerifyNewWaOtp} 
                                                                    disabled={waOtpInput.length !== 6}
                                                                    className="w-2/3 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs rounded-xl active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-orange-500/20"
                                                                >
                                                                    Verifikasi OTP Baru
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 text-gray-400">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><Phone size={18} /></div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none text-gray-500">No. WhatsApp</p>
                                                        </div>
                                                        {waOtpVerified ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                                                    <BadgeCheck size={12} className="text-green-500" /> Terverifikasi
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleInitiateChangePhone}
                                                                    className="text-[9px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md border border-orange-200 transition-all active:scale-95"
                                                                >
                                                                    Ganti Nomor
                                                                </button>
                                                            </div>
                                                        ) : waOtpCode ? (
                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
                                                                <Clock size={12} className="text-orange-500" /> Kode Terkirim
                                                            </span>
                                                        ) : (
                                                            <button type="button" onClick={handleSendWaOtp} className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors border border-orange-100">
                                                                Kirim OTP
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            readOnly={waOtpVerified}
                                                            placeholder="Contoh: 081234567890"
                                                            className={`w-full border ${waOtpVerified ? 'border-green-200 bg-green-50/20 text-gray-700 cursor-not-allowed select-none' : 'bg-gray-50 border-gray-200 focus:border-orange-500 focus:bg-white text-gray-900'} p-4 pr-12 rounded-2xl outline-none font-bold text-sm transition-colors`}
                                                        />
                                                        {waOtpVerified && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1.5 pointer-events-none">
                                                                <BadgeCheck size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {!waOtpVerified && (waOtpCode !== '' || isVerifyingWaOtp) && (
                                                        <div className="mt-2 p-5 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4 text-center">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Masukkan 6 Digit OTP</span>
                                                                {waResendTimer > 0 ? (
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Kirim ulang dalam {waResendTimer}s</span>
                                                                ) : (
                                                                    <button type="button" onClick={handleSendWaOtp} className="text-[9px] font-black text-orange-500 hover:underline uppercase">
                                                                        Kirim Ulang
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="flex justify-center gap-2">
                                                                {otpDigits.map((digit, idx) => (
                                                                    <input
                                                                        key={idx}
                                                                        ref={el => { otpRefs.current[idx] = el; }}
                                                                        type="text"
                                                                        maxLength={1}
                                                                        value={digit}
                                                                        onChange={e => handleOtpDigitChange(idx, e.target.value)}
                                                                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                                                                        onPaste={handleOtpPaste}
                                                                        className="w-10 h-12 text-center font-mono font-bold text-lg bg-white border border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-all shadow-sm"
                                                                    />
                                                                ))}
                                                            </div>

                                                            <button type="button" onClick={handleVerifyWaOtp} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-orange-500/20">
                                                                Verifikasi WhatsApp
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <ProfileItemRead icon={<Mail size={18} />} label="Alamat Email" value={formData.email} isEditing={false} name="email" />
                                        <div className="md:col-span-2">
                                            <ProfileItemRead icon={<MapPin size={18} />} label="Alamat Domisili" value={formData.address} isEditing={true} name="address" onChange={handleInputChange} isTextArea={true} />
                                        </div>
                                        {formData.verification_status !== 'verified' && !hasInitialReferral && (
                                             <div className="md:col-span-2 animate-in fade-in duration-300">
                                                 <ProfileItemRead 
                                                     icon={<Gift size={18} />} 
                                                     label="Kode Referral Agen (Opsional)" 
                                                     value={formData.referred_by} 
                                                     isEditing={true} 
                                                     name="referred_by" 
                                                     onChange={handleInputChange} 
                                                     placeholder="Contoh: AGXXXXXX" 
                                                 />
                                             </div>
                                         )}
                                    </div>
                                </div>
                            ) : formData.verification_status === 'verified' ? (
                                <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest bg-red-50 border border-red-100 rounded-3xl">
                                    Akses Ditolak: Akun Anda sudah terverifikasi.
                                </div>
                            ) : (!waOtpVerified && !initialUser?.whatsapp_verified) ? (
                                <div className="p-8 text-center space-y-4 bg-orange-50 border border-orange-200 rounded-3xl">
                                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                                        <AlertCircle size={32} />
                                    </div>
                                    <h4 className="text-base font-black text-orange-950 uppercase tracking-tight">Nomor WhatsApp Belum Terverifikasi</h4>
                                    <p className="text-xs font-bold text-orange-800/80 max-w-md mx-auto leading-relaxed">
                                        Untuk keamanan akun dan kelancaran notifikasi KostManager, Anda wajib memverifikasi nomor WhatsApp dengan kode OTP di Langkah 1 sebelum dapat mengunggah KTP dan mengajukan verifikasi identitas.
                                    </p>
                                    <button 
                                        type="button" 
                                        onClick={() => { setSearchParams({ edit: 'true', step: '1' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                    >
                                        Kembali ke Langkah 1 (Verifikasi WhatsApp)
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-green-600 mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-3 bg-green-500 rounded-full"></span>
                                        Verifikasi Identitas (KTP)
                                    </h4>
                                    
                                    {/* Security & Privacy Notice */}
                                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-5 animate-in fade-in duration-300 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-1">Privasi & Keamanan Data Terjamin</h4>
                                            <p className="text-xs font-bold text-blue-700/80 leading-relaxed">
                                                Dokumen identitas Anda dienkripsi dan disimpan secara aman dalam sistem terproteksi. Data hanya digunakan untuk keperluan verifikasi kepemilikan kost dan tidak akan pernah dibagikan kepada penyewa atau pihak ketiga.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-10">
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Foto KTP Asli</label>
                                                <div className="relative aspect-[1.6/1] w-full max-w-md rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center hover:border-orange-500 transition-colors group">
                                                    {formData.ktp_photo_url ? (
                                                        <img src={formData.ktp_photo_url} className="w-full h-full object-cover" alt="KTP" />
                                                    ) : (
                                                        <label className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center">
                                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm group-hover:text-orange-500 group-hover:scale-110 transition-all">
                                                                <Upload size={20} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-500">{isUploadingKtp ? 'Mengunggah...' : 'Pilih Foto KTP'}</span>
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                                                        </label>
                                                    )}
                                                    {isScanning && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs text-orange-500 animate-pulse">Membaca Data KTP...</div>}
                                                </div>
                                                {formData.ktp_photo_url && (
                                                    <label className="text-[10px] font-bold text-blue-500 uppercase cursor-pointer hover:underline text-right block w-full max-w-md mt-2">
                                                        Ganti Foto KTP
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                                                    </label>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">NIK (16 Digit)</label>
                                                    <input name="ktp_number" value={formData.ktp_number} onChange={handleInputChange} maxLength={16} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all" placeholder="Contoh: 3171234567890001" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Nama Lengkap (Sesuai KTP)</label>
                                                    <input name="display_name" value={formData.display_name} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all" placeholder="Nama Lengkap" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Tempat Lahir (Sesuai KTP)</label>
                                                    <input name="birth_place" value={formData.birth_place} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all" placeholder="Tempat Lahir" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Tanggal Lahir (Sesuai KTP)</label>
                                                    <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all cursor-pointer" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Jenis Kelamin</label>
                                                    <select name="gender" value={formData.gender || ''} onChange={handleInputChange as any} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all appearance-none cursor-pointer">
                                                        <option value="">Pilih Jenis Kelamin</option>
                                                        <option value="Pria">Pria</option>
                                                        <option value="Wanita">Wanita</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Agama</label>
                                                    <select name="religion" value={formData.religion || ''} onChange={handleInputChange as any} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all appearance-none cursor-pointer">
                                                        <option value="">Pilih Agama</option>
                                                        <option value="Islam">Islam</option>
                                                        <option value="Kristen Protestan">Kristen Protestan</option>
                                                        <option value="Kristen Katolik">Kristen Katolik</option>
                                                        <option value="Hindu">Hindu</option>
                                                        <option value="Buddha">Buddha</option>
                                                        <option value="Konghucu">Konghucu</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Pekerjaan</label>
                                                    <input name="occupation" value={formData.occupation || ''} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all" placeholder="Pekerjaan" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Status Perkawinan</label>
                                                    <select name="relationship_status" value={formData.relationship_status || ''} onChange={handleInputChange as any} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all appearance-none cursor-pointer">
                                                        <option value="">Pilih Status</option>
                                                        <option value="Single">Belum Kawin</option>
                                                        <option value="Menikah">Kawin</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Alamat Sesuai KTP</label>
                                                    <textarea name="ktp_address" value={formData.ktp_address} onChange={handleInputChange} rows={2} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all resize-none" placeholder="Masukkan alamat lengkap RT/RW, dsb" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}



                            {/* Action Buttons */}
                            <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
                                {currentStep === 1 ? (
                                    <>
                                        <button type="button" onClick={handleCancel} className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all text-center">
                                            BATAL
                                        </button>
                                        {formData.verification_status === 'verified' ? (
                                            <button type="button" onClick={handleSave} disabled={isSubmitting} className="w-full sm:w-auto px-10 py-4 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-orange-500/20 text-center">
                                                {isSubmitting ? 'MEMPROSES...' : 'SIMPAN SEMUA DATA'}
                                            </button>
                                        ) : (
                                            (() => {
                                                const isStep1Complete =
                                                    formData.display_name.trim() !== '' &&
                                                    formData.phone.trim() !== '' &&
                                                    waOtpVerified &&
                                                    formData.address.trim() !== '';
                                                return (
                                                    <button
                                                        type="button"
                                                        disabled={!isStep1Complete}
                                                        onClick={async () => {
                                                            if (!waOtpVerified) {
                                                                alert('Silakan verifikasi nomor WhatsApp Anda terlebih dahulu sebelum melanjutkan.');
                                                                return;
                                                            }
                                                            await saveStep1Draft();
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`w-full sm:w-auto px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 ${isStep1Complete
                                                                ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20 cursor-pointer'
                                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        LANJUTKAN <ChevronRight size={16} />
                                                    </button>
                                                );
                                            })()
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button type="button" onClick={() => { setSearchParams({ edit: 'true', step: '1' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all text-center">
                                            KEMBALI KE DATA PROFIL
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleSave} 
                                            disabled={isSubmitting || (!waOtpVerified && !initialUser?.whatsapp_verified)} 
                                            className="w-full sm:w-auto px-10 py-4 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-orange-500/20 text-center"
                                        >
                                            {isSubmitting ? 'MEMPROSES...' : 'SIMPAN & AJUKAN VERIFIKASI'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ── USER PROFILE CARD (Ala Profile Role User) ── */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="relative group shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl text-white font-black shadow-lg shadow-slate-900/10 overflow-hidden relative border-2 border-white">
                                    {formData.photo_url ? (
                                        <img src={formData.photo_url} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <span>{formData.display_name?.charAt(0).toUpperCase() || 'M'}</span>
                                    )}
                                    {isUploadingPhoto && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                {formData.verification_status === 'verified' && (
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-xs" title="Terverifikasi">
                                        <BadgeCheck size={14} />
                                    </div>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">
                                        {formData.display_name || initialUser?.name || 'Pemilik Kost'}
                                    </h2>
                                    {formData.verification_status === 'verified' ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-100 shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-[#ff7a00] fill-orange-100 shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 font-bold truncate mt-0.5 tracking-wider">
                                    {formData.phone || formData.email || initialUser?.email}
                                </p>
                                <div className="mt-1.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
                                        <Sparkles className="w-3 h-3 text-orange-500" />
                                        Pemilik Kost (Mitra)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Banner Action: Data Kontak Pribadi */}
                        <button
                            type="button"
                            onClick={() => {
                                if (formData.verification_status === 'pending') {
                                    alert('Data profil Anda sedang dalam proses peninjauan verifikasi admin sehingga terkunci sementara.');
                                    return;
                                }
                                setSearchParams({ edit: 'true', step: '1' });
                            }}
                            className="w-full mt-5 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-200 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between transition-all group active:scale-[0.99] cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5 text-xs font-bold text-gray-800">
                                <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">Data Kontak Pribadi</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-extrabold text-orange-600 shrink-0 ml-2">
                                <span>{formData.verification_status === 'pending' ? 'Terkunci (Sedang Ditinjau)' : 'Lihat / Ubah'}</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </button>
                    </div>

                    {/* ── STATUS VERIFIKASI IDENTITAS (Ringkas & Proporsional) ── */}
                    {formData.verification_status === 'verified' ? (
                        <div className="bg-green-50/80 border border-green-200/80 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-300/40 text-green-600 flex items-center justify-center shrink-0 shadow-xs">
                                    <BadgeCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-green-950 uppercase tracking-tight">Akun Mitra Terverifikasi</h3>
                                    <p className="text-xs font-medium text-green-800/80 mt-0.5 leading-relaxed">Selamat! Anda sudah dapat mengelola, mempublikasikan, dan menerima transaksi sewa kost.</p>
                                </div>
                            </div>
                            <span className="shrink-0 self-end sm:self-center px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 text-[10px] font-black uppercase tracking-wider">
                                Terverifikasi ✓
                            </span>
                        </div>
                    ) : formData.verification_status === 'pending' ? (
                        <div className="bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.04] to-amber-500/[0.02] border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300/50 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                                    <Clock size={24} className="text-amber-600" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-tight">Verifikasi Sedang Ditinjau</h3>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                            Reviewing
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-amber-900/70 mt-1 leading-relaxed">
                                        Data identitas KTP Anda sedang divalidasi oleh tim admin. Estimasi waktu peninjauan maksimal 1x24 jam.
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 self-end sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-amber-200/90 text-amber-800 shadow-2xs">
                                <Lock size={13} className="text-amber-600" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Data Terkunci</span>
                            </div>
                        </div>
                    ) : formData.verification_status === 'banned' ? (
                        <div className="bg-red-50 border border-red-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-red-900 uppercase tracking-tight">Akses Kemitraan Diblokir Permanen</h3>
                                    <p className="text-xs font-medium text-red-700 mt-1">Alasan: {formData.verification_notes || 'Melanggar ketentuan layanan atau penolakan berulang kali.'}</p>
                                </div>
                            </div>
                        </div>
                    ) : formData.verification_status === 'rejected' ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-rose-900 uppercase tracking-tight">Verifikasi Ditolak</h3>
                                    <p className="text-xs font-medium text-rose-700 mt-0.5">Alasan: {formData.verification_notes || 'Data tidak sesuai atau berkas buram.'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSearchParams({ edit: 'true', step: '1' })} className="shrink-0 self-end sm:self-center px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-rose-200 cursor-pointer">
                                Perbaiki Data
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-tight">Identitas Belum Diverifikasi</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">Verifikasi identitas diperlukan untuk mempublikasikan kost dan menerima transaksi.</p>
                                </div>
                            </div>
                            <button onClick={() => setSearchParams({ edit: 'true', step: '1' })} className="shrink-0 self-end sm:self-center px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 cursor-pointer">
                                Lengkapi & Verifikasi
                            </button>
                        </div>
                    )}

                    {/* ── GROUP 1: KEUANGAN & SALDO KOST (Cek Dompet & Tarik Dana) ── */}
                    <div className="mb-2">
                        <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 px-1">
                            KEUANGAN & SALDO KOST
                        </h3>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-50 overflow-hidden">
                            {/* Tarik Saldo Kost (Cek Dompet) */}
                            <button
                                type="button"
                                onClick={() => onNavigateMenu ? onNavigateMenu('wallet') : null}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                            Tarik Saldo Kost (Cek Dompet)
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                            Pencairan pendapatan sewa, penarikan dana & saldo aktif
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-black border border-orange-200 shadow-xs">
                                        {availableBalance !== undefined ? FORMAT_CURRENCY(availableBalance) : 'Buka Dompet'}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>

                            {/* Rekening Penarikan Bank */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (onEditBank) {
                                        onEditBank();
                                    } else if (onNavigateMenu) {
                                        onNavigateMenu('wallet');
                                    }
                                }}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Landmark className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                            Rekening Penarikan
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                            Atur nomor rekening bank tujuan pencairan saldo sewa kost
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ── GROUP 2: INFORMASI PRIBADI & DOKUMEN ── */}
                    <div className="mb-2">
                        <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 px-1">
                            INFORMASI PRIBADI & DOKUMEN
                        </h3>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-50 overflow-hidden">
                            {/* Data Profil & Domisili */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (formData.verification_status === 'pending') {
                                        alert('Data profil Anda sedang dalam proses peninjauan verifikasi admin sehingga terkunci sementara.');
                                        return;
                                    }
                                    setSearchParams({ edit: 'true', step: '1' });
                                }}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                            Data Profil & Domisili
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                            Nama, nomor WhatsApp, tempat lahir & alamat domisili
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {formData.verification_status === 'pending' ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                            Terkunci
                                        </span>
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                    )}
                                </div>
                            </button>

                            {/* Verifikasi Identitas (KTP) */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (formData.verification_status === 'pending') {
                                        alert('Data KTP Anda sedang dalam proses peninjauan verifikasi admin (maks 1x24 jam).');
                                        return;
                                    }
                                    if (formData.verification_status === 'verified') {
                                        alert('Akun Anda sudah terverifikasi resmi. Data KTP tidak dapat diubah.');
                                        return;
                                    }
                                    setSearchParams({ edit: 'true', step: '2' });
                                }}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                            Verifikasi Identitas (KTP)
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                            Dokumen identitas resmi KTP pemilik kost & status validasi
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                        formData.verification_status === 'verified'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : formData.verification_status === 'pending'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : formData.verification_status === 'rejected'
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                        {formData.verification_status === 'verified'
                                            ? 'Terverifikasi ✓'
                                            : formData.verification_status === 'pending'
                                            ? 'Sedang Ditinjau'
                                            : formData.verification_status === 'rejected'
                                            ? 'Perlu Revisi'
                                            : 'Belum Verifikasi'}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ── GROUP 3: PROGRAM & BANTUAN KEMITRAAN ── */}
                    <div className="mb-2">
                        <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 px-1">
                            PROGRAM & BANTUAN KEMITRAAN
                        </h3>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-50 overflow-hidden">
                            {/* Solusi KostManager Auto-Pilot */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (hasActiveKmRequest) {
                                        navigate('/dashboard-mitra/profile/km-progress');
                                    } else {
                                        navigate('/kostmanager');
                                    }
                                }}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                            Program KostManager Auto-Pilot
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                            {subscriptionStatus === 'kostmanager'
                                                ? 'Mitra KostManager aktif • Properti dikelola otomatis'
                                                : hasActiveKmRequest
                                                ? 'Pengajuan aktif • Pantau progres verifikasi & survei'
                                                : 'Solusi operasional kost terima beres tanpa repot'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {subscriptionStatus === 'kostmanager' ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
                                            Autopilot 👑
                                        </span>
                                    ) : hasActiveKmRequest ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-200">
                                            Diproses
                                        </span>
                                    ) : null}
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>

                            {/* Pusat Bantuan 24/7 */}
                            <button
                                type="button"
                                onClick={() => window.open('https://wa.me/6282291584984?text=Halo%20Admin%20RuangSinggah,%20saya%20mitra%20pemilik%20kost%20butuh%20bantuan', '_blank')}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                            Pusat Bantuan 24/7
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                            Hubungi CS WhatsApp & tim operasional RuangSinggah
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-200">
                                        Online
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>

                            {/* Ketentuan Layanan Kemitraan */}
                            <button
                                type="button"
                                onClick={() => navigate('/terms')}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-orange-50/40 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                            Ketentuan Layanan Kemitraan
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                            Syarat, ketentuan & panduan hukum pemilik kost
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Tombol Logout */}
                    {onLogout && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full py-4 px-6 bg-white hover:bg-rose-50/80 border border-gray-200 hover:border-rose-200 text-gray-700 hover:text-rose-600 rounded-3xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
                            >
                                <LogOut size={16} /> Keluar dari Akun Mitra
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Ruang Pemantauan Progress */}
            {showKmProgressModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5 md:p-8 border border-slate-100 shadow-2xl relative text-left flex flex-col">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Progress Kostmanager</h3>
                            </div>
                            <button 
                                onClick={() => { setShowKmProgressModal(false); navigate('/dashboard-mitra/profile'); }}
                                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
                            {kmRequests.length === 0 ? (
                                <div className="text-center py-10 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center mx-auto text-3xl border border-gray-100">
                                        📭
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 uppercase text-sm">Belum Ada Pengajuan</h4>
                                        <p className="text-xs text-gray-400 font-medium mt-1">Anda belum pernah mengajukan program KostManager.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowKmProgressModal(false);
                                            if (formData.verification_status !== 'verified') {
                                                alert('Syarat Mendaftar KostManager: Anda harus menyelesaikan verifikasi identitas terlebih dahulu. Silakan lengkapi data dan dokumen identitas pada formulir berikut.');
                                                setSearchParams({ edit: 'true', step: '2' });
                                                return;
                                            }
                                            navigate('/kostmanager');
                                        }}
                                        className="px-6 py-3 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors"
                                    >
                                        Gabung KostManager Sekarang
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {kmRequests.map((req) => {
                                        const stepIndex = getKmStepIndex(req.status);
                                        const steps = [
                                            { label: 'Diajukan', desc: 'Pendaftaran diterima' },
                                            { label: 'Verifikasi', desc: 'Ditinjau oleh admin' },
                                            { label: 'Penugasan Agen', desc: req.agent_name ? `Agen: ${req.agent_name}` : 'Mencari agen survey' },
                                            { label: 'Pendataan Lapangan', desc: req.status === 'SURVEYING' ? 'Proses pendataan oleh agen' : 'Menunggu survey pendataan' },
                                            { label: 'Selesai', desc: 'Kost autopilot aktif' }
                                        ];
                                        return (
                                            <div key={req.id} className="p-6 sm:p-8 rounded-[2rem] border border-slate-100 bg-slate-50/40 space-y-8 shadow-sm">
                                                {/* Properti Header */}
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-slate-900 uppercase text-base tracking-tight">{req.kost_name}</h4>
                                                        <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-wider leading-relaxed truncate max-w-xs sm:max-w-md">
                                                            {req.kost_type} • {req.kost_address}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shrink-0 ${
                                                        req.status === 'COMPLETED'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-orange-50 text-orange-600 border-orange-100'
                                                    }`}>
                                                        {req.status === 'COMPLETED' ? 'Aktif' : 'Diproses'}
                                                    </span>
                                                </div>

                                                {/* Stepper UI (Modern Vertical Timeline for neat layout on all devices) */}
                                                <div className="relative pl-8 space-y-6 pt-2 pb-2">
                                                    {/* Connecting Vertical Line */}
                                                    <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-slate-100 z-0" />
                                                    {/* Active progress bar line segment */}
                                                    <div 
                                                        className="absolute left-[15px] top-6 w-[2px] bg-gradient-to-b from-orange-500 to-amber-500 z-0 transition-all duration-500" 
                                                        style={{ height: `${Math.max(0, Math.min(100, ((stepIndex - 1) / 4) * 100))}%` }}
                                                    />

                                                    {steps.map((step, idx) => {
                                                        const stepNum = idx + 1;
                                                        const isActive = stepNum <= stepIndex;
                                                        const isCurrent = stepNum === stepIndex;
                                                        
                                                        let iconEl;
                                                        if (isActive && !isCurrent) {
                                                            iconEl = (
                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            );
                                                        } else {
                                                            iconEl = <span className="font-black text-[11px]">{stepNum}</span>;
                                                        }

                                                        return (
                                                            <div key={idx} className="flex items-start gap-4 relative z-10">
                                                                {/* Step Circle */}
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                                                                    isCurrent 
                                                                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-110 ring-4 ring-orange-500/10' 
                                                                        : isActive 
                                                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/10' 
                                                                            : 'bg-white text-slate-300 border-slate-200'
                                                                }`}>
                                                                    {iconEl}
                                                                </div>
                                                                {/* Step Info */}
                                                                <div className="flex-1 min-w-0 pt-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                                                            {step.label}
                                                                        </p>
                                                                        {isCurrent && (
                                                                            <span className="flex h-2 w-2 relative">
                                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 mt-0.5 font-bold leading-normal">
                                                                        {step.desc}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfileItemRead = ({ icon, label, value, isEditing, name, onChange, isTextArea, placeholder, showWhatsappVerify, type }: any) => (
    <div className="group">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-colors">{icon}</div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none text-gray-500">{label}</p>
            </div>
        </div>
        {isEditing ? (
            isTextArea ? (
                <textarea name={name} value={value} onChange={onChange} rows={2} placeholder={placeholder} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 p-4 rounded-2xl outline-none font-bold text-sm resize-none text-gray-900 transition-colors" />
            ) : (
                <input type={type || 'text'} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 p-4 rounded-2xl outline-none font-bold text-sm text-gray-900 transition-colors" />
            )
        ) : (
            <div className="pl-11">
                <p className="text-sm font-black text-gray-900 break-words leading-relaxed">{value || <span className="text-gray-300 italic font-medium">Belum diisi</span>}</p>
            </div>
        )}
    </div>
);

export default MitraProfile;
