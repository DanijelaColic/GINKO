'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  images: string[];
  alt: string;
};

export default function RoomModalGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % images.length);
  }, [images.length]);

  if (!images.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center bg-stone text-muted text-sm italic">
        — foto dolazi —
      </div>
    );
  }

  const showNav = images.length > 1;

  return (
    <div className="flex h-full flex-col bg-stone-light">
      {/* Glavna slika */}
      <div className="relative min-h-[200px] flex-1 overflow-hidden">
        <Image
          src={images[active]}
          alt={`${alt} ${active + 1}`}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 45vw"
        />

        {showNav && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-text shadow hover:bg-white transition-colors"
              aria-label="Prethodna fotografija"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-text shadow hover:bg-white transition-colors"
              aria-label="Sljedeća fotografija"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail mreža */}
      {showNav && (
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-0.5 p-0.5 bg-white border-t border-stone shrink-0 max-h-[120px] overflow-y-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-[4/3] overflow-hidden ${
                i === active ? 'ring-2 ring-primary ring-inset' : 'opacity-80 hover:opacity-100'
              }`}
              aria-label={`Fotografija ${i + 1}`}
              aria-current={i === active}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
