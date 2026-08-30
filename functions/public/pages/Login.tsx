
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Page } from '../types';
import { sendWhatsAppTemplate } from '../whatsappService';

interface LoginProps {
  onLoginSuccess?: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'PASSWORD_UPDATE';

// --- REUSABLE PASSWORD FIELD COMPONENT (DEFINED OUTSIDE TO PREVENT RE-MOUNTING/FOCUS LOSS) ---
const PasswordInput = ({ 
  label, 
  rightLabel,
  value, 
  onChange, 
  show, 
  setShow, 
  placeholder = "••••••••",
  required = true 
}: any) => (
  <div>
    <div className="flex justify-between items-center mb-2">
       <label className="block text-xs font-bold text-gray-400 uppercase">{label}</label>
       {rightLabel}
    </div>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required={required}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
      >
        {show ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        )}
      </button>
    </div>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [activeRole, setActiveRole] = useState<'user' | 'owner'>(() => {
    const saved = localStorage.getItem('portal_view');
    return (saved === 'owner' || saved === 'user') ? saved : 'user';
  });
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    localStorage.setItem('portal_view', activeRole);
  }, [activeRole]);

  // WhatsApp OTP states
  const [waOtpCode, setWaOtpCode] = useState('');
  const [waOtpInput, setWaOtpInput] = useState('');
  const [isVerifyingWaOtp, setIsVerifyingWaOtp] = useState(false);
  const [waOtpVerified, setWaOtpVerified] = useState(false);
  const [waResendTimer, setWaResendTimer] = useState(0);
  const [showUpgradeOffer, setShowUpgradeOffer] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalError, setUpgradeModalError] = useState('');
  const [upgradeEmailSent, setUpgradeEmailSent] = useState(false);
  const [upgradeResendTimer, setUpgradeResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });

  const getErrorMessage = (message: string) => {
    if (message.includes('Email not confirmed')) return 'Email Anda belum diverifikasi. Silakan cek inbox/spam email Anda.';
    if (message.includes('Invalid login credentials')) return 'Email atau kata sandi salah.';
    if (message.includes('User already registered')) return 'Email sudah terdaftar. Silakan login.';
    if (message.includes('Password should be at least')) return 'Kata sandi terlalu lemah (min. 6 karakter).';
    if (message.includes('Unable to validate email')) return 'Format email tidak valid.';
    if (message.includes('Email rate limit exceeded')) return 'Terlalu banyak percobaan. Coba lagi nanti.';
    if (message.includes('Auth session missing')) return 'Sesi kedaluwarsa. Silakan minta link reset baru.';
    return `Terjadi kesalahan: ${message}`;
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', newPassword: '', confirmPassword: '', name: '', phone: '' });
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResendTimer(0);
    setReferralCode('');
    setWaOtpCode('');
    setWaOtpInput('');
    setIsVerifyingWaOtp(false);
    setWaOtpVerified(false);
    setWaResendTimer(0);
    setShowUpgradeOffer(false);
    setShowUpgradeModal(false);
    setUpgradeModalError('');
    setUpgradeEmailSent(false);
    setUpgradeResendTimer(0);
  };

  useEffect(() => {
    const mode = searchParams.get('mode');
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');
    const upgradeToOwner = searchParams.get('upgrade_to_owner');
    const upgradeSuccess = searchParams.get('upgrade_success');

    if (mode === 'recovery') {
      setMode('PASSWORD_UPDATE');
      setSuccessMsg('Silakan masukkan kata sandi baru Anda.');
      
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("Recovery mode detected but no session found yet.");
        }
      };
      checkSession();
    } else if (verified === 'true') {
      setSuccessMsg('Email berhasil diverifikasi! Silakan login dengan email dan kata sandi Anda.');
      setSearchParams({}, { replace: true });
    } else if (error === 'blocked') {
      setErrorMsg('Akun Anda telah ditangguhkan. Silakan hubungi admin untuk informasi lebih lanjut.');
      setSuccessMsg('');
      setSearchParams({}, { replace: true });
    } else if (error === 'role_mismatch') {
      setErrorMsg('Akun Anda tidak terdaftar sebagai Pemilik Kost. Silakan login sebagai Pencari Kost.');
      setSuccessMsg('');
      setSearchParams({}, { replace: true });
    } else if (
      error === 'access_denied' ||
      window.location.hash.includes('error_code=otp_expired') ||
      window.location.search.includes('error_code=otp_expired')
    ) {
      setErrorMsg('Tautan verifikasi email Anda telah kedaluwarsa atau sudah pernah digunakan. Silakan ajukan upgrade kembali.');
      setSuccessMsg('');
      setSearchParams({}, { replace: true });
      // Bersihkan hash juga agar tidak terdeteksi terus
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } else if (upgradeToOwner === 'true') {
      setMode('LOGIN');
      setActiveRole('owner');
      setSearchParams({}, { replace: true });
    } else if (upgradeSuccess === 'true') {
      setMode('LOGIN');
      setActiveRole('owner');
      setErrorMsg('');
      setSuccessMsg('✅ Akun berhasil diupgrade ke Pemilik Kost! Silakan login kembali untuk akses dashboard Mitra.');
      setSearchParams({}, { replace: true });
    } else {
      const roleParam = searchParams.get('role');
      if (roleParam === 'owner' || roleParam === 'mitra') {
        setActiveRole('owner');
      }
      if (mode === 'register' || mode === 'signup') {
        setMode('REGISTER');
      }
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0 || waResendTimer > 0 || upgradeResendTimer > 0) {
      interval = setInterval(() => {
        if (resendTimer > 0) setResendTimer((prev) => prev - 1);
        if (waResendTimer > 0) setWaResendTimer((prev) => prev - 1);
        if (upgradeResendTimer > 0) setUpgradeResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, waResendTimer, upgradeResendTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setErrorMsg(getErrorMessage(error.message));
        return;
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        setErrorMsg('Email Anda belum diverifikasi. Silakan cek inbox/spam email Anda untuk verifikasi akun.');
        return;
      }

      if (onLoginSuccess) onLoginSuccess();
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const normalizePhone = (p: string) => {
      if (!p) return '';
      let clean = p.replace(/\D/g, ''); 
      if (clean.startsWith('0')) clean = clean.substring(1);
      if (clean.startsWith('62')) clean = clean.substring(2);
      return `+62${clean}`;
    };

    const finalPhone = normalizePhone(formData.phone);

    if (!formData.name || !finalPhone) {
      setErrorMsg('Mohon lengkapi Nama dan Nomor WhatsApp.');
      setLoading(false);
      return;
    }

    // ── [SEMENTARA DINONAKTIFKAN] OTP WhatsApp untuk Pemilik Kost ──────────────
    // Dinonaktifkan karena endpoint Meta Graph API (/messages) memblokir
    // request langsung dari browser (CORS). Akan diaktifkan kembali setelah
    // dipindahkan ke Supabase Edge Function.
    //
    // if (activeRole === 'owner' && !waOtpVerified) {
    //   try {
    //     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    //     setWaOtpCode(generatedOtp);
    //     const res = await sendWhatsAppTemplate({ ... });
    //     setIsVerifyingWaOtp(true);
    //     setWaResendTimer(60);
    //   } catch (error: any) {
    //     setErrorMsg(`Gagal mengirim OTP: ${error.message}`);
    //   } finally {
    //     setLoading(false);
    //   }
    //   return;
    // }
    // ─────────────────────────────────────────────────────────────────────────

    await executeFinalRegister();

  };

  const executeFinalRegister = async () => {
    setLoading(true);
    setErrorMsg('');

    const normalizePhone = (p: string) => {
      if (!p) return '';
      let clean = p.replace(/\D/g, ''); 
      if (clean.startsWith('0')) clean = clean.substring(1);
      if (clean.startsWith('62')) clean = clean.substring(2);
      return `+62${clean}`;
    };

    const finalPhone = normalizePhone(formData.phone);

    try {
      const trimmedReferral = referralCode.trim().toUpperCase();
      const response = await fetch('https://handlecustomauthemail-hzxlewhsuq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signup',
          email: formData.email,
          password: formData.password,
          metadata: {
            full_name: formData.name,
            name: formData.name,
            phone: finalPhone,
            role: activeRole,
            referred_by: activeRole === 'owner' && trimmedReferral ? trimmedReferral : undefined
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        const rawMsg = errData.message || 'Gagal mendaftar';

        // Deteksi email sudah terdaftar saat mendaftar sebagai Pemilik Kost
        if (activeRole === 'owner' &&
            (rawMsg.includes('already been registered') || rawMsg.includes('already registered') || rawMsg.includes('User already registered'))) {
          setShowUpgradeModal(true);
          return;
        }

        setErrorMsg(getErrorMessage(rawMsg));
        return;
      }

      setVerificationSent(true);
      setResendTimer(120);
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  // ── Upgrade role: Pencari Kost → Pemilik Kost ─────────────────────────────
  const handleUpgradeToOwner = async () => {
    setLoading(true);
    setUpgradeModalError('');

    try {
      // Step 1: Pertama-tama login untuk memvalidasi password user demi keamanan
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError || !data.user) {
        setUpgradeModalError(
          loginError?.message.includes('Email not confirmed')
            ? 'Email belum diverifikasi. Cek inbox email Anda dulu.'
            : 'Kata sandi salah. Silakan periksa kembali.'
        );
        return;
      }

      // Sesi langsung kita log out dulu agar tautan konfirmasi nanti memicu log in ulang dengan token baru
      await supabase.auth.signOut();

      // Step 2: Kirim email magiclink konfirmasi upgrade ke pemilik kost
      const response = await fetch('https://handlecustomauthemail-hzxlewhsuq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'magiclink',
          email: formData.email,
          redirectTo: window.location.origin + Page.LOGIN + '?upgrade_to_owner=true'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setUpgradeModalError(errData.message || 'Gagal mengirim email konfirmasi upgrade');
        return;
      }

      setShowUpgradeModal(false);
      setUpgradeEmailSent(true);
      setUpgradeResendTimer(120);
    } catch (error: any) {
      setUpgradeModalError('Terjadi kesalahan: ' + (error.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendUpgradeEmail = async () => {
    if (upgradeResendTimer > 0) return;
    setLoading(true);
    setUpgradeModalError('');
    try {
      const response = await fetch('https://handlecustomauthemail-hzxlewhsuq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'magiclink',
          email: formData.email,
          redirectTo: window.location.origin + Page.LOGIN + '?upgrade_to_owner=true'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setErrorMsg(errData.message || 'Gagal mengirim ulang email konfirmasi upgrade');
      } else {
        setSuccessMsg('Email konfirmasi upgrade berhasil dikirim ulang.');
        setUpgradeResendTimer(120);
      }
    } catch (error: any) {
      setErrorMsg('Terjadi kesalahan: ' + (error.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const handleVerifyWaOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (waOtpInput.trim() === waOtpCode) {
      setWaOtpVerified(true);
      setIsVerifyingWaOtp(false);
      // Pemicu pendaftaran email sesungguhnya setelah OTP WA sukses
      setTimeout(() => {
        executeFinalRegister();
      }, 100);
    } else {
      setErrorMsg('Kode OTP WhatsApp yang Anda masukkan salah. Silakan periksa kembali.');
    }
  };

  const handleResendWaOtp = async () => {
    if (waResendTimer > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const normalizePhone = (p: string) => {
      if (!p) return '';
      let clean = p.replace(/\D/g, ''); 
      if (clean.startsWith('0')) clean = clean.substring(1);
      if (clean.startsWith('62')) clean = clean.substring(2);
      return `+62${clean}`;
    };

    const finalPhone = normalizePhone(formData.phone);

    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setWaOtpCode(generatedOtp);

      const res = await sendWhatsAppTemplate({
        to: finalPhone,
        templateName: 'otp_verification',
        languageCode: 'id',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: generatedOtp }
            ]
          }
        ]
      });

      if (!res.success) {
        console.warn('Gagal mengirim template otp_verification, mencoba fallback hello_world...', res.error);
        const fallbackRes = await sendWhatsAppTemplate({
          to: finalPhone,
          templateName: 'hello_world',
          languageCode: 'en_US'
        });

        if (!fallbackRes.success) {
          setErrorMsg('Gagal mengirim ulang OTP WhatsApp.');
          setLoading(false);
          return;
        }
      }

      setSuccessMsg('Kode OTP baru telah dikirim ke WhatsApp Anda.');
      setWaResendTimer(60);
    } catch (error: any) {
      setErrorMsg(`Gagal mengirim ulang OTP: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.email) {
      setErrorMsg('Mohon isi email Anda.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://handlecustomauthemail-hzxlewhsuq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recovery',
          email: formData.email
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setErrorMsg(getErrorMessage(errData.message || 'Gagal mengirim link reset'));
      } else {
        setSuccessMsg(`Link reset password telah dikirim ke ${formData.email}`);
        setResendTimer(120);
      }
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('Sesi tidak ditemukan. Link mungkin sudah kedaluwarsa atau tidak valid.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) {
        setErrorMsg(getErrorMessage(error.message));
      } else {
        await supabase.auth.signOut();
        resetForm();
        setMode('LOGIN');
        setSuccessMsg('Kata sandi berhasil diperbarui! Silakan login kembali.');
      }
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) {
        setErrorMsg(getErrorMessage(error.message));
        setLoading(false);
      }
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error.message || 'unknown'));
      setLoading(false);
    }
  };

  if (isVerifyingWaOtp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.167 1.485 4.95 1.486 5.432-.001 9.853-4.425 9.856-9.86.002-2.63-1.023-5.105-2.887-6.97-1.863-1.865-4.343-2.893-6.975-2.894-5.436 0-9.86 4.423-9.863 9.859 0 1.802.474 3.562 1.378 5.124l-.993 3.629 3.734-.974zm11.315-7.3c-.302-.15-1.786-.882-2.062-.983-.277-.1-.478-.15-.679.15-.2.3-.778.983-.954 1.184-.176.2-.352.225-.654.075-.302-.15-1.276-.47-2.43-1.499-.898-.8-1.503-1.79-1.679-2.091-.176-.3-.019-.462.131-.612.135-.135.302-.35.453-.525.151-.175.201-.3.302-.5.101-.2.05-.376-.025-.526-.075-.15-.679-1.636-.93-2.24-.244-.587-.492-.507-.679-.517-.176-.009-.377-.01-.578-.01-.2 0-.528.075-.804.376-.277.301-1.057 1.033-1.057 2.52 0 1.488 1.082 2.922 1.233 3.123.15.201 2.13 3.253 5.16 4.561.72.311 1.282.497 1.719.636.724.23 1.383.197 1.902.12.578-.086 1.786-.73 2.038-1.434.252-.703.252-1.306.176-1.433-.075-.127-.277-.202-.579-.352z"/>
            </svg>
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Verifikasi OTP WhatsApp</h2>
          <p className="text-gray-500 mb-6 leading-relaxed text-sm">
            Kami telah mengirimkan kode OTP 6-digit ke nomor WhatsApp Anda:<br />
            <strong className="text-gray-800">{formData.phone.startsWith('+62') ? formData.phone : `+62 ${formData.phone}`}</strong>
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs font-bold text-red-500 text-left">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs font-bold text-green-500 text-left">{successMsg}</p>
            </div>
          )}

          {/* Developer Sandbox Testing Helper */}
          {waOtpCode && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-left animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Mode Pengujian Sandbox</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Karena portofolio bisnis Meta Anda sedang dalam verifikasi, masukkan kode OTP pengujian berikut: <strong className="text-orange-600 font-mono text-sm">{waOtpCode}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleVerifyWaOtp} className="space-y-6">
            <div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                className="w-full text-center tracking-[1em] font-mono text-3xl bg-gray-50 border border-gray-100 rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                value={waOtpInput}
                onChange={(e) => setWaOtpInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setIsVerifyingWaOtp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || waOtpInput.length !== 6}
                className={`flex-1 bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  (loading || waOtpInput.length !== 6) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'
                }`}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Verifikasi
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            {waResendTimer > 0 ? (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Kirim ulang OTP dalam {waResendTimer} detik
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendWaOtp}
                className="text-orange-500 font-bold text-sm hover:underline"
              >
                Kirim Ulang Kode OTP via WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Verifikasi Email Terkirim</h2>
          <p className="text-gray-500 mb-2 leading-relaxed">
            Link verifikasi telah dikirim ke <strong>{formData.email}</strong>.<br />
            Silakan cek kotak masuk atau folder spam Anda.
          </p>

          <button
            onClick={() => setVerificationSent(false)}
            className="text-[10px] uppercase tracking-widest font-bold text-orange-500 hover:text-orange-600 mb-6 flex items-center gap-1 mx-auto transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Salah email? Ubah disini
          </button>

          <div className="space-y-3 mb-8">
            {resendTimer > 0 ? (
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                 Kirim ulang tersedia dalam {resendTimer} detik
               </p>
            ) : (
              <button
                onClick={() => handleRegister()}
                disabled={loading}
                className="text-orange-500 font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
              >
                Belum terima email? Kirim Ulang
              </button>
            )}
            
            <button
              onClick={() => { setVerificationSent(false); setMode('LOGIN'); resetForm(); }}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-600 transition-all"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Layar Konfirmasi Email Upgrade ──────────────────────────────────────────
  if (upgradeEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            📧
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Verifikasi Email Upgrade</h2>
          <p className="text-gray-500 mb-2 leading-relaxed text-sm">
            Link konfirmasi telah dikirim ke{' '}
            <strong className="text-gray-800">{formData.email}</strong>.
          </p>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Klik link tersebut untuk menyelesaikan upgrade akun Anda menjadi{' '}
            <span className="text-orange-500 font-bold">Pemilik Kost</span>. Cek folder spam jika tidak muncul di inbox.
          </p>
          <div className="space-y-3">
            {upgradeResendTimer > 0 ? (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Kirim ulang dalam {upgradeResendTimer} detik
              </p>
            ) : (
              <button
                onClick={handleResendUpgradeEmail}
                disabled={loading}
                className="text-orange-500 font-bold text-sm hover:underline disabled:opacity-60"
              >
                Belum terima email? Kirim Ulang
              </button>
            )}
            <button
              onClick={() => { setUpgradeEmailSent(false); resetForm(); setMode('REGISTER'); setActiveRole('owner'); }}
              className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all text-sm"
            >
              Batal & Kembali ke Form
            </button>
          </div>
        </div>
      </div>
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      {/* ── MODAL KONFIRMASI UPGRADE ROLE ───────────────────────────────────── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">

            {/* Icon + Header */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4 text-3xl">
                🏠
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Upgrade Akun</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Email <strong className="text-gray-800">{formData.email}</strong> sudah terdaftar sebagai{' '}
                <span className="text-blue-600 font-bold">Pencari Kost</span>.
              </p>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Klik <span className="font-bold text-orange-500">Ya, Upgrade Sekarang</span> untuk mengkonfirmasi menggunakan kata sandi yang Anda masukkan dan mengubah akun menjadi <span className="text-orange-600 font-bold">Pemilik Kost</span>.
              </p>
            </div>

            {/* Error di dalam modal */}
            {upgradeModalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold text-red-500">{upgradeModalError}</p>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowUpgradeModal(false); setUpgradeModalError(''); }}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpgradeToOwner}
                disabled={loading}
                className={`flex-1 bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600 active:scale-95'
                }`}
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                {loading ? 'Memproses...' : 'Ya, Upgrade Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ───────────────────────────────────────────────────────────────────── */}

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          
          {/* Segmented Tab Pemilih Peran di Atas */}
          {(mode === 'LOGIN' || mode === 'REGISTER') && (
            <div className="mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-3">Portal Akses Masuk / Daftar</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setActiveRole('user'); setErrorMsg(''); }}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    activeRole === 'user'
                      ? 'bg-white text-orange-500 shadow-md scale-[1.02]'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Pencari Kost
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveRole('owner'); setErrorMsg(''); }}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    activeRole === 'owner'
                      ? 'bg-white text-orange-500 shadow-md scale-[1.02]'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Pemilik Kost
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
              {mode === 'LOGIN' && (activeRole === 'user' ? 'Masuk Pencari Kost' : 'Masuk Pemilik Kost')}
              {mode === 'REGISTER' && (activeRole === 'user' ? 'Daftar Pencari Kost' : 'Daftar Pemilik Kost')}
              {mode === 'FORGOT_PASSWORD' && 'Reset Kata Sandi'}
              {mode === 'PASSWORD_UPDATE' && 'Setel Sandi Baru'}
            </h2>
            <p className="mt-2 text-xs text-gray-500">
              {mode === 'LOGIN' && (activeRole === 'user' ? 'Masuk dan temukan kost favoritmu' : 'Masuk untuk mengelola kost & langganan')}
              {mode === 'REGISTER' && (activeRole === 'user' ? 'Daftar & Verifikasi untuk akses penuh' : 'Daftar sebagai mitra untuk mengelola properti Anda')}
              {mode === 'FORGOT_PASSWORD' && 'Masukkan email yang terdaftar'}
              {mode === 'PASSWORD_UPDATE' && 'Masukkan kata sandi baru Anda'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs font-bold text-red-500 text-left">{errorMsg}</p>
            </div>
          )}


          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs font-bold text-green-500 text-left">{successMsg}</p>
                </div>
                {mode === 'FORGOT_PASSWORD' && (
                    <div className="pl-8">
                         {resendTimer > 0 ? (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kirim ulang tersedia dalam {resendTimer}s</span>
                         ) : (
                            <button 
                                type="button" 
                                onClick={() => handleForgotPassword()}
                                className="text-[10px] font-bold text-green-600 hover:text-green-700 hover:underline uppercase tracking-widest transition-all"
                            >
                                Kirim Ulang Sekarang
                            </button>
                         )}
                    </div>
                )}
            </div>
          )}

          <form className="space-y-4" onSubmit={
            mode === 'LOGIN' ? handleLogin :
              mode === 'REGISTER' ? handleRegister :
                mode === 'PASSWORD_UPDATE' ? handleUpdatePassword :
                  handleForgotPassword
          }>
            {mode === 'REGISTER' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium"
                    placeholder="Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nomor WhatsApp</label>
                  <div className="flex bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all overflow-hidden group">
                     <div className="px-4 py-3 bg-gray-100 border-r border-gray-200 text-gray-400 font-black text-xs flex items-center group-focus-within:text-orange-500">+62</div>
                     <input
                      type="tel"
                      required
                      className="flex-1 px-4 py-3 bg-transparent outline-none font-medium"
                      placeholder="8xxxxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.startsWith('0')) val = val.substring(1);
                        if (val.startsWith('62')) val = val.substring(2);
                        setFormData({ ...formData, phone: val });
                      }}
                    />
                  </div>
                </div>
                {activeRole === 'owner' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase">Kode Referral Agen (Opsional)</label>
                      <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">Mitra Baru</span>
                    </div>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono placeholder:font-sans uppercase"
                      placeholder="AGXXXXXX"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {(mode === 'LOGIN' || mode === 'REGISTER' || mode === 'FORGOT_PASSWORD') && (
              <div className={mode === 'REGISTER' ? 'pt-0' : 'pt-2'}>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium"
                  placeholder="nama@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            )}

            {mode === 'LOGIN' && (
              <PasswordInput 
                label="Kata Sandi" 
                rightLabel={
                  <button
                    type="button"
                    onClick={() => { setMode('FORGOT_PASSWORD'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600"
                  >
                    Lupa Sandi?
                  </button>
                }
                value={formData.password} 
                onChange={(val: string) => setFormData({...formData, password: val})}
                show={showPassword}
                setShow={setShowPassword}
              />
            )}

            {mode === 'REGISTER' && (
               <PasswordInput 
                  label="Kata Sandi" 
                  value={formData.password} 
                  onChange={(val: string) => setFormData({...formData, password: val})}
                  show={showPassword}
                  setShow={setShowPassword}
               />
            )}

            {mode === 'PASSWORD_UPDATE' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <PasswordInput 
                  label="Kata Sandi Baru" 
                  value={formData.newPassword} 
                  onChange={(val: string) => setFormData({...formData, newPassword: val})}
                  show={showNewPassword}
                  setShow={setShowNewPassword}
                />
                <PasswordInput 
                  label="Konfirmasi Kata Sandi" 
                  value={formData.confirmPassword} 
                  onChange={(val: string) => setFormData({...formData, confirmPassword: val})}
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'FORGOT_PASSWORD' && !!successMsg && resendTimer > 0)}
              className={`w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 ${(loading || (mode === 'FORGOT_PASSWORD' && !!successMsg && resendTimer > 0)) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'}`}
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {mode === 'LOGIN' && 'Masuk Sekarang'}
              {mode === 'REGISTER' && 'Daftar & Verifikasi Email'}
              {mode === 'FORGOT_PASSWORD' && 'Kirim Link Reset'}
              {mode === 'PASSWORD_UPDATE' && 'Simpan Kata Sandi'}
            </button>

            {(mode === 'FORGOT_PASSWORD' || mode === 'PASSWORD_UPDATE') && (
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); resetForm(); }}
                className="w-full text-gray-500 font-bold text-sm py-2 hover:text-gray-900"
              >
                Batal
              </button>
            )}
          </form>

          {(mode === 'LOGIN' || mode === 'REGISTER') && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white text-gray-400 font-bold">Atau lanjut dengan</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full flex items-center justify-center py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors gap-2 text-sm font-semibold text-gray-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm font-medium text-gray-500">
                  {mode === 'LOGIN' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); resetForm(); }}
                    className="text-orange-500 font-bold hover:text-orange-600 transition-colors hover:underline"
                  >
                    {mode === 'LOGIN' ? 'Daftar Sekarang' : 'Masuk Disini'}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
