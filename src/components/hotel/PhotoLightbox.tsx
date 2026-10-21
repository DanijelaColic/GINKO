'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  images: string[];
  alt: string;
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Iznad RoomDetailModal (z-100); default z-[200] */
  zIndexClass?: string;
};

const SWIPE_THRESHOLD_PX = 50;

export default function PhotoLightbox({
  images,
  alt,
  index,
  onClose,
  onIndexChange,
  zIndexClass = 'z-[200]',
}: Props) {
  const t = useTranslations('galleryPage');
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [images.length, index, onIndexChange]);

  const next = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [images.length, index, onIndexChange]);

  // Capture phase: Escape zatvara samo lightbox, ne i RoomDetailModal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, prev, next]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!images.length || index < 0 || index >= images.length) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('photo', { n: index + 1 })}
      className={`fixed inset-0 ${zIndexClass} bg-black/93 flex items-center justify-center touch-pan-y`}
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null || images.length < 2) return;
        const end = e.changedTouches[0]?.clientX;
        if (end === undefined) return;
        const delta = end - start;
        if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
        if (delta > 0) prev();
        else next();
      }}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t('close')}
      >
        <X size={26} />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label={t('previous')}
        >
          <ChevronLeft size={26} />
        </button>
      )}

      <div
        className="relative w-full max-w-6xl h-[85vh] px-12 sm:px-20"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index]}
          alt={`${alt} ${index + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <button
          type="button"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label={t('next')}
        >
          <ChevronRight size={26} />
        </button>
      )}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/55 text-sm tabular-nums pointer-events-none">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}
