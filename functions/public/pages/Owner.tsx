import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Megaphone, 
  Building2, 
  ChevronLeft, 
  Sparkles, 
  TrendingUp, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Camera, 
  Smartphone, 
  Plus, 
  Layers, 
  HelpCircle, 
  ChevronDown, 
  Check, 
  Zap, 
  Eye, 
  BarChart3, 
  Users, 
  Star, 
  Lock,
  CalendarCheck,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Page } from '../types';

interface OwnerProps {
  user?: any;
}

const Owner: React.FC<OwnerProps> = ({ user }) => {
  const navigate = useNavigate();
  const [partnerType, setPartnerType] = useState<'pemasaran' | 'manajemen' | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Aksi CTA Dinamis Sesuai Status Login
  const handleCtaAction = () => {
    if (user?.role === 'owner' || user?.role === 'mitra') {
      navigate(Page.DASHBOARD_MITRA);
    } else if (user) {
      navigate(Page.DASHBOARD_MITRA);
    } else {
      navigate('/login?role=owner&mode=register');
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  };

  // =========================================================================
  // 1. LAYAR PILIHAN KEMITRAAN (DEFAULT SCREEN)
  // =========================================================================
  if (!partnerType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-gray-50 flex items-center justify-center p-4 py-12 lg:py-20">
        <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Header Pilihan */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-100/80 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-orange-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ekosistem Kemitraan Properti RuangSinggah</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              Pilih Solusi Kemitraan Anda
            </h1>
            <p className="text-gray-600 font-medium text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Optimalkan properti kost Anda bersama <span className="text-gray-900 font-bold">RuangSinggah.id</span>. Pasang iklan mandiri lewat Self-Listing gratis atau serahkan operasional penuh kepada tim Kost Manager.
            </p>
          </div>

          {/* 2 Kartu Kemitraan Utama */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 items-stretch max-w-5xl mx-auto">

            {/* KARTU 1: MITRA PEMASARAN (SELF-LISTING MANDIRI) */}
            <div
              onClick={() => setPartnerType('pemasaran')}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_10px_35px_rgb(0,0,0,0.05)] hover:shadow-[0_25px_50px_rgba(249,115,22,0.15)] border-2 border-transparent hover:border-orange-500 transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden ring-1 ring-gray-100"
            >
              {/* Decorative Background Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-200/60 to-amber-100/30 rounded-bl-[120px] -z-0 group-hover:scale-110 transition-transform duration-500"></div>

              <div className="relative z-10 flex-grow">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:-translate-y-1 transition-transform">
                    <Megaphone className="w-8 h-8" />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    ✨ 100% Gratis & Mandiri
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 tracking-tight">
                  Mitra Pemasaran
                </h2>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 font-medium">
                  Pasang iklan mandiri lewat <strong>Self-Listing</strong>. Daftarkan akun, upload foto kamar langsung dari HP, dan pantau calon penyewa lewat Dashboard Mitra.
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    { title: 'Self-Listing Cepat (< 5 Menit)', desc: 'Upload foto, detail fasilitas, & harga sewa mandiri', icon: <Zap className="w-4 h-4 text-orange-600" /> },
                    { title: '100% Bebas Biaya Listing Awal', desc: 'Tanpa biaya pendaftaran, langsung tayang di katalog', icon: <Wallet className="w-4 h-4 text-orange-600" /> },
                    { title: 'Kontrol Ketersediaan Kamar Real-Time', desc: 'Atur status kamar kosong atau terisi dalam 1-klik', icon: <CalendarCheck className="w-4 h-4 text-orange-600" /> },
                    { title: 'Jangkau Ribuan Calon Mahasiswa', desc: 'Terhubung dengan pencari kost terverifikasi', icon: <TrendingUp className="w-4 h-4 text-orange-600" /> }
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="mt-1 bg-orange-100/70 p-1.5 rounded-xl text-orange-600 shrink-0">
                        {feat.icon}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800 leading-tight">{feat.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto relative z-10 pt-4 border-t border-gray-100">
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                  <span>Pilih Mitra Pemasaran</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* KARTU 2: KOST MANAGER (AUTOPILOT MANAGEMENT) */}
            <div
              onClick={() => setPartnerType('manajemen')}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_10px_35px_rgb(0,0,0,0.05)] hover:shadow-[0_25px_50px_rgba(234,88,12,0.15)] border-2 border-transparent hover:border-orange-600 transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden ring-1 ring-gray-100"
            >
              {/* Decorative Background Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-200/60 to-rose-100/30 rounded-bl-[120px] -z-0 group-hover:scale-110 transition-transform duration-500"></div>

              <div className="relative z-10 flex-grow">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:-translate-y-1 transition-transform">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <span className="bg-orange-50 text-orange-700 border border-orange-200 font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    🏢 Autopilot Management
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 tracking-tight">
                  Kost Manager
                </h2>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 font-medium">
                  Terima beres! Percayakan operasional harian, pencatatan penghuni, penagihan sewa otomatis, hingga pemasaran prioritas kepada ahlinya.
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    { title: 'Manajemen Operasional & Kamar Terpadu', desc: 'Data penghuni, kamar, dan inventaris terkelola rapi', icon: <ShieldCheck className="w-4 h-4 text-orange-600" /> },
                    { title: 'Penagihan Sewa Bulanan Otomatis', desc: 'Notifikasi tagihan otomatis ke penghuni via WhatsApp', icon: <Wallet className="w-4 h-4 text-orange-600" /> },
                    { title: 'Pemasaran Prioritas Platform & Medsos', desc: 'Promosi ekstra di channel eksklusif RuangSinggah', icon: <Sparkles className="w-4 h-4 text-orange-600" /> },
                    { title: 'Laporan Okupansi & Finansial Bulanan', desc: 'Rekap transparan performa properti setiap bulan', icon: <FileText className="w-4 h-4 text-orange-600" /> }
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="mt-1 bg-orange-100/70 p-1.5 rounded-xl text-orange-600 shrink-0">
                        {feat.icon}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800 leading-tight">{feat.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto relative z-10 pt-4 border-t border-gray-100">
                <button className="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 active:scale-98 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2">
                  <span>Pilih Kost Manager</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LAYAR DETAIL: KOST MANAGER (AUTOPILOT)
  // =========================================================================
  if (partnerType === 'manajemen') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Back */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 text-white py-12 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10">
            <button
              onClick={() => setPartnerType(null)}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-xs sm:text-sm font-black transition-colors group bg-black/20 px-4 py-2 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Pilihan Kemitraan
            </button>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-white/20">
              <Building2 className="w-3.5 h-3.5" />
              <span>Kost Manager • Solusi Pengelolaan Autopilot</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight max-w-3xl">
              Serahkan Manajemen Kost Anda Pada Ahlinya
            </h1>
            <p className="text-orange-100 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-8">
              Bebaskan waktu Anda dari rutinitas penagihan sewa, pendataan penghuni, dan keluhan teknis. Nikmati passive income dengan sistem manajemen transparan.
            </p>
            <button
              onClick={() => navigate(Page.KOSTMANAGER)}
              className="bg-white text-orange-700 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-orange-50 transition-all shadow-xl active:scale-95 inline-flex items-center gap-2"
            >
              <span>Pelajari Portal Kost Manager Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. LAYAR DETAIL: MITRA PEMASARAN (SELF-LISTING MANDIRI MODERN)
  // =========================================================================
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white pt-8 pb-16 lg:pt-16 lg:pb-24 relative overflow-hidden">
        {/* Ornamen Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back Button */}
          <button
            onClick={() => setPartnerType(null)}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 text-xs sm:text-sm font-black transition-colors group bg-black/15 hover:bg-black/25 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Pilihan Kemitraan</span>
          </button>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Kiri: Value & CTA */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/25 px-4 py-2 rounded-full text-xs font-black mb-6 animate-in fade-in duration-500">
                <ShieldCheck className="w-4 h-4" />
                <span>Pilihan Tepat: Mitra Pemasaran (Self-Listing Mandiri)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.15] tracking-tight">
                Pasang Iklan Kost Mandiri, Cepat & 100% Bebas Biaya
              </h1>

              <p className="text-orange-100 text-sm sm:text-base md:text-lg mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Jangkau ribuan mahasiswa potensial di sekitar kampus. Daftarkan properti Anda dalam hitungan menit, kelola ketersediaan kamar secara mandiri melalui <strong>Dashboard Mitra</strong>, dan pantau booking penyewa secara real-time.
              </p>

              {/* Tombol CTA Pintar */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={handleCtaAction}
                  className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-orange-950/20 active:scale-95 flex items-center justify-center gap-2.5 group"
                >
                  <span>{user ? 'Buka Dashboard Mitra & Tambah Listing' : 'Daftar Akun Mitra & Mulai Pasang Iklan'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-orange-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Tanpa Biaya Listing Awal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Upload Foto WebP Cepat</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Kontrol Ketersediaan Real-Time</span>
                </div>
              </div>
            </div>

            {/* Kanan: Mockup Visual Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/25 aspect-[4/3] bg-slate-900 group">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Kamar Kost RuangSinggah"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-sm">
                      Katalog Aktif
                    </span>
                    <p className="text-sm font-black mt-2">Kost Terverifikasi RuangSinggah</p>
                    <p className="text-xs text-gray-300">Siap menerima booking & penyewa baru</p>
                  </div>
                </div>
              </div>

              {/* Floating Stat Card */}
              <div className="absolute -bottom-5 -left-5 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3.5 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Self-Listing Cepat</p>
                  <p className="text-[10px] text-gray-500 font-bold">Langsung Tayang di Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 3 LANGKAH MUDAH SELF-LISTING (HOW IT WORKS) */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-black text-xs uppercase tracking-widest block mb-2">Alur Kerja Praktis & Cepat</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              3 Langkah Mudah Memasang Iklan Kost Anda
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base mt-3">
              Kini Anda tidak perlu lagi mengisi formulir perantara yang memakan waktu. Cukup ikuti alur mandiri di bawah ini:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Buat Akun Mitra (1 Menit)',
                desc: 'Daftarkan akun Anda sebagai Pemilik Kost secara gratis menggunakan nomor WhatsApp dan Email aktif.',
                icon: <Smartphone className="w-6 h-6 text-orange-600" />,
                badge: 'Registrasi Instan'
              },
              {
                step: '02',
                title: 'Input Detail & Upload Foto (Self-Listing)',
                desc: 'Buka Dashboard Mitra untuk mengisi fasilitas kamar, aturan kost, harga sewa, dan upload foto kamar (WebP otomatis).',
                icon: <Camera className="w-6 h-6 text-orange-600" />,
                badge: 'Upload Mandiri'
              },
              {
                step: '03',
                title: 'Listing Tayang & Terima Booking',
                desc: 'Properti Anda langsung tampil di katalog pencarian RuangSinggah.id dan siap menerima booking dari ribuan calon penyewa.',
                icon: <CheckCircle className="w-6 h-6 text-orange-600" />,
                badge: 'Siap Panen Mahasiswa'
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-orange-200 group-hover:text-orange-500 transition-colors">
                    {step.step}
                  </span>
                </div>
                <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-wider w-fit mb-3">
                  {step.badge}
                </span>
                <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mt-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: FITUR UNGGULAN DASHBOARD MITRA */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-black text-xs uppercase tracking-widest block mb-2">Solusi Digital Pemilik Kost</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Kendali Penuh Properti di Tangan Anda
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base mt-3">
              Dashboard Mitra RuangSinggah dirancang dengan antarmuka yang intuitif untuk mempermudah operasional properti Anda setiap hari.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                title: 'Self-Listing Cepat & Fleksibel',
                desc: 'Tambah tipe kamar baru (kosongan/furnitur), atur harga sewa bulanan, dan perbarui fasilitas kapan saja tanpa bantuan admin.',
                icon: <Zap className="w-6 h-6 text-orange-600" />
              },
              {
                title: 'Kontrol Ketersediaan Kamar Real-Time',
                desc: 'Ubah status ketersediaan kamar kosong atau terisi dalam 1-klik agar pencari kost selalu memperoleh informasi yang akurat.',
                icon: <CalendarCheck className="w-6 h-6 text-orange-600" />
              },
              {
                title: 'Kompresi Foto Otomatis WebP',
                desc: 'Unggah foto properti berkualitas tinggi tanpa khawatir loading lambat berkat sistem konversi WebP otomatis di sisi browser.',
                icon: <Camera className="w-6 h-6 text-orange-600" />
              },
              {
                title: 'Jangkauan Mahasiswa Sekitar Kampus',
                desc: 'Listing properti Anda terhubung dengan algoritma pencarian berbasis radius kampus, memudahkan mahasiswa menemukan kost Anda.',
                icon: <TrendingUp className="w-6 h-6 text-orange-600" />
              },
              {
                title: 'Notifikasi Booking & Transaksi Masuk',
                desc: 'Dapatkan pemberitahuan langsung saat ada calon penghuni yang melakukan reservasi kamar kost Anda.',
                icon: <Wallet className="w-6 h-6 text-orange-600" />
              },
              {
                title: 'Badge Verifikasi Properti',
                desc: 'Properti yang telah terverifikasi mendapatkan kepercayaan lebih tinggi dan peluang terisi lebih cepat dari calon penyewa.',
                icon: <ShieldCheck className="w-6 h-6 text-orange-600" />
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-7 rounded-3xl border border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 group-hover:bg-orange-500 group-hover:text-white text-orange-600 flex items-center justify-center mb-6 transition-colors shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ SEPUTAR SELF-LISTING */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-orange-600 font-black text-xs uppercase tracking-widest block mb-2">Tanya Jawab</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Apakah ada biaya untuk mendaftar dan memasang listing kost?',
                a: 'Tidak ada biaya pendaftaran awal (100% Gratis). Anda dapat membuat akun mitra dan langsung memasukkan listing kost Anda ke platform RuangSinggah.id secara mandiri.'
              },
              {
                q: 'Bagaimana cara mulai mengunggah foto dan detail kamar kost saya?',
                a: 'Cukup buat akun sebagai Pemilik Kost atau login ke akun Anda. Setelah masuk ke Dashboard Mitra, klik tombol "Tambah Properti", lengkapi fasilitas, tentukan harga, dan unggah foto kamar Anda.'
              },
              {
                q: 'Apakah saya bisa mengubah harga sewa atau status kamar kosong kapan saja?',
                a: 'Tentu saja! Melalui Dashboard Mitra, Anda memiliki kendali penuh untuk memperbarui harga sewa, menambah diskon, maupun menandai kamar mana saja yang sudah terisi atau sedang kosong secara real-time.'
              },
              {
                q: 'Apa perbedaan Mitra Pemasaran dengan layanan Kost Manager?',
                a: 'Mitra Pemasaran adalah layanan Self-Listing mandiri di mana Anda mengelola kost sendiri secara gratis. Sedangkan Kost Manager adalah layanan pengelolaan penuh (Autopilot) bagi pemilik yang ingin operasional, penagihan sewa, dan keluhan penghuni ditangani sepenuhnya oleh tim profesional kami.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm transition-all">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-black text-sm sm:text-base text-gray-800 hover:text-orange-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaqIndex === idx ? 'rotate-180 text-orange-600' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-50 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: BOTTOM BANNER CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-gray-950 via-slate-900 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 tracking-tight">
            Siap Memaksimalkan Okupansi Properti Kost Anda?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ekosistem mitra RuangSinggah.id sekarang juga. Buat akun, pasang listing kamar Anda, dan sambut penghuni baru tanpa ribet.
          </p>

          <button
            onClick={handleCtaAction}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-10 py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/25 active:scale-95 transition-all inline-flex items-center justify-center gap-3 group"
          >
            <span>{user ? 'Masuk ke Dashboard Mitra' : 'Daftar Akun Mitra & Mulai Pasang Iklan'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Owner;
