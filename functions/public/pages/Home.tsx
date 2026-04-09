import React from 'react';
import { Page, Kost, Banner } from '../types';
import KostCard from '../components/KostCard';
import PromoCarousel from '../components/PromoCarousel';
import QuickActionMenu from '../components/QuickActionMenu';
import { supabase } from '../supabase';

interface HomeProps {
  onPageChange: (page: Page) => void;
  onKostSelect?: (id: string) => void;
  user?: any;
  listings?: Kost[];
  loading?: boolean;
}

const Home: React.FC<HomeProps> = ({ onPageChange, onKostSelect, user, listings = [], loading = false }) => {
  const [banners, setBanners] = React.useState<Banner[]>([]);
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

  return (
    <div className="flex flex-col bg-gray-50 pb-20">
      {/* Hidden SEO Heading for Googlebot */}
      <h1 className="sr-only">Ruang Singgah: Solusi Kost Terpercaya di Makassar - Cari Kost Mahasiswa Terverifikasi</h1>

      {/* Top Section / Branding - Professional & Minimal */}
      <div className="bg-white pt-6 pb-2 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Explore</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">Beranda Utama</h2>
          </div>
          {/* Subtle welcome for user if logged in */}
          {user && (
            <div className="text-right hidden sm:block">
              <span className="text-xs text-gray-400 block font-bold uppercase tracking-widest">Selamat Datang</span>
              <span className="text-sm font-black text-gray-800">{user.displayName || 'Pengguna'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero / Promo Section */}
      <PromoCarousel 
        banners={banners} 
        onBannerClick={(link) => {
          if (link.startsWith('http')) window.open(link, '_blank');
          else onPageChange(link as Page);
        }} 
      />

      {/* Quick Action Navigation (App Menu) */}
      <QuickActionMenu onAction={(page) => onPageChange(page)} />

      {/* Recommendations Section */}
      <section className="bg-white py-12 sm:py-16 rounded-t-[3rem] sm:rounded-t-[4rem] -mt-6 relative z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="h-[2px] w-8 bg-orange-500"></span>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Rekomendasi Utama</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-tight">
                Kost Pilihan <br className="sm:hidden" /> <span className="text-gray-400">Hari Ini</span>
              </h2>
            </div>
            <button
              onClick={() => onPageChange(Page.LISTINGS)}
              className="mt-6 md:mt-0 flex items-center gap-4 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 group"
            >
              Lihat Katalog Lengkap
              <span className="h-2 w-2 rounded-full bg-orange-500 group-hover:bg-white animate-pulse"></span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {loading ? (
              // Enhanced Loading Skeleton
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

      {/* Trust Quote / Branding subtle */}
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
