import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Mail, MapPin, MessageCircle, Send, 
  HelpCircle, Sparkles, ShieldCheck, Clock, CheckCircle2,
  ExternalLink, Headphones
} from 'lucide-react';
import { Page } from '../types';

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: 'Tanya Info Kost',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      alert('Mohon lengkapi semua kolom formulir.');
      return;
    }

    setIsSubmitting(true);

    // Format pesan WhatsApp otomatis
    const waText = encodeURIComponent(
      `*Pusat Bantuan RuangSinggah.id*\n\n` +
      `👤 *Nama:* ${formData.name}\n` +
      `📱 *No. WhatsApp:* ${formData.phone}\n` +
      `📌 *Keperluan:* ${formData.purpose}\n` +
      `💬 *Pesan:* ${formData.message}`
    );

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      window.open(`https://wa.me/6281527080656?text=${waText}`, '_blank');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 md:py-20 text-[#0b1c30]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Bar / Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate(Page.HOME);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200/80 rounded-full text-xs font-bold text-gray-700 hover:text-orange-600 hover:border-orange-200 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span>Pusat Bantuan</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Layanan CS Aktif 24/7
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-orange-600 text-xs font-black uppercase tracking-wider mb-4">
            <Headphones className="w-3.5 h-3.5" />
            <span>Pusat Bantuan & Layanan Pelanggan</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Ada yang Bisa Kami Bantu?
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            Punya pertanyaan seputar sewa kost, transaksi pembayaran, jasa survey, atau ingin bermitra dengan RuangSinggah? Tim kami siap melayani Anda.
          </p>
        </div>

        {/* Quick Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          
          {/* Card 1: WhatsApp CS 24/7 */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100/80">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-gray-900 text-base">WhatsApp CS 24/7</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 text-[10px] font-black">
                  Respon Cepat
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Konsultasi langsung dengan admin customer care via WhatsApp untuk respon instan.
              </p>
              <p className="font-bold text-emerald-700 text-sm tracking-wide">
                +62 815-2708-0656
              </p>
            </div>
            <a
              href="https://wa.me/6281527080656?text=Halo%20Tim%20Pusat%20Bantuan%20RuangSinggah%2C%20saya%20butuh%20bantuan..."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs hover:shadow active:scale-95"
            >
              <span>Chat WhatsApp Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 2: Email Resmi */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100/80">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-gray-900 text-base">Email Resmi</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 text-[10px] font-black">
                  Formal & Legal
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Pertanyaan formal kemitraan, kerjasama institusi, dan pelaporan akun.
              </p>
              <p className="font-bold text-blue-700 text-sm tracking-wide">
                bantuan@ruangsinggah.id
              </p>
            </div>
            <a
              href="mailto:bantuan@ruangsinggah.id?subject=Pertanyaan%20Pusat%20Bantuan%20RuangSinggah"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-xs hover:shadow active:scale-95"
            >
              <span>Kirim Email</span>
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 3: Kantor Operasional */}
          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 border border-orange-100/80">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-gray-900 text-base">Kantor Operasional</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-700 text-[10px] font-black">
                  Headquarters
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Pusat operasional dan verifikasi survei properti RuangSinggah.
              </p>
              <p className="font-bold text-gray-900 text-sm">
                Makassar, Sulawesi Selatan, Indonesia
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 py-3 px-4 bg-gray-50 rounded-2xl font-medium">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Senin - Sabtu: 08:00 - 20:00 WITA</span>
            </div>
          </div>

        </div>

        {/* Main Content Grid: Kirim Pesan Cepat & FAQ / Info */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Column: Info & Benefit (5 Cols) */}
            <div className="lg:col-span-5 p-8 md:p-10 bg-gradient-to-br from-[#0b1c30] to-[#152e4d] text-white flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-xs font-black uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Jaminan Layanan Kami</span>
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">
                  Bantuan Cepat, Aman & Transparan
                </h3>
                <p className="text-gray-300 text-xs leading-relaxed mb-8">
                  Kami berkomitmen menghadirkan pengalaman sewa kost yang bebas dari rasa khawatir. Tim CS kami siap mendampingi setiap tahap kebutuhan Anda.
                </p>

                <div className="space-y-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Verifikasi Real Properti</h4>
                      <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                        Seluruh properti mitra diverifikasi oleh agen lapangan resmi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Respon Chat &lt; 5 Menit</h4>
                      <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                        Layanan live chat WhatsApp beroperasi 24 jam setiap hari.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Panduan & Mediasi Sewa</h4>
                      <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                        Bantuan mediasi kendala sewa antara penghuni dan pemilik kost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Link */}
              <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">Ikuti RuangSinggah</p>
                <div className="flex items-center gap-2">
                  <a 
                    href="https://www.instagram.com/ruangsinggahid" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a 
                    href="https://www.facebook.com/profile.php?id=61572134009904" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Formulir Pesan Cepat (7 Cols) */}
            <div className="lg:col-span-7 p-8 md:p-10 bg-white">
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  Kirim Pesan atau Pertanyaan
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Isi formulir berikut dan pesan Anda akan diteruskan langsung ke WhatsApp tim bantuan kami.
                </p>
              </div>

              {submitted ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-2">Pesan Berhasil Diteruskan!</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                    Aplikasi WhatsApp Anda telah terbuka. Anda dapat melanjutkan percakapan langsung dengan customer service kami.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', phone: '', purpose: 'Tanya Info Kost', message: '' });
                    }}
                    className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Nomor WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Contoh: 081234567890"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Kategori Keperluan
                    </label>
                    <select 
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer font-medium"
                    >
                      <option value="Tanya Info Kost">🏠 Tanya Info & Sewa Kost</option>
                      <option value="Beli Database Kost">📊 Pembelian Database Kost Kampus</option>
                      <option value="Jasa Survey Kost">🔍 Layanan Jasa Survey Kost</option>
                      <option value="Daftar Jadi Mitra">🤝 Pendaftaran Mitra Pemilik Kost</option>
                      <option value="Kendala Transaksi / Pembayaran">💳 Kendala Transaksi / Pembayaran</option>
                      <option value="Keluhan Sewa / Lainnya">❓ Keluhan Sewa & Pertanyaan Lain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Pesan atau Detail Pertanyaan <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      rows={4} 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tuliskan pertanyaan atau kendala yang Anda alami secara detail..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#ff7a00] hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Menghubungkan ke WhatsApp...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Pesan ke Tim Bantuan</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
