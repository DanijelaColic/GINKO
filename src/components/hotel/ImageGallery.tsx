'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

type Props = {
  images: string[];
  alt: string;
};

export default function ImageGallery({ images, alt }: Props) {
  const t = useTranslations('galleryPage');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = useCallback(() => {
    setLightbox((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  }, [images.length]);

  const next = useCallback(() => {
    setLightbox((i) => (i !== null ? (i + 1) % images.length : null));
  }, [images.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, prev, next]);

  if (!images.length) return null;

  const [first, second, third] = images;
  const showGrid = images.length > 1;

  return (
    <>
      {/* ── Collage ─────────────────────────────────────────────── */}
      <div className="relative">
        {showGrid ? (
          <div
            className="grid gap-0.5 h-[260px] sm:h-[380px] lg:h-[460px]"
            style={{ gridTemplateColumns: '2fr 1fr' }}
          >
            {/* Glavna slika — lijevo */}
            <div
              className="relative cursor-pointer overflow-hidden"
              onClick={() => setLightbox(0)}
            >
              <Image
                src={first}
                alt={`${alt} 1`}
                fill
                priority
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 66vw, 66vw"
              />
            </div>

            {/* Desna kolona — 2 thumbnails */}
            <div className="flex flex-col gap-0.5">
              {second && (
                <div
                  className="relative flex-1 cursor-pointer overflow-hidden"
                  onClick={() => setLightbox(1)}
                >
                  <Image
                    src={second}
                    alt={`${alt} 2`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="34vw"
                  />
                </div>
              )}
              {third && (
                <div
                  className="relative flex-1 cursor-pointer overflow-hidden"
                  onClick={() => setLightbox(2)}
                >
                  <Image
                    src={third}
                    alt={`${alt} 3`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="34vw"
                  />
                  {images.length > 3 && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center pointer-events-none">
                      <span className="text-white font-semibold text-base">
                        +{images.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Jedna slika — full width */
          <div
            className="relative h-[260px] sm:h-[380px] lg:h-[460px] cursor-pointer overflow-hidden"
            onClick={() => setLightbox(0)}
          >
            <Image
              src={first}
              alt={`${alt} 1`}
              fill
              priority
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="100vw"
            />
          </div>
        )}

        {/* Gumb "Prikaži sve fotografije" — dolje desno */}
        <button
          onClick={() => setLightbox(0)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 hover:bg-white text-text text-xs font-semibold px-3 py-2 rounded shadow-md transition-colors"
        >
          <Images size={14} className="shrink-0" />
          {images.length > 1
            ? t('showAllPhotos', { count: images.length })
            : t('showPhoto')}
        </button>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Zatvori */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
            onClick={() => setLightbox(null)}
          >
            <X size={26} />
          </button>

          {/* Prethodna */}
          <button
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft size={26} />
          </button>

          {/* Slika */}
          <div
            className="relative w-full max-w-5xl h-[80vh] px-14 sm:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightbox]}
              alt={`${alt} ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Sljedeća */}
          <button
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight size={26} />
          </button>

          {/* Brojač */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
