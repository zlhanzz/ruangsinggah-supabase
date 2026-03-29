import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Video, MapPin, Calendar, Clock, ArrowRight, ShieldCheck, Wifi, Droplets, X, ChevronRight } from 'lucide-react';
import { Page } from '../types';
import PaymentGateway from '../components/PaymentGateway';
import { supabase } from '../supabase';
import { notificationService } from '../notificationService';

interface SurveyServiceProps {
  user: any;
  onPageChange: (page: Page) => void;
}

const SURVEY_PRODUCT_ID = '5ea7b4e9-6f8d-4a11-b845-8c7a726359e1';

const SurveyService: React.FC<SurveyServiceProps> = ({ user, onPageChange }) => {
  const offerSectionRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMetadata, setPaymentMetadata] = useState<any>(null);

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
      phone: normalizePhone(formData.phone),
      ownerPhone: normalizePhone(formData.ownerPhone),
      item: 'Jasa Survey Lokasi Kost',
      service_name: 'Jasa Survey Lokasi Kost',
      package_price: 70000
    };

    setPaymentMetadata(metadata);
    setShowPayment(true);
    setIsModalOpen(false); // Close form modal
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setShowSuccess(true);
    
    try {
      // 1. Save order to Supabase
      const { data: newRequest, error } = await supabase
        .from('survey_requests')
        .insert([{
          user_id: user.uid || user.id,
          kost_name: paymentMetadata.kostName,
          kost_address: paymentMetadata.kostAddress,
          owner_phone: paymentMetadata.ownerPhone,
          survey_date: paymentMetadata.surveyDate,
          survey_time: paymentMetadata.surveyTime,
          notes: `${paymentMetadata.notes}\n[Sumber Info: ${paymentMetadata.source}]`,
          status: 'PENDING_ASSIGNMENT'
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // 2. Fetch all admins and send them a real-time notification
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');
        
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await notificationService.createNotification(
            admin.id,
            'Pesanan Jasa Survey Baru',
            `Ada pesanan survey baru untuk Kost: ${paymentMetadata.kostName} dari ${paymentMetadata.name}. Segera cek dan tugaskan agent!`,
            'assignment',
            { survey_id: newRequest?.id }
          );
        }
      }
    } catch (err) {
      console.error('Failed to save survey order to database:', err);
    }

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

            {/* Kanan / Tengah: Gambar Hero */}
            <div className="order-2 relative animate-in zoom-in-95 duration-1000 delay-300 w-[90%] sm:w-4/5 lg:w-full mx-auto mt-2 sm:mt-4 lg:mt-0">
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border-2 lg:border-4 border-white aspect-[4/3] lg:aspect-square xl:aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Tim Survey Mengecek Kost"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent flex items-end justify-center pb-4 lg:pb-6">
                  <p className="text-white font-medium text-[10px] sm:text-xs lg:text-sm bg-black/40 backdrop-blur-md px-3 py-1 lg:px-4 lg:py-1.5 rounded-full border border-white/20">
                    Kami pastikan sesuai ekspektasi Anda
                  </p>
                </div>
              </div>

              {/* Ornamen pelengkap gambar melayang */}
              <div className="absolute -bottom-4 -left-4 lg:-bottom-6 lg:-left-6 bg-white p-2.5 lg:p-4 rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Video className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] lg:text-xs font-bold text-gray-900 leading-tight">Live Video Call</p>
                    <p className="text-[8px] lg:text-[10px] text-gray-500">Kondisi Real-time</p>
                  </div>
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
          <div className="grid md:grid-cols-2 gap-8 lg:gap-20 items-stretch md:items-center">

            {/* Kiri: Masalah (Pain) - Tema Orange */}
            <div className="bg-orange-50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-orange-100 order-1 md:order-1 h-full flex flex-col">
              <h3 className="font-black text-lg lg:text-xl text-orange-900 mb-4 lg:mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />
                Apa yang Sering Terjadi?
              </h3>
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

            {/* Kanan: Solusi (Gain) - Tema Biru */}
            <div className="order-2 md:order-2">
              <h2 className="text-3xl font-black text-gray-900 mb-6">
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
                  <span className="text-5xl font-black text-orange-500">Rp 70.000</span>
                  <span className="text-gray-400 line-through decoration-red-500 decoration-2">Rp 150.000</span>
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
                setIsModalOpen(true);
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
                      <span className="text-orange-600 font-black">Rp 70.000</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100 italic">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                      Anda akan diarahkan ke Payment Gateway aman kami. Segera setelah pembayaran lunas, sistem akan mengirimkan konfirmasi ke tim surveyor kami.
                    </p>
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
                    className="flex-[2] py-3.5 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
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
          amount={70000}
          orderId={`SRV-${Date.now()}`}
          productId={SURVEY_PRODUCT_ID}
          productType="survey"
          userId={user.id}
          metadata={paymentMetadata}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

    </div>
  );
};

export default SurveyService;
