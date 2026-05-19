import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Calendar, User, Share2, Search, ArrowRight, BookOpen, 
  Newspaper, ChevronRight, Send, Mail, Bookmark, ExternalLink, Flame
} from 'lucide-react';
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

const CATEGORIES = ['Semua', 'Edukasi', 'Panduan', 'Berita', 'Tips', 'Bisnis', 'Mitra Kost'];

const Articles: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [dbArticles, setDbArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailSub, setEmailSub] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

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
      document.title = `${currentArticle.title} - RuangSinggah.id Editorial`;
      
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
        '@type': 'NewsArticle',
        'headline': currentArticle.title,
        'description': currentArticle.description,
        'image': currentArticle.imageUrl || 'https://ruangsinggah.id/logo.png',
        'datePublished': '2026-05-19T00:00:00Z',
        'dateModified': '2026-05-19T00:00:00Z',
        'author': {
          '@type': 'Person',
          'name': currentArticle.author
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
        document.title = 'RuangSinggah - Cari Kost Mahasiswa Terverifikasi di Makassar';
        const defaultDesc = 'Cari kost mahasiswa terverifikasi di Makassar dengan mudah! Database kost putra, putri & campur dekat Unhas, UNM, UIN, Unismuh. Harga terjangkau, data valid dari lapangan. Jasa survey kost tersedia. Booking online sekarang!';
        if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
        const scriptToRemove = document.getElementById(schemaId);
        if (scriptToRemove) scriptToRemove.remove();
      };
    } else {
      document.title = 'RuangSinggah Media - Portal Berita, Tips & Edukasi Properti';
    }
  }, [currentArticle]);

  // Filter logic
  const filteredArticles = allArticles.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Semua' || a.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Extract featured post (the latest post in the filtered list, or first overall if none selected)
  const featuredPost = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const gridArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : [];

  // Sidebar recommendations (3 articles excluding the current one)
  const popularArticles = allArticles
    .filter(a => a.slug !== (currentArticle?.slug || ''))
    .slice(0, 4);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSub) return;
    setIsSubscribed(true);
    setEmailSub('');
  };

  const getTodayDateString = () => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-800 font-sans antialiased">
      {/* Editorial Top bar */}
      <div className="border-b border-gray-200/80 bg-white sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (currentArticle) {
                  navigate(Page.ARTICLES);
                } else {
                  navigate('/');
                }
              }}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">RuangSinggah</span>
              <span className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1 uppercase">
                <Newspaper className="w-4 h-4 text-slate-800" /> Editorial & News
              </span>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-400">{getTodayDateString()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
        
        {/* ========================================================================= */}
        {/* 1. DETAIL VIEW */}
        {/* ========================================================================= */}
        {currentArticle ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main content area */}
            <article className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10">
              
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">
                <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate('/')}>Home</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate(Page.ARTICLES)}>Artikel</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-orange-500">{currentArticle.category}</span>
              </nav>

              {/* Tag Category */}
              <div className="inline-block bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-orange-100">
                {currentArticle.category}
              </div>

              {/* Article Main Titles */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
                {currentArticle.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed mb-6 border-l-2 border-slate-200 pl-4 italic">
                {currentArticle.description}
              </p>

              {/* Author & Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-sm font-black text-orange-600 shadow-inner">
                    {currentArticle.author.charAt(0)}
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900">{currentArticle.author}</span>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {currentArticle.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {currentArticle.readTime} Baca</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Tautan artikel disalin ke papan klip!');
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-orange-500 border border-slate-200/60 rounded-xl transition-all active:scale-95 shadow-sm"
                    title="Bagikan Artikel"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cover Image */}
              {currentArticle.imageUrl ? (
                <div className="w-full aspect-[21/10] rounded-2xl overflow-hidden border border-slate-100 shadow-md mb-8">
                  <img src={currentArticle.imageUrl} alt={currentArticle.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-full aspect-[21/10] bg-gradient-to-br ${currentArticle.gradient} rounded-2xl flex flex-col items-center justify-center p-8 text-7xl text-white shadow-inner mb-8 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                  <span className="relative z-10 text-8xl">{currentArticle.icon}</span>
                </div>
              )}

              {/* Dynamic HTML Content Body */}
              <div className="prose prose-orange max-w-none rs-article-content">
                <style>{`
                  .rs-article-content h1 {
                    font-size: 2rem !important;
                    font-weight: 900 !important;
                    line-height: 1.25 !important;
                    margin-top: 2.25rem !important;
                    margin-bottom: 1rem !important;
                    color: #0f172a !important;
                    text-transform: uppercase !important;
                    letter-spacing: -0.025em !important;
                  }
                  .rs-article-content h2 {
                    font-size: 1.5rem !important;
                    font-weight: 800 !important;
                    line-height: 1.35 !important;
                    margin-top: 1.75rem !important;
                    margin-bottom: 0.85rem !important;
                    color: #1e293b !important;
                    text-transform: uppercase !important;
                    letter-spacing: -0.02em !important;
                  }
                  .rs-article-content h3 {
                    font-size: 1.25rem !important;
                    font-weight: 700 !important;
                    line-height: 1.4 !important;
                    margin-top: 1.5rem !important;
                    margin-bottom: 0.75rem !important;
                    color: #334155 !important;
                  }
                  .rs-article-content h4 {
                    font-size: 1.125rem !important;
                    font-weight: 700 !important;
                    line-height: 1.4 !important;
                    margin-top: 1.25rem !important;
                    margin-bottom: 0.5rem !important;
                    color: #475569 !important;
                  }
                  .rs-article-content p {
                    margin-top: 0 !important;
                    margin-bottom: 1.25rem !important;
                    line-height: 1.8 !important;
                    color: #334155 !important;
                    font-size: 0.95rem !important;
                  }
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
                    list-style-type: disc !important;
                    padding-left: 1.75rem !important;
                    margin-bottom: 1.25rem !important;
                  }
                  .rs-article-content ol {
                    list-style-type: decimal !important;
                    padding-left: 1.75rem !important;
                    margin-bottom: 1.25rem !important;
                  }
                  .rs-article-content li {
                    margin-bottom: 0.5rem !important;
                    line-height: 1.7 !important;
                    color: #334155 !important;
                    font-size: 0.95rem !important;
                  }
                `}</style>
                {typeof currentArticle.content === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: currentArticle.content }} />
                ) : (
                  currentArticle.content
                )}
              </div>

              {/* Author Box */}
              <div className="mt-12 p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0 shadow-md">
                  {currentArticle.author.charAt(0)}
                </div>
                <div>
                  <span className="block font-black text-slate-800 text-sm mb-1 uppercase tracking-wider">Tentang Penulis: {currentArticle.author}</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Kontributor kolom edukasi dan produk di RuangSinggah.id. Berkomitmen menghadirkan informasi transparan seputar kos-kosan mahasiswa, tips finansial sewa properti, dan panduan survey lapangan tepercaya di wilayah Sulawesi Selatan.
                  </p>
                </div>
              </div>

              {/* Footer Share */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Diterbitkan Oleh: PT Ruang Singgah Nusantara</span>
                <button 
                  onClick={() => {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl tracking-wider transition-colors active:scale-95 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" /> Bagikan ke WA
                </button>
              </div>

            </article>

            {/* Sidebar Column */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Popular Articles widget */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" /> Artikel Terpopuler
                </h3>
                
                <div className="space-y-4 divide-y divide-slate-50">
                  {popularArticles.map((art, idx) => (
                    <div 
                      key={art.slug} 
                      onClick={() => navigate(`/artikel/${art.slug}`)}
                      className={`group flex items-start gap-3 cursor-pointer transition-colors hover:text-orange-500 ${idx > 0 ? 'pt-4' : ''}`}
                    >
                      {art.imageUrl ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                          <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className={`w-16 h-16 bg-gradient-to-br ${art.gradient} rounded-xl shrink-0 flex items-center justify-center text-2xl text-white relative`}>
                          <span className="relative z-10">{art.icon}</span>
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-wider leading-none block">{art.category}</span>
                        <h4 className="text-xs font-bold leading-snug line-clamp-2 text-slate-800 group-hover:text-orange-500 transition-colors">
                          {art.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Survey Booking Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z\' fill=\'%23ffffff\'/%3E%3C/svg%3E")' }} />
                
                <div className="relative z-10 space-y-4">
                  <span className="inline-block bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Layanan Khusus</span>
                  <h3 className="text-lg font-black uppercase tracking-tight leading-tight">Takut Kost Zonk?<br />Survey Pake Agen Aja!</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Agen surveyor independen kami akan mendatangi kos target Anda, mengirimkan ulasan jujur, visual real-time, dan Google Drive laporan detil.
                  </p>
                  <button 
                    onClick={() => navigate('/survey')}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
                  >
                    Booking Survey Kost <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </aside>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
            
            {/* Hero Heading Portal */}
            <div className="text-center max-w-3xl mx-auto space-y-4 py-4">
              <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200/60 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                <BookOpen className="w-3.5 h-3.5" /> RuangSinggah Newsroom & Journal
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none uppercase">
                Pusat Edukasi & Publikasi
              </h1>
              <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Panduan praktis, ulasan mendalam, penjelasan entitas legal, serta inovasi teknologi properti yang dirancang khusus oleh <strong>PT Ruang Singgah Nusantara</strong>.
              </p>
            </div>

            {/* Categories Navigation & Search Row */}
            <div className="space-y-4 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Horizontal Category Pill Scroll */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none selection:bg-transparent">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                        selectedCategory === cat 
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Compact Search Bar */}
                <div className="bg-slate-50 p-1.5 rounded-full border border-slate-200/50 w-full md:w-80 flex items-center gap-2 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 ml-3" />
                  <input 
                    type="text" 
                    placeholder="Cari berita & artikel..." 
                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-700 placeholder-slate-400"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* Catalog content */}
            {filteredArticles.length > 0 ? (
              <div className="space-y-8">
                
                {/* FEATURED POST (Latest Article in list) */}
                {featuredPost && (
                  <div 
                    onClick={() => navigate(`/artikel/${featuredPost.slug}`)}
                    className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200/80 transition-all duration-500 overflow-hidden grid grid-cols-1 lg:grid-cols-12 cursor-pointer"
                  >
                    {/* Visual Cover */}
                    <div className="lg:col-span-7 relative overflow-hidden bg-slate-50 aspect-video lg:aspect-auto min-h-[260px]">
                      {featuredPost.imageUrl ? (
                        <img 
                          src={featuredPost.imageUrl} 
                          alt={featuredPost.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${featuredPost.gradient} flex items-center justify-center text-8xl text-white`}>
                          <span className="group-hover:scale-110 transition-transform">{featuredPost.icon}</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        Laporan Utama
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{featuredPost.category}</span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featuredPost.readTime} baca</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 group-hover:text-orange-500 transition-colors uppercase leading-tight">
                          {featuredPost.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed line-clamp-4">
                          {featuredPost.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 uppercase">
                            {featuredPost.author.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-slate-800 leading-none">{featuredPost.author}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{featuredPost.date}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                          Baca Utama <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* GRID FOR SECONDARY ARTICLES */}
                {gridArticles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridArticles.map(art => (
                      <div 
                        key={art.slug} 
                        onClick={() => navigate(`/artikel/${art.slug}`)}
                        className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-100 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          {/* Visual Card Cover */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
                            {art.imageUrl ? (
                              <img 
                                src={art.imageUrl} 
                                alt={art.title} 
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                            ) : (
                              <div className={`absolute inset-0 bg-gradient-to-br ${art.gradient} flex items-center justify-center text-5xl text-white`}>
                                <span className="group-hover:scale-110 transition-transform">{art.icon}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="p-6 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{art.category}</span>
                              <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {art.readTime}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 group-hover:text-orange-500 transition-colors uppercase leading-snug line-clamp-2">
                              {art.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                              {art.description}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-6 pt-0 mt-4">
                          <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold">{art.date}</span>
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                              Baca <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-bold italic">Topik atau kategori artikel tidak ditemukan.</p>
              </div>
            )}

            {/* Newsletter Subscription Box */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-xl relative overflow-hidden border border-white/5">
              {/* background lighting */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-600/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -left-20 -top-20 w-80 h-80 bg-slate-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                  <div className="inline-flex items-center gap-1.5 bg-white/10 text-orange-400 border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    <Mail className="w-3.5 h-3.5" /> Newsletter Mingguan
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-none">
                    Dapatkan Update Berita & Tips Kost Terbaik
                  </h2>
                  <p className="text-slate-400 font-medium text-xs sm:text-sm leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Gabung dengan ribuan mahasiswa dan pemilik kost di Makassar. Kami mengirimi Anda tips sewa properti, pembaruan aplikasi, dan artikel pilar mingguan langsung ke email Anda.
                  </p>
                </div>

                <div className="lg:col-span-5">
                  {isSubscribed ? (
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center space-y-3 animate-in zoom-in duration-300">
                      <span className="text-3xl">🎉</span>
                      <h4 className="text-sm font-black uppercase tracking-wider text-orange-400">Pendaftaran Berhasil!</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">Terima kasih telah berlangganan. Kami akan mengirimkan buletin pertama Anda di hari Senin depan.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="bg-white/5 p-2 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-2">
                      <input 
                        type="email" 
                        placeholder="Alamat email Anda..." 
                        required
                        className="w-full bg-transparent border-0 outline-none text-xs font-bold text-white px-4 py-3 placeholder-slate-400"
                        value={emailSub}
                        onChange={e => setEmailSub(e.target.value)}
                      />
                      <button 
                        type="submit"
                        className="py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-orange-500/10"
                      >
                        Langganan <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Articles;
