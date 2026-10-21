'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Images } from 'lucide-react';
import PhotoLightbox from '@/components/hotel/PhotoLightbox';

type Props = {
  images: string[];
  alt: string;
};

export default function ImageGallery({ images, alt }: Props) {
  const t = useTranslations('galleryPage');
  const [lightbox, setLightbox] = useState<number | null>(null);

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
          type="button"
          onClick={() => setLightbox(0)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 hover:bg-white text-text text-xs font-semibold px-3 py-2 rounded shadow-md transition-colors"
        >
          <Images size={14} className="shrink-0" />
          {images.length > 1
            ? t('showAllPhotos', { count: images.length })
            : t('showPhoto')}
        </button>
      </div>

      {lightbox !== null && (
        <PhotoLightbox
          images={images}
          alt={alt}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}
    </>
  );
}
