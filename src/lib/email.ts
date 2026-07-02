// Adapted from Villa-Jurina/src/lib/email.ts — Ginko branding, no QR attachments yet.

import { Resend } from 'resend';
import { formatDisplayDate, parseLocalDate } from '@/modules/booking/dates';
import {
  OWNER_EMAIL,
  CONTACT_EMAIL,
  OWNER_PHONE,
  RECIPIENT_IBAN,
  RECIPIENT_NAME,
  RECIPIENT_BIC,
  RECIPIENT_BANK_NAME,
  SITE_NAME,
  SITE_LOCATION,
  DEPOSIT_PERCENT,
} from '@/modules/booking/booking.config';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createBookingViewToken, getBookingConfirmationUrl } from '@/lib/bookingConfirmation';
import { getRoomBySlug } from '@/modules/rooms/room.repository';

export type BookingEmailData = {
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestCountry?: string | null;
  needsCrib?: boolean;
  needsExtraBed?: boolean;
  breakfastGuests?: number;
  includeWellness?: boolean;
  isBusiness?: boolean;
  companyName?: string | null;
  vatId?: string | null;
  bookingFor?: 'self' | 'other';
  guestStayingName?: string | null;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalPrice: number;
  deposit: number;
  bookingId?: string;
  confirmationUrl?: string;
  locale?: 'hr' | 'en' | 'de';
};

const OWNER_INBOX = () =>
  process.env.OWNER_EMAIL?.trim() || OWNER_EMAIL || 'ginkosobe3@gmail.com';

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY nije postavljen — emailovi se ne šalju');
    return null;
  }
  return new Resend(apiKey);
}

const FROM = () => process.env.RESEND_FROM?.trim() ?? 'onboarding@resend.dev';

type FullData = BookingEmailData & {
  checkInStr: string;
  checkOutStr: string;
  reference: string | null;
};

function buildFullData(data: BookingEmailData): FullData {
  return {
    ...data,
    checkInStr: formatDisplayDate(data.checkIn),
    checkOutStr: formatDisplayDate(data.checkOut),
    reference: data.bookingId
      ? `REZ-${data.bookingId.substring(0, 8).toUpperCase()}`
      : null,
  };
}

/** Obavijest vlasniku o novoj rezervaciji (bez emaila gostu). */
export async function sendOwnerNewBookingNotification(data: BookingEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const d = buildFullData(data);

  const result = await resend.emails.send({
    from: FROM(),
    to: OWNER_INBOX(),
    subject: `Nova rezervacija – ${d.guestName} | ${d.roomName}`,
    html: ownerNewBookingHtml(d),
  });

  if (result.error) console.error('[email] Owner email API error:', result.error);
}

/** @deprecated Koristi sendOwnerNewBookingNotification — gost prima email tek nakon plaćanja. */
export async function sendNewBookingEmails(data: BookingEmailData): Promise<void> {
  await sendOwnerNewBookingNotification(data);
}

export type GuestQuestionEmailData = {
  guestEmail: string;
  question: string;
  locale?: 'hr' | 'en' | 'de';
};

/** Obavijest vlasniku o pitanju s FAQ sekcije. */
export async function sendGuestQuestionNotification(
  data: GuestQuestionEmailData,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    throw new Error('Email servis nije konfiguriran');
  }

  const locale = data.locale ?? 'hr';
  const subject =
    locale === 'en'
      ? `Guest question – ${SITE_NAME}`
      : locale === 'de'
        ? `Gästefrage – ${SITE_NAME}`
        : `Pitanje gosta – ${SITE_NAME}`;

  const result = await resend.emails.send({
    from: FROM(),
    to: OWNER_INBOX(),
    replyTo: data.guestEmail,
    subject,
    html: guestQuestionHtml(data),
  });

  if (result.error) {
    console.error('[email] Guest question API error:', result.error);
    throw new Error(result.error.message);
  }
}

/** Potvrda gostu nakon uspješnog plaćanja depozita. */
export async function notifyGuestBookingConfirmed(bookingId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !booking?.guest_email) return;

  const room = getRoomBySlug(booking.room_slug);
  const token = createBookingViewToken(booking.id, booking.guest_email);
  const confirmationUrl = getBookingConfirmationUrl(booking.id, token);
  const locale =
    booking.locale === 'en' || booking.locale === 'de' ? booking.locale : 'hr';

  await sendConfirmationEmail({
    guestName: booking.guest_name,
    guestEmail: booking.guest_email,
    guestPhone: booking.guest_phone,
    roomName: room?.name ?? booking.room_slug,
    checkIn: parseLocalDate(booking.check_in),
    checkOut: parseLocalDate(booking.check_out),
    nights: booking.nights,
    totalPrice: booking.total_price,
    deposit: booking.deposit,
    bookingId: booking.id,
    confirmationUrl,
    locale,
  });
}

