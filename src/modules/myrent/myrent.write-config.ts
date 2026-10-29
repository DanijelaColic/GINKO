/**
 * Zaštita MyRent write operacija.
 * Default: ISKLJUČENO + mock — nikad HTTP write prema MyRentu.
 */

export type MyRentWriteMode = 'mock' | 'live';

export type MyRentWriteConfig = {
  /** Mora biti eksplicitno true za bilo kakav live write (još nije implementiran). */
  enabled: boolean;
  mode: MyRentWriteMode;
};

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return defaultValue;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

/**
 * Zadano: WRITE_ENABLED=false, WRITE_MODE=mock.
 * Live HTTP i dalje zahtijeva isMyRentLiveWriteAllowed() === true (hard gate).
 */
export function getMyRentWriteConfig(): MyRentWriteConfig {
  const enabled = parseBool(process.env.MYRENT_WRITE_ENABLED, false);
  const modeRaw = (process.env.MYRENT_WRITE_MODE ?? 'mock').trim().toLowerCase();
  const mode: MyRentWriteMode = modeRaw === 'live' ? 'live' : 'mock';
  return { enabled, mode };
}

/**
 * Smije li se uopće pokušati live HTTP POST /user/rent_add?
 * HARD GATE — ostaje false dok se eksplicitno ne otvori u zasebnoj fazi
 * (nakon Saferpay testa + odgovora MyRent podrške).
 * Env MYRENT_WRITE_* sama po sebi NE otvara ovaj gate.
 */
export function isMyRentLiveWriteAllowed(): boolean {
  return false;
}

export function assertMyRentWriteNotLiveHttp(): void {
  if (isMyRentLiveWriteAllowed()) {
    // Rezerva ako se kasnije omogući live — i dalje treba eksplicitni gate u transportu.
    const cfg = getMyRentWriteConfig();
    if (!cfg.enabled || cfg.mode !== 'live') {
      throw new Error('MyRent live write je onemogućen (MYRENT_WRITE_ENABLED / MODE).');
    }
  }
}
