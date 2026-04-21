
import React, { useState, useEffect } from 'react';

const Terms: React.FC = () => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      let current = '';
      sections.forEach((section) => {
        const el = section as HTMLElement;
        if (el.offsetTop - 200 <= window.scrollY) {
          current = el.getAttribute('data-section') || '';
        }
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.querySelector(`[data-section="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tocItems = [
    { id: 'ketentuan', label: '1. Ketentuan Penggunaan' },
    { id: 'penerimaan', label: '2. Penerimaan Syarat' },
    { id: 'modifikasi', label: '3. Modifikasi Platform' },
    { id: 'hki', label: '4. Hak Kekayaan Intelektual' },
    { id: 'akun', label: '5. Pendaftaran & Keamanan' },
    { id: 'komunikasi', label: '6. Komunikasi Elektronik' },
    { id: 'layanan', label: '7. Deskripsi Layanan' },
    { id: 'pembayaran', label: '8. Pembayaran & Refund' },
    { id: 'privasi', label: '9. Privasi & Data' },
    { id: 'usia', label: '10. Batasan Usia' },
    { id: 'akurasi', label: '11. Akurasi Data' },
    { id: 'konten', label: '12. Konten & Ulasan' },
    { id: 'ganti-rugi', label: '13. Ganti Rugi' },
    { id: 'disclaimer', label: '14. Disclaimer' },
    { id: 'hukum', label: '15. Hukum & Sengketa' },
    { id: 'kontak', label: '16. Kontak' },
    { id: 'legal', label: '17. Pemberitahuan Legal' },
  ];

  const SectionTitle: React.FC<{ id: string; num: string; title: string }> = ({ id, num, title }) => (
    <div data-section={id} className="scroll-mt-28 pt-10 first:pt-0">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-orange-200 shrink-0">{num}</span>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">{title}</h2>
      </div>
    </div>
  );

  const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-6">
      <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Hero Header */}
      <section className="relative bg-gray-900 pt-28 pb-16 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-[120px] opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500 rounded-full blur-[100px] opacity-15"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-orange-300 px-4 py-2 rounded-full text-xs font-bold mb-6 border border-white/10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Dokumen Hukum Resmi
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Syarat & <span className="text-orange-500">Ketentuan</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Dokumen ini mengatur hubungan antara Anda sebagai pengguna dan PT Ruang Singgah Nusantara sebagai pengelola platform RuangSinggah.id
          </p>

        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">

          {/* Sidebar TOC - Desktop Only */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Daftar Isi</p>
              <nav className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                {tocItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeSection === item.id
                        ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="prose prose-gray max-w-none">

              {/* Section 1 */}
              <SectionTitle id="ketentuan" num="1" title="Ketentuan Penggunaan" />
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                  RuangSinggah.id dioperasikan oleh <strong>PT Ruang Singgah Nusantara</strong>, badan hukum berbentuk Perseroan Terbatas Perorangan yang terdaftar sejak 9 Agustus 2025, dengan domisili operasional di <strong>Kota Makassar, Sulawesi Selatan</strong>.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mt-3">
                  Penggunaan Platform ini merupakan persetujuan Anda terhadap seluruh Syarat & Ketentuan yang tercantum dalam dokumen ini. Jika Anda tidak menyetujui ketentuan ini, harap segera menghentikan penggunaan Platform.
                </p>
              </div>

              {/* Section 2 */}
              <SectionTitle id="penerimaan" num="2" title="Penerimaan Syarat & Ketentuan" />
              <p className="text-sm text-gray-700 leading-relaxed">Dengan mengakses, mendaftar, atau melakukan transaksi di RuangSinggah.id, Anda menyatakan bahwa:</p>
              <ul className="mt-3 space-y-2">
                {[
                  'Anda telah membaca, memahami, dan menyetujui seluruh ketentuan dalam dokumen ini;',
                  'Anda memiliki kapasitas hukum untuk melakukan perjanjian (minimal berusia 17 tahun);',
                  'Informasi yang Anda berikan adalah benar, akurat, dan mutakhir;',
                  'Anda akan menggunakan Platform sesuai tujuan yang sah dan tidak melanggar hukum yang berlaku di Indonesia.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Section 3 */}
              <SectionTitle id="modifikasi" num="3" title="Modifikasi Platform & Ketentuan" />
              <p className="text-sm text-gray-700 leading-relaxed">
                PT Ruang Singgah Nusantara berhak untuk mengubah, memperbarui, atau menghentikan sebagian atau seluruh ketentuan ini serta fitur Platform kapan saja tanpa pemberitahuan sebelumnya. Perubahan akan berlaku efektif sejak dipublikasikan di Platform. Penggunaan berkelanjutan oleh Anda setelah perubahan merupakan persetujuan terhadap ketentuan yang telah diperbarui.
              </p>

              {/* Section 4 */}
              <SectionTitle id="hki" num="4" title="Hak Kekayaan Intelektual & Lisensi" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Seluruh konten, merek, logo, desain antarmuka, kode sumber, dan materi lainnya yang terdapat di RuangSinggah.id merupakan hak milik eksklusif PT Ruang Singgah Nusantara atau pihak pemberi lisensi, dan dilindungi oleh Undang-Undang Hak Cipta serta peraturan kekayaan intelektual lainnya di Indonesia.
              </p>
              <div className="mt-4 bg-red-50 border border-red-100 rounded-2xl p-5">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">Dilarang Keras</p>
                <ul className="space-y-2">
                  {[
                    'Menyalin, memodifikasi, mendistribusikan, atau memanfaatkan materi Platform tanpa izin tertulis;',
                    'Melakukan reverse engineering, dekompilasi, atau upaya mengakses kode sumber;',
                    'Menggunakan merek "RuangSinggah.id" atau "Cari Kost Makassar" untuk kepentingan komersial tanpa persetujuan.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="text-red-400 mt-0.5">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 5 */}
              <SectionTitle id="akun" num="5" title="Pendaftaran & Keamanan Akun" />
              <SubSection title="5.1 Persyaratan Pendaftaran">
                <ul className="space-y-2">
                  {[
                    'Pengguna wajib melengkapi profil dengan informasi identitas yang valid, termasuk tanggal lahir;',
                    'Sistem akan secara otomatis menolak transaksi jika terdeteksi pengguna berusia di bawah 17 tahun;',
                    'Setiap pengguna hanya diperbolehkan memiliki satu akun aktif.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-orange-400 mt-1">•</span>{item}</li>
                  ))}
                </ul>
              </SubSection>
              <SubSection title="5.2 Keamanan Akun">
                <ul className="space-y-2">
                  {[
                    'Anda bertanggung jawab penuh atas kerahasiaan kredensial login (username & password);',
                    'Segala aktivitas yang terjadi di bawah akun Anda menjadi tanggung jawab Anda;',
                    'Segera laporkan ke bantuan@ruangsinggah.id jika mendeteksi aktivitas mencurigakan.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-orange-400 mt-1">•</span>{item}</li>
                  ))}
                </ul>
              </SubSection>

              {/* Section 6 */}
              <SectionTitle id="komunikasi" num="6" title="Komunikasi Elektronik & Notifikasi" />
              <p className="text-sm text-gray-700 leading-relaxed">Anda menyetujui bahwa RuangSinggah.id dapat mengirimkan komunikasi elektronik melalui:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {['Email terdaftar', 'WhatsApp Business', 'Notifikasi Platform', 'SMS'].map((ch, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs font-bold text-gray-700">{ch}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mt-4">Komunikasi tersebut dapat berupa: konfirmasi transaksi, pembaruan status layanan, notifikasi pembayaran, pembaruan kebijakan, atau informasi promosi.</p>

              {/* Section 7 */}
              <SectionTitle id="layanan" num="7" title="Deskripsi Layanan" />

              <SubSection title="7.1 Layanan Pemasaran Kost (Sistem Komisi)">
                <p className="text-sm text-gray-700 leading-relaxed">Platform memfasilitasi pemasaran hunian kost mitra kepada calon penghuni. Komisi dikenakan kepada pemilik kost:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { period: '1 Bulan', rate: '20%' },
                    { period: '3 Bulan', rate: '17%' },
                    { period: '6 Bulan', rate: '15%' },
                    { period: '12 Bulan', rate: '10%' },
                  ].map((item, i) => (
                    <div key={i} className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                      <p className="text-2xl font-black text-orange-600">{item.rate}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Sewa {item.period}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">*Komisi dipotong dari nilai transaksi sewa awal dan tidak dikenakan pada perpanjangan sewa.</p>
              </SubSection>

              <SubSection title="7.2 Produk Digital: Database Kost">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Konten</span><span className="font-bold text-gray-900">Informasi kost terverifikasi lapangan</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Harga</span><span className="font-bold text-orange-600">Rp 50.000</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span className="font-bold text-gray-900">Otomatis via email</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Refund</span><span className="font-bold text-gray-900">Penuh jika file rusak/tidak sesuai</span></div>
                </div>
              </SubSection>

              <SubSection title="7.3 Layanan Jasa Survey Lapangan">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Harga</span><span className="font-bold text-orange-600">Rp 70.000 / lokasi</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Cakupan</span><span className="font-bold text-gray-900">Cek fasilitas, video call, dokumentasi</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Reschedule</span><span className="font-bold text-green-600">Gratis tanpa biaya tambahan</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Refund</span><span className="font-bold text-gray-900">100% jika agen gagal datang</span></div>
                </div>
              </SubSection>

              <SubSection title="7.4 Layanan KostManager">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Biaya</span><span className="font-bold text-orange-600">5% per transaksi sewa</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Langganan</span><span className="font-bold text-green-600">Tidak ada biaya bulanan</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Fitur</span><span className="font-bold text-gray-900">Manajemen kamar, penghuni, tagihan</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Pemberhentian</span><span className="font-bold text-gray-900">Notifikasi 7 hari sebelumnya</span></div>
                </div>
              </SubSection>

              {/* Section 8 */}
              <SectionTitle id="pembayaran" num="8" title="Pembayaran, Pembatalan & Pengembalian Dana" />
              <SubSection title="8.1 Metode Pembayaran">
                <p className="text-sm text-gray-700 leading-relaxed">Seluruh transaksi diproses melalui payment gateway terintegrasi. Pembayaran dianggap sah setelah terkonfirmasi oleh sistem payment gateway.</p>
              </SubSection>
              <SubSection title="8.2 Kebijakan Pembatalan">
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="px-4 py-3 text-left rounded-tl-xl text-xs font-bold uppercase tracking-widest">Layanan</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest">Dapat Dibatalkan?</th>
                        <th className="px-4 py-3 text-left rounded-tr-xl text-xs font-bold uppercase tracking-widest">Ketentuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Database Kost', can: true, note: 'Refund penuh jika file belum diakses' },
                        { name: 'Jasa Survey', can: true, note: 'Refund penuh jika >24 jam sebelum jadwal' },
                        { name: 'Komisi Penempatan', can: false, note: 'Berlaku setelah penghuni menempati' },
                        { name: 'KostManager', can: true, note: 'Tidak ada refund untuk transaksi yang sudah terjadi' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-900">{row.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${row.can ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {row.can ? '✓' : '✕'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SubSection>
              <SubSection title="8.3 Pembatalan oleh Platform">
                <p className="text-sm text-gray-700 leading-relaxed">RuangSinggah.id berhak membatalkan transaksi jika terdeteksi aktivitas penipuan, informasi properti tidak valid, atau terjadi force majeure. Refund akan diproses maksimal <strong>7 hari kerja</strong> ke metode pembayaran asal.</p>
              </SubSection>

              {/* Section 9 */}
              <SectionTitle id="privasi" num="9" title="Privasi & Perlindungan Data Pribadi" />
              <SubSection title="9.1 Pengumpulan Data">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {[
                    { label: 'Identitas', desc: 'Nama, email, telepon, tanggal lahir' },
                    { label: 'Transaksi', desc: 'Riwayat pembelian, metode pembayaran' },
                    { label: 'Penggunaan', desc: 'Log aktivitas, preferensi pencarian' },
                    { label: 'Properti (Mitra)', desc: 'Info kost, dokumen, kontak' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{item.label}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </SubSection>
              <SubSection title="9.2 Perlindungan Data">
                <p className="text-sm text-gray-700 leading-relaxed">Data disimpan dengan enkripsi dan akses terbatas. Tidak dijual atau dibagikan ke pihak ketiga tanpa persetujuan, kecuali diperlukan untuk pemenuhan layanan atau diwajibkan oleh hukum.</p>
              </SubSection>
              <SubSection title="9.3 Hak Pengguna (UU PDP)">
                <ul className="space-y-2 mt-2">
                  {['Mengakses, memperbaiki, atau menghapus data pribadi', 'Menarik persetujuan pemrosesan data', 'Mengajukan keluhan melalui bantuan@ruangsinggah.id'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-orange-400 mt-1">•</span>{item}</li>
                  ))}
                </ul>
              </SubSection>

              {/* Section 10 */}
              <SectionTitle id="usia" num="10" title="Batasan Usia & Eligibilitas" />
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 space-y-3">
                {[
                  'Pengguna wajib berusia minimal 17 tahun untuk melakukan transaksi;',
                  'Sistem melakukan verifikasi otomatis berdasarkan tanggal lahir;',
                  'Pengguna di bawah 17 tahun hanya dapat mengakses konten informatif tanpa fitur transaksi;',
                  'Pemilik kost mitra wajib berusia minimal 18 tahun dan memiliki hak sah atas properti.'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-orange-900">
                    <span className="w-5 h-5 bg-orange-200 rounded-lg flex items-center justify-center text-orange-700 font-bold text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </div>
                ))}
              </div>

              {/* Section 11 */}
              <SectionTitle id="akurasi" num="11" title="Akurasi Data & Tanggung Jawab" />
              <SubSection title="11.1 Sumber Data">
                <p className="text-sm text-gray-700 leading-relaxed">Informasi properti bersumber dari input langsung pemilik kost, verifikasi lapangan tim RuangSinggah.id, dan konfirmasi real-time melalui WhatsApp API.</p>
              </SubSection>
              <SubSection title="11.2 Batasan Tanggung Jawab">
                <p className="text-sm text-gray-700 leading-relaxed">RuangSinggah.id berupaya menyajikan informasi seakurat mungkin, namun tidak menjamin ketersediaan kamar real-time, perubahan harga oleh pemilik kost, atau kondisi properti setelah verifikasi terakhir.</p>
              </SubSection>
              <SubSection title="11.3 Mekanisme Konfirmasi">
                <p className="text-sm text-gray-700 leading-relaxed">Setiap pengajuan sewa memicu konfirmasi otomatis ke pemilik kost via WhatsApp. Pengguna disarankan komunikasi langsung dengan pemilik sebelum pembayaran DP di luar Platform.</p>
              </SubSection>

              {/* Section 12 */}
              <SectionTitle id="konten" num="12" title="Konten & Ulasan Pengguna" />
              <SubSection title="12.1 Hak Mengunggah Ulasan">
                <p className="text-sm text-gray-700 leading-relaxed">Ulasan hanya dapat dikirim setelah pengguna mencapai masa sewa minimal <strong>1 bulan</strong>, memastikan ulasan berbasis pengalaman nyata.</p>
              </SubSection>
              <SubSection title="12.2 Moderasi Konten">
                <p className="text-sm text-gray-700 leading-relaxed">RuangSinggah.id berhak menghapus konten yang mengandung SARA, pornografi, kekerasan, spam, promosi pihak ketiga, data palsu, atau yang melanggar privasi.</p>
              </SubSection>
              <SubSection title="12.3 Lisensi Konten">
                <p className="text-sm text-gray-700 leading-relaxed">Dengan mengunggah ulasan atau foto, Anda memberikan lisensi non-eksklusif kepada RuangSinggah.id untuk menampilkan konten tersebut di Platform untuk tujuan promosi dan referensi.</p>
              </SubSection>

              {/* Section 13 */}
              <SectionTitle id="ganti-rugi" num="13" title="Ganti Rugi (Indemnity)" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Anda setuju untuk membebaskan, membela, dan memegang PT Ruang Singgah Nusantara tetap tidak dirugikan dari segala klaim, kerugian, biaya, atau tuntutan hukum (termasuk biaya pengacara yang wajar) yang timbul akibat pelanggaran Syarat & Ketentuan ini, penggunaan Platform secara tidak sah, atau pelanggaran hak kekayaan intelektual atau privasi pihak ketiga.
              </p>

              {/* Section 14 */}
              <SectionTitle id="disclaimer" num="14" title="Penafian Tanggung Jawab (Disclaimer)" />
              <SubSection title='14.1 Layanan "Seadanya"'>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <p className="text-sm text-amber-900 leading-relaxed">
                    Platform disediakan dalam kondisi "<strong>sebagaimana adanya</strong>" (as-is). RuangSinggah.id tidak memberikan jaminan eksplisit maupun implisit terkait ketersediaan, keakuratan, kelengkapan informasi, hasil penggunaan, atau keamanan mutlak dari gangguan teknis.
                  </p>
                </div>
              </SubSection>
              <SubSection title="14.2 Transaksi dengan Pihak Ketiga">
                <p className="text-sm text-gray-700 leading-relaxed">
                  RuangSinggah.id berperan sebagai fasilitator. Segala kesepakatan lanjutan antara pengguna dan pemilik kost di luar fitur Platform menjadi tanggung jawab para pihak terkait. Platform tidak bertanggung jawab atas wanprestasi atau kerugian dari transaksi di luar sistem resmi.
                </p>
              </SubSection>

              {/* Section 15 */}
              <SectionTitle id="hukum" num="15" title="Hukum yang Berlaku & Penyelesaian Sengketa" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">Syarat & Ketentuan ini diatur menurut hukum Negara Republik Indonesia.</p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Musyawarah Internal', desc: 'Hubungi bantuan@ruangsinggah.id terlebih dahulu.' },
                  { step: '2', title: 'Mediasi', desc: 'Jika tidak sepakat dalam 14 hari, melalui lembaga mediasi yang disepakati.' },
                  { step: '3', title: 'Pengadilan', desc: 'Pengadilan Negeri berwenang di wilayah Kota Makassar.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">{item.step}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 16 */}
              <SectionTitle id="kontak" num="16" title="Kontak, Umpan Balik & Pelaporan" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse mt-2">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="px-4 py-3 text-left rounded-tl-xl text-xs font-bold uppercase tracking-widest">Tujuan</th>
                      <th className="px-4 py-3 text-left rounded-tr-xl text-xs font-bold uppercase tracking-widest">Kontak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { purpose: 'Dukungan Umum & Transaksi', contact: 'bantuan@ruangsinggah.id' },
                      { purpose: 'Pelanggaran Konten & Keamanan', contact: 'bantuan@ruangsinggah.id (subjek: "Laporan Pelanggaran")' },
                      { purpose: 'Kemitraan & Kerja Sama', contact: 'bantuan@ruangsinggah.id (subjek: "Kemitraan")' },
                      { purpose: 'Permintaan Data Pribadi (UU PDP)', contact: 'bantuan@ruangsinggah.id (subjek: "Permintaan Data")' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{row.purpose}</td>
                        <td className="px-4 py-3 text-gray-600">{row.contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">*Respon akan diberikan maksimal 3×24 jam pada hari kerja.</p>

              {/* Section 17 */}
              <SectionTitle id="legal" num="17" title="Pemberitahuan Legal & Copyright" />
              <div className="bg-gray-900 rounded-2xl p-8 text-white mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Legal Notice</p>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li><strong className="text-white">Merek:</strong> RuangSinggah.id — PT Ruang Singgah Nusantara</li>
                      <li><strong className="text-white">Badan Hukum:</strong> PT Perorangan, Terdaftar 9 Agustus 2025</li>
                      <li><strong className="text-white">Domisili:</strong> Kota Makassar, Sulawesi Selatan, Indonesia</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Copyright</p>
                    <p className="text-sm text-gray-300">© 2026 PT Ruang Singgah Nusantara.</p>
                    <p className="text-sm text-gray-300 mt-1">Seluruh hak cipta dilindungi undang-undang.</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-orange-500 font-extrabold text-lg">RuangSinggah</span>
                      <span className="text-white font-bold text-lg">.id</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Terms;
