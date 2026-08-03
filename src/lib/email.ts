// Ginko booking emails — Resend HTML templates (guest + owner).

import { Resend } from 'resend';
import { formatDisplayDate, parseLocalDate } from '@/modules/booking/dates';
import {
  OWNER_EMAIL,
  SITE_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE_TEL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_URL,
} from '@/modules/booking/booking.config';
import {
  PROPERTY_ADDRESS,
  PROPERTY_MAP_URL,
} from '@/modules/property/property-details.config';
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
  adults?: number;
  children?: number;
  status?: 'pending' | 'confirmed' | 'cancelled';
  depositPaid?: boolean;
  notes?: string | null;
  pricePerNight?: number | null;
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
  balance: number;
};

function buildFullData(data: BookingEmailData): FullData {
  const total = Number(data.totalPrice) || 0;
  const deposit = Number(data.deposit) || 0;
  return {
    ...data,
    checkInStr: formatDisplayDate(data.checkIn),
    checkOutStr: formatDisplayDate(data.checkOut),
    reference: data.bookingId
      ? `REZ-${data.bookingId.substring(0, 8).toUpperCase()}`
      : null,
    balance: Math.max(0, Math.round((total - deposit) * 100) / 100),
  };
}

/** Map DB booking row → email payload */
export function bookingRowToEmailData(
  booking: Record<string, unknown>,
  opts?: { confirmationUrl?: string; roomName?: string },
): BookingEmailData {
  const localeRaw = booking.locale;
  const locale =
    localeRaw === 'en' || localeRaw === 'de' ? localeRaw : 'hr';
  const slug = String(booking.room_slug ?? '');
  const room = getRoomBySlug(slug);

  return {
    guestName: String(booking.guest_name ?? ''),
    guestEmail: String(booking.guest_email ?? ''),
    guestPhone: (booking.guest_phone as string | null) ?? null,
    guestCountry: (booking.guest_country as string | null) ?? null,
    needsCrib: booking.needs_crib === true,
    needsExtraBed: booking.needs_extra_bed === true,
    breakfastGuests: Number(booking.breakfast_guests ?? 0),
    includeWellness: booking.include_wellness === true,
    isBusiness: booking.is_business === true,
    companyName: (booking.company_name as string | null) ?? null,
    vatId: (booking.vat_id as string | null) ?? null,
    bookingFor: booking.booking_for === 'other' ? 'other' : 'self',
    guestStayingName: (booking.guest_staying_name as string | null) ?? null,
    roomName: opts?.roomName ?? room?.name ?? slug,
    checkIn: parseLocalDate(String(booking.check_in)),
    checkOut: parseLocalDate(String(booking.check_out)),
    nights: Number(booking.nights ?? 0),
    totalPrice: Number(booking.total_price ?? 0),
    deposit: Number(booking.deposit ?? 0),
    bookingId: String(booking.id ?? ''),
    confirmationUrl: opts?.confirmationUrl,
    locale,
    adults: Number(booking.adults ?? 1),
    children: Number(booking.children ?? 0),
    status:
      booking.status === 'confirmed' || booking.status === 'cancelled'
        ? booking.status
        : 'pending',
    depositPaid: booking.deposit_paid === true,
    notes: (booking.notes as string | null) ?? null,
    pricePerNight: booking.price_per_night != null ? Number(booking.price_per_night) : null,
  };
}

/** Obavijest vlasniku o novoj rezervaciji (bez emaila gostu). */
export async function sendOwnerNewBookingNotification(data: BookingEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const d = buildFullData(data);
  const ref = d.reference ? ` ${d.reference}` : '';

  const result = await resend.emails.send({
    from: FROM(),
    to: OWNER_INBOX(),
    subject: `Nova rezervacija${ref} – ${d.guestName} | ${d.roomName}`,
    html: ownerNewBookingHtml(d),
  });

  if (result.error) console.error('[email] Owner email API error:', result.error);
}

