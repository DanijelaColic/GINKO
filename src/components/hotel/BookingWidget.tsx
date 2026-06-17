'use client';

// Refactored to multi-step layout (Booking.com style):
//   Step 1: Room selector + calendar + payment terms
//   Step 2: Two-column — BookingSummaryCard (sticky) + guest details form
//   Step 3: Redirect to /booking/confirmation/[id] (or inline success fallback)
// All API/pricing/submit logic is unchanged.

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Check, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import BookingCalendar from './BookingCalendar';
import BookingStepsBar from './BookingStepsBar';
import BookingSummaryCard from './BookingSummaryCard';
import {
  formatDisplayDate,
  formatShortDate,
  formatDate,
  calculatePrice,
} from '@/modules/booking/dates';
import {
  RECIPIENT_IBAN,
  RECIPIENT_NAME,
  RECIPIENT_BIC,
  RECIPIENT_BANK_NAME,
  DEPOSIT_PERCENT,
  BALANCE_DAYS_BEFORE_CHECK_IN,
  MIN_NIGHTS,
  LONG_STAY_DISCOUNT_NIGHTS,
  LONG_STAY_DISCOUNT_RATE,
} from '@/modules/booking/booking.config';
import { rooms } from '@/modules/rooms/rooms.config';
import type { BookingFormData } from '@/modules/booking/booking-form.schema';
import { BOOKING_FORM_DEFAULTS } from '@/modules/booking/booking-form.schema';

const DEPOSIT_PCT_DISPLAY = Math.round(DEPOSIT_PERCENT * 100);
const BALANCE_PCT_DISPLAY = 100 - DEPOSIT_PCT_DISPLAY;
const HAS_BALANCE_PAYMENT = BALANCE_PCT_DISPLAY > 0;

const ARRIVAL_TIME_OPTIONS = [
  '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00', '23:00',
];

type Props = {
  initialSlug?: string;
  bookingsApiPath?: string;
  barcodeApiPath?: string;
  rulesText?: React.ReactNode;
};

