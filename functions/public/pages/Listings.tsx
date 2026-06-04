
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Kost } from '../types';
import KostCard from '../components/KostCard';
import { getRoomEffectivePrice } from '../userService';
import FilterDrawer from '../components/FilterDrawer';
import FilterControls, { FilterState } from '../components/FilterControls';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

interface ListingsProps {
  onKostClick?: (id: string) => void;
  listings?: Kost[];
  loading?: boolean;
  onDelete?: (id: string, type: 'kost' | 'database', name: string) => void;
  user?: any;
  onFilterToggle?: (isOpen: boolean) => void;
}

const Listings: React.FC<ListingsProps> = ({ onKostClick, listings = [], loading = false, onDelete, user, onFilterToggle }) => {
  const { search } = useLocation();
  const { campusSlug, areaSlug } = useParams<{ campusSlug?: string; areaSlug?: string }>();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    typeFilter: 'Semua',
    selectedCity: 'Semua',
    selectedCampus: 'Semua',
    maxPrice: 5000000,
  });
  
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Initialize and sync with URL query parameters & dynamic route parameters (pSEO)
  useEffect(() => {
    const qSearch = queryParams.get('search');
    const qCity = queryParams.get('city');
    const qCampus = queryParams.get('campus');
    const qType = queryParams.get('type');
    const qMaxPrice = queryParams.get('maxPrice');

    let finalCampus = qCampus || 'Semua';
    let finalSearch = qSearch || '';

    if (campusSlug && listings.length > 0) {
      const matched = listings.reduce((found, k) => {
        if (found) return found;
        if (k.campuses) {
          const c = k.campuses.find(c => slugify(c.name) === campusSlug.toLowerCase());
          if (c) return c.name;
        }
        return null;
      }, null as string | null);

      if (matched) {
        finalCampus = matched;
      } else {
        const campusMap: Record<string, string> = {
          unhas: 'Unhas',
          unm: 'UNM',
          umi: 'UMI',
          unibos: 'Unibos',
          uin: 'UIN Alauddin',
          pnup: 'PNUP',
          unismuh: 'Unismuh'
        };
        finalCampus = campusMap[campusSlug.toLowerCase()] || campusSlug;
      }
    }

    if (areaSlug && listings.length > 0) {
      const matchedArea = listings.find(k => k.area && slugify(k.area) === areaSlug.toLowerCase())?.area;
      if (matchedArea) {
        finalSearch = matchedArea;
      } else {
        finalSearch = areaSlug.replace(/-/g, ' ');
      }
    }

    setFilters(prev => ({
      ...prev,
      searchTerm: finalSearch || prev.searchTerm,
      selectedCity: qCity || prev.selectedCity,
      selectedCampus: finalCampus !== 'Semua' ? finalCampus : (qCampus || prev.selectedCampus),
      typeFilter: qType || prev.typeFilter,
      maxPrice: qMaxPrice ? parseInt(qMaxPrice) : prev.maxPrice,
    }));
  }, [queryParams, campusSlug, areaSlug, listings]);

  useEffect(() => {
    if (onFilterToggle) onFilterToggle(isMobileFilterOpen);
    return () => {
      if (onFilterToggle) onFilterToggle(false);
    };
  }, [isMobileFilterOpen, onFilterToggle]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Dynamically extract available cities from listings
  const availableCities = useMemo(() => {
    const cities = new Set(listings.map(k => k.city).filter(c => c && c.trim() !== ''));
    return Array.from(cities).sort();
  }, [listings]);

  // Dynamically extract available campuses based on selected city
  const availableCampuses = useMemo(() => {
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

  const filteredKosts = useMemo(() => {
    let result = [...listings];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(k => 
        k.title.toLowerCase().includes(searchLower) || 
        k.address.toLowerCase().includes(searchLower) ||
        (k.area && k.area.toLowerCase().includes(searchLower))
      );
    }

    if (filters.typeFilter !== 'Semua') {
      result = result.filter(k => k.type === filters.typeFilter);
    }

    if (filters.selectedCity !== 'Semua') {
      result = result.filter(k => k.city === filters.selectedCity);
    }

    if (filters.selectedCampus !== 'Semua') {
      result = result.filter(k => 
        k.campuses && k.campuses.some(c => c.name === filters.selectedCampus)
      );
    }

    result = result.filter(k => {
      let prices: number[] = [];
      if (k.roomTypes && k.roomTypes.length > 0) {
        const effectivePrices = k.roomTypes.map(getRoomEffectivePrice);
        const monthlyBased = effectivePrices.filter(p => p.priority <= 4);
        if (monthlyBased.length > 0) {
          prices = monthlyBased.map(p => p.price);
        } else {
          prices = effectivePrices.map(p => p.price);
        }
      } else {
        prices = [Number(k.price) || 0];
      }
      const minVariantPrice = Math.min(...prices);
      return minVariantPrice <= filters.maxPrice;
    });

    return result;
  }, [filters, listings]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.typeFilter !== 'Semua') count++;
    if (filters.selectedCity !== 'Semua') count++;
    if (filters.selectedCampus !== 'Semua') count++;
    if (filters.maxPrice < 5000000) count++;
    return count;
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      typeFilter: 'Semua',
      selectedCity: 'Semua',
      selectedCampus: 'Semua',
      maxPrice: 5000000,
    });
  };

  const seoMetadata = useMemo(() => {
    let title = "Cari Kost Murah Makassar Terverifikasi - RuangSinggah.id";
    let description = "Cari kost murah terdekat di Makassar dengan mudah! Kamar kost putra, putri, dan campur terverifikasi lapangan 100%. Booking online aman & survey jujur di RuangSinggah.id.";
    let canonical = "https://ruangsinggah.id/listings";

    if (campusSlug) {
      const campusMap: Record<string, string> = {
        unhas: 'Unhas (Universitas Hasanuddin)',
        unm: 'UNM (Universitas Negeri Makassar)',
        umi: 'UMI (Universitas Muslim Indonesia)',
        unibos: 'Unibos (Universitas Bosowa)',
        uin: 'UIN Alauddin',
        pnup: 'PNUP (Politeknik Negeri Ujung Pandang)',
        unismuh: 'Unismuh (Universitas Muhammadiyah Makassar)'
      };
      // Get readable name
      let campusName = campusSlug;
      if (filters.selectedCampus && filters.selectedCampus !== 'Semua') {
        campusName = filters.selectedCampus;
      } else {
        campusName = campusMap[campusSlug.toLowerCase()] || campusSlug.toUpperCase();
      }

      title = `Kost Dekat ${campusName} Makassar Murah Terverifikasi - RuangSinggah.id`;
      description = `Cari kost dekat kampus ${campusName} Makassar murah dan terverifikasi 100% bebas zonk. Dapatkan pilihan kost putra, putri, dan campur terbaik dengan fasilitas lengkap di RuangSinggah.id.`;
      canonical = `https://ruangsinggah.id/kost-dekat/${campusSlug.toLowerCase()}`;
    } else if (areaSlug) {
      let areaName = areaSlug.replace(/-/g, ' ');
      if (filters.searchTerm) {
        areaName = filters.searchTerm;
      }
      // Capitalize
      areaName = areaName.replace(/\b\w/g, c => c.toUpperCase());

      title = `Kost Area ${areaName} Makassar Murah Terverifikasi - RuangSinggah.id`;
      description = `Daftar kost murah terdekat di area ${areaName} Makassar. Temukan hunian kos putra, putri, campur dengan fasilitas lengkap dan terverifikasi lapangan di RuangSinggah.id.`;
      canonical = `https://ruangsinggah.id/kost-area/${areaSlug.toLowerCase()}`;
    } else if (filters.selectedCampus !== 'Semua') {
      title = `Kost Dekat Kampus ${filters.selectedCampus} Makassar Murah - RuangSinggah.id`;
      description = `Cari kost dekat kampus ${filters.selectedCampus} Makassar. Dapatkan kos putra, putri, campur terverifikasi lapangan di RuangSinggah.id.`;
    } else if (filters.searchTerm) {
      title = `Kost Dekat ${filters.searchTerm} Makassar Murah - RuangSinggah.id`;
      description = `Temukan kost murah terdekat di sekitar ${filters.searchTerm} Makassar. Ulasan jujur, bebas penipuan, verifikasi lapangan 100% di RuangSinggah.id.`;
    }

    return { title, description, canonical };
  }, [campusSlug, areaSlug, filters.selectedCampus, filters.searchTerm]);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{seoMetadata.title}</title>
        <meta name="description" content={seoMetadata.description} />
        <link rel="canonical" href={seoMetadata.canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoMetadata.title} />
        <meta property="og:description" content={seoMetadata.description} />
        <meta property="og:url" content={seoMetadata.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://ruangsinggah.id/logo.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={seoMetadata.title} />
        <meta name="twitter:description" content={seoMetadata.description} />
        <meta name="twitter:image" content="https://ruangsinggah.id/logo.png" />
      </Helmet>
       {/* MOBILE STICKY FILTER BAR */}
      <div className="lg:hidden sticky top-[80px] z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 shadow-sm transition-all">
        <button 
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full bg-white border border-gray-200 rounded-full py-3 px-5 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4"
        >
           <div className="text-orange-500 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
           </div>
           <div className="text-left flex-1">
               <p className="text-xs font-black uppercase tracking-tight text-gray-900 leading-none mb-1">CARI KOST SEKARANG</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none truncate">
                  {activeFilterCount > 0 ? `${activeFilterCount} Filter Aktif` : 'FILTER KOTA & KAMPUS...'}
               </p>
           </div>
           {activeFilterCount > 0 && (
             <div className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0">
               {activeFilterCount}
             </div>
           )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-12 pb-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* DESKTOP SIDEBAR FILTER */}
            <aside className="hidden lg:block w-1/4 sticky top-24 z-30">
                <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 p-6">
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Filter</h3>
                    </div>
                    <FilterControls 
                      filters={filters}
                      setFilters={updateFilters}
                      availableCities={availableCities}
                      availableCampuses={availableCampuses}
                      onReset={resetFilters}
                      showApplyButton={false}
                    />
                </div>
            </aside>

            {/* MOBILE FILTER DRAWER */}
            <FilterDrawer 
               isOpen={isMobileFilterOpen}
               onClose={() => setIsMobileFilterOpen(false)}
               onApply={() => setIsMobileFilterOpen(false)}
               filters={filters}
               setFilters={updateFilters}
               onReset={resetFilters}
               availableCities={availableCities}
               availableCampuses={availableCampuses}
            />

            {/* RESULTS GRID */}
            <main className="w-full lg:w-3/4">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <h2 className="text-xl lg:text-3xl font-black text-gray-900 uppercase tracking-tight">Hasil Pencarian</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {filters.selectedCity !== 'Semua' ? filters.selectedCity : 'Semua Kota'} 
                          {filters.selectedCampus !== 'Semua' ? ` • ${filters.selectedCampus}` : ''}
                      </p>
                   </div>
                   <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                      {filteredKosts.length} Unit
                   </span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
                                <div className="bg-gray-200 aspect-[4/3] w-full"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredKosts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredKosts.map(kost => (
                            <KostCard key={kost.id} kost={kost} onClick={onKostClick} onDelete={onDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-gray-900 font-black text-sm uppercase tracking-tight">Tidak ada kost ditemukan</p>
                        <p className="text-gray-400 text-xs mt-1">Coba kurangi filter atau cari area lain</p>
                        <button onClick={resetFilters} className="mt-4 text-orange-500 text-xs font-bold uppercase tracking-widest hover:underline">Reset Filter</button>
                    </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default Listings;
