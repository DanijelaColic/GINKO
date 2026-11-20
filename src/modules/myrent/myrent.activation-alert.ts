/**
 * Obavijest administratoru kad je depozit naplaćen, a MyRent kalendar nije zatvoren.
 * Email je isključen dok MYRENT_ACTIVATION_ALERT_EMAIL nije točno "true".
 * Testovi i zadani runtime ne šalju poruke.
 */

export type ActivationAlertIssue =
  | 'not_yet_active'
  | 'calendar_open'
  | 'check_failed';

export type ActivationAlertInput = {
  bookingId: string;
  issue: ActivationAlertIssue;
  checkIn: string;
  checkOut: string;
};

export type ActivationAlertDispatch = {
  email: 'skipped_disabled' | 'sent' | 'failed';
  banner: true;
};

export function isMyRentActivationAlertEmailEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (env.MYRENT_ACTIVATION_ALERT_EMAIL ?? '').trim() === 'true';
}

export function buildMyRentActivationAlertText(
  input: ActivationAlertInput,
): { subject: string; body: string } {
  const reason =
    input.issue === 'not_yet_active'
      ? 'MyRent rezervacija nije active=Y.'
      : input.issue === 'calendar_open'
        ? 'MyRent je active=Y, ali kalendar nema sve noći boravka zatvorene.'
        : 'Provjera MyRent aktivacije nije uspjela (privremena API greška).';

  return {
    subject: `Ginko: depozit naplaćen, MyRent kalendar nije zatvoren`,
    body: [
      reason,
      `Rezervacija: ${input.bookingId}`,
      `Termin: ${input.checkIn} → ${input.checkOut}`,
      'Depozit ostaje naplaćen. Nema automatskog otkazivanja ni povrata.',
      'Provjeri MyRent kalendar prije nego što gostu potvrdiš konačan termin.',
    ].join('\n'),
  };
}

/**
 * Prijedlog gostu — NIJE uključen na stranicu potvrde.
 * Depozit je priznat, konačan termin nije obećan.
 */
export const PROPOSED_GUEST_STAY_UNCONFIRMED_COPY = {
  hr: {
    title: 'Depozit je naplaćen',
    body: 'Uplata depozita je zaprimljena. Termin još nije potvrđen u kalendaru objekta. Javit ćemo vam čim boravak bude osiguran. Novac se ne vraća automatski.',
  },
  en: {
    title: 'Deposit received',
    body: 'Your deposit has been charged. The stay is not confirmed in the property calendar yet. We will contact you once it is secured. The payment is not refunded automatically.',
  },
  cs: {
    title: 'Záloha je přijata',
    body: 'Záloha byla stržena. Termín ještě není potvrzen v kalendáři objektu. Ozveme se, jakmile bude pobyt zajištěn. Platba se automaticky nevrací.',
  },
} as const;

export async function dispatchMyRentActivationAlert(
  input: ActivationAlertInput,
  deps?: {
    sendEmail?: (message: { subject: string; body: string }) => Promise<void>;
    env?: Record<string, string | undefined>;
  },
): Promise<ActivationAlertDispatch> {
  // Banner čita activation_issue iz baze. Ovdje samo kanal e-pošte.
  if (!isMyRentActivationAlertEmailEnabled(deps?.env)) {
    return { email: 'skipped_disabled', banner: true };
  }

  const send = deps?.sendEmail;
  if (!send) {
    console.info(
      '[myrent-activation] email uključen, ali sender nije spojen — poruka nije poslana:',
      input.bookingId,
    );
    return { email: 'failed', banner: true };
  }

  try {
    await send(buildMyRentActivationAlertText(input));
    return { email: 'sent', banner: true };
  } catch (err) {
    console.error(
      '[myrent-activation] email nije poslan:',
      input.bookingId,
      err instanceof Error ? err.message : err,
    );
    return { email: 'failed', banner: true };
  }
}
