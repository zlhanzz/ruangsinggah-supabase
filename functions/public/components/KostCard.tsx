import React from 'react';
import { Kost } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { getRoomEffectivePrice } from '../userService';
import { Star, MapPin } from 'lucide-react';

interface KostCardProps {
  kost: Kost;
  onClick?: (id: string) => void;
  onDelete?: (id: string, type: 'kost' | 'database', name: string) => void;
}

const KostCard: React.FC<KostCardProps> = ({ kost, onClick, onDelete }) => {
  const variantCount = kost.isManaged 
    ? (Array.from(new Set(kost.roomTypes?.map((rt: any) => rt.type?.trim() || rt.roomTypeName || 'Standard') || [])).length || 1)
    : (kost.roomTypes?.length || 1);

  // Calculate prices across all room types
  let displayPrices: number[] = [];
  let displayUnit = '/bln';

  if (kost.roomTypes && kost.roomTypes.length > 0) {
    // Gather all effective prices
    const effectivePrices = kost.roomTypes.map(getRoomEffectivePrice);
    
    // Check if we have any "monthly-based" prices (priority <= 4)
    const hasMonthlyBased = effectivePrices.some(p => p.priority <= 4);

    if (hasMonthlyBased) {
      // Filter only monthly-based prices to ensure consistency
      displayPrices = effectivePrices
        .filter(p => p.priority <= 4)
        .map(p => p.price);
      displayUnit = '/bln';
    } else {
      // If no monthly options exist at all, take the available ones (likely daily/weekly)
      // We take the unit of the first one for simplicity, or mixed if multiple
      displayPrices = effectivePrices.map(p => p.price);
      displayUnit = effectivePrices[0]?.unit || '/bln';
    }
  } else {
    // Fallback if no roomTypes defined
    displayPrices = [kost.price];
  }

  const minPrice = Math.min(...displayPrices);
  const maxPrice = Math.max(...displayPrices);

  const renderPriceDisplay = () => {
    if (displayPrices.length === 0) return null;

    if (minPrice === maxPrice) {
      return (
        <span className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
          {FORMAT_CURRENCY(minPrice)}
          <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">{displayUnit}</span>
        </span>
      );
    }
    return (
      <span className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
        {FORMAT_CURRENCY(minPrice).replace('Rp', '')} - {FORMAT_CURRENCY(maxPrice)}
        <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">{displayUnit}</span>
      </span>
    );
  };

  return (
    <div 
      onClick={() => onClick?.(kost.id)}
      className="group bg-white rounded-3xl border border-gray-100/80 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col h-full cursor-pointer shadow-2xs"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img 
          src={kost.imageUrls[0]} 
          alt={kost.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
              kost.type === 'Putra' ? 'bg-blue-600' : kost.type === 'Putri' ? 'bg-pink-600' : 'bg-purple-600'
            } text-white shadow-sm`}>
              Kost {kost.type}
            </span>
            {variantCount > 1 && (
              <span className="bg-gray-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20 shadow-sm">
                {variantCount} Tipe
              </span>
            )}
          </div>
          {kost.isManaged && (
            <span className="bg-[#ff7a00] text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider w-fit shadow-sm">
              Verified
            </span>
          )}
        </div>

        {/* Social Media Review Indicators */}
        {(kost.instagramUrl || kost.tiktokUrl) && (
          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
            {kost.instagramUrl && (
              <div className="w-6 h-6 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center text-pink-600 shadow-sm p-1" title="Review Instagram Tersedia">
                 <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
            )}
            {kost.tiktokUrl && (
              <div className="w-6 h-6 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center text-black shadow-sm p-1" title="Review TikTok Tersedia">
                 <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.12 3.35-.12 6.7 0 10.05-.1 1.63-.58 3.25-1.55 4.58-1.35 1.83-3.67 2.87-5.91 2.8-2.31-.01-4.6-.96-6.11-2.72-1.78-2.03-2.22-5.06-1.12-7.53.94-2.18 3.09-3.79 5.46-4.06.13 1.34.25 2.68.38 4.02-1.15.11-2.32.55-3.08 1.46-.73.91-.91 2.14-.52 3.24.4 1.15 1.43 2.03 2.62 2.23 1.28.2 2.64-.19 3.52-1.12.82-.9.99-2.19.98-3.37-.02-3.34-.02-6.67-.02-10.01V0c.01.01.01.01 0 .02z"/></svg>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1.5 gap-2">
            <h3 className="font-black text-base sm:text-lg text-[#0b1c30] line-clamp-1 group-hover:text-orange-500 transition-colors uppercase tracking-tight">
              {kost.title}
            </h3>
            <div className="flex items-center gap-1 text-orange-500 font-black text-xs shrink-0">
              <Star size={13} className="fill-orange-400 text-orange-400" />
              <span>{kost.rating || '0'}</span>
            </div>
          </div>
          
          <div className="text-gray-500 text-[11px] font-medium mb-3 flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{kost.address}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#eff4ff] text-[#0b1c30] px-2 py-0.5 rounded-md border border-blue-100/60">
              {variantCount} Varian Fasilitas
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-end justify-between gap-2 mt-2">
          <div>
            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Range Harga</p>
            {renderPriceDisplay()}
          </div>
          <div className="flex gap-2 shrink-0">
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(kost.id, 'kost', kost.title);
                }}
                className="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95 border border-red-100"
              >
                Hapus
              </button>
            )}
            <button className="bg-[#0b1c30] group-hover:bg-[#ff7a00] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-2xs">
              Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KostCard;
