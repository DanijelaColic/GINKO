'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Search, CalendarDays, Users } from 'lucide-react';

export default function HeroSearchBar() {
  const t = useTranslations('homePage');
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  const today = new Date().toISOString().split('T')[0];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push('/booking');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl"
    >
      {/* Check-in */}
      <label className="flex-1 flex items-center gap-3 px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone cursor-pointer hover:bg-stone-light/60 transition-colors">
        <CalendarDays size={18} className="text-primary shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
            {t('heroCheckIn')}
          </span>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut('');
            }}
            className="text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full"
          />
        </div>
      </label>

      {/* Check-out */}
      <label className="flex-1 flex items-center gap-3 px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone cursor-pointer hover:bg-stone-light/60 transition-colors">
        <CalendarDays size={18} className="text-primary shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
            {t('heroCheckOut')}
          </span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            className="text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full"
          />
        </div>
      </label>

      {/* Guests */}
      <label className="flex items-center gap-3 px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone cursor-pointer hover:bg-stone-light/60 transition-colors">
        <Users size={18} className="text-primary shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
            {t('heroGuests')}
          </span>
          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="text-text text-sm font-medium bg-transparent outline-none cursor-pointer pr-2"
          >
            {['1', '2', '3', '4'].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </label>

      {/* Submit */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 sm:py-0 transition-colors text-sm whitespace-nowrap"
      >
        <Search size={17} />
        {t('heroSearch')}
      </button>
    </form>
  );
}
