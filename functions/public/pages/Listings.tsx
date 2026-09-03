import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Kost } from '../types';
import KostCard from '../components/KostCard';
import { getFilteredProperties, getAvailableFilterOptions } from '../userService';
import FilterDrawer from '../components/FilterDrawer';
import FilterControls, { FilterState } from '../components/FilterControls';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Frown, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 9; // 3 Baris x 3 Kolom pada Desktop

const defaultFilters: FilterState = {
  searchTerm: '',
  typeFilter: 'Semua',
  selectedProvince: 'Semua',
  selectedCity: 'Semua',
  selectedDistrict: 'Semua',
  selectedCampus: 'Semua',
  maxPrice: 5000000,
};

interface ListingsProps {
  onKostClick?: (id: string) => void;
  listings?: Kost[];
  loading?: boolean;
  onDelete?: (id: string, type: 'kost' | 'database', name: string) => void;
  user?: any;
  onFilterToggle?: (isOpen: boolean) => void;
}

const Listings: React.FC<ListingsProps> = ({ onKostClick, listings: initialListings = [], loading: initialLoading = false, onDelete, user, onFilterToggle }) => {
  const { search } = useLocation();
  const { campusSlug, areaSlug } = useParams<{ campusSlug?: string; areaSlug?: string }>();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  // Draft Filters (Edited in Form without immediate query execution)
  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters);

  // Applied Filters (Trigger the actual Supabase database query)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);

  // Server-Side Data & Pagination State
  const [kosts, setKosts] = useState<Kost[]>(initialListings.slice(0, ITEMS_PER_PAGE));
  const [totalCount, setTotalCount] = useState<number>(initialListings.length);
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Dynamic Filter Options from Database
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCampuses, setAvailableCampuses] = useState<string[]>([]);

  // Fetch available filter options (Provinces, Cities, Districts, Campuses) on mount
  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        const { provinces, cities, districts, campuses } = await getAvailableFilterOptions();
        if (isMounted) {
          if (provinces.length > 0) setAvailableProvinces(provinces);
          if (cities.length > 0) setAvailableCities(cities);
          if (districts.length > 0) setAvailableDistricts(districts);
          if (campuses.length > 0) setAvailableCampuses(campuses);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadOptions();
    return () => { isMounted = false; };
  }, []);

  // Sync route parameters & URL query params into filters on initial load
  useEffect(() => {
    const qSearch = queryParams.get('search');
    const qProvince = queryParams.get('province');
    const qCity = queryParams.get('city');
    const qDistrict = queryParams.get('district');
    const qCampus = queryParams.get('campus');
    const qType = queryParams.get('type');
    const qMaxPrice = queryParams.get('maxPrice');

    let finalCampus = qCampus || 'Semua';
    let finalSearch = qSearch || '';

    if (campusSlug) {
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

    if (areaSlug) {
      finalSearch = areaSlug.replace(/-/g, ' ');
    }

    const newFilters: FilterState = {
      searchTerm: finalSearch || defaultFilters.searchTerm,
      typeFilter: qType || defaultFilters.typeFilter,
      selectedProvince: qProvince || defaultFilters.selectedProvince,
      selectedCity: qCity || defaultFilters.selectedCity,
      selectedDistrict: qDistrict || defaultFilters.selectedDistrict,
      selectedCampus: finalCampus !== 'Semua' ? finalCampus : (qCampus || defaultFilters.selectedCampus),
      maxPrice: qMaxPrice ? parseInt(qMaxPrice) : defaultFilters.maxPrice,
    };

    setDraftFilters(newFilters);
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  }, [queryParams, campusSlug, areaSlug]);

  // Execute Database Backend Query ONLY when appliedFilters or currentPage changes
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const fetchProperties = async () => {
      try {
        const { kosts: fetchedKosts, totalCount: fetchedTotal } = await getFilteredProperties({
          searchTerm: appliedFilters.searchTerm,
          typeFilter: appliedFilters.typeFilter,
          selectedProvince: appliedFilters.selectedProvince,
          selectedCity: appliedFilters.selectedCity,
          selectedDistrict: appliedFilters.selectedDistrict,
          selectedCampus: appliedFilters.selectedCampus,
          maxPrice: appliedFilters.maxPrice,
          page: currentPage,
          limit: ITEMS_PER_PAGE
        });

        if (!isCancelled) {
          setKosts(fetchedKosts);
          setTotalCount(fetchedTotal);
        }
      } catch (err) {
        console.error('Error fetching backend filtered properties:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProperties();

    return () => {
      isCancelled = true;
    };
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    if (onFilterToggle) onFilterToggle(isMobileFilterOpen);
    return () => {
      if (onFilterToggle) onFilterToggle(false);
    };
  }, [isMobileFilterOpen, onFilterToggle]);

  const updateDraftFilters = (newFilters: Partial<FilterState>) => {
    setDraftFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentPage(1);
    setIsMobileFilterOpen(false);

    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
    setIsMobileFilterOpen(false);
  };

  // Pagination calculations based on backend total count
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const startIndex = totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    
    // Smooth scroll to top of results
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate pagination numbers array with smart ellipsis
  const getPaginationNumbers = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) {
      if (i > 1 && i < totalPages) range.push(i);
    }
    if (right < totalPages - 1) range.push('...');
    if (totalPages > 1) range.push(totalPages);

    return range;
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.searchTerm) count++;
    if (appliedFilters.typeFilter !== 'Semua') count++;
    if (appliedFilters.selectedProvince !== 'Semua') count++;
    if (appliedFilters.selectedCity !== 'Semua') count++;
    if (appliedFilters.selectedDistrict !== 'Semua') count++;
    if (appliedFilters.selectedCampus !== 'Semua') count++;
    if (appliedFilters.maxPrice < 5000000) count++;
    return count;
  }, [appliedFilters]);

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
      let campusName = campusSlug;
      if (appliedFilters.selectedCampus && appliedFilters.selectedCampus !== 'Semua') {
        campusName = appliedFilters.selectedCampus;
      } else {
        campusName = campusMap[campusSlug.toLowerCase()] || campusSlug.toUpperCase();
      }

      title = `Kost Dekat ${campusName} Makassar Murah Terverifikasi - RuangSinggah.id`;
      description = `Cari kost dekat kampus ${campusName} Makassar murah dan terverifikasi 100% bebas zonk. Dapatkan pilihan kost putra, putri, dan campur terbaik dengan fasilitas lengkap di RuangSinggah.id.`;
      canonical = `https://ruangsinggah.id/kost-dekat/${campusSlug.toLowerCase()}`;
    } else if (areaSlug) {
      let areaName = areaSlug.replace(/-/g, ' ');
      if (appliedFilters.searchTerm) {
        areaName = appliedFilters.searchTerm;
      }
      areaName = areaName.replace(/\b\w/g, c => c.toUpperCase());

      title = `Kost Area ${areaName} Makassar Murah Terverifikasi - RuangSinggah.id`;
      description = `Daftar kost murah terdekat di area ${areaName} Makassar. Temukan hunian kos putra, putri, campur dengan fasilitas lengkap dan terverifikasi lapangan di RuangSinggah.id.`;
      canonical = `https://ruangsinggah.id/kost-area/${areaSlug.toLowerCase()}`;
    } else if (appliedFilters.selectedCampus !== 'Semua') {
      title = `Kost Dekat Kampus ${appliedFilters.selectedCampus} Makassar Murah - RuangSinggah.id`;
      description = `Cari kost dekat kampus ${appliedFilters.selectedCampus} Makassar. Dapatkan kos putra, putri, campur terverifikasi lapangan di RuangSinggah.id.`;
    } else if (appliedFilters.searchTerm) {
      title = `Kost Dekat ${appliedFilters.searchTerm} Makassar Murah - RuangSinggah.id`;
      description = `Temukan kost murah terdekat di sekitar ${appliedFilters.searchTerm} Makassar. Ulasan jujur, bebas penipuan, verifikasi lapangan 100% di RuangSinggah.id.`;
    }

    return { title, description, canonical };
  }, [campusSlug, areaSlug, appliedFilters.selectedCampus, appliedFilters.searchTerm]);

  return (
    <div className="min-h-screen bg-white font-sans">
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
          onClick={() => {
            setDraftFilters(appliedFilters);
            setIsMobileFilterOpen(true);
          }}
          className="w-full bg-white border border-gray-200 rounded-full py-3 px-5 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4 cursor-pointer"
        >
           <div className="text-[#ff7a00] shrink-0">
              <Search className="w-5 h-5 stroke-[2.5]" />
           </div>
           <div className="text-left flex-1">
               <p className="text-xs font-black uppercase tracking-tight text-gray-900 leading-none mb-1">CARI & FILTER KOST</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none truncate">
                  {activeFilterCount > 0 ? `${activeFilterCount} Filter Aktif` : 'PROVINSI, KOTA, KECAMATAN, KAMPUS...'}
               </p>
           </div>
           {activeFilterCount > 0 && (
             <div className="bg-[#ff7a00] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0">
               {activeFilterCount}
             </div>
           )}
        </button>
      </div>

      <div ref={resultsTopRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-12 pb-16">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* DESKTOP SIDEBAR FILTER */}
            <aside className="hidden lg:block w-1/4 sticky top-24 z-30">
                <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 p-6 shadow-xs">
                    <div className="mb-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Filter</h3>
                        {activeFilterCount > 0 && (
                          <span className="bg-orange-50 border border-orange-200 text-[#ff7a00] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            {activeFilterCount} Aktif
                          </span>
                        )}
                    </div>
                    <FilterControls 
                      filters={draftFilters}
                      setFilters={updateDraftFilters}
                      availableProvinces={availableProvinces}
                      availableCities={availableCities}
                      availableDistricts={availableDistricts}
                      availableCampuses={availableCampuses}
                      onReset={handleResetFilters}
                      onApply={handleApplyFilters}
                      showApplyButton={true}
                    />
                </div>
            </aside>

            {/* MOBILE FILTER DRAWER */}
            <FilterDrawer 
               isOpen={isMobileFilterOpen}
               onClose={() => setIsMobileFilterOpen(false)}
               onApply={handleApplyFilters}
               filters={draftFilters}
               setFilters={updateDraftFilters}
               onReset={handleResetFilters}
               availableProvinces={availableProvinces}
               availableCities={availableCities}
               availableDistricts={availableDistricts}
               availableCampuses={availableCampuses}
            />

            {/* RESULTS GRID & PAGINATION */}
            <main className="w-full lg:w-3/4">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <h2 className="text-xl lg:text-3xl font-black text-gray-900 uppercase tracking-tight">Hasil Pencarian</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {appliedFilters.selectedProvince !== 'Semua' ? `${appliedFilters.selectedProvince} • ` : ''}
                          {appliedFilters.selectedCity !== 'Semua' ? appliedFilters.selectedCity : 'Semua Kota'} 
                          {appliedFilters.selectedDistrict !== 'Semua' ? ` • Kec. ${appliedFilters.selectedDistrict}` : ''}
                          {appliedFilters.selectedCampus !== 'Semua' ? ` • ${appliedFilters.selectedCampus}` : ''}
                      </p>
                   </div>
                   <div className="flex items-center gap-2">
                     {loading && <Loader2 className="w-4 h-4 text-[#ff7a00] animate-spin shrink-0" />}
                     <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                        {totalCount} Unit
                     </span>
                   </div>
                </div>

                {loading && kosts.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
                                <div className="bg-slate-200 aspect-[4/3] w-full"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                    <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : kosts.length > 0 ? (
                    <>
                      {/* Property Cards Grid (Server Filtered & Paginated) */}
                      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
                          {kosts.map(kost => (
                              <KostCard key={kost.id} kost={kost} onClick={onKostClick} onDelete={onDelete} />
                          ))}
                      </div>

                      {/* MODERN PAGINATION CONTROLS */}
                      {totalPages > 1 && (
                        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          
                          {/* Info Text */}
                          <p className="text-xs font-bold text-gray-500 order-2 sm:order-1">
                            Menampilkan <span className="text-gray-900 font-extrabold">{startIndex}-{endIndex}</span> dari <span className="text-gray-900 font-extrabold">{totalCount}</span> Unit Kost
                          </p>

                          {/* Page Buttons */}
                          <div className="flex items-center gap-1.5 order-1 sm:order-2">
                            {/* First Page */}
                            <button
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              title="Halaman Pertama"
                              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              <ChevronsLeft className="w-4 h-4" />
                            </button>

                            {/* Prev Page */}
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              title="Sebelumnya"
                              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span className="hidden md:inline">Sebelumnya</span>
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                              {getPaginationNumbers().map((pageNum, idx) => (
                                typeof pageNum === 'number' ? (
                                  <button
                                    key={idx}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center ${
                                      currentPage === pageNum
                                        ? 'bg-[#ff7a00] text-white shadow-md shadow-orange-500/20 scale-105'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:text-[#ff7a00] hover:border-orange-200'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                ) : (
                                  <span key={idx} className="w-6 text-center text-xs font-bold text-gray-400">
                                    ...
                                  </span>
                                )
                              ))}
                            </div>

                            {/* Next Page */}
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              title="Berikutnya"
                              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span className="hidden md:inline">Berikutnya</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* Last Page */}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              title="Halaman Terakhir"
                              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              <ChevronsRight className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
                            <Frown className="w-8 h-8 text-gray-400 stroke-[1.5]" />
                        </div>
                        <p className="text-gray-900 font-black text-sm uppercase tracking-tight">Tidak ada kost ditemukan</p>
                        <p className="text-gray-400 text-xs mt-1">Coba kurangi filter atau cari area lain</p>
                        <button onClick={handleResetFilters} className="mt-4 text-[#ff7a00] text-xs font-bold uppercase tracking-widest hover:underline cursor-pointer">Reset Filter</button>
                    </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default Listings;
