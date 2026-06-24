import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
    CheckCircle2, ShieldCheck, Video, MapPin, FileText, ArrowRight, ArrowLeft,
    Briefcase, Sparkles, TrendingUp, Wallet, Zap, Play, X, Star, Users, Menu
} from 'lucide-react';
import { Page } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentGateway from '../components/PaymentGateway';
import { getKostManagerPackages, KostManagerPackage } from '../adminService';
import { FORMAT_CURRENCY } from '../constants';

interface KostManagerLandingProps {
  user?: any;
}

const KostManagerLanding: React.FC<KostManagerLandingProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');

  const [formData, setFormData] = useState({
    kostName: '',
    kostType: '',
    totalRooms: '',
    emptyRooms: '',
    address: '',
    googleMapsLink: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAgreedMoU, setHasAgreedMoU] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Billing Flow Integration
  const [showPayment, setShowPayment] = useState(() => !!urlOrderId);
  const [paymentMetadata, setPaymentMetadata] = useState<any>(null);

  const [packages, setPackages] = useState<KostManagerPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  useEffect(() => {
    async function loadPackages() {
      const data = await getKostManagerPackages();
      const activePkgs = data.filter(d => d.is_active);
      setPackages(activePkgs);
      if (activePkgs.length > 0) {
        const annualPkg = activePkgs.find(p => p.duration_months === 12);
        setSelectedPackageId(annualPkg ? annualPkg.id : activePkgs[0].id);
      }
    }
    loadPackages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenRegistration = () => {
    if (!user) {
      alert('Silakan masuk/login terlebih dahulu untuk berlangganan KostManager.');
      navigate(Page.LOGIN);
      return;
    }
    setIsModalOpen(true);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
          headers: { 'User-Agent': 'RuangSinggah.id/1.0' }
        });
        const data = await res.json();
        if (data && data.display_name) {
          setFormData(prev => ({
            ...prev,
            address: `${data.display_name}`
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            address: `GPS: ${latitude}, ${longitude}`
          }));
        }
      } catch (error) {
        setFormData(prev => ({
          ...prev,
          address: `GPS: ${latitude}, ${longitude}`
        }));
      } finally {
        setIsDetectingLocation(false);
      }
    }, (error) => {
      setIsDetectingLocation(false);
      alert('Gagal mendapatkan lokasi GPS: ' + error.message);
    });
  };

  const selectedPkg = packages.find(p => p.id === selectedPackageId);
  const packagePrice = selectedPkg ? selectedPkg.price : 100000;
  const packageDuration = selectedPkg ? selectedPkg.duration_months : 12;
  const packageLabel = selectedPkg ? selectedPkg.label : 'Tahunan';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kostName || !formData.kostType || !formData.totalRooms || !formData.emptyRooms || !formData.address) {
      alert('Mohon lengkapi seluruh formulir data kost.');
      return;
    }

    const tRooms = parseInt(formData.totalRooms) || 0;
    const eRooms = parseInt(formData.emptyRooms) || 0;

    if (eRooms > tRooms) {
      alert('Jumlah kamar kosong tidak boleh melebihi jumlah total kamar.');
      return;
    }

    const meta = {
      userName: user.name || user.displayName || 'Pemilik Kost',
      userEmail: user.email || '',
      userPhone: user.phone || '',
      kostName: formData.kostName,
      kostType: formData.kostType,
      totalRooms: tRooms,
      emptyRooms: eRooms,
      address: formData.address,
      googleMapsLink: formData.googleMapsLink || '',
      item: `Langganan KostManager - ${packageLabel}`,
      service_name: `KostManager ${packageLabel} Subscription`,
      package_price: packagePrice,
      duration_months: packageDuration,
      surveyDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Besok
      surveyTime: '10:00',
      notes: 'KostManager Onboarding'
    };

    setPaymentMetadata(meta);
    setShowPayment(true);
  };

  const isMitra = user && (user.role === 'owner' || user.role === 'mitra');

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans overflow-x-hidden font-medium">
      {/* Sidebar Drawer for Mitra Context */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm">
                  <Zap size={18} fill="currentColor" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-xs font-black text-gray-900 leading-none tracking-tight uppercase">
                    <span className="text-orange-500">RuangSinggah</span>.id
                  </p>
                  <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Mitra Dashboard</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-50">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <nav className="flex-grow p-4 space-y-1 overflow-y-auto text-left">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-3">Menu Dashboard</p>
              {[
                { label: 'Beranda / Overview', path: '/dashboard-mitra/overview' },
                { label: 'Kost Saya / Listings', path: '/dashboard-mitra/properties' },
                { label: 'Pesanan / Bookings', path: '/dashboard-mitra/bookings' },
                { label: 'Penghuni Aktif / Tenants', path: '/dashboard-mitra/tenants' },
                { label: 'Pesan / Chat', path: '/dashboard-mitra/chat' },
                { label: 'Dompet / Wallet', path: '/dashboard-mitra/wallet' },
                { label: 'Profil Saya / Profile', path: '/dashboard-mitra/profile' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    navigate(item.path);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-24 lg:pb-36 overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400 rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400 rounded-full blur-[120px] opacity-10 translate-y-1/3 -translate-x-1/3"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back & Burger Button Container */}
          <div className="mb-6 flex items-center gap-3 justify-start">
            {isMitra && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white hover:bg-slate-100 text-gray-700 hover:text-orange-500 border border-slate-200/60 shadow-sm active:scale-95 transition-all"
                title="Buka Menu Dashboard"
              >
                <Menu size={18} className="stroke-[2.5]" />
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-gray-600 hover:text-orange-500 font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-slate-200/60 shadow-sm active:scale-95"
            >
              <ArrowLeft size={14} className="stroke-[3]" />
              <span>Kembali</span>
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Kiri: Deskripsi & Keunggulan */}
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                <Zap size={14} fill="currentColor" className="text-orange-500" />
                <span>Solusi Kelola Kost Tanpa Pusing</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-gray-900">
                Capek Urus Kost Sendirian? Saatnya Properti Anda Berjalan <span className="text-orange-500">Auto-Pilot!</span>
              </h1>
              
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Lepaskan semua keribetan harian Anda. Mulai dari pembuatan foto & video promosi gratis oleh surveyor kami, pemasaran aktif di sosial media, hingga penagihan otomatis yang terjadwal. Anda tinggal santai dan terima bersih pendapatan kost langsung ke rekening.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleOpenRegistration}
                  className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  Mulai Auto-Pilot Kost Sekarang <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('pain-points-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 hover:bg-gray-50 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-gray-200 shadow-sm"
                >
                  Pelajari Masalah & Solusi
                </button>
              </div>
            </div>

            {/* Kanan: Mock Video Player & Promo Tag */}
            <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-black aspect-video flex items-center justify-center group">
                <iframe
                  src="https://www.youtube.com/embed/J1lkBcwM6fw?playsinline=1&rel=0&modestbranding=1&controls=1"
                  title="Demo KostManager RuangSinggah.id"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                />
              </div>

              {/* Promo Badge Floating */}
              <div className="absolute -bottom-6 -right-4 bg-orange-500 p-4 rounded-3xl shadow-2xl border-4 border-white text-white font-black text-center animate-bounce animate-duration-1000" style={{ animationDuration: '4s' }}>
                <p className="text-[10px] uppercase tracking-wider opacity-90">Layanan Terbaik</p>
                <p className="text-base">100% Otomatis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section - EMPATHY BUILDING */}
      <section id="pain-points-section" className="py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-600 font-bold text-xs uppercase tracking-widest font-sans">Realita Pemilik Kost</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2 font-sans">
              Apakah Anda Sering Pusing Mengurusi Hal Ini?
            </h2>
            <p className="text-gray-500 mt-4 text-sm sm:text-base font-medium">
              Mengelola kost sendiri sering kali terdengar mudah di awal, hingga berbagai keribetan harian ini mulai menyita waktu istirahat dan ketenangan pikiran Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Lupa Tanggal Tagihan */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">📆</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Lupa Tanggal Jatuh Tempo</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Punya banyak kamar berarti punya tanggal tagihan berbeda-beda sesuai tanggal masuk penghuni. Sering kali luput atau terlambat menagih karena terlalu banyak jadwal yang harus diingat.
              </p>
            </div>

            {/* Iklan Sepi & Survey Visual */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">📸</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Foto Iklan Kost Buram & Gelap</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Kamar kost kosong berbulan-bulan hanya karena calon penyewa tidak tertarik melihat foto dan video seadanya yang diambil dengan ponsel biasa secara terburu-buru.
              </p>
            </div>

            {/* Sungkan Menagih */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">😤</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Sungkan Menagih Uang Sewa</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Merasa tidak enak hati, canggung, atau lelah harus terus-menerus mengirim chat WhatsApp pengingat kepada penghuni kost yang sering menunda-nunda pembayaran sewa bulanan.
              </p>
            </div>

            {/* Rekap Manual */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">📊</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Pembukuan yang Selalu Selisih</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Mencatat pengeluaran listrik, kebersihan, air, dan uang masuk di buku tulis manual yang rentan hilang atau di file Excel yang rumit dan melelahkan untuk diperbarui.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-600 font-bold text-xs uppercase tracking-widest font-sans">Jawaban Terbaik</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2 font-sans">
              Bagaimana KostManager Menjadi Jawaban Anda?
            </h2>
            <p className="text-gray-500 mt-4 text-sm sm:text-base font-medium font-sans">
              Kami menggabungkan jasa survey visual profesional secara langsung dengan sistem otomatisasi platform untuk membebaskan Anda dari stres kelola kost.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Jasa Survey Visual Premium */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Video size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Foto & Video Premium Gratis</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Tim surveyor kami datang langsung ke kost Anda untuk memotret dan merekam video promosi estetik secara **gratis**. Iklan kost Anda seketika terlihat profesional dan bernilai tinggi.
              </p>
            </div>

            {/* 2. Penagihan Sewa Otomatis & Terjadwal */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Jadwal Tagihan yang Diingat Sistem</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Sistem pintar otomatis melacak tanggal masuk setiap penghuni dan mengirimkan tagihan sewa bulanan tepat waktu. Anda tidak perlu lagi repot mengingat tanggal tagihan satu per satu.
              </p>
            </div>

            {/* 3. Pemasaran Sosmed Prioritas */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Pemasaran Sosmed RuangSinggah</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Konten visual kost dari surveyor kami langsung diunggah ke website utama dan dipromosikan di TikTok serta Instagram kami agar cepat mendapatkan calon penyewa baru.
              </p>
            </div>

            {/* 4. Laporan Keuangan Live */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Laporan Live Tanpa Rekap Manual</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Pantau total pendapatan kotor, status pembayaran lunas, dan laba bersih kost Anda secara live dari dashboard pemilik. Transparan, rapi, dan 100% akurat.
              </p>
            </div>

            {/* 5. Integrasi Data Kamar & Penghuni */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Data Penyewa & Kamar Padu</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Semua data identitas penghuni (KTP, kontak) dan nomor kamar yang ditempati sinkron secara otomatis. Anda selalu tahu persis siapa penghuni kamar nomor sekian secara akurat.
              </p>
            </div>

            {/* 6. Reservasi Instan & Booking Online */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Sewa Instan Online 24/7</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Calon penyewa baru dapat memilih kamar kosong, menyerahkan berkas administrasi, dan menyewa kost secara online langsung dari website kami tanpa perlu Anda dampingi ke lokasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Offer Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 shadow-xl relative">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow">
              Investasi Terbaik Anda
            </div>
            
            <h3 className="text-2xl font-black mt-2 text-gray-900 font-sans">Paket KostManager</h3>

            {packages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {packages.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPackageId(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedPackageId === p.id 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                        : 'bg-slate-50 hover:bg-slate-100 text-gray-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-baseline justify-center gap-1 my-6 font-sans">
              <span className="text-4xl sm:text-5xl font-black text-orange-500">{FORMAT_CURRENCY(packagePrice)}</span>
              <span className="text-gray-400 text-xs font-bold font-sans">/ {packageDuration === 12 ? 'tahun' : `${packageDuration} bulan`}</span>
            </div>

            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed font-sans">
              Biaya super hemat untuk membebaskan Anda dari segala keribetan mengelola kost harian. Nilai yang sangat kecil demi ketenangan pikiran (*peace of mind*).
            </p>

            <ul className="space-y-4 text-left text-xs font-medium text-gray-600 mb-8 font-sans">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Kunjungan Agent Survey langsung ke Kost</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Foto & Video Promosi Kost Profesional</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Posting ke Instagram/TikTok RuangSinggah</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Pencatatan Hunian & Kamar Terintegrasi</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Laporan Keuangan Otomatis & Transparan</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Keputusan Pemasaran & Penagihan Otomatis</span>
              </li>
            </ul>

            <button
              onClick={handleOpenRegistration}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              Langganan KostManager Sekarang
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Back Button */}
      <div className="py-12 bg-white flex justify-center border-t border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-gray-700 hover:text-orange-500 font-black text-sm uppercase tracking-widest transition-all duration-300 border border-gray-200 shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} className="stroke-[3]" />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>

      {/* Modal Formulir Pendaftaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>

          <div className="bg-white border border-gray-200 text-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-black leading-tight text-gray-900">Langganan KostManager</h3>
                <p className="text-xs text-gray-500 mt-1 font-bold">Lengkapi data properti kost Anda</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-rose-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-white">
              {!hasAgreedMoU ? (
                /* MoU */
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 border border-orange-200">
                      <FileText size={22} />
                    </div>
                    <h4 className="text-lg font-bold">Syarat & Ketentuan KostManager</h4>
                    <p className="text-gray-500 text-xs mt-1 font-semibold">Harap baca lingkup kerja sama premium berikut sebelum mendaftar.</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 max-h-60 overflow-y-auto text-xs space-y-4 text-gray-600 font-medium">
                    <p><strong>1. Biaya Berlangganan:</strong> Berlangganan KostManager dikenakan biaya sesuai paket yang dipilih yaitu {FORMAT_CURRENCY(packagePrice)} per {packageDuration === 12 ? 'tahun' : `${packageDuration} bulan`} untuk setiap properti kost yang didaftarkan.</p>
                    <p><strong>2. Kunjungan Surveyor:</strong> Setelah pembayaran/pendaftaran diajukan, tim surveyor dari RuangSinggah.id akan menjadwalkan survey lokasi untuk dokumentasi visual profesional.</p>
                    <p><strong>3. Media & Pemasaran:</strong> Seluruh hak cipta dokumentasi foto/video menjadi hak milik RuangSinggah.id dan akan dipublikasikan ke channel promosi kami.</p>
                    <p><strong>4. Penagihan Otomatis:</strong> Tagihan sewa bulanan penghuni diproses secara otomatis melalui payment gateway RuangSinggah.id dan dicairkan berkala ke dompet pemilik.</p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-200">
                    <input
                      type="checkbox"
                      id="agree-cb-landing"
                      className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300 cursor-pointer bg-white"
                    />
                    <label htmlFor="agree-cb-landing" className="text-xs text-gray-600 font-bold cursor-pointer select-none flex-1 leading-relaxed">
                      Saya menyatakan setuju dengan seluruh Ketentuan Berlangganan program KostManager dan bersedia dikunjungi surveyor.
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-full sm:w-auto px-6 py-3 text-gray-500 hover:text-gray-900 text-sm font-bold transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      className="w-full sm:flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/20"
                      onClick={(e) => {
                        e.preventDefault();
                        const cb = document.getElementById('agree-cb-landing') as HTMLInputElement;
                        if (!cb || !cb.checked) {
                          alert("Mohon centang persetujuan terlebih dahulu.");
                          return;
                        }
                        setHasAgreedMoU(true);
                      }}
                    >
                      Setuju & Lanjut
                    </button>
                  </div>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Nama Kost</label>
                      <input
                        type="text"
                        name="kostName"
                        required
                        value={formData.kostName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-orange-500 outline-none text-sm font-medium"
                        placeholder="Kost Orange Premium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Jenis Kost</label>
                      <select
                        name="kostType"
                        required
                        value={formData.kostType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-orange-500 outline-none text-sm appearance-none cursor-pointer font-medium"
                      >
                        <option value="" disabled>Pilih Jenis Kost</option>
                        <option value="Putra">Putra</option>
                        <option value="Putri">Putri</option>
                        <option value="Campur Biasa">Campur Biasa</option>
                        <option value="Campur/Pasutri">Campur/Pasutri</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Jumlah Total Kamar</label>
                      <input
                        type="number"
                        name="totalRooms"
                        min="1"
                        required
                        value={formData.totalRooms}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-orange-500 outline-none text-sm font-medium"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Jumlah Kamar Kosong</label>
                      <input
                        type="number"
                        name="emptyRooms"
                        min="0"
                        required
                        value={formData.emptyRooms}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-orange-500 outline-none text-sm font-medium"
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Link Google Maps (Opsional)</label>
                    <input
                      type="url"
                      name="googleMapsLink"
                      value={formData.googleMapsLink}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-orange-500 outline-none text-sm font-medium animate-all"
                      placeholder="https://maps.app.goo.gl/... atau https://google.com/maps/..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-gray-500">Alamat Lengkap Kost</label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isDetectingLocation}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        <MapPin size={12} className="stroke-[2.5]" />
                        <span>{isDetectingLocation ? 'Mencari GPS...' : 'Ambil Lokasi GPS'}</span>
                      </button>
                    </div>
                    <textarea
                      name="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-orange-500 outline-none text-sm resize-none font-medium"
                      placeholder="Masukkan alamat lokasi kost lengkap..."
                    ></textarea>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-white sticky bottom-0">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setHasAgreedMoU(false)}
                      className="px-6 py-3 text-gray-500 hover:text-gray-900 text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      Lanjut Pembayaran
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPayment && user && (
        <PaymentGateway
          amount={packagePrice}
          orderId={`KM-${Date.now()}`}
          productId="5ea7b4e9-6f8d-4a11-b845-8c7a726359e2"
          productType="kostmanager"
          userId={user.uid || user.id}
          metadata={paymentMetadata}
          onPaymentSuccess={() => {
            setShowPayment(false);
            setIsModalOpen(false);
            setIsSuccess(true);
            setSearchParams({});
            alert('Pembayaran sukses! Langganan KostManager Anda aktif dan penugasan survey telah dibuat otomatis.');
            navigate(Page.MY_BOOKINGS);
          }}
          onCancel={() => {
            setShowPayment(false);
            setSearchParams({});
          }}
        />
      )}
    </div>
  );
};

export default KostManagerLanding;
