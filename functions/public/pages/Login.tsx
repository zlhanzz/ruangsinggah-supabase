
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Page } from '../types';

interface LoginProps {
  onLoginSuccess?: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'PASSWORD_UPDATE';

// --- REUSABLE PASSWORD FIELD COMPONENT (DEFINED OUTSIDE TO PREVENT RE-MOUNTING/FOCUS LOSS) ---
const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  show, 
  setShow, 
  placeholder = "••••••••",
  required = true 
}: any) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{label}</label>
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
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'recovery') {
      setMode('PASSWORD_UPDATE');
      setSuccessMsg('Silakan masukkan kata sandi baru Anda.');
      
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("Recovery mode detected but no session found yet.");
        }
      };
      checkSession();
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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

      alert('Berhasil Masuk! Selamat datang kembali.');
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

    if (!formData.name || !formData.phone) {
      setErrorMsg('Mohon lengkapi Nama dan Nomor WhatsApp.');
      setLoading(false);
      return;
    }

    try {
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
            phone: formData.phone
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setErrorMsg(getErrorMessage(errData.message || 'Gagal mendaftar'));
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
        alert('Kata sandi berhasil diperbarui! Silakan login kembali.');
        await supabase.auth.signOut();
        window.history.replaceState({}, document.title, window.location.origin + Page.LOGIN);
        setMode('LOGIN');
        resetForm();
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

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Verifikasi Email Terkirim</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Link verifikasi telah dikirim ke <strong>{formData.email}</strong>.<br />
            Silakan cek kotak masuk atau folder spam Anda.
          </p>

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {mode === 'LOGIN' && 'Selamat Datang!'}
              {mode === 'REGISTER' && 'Buat Akun Baru'}
              {mode === 'FORGOT_PASSWORD' && 'Reset Kata Sandi'}
              {mode === 'PASSWORD_UPDATE' && 'Setel Sandi Baru'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {mode === 'LOGIN' && 'Masuk untuk mengelola kost favoritmu'}
              {mode === 'REGISTER' && 'Daftar & Verifikasi untuk akses penuh'}
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
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 relative">
                <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs font-bold text-green-500 text-left pr-12">{successMsg}</p>
                </div>
                {mode === 'FORGOT_PASSWORD' && (
                    <div className="mt-3">
                         {resendTimer > 0 ? (
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Kirim ulang dalam {resendTimer}s</span>
                         ) : (
                            <button 
                                type="button" 
                                onClick={() => handleForgotPassword()}
                                className="text-[10px] font-bold text-green-600 hover:underline uppercase"
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
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                    placeholder="Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                    placeholder="0812xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
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