/** Ponovno slanje gostu (admin) — potvrda rezervacije. */
export async function sendConfirmationEmail(data: BookingEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const d = buildFullData(data);
  const locale = data.locale ?? 'hr';

  const result = await resend.emails.send({
    from: FROM(),
    to: data.guestEmail,
    subject:
      locale === 'en'
        ? `Booking confirmed – ${d.roomName} | ${SITE_NAME}`
        : locale === 'de'
          ? `Buchung bestätigt – ${d.roomName} | ${SITE_NAME}`
          : `Rezervacija potvrđena – ${d.roomName} | ${SITE_NAME}`,
    html: guestConfirmedHtml(d, locale),
  });

  if (result.error) console.error('[email] Confirmation email failed:', result.error);
}

// ── HTML (minimal, mobile-friendly) ───────────────────────────────

function paymentBlock(d: FullData, depositPct: number): string {
  if (!RECIPIENT_IBAN) return '';
  return `
    <div style="background:#f2ede6;border-radius:8px;padding:16px;margin:20px 0;font-size:14px;line-height:1.7;color:#6b7a6e;">
      <p style="margin:0 0 8px;font-weight:600;color:#1e2d22;">Uplata depozita (${depositPct}% = ${d.deposit}€)</p>
      <p style="margin:0 0 12px;">Molimo uplatite depozit u roku od 48 sati kako bismo potvrdili rezervaciju.</p>
      <p style="margin:0;"><strong>Primatelj:</strong> ${RECIPIENT_NAME || SITE_NAME}</p>
      <p style="margin:4px 0 0;"><strong>IBAN:</strong> ${RECIPIENT_IBAN}</p>
      ${RECIPIENT_BIC ? `<p style="margin:4px 0 0;"><strong>BIC:</strong> ${RECIPIENT_BIC}</p>` : ''}
      ${RECIPIENT_BANK_NAME ? `<p style="margin:4px 0 0;"><strong>Banka:</strong> ${RECIPIENT_BANK_NAME}</p>` : ''}
      <p style="margin:8px 0 0;"><strong>Poziv na broj:</strong> ${d.reference ?? d.guestName}</p>
    </div>`;
}

function guestReceivedHtml(d: FullData, depositPct: number, locale: 'hr' | 'en' | 'de'): string {
  const pricePerNight = Math.round(d.totalPrice / d.nights);
  const intro =
    locale === 'en'
      ? 'Your booking request has been received. Please pay the deposit within 48 hours.'
      : locale === 'de'
        ? 'Ihre Buchungsanfrage wurde empfangen. Bitte zahlen Sie die Anzahlung innerhalb von 48 Stunden.'
        : 'Vaša rezervacija je zaprimljena. Molimo uplatite depozit u roku od 48 sati.';

  return emailShell(`
    <div style="background:#3a6b4a;padding:28px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;font-family:Georgia,serif;">${SITE_NAME}</h1>
      <p style="color:#e8f0ea;margin:8px 0 0;font-size:13px;">${SITE_LOCATION}</p>
    </div>
    <div style="padding:28px 24px;">
      <p style="font-size:17px;margin:0 0 16px;color:#1e2d22;">${d.guestName},</p>
      <p style="color:#6b7a6e;line-height:1.7;margin:0 0 20px;">${intro}</p>
      <table style="width:100%;font-size:14px;color:#1e2d22;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b7a6e;">Soba</td><td style="font-weight:600;text-align:right;">${d.roomName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7a6e;">Check-in</td><td style="font-weight:600;text-align:right;">${d.checkInStr} (14:00)</td></tr>
        <tr><td style="padding:6px 0;color:#6b7a6e;">Check-out</td><td style="font-weight:600;text-align:right;">${d.checkOutStr} (10:00)</td></tr>
        <tr><td style="padding:6px 0;color:#6b7a6e;">Noći</td><td style="font-weight:600;text-align:right;">${d.nights}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7a6e;">Cijena / noć</td><td style="font-weight:600;text-align:right;">${pricePerNight}€</td></tr>
        <tr><td style="padding:6px 0;color:#6b7a6e;">Ukupno</td><td style="font-weight:600;text-align:right;">${d.totalPrice}€</td></tr>
        <tr><td style="padding:6px 0;color:#6b7a6e;">Depozit</td><td style="font-weight:600;text-align:right;">${d.deposit}€</td></tr>
      </table>
      ${paymentBlock(d, depositPct)}
      ${
        d.confirmationUrl
          ? `<p style="font-size:14px;color:#6b7a6e;margin:16px 0 0;">Detalji i uplata: <a href="${d.confirmationUrl}" style="color:#3a6b4a;">${d.confirmationUrl}</a></p>`
          : ''
      }
      <p style="font-size:13px;color:#6b7a6e;margin:24px 0 0;">Kontakt: ${OWNER_PHONE || ''} · ${CONTACT_EMAIL}</p>
    </div>
  `);
}

