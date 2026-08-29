import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { verifyRentClaimToken } from '../rentBillingService';
import { Sparkles, Home, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ClaimKostProps {
  user: any;
}

const ClaimKost: React.FC<ClaimKostProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [claimData, setClaimData] = useState<any>(null);

  useEffect(() => {
    async function processClaim() {
      if (!token) {
        setStatus('error');
        setErrorMessage('Tautan klaim sewa tidak valid atau parameter token tidak ditemukan.');
        return;
      }

      const decoded = verifyRentClaimToken(token);
      if (!decoded) {
        setStatus('error');
        setErrorMessage('Token perpanjangan sewa tidak valid atau telah kedaluwarsa.');
        return;
      }

      setClaimData(decoded);

      try {
        // 1. Simpan data klaim sewa aktif ke localStorage
        localStorage.setItem('rs_active_tenant_claim', JSON.stringify({
          ...decoded,
          claimedAt: new Date().toISOString()
        }));

        // 2. Normalisasi nomor telepon
        const rawPhone = decoded.phone.replace(/[^0-9]/g, '');

        // 3. Periksa atau buat record pengguna di public.users
        let activeUserId = user?.uid || user?.id;

        if (!activeUserId) {
          // Cari user yang sudah ada berdasarkan phone
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, name, phone, email')
            .eq('phone', rawPhone)
            .maybeSingle();

          if (existingUser) {
            activeUserId = existingUser.id;
            // Simpan mock/cached session user jika belum login formal
            localStorage.setItem('rs_cached_user', JSON.stringify({
              uid: existingUser.id,
              id: existingUser.id,
              name: existingUser.name,
              phone: existingUser.phone,
              email: existingUser.email,
              role: 'user'
            }));
          } else {
            // Buat record user baru otomatis
            const newUid = crypto.randomUUID();
            const { error: insertErr } = await supabase
              .from('users')
              .insert({
                id: newUid,
                name: decoded.tenantName || 'Penghuni Kost',
                phone: rawPhone,
                role: 'user',
                created_at: new Date().toISOString()
              });

            if (!insertErr) {
              activeUserId = newUid;
              localStorage.setItem('rs_cached_user', JSON.stringify({
                uid: newUid,
                id: newUid,
                name: decoded.tenantName,
                phone: rawPhone,
                role: 'user'
              }));
            }
          }
        }

        setStatus('success');

        // Berikan jeda 1.2 detik untuk animasi UX yang memuaskan
        setTimeout(() => {
          navigate('/my-bookings/aktif', { replace: true });
        }, 1200);

      } catch (err: any) {
        console.error('Error processing rent claim:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Terjadi kesalahan saat memproses data kost Anda.');
      }
    }

    processClaim();
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-orange-100 shadow-xl shadow-orange-500/5 text-center relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {status === 'loading' && (
          <div className="space-y-6 py-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/30 animate-pulse">
              <Sparkles size={32} className="animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Menghubungkan Kost Anda...</h2>
              <p className="text-xs text-gray-500 font-medium">
                Sedang memvalidasi token dan menyiapkan akun RuangSinggah Anda.
              </p>
            </div>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center border border-emerald-200 shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Koneksi Berhasil
              </span>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Selamat Datang, {claimData?.tenantName}!</h2>
              <p className="text-xs text-gray-600 font-medium">
                Kamar <b>No. {claimData?.roomNumber}</b> di <b>{claimData?.propertyTitle}</b> telah berhasil terhubung ke akun Anda.
              </p>
              {claimData?.newPeriodStart && (
                <div className="mt-2 py-1.5 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 font-bold inline-block">
                  Masa Sewa Baru: {claimData.newPeriodStart} s/d {claimData.newPeriodEnd} ({claimData.billingPeriod || 'Bulanan'})
                </div>
              )}
            </div>
            <p className="text-[11px] text-orange-600 font-bold flex items-center justify-center gap-1">
              <span>Membuka halaman Kost Saya</span>
              <ArrowRight size={12} className="animate-pulse" />
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4 animate-fade-in">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center border border-rose-200 shadow-sm">
              <AlertCircle size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Klaim Tidak Berhasil</h2>
              <p className="text-xs text-gray-600 font-medium">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home size={14} /> Kembali ke Beranda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimKost;
