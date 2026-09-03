import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  bgColor?: string;
  gradient?: string;
}

interface PromoCarouselProps {
  banners: Banner[];
  onBannerClick?: (link: string) => void;
}

const defaultBanners: Banner[] = [
  {
    id: 'default-1',
    title: 'SEMARAK MAHASISWA BARU',
    subtitle: 'Temukan kost yang pas di sekitar kampus impianmu.',
    image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    link_url: '',
    bgColor: 'bg-[#00164e]',
    gradient: 'from-[#00164e]/90 to-transparent'
  },
  {
    id: 'default-2',
    title: 'DATABASE KOST TERLENGKAP',
    subtitle: 'Akses ke ribuan pilihan kost terverifikasi di seluruh Makassar.',
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    link_url: '',
    bgColor: 'bg-[#ff7a00]',
    gradient: 'from-[#ff7a00]/90 to-transparent'
  },
  {
    id: 'default-3',
    title: 'JASA SURVEY TERPERCAYA',
    subtitle: 'Biarkan tim kami mengecek langsung kondisi kost untukmu. Gunakan jasa survey profesional kami.',
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    link_url: '',
    bgColor: 'bg-[#4059aa]',
    gradient: 'from-[#4059aa]/90 to-transparent'
  }
];

const PromoCarousel: React.FC<PromoCarouselProps> = ({ banners, onBannerClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Combine real banners from database with default aesthetic banners if less than 3
  const displayBanners = banners.length >= 3 
    ? banners 
    : banners.length > 0 
      ? [...banners, ...defaultBanners.slice(banners.length)] 
      : defaultBanners;

  const totalSlides = displayBanners.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [totalSlides]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  const goToSlide = (index: number) => setCurrentSlide(index);

  // Helper untuk menentukan posisi slide
  const getSlideClass = (index: number) => {
    if (index === currentSlide) return 'active';
    if (index === (currentSlide - 1 + totalSlides) % totalSlides) return 'prev';
    if (index === (currentSlide + 1) % totalSlides) return 'next';
    return '';
  };

  const handleSlideClick = (index: number, linkUrl?: string) => {
    const position = getSlideClass(index);
    if (position === 'prev') prevSlide();
    else if (position === 'next') nextSlide();
    else if (position === 'active' && linkUrl) {
      onBannerClick?.(linkUrl);
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 mt-2 overflow-x-clip">
      {/* Hero Banner Stacked 3D Perspective Carousel */}
      <div 
        className="relative w-full h-48 sm:h-64 md:h-[400px] lg:h-[420px] rounded-2xl group z-10" 
        id="hero-carousel-container"
      >
        {displayBanners.map((banner, index) => {
          const slideClass = getSlideClass(index);
          return (
            <div
              key={banner.id || index}
              className={`carousel-slide rounded-2xl overflow-hidden shadow-lg ${slideClass} ${banner.bgColor || 'bg-[#00164e]'}`}
              onClick={() => handleSlideClick(index, banner.link_url)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center w-full h-full opacity-90"
                style={{ backgroundImage: `url('${banner.image_url}')` }}
              />
              <div 
                className={`absolute inset-0 bg-gradient-to-r ${banner.gradient || 'from-[#0b1c30]/90 via-[#0b1c30]/60 to-transparent'} p-5 sm:p-8 md:p-14 flex flex-col justify-center`}
              >
                <h2 className="text-lg sm:text-2xl md:text-4xl font-black text-white mb-1.5 max-w-[90%] md:max-w-[70%] uppercase tracking-tight leading-tight drop-shadow-md">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-[11px] sm:text-sm md:text-base font-medium text-white/90 max-w-[90%] md:max-w-[60%] line-clamp-2 drop-shadow-xs">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Navigation Arrows */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-20 cursor-pointer backdrop-blur-xs shadow-md"
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          type="button"
          title="Slide Sebelumnya"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-20 cursor-pointer backdrop-blur-xs shadow-md"
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          type="button"
          title="Slide Selanjutnya"
        >
          <ChevronRight size={22} />
        </button>

        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {displayBanners.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentSlide === index ? 'bg-white w-6 shadow-sm' : 'bg-white/50 w-2 hover:bg-white/80'
              }`}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              title={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoCarousel;
