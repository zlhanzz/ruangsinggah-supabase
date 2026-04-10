import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
}

interface PromoCarouselProps {
  banners: Banner[];
  onBannerClick?: (link: string) => void;
}

const PromoCarousel: React.FC<PromoCarouselProps> = ({ banners, onBannerClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

  const desktopCount = Math.min(banners.length, 3);
  const containerMaxWidth = desktopCount === 1 ? 'lg:max-w-2xl' : desktopCount === 2 ? 'lg:max-w-5xl' : 'lg:max-w-7xl';
  const gridCols = desktopCount === 1 ? 'lg:grid-cols-1' : desktopCount === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';

  return (
    <div className={`relative w-full max-w-7xl ${containerMaxWidth} mx-auto px-4 sm:px-6 lg:px-8 mt-6 transition-all duration-500`}>
      
      {/* MOBILE VIEW: Carousel (Hidden on LG) */}
      <div className="lg:hidden relative aspect-video w-full overflow-hidden rounded-2xl shadow-lg border border-gray-100 bg-gray-50 group">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            onClick={() => banner.link_url && onBannerClick?.(banner.link_url)}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
              <h3 className="text-white font-bold text-base drop-shadow-md">
                {banner.title}
              </h3>
            </div>
          </div>
        ))}

        {/* Navigation Arrows (Mobile) */}
        <button
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots (Mobile) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-orange-500 w-4' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* DESKTOP VIEW: Dynamic Grid (1, 2, or 3 Columns) */}
      <div className={`hidden lg:grid ${gridCols} gap-4`}>
        {banners.slice(0, 3).map((banner) => (
          <div 
            key={banner.id}
            onClick={() => banner.link_url && onBannerClick?.(banner.link_url)}
            className="aspect-video relative overflow-hidden rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-gray-100 bg-gray-50 cursor-pointer group"
          >
            <img 
              src={banner.image_url} 
              alt={banner.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h3 className="text-white font-black text-lg drop-shadow-md tracking-tight uppercase leading-tight">
                {banner.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoCarousel;
