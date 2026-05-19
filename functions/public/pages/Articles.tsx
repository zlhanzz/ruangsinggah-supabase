import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Share2, Search, ArrowRight, BookOpen } from 'lucide-react';
import { Page } from '../types';
import { supabase } from '../supabase';

interface ArticleData {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  icon: string;
  gradient: string;
  content: React.ReactNode | string;
  imageUrl?: string;
}

const articles: ArticleData[] = [
  {
    slug: 'mengenal-ruangsinggah-id-solusi-cari-kost-terverifikasi',
    title: 'Mengenal RuangSinggah.id: Solusi Cari Kost Terverifikasi Bebas Zonk',
    description: 'Temukan bagaimana PT Ruang Singgah Nusantara merevolusi pencarian hunian mahasiswa dengan verifikasi data lapangan 100% dan jasa survey kost independen di Makassar.',
    category: 'Edukasi',
    author: 'Tim Redaksi RuangSinggah',
    date: '19 Mei 2026',
    readTime: '5 Menit',
    icon: '🏢',
    gradient: 'from-orange-500 to-amber-400',
    content: (
      <>
        <p className="text-lg leading-relaxed text-gray-700 mb-6 font-medium">
          Mencari hunian atau kamar kost sebagai mahasiswa perantau sering kali menjadi perjalanan yang melelahkan dan penuh risiko. Banyak mahasiswa menghadapi masalah klasik: foto kost di internet tidak sesuai dengan realitas fisik, informasi harga yang tidak transparan, hingga penipuan berkedok uang muka. Di tengah masalah ini, <strong>RuangSinggah.id</strong> hadir sebagai solusi utama.
        </p>
        
        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Apa itu RuangSinggah.id?</h2>
        <p className="leading-relaxed text-gray-700 mb-6">
          <strong>RuangSinggah.id</strong> (dikelola secara resmi oleh <strong>PT Ruang Singgah Nusantara</strong> yang terdaftar hukum pada 9 Agustus 2025) adalah platform teknologi properti (PropTech) terpercaya yang berbasis di Kota Makassar, Sulawesi Selatan. Berbeda dari platform pencarian properti biasa yang hanya mengandalkan unggahan dari pemilik, RuangSinggah.id menerapkan standar verifikasi lapangan yang sangat ketat untuk melindungi konsumen, khususnya mahasiswa.
        </p>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Menjawab Keresahan Mahasiswa & Orang Tua</h2>
        <p className="leading-relaxed text-gray-700 mb-6">
          Didirikan atas dasar pengalaman nyata para pendirinya sebagai mahasiswa perantau di sekitar Universitas Hasanuddin (Unhas) dan Universitas Negeri Makassar (UNM), platform ini dirancang untuk menciptakan ekosistem pencarian kost bebas cemas (*bebas zonk*). Orang tua mahasiswa yang berada di luar daerah kini tidak perlu khawatir lagi mengirimkan anak mereka untuk berkuliah di Makassar, karena RuangSinggah menjamin keakuratan informasi fasilitas, harga, maupun tingkat keamanan kost.
        </p>

        <blockquote className="border-l-4 border-orange-500 pl-4 py-2 my-6 bg-orange-50/50 rounded-r-xl">
          <p className="italic font-bold text-gray-800">
            "Visi kami adalah menciptakan transparansi data hunian 100% dan memberdayakan ekonomi lokal melalui kolaborasi agen lapangan serta pemilik kost."
          </p>
          <cite className="block text-xs font-bold text-orange-600 uppercase tracking-widest mt-2">— Founder & CEO, PT Ruang Singgah Nusantara</cite>
        </blockquote>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Fitur & Layanan Utama RuangSinggah.id</h2>
        <p className="leading-relaxed text-gray-700 mb-4">
          Untuk mewujudkan platform pencarian kost terbaik, kami menghadirkan ekosistem terpadu yang mencakup:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-gray-700 mb-6">
          <li><strong>Pencarian Kost Terverifikasi:</strong> Semua listing kost yang ditayangkan di platform telah divalidasi langsung oleh tim internal kami untuk memastikan kebenaran lokasi, kelayakan fasilitas kamar mandi/kamar tidur, serta legalitas kost.</li>
          <li><strong>Jasa Survey Kost Independen:</strong> Layanan di mana calon penyewa dapat menugaskan agen surveyor profesional kami untuk mengunjungi kost mana pun di Makassar secara fisik, melakukan video call real-time, dan membuat laporan penilaian independen yang mendalam.</li>
          <li><strong>KostManager (SaaS untuk Mitra Pemilik Kost):</strong> Sistem manajemen properti kost yang mempermudah pemilik untuk melacak jatuh tempo pembayaran sewa, mengirim tagihan otomatis via WhatsApp integration, serta memantau okupansi hunian secara digital.</li>
        </ul>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Komitmen Terhadap Integritas</h2>
        <p className="leading-relaxed text-gray-700 mb-6">
          Dengan fokus pengembangan awal di wilayah Sulawesi Selatan, khususnya area kampus utama seperti UNHAS, UNM, UIN Alauddin, dan Universitas Muhammadiyah Makassar (Unismuh), RuangSinggah.id berkomitmen untuk terus berinovasi dalam memadukan keunggulan layanan digital (SaaS & AI Chatbot) dengan keandalan operasional di dunia nyata.
        </p>
      </>
    )
  },
  {
    slug: 'panduan-jasa-survey-kost-makassar',
    title: 'Panduan Lengkap Jasa Survey Kost Pertama di Kota Makassar',
    description: 'Pelajari bagaimana menghemat waktu, biaya, dan terhindar dari penipuan kost jarak jauh dengan menggunakan Jasa Survey Kost profesional dari RuangSinggah.',
    category: 'Panduan',
    author: 'Tim Operasional RuangSinggah',
    date: '18 Mei 2026',
    readTime: '4 Menit',
    icon: '📋',
    gradient: 'from-blue-500 to-cyan-400',
    content: (
      <>
        <p className="text-lg leading-relaxed text-gray-700 mb-6 font-medium">
          Bagi mahasiswa baru yang berasal dari luar Kota Makassar—seperti dari Maluku, Papua, Kalimantan, atau kabupaten lain di Sulawesi—mencari kost secara langsung membutuhkan biaya transportasi dan akomodasi yang tidak sedikit. Di sinilah **Jasa Survey Kost** dari RuangSinggah.id bertindak sebagai perpanjangan tangan Anda.
        </p>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Bagaimana Cara Kerja Jasa Survey Kost?</h2>
        <p className="leading-relaxed text-gray-700 mb-4">
          Layanan ini dirancang sesederhana mungkin agar calon penyewa mendapatkan visualisasi riil kost target tanpa harus hadir secara fisik. Alur kerjanya adalah sebagai berikut:
        </p>
        <ol className="list-decimal pl-6 space-y-3 text-gray-700 mb-6">
          <li><strong>Daftarkan Kost Target:</strong> Calon penyewa memasukkan detail alamat kost atau kontak pemilik kost yang ingin disurvey (bisa mendaftarkan hingga 5 kost sekaligus dalam satu pesanan).</li>
          <li><strong>Penugasan Agen Surveyor:</strong> Tim admin RuangSinggah menugaskan agen surveyor lapangan profesional yang berada paling dekat dengan lokasi kost target.</li>
          <li><strong>Pengecekan Fisik & Fasilitas:</strong> Agen mendatangi kost, mengaudit kebersihan kamar, kelancaran aliran air, kecepatan sinyal WiFi, kondisi keamanan lingkungan sekitar, dan kemudahan akses jalan.</li>
          <li><strong>Laporan Hasil Survey:</strong> Calon penyewa menerima hasil penilaian detail, foto-foto terkini bebas filter, serta folder Google Drive khusus laporan visual unit kost.</li>
        </ol>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Mengapa Memilih Survey Independen RuangSinggah?</h2>
        <p className="leading-relaxed text-gray-700 mb-6">
          Menyerahkan verifikasi properti kepada pihak independen seperti kami menjamin Anda mendapatkan penilaian yang objektif. Agen kami tidak memiliki konflik kepentingan dan dibayar berdasarkan keakuratan serta kualitas ulasan mereka. Hal ini meniadakan kecurangan dari pemilik kost yang sering memanipulasi foto lama.
        </p>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Harga Jasa Survey yang Sangat Terjangkau</h2>
        <p className="leading-relaxed text-gray-700 mb-6">
          Hanya dengan biaya terjangkau Rp 35.000 per unit kost (dengan model pemesanan paket multi-kost), Anda dapat menghemat jutaan rupiah dibanding harus terbang ke Makassar hanya untuk mencari kamar kost. Lindungi keputusan penting Anda dengan validasi data tepercaya dari RuangSinggah.id.
        </p>
      </>
    )
  },
  {
    slug: 'optimasi-okupansi-kost-kostmanager',
    title: 'Meningkatkan Okupansi Kost Menggunakan Sistem KostManager',
    description: 'Pelajari bagaimana pemilik kost (mitra) dapat meningkatkan efisiensi operasional dan okupansi kamar hingga 90% dengan fitur manajemen properti digital.',
    category: 'Mitra Kost',
    author: 'Tim Produk RuangSinggah',
    date: '17 Mei 2026',
    readTime: '6 Menit',
    icon: '📈',
    gradient: 'from-purple-500 to-pink-400',
    content: (
      <>
        <p className="text-lg leading-relaxed text-gray-700 mb-6 font-medium">
          Mengelola rumah kost dengan puluhan kamar sering kali mendatangkan kendala administrasi yang rumit. Mulai dari pencatatan tenggat waktu sewa penghuni yang berantakan, keterlambatan pembayaran bulanan, hingga kamar kosong yang tidak kunjung terisi. Fitur **KostManager** hadir sebagai asisten digital andalan Anda.
        </p>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Digitalisasi Manajemen Kost Mahasiswa</h2>
        <p className="leading-relaxed text-gray-700 mb-6">
          KostManager adalah sistem berbasis Software-as-a-Service (SaaS) yang dikembangkan khusus oleh RuangSinggah.id untuk membantu Mitra Pemilik Kost mengelola properti mereka secara teratur. Kami memindahkan sistem pembukuan manual di kertas/Excel ke dalam satu dashboard admin berbasis web yang mudah diakses dari smartphone maupun laptop.
        </p>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Keunggulan Utama KostManager</h2>
        <p className="leading-relaxed text-gray-700 mb-4">
          Pemilik kost yang telah bergabung menjadi mitra kami menikmati berbagai kemudahan operasional, di antaranya:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-gray-700 mb-6">
          <li><strong>Pencatatan Penghuni Otomatis:</strong> Data penghuni aktif, tanggal masuk, durasi sewa, serta nomor kontak terekam secara aman.</li>
          <li><strong>Notifikasi Tagihan WhatsApp Integration:</strong> Sistem akan otomatis mengirimkan pesan pengingat tagihan sewa ke nomor WhatsApp penghuni kost saat mendekati masa jatuh tempo, mengurangi kasus tunggakan secara signifikan.</li>
          <li><strong>Pemasaran Aktif (Active Listings):</strong> Kamar kost yang kosong akan otomatis diprioritaskan tampil di halaman utama pencarian RuangSinggah.id sehingga lebih cepat ditemukan oleh pencari kost potensial.</li>
        </ul>

        <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight">Bergabung Menjadi Mitra RuangSinggah</h2>
        <p className="leading-relaxed text-gray-700 mb-6">
          Kemitraan bersama RuangSinggah.id dirancang saling menguntungkan. Pemilik kost mendapatkan kemudahan operasional dan jangkauan promosi mahasiswa yang luas, sementara platform mendapatkan komisi yang kompetitif hanya dari transaksi sewa yang berhasil diproses.
        </p>
      </>
    )
  }
];

