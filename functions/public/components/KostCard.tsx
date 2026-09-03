import React, { useState } from 'react';
import { Kost } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { getRoomEffectivePrice } from '../userService';
import { Star, MapPin, ImageOff } from 'lucide-react';

interface KostCardProps {
  kost: Kost;
  onClick?: (id: string) => void;
  onDelete?: (id: string, type: 'kost' | 'database', name: string) => void;
}

const KostCard: React.FC<KostCardProps> = ({ kost, onClick, onDelete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const primaryImageUrl = kost.imageUrls && kost.imageUrls.length > 0 ? kost.imageUrls[0] : '';

  // Real Rating Calculation from Verified Tenant Reviews
  const reviews = Array.isArray(kost.reviews) ? kost.reviews : [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviewCount).toFixed(1)
    : (kost.rating && kost.rating > 0 ? Number(kost.rating).toFixed(1) : null);

  return (
    <div 
      onClick={() => onClick?.(kost.id)}
      className="group bg-white rounded-2xl border border-gray-100/90 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
        {/* Lazy Shimmer Skeleton Loader */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
        )}

        {/* Fallback Image */}
        {imageError || !primaryImageUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
            <ImageOff className="w-8 h-8 stroke-1 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Foto Tidak Tersedia</span>
          </div>
        ) : (
          <img 
            src={primaryImageUrl} 
            alt={kost.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
            kost.type === 'Putra' ? 'bg-[#0284c7]' : kost.type === 'Putri' ? 'bg-[#e11d48]' : 'bg-[#7c3aed]'
          } text-white shadow-xs`}>
            KOST {kost.type.toUpperCase()}
          </span>
          {(kost.isVerified || kost.isManaged) && (
            <span className="bg-[#2563eb] text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
              TERVERIFIKASI
            </span>
          )}
          {variantCount > 1 && (
            <span className="bg-[#0b1c30]/75 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
              {variantCount} TIPE
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-base text-[#0b1c30] line-clamp-1 group-hover:text-[#ff7a00] transition-colors uppercase tracking-tight">
              {kost.title}
            </h3>
            {avgRating ? (
              <div className="flex items-center gap-1 text-[#ff7a00] font-bold text-xs shrink-0">
                <Star size={14} className="fill-[#ff7a00] text-[#ff7a00]" />
                <span>{avgRating}</span>
                {reviewCount > 0 && <span className="text-[10px] text-gray-400 font-semibold">({reviewCount})</span>}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-500 font-bold text-[10px] shrink-0 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span>Baru</span>
              </div>
            )}
          </div>
          
          <div className="text-[#8c7263] text-xs font-medium flex items-center gap-1.5">
            <MapPin size={14} className="text-[#8c7263] shrink-0" />
            <span className="truncate">{kost.address}</span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#8c7263] font-bold uppercase block mb-0.5">Harga / Bulan</span>
            <div className="font-bold text-[#ff7a00]">
              {renderPriceDisplay()}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(kost.id, 'kost', kost.title);
                }}
                className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95 border border-red-100"
              >
                Hapus
              </button>
            )}
            <button className="bg-[#0b1c30] hover:bg-[#ff7a00] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-2xs cursor-pointer">
              DETAIL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KostCard;
