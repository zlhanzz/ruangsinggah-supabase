import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, MapPin, Video, ArrowRight, ShieldCheck, Wifi, Droplets, Calendar, Clock, X, ChevronRight, Play, Pause } from 'lucide-react';
import { Page } from '../types';
import PaymentGateway from '../components/PaymentGateway';
import { supabase } from '../supabase';
import { notificationService } from '../notificationService';
import { getSurveyCatalogSettings } from '../adminService';

interface SurveyServiceProps {
  user: any;
  onPageChange: (page: Page) => void;
  validateProfile?: () => boolean;
}

const SURVEY_PRODUCT_ID = '5ea7b4e9-6f8d-4a11-b845-8c7a726359e1';
const YT_VIDEO_ID = 'J1lkBcwM6fw'; // Video demo Jasa Survey RuangSinggah

// Format angka ke format Rupiah (misal: 70000 -> "Rp 70.000")
const formatRupiah = (val: number) =>
  'Rp ' + val.toLocaleString('id-ID');

// Deteksi apakah user membuka halaman dari Instagram In-App Browser (IAB)
const isInstagramIAB = (): boolean => {
  const ua = (navigator.userAgent || '').toLowerCase();
  return ua.includes('instagram');
};

const SurveyService: React.FC<SurveyServiceProps> = ({ user, onPageChange, validateProfile }) => {
  const offerSectionRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMetadata, setPaymentMetadata] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ytReady, setYtReady] = useState(false);
  // State untuk mendeteksi Instagram IAB — diisi saat mount agar aman (SSR-safe)
  const [isIAB, setIsIAB] = useState(false);

  // Harga jasa survey — dimuat dari Supabase app_settings
  const [surveyPrice, setSurveyPrice] = useState(70000);
  const [surveyDiscountPrice, setSurveyDiscountPrice] = useState(50000);
  const [surveyDescription, setSurveyDescription] = useState('');

  // T&C state
  const [agreedToTnC, setAgreedToTnC] = useState(false);
  const [showTnCModal, setShowTnCModal] = useState(false);

  // Deteksi Instagram IAB saat komponen pertama kali mount
  useEffect(() => {
    setIsIAB(isInstagramIAB());
  }, []);

  // Load harga aktual dari database saat komponen mount
  useEffect(() => {
    getSurveyCatalogSettings().then((settings) => {
      setSurveyPrice(settings.price);
      setSurveyDiscountPrice(settings.discount_price);
      setSurveyDescription(settings.description);
    }).catch((err) => {
      console.error('Gagal load harga survey:', err);
    });
  }, []);


  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    kostName: '',
    ownerPhone: '',
    kostAddress: '',
    source: '', // 'database', 'social_media', 'other'
    surveyDate: '',
    surveyTime: '',
    notes: ''
  });

  // Load YouTube IFrame API — hanya jika BUKAN Instagram IAB
  useEffect(() => {
    if (isIAB) return; // Jangan load API di Instagram IAB — tidak akan berfungsi
    if ((window as any).YT && (window as any).YT.Player) {
      setYtReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => setYtReady(true);
    return () => { delete (window as any).onYouTubeIframeAPIReady; };
  }, [isIAB]);

  // Init player once API is ready
  useEffect(() => {
    if (!ytReady || !playerContainerRef.current) return;
    playerRef.current = new (window as any).YT.Player(playerContainerRef.current, {
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        fs: 0,
      },
      events: {
        onReady: (e: any) => { setDuration(e.target.getDuration()); },
        onStateChange: (e: any) => {
          const YT = (window as any).YT.PlayerState;
          setIsPlaying(e.data === YT.PLAYING);
        }
      }
    });
    return () => { playerRef.current?.destroy?.(); };
  }, [ytReady]);

  // Progress tracker
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration() || 1;
          setProgress((cur / dur) * 100);
        }
      }, 500);
    } else {
      clearInterval(progressIntervalRef.current);
    }
    return () => clearInterval(progressIntervalRef.current);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current || !duration) return;
    const pct = Number(e.target.value);
    const seekTo = (pct / 100) * duration;
    playerRef.current.seekTo(seekTo, true);
    setProgress(pct);
  }, [duration]);

  // Pre-fill form with user profile data when modal opens
  useEffect(() => {
    if (isModalOpen && user) {
      setFormData(prev => ({
        ...prev,
        // Only set if field is empty to prevent overwriting user input, 
        // but typically it's fine to reset it on first open
        name: user.name || user.displayName || prev.name,
        phone: user.phone ? user.phone.replace(/^(\+62|62|0)/, '') : prev.phone,
        email: user.email || prev.email
      }));
    }
  }, [isModalOpen, user]);

  const scrollToOffer = () => {
    offerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Silakan login terlebih dahulu untuk melakukan pemesanan survey.');
      return;
    }

    if (validateProfile) {
      const isValid = validateProfile();
      if (!isValid) return;
    }

    // Normalize phone numbers to include +62 if not present
    const normalizePhone = (p: string) => {
      if (!p) return '';
      let clean = p.replace(/\D/g, ''); // Ambil hanya angka
      if (clean.startsWith('0')) clean = clean.substring(1);
      if (clean.startsWith('62')) clean = clean.substring(2);
      return `+62${clean}`;
    };

    // Prepare metadata for payment and post-payment message
    const metadata = {
      ...formData,
      userName: user?.displayName || user?.name || formData.name || 'Customer',
      userEmail: user?.email || formData.email || '',
      userPhone: normalizePhone(formData.phone),
      userAddress: user?.address || formData.kostAddress || '',
      phone: normalizePhone(formData.phone),
      ownerPhone: normalizePhone(formData.ownerPhone),
      item: 'Jasa Survey Lokasi Kost',
      service_name: 'Jasa Survey Lokasi Kost',
      package_price: surveyPrice
    };

    setPaymentMetadata(metadata);
    setShowPayment(true);
    setIsModalOpen(false); // Close form modal
  };

  const handlePaymentSuccess = async (transactionId?: string) => {
    setShowPayment(false);
    setShowSuccess(true);
    
    // NOTE: Manual database insertion was removed here.
    // The survey_request is now created by the backend (createPakasirPayment) 
    // and status is updated via Webhook to prevent duplication.
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-50 relative z-10">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-50 rounded-full animate-ping opacity-20"></div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4 text-center">Pesanan Survey Berhasil!</h2>
            <p className="text-gray-500 font-medium text-center">Pembayaran Jasa Survey Anda telah kami terima dan sedang diproses. Tim kami akan segera menghubungi Anda untuk koordinasi lebih lanjut.</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 text-left">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Detail Pesanan</p>
            <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500 font-bold">Kost:</span>
                 <span className="text-gray-900 font-black">{paymentMetadata?.kostName || '-'}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500 font-bold">Jadwal:</span>
                 <span className="text-gray-900 font-black">{paymentMetadata?.surveyDate} @ {paymentMetadata?.surveyTime} WIB</span>
               </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => onPageChange(Page.MY_BOOKINGS)} 
              className="bg-orange-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Lihat Status di Kost Saya <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onPageChange(Page.HOME)} 
              className="text-gray-500 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* HERO SECTION */}
      <section className="relative pt-8 pb-8 sm:pb-16 lg:pt-32 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-orange-50/50 -z-10"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 lg:w-96 lg:h-96 bg-orange-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 lg:w-80 lg:h-80 bg-amber-200 rounded-full blur-3xl opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12 items-center">
            {/* Kiri: Teks dan CTA */}
            <div className="text-center lg:text-left order-1 pt-2 lg:pt-0">
              <div className="inline-flex items-center gap-1.5 lg:gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-[10px] sm:text-xs lg:text-sm font-bold mb-4 sm:mb-6 lg:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ShieldCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Jangan Beli Kucing Dalam Karung!</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-gray-900 tracking-tight mb-2 sm:mb-4 lg:mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                Takut Kost <span className="text-orange-500">ZONK</span> & <br className="hidden sm:block" />
                Uang DP Melayang?
              </h1>

              <p className="text-base sm:text-lg lg:text-lg text-gray-600 mb-4 sm:mb-8 lg:mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 max-w-xl mx-auto lg:mx-0">
                Foto sering menipu. Biar tim kami yang cek langsung ke lokasi, test wifi, cek air, dan video call live dengan Anda. Hemat waktu, tenaga, dan bebas rasa was-was.
              </p>

              <div className="hidden lg:flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 lg:gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                <button
                  onClick={scrollToOffer}
                  className="w-full sm:w-auto px-6 py-3.5 lg:px-8 lg:py-4 bg-orange-500 text-white rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg shadow-xl shadow-orange-200 hover:bg-orange-600 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Lihat Penawaran <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>

            {/* Kanan / Tengah: Player — Mode IAB vs Normal */}
            <div className="order-2 relative animate-in zoom-in-95 duration-1000 delay-300 w-[90%] sm:w-4/5 lg:w-full mx-auto mt-2 sm:mt-4 lg:mt-0">
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border-2 lg:border-4 border-white bg-black">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>

                  {isIAB ? (
                    /* ===== MODE FALLBACK: Instagram IAB ===== */
                    /* YouTube IFrame API tidak berfungsi di Instagram IAB.
                       Tampilkan thumbnail statis + tombol yang buka YouTube langsung. */
                    <a
                      href={`https://www.youtube.com/watch?v=${YT_VIDEO_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 w-full h-full block group"
                      aria-label="Buka video demo di YouTube"
                    >
                      {/* Thumbnail YouTube maxresdefault */}
                      <img
                        src={`https://img.youtube.com/vi/${YT_VIDEO_ID}/maxresdefault.jpg`}
                        alt="Demo Cara Kerja Jasa Survey RuangSinggah"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Gradient overlay gelap */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                      {/* Tombol Play tengah */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
                          <Play className="w-7 h-7 sm:w-9 sm:h-9 text-orange-500 ml-1" />
                        </div>
                        <span className="text-white text-xs sm:text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                          Tonton di YouTube →
                        </span>
                      </div>
                      {/* Label bawah */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                        <p className="text-white/80 text-[10px] font-medium">Demo Jasa Survey RuangSinggah</p>
                      </div>
                    </a>
                  ) : (
                    /* ===== MODE NORMAL: YouTube IFrame API ===== */
                    <>
                      {/* YT Player mounts here */}
                      <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" />

                      {/* Transparent overlay to block YouTube click-through */}
                      <div
                        className="absolute inset-0 cursor-pointer z-10"
                        onClick={togglePlay}
                      />

                      {/* Play/Pause center overlay (shows when paused) */}
                      {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl">
                            <Play className="w-7 h-7 text-orange-500 ml-1" />
                          </div>
                        </div>
                      )}

                      {/* Custom Controls Bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-3 flex flex-col gap-2 z-20">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.1}
                          value={progress}
                          onChange={handleSeek}
                          onClick={e => e.stopPropagation()}
                          className="w-full h-1 accent-orange-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={e => { e.stopPropagation(); togglePlay(); }}
                            className="text-white hover:text-orange-400 transition-colors z-30"
                          >
                            {isPlaying
                              ? <Pause className="w-5 h-5" />
                              : <Play className="w-5 h-5 ml-0.5" />}
                          </button>
                          <p className="text-white/70 text-[10px] font-medium flex-grow">
                            Demo Jasa Survey RuangSinggah
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>


            {/* Bawah: Tombol CTA Ekstra Khusus Mobile */}
            <div className="order-3 lg:hidden w-full mt-3 sm:mt-4">
              <button
                onClick={scrollToOffer}
                className="w-full px-6 py-3 sm:py-4 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-orange-200 hover:bg-orange-600 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300"
              >
                Lihat Penawaran <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN & GAIN SECTION */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* Kiri: Masalah (Pain) */}
            <div className="bg-orange-50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-orange-100 flex flex-col">
              <h2 className="text-2xl sm:text-3xl font-black text-orange-900 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                Apa yang Sering Terjadi?
              </h2>
              <div className="space-y-3 lg:space-y-4 flex-1">
                <div className="bg-white p-3 lg:p-4 rounded-lg lg:rounded-xl shadow-sm border border-orange-100 flex items-start gap-2 lg:gap-3 hover:shadow-md transition-shadow">
                  <span className="text-xl lg:text-2xl mt-0.5 lg:mt-1">😭</span>
                  <p className="text-gray-700 text-xs lg:text-sm font-medium leading-relaxed">"Udah transfer DP 500rb, pas sampe lokasi ternyata kostnya gak ada. Nomor WA diblokir."</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-start gap-3 hover:shadow-md transition-shadow">
                  <span className="text-2xl mt-1">😤</span>
                  <p className="text-gray-700 text-sm font-medium">"Di foto kamarnya luas dan bersih, aslinya sempit, lembab, dan bau apek. Zonk banget!"</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-start gap-3 hover:shadow-md transition-shadow">
                  <span className="text-2xl mt-1">😡</span>
                  <p className="text-gray-700 text-sm font-medium">"Katanya wifi kenceng, pas dicoba buat zoom meeting putus-nyambung."</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-orange-200 text-center">
                <p className="font-bold text-orange-800">Jangan sampai ini terjadi pada Anda!</p>
              </div>
            </div>

            {/* Kanan: Solusi (Gain) */}
            <div className="flex flex-col justify-start">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6">
                Kenapa Harus Lewat <span className="text-orange-600">RuangSinggah</span>?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-2xl hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Hindari Penipuan</h3>
                    <p className="text-gray-600 mt-1">Banyak modus penipuan kost fiktif minta DP duluan. Kami pastikan kostnya beneran ada dan pemiliknya valid.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Real-Time Video Call</h3>
                    <p className="text-gray-600 mt-1">Lihat kondisi kamar, kamar mandi, dan lingkungan sekitar secara langsung lewat video call. No edit-edit club.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Hemat Ongkos & Waktu</h3>
                    <p className="text-gray-600 mt-1">Daripada habis ratusan ribu buat transport survey sendiri, biar kami yang capek turun lapangan buat Anda.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* OFFER SECTION */}
      <section ref={offerSectionRef} className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-[100px] opacity-20"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Paket Survey Anti-Zonk</h2>
          <p className="text-gray-400 text-lg mb-12">Investasi kecil untuk kenyamanan tempat tinggal Anda setahun ke depan.</p>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 border-b border-white/10 pb-8">
              <div className="text-left">
                <p className="text-gray-300 text-sm uppercase tracking-widest font-bold mb-1">Harga Spesial</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-orange-500">{formatRupiah(surveyPrice)}</span>
                  <span className="text-gray-400 line-through decoration-red-500 decoration-2">{formatRupiah(surveyDiscountPrice)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">*Per satu lokasi kost</p>
              </div>
              <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Best Value
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-left mb-10">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>Live Video Call (15-30 Menit)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>Cek Kondisi Fisik Kamar</span>
              </div>
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-green-400 shrink-0" />
                <span>Speedtest WiFi di Lokasi</span>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-green-400 shrink-0" />
                <span>Cek Tekanan Air & Kebersihan</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>Wawancara Singkat Penjaga/Pemilik</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>Cek Lingkungan Sekitar (Indomaret/Warung)</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  alert('Silakan login terlebih dahulu untuk mengakses formulir survey.');
                  onPageChange(Page.LOGIN);
                  return;
                }
                // Navigasi langsung ke checkout — ProtectedRoute & validasi profil ditangani di sana
                onPageChange(Page.SURVEY_CHECKOUT);
              }}
              className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 hover:scale-[1.02] transition-all shadow-lg shadow-orange-500/30"
            >
              Ambil Promo Ini Sekarang
            </button>
            <p className="text-xs text-gray-400 mt-4">Garansi uang kembali jika tim kami tidak datang ke lokasi.</p>
          </div>
        </div>
      </section>

      {/* FORM MODAL WITH WIZARD FLOW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-300">
            {/* Header & Close */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md rounded-t-3xl p-6 border-b border-gray-100 flex items-center justify-between z-20">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase">Request Survey</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Langkah {currentStep} dari 4</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setCurrentStep(1);
                }}
                className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-100 h-1.5 w-full overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>

            <div className="p-8 sm:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* STEP 1: DATA DIRI */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-orange-50 p-4 rounded-2xl flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Data Pemesan</p>
                      <p className="text-xs text-gray-500">Beritahu kami kemana hasil survey harus dikirimkan.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="Nama Anda"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nomor WhatsApp</label>
                        <div className="flex bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all overflow-hidden group">
                           <div className="px-4 py-3 bg-gray-50 border-r border-gray-100 text-gray-400 font-black text-xs flex items-center group-focus-within:text-orange-500">+62</div>
                           <input
                            type="tel"
                            required
                            className="flex-1 px-4 py-3 outline-none text-sm font-medium"
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
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                        <input
                          type="email"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          placeholder="email@contoh.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: INFO KOST */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-orange-50 p-4 rounded-2xl flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Lokasi Kost</p>
                      <p className="text-xs text-gray-500">Bantu kami menemukan lokasi kost yang ingin disurvey.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Kost / Link Kost</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="Nama Kost atau Link Google Maps"
                        value={formData.kostName}
                        onChange={(e) => setFormData({ ...formData, kostName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">No HP Pemilik/Penjaga</label>
                        <div className="flex bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all overflow-hidden group">
                           <div className="px-4 py-3 bg-gray-50 border-r border-gray-100 text-gray-400 font-black text-xs flex items-center group-focus-within:text-orange-500">+62</div>
                           <input
                            type="tel"
                            required
                            className="flex-1 px-4 py-3 outline-none text-sm font-medium"
                            placeholder="8xxxxxxxxxx"
                            value={formData.ownerPhone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.startsWith('0')) val = val.substring(1);
                              if (val.startsWith('62')) val = val.substring(2);
                              setFormData({ ...formData, ownerPhone: val });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sumber Info</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        >
                          <option value="" disabled>Pilih Sumber Info</option>
                          <option value="database">Database Properti</option>
                          <option value="social_media">Sosial Media</option>
                          <option value="google_maps">Google Maps</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Alamat Lengkap</label>
                      <textarea
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="Alamat lengkap lokasi kost..."
                        rows={2}
                        value={formData.kostAddress}
                        onChange={(e) => setFormData({ ...formData, kostAddress: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: JADWAL */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-green-50 p-4 rounded-2xl flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Jadwal Survey</p>
                      <p className="text-xs text-gray-500">Pilih waktu yang tepat untuk melakukan video call live.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer bg-white"
                        value={formData.surveyDate}
                        onChange={(e) => setFormData({ ...formData, surveyDate: e.target.value })}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        min={new Date().toISOString().split('T')[0]} // Prevents past dates
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { label: 'Besok', offset: 1 },
                          { label: 'Lusa', offset: 2 }
                        ].map(q => {
                          const d = new Date();
                          d.setDate(d.getDate() + q.offset);
                          const dateStr = d.toISOString().split('T')[0];
                          const isActive = formData.surveyDate === dateStr;
                          return (
                            <button
                              key={q.label}
                              type="button"
                              onClick={() => setFormData({ ...formData, surveyDate: dateStr })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                isActive 
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                                  : 'bg-white text-gray-500 border-gray-100 hover:border-orange-200'
                              }`}
                            >
                              {q.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Jam (WIB)</label>
                      <input
                        type="time"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer bg-white"
                        value={formData.surveyTime}
                        onChange={(e) => setFormData({ ...formData, surveyTime: e.target.value })}
                        onClick={(e) => (e.target as any).showPicker?.()}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['09:00', '11:00', '13:30', '16:00'].map(slot => {
                          const isActive = formData.surveyTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setFormData({ ...formData, surveyTime: slot })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                isActive 
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                                  : 'bg-white text-gray-500 border-gray-100 hover:border-orange-200'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Catatan (Opsional)</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="Tolong cek kebersihan kamar mandi, dll..."
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: KONFIRMASI */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-orange-50 p-4 rounded-2xl flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Konfirmasi Pesanan</p>
                      <p className="text-xs text-gray-500">Periksa kembali detail pesanan Anda sebelum membayar.</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="flex justify-between text-xs py-1 border-b border-gray-200">
                      <span className="text-gray-400 font-bold uppercase">Layanan</span>
                      <span className="text-gray-900 font-black italic">JASA SURVEY LOKASI</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-gray-200">
                      <span className="text-gray-400 font-bold uppercase">Kost</span>
                      <span className="text-gray-900 font-bold">{formData.kostName}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-gray-200">
                      <span className="text-gray-400 font-bold uppercase">Jadwal</span>
                      <span className="text-gray-900 font-bold">{formData.surveyDate} @ {formData.surveyTime} WIB</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-900 font-black uppercase tracking-tighter">Total Bayar</span>
                      <span className="text-orange-600 font-black">{formatRupiah(surveyPrice)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100 italic">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                      Anda akan diarahkan ke Payment Gateway aman kami. Segera setelah pembayaran lunas, sistem akan mengirimkan konfirmasi ke tim surveyor kami.
                    </p>
                  </div>

                  {/* T&C CHECKBOX */}
                  <div
                    onClick={() => setAgreedToTnC(!agreedToTnC)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      agreedToTnC
                        ? 'bg-green-50 border-green-400'
                        : 'bg-gray-50 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all border-2 ${
                      agreedToTnC ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
                    }`}>
                      {agreedToTnC && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Saya telah membaca dan menyetujui{' '}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowTnCModal(true); }}
                        className="text-orange-600 font-bold underline underline-offset-2 hover:text-orange-700"
                      >
                        Syarat & Ketentuan Layanan Jasa Survey
                      </button>
                      {' '}Ruang Singgah.
                    </p>
                  </div>
                </div>
              )}

              {/* MODAL SYARAT & KETENTUAN */}
              {showTnCModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTnCModal(false)} />
                  <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-10">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Syarat & Ketentuan</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Layanan Jasa Survey Ruang Singgah</p>
                      </div>
                      <button onClick={() => setShowTnCModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="overflow-y-auto p-6 space-y-5 text-sm text-gray-700 leading-relaxed flex-1">
                      <p className="text-xs text-gray-500 italic border-l-4 border-orange-400 pl-3">
                        Dengan mencentang kotak persetujuan ini, Anda (Pengguna) menyetujui seluruh Syarat dan Ketentuan penggunaan Layanan Jasa Survey yang disediakan oleh platform Ruang Singgah.
                      </p>

                      {[
                        {
                          title: '1. Ketentuan Layanan Umum',
                          points: [
                            'Layanan Survey Ruang Singgah adalah jasa pengecekan, dokumentasi, dan penilaian properti (kost) secara langsung oleh Agen Survey yang ditugaskan oleh sistem.',
                            'Ruang Singgah bertindak sebagai pihak ketiga independen yang memberikan laporan objektif berdasarkan kondisi lapangan pada saat survey dilakukan.',
                          ],
                        },
                        {
                          title: '2. Pemesanan dan Pembayaran',
                          points: [
                            'Pemesanan layanan survey dianggap sah apabila Pengguna telah melengkapi formulir pemesanan dan melakukan pembayaran secara penuh (100%) di muka.',
                            'Setelah pembayaran berhasil, Pengguna dapat memantau status pesanan dan progres survey melalui menu dashboard Pengguna di platform Ruang Singgah.',
                          ],
                        },
                        {
                          title: '3. Penjadwalan dan Reschedule',
                          points: [
                            'Agen Survey akan menyesuaikan jadwal kunjungan dengan permintaan waktu Pengguna dan ketersediaan pemilik kost/pengelola.',
                            'Apabila jadwal yang diminta Pengguna tidak memungkinkan, Agen Survey berhak mengajukan penyesuaian jadwal (reschedule) melalui fitur di dashboard.',
                            'Pengguna dan Agen dapat berkomunikasi terkait kesepakatan jadwal melalui fitur Chat yang tersedia di platform.',
                          ],
                        },
                        {
                          title: '4. Pelaksanaan Survey dan Video Call',
                          points: [
                            'Pada waktu yang telah disepakati, Agen Survey akan hadir di lokasi properti dan wajib melakukan panggilan video (Live Video Call) dengan Pengguna untuk memperlihatkan kondisi kost secara virtual real-time.',
                            'Pengguna berhak memberikan pertanyaan atau meminta Agen untuk menyorot area tertentu selama sesi Video Call berlangsung.',
                          ],
                        },
                        {
                          title: '5. Hasil dan Dokumentasi Survey',
                          points: [
                            'Agen Survey akan melakukan dokumentasi lengkap berupa foto dan video yang diunggah ke link penyimpanan (Google Drive) yang dibuat otomatis oleh sistem Ruang Singgah.',
                            'Agen Survey akan mengisi formulir penilaian objektif berdasarkan standarisasi kelayakan Ruang Singgah beserta bukti fisik dari lapangan.',
                            'Seluruh hasil laporan, penilaian, dan dokumentasi akan dapat diakses sepenuhnya oleh Pengguna setelah Agen mengonfirmasi bahwa survey telah selesai.',
                          ],
                        },
                        {
                          title: '6. Kebijakan Pengembalian Dana (Refund Policy)',
                          points: [
                            'Refund 100% (Penuh): Berlaku apabila pesanan dibatalkan sebelum Agen Survey tiba di lokasi (misalnya: Agen tidak tersedia, kost ternyata sudah tutup/fiktif, atau pemilik kost menolak kunjungan survey secara sepihak).',
                            'Tidak Ada Refund (Hangus): Berlaku apabila survey telah selesai dilakukan, dokumen telah diunggah, dan hasil penilaian telah sesuai dengan SOP Ruang Singgah, terlepas dari apakah Pengguna pada akhirnya jadi menyewa kost tersebut atau tidak.',
                            'Refund Bersyarat (Garansi Kualitas): Pengguna berhak mengajukan pengembalian dana apabila terbukti hasil survey berada di bawah standar/tidak valid. Klaim harus disertai bukti dan akan ditinjau oleh tim Admin Ruang Singgah.',
                          ],
                        },
                        {
                          title: '7. Batasan Tanggung Jawab',
                          points: [
                            'Laporan survey adalah murni potret kondisi properti pada hari dan jam pelaksanaan survey. Ruang Singgah tidak bertanggung jawab atas perubahan kondisi, kerusakan properti, atau perubahan harga sewa yang dilakukan oleh pemilik kost setelah jadwal survey berakhir.',
                            'Ruang Singgah tidak menjamin ketersediaan kamar. Kesepakatan sewa-menyewa tetap menjadi ranah pribadi antara Pengguna dan Pemilik Kost.',
                          ],
                        },
                      ].map((section) => (
                        <div key={section.title}>
                          <p className="font-black text-gray-900 text-sm mb-2">{section.title}</p>
                          <ul className="space-y-1.5">
                            {section.points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 border-t border-gray-100 shrink-0 flex gap-3">
                      <button
                        onClick={() => setShowTnCModal(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
                      >
                        Tutup
                      </button>
                      <button
                        onClick={() => { setAgreedToTnC(true); setShowTnCModal(false); }}
                        className="flex-[2] py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all text-sm"
                      >
                        ✓ Saya Setuju
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/30 rounded-b-3xl">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 py-3.5 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    Kembali
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    onClick={() => {
                      // Basic validation per step
                      if (currentStep === 1 && (!formData.name || !formData.phone || !formData.email)) return alert('Harap isi semua data diri');
                      if (currentStep === 2 && (!formData.kostName || !formData.kostAddress || !formData.source)) return alert('Harap isi detail kost dan sumber info');
                      if (currentStep === 3 && (!formData.surveyDate || !formData.surveyTime)) return alert('Harap pilih jadwal');
                      setCurrentStep(currentStep + 1);
                    }}
                    className="flex-[2] py-3.5 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    Lanjutkan <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!agreedToTnC}
                    className={`flex-[2] py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                      agreedToTnC
                        ? 'bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Selesaikan & Bayar <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPayment && user && (
        <PaymentGateway
          amount={surveyPrice}
          orderId={`SRV-${Date.now()}`}
          productId={SURVEY_PRODUCT_ID}
          productType="survey"
          userId={user.uid || user.id}
          metadata={paymentMetadata}
          onPaymentSuccess={(transactionId) => handlePaymentSuccess(transactionId)}
          onCancel={() => setShowPayment(false)}
        />
      )}

    </div>
  );
};

export default SurveyService;
