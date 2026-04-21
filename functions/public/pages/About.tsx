
import React, { useState } from 'react';

const About: React.FC = () => {
  const [activeValue, setActiveValue] = useState(0);

  const coreValues = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      ),
      title: 'Integritas Data',
      desc: 'Setiap informasi kost yang ditampilkan telah melalui proses verifikasi lapangan oleh tim kami. Kami tidak mentolerir data fiktif atau menyesatkan.',
      color: 'orange'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      ),
      title: 'Kepercayaan',
      desc: 'Kami membangun ekosistem saling percaya antara pemilik kost, penghuni, dan platform. Transparansi menjadi fondasi setiap interaksi.',
      color: 'blue'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      ),
      title: 'Inovasi Teknologi',
      desc: 'Memanfaatkan AI, WhatsApp API, dan sistem verifikasi otomatis untuk menghadirkan pengalaman pencarian kost yang modern dan efisien.',
      color: 'purple'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
      ),
      title: 'Keberpihakan pada Mahasiswa',
      desc: 'Platform ini lahir dari pengalaman nyata mahasiswa. Setiap fitur dirancang untuk melindungi dan mempermudah pencarian hunian.',
      color: 'rose'
    }
  ];

  const milestones = [
    { year: '2024', month: 'Nov', title: 'Riset & Ideasi', desc: 'Melakukan riset mendalam terhadap permasalahan kost mahasiswa di Makassar. Menemukan gap besar antara iklan dan realita.' },
    { year: '2025', month: 'Feb', title: 'Validasi Pasar', desc: 'Memulai verifikasi lapangan pertama. Mengunjungi 100+ kost di sekitar kampus-kampus utama Makassar.' },
    { year: '2025', month: 'Agt', title: 'Badan Hukum Resmi', desc: 'PT Ruang Singgah Nusantara resmi terdaftar sebagai badan hukum (PT Perorangan) pada 9 Agustus 2025.' },
    { year: '2025', month: 'Okt', title: 'Peluncuran Platform', desc: 'RuangSinggah.id versi beta diluncurkan dengan fitur pencarian kost terverifikasi dan database kost kampus.' },
    { year: '2026', month: 'Jan', title: 'Ekspansi Layanan', desc: 'Meluncurkan layanan Jasa Survey Kost, KostManager untuk mitra, dan integrasi pembayaran digital.' },
    { year: '2026', month: 'Mar', title: 'Pertumbuhan Pesat', desc: 'Memperluas jaringan mitra kost dan agen survey. Meluncurkan fitur AI-powered chat untuk konsultasi pencarian kost.' },
  ];

  const teamMembers = [
    { name: 'Founder & CEO', role: 'Visionary & Business Strategy', initial: 'F', color: 'bg-orange-500' },
    { name: 'CTO', role: 'Technology & Product Development', initial: 'C', color: 'bg-gray-900' },
    { name: 'Head of Operations', role: 'Survey & Field Verification', initial: 'H', color: 'bg-blue-600' },
    { name: 'Lead Designer', role: 'UI/UX & Brand Identity', initial: 'L', color: 'bg-purple-600' },
  ];

  const services = [
    {
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>),
      title: 'Pencarian Kost Terverifikasi',
      desc: 'Temukan kost yang sudah diverifikasi langsung oleh tim kami. Data akurat, foto asli, fasilitas terkonfirmasi.',
      tag: 'Gratis'
    },
    {
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>),
      title: 'Database Kost Kampus',
      desc: 'Akses database lengkap berisi ratusan data kost terverifikasi di sekitar kampus-kampus utama.',
      tag: 'Rp 50.000'
    },
    {
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>),
      title: 'Jasa Survey Lokasi',
      desc: 'Tim agen kami datang langsung ke lokasi kost, melakukan pengecekan, video call, dan memberikan laporan detail.',
      tag: 'Rp 70.000'
    },
    {
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>),
      title: 'KostManager (Mitra)',
      desc: 'Sistem manajemen hunian terintegrasi: pencatatan kamar, manajemen penghuni, tagihan otomatis, dan pemasaran aktif.',
      tag: 'Komisi 5%'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* === HERO SECTION === */}
      <section className="relative bg-gray-900 pt-28 pb-20 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500 rounded-full blur-[150px] opacity-15"></div>
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-400 rounded-full blur-[120px] opacity-10"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-orange-300 px-4 py-2 rounded-full text-xs font-bold mb-8 border border-white/10 backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Company Profile
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                Membangun <br/>
                <span className="text-orange-500">Kepercayaan</span> di <br/>
                Setiap Hunian.
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed max-w-xl mb-10">
                RuangSinggah.id adalah platform pemasaran kost berbasis kepercayaan dan verifikasi lapangan. Kami hadir untuk menghubungkan mahasiswa dengan hunian terbaik.
              </p>


            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-[3rem] -rotate-3 blur-sm"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] p-10 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-orange-500 font-extrabold text-2xl">RuangSinggah</span>
                  <span className="text-white font-bold text-2xl">.id</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Badan Hukum', value: 'PT Ruang Singgah Nusantara' },
                    { label: 'Jenis', value: 'PT Perorangan' },
                    { label: 'Terdaftar', value: '9 Agustus 2025' },
                    { label: 'Domisili', value: 'Kota Makassar, Sulawesi Selatan' },
                    { label: 'Website', value: 'ruangsinggah.id' },
                    { label: 'Industri', value: 'PropTech / Property Technology' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-bold text-white text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === COMPANY LEGAL INFO (Mobile - shown below hero) === */}
      <section className="lg:hidden bg-gray-900 pb-12 px-4">
        <div className="bg-gray-800 rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Badan Hukum', value: 'PT Ruang Singgah Nusantara' },
              { label: 'Terdaftar', value: '9 Agustus 2025' },
              { label: 'Domisili', value: 'Makassar, Sul-Sel' },
              { label: 'Industri', value: 'PropTech' },
            ].map((item, i) => (
              <div key={i} className="py-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
                <p className="text-xs font-bold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === ABOUT STORY === */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em]">Cerita Kami</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 tracking-tight">Dari Keresahan Menjadi Solusi</h2>
          </div>

          <div className="space-y-6 text-gray-600 text-base sm:text-lg leading-relaxed">
            <p>
              <strong className="text-gray-900">RuangSinggah.id</strong> lahir dari pengalaman pribadi sebagai mahasiswa perantau di Makassar. Kami merasakan langsung betapa frustasinya mencari kost — foto yang tidak sesuai kenyataan, informasi harga yang menyesatkan, dan ketidakpastian soal keamanan lingkungan.
            </p>
            <p>
              Berangkat dari keresahan itu, kami membangun platform yang mengutamakan <strong className="text-orange-600">verifikasi data lapangan</strong>. Setiap informasi kost yang tampil di RuangSinggah.id telah dikunjungi, difoto, dan dikonfirmasi langsung oleh tim kami. Kami tidak sekadar menampilkan data — kami <em>menjaminnya</em>.
            </p>
            <p>
              Kini, RuangSinggah.id telah berkembang menjadi ekosistem proptech yang menghubungkan mahasiswa pencari kost, pemilik hunian, dan agen survey lapangan dalam satu platform terintegrasi — didukung oleh teknologi AI dan pembayaran digital.
            </p>
          </div>

          <div className="mt-12 bg-orange-50 rounded-2xl p-8 border border-orange-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3">Visi</p>
                <p className="text-gray-800 font-bold leading-relaxed">Menjadi platform pencarian hunian terpercaya #1 di Indonesia yang berbasis verifikasi lapangan dan transparansi data.</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3">Misi</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span>Menyediakan data kost 100% terverifikasi lapangan</li>
                  <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span>Melindungi mahasiswa dari informasi menyesatkan</li>
                  <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span>Memberdayakan pemilik kost dengan teknologi digital</li>
                  <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span>Menciptakan standar baru industri properti kost di Indonesia</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CORE VALUES === */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em]">Nilai Inti</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 tracking-tight">Yang Kami Pegang Teguh</h2>
          </div>

          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-4">
            {coreValues.map((val, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4">{val.icon}</div>
                <h3 className="text-base font-black text-gray-900 mb-2">{val.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>

          {/* Desktop: Interactive */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-12 items-start">
            <div className="space-y-3 sticky top-28">
              {coreValues.map((val, i) => (
                <button
                  key={i}
                  onClick={() => setActiveValue(i)}
                  className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border ${
                    activeValue === i
                      ? 'bg-white border-orange-200 shadow-lg shadow-orange-100/50'
                      : 'bg-transparent border-transparent hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                      activeValue === i ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {val.icon}
                    </div>
                    <div>
                      <h3 className={`text-sm font-black uppercase tracking-tight transition-colors ${activeValue === i ? 'text-gray-900' : 'text-gray-500'}`}>{val.title}</h3>
                      {activeValue === i && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{val.desc}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-xl">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-200">
                {coreValues[activeValue].icon}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">{coreValues[activeValue].title}</h3>
              <p className="text-gray-600 leading-relaxed text-base">{coreValues[activeValue].desc}</p>
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nilai #{activeValue + 1} dari {coreValues.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === SERVICES === */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em]">Produk & Layanan</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 tracking-tight">Ekosistem Lengkap untuk Hunian</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Empat layanan utama yang dirancang untuk memenuhi kebutuhan seluruh stakeholder properti kost.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/30 transition-all duration-300">
                <div className="w-14 h-14 bg-gray-100 group-hover:bg-orange-500 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-white transition-all duration-300 mb-5">
                  {svc.icon}
                </div>
                <span className="inline-block bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">{svc.tag}</span>
                <h3 className="text-base font-black text-gray-900 mb-2">{svc.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === VERIFICATION PROCESS === */}
      <section className="py-20 sm:py-28 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.25em]">Proses Verifikasi</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">Bagaimana Kami Menjamin Data</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">Setiap kost yang tampil di platform kami telah melalui 4 tahap verifikasi ketat.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Kunjungan Langsung', desc: 'Tim kami mendatangi setiap titik kost yang terdaftar di platform untuk verifikasi langsung.', icon: '🏠' },
              { step: '02', title: 'Audit Fasilitas', desc: 'Pengecekan satu-per-satu fasilitas yang dijanjikan — kamar, kamar mandi, WiFi, air, keamanan.', icon: '📋' },
              { step: '03', title: 'Wawancara Penghuni', desc: 'Menanyakan langsung kepada penghuni aktif tentang kenyamanan dan kualitas pelayanan kost.', icon: '🗣️' },
              { step: '04', title: 'Update Berkala', desc: 'Data diperbarui secara rutin untuk memastikan informasi tetap relevan dan akurat.', icon: '🔄' },
            ].map((item, i) => (
              <div key={i} className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:border-orange-500/30 transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl">{item.icon}</span>
                  <span className="text-4xl font-black text-white/5 group-hover:text-orange-500/20 transition-colors">{item.step}</span>
                </div>
                <h3 className="text-base font-black text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === TIMELINE / MILESTONES === */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em]">Perjalanan Kami</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 tracking-tight">Milestone & Timeline</h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 sm:-translate-x-px"></div>

            <div className="space-y-10">
              {milestones.map((m, i) => (
                <div key={i} className={`relative flex items-start gap-6 sm:gap-0 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`flex-1 ${i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${i % 2 === 0 ? 'sm:ml-auto' : ''}`} style={{ maxWidth: '360px' }}>
                      <div className="flex items-center gap-2 mb-2" style={{ justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{m.month} {m.year}</span>
                      </div>
                      <h3 className="text-base font-black text-gray-900 mb-1">{m.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-6 sm:left-1/2 w-3 h-3 bg-orange-500 rounded-full border-4 border-white shadow-md -translate-x-1/2 mt-6 z-10"></div>

                  {/* Spacer for opposite side */}
                  <div className="hidden sm:block flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === TEAM === */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em]">Tim Kami</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 tracking-tight">Di Balik RuangSinggah.id</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Tim kecil yang berdedikasi tinggi untuk membangun masa depan pencarian hunian di Indonesia.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-xl hover:shadow-orange-100/30 hover:border-orange-200 transition-all duration-300">
                <div className={`w-20 h-20 ${member.color} rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-5 group-hover:scale-105 transition-transform shadow-lg`}>
                  {member.initial}
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{member.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-400 italic">*Nama dan foto tim akan diperbarui segera.</p>
          </div>
        </div>
      </section>




      {/* === CTA / CLOSING === */}
      <section className="py-20 sm:py-28 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500 rounded-full blur-[200px] opacity-10"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
            "Mencari tempat tinggal<br/>tidak harus melelahkan."
          </h2>
          <p className="text-gray-500 mb-8 text-lg">— Tim RuangSinggah.id</p>
          <div className="w-20 h-1 bg-orange-500 mx-auto mb-10 rounded-full"></div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <svg className="w-6 h-6 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</p>
                <p className="text-sm font-bold text-white mt-1">bantuan@ruangsinggah.id</p>
              </div>
              <div className="text-center">
                <svg className="w-6 h-6 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Lokasi</p>
                <p className="text-sm font-bold text-white mt-1">Makassar, Sul-Sel</p>
              </div>
              <div className="text-center">
                <svg className="w-6 h-6 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Website</p>
                <p className="text-sm font-bold text-white mt-1">ruangsinggah.id</p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-xs text-gray-600">© {new Date().getFullYear()} PT Ruang Singgah Nusantara. Seluruh hak cipta dilindungi undang-undang.</p>
        </div>
      </section>

    </div>
  );
};

export default About;
