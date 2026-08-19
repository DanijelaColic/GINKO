'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { MapPin, X } from 'lucide-react';
import {
  PROPERTY_ADDRESS,
  PROPERTY_MAP_EMBED_URL,
  PROPERTY_MAP_URL,
} from '@/modules/property/property-details.config';
import { getSurroundingsCopy } from '@/modules/property/property-details.i18n';

function useMapCopy() {
  const locale = useLocale();
  return getSurroundingsCopy(locale).ui;
}

function PropertyLocationMapModal({ onClose }: { onClose: () => void }) {
  const copy = useMapCopy();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-0 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-[85vh] sm:max-w-4xl sm:rounded-xl sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-map-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3 id="property-map-title" className="font-semibold text-text text-sm sm:text-base">
              {copy.mapTitle}
            </h3>
            <p className="text-muted text-xs mt-0.5 truncate">{PROPERTY_ADDRESS}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-stone-light hover:text-text transition-colors"
            aria-label={copy.closeMap}
          >
            <X size={20} />
          </button>
        </div>

        <iframe
          title={copy.mapTitle}
          src={PROPERTY_MAP_EMBED_URL}
          className="min-h-0 flex-1 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        <div className="border-t border-stone px-4 py-3 sm:px-5">
          <a
            href={PROPERTY_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            <MapPin size={14} className="shrink-0" />
            {copy.openInGoogleMaps}
          </a>
        </div>
      </div>
    </div>
  );
}

function usePropertyLocationMap() {
  const [open, setOpen] = useState(false);
  const openMap = useCallback(() => setOpen(true), []);
  const closeMap = useCallback(() => setOpen(false), []);
  return { open, openMap, closeMap };
}

/** Adresa + jasan link u property headeru (iznad galerije) */
export function PropertyHeaderLocation() {
  const { open, openMap, closeMap } = usePropertyLocationMap();
  const copy = useMapCopy();

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="flex items-center gap-1.5 text-muted">
          <MapPin size={13} className="text-primary shrink-0" />
          {PROPERTY_ADDRESS}
        </span>
        <span className="text-muted/40 hidden sm:inline" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={openMap}
          className="text-primary hover:text-primary-dark font-medium transition-colors whitespace-nowrap"
        >
          {copy.showMap}
        </button>
      </div>

      {open && <PropertyLocationMapModal onClose={closeMap} />}
    </>
  );
}

/** Vidljivi preview karte u sekciji Okolica */
export function PropertyLocationMapPreview() {
  const { open, openMap, closeMap } = usePropertyLocationMap();
  const copy = useMapCopy();

  return (
    <>
      <div className="group relative mt-6 mb-2 w-full overflow-hidden rounded-xl border border-stone bg-stone-light text-left shadow-sm transition-shadow hover:shadow-md">
        <div className="relative h-44 w-full sm:h-52">
          <iframe
            src={PROPERTY_MAP_EMBED_URL}
            title=""
            className="absolute inset-0 h-full w-full border-0 pointer-events-none"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            tabIndex={-1}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
            <p className="text-white text-sm font-medium drop-shadow-sm truncate">
              {PROPERTY_ADDRESS}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary group-hover:bg-white transition-colors">
              <MapPin size={13} />
              {copy.showMap}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={openMap}
          className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={copy.showMap}
        />
      </div>

      {open && <PropertyLocationMapModal onClose={closeMap} />}
    </>
  );
}
