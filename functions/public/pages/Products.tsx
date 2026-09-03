import React, { useState, useMemo, useEffect } from 'react';
import { FORMAT_CURRENCY } from '../constants';
import PaymentGateway from '../components/PaymentGateway';
import InvoiceModal from '../components/InvoiceModal';
import { getPublicDatabaseProducts } from '../userService';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { DatabaseProduct } from '../types';
import { 
  Search, 
  Building, 
  SlidersHorizontal, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  PhoneCall, 
  MapPin, 
  Navigation, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Star, 
  Check, 
  X, 
  ArrowRight, 
  Clock, 
  ChevronDown, 
  Layers, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ProductsProps {
  user?: any;
  onLoginRedirect?: () => void;
  validateProfile?: (productId: string) => boolean;
  initialSelectedProductId?: string;
}

// Fallback preset data jika database belum memiliki entri atau sedang inisialisasi
const DEFAULT_PRESET_DATABASES: DatabaseProduct[] = [
  {
    id: 'db_unhas_tamalanrea',
    campus: 'UNHAS TAMALANREA',
    area: 'Tamalanrea (Pintu 1, Pintu 2, & Sahabat)',
    city: 'Makassar',
    totalData: 346,
    price: 49000,
    description: 'Direktori komprehensif kost mahasiswa sekitar Kampus 1 Universitas Hasanuddin Tamalanrea mencakup koridor Pintu 1, Pintu 2, Jl. Sahabat, Perintis Kemerdekaan, dan Workshop.',
    fileUrls: {
      coverImage: { webp: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', original: '' }
    }
  },
  {
    id: 'db_unhas_teknik_gowa',
    campus: 'UNHAS TEKNIK',
    area: 'Bontomarannu (Kampus 2 Fakultas Teknik)',
    city: 'Gowa',
    totalData: 104,
    price: 49000,
    description: 'Database hunian kost mahasiswa Fakultas Teknik UNHAS Kampus Gowa di Jl. Poros Malino Km. 6 Bontomarannu dekat gerbang utama dan area pemukiman sekitar kampus.',
    fileUrls: {
      coverImage: { webp: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', original: '' }
    }
  },
  {
    id: 'db_umi_makassar',
    campus: 'UMI (UNIVERSITAS MUSLIM INDONESIA)',
    area: 'Urip Sumoharjo & Pampang',
    city: 'Makassar',
    totalData: 100,
    price: 49000,
    description: 'Koleksi data kost terpadat area Kampus 2 UMI Makassar sepanjang Jl. Urip Sumoharjo, perkampungan mahasiswa Pampang, dan sekitarnya.',
    fileUrls: {
      coverImage: { webp: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80', original: '' }
    }
  },
  {
    id: 'db_unibos_makassar',
    campus: 'UNIBOS (UNIVERSITAS BOSOWA)',
    area: 'Urip Sumoharjo & Flyover',
    city: 'Makassar',
    totalData: 100,
    price: 49000,
    description: 'Database listing kost mahasiswa Universitas Bosowa (UNIBOS) area flyover Pettarani, Jl. Urip Sumoharjo, dan jalur transportasi strategis.',
    fileUrls: {
      coverImage: { webp: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', original: '' }
    }
  },
  {
    id: 'db_pnup_tamalanrea',
    campus: 'PNUP KAMPUS 1',
    area: 'Tamalanrea - Politeknik Negeri Ujung Pandang',
    city: 'Makassar',
    totalData: 170,
    price: 49000,
    description: 'Direktori kost mahasiswa PNUP Kampus 1 Tamalanrea terintegrasi dengan akses cepat menuju bengkel praktikum, lab teknik, dan gerbang kampus.',
    fileUrls: {
      coverImage: { webp: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', original: '' }
    }
  },
  {
    id: 'db_uin_alauddin_samata',
    campus: 'UIN ALAUDDIN MAKASSAR SAMATA',
    area: 'Samata, Romangpolong & Sekitarnya',
    city: 'Gowa',
    totalData: 175,
    price: 49000,
    description: 'Database komprehensif kost mahasiswa UIN Alauddin Kampus 2 Samata Gowa meliputi Pintu 1, Pintu 2, Romangpolong, Yasin Limpo, dan Mustafa Daeng Bunga.',
    fileUrls: {
      coverImage: { webp: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', original: '' }
    }
  }
];

const Products: React.FC<ProductsProps> = ({ user, onLoginRedirect, validateProfile, initialSelectedProductId }) => {
  const [dbList, setDbList] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Semua Kota');
  const [selectedSort, setSelectedSort] = useState<'terbanyak' | 'termurah' | 'terbaru'>('terbanyak');
  const [selectedWilayahPill, setSelectedWilayahPill] = useState<'semua' | 'makassar' | 'gowa' | 'maros'>('semua');
  const [selectedCampus, setSelectedCampus] = useState('Semua Kampus');

  const [purchasedItem, setPurchasedItem] = useState<DatabaseProduct | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- URL-BASED ROUTING ---
  const pathSegments = useMemo(() => {
    const path = location.pathname.replace(/^\/products\/?/, '');
    return path ? path.split('/') : [];
  }, [location.pathname]);

  const urlProductId = pathSegments[0] || null;
  const urlAction = pathSegments[1] || null; // 'checkout' | 'payment' | null

  // Active items for modals
  const allDatabases = useMemo(() => {
    if (dbList.length === 0) return DEFAULT_PRESET_DATABASES;
    // Gabungkan entri unik dari database dengan preset jika belum ada
    const combined = [...dbList];
    DEFAULT_PRESET_DATABASES.forEach(preset => {
      const exists = combined.some(item => 
        item.id === preset.id || 
        item.campus?.toLowerCase() === preset.campus.toLowerCase()
      );
      if (!exists) {
        combined.push(preset);
      }
    });
    return combined;
  }, [dbList]);

  const detailItem = useMemo(() => {
    if (!urlProductId || urlAction) return null;
    return allDatabases.find(i => i.id === urlProductId) || null;
  }, [urlProductId, urlAction, allDatabases]);

  const showInvoice = useMemo(() => {
    if (!urlProductId || urlAction !== 'checkout') return null;
    return allDatabases.find(i => i.id === urlProductId) || null;
  }, [urlProductId, urlAction, allDatabases]);

  const showPaymentProduct = useMemo(() => {
    if (!urlProductId || urlAction !== 'payment') return null;
    return allDatabases.find(i => i.id === urlProductId) || null;
  }, [urlProductId, urlAction, allDatabases]);

  // Track existing order ID from query params (for email deep links or checkout flow)
  const [existingOrderId, setExistingOrderId] = useState<string | undefined>(undefined);

  // Fetch Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getPublicDatabaseProducts();
        if (Array.isArray(data) && data.length > 0) {
          setDbList(data);
        } else {
          setDbList(DEFAULT_PRESET_DATABASES);
        }
      } catch (err) {
        console.error('Error fetching database products:', err);
        setDbList(DEFAULT_PRESET_DATABASES);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-open modal if returning from profile update
  useEffect(() => {
    if (initialSelectedProductId && allDatabases.length > 0) {
      const item = allDatabases.find(i => i.id === initialSelectedProductId);
      if (item) {
        navigate(`/products/${item.id}`, { replace: true });
      }
    }
  }, [initialSelectedProductId, allDatabases]);

  // Handle order_id deep link from Email CTA
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (orderId && user && allDatabases.length > 0) {
      const fetchOrderForPayment = async () => {
        try {
          const { data: order, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', orderId)
            .single();

          if (!error && order && order.status === 'pending') {
            const product = allDatabases.find(p => p.id === order.product_id);
            if (product) {
              setExistingOrderId(orderId);
              navigate(`/products/${product.id}/payment`, { replace: true });
            }
          } else if (order && order.status === 'paid') {
            alert('Tagihan ini sudah dibayarkan sebelumnya.');
            navigate('/products', { replace: true });
          }
        } catch (err) {
          console.error("Deep link payment fetch failed", err);
        }
      };
      fetchOrderForPayment();
    }
  }, [searchParams, user, allDatabases]);

  // Derived Cities
  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(allDatabases.map(i => i.city)));
    return ['Semua Kota', ...uniqueCities.sort()];
  }, [allDatabases]);

  // Derived Campuses
  const availableCampuses = useMemo(() => {
    const campuses = allDatabases
      .filter(i => selectedCity === 'Semua Kota' || i.city === selectedCity)
      .map(i => i.campus);
    return ['Semua Kampus', ...Array.from(new Set(campuses)).sort()];
  }, [selectedCity, allDatabases]);

  // Filtered & Sorted Databases
  const filteredDatabases = useMemo(() => {
    let result = allDatabases.filter(item => {
      // Search Term Match
      const s = searchTerm.toLowerCase().trim();
      const matchSearch = !s ||
        item.campus?.toLowerCase().includes(s) ||
        item.area?.toLowerCase().includes(s) ||
        item.city?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s);

      // City Filter Dropdown
      const matchCity = selectedCity === 'Semua Kota' || item.city?.toLowerCase() === selectedCity.toLowerCase();

      // Wilayah Pills Filter
      let matchWilayah = true;
      if (selectedWilayahPill === 'makassar') {
        matchWilayah = item.city?.toLowerCase().includes('makassar');
      } else if (selectedWilayahPill === 'gowa') {
        matchWilayah = item.city?.toLowerCase().includes('gowa') || item.area?.toLowerCase().includes('samata') || item.area?.toLowerCase().includes('bontomarannu');
      } else if (selectedWilayahPill === 'maros') {
        matchWilayah = item.city?.toLowerCase().includes('maros');
      }

      // Campus Dropdown Match
      const matchCampus = selectedCampus === 'Semua Kampus' || item.campus === selectedCampus;

      return matchSearch && matchCity && matchWilayah && matchCampus;
    });

    // Sorting
    result.sort((a, b) => {
      if (selectedSort === 'terbanyak') {
        return (b.totalData || 0) - (a.totalData || 0);
      } else if (selectedSort === 'termurah') {
        return (a.price || 0) - (b.price || 0);
      } else {
        return (b.id || '').localeCompare(a.id || '');
      }
    });

    return result;
  }, [searchTerm, selectedCity, selectedWilayahPill, selectedCampus, selectedSort, allDatabases]);

  const handleBuyNow = (item: DatabaseProduct) => {
    // 1. Check Login
    if (!user) {
      if (confirm("Anda harus login untuk membeli database ini. Login sekarang?")) {
        onLoginRedirect?.();
      }
      return;
    }

    // 2. Check Profile Completeness (via Parent Validator)
    if (validateProfile) {
      const isValid = validateProfile(item.id);
      if (!isValid) return;
    }

    navigate(`/products/${item.id}/checkout`);
  };

  const handleOpenDetail = (item: DatabaseProduct) => {
    navigate(`/products/${item.id}`);
  };

  // Helper metadata untuk mempercantik kartu klaster kampus sesuai referensi desain
  const getCampusMetadata = (item: DatabaseProduct) => {
    const name = (item.campus || '').toLowerCase();
    const area = (item.area || '').toLowerCase();

    if (name.includes('tamalanrea') || (name.includes('unhas') && !name.includes('teknik') && !name.includes('gowa'))) {
      return {
        title: 'UNHAS TAMALANREA',
        areaSubtitle: 'Area Tamalanrea (Pintu 1, Pintu 2, & Sahabat)',
        cityLabel: 'KOTA MAKASSAR',
        isFeatured: true,
        featuredBadge: 'AREA TERFAVORIT & TERPADAT',
        featuredSubtext: `${item.totalData || 346}+ KOST`,
        totalUnitText: `${item.totalData || 346} Unit`,
        priceRange: 'Rp 500rb - 2.5jt /bln',
        tags: [],
        progressWidth: '94%',
        updateYear: 'Update 2025'
      };
    }

    if (name.includes('teknik') || (name.includes('unhas') && (name.includes('gowa') || area.includes('bontomarannu')))) {
      return {
        title: 'UNHAS TEKNIK',
        areaSubtitle: 'Area Bontomarannu (Kampus 2 Fakultas Teknik)',
        cityLabel: 'KABUPATEN GOWA',
        isFeatured: false,
        featuredBadge: null,
        featuredSubtext: null,
        totalUnitText: `${item.totalData || 104}+ Unit`,
        priceRange: 'Rp 450rb - 1.8jt /bln',
        tags: ['Dekat Gerbang FT', 'Bebas Jam Malam'],
        progressWidth: '60%',
        updateYear: 'Update 2025'
      };
    }

    if (name.includes('umi') || name.includes('muslim indonesia')) {
      return {
        title: 'UMI (UNIVERSITAS MUSLIM INDONESIA)',
        areaSubtitle: 'Area Urip Sumoharjo & Pampang',
        cityLabel: 'KOTA MAKASSAR',
        isFeatured: false,
        featuredBadge: null,
        featuredSubtext: null,
        totalUnitText: `${item.totalData || 100}+ Unit`,
        priceRange: 'Rp 400rb - 2.0jt /bln',
        tags: [],
        progressWidth: '58%',
        updateYear: 'Update 2025'
      };
    }

    if (name.includes('bosowa') || name.includes('unibos')) {
      return {
        title: 'UNIBOS (UNIVERSITAS BOSOWA)',
        areaSubtitle: 'Area Urip Sumoharjo & Flyover',
        cityLabel: 'KOTA MAKASSAR',
        isFeatured: false,
        featuredBadge: null,
        featuredSubtext: null,
        totalUnitText: `${item.totalData || 100}+ Unit`,
        priceRange: 'Rp 500rb - 1.9jt /bln',
        tags: [],
        progressWidth: '58%',
        updateYear: 'Update 2025'
      };
    }

    if (name.includes('pnup') || name.includes('ujung pandang')) {
      return {
        title: 'PNUP KAMPUS 1',
        areaSubtitle: 'Politeknik Negeri Ujung Pandang - Tamalanrea',
        cityLabel: 'KOTA MAKASSAR',
        isFeatured: false,
        featuredBadge: null,
        featuredSubtext: null,
        totalUnitText: `${item.totalData || 170}+ Unit`,
        priceRange: 'Rp 450rb - 1.7jt /bln',
        tags: [],
        progressWidth: '75%',
        updateYear: 'Update 2025'
      };
    }

    if (name.includes('uin') || name.includes('alauddin') || name.includes('samata')) {
      return {
        title: 'UIN ALAUDDIN MAKASSAR SAMATA',
        areaSubtitle: 'Area Samata, Romangpolong & Sekitarnya',
        cityLabel: 'KABUPATEN GOWA',
        isFeatured: false,
        featuredBadge: null,
        featuredSubtext: null,
        totalUnitText: `${item.totalData || 175}+ Unit`,
        priceRange: 'Rp 400rb - 1.4jt /bln',
        tags: [],
        progressWidth: '78%',
        updateYear: 'Update 2025'
      };
    }

    // Default Fallback
    return {
      title: item.campus?.toUpperCase() || 'AREA KAMPUS',
      areaSubtitle: item.area ? `Area ${item.area}` : `Kota ${item.city || 'Makassar'}`,
      cityLabel: item.city?.toLowerCase().includes('gowa') ? 'KABUPATEN GOWA' : `KOTA ${(item.city || 'Makassar').toUpperCase()}`,
      isFeatured: false,
      featuredBadge: null,
      featuredSubtext: null,
      totalUnitText: `${item.totalData || 80}+ Unit`,
      priceRange: 'Rp 400rb - 2.0jt /bln',
      tags: [],
      progressWidth: `${Math.min(Math.round(((item.totalData || 80) / 350) * 100), 100)}%`,
      updateYear: 'Update 2025'
    };
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20 font-sans">
      {/* 1. HERO HEADER SECTION */}
      <section className="pt-10 sm:pt-14 lg:pt-16 pb-8 sm:pb-12 bg-gradient-to-b from-orange-50/40 via-white to-[#fcfdfe]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-[11px] font-black uppercase tracking-wider mb-4 sm:mb-5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>DATA DIRECTORY TERUPDATE JANUARI 2025</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.15] mb-3 sm:mb-4">
            E-Directory & Database <span className="text-orange-500 bg-clip-text">Kost Area Kampus</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 font-medium text-xs sm:text-sm lg:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Direktori hunian mahasiswa terintegrasi Makassar & Gowa. Dikumpulkan, dan diverifikasi langsung oleh tim enumerator lapangan.
          </p>

          {/* UNIFIED SEARCH & FILTER BAR */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-xl shadow-gray-200/60 border border-gray-100 flex flex-col md:flex-row items-center gap-2.5 sm:gap-3 mb-8">
            {/* Search Input */}
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kampus, jalan, atau nama kost..."
                className="w-full bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-orange-300 rounded-xl sm:rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* City Dropdown */}
            <div className="relative w-full md:w-44 shrink-0">
              <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedCampus('Semua Kampus');
                }}
                className="w-full bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-orange-300 rounded-xl sm:rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer transition-all"
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full md:w-36 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as any)}
                className="w-full bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-orange-300 rounded-xl sm:rounded-2xl pl-9 pr-8 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer transition-all"
              >
                <option value="terbanyak">Terbanyak</option>
                <option value="termurah">Termurah</option>
                <option value="terbaru">Terbaru</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Action Button */}
            <button
              type="button"
              onClick={() => {
                // Focus / trigger state refresh
              }}
              className="w-full md:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl sm:rounded-2xl text-xs font-black tracking-wider transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Zap size={14} className="fill-white" />
              <span>Filter Data</span>
            </button>
          </div>

          {/* 4 FEATURE STATS PILLS */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/70 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span><strong>6 Area Utama</strong> Kampus</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50/80 border border-amber-200/70 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span><strong>1.200+</strong> Kost Terdata Valid</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/70 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span><strong>100% Survey GPS</strong> & Lapangan</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
              <FileSpreadsheet size={13} className="text-emerald-600" />
              <span><strong>Format XLSX</strong> Siap Unduh</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. WILAYAH FILTER BAR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mr-1">
            WILAYAH:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedWilayahPill('semua');
              setSelectedCity('Semua Kota');
              setSelectedCampus('Semua Kampus');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWilayahPill === 'semua'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            Semua Area
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedWilayahPill('makassar');
              setSelectedCity('Makassar');
              setSelectedCampus('Semua Kampus');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWilayahPill === 'makassar'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            Makassar
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedWilayahPill('gowa');
              setSelectedCity('Gowa');
              setSelectedCampus('Semua Kampus');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWilayahPill === 'gowa'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            Gowa (Samata & Bontomarannu)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedWilayahPill('maros');
              setSelectedCity('Maros');
              setSelectedCampus('Semua Kampus');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWilayahPill === 'maros'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            Maros
          </button>

          {/* Quick Dropdown Kampus */}
          <div className="relative ml-auto">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-gray-700 appearance-none cursor-pointer focus:outline-none"
            >
              {availableCampuses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* 3. KATALOG AREA DIREKTORI (Campus Cluster Cards) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">
              KATALOG AREA DIREKTORI
            </h2>
            <span className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-700 text-[11px] font-black uppercase tracking-wider">
              {filteredDatabases.length} Klaster Kampus
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Semua data terverifikasi</span>
          </div>
        </div>

        <p className="text-gray-400 font-medium text-xs mb-6 -mt-4">
          Pilih klaster kampus untuk mengunduh arsip komprehensif atau tinjau ringkasan listing.
        </p>

        {/* CAMPUS CLUSTER GRID */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Memuat direktori data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredDatabases.map((item) => {
              const meta = getCampusMetadata(item);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-[1.75rem] border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-xs hover:shadow-xl hover:shadow-orange-500/10 ${
                    meta.isFeatured
                      ? 'border-orange-500 ring-2 ring-orange-500/20'
                      : 'border-gray-200/90 hover:border-orange-300'
                  }`}
                >
                  {/* Featured Header Banner if Applicable */}
                  {meta.isFeatured && (
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Star size={12} className="fill-white" />
                        {meta.featuredBadge}
                      </span>
                      <span>{meta.featuredSubtext}</span>
                    </div>
                  )}

                  {/* Card Main Body */}
                  <div className="p-6 space-y-4">
                    {/* Top Row: City Badge & Update Year */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-wider">
                        {meta.cityLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{meta.updateYear}</span>
                      </span>
                    </div>

                    {/* Campus Title & Specific Area */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight leading-snug">
                        {meta.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                        {meta.areaSubtitle}
                      </p>
                    </div>

                    {/* Metrics Box */}
                    <div className="space-y-3 pt-2">
                      {/* Density metric with progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-medium">Kepadatan Data Kost</span>
                          <span className="font-black text-gray-900">{meta.totalUnitText}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                            style={{ width: meta.progressWidth }}
                          ></div>
                        </div>
                      </div>

                      {/* Average price range */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Rentang Biaya Rata-rata</span>
                        <span className="font-bold text-gray-800">{meta.priceRange}</span>
                      </div>
                    </div>

                    {/* Highlight Tags if available */}
                    {meta.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {meta.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-200/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>DETAIL LISTING</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBuyNow(item)}
                      className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-95 shrink-0 cursor-pointer"
                      title="Unduh Spreadsheet XLSX"
                    >
                      <Download size={13} />
                      <span>XLS</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredDatabases.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} />
            </div>
            <h4 className="text-base font-black text-gray-900">Area Belum Ditemukan</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Tidak ada klaster kampus yang cocok dengan filter saat ini. Silakan atur ulang filter pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('Semua Kota');
                setSelectedWilayahPill('semua');
                setSelectedCampus('Semua Kampus');
              }}
              className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* 4. SAMPLE PREVIEW STRUKTUR DATA SPREADSHEET */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-[2rem] border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider">
                <FileSpreadsheet size={13} />
                <span>SAMPLE PREVIEW STRUKTUR DATA</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Contoh Baris Spreadsheet Excel (.xlsx) Terverifikasi
              </h3>
              <p className="text-xs text-gray-500">
                Berikut adalah cuplikan data riil enumerator kami. Anda mendapatkan spreadsheet tanpa sensor kontak WhatsApp setelah memesan paket.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shrink-0 self-start sm:self-auto">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Valid 100%</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">NAMA KOST</th>
                  <th className="py-3 px-4">AREA KAMPUS</th>
                  <th className="py-3 px-4">FASILITAS KOST</th>
                  <th className="py-3 px-4">TIPE KAMAR</th>
                  <th className="py-3 px-4">KONTAK PEMILIK (WA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-900">
                    Kost Pondok Al-Barokah
                    <span className="block text-[11px] font-normal text-gray-400 mt-0.5">Jl. Sahabat No. 14, Tamalanrea</span>
                  </td>
                  <td className="py-4 px-4 text-gray-800 font-semibold">UNHAS Tamalanrea</td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Area dalam kampus (Sahabat)
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">Putri (KM Dalam, Wifi, Kasur)</td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-gray-900">0812-6211-XXXX</span>
                    <span className="text-[10px] text-gray-400 font-normal ml-1.5">(Akses Penuh)</span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-900">
                    Wisma Harmoni Gowa
                    <span className="block text-[11px] font-normal text-gray-400 mt-0.5">Jl. Poros Malino Km. 4, Samata</span>
                  </td>
                  <td className="py-4 px-4 text-gray-800 font-semibold">UIN Alauddin Samata</td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Depan gerbang pintu 1 UIN
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">Putra / Campur (AC, Meja, Parkir)</td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-gray-900">0852-9988-XXXX</span>
                    <span className="text-[10px] text-gray-400 font-normal ml-1.5">(Akses Penuh)</span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-900">
                    Pondok Pelangi FT
                    <span className="block text-[11px] font-normal text-gray-400 mt-0.5">Dekat Gerbang FT Unhas Bontomarannu</span>
                  </td>
                  <td className="py-4 px-4 text-gray-800 font-semibold">UNHAS Teknik Gowa</td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Area depan fakultas teknik
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">Putra (KM Dalam, Listrik Token)</td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-gray-900">0821-XX71-XXXX</span>
                    <span className="text-[10px] text-gray-400 font-normal ml-1.5">(Akses Penuh)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 text-xs text-gray-500 font-medium">
            Membeli akses database memberikan file spreadsheet .XLSX lengkap dengan 1.200+ nomor WhatsApp pemilik kost aktif dan titik koordinat Google Maps.
          </div>
        </div>
      </section>

      {/* 5. KEUNGGULAN DIRECTORY SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-orange-500 font-black text-xs uppercase tracking-widest block mb-2">
            KEUNGGULAN DIRECTORY
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Mengapa Memilih Database Kost RuangSinggah?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h4 className="font-black text-gray-900 text-sm">Verifikasi Lapangan</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Disurvei langsung oleh enumerator lokal demi menjamin keaslian foto dan spesifikasi kamar.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall size={20} />
            </div>
            <h4 className="font-black text-gray-900 text-sm">Kontak Pemilik Langsung</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Akses nomor telepon dan WhatsApp induk memang tanpa perantara pihak ketiga.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <h4 className="font-black text-gray-900 text-sm">Jarak & Navigasi Titik GPS</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Dilengkapi koordinat Google Maps yang akurat dan estimasi jarak menuju pintu gerbang kampus.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Download size={20} />
            </div>
            <h4 className="font-black text-gray-900 text-sm">File Excel Siap Pakai</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Unduh spreadsheet lengkap yang dapat difilter dan disortir sesuai preferensi budget Anda.
            </p>
          </div>
        </div>
      </section>

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-md transition-opacity animate-in fade-in" 
            onClick={() => navigate('/products')}
          ></div>

          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-10 animate-in zoom-in-95 duration-200">
            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto">
              <div className="h-56 sm:h-64 bg-gray-900 relative">
                <img
                  src={detailItem.fileUrls?.coverImage?.webp || detailItem.fileUrls?.coverImage?.original || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                  className="w-full h-full object-cover opacity-80"
                  alt={detailItem.campus}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                {/* Close Button */}
                <button
                  onClick={() => navigate('/products')}
                  className="absolute top-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md border border-white/20 z-20 cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-5 left-6 right-6 text-white space-y-1">
                  <span className="bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">
                    EDISI 2025
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                    {detailItem.campus}
                  </h2>
                  <p className="text-xs text-white/80 font-medium">
                    {detailItem.city} • Area {detailItem.area}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Total Entri Data</p>
                    <p className="text-lg font-black text-gray-900">{detailItem.totalData}+ Unit Kost</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Metode Pendataan</p>
                    <p className="text-lg font-black text-gray-900">Survey Lapangan</p>
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-3">
                  <h4 className="text-[11px] font-black uppercase text-gray-900 tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Deskripsi Direktori
                  </h4>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">
                    {detailItem.description}
                  </p>
                  <div className="pt-2 border-t border-gray-200/60 space-y-2">
                    {[
                      'Nama Kost & Alamat Lengkap',
                      'Jenis Kost (Putra, Putri, Campur)',
                      'Spesifikasi Kamar & Fasilitas',
                      'Nomor WhatsApp Aktif Pemilik Kost',
                      'Titik Koordinat & Jarak ke Gerbang Kampus'
                    ].map((itemText, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{itemText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning note */}
                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Akses file spreadsheet (.xlsx) otomatis terkirim langsung ke email akun Anda setelah transaksi selesai diverifikasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="bg-white border-t border-gray-100 p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Biaya Akses</span>
                <p className="text-2xl font-black text-gray-900 tracking-tight">
                  {FORMAT_CURRENCY(detailItem.price)}
                  <span className="text-xs text-gray-400 font-bold uppercase ml-1">/sekali bayar</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleBuyNow(detailItem)}
                className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Download size={14} />
                <span>Beli & Unduh XLSX</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && user && (
        <InvoiceModal
          productName={`Database Kost ${showInvoice.campus || showInvoice.area || ''}`}
          price={showInvoice.price}
          userName={user.displayName || user.name || 'User'}
          userEmail={user.email}
          userId={user.id || user.uid}
          productId={showInvoice.id}
          productType="database"
          onProceedToPayment={() => {
            navigate(`/products/${showInvoice.id}/payment`);
          }}
          onCancel={() => navigate('/products')}
        />
      )}

      {/* Payment Gateway Modal */}
      {showPaymentProduct && (
        <PaymentGateway
          amount={showPaymentProduct.price}
          orderId={existingOrderId ? `ORD-${existingOrderId.substring(0,8).toUpperCase()}` : `DB-${showPaymentProduct.id.substring(0, 6).toUpperCase()}`}
          existingOrderId={existingOrderId}
          productId={showPaymentProduct.id}
          productType="database"
          userId={user?.id || user?.uid}
          metadata={{
            userName: user?.displayName || user?.name || 'Customer',
            userEmail: user?.email || '',
            userPhone: user?.phoneNumber || user?.phone || '',
            userAddress: user?.address || '',
            billName: `Database Kost ${showPaymentProduct.campus || showPaymentProduct.area || ''}`.trim(),
            bill_name: `Database Kost ${showPaymentProduct.campus || showPaymentProduct.area || ''}`.trim(),
          }}
          onPaymentSuccess={() => {
            setPurchasedItem(showPaymentProduct);
            setExistingOrderId(undefined);
            navigate('/products');
          }}
          onCancel={() => {
            setExistingOrderId(undefined);
            navigate('/products');
          }}
        />
      )}

      {/* Success Modal */}
      {purchasedItem && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setPurchasedItem(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Pembelian Berhasil!</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Terima kasih! Database <span className="font-bold text-gray-900">{purchasedItem.campus}</span> telah berhasil diproses dan dikirimkan ke email Anda.
            </p>
            <button
              onClick={() => setPurchasedItem(null)}
              className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-colors active:scale-95 cursor-pointer"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
