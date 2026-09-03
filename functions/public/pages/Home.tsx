
import React, { useState, useMemo } from 'react';
import { Page, Kost, Banner } from '../types';
import KostCard from '../components/KostCard';
import PromoCarousel from '../components/PromoCarousel';
import QuickActionMenu from '../components/QuickActionMenu';
import { supabase } from '../supabase';
import FilterDrawer from '../components/FilterDrawer';
import { FilterState } from '../components/FilterControls';
import { Search, ChevronRight } from 'lucide-react';

interface HomeProps {
  onPageChange: (page: Page | string) => void;
  onKostSelect?: (id: string) => void;
  user?: any;
  listings?: Kost[];
  loading?: boolean;
}

const Home: React.FC<HomeProps> = ({ onPageChange, onKostSelect, user, listings = [], loading = false }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    typeFilter: 'Semua',
    selectedCity: 'Semua',
    selectedCampus: 'Semua',
    maxPrice: 5000000,
  });

  const featuredKosts = listings.filter(k => k.isVerified || k.isManaged).slice(0, 3);

  React.useEffect(() => {
    const fetchBanners = async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
        
      if (!error && data) {
        setBanners(data);
      }
    };
    fetchBanners();
  }, []);

  const availableCities = useMemo(() => {
    const cities = new Set(listings.map(k => k.city).filter(c => c && c.trim() !== ''));
    return Array.from(cities).sort();
  }, [listings]);

  const availableCampusesList = useMemo(() => {
    let relevantListings = listings;
    if (filters.selectedCity !== 'Semua') {
      relevantListings = listings.filter(k => k.city === filters.selectedCity);
    }
    const campuses = new Set<string>();
    relevantListings.forEach(k => {
      if (k.campuses) {
        k.campuses.forEach(c => {
          if (c.name && c.name.trim() !== '') {
            campuses.add(c.name);
          }
        });
      }
    });
    return Array.from(campuses).sort();
  }, [listings, filters.selectedCity]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.append('search', filters.searchTerm);
    if (filters.selectedCity !== 'Semua') params.append('city', filters.selectedCity);
    if (filters.selectedCampus !== 'Semua') params.append('campus', filters.selectedCampus);
    if (filters.typeFilter !== 'Semua') params.append('type', filters.typeFilter);
    if (filters.maxPrice < 5000000) params.append('maxPrice', filters.maxPrice.toString());

    const queryString = params.toString();
    const targetPath = queryString ? `${Page.LISTINGS}?${queryString}` : Page.LISTINGS;
    onPageChange(targetPath);
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="flex flex-col bg-[#f8f9ff] min-h-screen pb-24 text-[#0b1c30]">
      <h1 className="sr-only">RuangSinggah.id: Solusi Kost Terpercaya di Makassar - Cari Kost Mahasiswa Terverifikasi</h1>

      {/* Hero & Search Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-2 overflow-x-clip">
        {/* Mobile Search Bar (Compact Single-Row Card) */}
        <div className="md:hidden bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-2.5 flex items-center justify-between border border-gray-100/90 mb-3 relative z-20">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#ff7a00] shrink-0">
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              placeholder="CARI KOST SEKARANG" 
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold text-[#0b1c30] placeholder:text-gray-400 uppercase tracking-wider outline-none"
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilters();
              }}
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-1.5 pl-3 border-l border-gray-200 text-[11px] font-extrabold text-[#0b1c30] hover:text-[#ff7a00] shrink-0 uppercase tracking-wider cursor-pointer"
          >
            FILTER
          </button>
        </div>

        {/* Desktop Floating Search Bar (4-Segment Bar) */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-3.5 sm:p-4 md:p-5 flex-row items-center gap-3 md:gap-4 relative z-20 -mb-6 md:-mb-8 max-w-6xl mx-auto border border-gray-100">
          
          {/* Section: Lokasi / Nama */}
          <div className="flex items-center gap-3 flex-[1.4] min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#e5eeff] flex items-center justify-center shrink-0 text-[#ff7a00]">
              <Search size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col w-full min-w-0">
              <span className="text-[10px] font-bold text-[#8c7263] uppercase tracking-wider leading-none mb-1">
                LOKASI / NAMA
              </span>
              <input 
                type="text" 
                placeholder="Cari area atau kost..." 
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#0b1c30] placeholder:text-gray-400 outline-none"
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters();
                }}
              />
            </div>
          </div>

          <div className="w-px h-10 bg-gray-200/80 mx-1 shrink-0"></div>

          {/* Section: Kota (Desktop) */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-bold text-[#8c7263] uppercase tracking-wider leading-none mb-1">
              KOTA
            </span>
            <select 
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#0b1c30] outline-none cursor-pointer appearance-none"
              value={filters.selectedCity}
              onChange={(e) => updateFilters({ selectedCity: e.target.value, selectedCampus: 'Semua' })}
            >
              <option value="Semua">Semua Kota</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-10 bg-gray-200/80 mx-1 shrink-0"></div>

          {/* Section: Kampus (Desktop) */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-bold text-[#8c7263] uppercase tracking-wider leading-none mb-1">
              KAMPUS
            </span>
            <select 
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#0b1c30] outline-none cursor-pointer appearance-none"
              value={filters.selectedCampus}
              onChange={(e) => updateFilters({ selectedCampus: e.target.value })}
            >
              <option value="Semua">Semua Kampus</option>
              {availableCampusesList.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-10 bg-gray-200/80 mx-1 shrink-0"></div>

          {/* Section: Jenis Kost (Desktop) */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-bold text-[#8c7263] uppercase tracking-wider leading-none mb-1">
              JENIS KOST
            </span>
            <select 
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#0b1c30] outline-none cursor-pointer appearance-none"
              value={filters.typeFilter}
              onChange={(e) => updateFilters({ typeFilter: e.target.value })}
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
              <option value="Campur">Campur</option>
            </select>
          </div>

          {/* Search Button (Desktop: Circle Button) */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleApplyFilters}
              className="w-12 h-12 bg-[#0b1c30] hover:bg-[#ff7a00] text-white rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm active:scale-95 cursor-pointer ml-2 font-bold"
              title="Cari Sekarang"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Promo Carousel Banner (Stacked 3D Perspective on Desktop / Clean Single on Mobile) */}
        <PromoCarousel 
          banners={banners} 
          onBannerClick={(link) => {
            if (link.startsWith('http')) window.open(link, '_blank');
            else onPageChange(link as Page);
          }} 
        />
      </section>

      {/* Filter Drawer for Mobile Advanced Filtering */}
      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        filters={filters}
        setFilters={updateFilters}
        onReset={() => setFilters({
          searchTerm: '',
          typeFilter: 'Semua',
          selectedCity: 'Semua',
          selectedCampus: 'Semua',
          maxPrice: 5000000,
        })}
        availableCities={availableCities}
        availableCampuses={availableCampusesList}
      />

      {/* Menu Utama & Fitur */}
      <QuickActionMenu onAction={(page) => onPageChange(page)} />

      {/* Section: Rekomendasi Utama / Pilihan Hari Ini */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4 md:mt-6">
        <div className="flex items-center justify-between gap-4 border-t border-gray-200/80 pt-6 md:pt-8 mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-0.5 bg-[#ff7a00]"></div>
              <span className="text-[10px] md:text-[11px] font-extrabold text-[#ff7a00] tracking-widest uppercase">
                REKOMENDASI UTAMA
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0b1c30] uppercase tracking-tight">
              PILIHAN <span className="text-[#8c7263] font-bold">HARI INI</span>
            </h2>
          </div>
          <button
            onClick={() => onPageChange(Page.LISTINGS)}
            className="inline-flex items-center gap-1 text-[#ff7a00] font-bold text-[11px] sm:text-xs uppercase tracking-wider bg-[#ffece0] hover:bg-[#ff7a00] hover:text-white px-3.5 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <span>LIHAT SEMUA</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse shadow-xs">
                <div className="bg-gray-100 aspect-[4/3] w-full"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded-lg w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2"></div>
                  <div className="pt-2 flex gap-2">
                     <div className="h-6 bg-gray-50 rounded-lg w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            featuredKosts.map((kost) => (
              <KostCard key={kost.id} kost={kost} onClick={onKostSelect} />
            ))
          )}

          {!loading && featuredKosts.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-2xs">
              <div className="inline-flex p-5 rounded-full bg-orange-50 text-orange-500 mb-3 shadow-xs">
                <span className="text-2xl">🏠</span>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Belum ada kost terverifikasi untuk rekomendasi saat ini.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Home;
