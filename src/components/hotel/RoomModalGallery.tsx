'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PhotoLightbox from '@/components/hotel/PhotoLightbox';

type Props = {
  images: string[];
  alt: string;
};

/** Učitaj thumbnail tek kad uđe u vidljivi dio scroll kontejnera (+ buffer). */
function GalleryThumb({
  src,
  alt,
  active,
  onSelect,
  forceLoad,
  label,
}: {
  src: string;
  alt: string;
  active: boolean;
  onSelect: () => void;
  forceLoad: boolean;
  label: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [load, setLoad] = useState(forceLoad || active);

  useEffect(() => {
    if (forceLoad || active) setLoad(true);
  }, [forceLoad, active]);

  useEffect(() => {
    if (load) return;
    const el = ref.current;
    if (!el) return;
    const root = el.closest('[data-thumb-scroll]');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { root: root instanceof Element ? root : null, rootMargin: '120px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      className={`relative aspect-[4/3] overflow-hidden rounded-sm ${
        active ? 'ring-2 ring-primary ring-offset-1' : 'opacity-80 hover:opacity-100'
      }`}
      aria-label={label}
      aria-current={active}
    >
      {load ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="96px"
          quality={60}
          loading="lazy"
        />
      ) : (
        <span className="absolute inset-0 bg-stone/40" aria-hidden />
      )}
    </button>
  );
}

export default function RoomModalGallery({ images, alt }: Props) {
  const t = useTranslations('galleryPage');
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % images.length);
  }, [images.length]);

  if (!images.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center bg-stone text-muted text-sm italic">
        {t('comingSoon')}
      </div>
    );
  }

  const showNav = images.length > 1;

  return (
    <div className="flex h-full flex-col bg-stone-light">
      {/* Glavna slika — contain = manje rezanja; klik otvara lightbox */}
      <div className="relative min-h-[220px] flex-1 overflow-hidden bg-stone">
        <button
          type="button"
          className="absolute inset-0 cursor-zoom-in"
          onClick={() => setLightbox(active)}
          aria-label={t('photo', { n: active + 1 })}
        >
          <Image
            src={images[active]}
            alt={`${alt} ${active + 1}`}
            fill
            priority={active === 0}
            className="object-contain object-center pointer-events-none"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        </button>

        {showNav && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-1.5 text-text shadow hover:bg-white transition-colors"
              aria-label={t('previous')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-1.5 text-text shadow hover:bg-white transition-colors"
              aria-label={t('next')}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnaili — svi ostaju; učitavanje tek kad su blizu viewporta scrolla */}
      {showNav && (
        <div
          data-thumb-scroll
          className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-1 p-1.5 bg-white border-t border-stone shrink-0 max-h-[148px] overflow-y-auto"
        >
          {images.map((src, i) => (
            <GalleryThumb
              key={`${src}-${i}`}
              src={src}
              alt={`${alt} thumbnail ${i + 1}`}
              active={i === active}
              onSelect={() => setActive(i)}
              forceLoad={i < 8}
              label={t('photo', { n: i + 1 })}
            />
          ))}
        </div>
      )}

      {lightbox !== null && (
        <PhotoLightbox
          images={images}
          alt={alt}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => {
            setLightbox(i);
            setActive(i);
          }}
        />
      )}
    </div>
  );
}
