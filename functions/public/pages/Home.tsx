
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
    <div className="flex flex-col bg-[#f8f9ff] min-h-screen pb-24">
      <h1 className="sr-only">Ruang Singgah: Solusi Kost Terpercaya di Makassar - Cari Kost Mahasiswa Terverifikasi</h1>

      {/* Mobile Search Bar Trigger - Hidden on PC */}
      <div className="lg:hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-5 mb-2">
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="w-full bg-white border border-gray-100 rounded-2xl py-3 px-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group active:scale-[0.98] cursor-pointer"
        >
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-tight text-gray-900 leading-none mb-1">CARI KOST SEKARANG</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none truncate overflow-hidden">
               Beragam Wilayah & Dekat Kampus Idola...
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <div className="h-4 w-px bg-gray-200"></div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 text-gray-600 group-hover:text-orange-500 transition-colors">FILTER</span>
          </div>
        </button>
      </div>

      {/* Desktop Search Bar - Horizontal Floating Pill Bar for PC */}
      <div className="hidden lg:flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-7 mb-2">
        <div className="w-full bg-white border border-gray-100 rounded-full p-3 shadow-md flex items-center gap-2 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
          {/* Section: Search Term */}
          <div className="flex-[1.4] flex items-center gap-4 px-5 py-1 rounded-full transition-all cursor-text group">
            <div className="text-orange-500 bg-orange-50 p-2.5 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shrink-0">
              <Search size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Lokasi / Nama</label>
              <input 
                type="text" 
                placeholder="Cari area atau kost..." 
                className="bg-transparent text-sm font-bold text-gray-900 placeholder:text-gray-300 outline-none w-full"
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters();
                }}
              />
            </div>
          </div>

          <div className="h-8 w-px bg-gray-100 shrink-0"></div>

          {/* Section: City */}
          <div className="flex-1 flex flex-col px-5 py-1 rounded-full transition-all cursor-pointer">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Kota</label>
            <select 
              className="bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer appearance-none w-full"
              value={filters.selectedCity}
              onChange={(e) => updateFilters({ selectedCity: e.target.value, selectedCampus: 'Semua' })}
            >
              <option value="Semua">Semua Kota</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="h-8 w-px bg-gray-100 shrink-0"></div>

          {/* Section: Campus */}
          <div className="flex-1 flex flex-col px-5 py-1 rounded-full transition-all cursor-pointer">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Kampus</label>
            <select 
              className="bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer appearance-none w-full"
              value={filters.selectedCampus}
              onChange={(e) => updateFilters({ selectedCampus: e.target.value })}
            >
              <option value="Semua">Semua Kampus</option>
              {availableCampusesList.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>
          </div>

          <div className="h-8 w-px bg-gray-100 shrink-0"></div>

          {/* Section: Type (Jenis Kost) */}
          <div className="flex-1 flex flex-col px-5 py-1 rounded-full transition-all cursor-pointer">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Jenis Kost</label>
            <select 
              className="bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer appearance-none w-full"
              value={filters.typeFilter}
              onChange={(e) => updateFilters({ typeFilter: e.target.value })}
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
              <option value="Campur">Campur</option>
            </select>
          </div>

          {/* Search Button */}
          <button 
            onClick={handleApplyFilters}
            className="bg-[#0b1c30] hover:bg-[#ff7a00] text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0 ml-1 cursor-pointer"
            title="Cari Kost"
          >
            <Search size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

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

      <PromoCarousel 
        banners={banners} 
        onBannerClick={(link) => {
          if (link.startsWith('http')) window.open(link, '_blank');
          else onPageChange(link as Page);
        }} 
      />

      <QuickActionMenu onAction={(page) => onPageChange(page)} />

      {/* Section: Rekomendasi Utama / Kost Pilihan Hari Ini */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4">
        <div className="border-t border-gray-200/60 pt-6 mb-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-0.5 w-5 bg-orange-500"></span>
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest">Rekomendasi Utama</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0b1c30] tracking-tight uppercase">
                <span className="sm:hidden">Pilihan <span className="text-gray-400">Hari Ini</span></span>
                <span className="hidden sm:inline">Kost Pilihan <span className="text-orange-500">Hari Ini</span></span>
              </h2>
            </div>
            <button
              onClick={() => onPageChange(Page.LISTINGS)}
              className="flex items-center gap-1.5 bg-orange-50/80 hover:bg-orange-500 text-orange-600 hover:text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0 border border-orange-100"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-2xs">
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
