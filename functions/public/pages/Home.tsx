
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

  const featuredKosts = listings.filter(k => k.isVerified).slice(0, 3);

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
    const campuses = new Set(relevantListings.map(k => k.campus).filter(c => c && c.trim() !== ''));
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

      <div className="bg-white pt-6 pb-2 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Explore</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">Beranda Utama</h2>
          </div>
          {user && (
            <div className="text-right hidden sm:block">
              <span className="text-xs text-gray-400 block font-bold uppercase tracking-widest">Selamat Datang</span>
              <span className="text-sm font-black text-gray-800">{user.displayName || 'Pengguna'}</span>
            </div>
          )}
        </div>
      </div>

      <PromoCarousel 
        banners={banners} 
        onBannerClick={(link) => {
          if (link.startsWith('http')) window.open(link, '_blank');
          else onPageChange(link as Page);
        }} 
      />

      {/* Search Bar Trigger - Integrated naturally into the layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 -mb-4">
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
          <div className="hidden sm:flex items-center gap-2 text-gray-200">
            <div className="h-3 w-[1px] bg-gray-100"></div>
            <span className="text-[9px] font-black uppercase tracking-widest px-2">Filter</span>
          </div>
        </button>
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

      <QuickActionMenu onAction={(page) => onPageChange(page)} />

      <section className="bg-white py-8 sm:py-16 rounded-t-[3rem] sm:rounded-t-[4rem] -mt-6 relative z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="h-[2px] w-8 bg-orange-500"></span>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Rekomendasi Utama</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-tight">
                Kost Pilihan <br className="sm:hidden" /> <span className="text-gray-400">Hari Ini</span>
              </h2>
            </div>
            <button
              onClick={() => onPageChange(Page.LISTINGS)}
              className="mt-6 md:mt-0 flex items-center gap-4 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 group"
            >
              Lihat Katalog Lengkap
              <span className="h-2 w-2 rounded-full bg-orange-500 group-hover:bg-white animate-pulse"></span>
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

      <section className="bg-white pt-10 pb-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] leading-loose">
            RuangSinggah.id adalah platform pencarian kost mahasiswa terverifikasi. <br /> Beroperasi utama di Makassar untuh kemudahan hunian akademisi.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