const Articles: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [dbArticles, setDbArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          const mapped: ArticleData[] = data.map((d: any) => ({
            slug: d.slug,
            title: d.title,
            description: d.description,
            category: d.category,
            author: d.author,
            date: d.date,
            readTime: d.read_time,
            icon: d.icon,
            gradient: d.gradient,
            content: d.content,
            imageUrl: d.image_url
          }));
          setDbArticles(mapped);
        }
      } catch (err) {
        console.warn("Table articles not found or query error, using static fallbacks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const allArticles = [...dbArticles, ...articles.filter(a => !dbArticles.some(da => da.slug === a.slug))];
  const currentArticle = slug ? allArticles.find(a => a.slug === slug) : null;

  // SEO & Schema injection dynamic handling
  useEffect(() => {
    if (currentArticle) {
      document.title = `${currentArticle.title} - RuangSinggah.id`;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', currentArticle.description);
      }

      // Inject JSON-LD Article Schema
      const schemaId = 'article-ld-json';
      let scriptTag = document.getElementById(schemaId);
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = schemaId;
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }

      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': currentArticle.title,
        'description': currentArticle.description,
        'image': currentArticle.imageUrl || 'https://ruangsinggah.id/logo.png',
        'datePublished': '2026-05-19T00:00:00Z',
        'dateModified': '2026-05-19T00:00:00Z',
        'author': {
          '@type': 'Organization',
          'name': 'RuangSinggah',
          'url': 'https://ruangsinggah.id'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'PT Ruang Singgah Nusantara',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://ruangsinggah.id/logo.png'
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `https://ruangsinggah.id/artikel/${currentArticle.slug}`
        }
      };

      scriptTag.innerHTML = JSON.stringify(articleSchema);

      return () => {
        // Reset dynamic title/meta on unmount
        document.title = 'RuangSinggah - Cari Kost Mahasiswa Terverifikasi di Makassar';
        const defaultDesc = 'Cari kost mahasiswa terverifikasi di Makassar dengan mudah! Database kost putra, putri & campur dekat Unhas, UNM, UIN, Unismuh. Harga terjangkau, data valid dari lapangan. Jasa survey kost tersedia. Booking online sekarang!';
        if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
        const scriptToRemove = document.getElementById(schemaId);
        if (scriptToRemove) scriptToRemove.remove();
      };
    } else {
      document.title = 'Edukasi & Artikel Pilihan - RuangSinggah.id';
    }
  }, [currentArticle]);

  // Filter catalog
  const filteredArticles = allArticles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Background Ornaments */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[35%] h-[35%] bg-orange-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[35%] h-[35%] bg-blue-100/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        
        {/* ARTICLE DETAIL VIEW */}
        {currentArticle ? (
          <article className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
            {/* Header / Hero Cover */}
            <div 
              className={`px-6 sm:px-12 py-16 sm:py-20 text-white relative overflow-hidden bg-cover bg-center ${!currentArticle.imageUrl ? `bg-gradient-to-br ${currentArticle.gradient}` : ''}`}
              style={currentArticle.imageUrl ? { backgroundImage: `url(${currentArticle.imageUrl})` } : undefined}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
              {/* Pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'30\' height=\'30\' viewBox=\'0 0 30 30\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M15 0C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15C30 6.716 23.284 0 15 0zm0 28C7.82 28 2 22.18 2 15S7.82 2 15 2s13 5.82 13 13-5.82 13-13 13z\' fill=\'%23ffffff\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />
              
              <div className="relative z-10">
                <button 
                  onClick={() => navigate(Page.ARTICLES)} 
                  className="mb-8 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Artikel
                </button>

                <div className="inline-block bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-white/10">
                  {currentArticle.category}
                </div>
                
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight sm:leading-none tracking-tight text-white mb-6">
                  {currentArticle.title}
                </h1>

                {/* Author / Date Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-white/95">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-orange-200" /> {currentArticle.author}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-200" /> {currentArticle.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-200" /> {currentArticle.readTime} Baca</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="px-6 sm:px-12 py-10 sm:py-16 prose prose-orange max-w-none rs-article-content">
              <style>{`
                .rs-article-content img {
                  border-radius: 1.5rem;
                  margin: 2rem auto;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  max-width: 100%;
                  display: block;
                }
                .rs-article-content table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 2rem 0;
                }
                .rs-article-content th, .rs-article-content td {
                  border: 1px solid #e2e8f0;
                  padding: 0.75rem 1rem;
                  text-align: left;
                }
                .rs-article-content th {
                  background-color: #f8fafc;
                  font-weight: 700;
                }
                .rs-article-content blockquote {
                  border-left-color: #f97316;
                  background-color: #fff7ed;
                  padding: 1rem 1.5rem;
                  border-radius: 0 1rem 1rem 0;
                  font-style: italic;
                }
                .rs-article-content ul {
                  list-style-type: disc;
                  padding-left: 1.5rem;
                }
                .rs-article-content ol {
                  list-style-type: decimal;
                  padding-left: 1.5rem;
                }
              `}</style>
              {typeof currentArticle.content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: currentArticle.content }} />
              ) : (
                currentArticle.content
              )}
            </div>

            {/* Share / Footer */}
            <div className="px-6 sm:px-12 py-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-gray-500 font-bold">
                Dipublikasikan oleh: <strong>PT Ruang Singgah Nusantara</strong>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Tautan artikel disalin ke papan klip!');
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-sm"
              >
                <Share2 className="w-4 h-4" /> Bagikan Artikel
              </button>
            </div>
          </article>
        ) : (
          
          /* CATALOG LIST VIEW */
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header Catalog */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-xs font-bold border border-orange-200">
                <BookOpen className="w-4 h-4" />
                RuangSinggah Edukasi
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-none uppercase">
                Artikel & Berita Pilihan
              </h1>
              <p className="text-gray-500 font-medium text-sm sm:text-base">
                Kumpulan panduan, penjelasan entitas bisnis, dan teknologi properti yang dikembangkan oleh RuangSinggah.id untuk membantu mahasiswa Indonesia mencari hunian tepercaya.
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 max-w-md mx-auto flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400 ml-3" />
              <input 
                type="text" 
                placeholder="Cari topik artikel..." 
                className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder-gray-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 gap-6">
              {filteredArticles.length > 0 ? (
                filteredArticles.map(art => (
                  <div 
                    key={art.slug} 
                    className="group bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:border-orange-200 transition-all duration-300 overflow-hidden flex flex-col md:flex-row cursor-pointer"
                    onClick={() => navigate(`/artikel/${art.slug}`)}
                  >
                    {/* Visual Card Cover */}
                    {art.imageUrl ? (
                      <div className="w-full md:w-48 shrink-0 relative overflow-hidden bg-gray-100 min-h-[160px] md:min-h-0">
                        <img 
                          src={art.imageUrl} 
                          alt={art.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                    ) : (
                      <div className={`bg-gradient-to-br ${art.gradient} w-full md:w-48 shrink-0 flex items-center justify-center p-8 text-6xl text-white relative`}>
                        <span className="relative z-10 group-hover:scale-110 transition-transform">{art.icon}</span>
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                    )}

                    {/* Meta Card Info */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{art.category}</span>
                          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {art.readTime} baca</span>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 group-hover:text-orange-500 transition-colors uppercase leading-tight mb-2">
                          {art.title}
                        </h2>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                          {art.description}
                        </p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-bold">{art.date}</span>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                          Baca Lengkap <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                  <p className="text-gray-400 font-bold italic">Topik artikel tidak ditemukan.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Articles;
