'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

export type GalleryImage = { src: string; alt: string };

type Props = {
  images: GalleryImage[];
};

export default function PropertyGallery({ images }: Props) {
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

  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  if (!images.length) return null;

  const [img1, img2, img3, img4, img5] = images;

  return (
    <>
      {/* ── Booking kolaž: 1 velika + 2x2 desno ─────────────────── */}
      <div className="relative">
        <div
          className="grid gap-0.5 h-[260px] sm:h-[380px] lg:h-[480px]"
          style={{ gridTemplateColumns: '2fr 1fr' }}
        >
          {/* Glavna slika */}
          <div
            className="relative cursor-pointer overflow-hidden"
            onClick={() => setLightbox(0)}
          >
            <Image
              src={img1.src}
              alt={img1.alt}
              fill
              priority
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 66vw, 66vw"
            />
          </div>

          {/* Desno: 2×2 grid */}
          {(img2 || img3 || img4 || img5) && (
            <div className="grid grid-cols-2 grid-rows-2 gap-0.5">
              {[img2, img3, img4, img5].map((img, idx) =>
                img ? (
                  <div
                    key={idx}
                    className="relative cursor-pointer overflow-hidden"
                    onClick={() => setLightbox(idx + 1)}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      sizes="25vw"
                    />
                    {idx === 3 && images.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                        <span className="text-white font-bold text-lg">+{images.length - 5}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={idx} className="bg-stone" />
                ),
              )}
            </div>
          )}
        </div>

        {/* Gumb "Prikaži sve fotografije" */}
        <button
          onClick={() => setLightbox(0)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 hover:bg-white text-text text-xs font-semibold px-3 py-2 rounded shadow-md transition-colors"
        >
          <Images size={14} className="shrink-0" />
          Prikaži sve fotografije ({images.length})
        </button>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/93 flex items-center justify-center"
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
              src={images[lightbox].src}
              alt={images[lightbox].alt}
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

          {/* Brojač + alt tekst */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
