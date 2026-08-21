'use client';

// Refactored to multi-step layout (Booking.com style):
//   Step 1: Room selector + calendar + payment terms
//   Step 2: Two-column — BookingSummaryCard (sticky) + guest details form
//   Step 3: Create booking + redirect to payment (confirmation page)
// Guest email is sent only after successful deposit payment.

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Check, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import BookingCalendar from './BookingCalendar';
import BookingStepsBar from './BookingStepsBar';
import BookingSummaryCard from './BookingSummaryCard';
import {
  formatDisplayDate,
  formatShortDate,
  formatDate,
  calculatePrice,
  parseLocalDate,
} from '@/modules/booking/dates';
import {
  RECIPIENT_IBAN,
  RECIPIENT_NAME,
  RECIPIENT_BIC,
  RECIPIENT_BANK_NAME,
  DEPOSIT_PERCENT,
  MIN_NIGHTS,
  FACILITIES_SECTION_ID,
  propertySectionHref,
  EXTRA_BED_PRICE_PER_NIGHT,
  CRIB_PRICE_PER_NIGHT,
} from '@/modules/booking/booking.config';
import { rooms as staticRooms } from '@/modules/rooms/rooms.config';
import type { BookingFormData } from '@/modules/booking/booking-form.schema';
import {
  BOOKING_COUNTRY_OPTIONS,
  BOOKING_FORM_DEFAULTS,
  validateBookingForm,
} from '@/modules/booking/booking-form.schema';
import type { GoogleReviewSummary } from '@/modules/reviews/google-reviews.types';
import {
  calculateBreakfastPerNight,
  parseChildAgesParam,
  roomFitsGuests,
  roomNeedsExtraBed,
} from '@/modules/booking/guest-occupancy';

const DEPOSIT_PCT_DISPLAY = Math.round(DEPOSIT_PERCENT * 100);
const BALANCE_PCT_DISPLAY = 100 - DEPOSIT_PCT_DISPLAY;
const HAS_BALANCE_PAYMENT = BALANCE_PCT_DISPLAY > 0;

const ARRIVAL_TIME_OPTIONS = [
  '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00',
];

type Props = {
  initialSlug?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: string;
  initialChildren?: string;
  initialChildAges?: string;
  initialBreakfast?: string;
  initialStep?: 1 | 2 | 3;
  bookingsApiPath?: string;
  barcodeApiPath?: string;
  rulesText?: React.ReactNode;
  reviewSummary?: GoogleReviewSummary | null;
};

