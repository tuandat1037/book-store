import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { Banner } from '../../types';
import { BANNER_THEMES, FALLBACK_BANNERS } from '../../constants/bannerThemes';

export const HeroCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    api.get('/banners')
      .then((res) => {
        const list: Banner[] = res.data.banners || [];
        if (list.length > 0) {
          setBanners(list);
          setCurrent(0);
        }
      })
      .catch((err) => console.error('Banner fetch failed:', err));
  }, []);

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, banners.length]);

  const prevSlide = () => setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const nextSlide = () => setCurrent((prev) => (prev + 1) % banners.length);

  if (banners.length === 0) return null;

  const activeBanner = banners[Math.min(current, banners.length - 1)];
  const gradient = BANNER_THEMES[activeBanner.theme || 'red'] || BANNER_THEMES.red;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl shadow-lg my-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative min-h-[300px] sm:min-h-[380px] md:min-h-[440px] text-white">

        {/* Layer 1: theme gradient (also shows through while image loads / if image fails) */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} transition-all duration-500`} />

        {/* Layer 2: full-bleed banner image */}
        {activeBanner.image_url && (
          <img
            key={`${activeBanner.id}-${activeBanner.image_url}`}
            src={activeBanner.image_url}
            alt={activeBanner.title}
            className="absolute inset-0 w-full h-full object-cover animate-banner-fade"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        {/* Layer 3: scrim so the text always stays readable on top of any photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Text + CTA */}
        <div className="relative z-10 max-w-7xl mx-auto w-full h-full flex items-center min-h-[300px] sm:min-h-[380px] md:min-h-[440px] px-6 sm:px-12">
          <div key={activeBanner.id} className="space-y-4 max-w-xl animate-banner-fade">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-md text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-white border border-white/30">
              <Sparkles className="w-3.5 h-3.5" />
              {activeBanner.badge || 'NXB Kim Đồng Nổi Bật'}
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
              {activeBanner.title}
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed drop-shadow-sm">
              {activeBanner.subtitle}
            </p>
            <div className="pt-2">
              <Link
                to={activeBanner.cta_link || '/books'}
                className="inline-flex items-center gap-2 bg-white text-kimdong-red hover:bg-red-50 font-black text-xs sm:text-sm px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
              >
                <span>{activeBanner.cta_text || 'Xem ngay'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Prev / Next Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm flex items-center justify-center transition-colors z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm flex items-center justify-center transition-colors z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
