'use client';

// Adapted from VV/src/components/sections/GalleryClient.tsx
// Changes: AppImage→next/image, removed SectionWrapper/SectionHeading,
// removed VV translation keys, added scroll-lock (from VJ GalleryClient),
// adapted color classes to Ginko palette.

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { GallerySection } from '@/modules/gallery/gallery.types';

type Props = {
  sections: GallerySection[];
};

export function GalleryGrid({ sections }: Props) {
  const t = useTranslations('galleryPage');
  const [lightbox, setLightbox] = useState<{ sectionId: string; index: number } | null>(null);

  const close = useCallback(() => setLightbox(null), []);

  const prev = useCallback(() => {
    setLightbox((current) => {
      if (!current) return null;
      const section = sections.find((s) => s.id === current.sectionId);
      if (!section || section.media.length === 0) return current;
      return { ...current, index: (current.index - 1 + section.media.length) % section.media.length };
    });
  }, [sections]);

  const next = useCallback(() => {
    setLightbox((current) => {
      if (!current) return null;
      const section = sections.find((s) => s.id === current.sectionId);
      if (!section || section.media.length === 0) return current;
      return { ...current, index: (current.index + 1) % section.media.length };
    });
  }, [sections]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, prev, next, close]);

  // Scroll lock while lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  return (
    <>
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.id} className="space-y-4">
            <h3 className="text-xl font-semibold text-text">{section.title}</h3>

            {section.media.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone/30 bg-stone/5 px-4 py-8 text-center text-sm text-text/50">
                {t('comingSoon')}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                {section.media.map((item, mediaIndex) => (
                  <button
                    key={`${section.id}-${mediaIndex}`}
                    type="button"
                    onClick={() => setLightbox({ sectionId: section.id, index: mediaIndex })}
                    className="group relative h-44 w-60 shrink-0 snap-start overflow-hidden rounded-xl shadow-sm bg-stone/10 cursor-zoom-in"
                    aria-label={t('openPhoto', { alt: item.alt })}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="240px"
                      loading={mediaIndex === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <ZoomIn className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null &&
        (() => {
          const activeSection = sections.find((s) => s.id === lightbox.sectionId);
          if (!activeSection || activeSection.media.length === 0) return null;

          const safeIndex = Math.min(
            Math.max(lightbox.index, 0),
            activeSection.media.length - 1,
          );
          const activeMedia = activeSection.media[safeIndex];

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
              onClick={close}
            >
              <button
                className="absolute top-4 right-4 p-2 text-white/70 transition-colors hover:text-white"
                onClick={close}
                aria-label={t('close')}
              >
                <X className="size-8" />
              </button>

              <button
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white/70 backdrop-blur-sm transition-colors hover:text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label={t('previous')}
              >
                <ChevronLeft className="size-7" />
              </button>

              <div
                className="relative mx-16 sm:mx-20 w-full max-w-5xl aspect-[4/3] overflow-hidden rounded-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={activeMedia.src}
                  alt={activeMedia.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              <button
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white/70 backdrop-blur-sm transition-colors hover:text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label={t('next')}
              >
                <ChevronRight className="size-7" />
              </button>

              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
                <p className="text-white/80 text-sm font-medium">{activeMedia.caption}</p>
                <p className="mt-1 text-xs text-white/40 tabular-nums">
                  {safeIndex + 1} / {activeSection.media.length}
                </p>
              </div>
            </div>
          );
        })()}
    </>
  );
}