export default function BookingWidget({
  initialSlug,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
  initialChildAges,
  initialBreakfast,
  initialStep,
  bookingsApiPath = '/api/bookings',
  barcodeApiPath = '/api/generate-barcode',
  rulesText,
  reviewSummary,
}: Props) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('bookingWidget');
  const tPage = useTranslations('bookingPage');

  const getNightsLabel = useCallback(
    (n: number) => {
      if (n === 1) return t('labels.night.one');
      if (n >= 2 && n <= 4) return t('labels.night.few', { count: n });
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

  const availableRooms = useMemo(() => staticRooms.filter((r) => !r.fullyBooked), []);

  // ── State ──────────────────────────────────────────────────────────
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    if (initialSlug && staticRooms.find((r) => r.slug === initialSlug && !r.fullyBooked)) {
      return initialSlug;
    }
    return availableRooms[0]?.slug ?? '';
  });

  const successRef = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const bookingCreateStarted = useRef(false);

  const [checkIn, setCheckIn] = useState<Date | null>(() =>
    initialCheckIn ? parseLocalDate(initialCheckIn) : null,
  );
  const [checkOut, setCheckOut] = useState<Date | null>(() =>
    initialCheckOut ? parseLocalDate(initialCheckOut) : null,
  );

  // Ako su datumi već poznati (proslijeđeni iz URL-a), preskoči na korak 2
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    if (initialStep === 2 || initialStep === 3) return initialStep;
    if (initialCheckIn && initialCheckOut) return 2;
    return 1;
  });
  const [form, setForm] = useState<BookingFormData>(() => {
    const a = initialAdults ? parseInt(initialAdults) : null;
    const ch = initialChildren ? parseInt(initialChildren) : null;
    const bf = initialBreakfast ? parseInt(initialBreakfast) : null;
    const ages = parseChildAgesParam(initialChildAges);
    return {
      ...BOOKING_FORM_DEFAULTS,
      adults: a && a >= 1 ? String(a) : BOOKING_FORM_DEFAULTS.adults,
      children: ch && ch >= 0 ? String(ch) : BOOKING_FORM_DEFAULTS.children,
      childAges: ages,
      breakfastGuests: bf && bf >= 0 ? String(bf) : BOOKING_FORM_DEFAULTS.breakfastGuests,
    };
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hub3Barcode, setHub3Barcode] = useState<string | null>(null);
  const [epcQR, setEpcQR] = useState<string | null>(null);

  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [success]);

  // Scroll na vrh koraka 2 ili 3 pri prolasku
  useEffect(() => {
    if (step === 2 && step2Ref.current) {
      step2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (step === 3 && step3Ref.current) {
      step3Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const selectedRoom = staticRooms.find((r) => r.slug === selectedSlug);
  const adultsCount = parseInt(form.adults) || 0;
  const childrenCount = parseInt(form.children) || 0;
  const childAges = useMemo(() => {
    const ages = form.childAges ?? [];
    if (ages.length >= childrenCount) return ages.slice(0, childrenCount);
    return [
      ...ages,
      ...Array.from({ length: Math.max(0, childrenCount - ages.length) }, () => 0),
    ];
  }, [form.childAges, childrenCount]);

  const autoExtraBed = selectedRoom
    ? roomNeedsExtraBed(selectedRoom, adultsCount, childAges)
    : false;

  const breakfastEnabled = (parseInt(form.breakfastGuests) || 0) > 0;
  const breakfastPerNight = breakfastEnabled
    ? calculateBreakfastPerNight(adultsCount, childAges)
    : 0;

  const priceData =
    checkIn && checkOut && selectedRoom
      ? calculatePrice(checkIn, checkOut, selectedRoom, {
          extraBeds: autoExtraBed ? 1 : 0,
          crib: form.needsCrib,
          breakfastPerNight,
        })
      : null;

  // ── Barcode fetch — legacy success UI; API endpoint not wired yet (HUB3 skill)
  // Kept for when /api/generate-barcode ships; unused until then.
  void barcodeApiPath;

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

  const buildNotes = useCallback(() => {
    return [
      form.country ? `Zemlja: ${form.country}` : '',
      form.bookingFor === 'other' && form.guestStayingName
        ? `Rezervacija za drugog gosta: ${form.guestStayingName}`
        : '',
      childAges.length > 0 ? `Starost djece: ${childAges.join(', ')} g.` : '',
      autoExtraBed ? 'Pomoćni ležaj: da (automatski)' : '',
      form.needsCrib ? 'Dječji krevetić: da' : '',
      breakfastEnabled
        ? `Doručak: da (${breakfastPerNight} €/noć)`
        : '',
      form.arrivalTime ? `Procijenjeno vrijeme dolaska: ${form.arrivalTime}` : '',
      form.isBusiness ? 'Poslovno putovanje: da' : '',
      form.isBusiness && form.companyName ? `Tvrtka: ${form.companyName}` : '',
      form.isBusiness && form.vatId ? `PDV broj: ${form.vatId}` : '',
      form.notes.trim() ? `Posebni zahtjevi:\n${form.notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [form, childAges, autoExtraBed, breakfastEnabled, breakfastPerNight]);

  const createBookingRequest = useCallback(async (): Promise<{
    bookingId: string;
    token: string;
    confirmationPath: string;
  } | null> => {
    if (!checkIn || !checkOut || !priceData || !selectedRoom) return null;

    const guestName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    const res = await fetch(bookingsApiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_slug: selectedSlug,
        check_in: formatDate(checkIn),
        check_out: formatDate(checkOut),
        locale,
        guest_name: guestName,
        guest_first_name: form.firstName.trim(),
        guest_last_name: form.lastName.trim(),
        guest_country: form.country,
        guest_email: form.email,
        guest_phone: form.phone,
        adults: adultsCount,
        children: childrenCount,
        child_ages: childAges,
        booking_for: form.bookingFor,
        guest_staying_name:
          form.bookingFor === 'other' ? form.guestStayingName.trim() || null : null,
        needs_extra_bed: autoExtraBed,
        needs_crib: form.needsCrib,
        breakfast_guests: breakfastEnabled ? adultsCount + childrenCount : 0,
        is_business: form.isBusiness,
        company_name: form.isBusiness ? form.companyName.trim() || null : null,
        vat_id: form.isBusiness ? form.vatId.trim() || null : null,
        notes: buildNotes() || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const code = typeof data.error === 'string' ? data.error : undefined;
      if (code === 'minNights') {
        throw new Error(t('errors.minNights', { min: MIN_NIGHTS }));
      }
      if (code === 'capacityExceeded' && selectedRoom) {
        throw new Error(
          t('errors.capacityExceeded', {
            name: selectedRoom.name,
            capacity: selectedRoom.capacity,
          }),
        );
      }
      if (code === 'extraBedUnavailable' && selectedRoom) {
        throw new Error(t('errors.extraBedUnavailable', { name: selectedRoom.name }));
      }
      throw new Error(
        code && t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.submitFailed'),
      );
    }

    const bookingId = data.bookingId as string | undefined;
    if (!bookingId) {
      throw new Error(t('errors.submitFailed'));
    }

    const confirmationPath =
      (data.confirmationPath as string | undefined) ??
      (data.confirmationUrl
        ? (() => {
            try {
              const url = new URL(data.confirmationUrl as string, window.location.origin);
              return `${url.pathname}${url.search}`;
            } catch {
              return data.confirmationUrl as string;
            }
          })()
        : null);

    if (!confirmationPath) {
      throw new Error(t('errors.submitFailed'));
    }

    const token =
      new URL(confirmationPath, window.location.origin).searchParams.get('token') ?? '';
    if (!token) {
      throw new Error(t('errors.submitFailed'));
    }

    return { bookingId, token, confirmationPath };
  }, [
    adultsCount,
    autoExtraBed,
    bookingsApiPath,
    breakfastEnabled,
    buildNotes,
    checkIn,
    checkOut,
    childAges,
    childrenCount,
    form,
    locale,
    priceData,
    selectedRoom,
    selectedSlug,
    t,
  ]);

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || !priceData || !selectedRoom) return;

    const errors = validateBookingForm(form);
    if (Object.keys(errors).length > 0) return;

    if (!roomFitsGuests(selectedRoom, adultsCount, childAges)) {
      setSubmitError(
        t('errors.maxGuests', {
          apartmentName: selectedRoom.name,
          capacity: selectedRoom.capacity,
        }),
      );
      return;
    }

    setSubmitError(null);
    setStep(3);
  };

  // Korak 3: kreiraj rezervaciju → Saferpay checkout (bez međukoraka)
  useEffect(() => {
    if (step !== 3 || bookingCreateStarted.current) return;
    if (!checkIn || !checkOut || !priceData || !selectedRoom) return;

    bookingCreateStarted.current = true;
    let cancelled = false;

    (async () => {
      setSubmitError(null);
      try {
        const created = await createBookingRequest();
        if (cancelled || !created) return;

        const checkoutRes = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: created.bookingId,
            token: created.token,
            paymentType: 'deposit',
          }),
        });
        const checkoutData = (await checkoutRes.json()) as {
          url?: string;
          error?: string;
        };

        if (cancelled) return;

        if (!checkoutRes.ok || !checkoutData.url) {
          // Booking exists — fall back to confirmation so guest can retry card pay
          router.push(created.confirmationPath);
          return;
        }

        window.location.href = checkoutData.url;
      } catch (err) {
        if (!cancelled) {
          setSubmitError(err instanceof Error ? err.message : t('errors.submitFailed'));
          setStep(2);
          bookingCreateStarted.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    step,
    checkIn,
    checkOut,
    priceData,
    selectedRoom,
    createBookingRequest,
    router,
    t,
  ]);

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
            name: () => <strong className="text-text">{form.firstName} {form.lastName}</strong>,
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
                  — {t('success.summary.balanceNote')}
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
            {(hub3Barcode || epcQR) && (
              <div className="pt-4 border-t border-stone">
                <p className="text-xs font-semibold text-text mb-3 text-center">
                  {t('success.summary.qrTitle')}
                </p>
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
      {/* Naslov stranice — samo korak 1 */}
      <div className="text-center mb-10">
        <p className="text-accent font-medium tracking-widest text-xs uppercase mb-3">
          {tPage('eyebrow')}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-text mb-4">
          {tPage('title')}
        </h1>
        <p className="text-muted text-base leading-relaxed">{tPage('description')}</p>
      </div>

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
                {r.name} — {r.capacityNote} · {r.price}€/{t('form.perNight')}
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
                  — {t('paymentTerms.balanceNote')}
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
        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-4 rounded-full transition-colors text-sm"
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
            childrenCount={form.children}
            locale={locale}
            reviewSummary={reviewSummary}
          />
        </div>

        {/* Desno: forma s podacima gosta */}
        <div>
          <h2 className="font-serif text-2xl font-semibold text-text mb-6">
            {t('steps.details')}
          </h2>

          <form onSubmit={handleStep2Submit} className="space-y-6">

            {/* ── 1. Kontakt podaci ─────────────────────────────────── */}
            <div className="space-y-4">
              {/* Ime + Prezime */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    {t('form.firstName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder={t('form.firstNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    {t('form.lastName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder={t('form.lastNamePlaceholder')}
                  />
                </div>
              </div>

              {/* E-pošta */}
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

              {/* Zemlja */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {t('form.country')} <span className="text-red-400">*</span>
                </label>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                >
                  {BOOKING_COUNTRY_OPTIONS.map(({ value, key }) => (
                    <option key={value} value={value}>
                      {t(`form.countries.${key}`)}
                    </option>
                  ))}
                </select>
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
            </div>

            {/* ── 2. Za koga je rezervacija? ──────────────────────── */}
            <div>
              <p className="text-sm font-medium text-text mb-2">
                {t('form.bookingForTitle')}{' '}
                <span className="text-xs font-normal text-muted">{t('form.optional')}</span>
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer text-sm text-text">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="self"
                    checked={form.bookingFor === 'self'}
                    onChange={handleFormChange}
                    className="accent-primary"
                  />
                  {t('form.bookingForSelf')}
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm text-text">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="other"
                    checked={form.bookingFor === 'other'}
                    onChange={handleFormChange}
                    className="accent-primary"
                  />
                  {t('form.bookingForOther')}
                </label>
              </div>
              {form.bookingFor === 'other' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-text mb-1.5">
                    {t('form.guestStayingName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="guestStayingName"
                    value={form.guestStayingName}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder={t('form.guestStayingNamePlaceholder')}
                  />
                </div>
              )}
            </div>

            {/* ── 3. Dodatni kreveti (samo krevetić; pomoćni je auto) ───── */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-text">
                {t('form.extraBedsSection')}{' '}
                <span className="text-xs font-normal text-muted">{t('form.optional')}</span>
              </p>

              {autoExtraBed && (
                <p className="text-sm text-text bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {t('form.extraBedAuto', { price: EXTRA_BED_PRICE_PER_NIGHT })}
                </p>
              )}

              {/* Dječji krevetić — uvijek vidljiv */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  name="needsCrib"
                  type="checkbox"
                  checked={form.needsCrib}
                  onChange={handleFormChange}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-text">
                  {t('form.needsCrib')}{' '}
                  <span className="font-semibold text-primary">
                    +{CRIB_PRICE_PER_NIGHT} €/{t('form.perNight')}
                  </span>
                  <br />
                  <span className="text-xs text-muted">{t('form.needsCribHint')}</span>
                </span>
              </label>

              {!form.needsCrib && (
                <p className="text-xs text-muted bg-stone-light border border-stone rounded-lg px-3 py-2">
                  {t('form.childFreeOnBed')}
                </p>
              )}
            </div>

            {/* ── 4. Dolazak i posebni zahtjevi ───────────────────── */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {t('form.arrivalTime')}{' '}
                  <span className="text-xs font-normal text-muted">{t('form.optional')}</span>
                </label>
                <select
                  name="arrivalTime"
                  value={form.arrivalTime}
                  onChange={handleFormChange}
                  className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                >
                  <option value="">{t('form.selectPlaceholder')}</option>
                  {ARRIVAL_TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">{t('form.arrivalTimeHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {t('form.notes')}{' '}
                  <span className="text-xs font-normal text-muted">{t('form.optional')}</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder=""
                />
              </div>
            </div>

            {/* ── 5. Poslovno putovanje ────────────────────────────── */}
            <div>
              <p className="text-sm font-medium text-text mb-2">
                {t('form.businessTitle')}{' '}
                <span className="text-xs font-normal text-muted">{t('form.optional')}</span>
              </p>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text">
                  <input
                    type="radio"
                    name="isBusiness"
                    value="false"
                    checked={!form.isBusiness}
                    onChange={() => setForm((prev) => ({ ...prev, isBusiness: false }))}
                    className="accent-primary"
                  />
                  {t('form.businessNo')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text">
                  <input
                    type="radio"
                    name="isBusiness"
                    value="true"
                    checked={form.isBusiness}
                    onChange={() => setForm((prev) => ({ ...prev, isBusiness: true }))}
                    className="accent-primary"
                  />
                  {t('form.businessYes')}
                </label>
              </div>
              {form.isBusiness && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      {t('form.companyName')}{' '}
                      <span className="text-xs font-normal text-muted">{t('form.optional')}</span>
                    </label>
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleFormChange}
                      className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder={t('form.companyNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      {t('form.vatId')}{' '}
                      <span className="text-xs font-normal text-muted">{t('form.optional')}</span>
                    </label>
                    <input
                      name="vatId"
                      value={form.vatId}
                      onChange={handleFormChange}
                      className="w-full border border-stone rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder={t('form.vatIdPlaceholder')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Kućni red */}
            {rulesText ?? (
              <div className="bg-stone-light rounded-xl p-4 text-xs text-muted space-y-2">
                <p>
                  <strong className="text-text">{t('form.rules.checkIn')}:</strong>{' '}
                  {t('form.rules.checkInTime')}
                  &nbsp;|&nbsp;
                  <strong className="text-text">{t('form.rules.checkOut')}:</strong>{' '}
                  {t('form.rules.checkOutTime')}
                </p>
                <Link
                  href={propertySectionHref(FACILITIES_SECTION_ID)}
                  className="text-primary hover:underline underline-offset-2 font-medium"
                >
                  {t('form.rulesLinkLabel')}
                </Link>
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
                {t.rich('form.agreeRules', {
                  houseRules: (chunks) => (
                    <Link
                      href={propertySectionHref(FACILITIES_SECTION_ID)}
                      className="text-primary hover:underline underline-offset-2"
                    >
                      {chunks}
                    </Link>
                  ),
                  bookingTerms: (chunks) => (
                    <Link
                      href={propertySectionHref(FACILITIES_SECTION_ID)}
                      className="text-primary hover:underline underline-offset-2"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
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

            {/* Navigacija: natrag + nastavi na plaćanje */}
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
                disabled={!form.agreeRules}
                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-full transition-colors text-sm flex items-center justify-center gap-2"
              >
                {t('form.submit', { totalPrice: priceData.totalPrice })} →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  // ── Korak 3: Priprema plaćanja (kreira rezervaciju → redirect) ───
  const step3 = checkIn && checkOut && priceData && selectedRoom ? (
    <div ref={step3Ref} className="scroll-mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        <div className="lg:sticky lg:top-24">
          <BookingSummaryCard
            room={selectedRoom}
            checkIn={checkIn}
            checkOut={checkOut}
            priceData={priceData}
            adults={form.adults}
            childrenCount={form.children}
            locale={locale}
            reviewSummary={reviewSummary}
          />
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 size={36} className="animate-spin text-primary mb-4" />
          <h2 className="font-serif text-2xl font-semibold text-text mb-2">
            {t('stepper.step3')}
          </h2>
          <p className="text-sm text-muted">{t('form.step3Redirecting')}</p>

          {submitError && (
            <div className="mt-6 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-left max-w-md">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}
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
      {step === 3 && step3}
    </div>
  );
}