/** @deprecated Koristi sendOwnerNewBookingNotification */
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

  const token = createBookingViewToken(booking.id, booking.guest_email);
  const confirmationUrl = getBookingConfirmationUrl(booking.id, token);

  await sendConfirmationEmail(
    bookingRowToEmailData(booking as Record<string, unknown>, { confirmationUrl }),
  );
}

/** Ponovno slanje gostu (admin) — potvrda rezervacije. */
export async function sendConfirmationEmail(data: BookingEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const d = buildFullData(data);
  const locale = data.locale ?? 'hr';
  const refBit = d.reference ? ` ${d.reference}` : '';

  const result = await resend.emails.send({
    from: FROM(),
    to: data.guestEmail,
    subject:
      locale === 'en'
        ? `Booking confirmed${refBit} – ${d.roomName} | ${SITE_NAME}`
        : locale === 'de'
          ? `Buchung bestätigt${refBit} – ${d.roomName} | ${SITE_NAME}`
          : `Rezervacija potvrđena${refBit} – ${d.roomName} | ${SITE_NAME}`,
    html: guestConfirmedHtml(d, locale),
  });

  if (result.error) console.error('[email] Confirmation email failed:', result.error);
}

// ── Shared HTML bits ──────────────────────────────────────────────

type Locale = 'hr' | 'en' | 'de';

function t(
  locale: Locale,
  strings: { hr: string; en: string; de: string },
): string {
  return strings[locale];
}

function row(label: string, value: string, opts?: { strong?: boolean; accent?: boolean }) {
  const style = opts?.accent
    ? 'font-weight:600;font-size:16px;color:#3a6b4a;'
    : opts?.strong
      ? 'font-weight:600;color:#1e2d22;'
      : 'color:#1e2d22;';
  return `<tr>
    <td style="padding:8px 0;color:#6b7a6e;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;${style}">${value}</td>
  </tr>`;
}