export default function BookingWidget({
  initialSlug,
  bookingsApiPath = '/api/bookings',
  barcodeApiPath = '/api/generate-barcode',
  rulesText,
}: Props) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('bookingWidget');

  const getNightsLabel = useCallback(
    (n: number) => {
      if (n === 1) return t('labels.night.one');
      return t('labels.night.other', { count: n });
    },
    [t],
  );

  const cancellationPolicyLines = useMemo(
    () => [
      t('policies.cancellation.line1'),
      t('policies.cancellation.line2'),
      t('policies.cancellation.line3'),
    ],
    [t],
  );

  const availableRooms = useMemo(() => rooms.filter((r) => !r.fullyBooked), []);

  // ── State ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    if (initialSlug && rooms.find((r) => r.slug === initialSlug && !r.fullyBooked)) {
      return initialSlug;
    }
    return availableRooms[0]?.slug ?? '';
  });

  const successRef = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [form, setForm] = useState<BookingFormData>(BOOKING_FORM_DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hub3Barcode, setHub3Barcode] = useState<string | null>(null);
  const [epcQR, setEpcQR] = useState<string | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [success]);

  // Scroll na vrh koraka 2 pri prolasku
  useEffect(() => {
    if (step === 2 && step2Ref.current) {
      step2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const selectedRoom = rooms.find((r) => r.slug === selectedSlug);
  const priceData =
    checkIn && checkOut && selectedRoom
      ? calculatePrice(checkIn, checkOut, selectedRoom)
      : null;

  // ── Barcode fetch (opcionalno — gracefully fails) ──────────────────
  const fetchBarcodes = useCallback(
    async (amount: number, guestName: string, bookingId: string) => {
      setBarcodeLoading(true);
      try {
        const reference = `REZ-${bookingId.substring(0, 8).toUpperCase()}`;
        const res = await fetch(barcodeApiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, guestName, reference, locale }),
        });
        if (res.ok) {
          const data = await res.json();
          setHub3Barcode(data.hub3 ?? null);
          setEpcQR(data.epc ?? null);
        }
      } catch {
        // Barcodes su opcionalani — plaćanje bez QR-a i dalje radi
      } finally {
        setBarcodeLoading(false);
      }
    },
    [barcodeApiPath, locale],
  );

  const handleReset = useCallback(() => {
    setCheckIn(null);
    setCheckOut(null);
  }, []);

  const handleRoomChange = (slug: string) => {
    setSelectedSlug(slug);
    handleReset();
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };
      if (name === 'adults' && selectedRoom) {
        const maxChildren = selectedRoom.capacity - parseInt(value || '1');
        if (parseInt(prev.children) > maxChildren) {
          updated.children = String(Math.max(0, maxChildren));
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || !priceData || !selectedRoom) return;

    const totalGuests = parseInt(form.adults) + parseInt(form.children);
    if (totalGuests > selectedRoom.capacity) {
      setSubmitError(
        t('errors.maxGuests', {
          apartmentName: selectedRoom.name,
          capacity: selectedRoom.capacity,
        }),
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Spoji arrival_time u notes
    const combinedNotes = [
      form.arrivalTime ? `Procijenjeno vrijeme dolaska: ${form.arrivalTime}` : '',
      form.notes,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const res = await fetch(bookingsApiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_slug: selectedSlug,
          check_in: formatDate(checkIn),
          check_out: formatDate(checkOut),
          locale,
          guest_name: form.name,
          guest_email: form.email,
          guest_phone: form.phone,
          adults: parseInt(form.adults),
          children: parseInt(form.children),
          notes: combinedNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('errors.submitFailed'));

      if (data.confirmationPath) {
        router.push(data.confirmationPath);
        return;
      }
      if (data.confirmationUrl) {
        try {
          const url = new URL(data.confirmationUrl, window.location.origin);
          router.push(`${url.pathname}${url.search}`);
        } catch {
          router.push(data.confirmationUrl);
        }
        return;
      }

      setSuccess(true);
      if (priceData && data.bookingId) {
        fetchBarcodes(priceData.deposit, form.name, data.bookingId);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state (fallback kada nema confirmationPath) ────────────
  if (success) {
    return (
      <div
        ref={successRef}
        className="max-w-lg mx-auto text-center py-8 sm:py-12 px-4 scroll-mt-24"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-3">
          {t('success.title')}
        </h2>
        <p className="text-muted leading-relaxed mb-6">
          {t.rich('success.description', {
            name: () => <strong className="text-text">{form.name}</strong>,
            email: () => <strong className="text-text">{form.email}</strong>,
          })}
        </p>

        {priceData && (
          <div className="bg-stone-light rounded-xl p-5 text-left text-sm mb-6 space-y-3">
            <p className="text-muted">
              <strong className="text-text">{t('success.summary.accommodation')}:</strong>{' '}
              {selectedRoom?.name}
            </p>
            <p className="text-muted">
              <strong className="text-text">{t('success.summary.checkIn')}:</strong>{' '}
              {checkIn ? formatDisplayDate(checkIn, locale) : ''}
            </p>
            <p className="text-muted">
              <strong className="text-text">{t('success.summary.checkOut')}:</strong>{' '}
              {checkOut ? formatDisplayDate(checkOut, locale) : ''}
            </p>
            <p className="text-muted">
              <strong className="text-text">{t('success.summary.nights')}:</strong>{' '}
              {getNightsLabel(priceData.nights)}
            </p>
            <div className="border-t border-stone pt-3 flex justify-between items-center">
              <strong className="text-text">{t('success.summary.total')}:</strong>
              <span className="text-primary font-bold text-lg">{priceData.totalPrice} €</span>
            </div>
            <p className="text-muted">
              <strong className="text-text">
                {t('success.summary.deposit', { percent: DEPOSIT_PCT_DISPLAY })}:
              </strong>{' '}
              <span className="text-accent font-semibold">{priceData.deposit} €</span>
              <span className="text-muted"> — {t('success.summary.depositNote')}</span>
            </p>
            {HAS_BALANCE_PAYMENT && (
              <p className="text-muted">
                <strong className="text-text">
                  {t('success.summary.balance', { percent: BALANCE_PCT_DISPLAY })}:
                </strong>{' '}
                <span className="text-text font-medium">
                  {priceData.totalPrice - priceData.deposit} €
                </span>
                <span className="text-muted">
                  {' '}
                  — {t('success.summary.balanceNote', { days: BALANCE_DAYS_BEFORE_CHECK_IN })}
                </span>
              </p>
            )}
            <div className="border-t border-stone pt-3 space-y-2 text-muted text-xs leading-relaxed">
              <p>
                <strong className="text-text">
                  {t('success.summary.cancellationTitle')}:
                </strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {cancellationPolicyLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            {RECIPIENT_IBAN && (
              <div className="text-xs bg-white border border-stone px-3 py-3 rounded-lg space-y-1.5 text-left text-muted leading-relaxed">
                {RECIPIENT_NAME && (
                  <p className="font-sans text-text font-medium text-sm">{RECIPIENT_NAME}</p>
                )}
                <p className="font-mono">IBAN: {RECIPIENT_IBAN}</p>
                <p className="font-sans">
                  {t('success.summary.bankLabel')}: {RECIPIENT_BANK_NAME}
                </p>
                <p className="font-sans">
                  BIC/SWIFT {RECIPIENT_BIC} ({t('success.summary.internationalPayments')})
                </p>
              </div>
            )}
            {(barcodeLoading || hub3Barcode || epcQR) && (
              <div className="pt-4 border-t border-stone">
                <p className="text-xs font-semibold text-text mb-3 text-center">
                  {t('success.summary.qrTitle')}
                </p>
                {barcodeLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted">
                    <Loader2 size={14} className="animate-spin" />
                    {t('success.summary.generatingQr')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hub3Barcode && (
                      <div className="bg-white border border-stone rounded-lg p-3 text-center">
                        <p className="text-[11px] font-semibold text-text mb-2">
                          🇭🇷 {t('success.summary.hub3Title')}
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={hub3Barcode}
                          alt={t('success.summary.hub3Alt')}
                          className="max-w-full h-auto mx-auto"
                        />
                        <p className="text-[10px] text-muted mt-2">
                          {t('success.summary.hub3Hint')}
                        </p>
                      </div>
                    )}
                    {epcQR && (
                      <div className="bg-white border border-stone rounded-lg p-3 text-center">
                        <p className="text-[11px] font-semibold text-text mb-2">
                          🌍 {t('success.summary.epcTitle')}
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={epcQR}
                          alt={t('success.summary.epcAlt')}
                          className="max-w-full h-auto mx-auto"
                        />
                        <p className="text-[10px] text-muted mt-2">
                          {t('success.summary.epcHint')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setStep(1);
            setHub3Barcode(null);
            setEpcQR(null);
            handleReset();
            setForm(BOOKING_FORM_DEFAULTS);
          }}
          className="text-sm text-primary underline underline-offset-2"
        >
          {t('success.newBooking')}
        </button>
      </div>
    );
  }

  // ── Korak 1: Odabir sobe i datuma ─────────────────────────────────
  const step1 = (
    <div className="max-w-3xl mx-auto">
      {/* 0. Odabir sobe */}
      {availableRooms.length > 1 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-text mb-3">
            {t('steps.room')}
          </h2>
          <select
            value={selectedSlug}
            onChange={(e) => handleRoomChange(e.target.value)}
            className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
          >
            {availableRooms.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name} — {r.capacityNote} · {r.priceOffSeason}€/noć
              </option>
            ))}
          </select>
        </section>
      )}

      {/* 1. Kalendar */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="font-serif text-xl font-semibold text-text">{t('steps.dates')}</h2>
          {checkIn && checkOut && priceData && (
            <span className="text-sm text-accent font-medium">
              {formatShortDate(checkIn, locale)} → {formatShortDate(checkOut, locale)} ·{' '}
              {getNightsLabel(priceData.nights)}
            </span>
          )}
        </div>

        <div className="bg-white border border-stone rounded-2xl p-4 sm:p-6">
          <BookingCalendar
            roomSlug={selectedSlug}
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInSelect={setCheckIn}
            onCheckOutSelect={setCheckOut}
            onReset={handleReset}
            bookingsApiPath={bookingsApiPath}
            minNights={MIN_NIGHTS}
          />
        </div>

        {/* Uvjeti plaćanja — prikazuju se tek nakon odabira datuma */}
        {priceData && (
          <div className="mt-6 bg-stone-light border border-stone rounded-xl p-5 text-sm text-muted space-y-3">
            <h3 className="font-serif text-base font-semibold text-text">
              {t('paymentTerms.title')}
            </h3>
            <p>
              <strong className="text-text">
                {t('paymentTerms.depositLabel', { percent: DEPOSIT_PCT_DISPLAY })}:
              </strong>{' '}
              <span className="text-accent font-semibold">{priceData.deposit} €</span>
              <span className="text-muted"> — {t('paymentTerms.depositNote')}</span>
            </p>
            {HAS_BALANCE_PAYMENT && (
              <p>
                <strong className="text-text">
                  {t('paymentTerms.balanceLabel', { percent: BALANCE_PCT_DISPLAY })}:
                </strong>{' '}
                <span className="text-text font-medium">
                  {priceData.totalPrice - priceData.deposit} €
                </span>
                <span className="text-muted">
                  {' '}
                  — {t('paymentTerms.balanceNote', { days: BALANCE_DAYS_BEFORE_CHECK_IN })}
                </span>
              </p>
            )}
            <div className="pt-1 text-xs leading-relaxed space-y-2">
              <p>
                <strong className="text-text">
                  {t('paymentTerms.cancellationTitle')}:
                </strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {cancellationPolicyLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Nastavi gumb */}
      <button
        type="button"
        disabled={!checkIn || !checkOut || !priceData}
        onClick={() => setStep(2)}
        className="w-full bg-accent hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-4 rounded-full transition-colors text-sm"
      >
        {t('nav.continue')} →
      </button>
    </div>
  );

  // ── Korak 2: Vaši podaci (2-stupčani layout) ──────────────────────
  const step2 = checkIn && checkOut && priceData && selectedRoom ? (
    <div ref={step2Ref} className="scroll-mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">

        {/* Lijevo: sažetak rezervacije (sticky na desktopima) */}
        <div className="lg:sticky lg:top-24">
          <BookingSummaryCard
            room={selectedRoom}
            checkIn={checkIn}
            checkOut={checkOut}
            priceData={priceData}
            adults={form.adults}
            children={form.children}
            locale={locale}
          />
        </div>

        {/* Desno: forma s podacima gosta */}
        <div>
          <h2 className="font-serif text-2xl font-semibold text-text mb-6">
            {t('steps.details')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ime i e-pošta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {t('form.name')} <span className="text-red-400">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder={t('form.namePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {t('form.email')} <span className="text-red-400">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder={t('form.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t('form.phone')} <span className="text-red-400">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleFormChange}
                required
                className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder={t('form.phonePlaceholder')}
              />
            </div>

            {/* Broj gostiju */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {t('form.adults')}
                </label>
                <select
                  name="adults"
                  value={form.adults}
                  onChange={handleFormChange}
                  className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                >
                  {Array.from({ length: selectedRoom.capacity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {t('form.children')}
                </label>
                <select
                  name="children"
                  value={form.children}
                  onChange={handleFormChange}
                  className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                >
                  {Array.from(
                    {
                      length:
                        Math.max(0, selectedRoom.capacity - parseInt(form.adults || '1')) + 1,
                    },
                    (_, i) => i,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">
                  {t('form.maxGuests', { capacity: selectedRoom.capacity })}
                </p>
              </div>
            </div>

            {/* Procijenjeno vrijeme dolaska */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t('form.arrivalTime')}
              </label>
              <select
                name="arrivalTime"
                value={form.arrivalTime}
                onChange={handleFormChange}
                className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
              >
                <option value="">— Odaberite —</option>
                {ARRIVAL_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">{t('form.arrivalTimeHint')}</p>
            </div>

            {/* Posebni zahtjevi / napomene */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t('form.notes')}
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                rows={3}
                className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder={t('form.notesPlaceholder')}
              />
            </div>

            {/* Kućni red */}
            {rulesText ?? (
              <div className="bg-stone-light rounded-xl p-4 text-xs text-muted space-y-1">
                <p>
                  <strong className="text-text">{t('form.rules.checkIn')}:</strong> 14:00 – 23:00
                  &nbsp;|&nbsp;
                  <strong className="text-text">{t('form.rules.checkOut')}:</strong> 09:00 – 11:00
                </p>
              </div>
            )}

            {/* Suglasnost s pravilima */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                name="agreeRules"
                type="checkbox"
                checked={form.agreeRules}
                onChange={handleFormChange}
                required
                className="mt-0.5 accent-primary"
              />
              <span className="text-sm text-muted">
                {t('form.agreeRules')}
                <span className="text-red-400"> *</span>
              </span>
            </label>

            {/* Greška pri slanju */}
            {submitError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Navigacija: natrag + pošalji */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-stone text-sm font-medium text-text hover:bg-stone-light transition-colors sm:w-auto"
              >
                <ChevronLeft size={16} />
                {t('nav.back')}
              </button>
              <button
                type="submit"
                disabled={submitting || !form.agreeRules}
                className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-full transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting
                  ? t('form.submitting')
                  : t('form.submit', { totalPrice: priceData.totalPrice })}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div>
      <BookingStepsBar currentStep={step} />
      {step === 1 && step1}
      {step === 2 && step2}
    </div>
  );
}
