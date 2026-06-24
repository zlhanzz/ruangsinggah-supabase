
import React, { useState, useMemo, useCallback } from 'react';
import { Page, Kost, Banner } from '../types';
import KostCard from '../components/KostCard';
import PromoCarousel from '../components/PromoCarousel';
import QuickActionMenu from '../components/QuickActionMenu';
import { supabase } from '../supabase';
import FilterDrawer from '../components/FilterDrawer';
import { FilterState } from '../components/FilterControls';

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
    <div className="flex flex-col bg-gray-50 pb-20">
      <h1 className="sr-only">Ruang Singgah: Solusi Kost Terpercaya di Makassar - Cari Kost Mahasiswa Terverifikasi</h1>





      {/* Mobile Search Bar Trigger - Hidden on PC */}
      <div className="lg:hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 -mb-4">
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="w-full bg-white border border-gray-100 rounded-2xl py-3 px-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-tight text-gray-900 leading-none mb-1">Cari Kost Sekarang</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none truncate overflow-hidden">
               Beragam Wilayah & Dekat Kampus Idola...
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-200">
            <div className="h-3 w-[1px] bg-gray-100"></div>
            <span className="text-[9px] font-black uppercase tracking-widest px-2">Filter</span>
          </div>
        </button>
      </div>

      {/* Desktop Search Bar - Persistent Horizontal Bar for PC */}
      <div className="hidden lg:flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 -mb-4">
        <div className="w-full bg-white border-2 border-gray-100/80 rounded-[3rem] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] flex items-center gap-2 hover:border-orange-200 hover:shadow-[0_25px_70px_-12px_rgba(249,115,22,0.1)] transition-all duration-500 group/search-bar">
          {/* Section: Search */}
          <div className="flex-[1.5] flex items-center gap-5 px-6 py-2 hover:bg-orange-50/30 rounded-[2rem] transition-all cursor-text group">
            <div className="text-orange-500 bg-orange-50 p-3 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Lokasi / Nama</label>
              <input 
                type="text" 
                placeholder="Cari area atau kost..." 
                className="bg-transparent text-sm font-black text-gray-900 placeholder:text-gray-300 outline-none w-full"
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters();
                }}
              />
            </div>
          </div>

          <div className="h-10 w-[1px] bg-gray-100 shrink-0"></div>

          {/* Section: City */}
          <div className="flex-1 flex flex-col px-6 py-2 hover:bg-orange-50/30 rounded-[2rem] transition-all cursor-pointer">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Kota</label>
            <select 
              className="bg-transparent text-sm font-black text-gray-900 outline-none cursor-pointer appearance-none w-full"
              value={filters.selectedCity}
              onChange={(e) => updateFilters({ selectedCity: e.target.value, selectedCampus: 'Semua' })}
            >
              <option value="Semua">Semua Kota</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="h-10 w-[1px] bg-gray-100 shrink-0"></div>

          {/* Section: Campus */}
          <div className="flex-1 flex flex-col px-6 py-2 hover:bg-orange-50/30 rounded-[2rem] transition-all cursor-pointer">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Kampus</label>
            <select 
              className="bg-transparent text-sm font-black text-gray-900 outline-none cursor-pointer appearance-none w-full"
              value={filters.selectedCampus}
              onChange={(e) => updateFilters({ selectedCampus: e.target.value })}
            >
              <option value="Semua">Semua Kampus</option>
              {availableCampusesList.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>
          </div>

          <div className="h-10 w-[1px] bg-gray-100 shrink-0"></div>

          {/* Section: Type (Jenis Kost) */}
          <div className="flex-1 flex flex-col px-6 py-2 hover:bg-orange-50/30 rounded-[2rem] transition-all cursor-pointer">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Jenis Kost</label>
            <select 
              className="bg-transparent text-sm font-black text-gray-900 outline-none cursor-pointer appearance-none w-full"
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
            className="bg-gray-900 hover:bg-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0 ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
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

      <section className="bg-white py-6 sm:py-16 rounded-t-[2.5rem] sm:rounded-t-[4rem] -mt-6 relative z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 sm:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <span className="h-[2px] w-4 sm:w-8 bg-orange-500"></span>
                <span className="text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest">Rekomendasi Utama</span>
              </div>
              <h2 className="text-xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                Kost Pilihan <span className="text-gray-400">Hari Ini</span>
              </h2>
            </div>
            <button
              onClick={() => onPageChange(Page.LISTINGS)}
              className="flex items-center gap-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 group shrink-0"
            >
              <span className="hidden sm:inline">Lihat Katalog Lengkap</span>
              <span className="sm:hidden">Lihat Semua</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl border border-gray-50 overflow-hidden h-full flex flex-col animate-pulse shadow-sm">
                  <div className="bg-gray-100 aspect-[4/3] w-full"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-5 bg-gray-100 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-1/2"></div>
                    <div className="pt-2 flex gap-2">
                       <div className="h-8 bg-gray-50 rounded-xl w-1/4"></div>
                       <div className="h-8 bg-gray-50 rounded-xl w-1/4"></div>
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
              <div className="col-span-full text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="inline-flex p-6 rounded-full bg-white mb-4 shadow-sm">
                  <span className="text-3xl">🏠</span>
                </div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Belum ada kost terverifikasi untuk wilayah ini.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