function extrasRows(d: FullData, locale: Locale): string {
  const parts: string[] = [];
  if (d.bookingFor === 'other' && d.guestStayingName) {
    parts.push(
      row(
        t(locale, { hr: 'Boravi gost', en: 'Staying guest', de: 'Gast vor Ort' }),
        escapeHtml(d.guestStayingName),
        { strong: true },
      ),
    );
  }
  if (d.needsExtraBed) {
    parts.push(
      row(
        t(locale, { hr: 'Pomoćni ležaj', en: 'Extra bed', de: 'Zustellbett' }),
        t(locale, { hr: 'Da (20 €/noć)', en: 'Yes (€20/night)', de: 'Ja (20 €/Nacht)' }),
        { strong: true },
      ),
    );
  }
  if (d.needsCrib) {
    parts.push(
      row(
        t(locale, { hr: 'Dječji krevetić', en: 'Baby crib', de: 'Babybett' }),
        t(locale, { hr: 'Da (20 €/noć)', en: 'Yes (€20/night)', de: 'Ja (20 €/Nacht)' }),
        { strong: true },
      ),
    );
  }
  if (d.breakfastGuests && d.breakfastGuests > 0) {
    parts.push(
      row(
        t(locale, { hr: 'Doručak', en: 'Breakfast', de: 'Frühstück' }),
        `${d.breakfastGuests}×`,
        { strong: true },
      ),
    );
  }
  if (d.includeWellness) {
    parts.push(
      row(
        t(locale, { hr: 'Wellness', en: 'Wellness', de: 'Wellness' }),
        t(locale, {
          hr: 'Sauna + jacuzzi uključeni',
          en: 'Sauna + jacuzzi included',
          de: 'Sauna + Jacuzzi inklusive',
        }),
        { strong: true },
      ),
    );
  }
  if (d.isBusiness) {
    const biz = [
      d.companyName ? escapeHtml(d.companyName) : '',
      d.vatId ? `PDV: ${escapeHtml(d.vatId)}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    parts.push(
      row(
        t(locale, { hr: 'Poslovno', en: 'Business', de: 'Geschäftlich' }),
        biz || 'Da',
      ),
    );
  }
  return parts.join('');
}

function guestsLabel(d: FullData, locale: Locale): string {
  const adults = d.adults ?? 1;
  const children = d.children ?? 0;
  if (locale === 'en') {
    return `${adults} adult${adults === 1 ? '' : 's'}${children ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}`;
  }
  if (locale === 'de') {
    return `${adults} Erwachsene${children ? `, ${children} Kind${children === 1 ? '' : 'er'}` : ''}`;
  }
  const a =
    adults === 1 ? '1 odrasla' : adults < 5 ? `${adults} odrasle` : `${adults} odraslih`;
  if (!children) return a;
  const c = children === 1 ? '1 dijete' : `${children} djece`;
  return `${a}, ${c}`;
}

function paymentBlock(d: FullData, locale: Locale, forGuest: boolean): string {
  const depositNote = forGuest
    ? d.depositPaid
      ? t(locale, {
          hr: 'Depozit plaćen ✓',
          en: 'Deposit paid ✓',
          de: 'Anzahlung bezahlt ✓',
        })
      : t(locale, {
          hr: 'Depozit (uplata)',
          en: 'Deposit',
          de: 'Anzahlung',
        })
    : d.depositPaid
      ? t(locale, { hr: 'Depozit plaćen', en: 'Deposit paid', de: 'Anzahlung bezahlt' })
      : t(locale, {
          hr: 'Depozit (čeka uplatu)',
          en: 'Deposit (awaiting payment)',
          de: 'Anzahlung (ausstehend)',
        });

  return `
    <div style="background:#f2ede6;border-radius:8px;padding:16px;margin:20px 0;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        ${row(t(locale, { hr: 'Ukupno', en: 'Total', de: 'Gesamt' }), `${d.totalPrice} €`, { accent: true })}
        ${row(depositNote, `${d.deposit} €`, { strong: true })}
        ${row(
          t(locale, {
            hr: 'Ostatak na dolasku',
            en: 'Balance on arrival',
            de: 'Restbetrag bei Ankunft',
          }),
          `${d.balance} €`,
          { strong: true },
        )}
      </table>
    </div>`;
}

function contactFooter(locale: Locale): string {
  return `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e8e4dc;font-size:13px;color:#6b7a6e;line-height:1.7;">
      <p style="margin:0 0 4px;font-weight:600;color:#1e2d22;">${SITE_NAME}</p>
      <p style="margin:0;">
        <a href="${PROPERTY_MAP_URL}" style="color:#3a6b4a;">${PROPERTY_ADDRESS}</a>
      </p>
      <p style="margin:8px 0 0;">
        <a href="tel:${CONTACT_PHONE_TEL}" style="color:#3a6b4a;">${CONTACT_PHONE_DISPLAY}</a>
        ·
        <a href="mailto:${CONTACT_EMAIL}" style="color:#3a6b4a;">${CONTACT_EMAIL}</a>
        ·
        <a href="${CONTACT_WHATSAPP_URL}" style="color:#3a6b4a;">WhatsApp</a>
      </p>
      <p style="margin:8px 0 0;font-size:12px;">
        ${t(locale, {
          hr: 'Check-in 14:00–22:00 · Check-out do 10:00',
          en: 'Check-in 14:00–22:00 · Check-out by 10:00',
          de: 'Check-in 14:00–22:00 · Check-out bis 10:00',
        })}
      </p>
    </div>`;
}

function houseRulesBlock(locale: Locale): string {
  const items =
    locale === 'en'
      ? [
          'Free private parking on site',
          'Check-in 14:00–22:00 · check-out by 10:00',
          'No smoking indoors (terrace/yard OK)',
          'Quiet hours 23:00–07:00',
          'Pets on request (cleaning fee may apply)',
        ]
      : locale === 'de'
        ? [
            'Kostenloser Privatparkplatz vor Ort',
            'Check-in 14:00–22:00 · Check-out bis 10:00',
            'Rauchen nur auf Terrasse/Hof',
            'Ruhezeiten 23:00–07:00',
            'Haustiere auf Anfrage (Reinigungsgebühr möglich)',
          ]
        : [
            'Besplatan privatni parking uz objekt',
            'Prijava 14:00–22:00 · odjava do 10:00',
            'Pušenje samo na terasi / u dvorištu',
            'Mir od 23:00 do 07:00',
            'Kućni ljubimci na upit (mogući trošak čišćenja)',
          ];

  return `
    <div style="margin-top:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1e2d22;text-transform:uppercase;letter-spacing:0.04em;">
        ${t(locale, { hr: 'Korisne informacije', en: 'Useful information', de: 'Nützliche Infos' })}
      </p>
      <ul style="margin:0;padding-left:18px;color:#6b7a6e;font-size:13px;line-height:1.7;">
        ${items.map((i) => `<li>${i}</li>`).join('')}
      </ul>
    </div>`;
}

function ctaButton(href: string, label: string): string {
  return `
    <p style="margin:24px 0 0;text-align:center;">
      <a href="${href}"
         style="display:inline-block;background:#3a6b4a;color:#fff;text-decoration:none;
                font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;">
        ${label}
      </a>
    </p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Templates ─────────────────────────────────────────────────────

function guestConfirmedHtml(d: FullData, locale: Locale): string {
  const msg = t(locale, {
    hr: 'Vaša rezervacija je potvrđena. Veselimo se vašem dolasku.',
    en: 'Your booking is confirmed. We look forward to your stay.',
    de: 'Ihre Buchung ist bestätigt. Wir freuen uns auf Ihren Aufenthalt.',
  });

  const nightsLabel =
    locale === 'en'
      ? `${d.nights} night${d.nights === 1 ? '' : 's'}`
      : locale === 'de'
        ? `${d.nights} Nacht${d.nights === 1 ? '' : 'e'}`
        : d.nights === 1
          ? '1 noć'
          : `${d.nights} noći`;

  return emailShell(
    `
    <div style="background:#3a6b4a;padding:28px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-family:Georgia,serif;">${SITE_NAME}</h1>
      ${
        d.reference
          ? `<p style="color:#e8f0ea;margin:10px 0 0;font-size:13px;font-family:monospace;">${d.reference}</p>`
          : ''
      }
    </div>
    <div style="padding:28px 24px;">
      <p style="color:#166534;font-weight:600;margin:0 0 20px;font-size:16px;">✓ ${msg}</p>

      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        ${row(t(locale, { hr: 'Soba', en: 'Room', de: 'Zimmer' }), escapeHtml(d.roomName), { strong: true })}
        ${row(
          t(locale, { hr: 'Prijava', en: 'Check-in', de: 'Check-in' }),
          `${d.checkInStr} · 14:00–22:00`,
          { strong: true },
        )}
        ${row(
          t(locale, { hr: 'Odjava', en: 'Check-out', de: 'Check-out' }),
          `${d.checkOutStr} · ${t(locale, { hr: 'do 10:00', en: 'by 10:00', de: 'bis 10:00' })}`,
          { strong: true },
        )}
        ${row(t(locale, { hr: 'Trajanje', en: 'Duration', de: 'Dauer' }), nightsLabel)}
        ${row(t(locale, { hr: 'Gosti', en: 'Guests', de: 'Gäste' }), guestsLabel(d, locale))}
        ${extrasRows(d, locale)}
      </table>

      ${paymentBlock(d, locale, true)}

      ${
        d.confirmationUrl
          ? ctaButton(
              d.confirmationUrl,
              t(locale, {
                hr: 'Otvori potvrdu rezervacije',
                en: 'Open booking confirmation',
                de: 'Buchungsbestätigung öffnen',
              }),
            )
          : ''
      }

      ${houseRulesBlock(locale)}
      ${contactFooter(locale)}
    </div>
  `,
    locale,
  );
}

function ownerNewBookingHtml(d: FullData): string {
  const locale: Locale = 'hr';
  const statusLabel =
    d.status === 'confirmed'
      ? 'Potvrđena'
      : d.status === 'cancelled'
        ? 'Otkazana'
        : 'Na čekanju (pending)';
  const statusColor =
    d.status === 'confirmed' ? '#166534' : d.status === 'cancelled' ? '#b45309' : '#c26c0a';

  const phone = d.guestPhone
    ? `<a href="tel:${escapeHtml(d.guestPhone)}" style="color:#3a6b4a;">${escapeHtml(d.guestPhone)}</a>`
    : '—';
  const waPrefill = encodeURIComponent(
    `Pozdrav ${d.guestName}, vezano uz rezervaciju ${d.reference ?? d.roomName}…`,
  );
  const guestWa = d.guestPhone
    ? `https://wa.me/${d.guestPhone.replace(/\D/g, '')}?text=${waPrefill}`
    : null;

  return emailShell(`
    <div style="background:#3a6b4a;padding:20px 24px;">
      <h1 style="color:#fff;font-size:18px;margin:0;">Nova rezervacija</h1>
      ${
        d.reference
          ? `<p style="color:#e8f0ea;margin:8px 0 0;font-size:13px;font-family:monospace;">${d.reference}</p>`
          : ''
      }
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;">
        <span style="display:inline-block;background:#f2ede6;color:${statusColor};
                     font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;">
          ${statusLabel}${d.depositPaid ? ' · depozit plaćen' : ''}
        </span>
      </p>

      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        ${row('Soba', escapeHtml(d.roomName), { strong: true })}
        ${row('Gost', escapeHtml(d.guestName), { strong: true })}
        ${row('Email', `<a href="mailto:${escapeHtml(d.guestEmail)}" style="color:#3a6b4a;">${escapeHtml(d.guestEmail)}</a>`)}
        ${row('Telefon', phone)}
        ${d.guestCountry ? row('Zemlja', escapeHtml(d.guestCountry)) : ''}
        ${row('Gosti', guestsLabel(d, locale))}
        ${extrasRows(d, locale)}
        ${row('Check-in', `${d.checkInStr} · od 14:00`, { strong: true })}
        ${row('Check-out', `${d.checkOutStr} · do 10:00`, { strong: true })}
        ${row('Noći', String(d.nights))}
        ${
          d.pricePerNight
            ? row('Cijena / noć', `${d.pricePerNight} €`)
            : ''
        }
      </table>

      ${paymentBlock(d, locale, false)}

      ${
        d.notes
          ? `<div style="margin:16px 0;padding:12px;background:#fff8e6;border-radius:8px;font-size:13px;color:#6b7a6e;">
               <strong style="color:#1e2d22;">Napomena gosta:</strong><br/>
               ${escapeHtml(d.notes).replace(/\n/g, '<br/>')}
             </div>`
          : ''
      }

      <p style="margin:20px 0 0;font-size:13px;line-height:1.8;">
        ${
          d.confirmationUrl
            ? `<a href="${d.confirmationUrl}" style="color:#3a6b4a;font-weight:600;">Otvori potvrdu / admin link</a><br/>`
            : ''
        }
        <a href="mailto:${escapeHtml(d.guestEmail)}" style="color:#3a6b4a;">Odgovori emailom</a>
        ${
          d.guestPhone
            ? ` · <a href="tel:${escapeHtml(d.guestPhone)}" style="color:#3a6b4a;">Nazovi</a>`
            : ''
        }
        ${
          guestWa
            ? ` · <a href="${guestWa}" style="color:#3a6b4a;">WhatsApp gostu</a>`
            : ''
        }
      </p>
    </div>
  `);
}

function guestQuestionHtml(data: GuestQuestionEmailData): string {
  const escapedQuestion = escapeHtml(data.question).replace(/\n/g, '<br>');

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
          <td><a href="mailto:${escapeHtml(data.guestEmail)}" style="color:#3a6b4a;">${escapeHtml(data.guestEmail)}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7a6e;vertical-align:top;">Pitanje</td>
          <td style="line-height:1.6;white-space:pre-wrap;">${escapedQuestion}</td>
        </tr>
      </table>
    </div>
  `);
}

function emailShell(inner: string, locale: Locale = 'hr'): string {
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">${inner}</div>
</body></html>`;
}