function guestConfirmedHtml(d: FullData, locale: 'hr' | 'en' | 'de'): string {
  const msg =
    locale === 'en'
      ? 'Your booking is confirmed. We look forward to your stay.'
      : locale === 'de'
        ? 'Ihre Buchung ist bestätigt. Wir freuen uns auf Ihren Aufenthalt.'
        : 'Vaša rezervacija je potvrđena. Veselimo se vašem dolasku.';

  return emailShell(`
    <div style="background:#3a6b4a;padding:28px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">${SITE_NAME}</h1>
    </div>
    <div style="padding:28px 24px;">
      <p style="color:#166534;font-weight:600;margin:0 0 16px;">✓ ${msg}</p>
      <p style="margin:0 0 8px;"><strong>${d.roomName}</strong></p>
      <p style="color:#6b7a6e;font-size:14px;margin:0;">${d.checkInStr} – ${d.checkOutStr} · ${d.nights} noći · ${d.totalPrice}€</p>
      ${
        d.confirmationUrl
          ? `<p style="margin-top:16px;font-size:14px;"><a href="${d.confirmationUrl}" style="color:#3a6b4a;">Otvori potvrdu rezervacije</a></p>`
          : ''
      }
    </div>
  `);
}

function guestQuestionHtml(data: GuestQuestionEmailData): string {
  const escapedQuestion = data.question
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return emailShell(`
    <div style="background:#3a6b4a;padding:20px 24px;">
      <h1 style="color:#fff;font-size:18px;margin:0;">Novo pitanje gosta</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7a6e;">
        Pitanje poslano s FAQ sekcije na web stranici.
      </p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#6b7a6e;width:120px;vertical-align:top;">Email</td>
          <td><a href="mailto:${data.guestEmail}">${data.guestEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7a6e;vertical-align:top;">Pitanje</td>
          <td style="line-height:1.6;white-space:pre-wrap;">${escapedQuestion}</td>
        </tr>
      </table>
    </div>
  `);
}

function ownerNewBookingHtml(d: FullData): string {
  const extraRows = [
    d.guestCountry
      ? `<tr><td style="padding:8px 0;color:#6b7a6e;width:120px;">Zemlja</td><td>${d.guestCountry}</td></tr>`
      : '',
    d.bookingFor === 'other' && d.guestStayingName
      ? `<tr><td style="padding:8px 0;color:#6b7a6e;">Boravi gost</td><td style="font-weight:600;">${d.guestStayingName}</td></tr>`
      : '',
    d.needsExtraBed
      ? `<tr><td style="padding:8px 0;color:#6b7a6e;">Pomoćni ležaj</td><td style="color:#c26c0a;font-weight:600;">Da ⚠️</td></tr>`
      : '',
    d.needsCrib
      ? `<tr><td style="padding:8px 0;color:#6b7a6e;">Dječji krevetić</td><td style="color:#c26c0a;font-weight:600;">Da ⚠️</td></tr>`
      : '',
    d.breakfastGuests && d.breakfastGuests > 0
      ? `<tr><td style="padding:8px 0;color:#6b7a6e;">Doručak</td><td style="font-weight:600;">${d.breakfastGuests} osoba</td></tr>`
      : '',
    d.includeWellness
      ? `<tr><td style="padding:8px 0;color:#6b7a6e;">Wellness zona</td><td style="color:#1a7a4e;font-weight:600;">Uključena ✓</td></tr>`
      : '',
    d.isBusiness
      ? `<tr><td style="padding:8px 0;color:#6b7a6e;">Poslovno</td><td>Da${d.companyName ? ` — ${d.companyName}` : ''}${d.vatId ? ` | PDV: ${d.vatId}` : ''}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return emailShell(`
    <div style="background:#3a6b4a;padding:20px 24px;">
      <h1 style="color:#fff;font-size:18px;margin:0;">Nova rezervacija</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#6b7a6e;width:120px;">Soba</td><td style="font-weight:600;">${d.roomName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7a6e;">Gost</td><td style="font-weight:600;">${d.guestName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7a6e;">Email</td><td><a href="mailto:${d.guestEmail}">${d.guestEmail}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6b7a6e;">Telefon</td><td>${d.guestPhone ?? '—'}</td></tr>
        ${extraRows}
        <tr><td style="padding:8px 0;color:#6b7a6e;">Check-in</td><td>${d.checkInStr}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7a6e;">Check-out</td><td>${d.checkOutStr}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7a6e;">Noći</td><td>${d.nights}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7a6e;">Ukupno</td><td style="font-weight:600;font-size:16px;color:#3a6b4a;">${d.totalPrice}€</td></tr>
        <tr><td style="padding:8px 0;color:#6b7a6e;">Depozit</td><td>${d.deposit}€</td></tr>
        ${d.reference ? `<tr><td style="padding:8px 0;color:#6b7a6e;">Referenca</td><td>${d.reference}</td></tr>` : ''}
      </table>
      ${
        d.confirmationUrl
          ? `<p style="margin-top:16px;font-size:13px;"><a href="${d.confirmationUrl}">Admin / potvrda link</a></p>`
          : ''
      }
    </div>
  `);
}

function emailShell(inner: string): string {
  return `<!DOCTYPE html><html lang="hr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">${inner}</div>
</body></html>`;
}
