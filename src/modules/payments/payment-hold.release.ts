/**
 * Cron korak: nakon isteka blokade Assert, pa otkaz samo ako je uplata
 * sigurno izostala i sesija se više ne može platiti.
 * Nejasno ili nedostupno → termin ostaje zauzet.
 */

import {
  classifyAssert,
  decideHoldRelease,
  recentUncertain,
  type AssertClass,
  type AssertSnapshot,
  type IntentView,
  type BookingHoldView,
} from './payment-hold.policy';

export type HoldReleaseOutcome =
  | { action: 'released' }
  | { action: 'kept'; reason: string }
  | { action: 'skipped'; reason: string }
  | { action: 'settled' };

export async function releaseOneHold(input: {
  booking: BookingHoldView;
  intents: IntentView[];
  nowMs: number;
  assertIntent: (intent: IntentView) => Promise<AssertSnapshot>;
  settlePaid: (intent: IntentView) => Promise<void>;
  markIntentUnpaid: (intent: IntentView, errorName: string | null) => Promise<void>;
  rememberAssert: (intent: IntentView, klass: AssertClass) => Promise<void>;
  releaseIfUnpaid: () => Promise<boolean>;
}): Promise<HoldReleaseOutcome> {
  const classes: Record<string, AssertClass> = {};

  for (const intent of input.intents) {
    if (intent.status === 'cancelled' || intent.status === 'succeeded') continue;
    if (intent.status === 'creating' && !intent.hasToken) {
      const created = Date.parse(intent.createdAt);
      const stale = !Number.isNaN(created) && input.nowMs - created >= 2 * 60 * 1000;
      classes[intent.id] = stale ? 'terminal_unpaid' : 'still_open';
      continue;
    }
    if (!intent.hasToken) {
      classes[intent.id] = 'uncertain';
      continue;
    }
    if (
      intent.lastAssertClass === 'uncertain' &&
      recentUncertain(intent, input.nowMs)
    ) {
      classes[intent.id] = 'uncertain';
      continue;
    }

    let snapshot: AssertSnapshot;
    try {
      snapshot = await input.assertIntent(intent);
    } catch {
      snapshot = { kind: 'unreachable' };
    }
    const klass = classifyAssert(snapshot, intent, input.nowMs);
    classes[intent.id] = klass;
    await input.rememberAssert(intent, klass);
  }

  const decision = decideHoldRelease({
    booking: input.booking,
    intents: input.intents,
    classes,
    nowMs: input.nowMs,
  });

  if (decision.action === 'skip') return { action: 'skipped', reason: decision.reason };
  if (decision.action === 'keep') return { action: 'kept', reason: decision.reason };

  if (decision.action === 'settle_paid') {
    const intent =
      input.intents.find((row) => row.id === decision.intentId) ??
      input.intents.find((row) => row.status === 'succeeded');
    if (intent) await input.settlePaid(intent);
    return { action: 'settled' };
  }

  for (const intent of input.intents) {
    if (classes[intent.id] === 'terminal_unpaid' && intent.status !== 'cancelled') {
      await input.markIntentUnpaid(intent, 'terminal_unpaid');
    }
  }

  const released = await input.releaseIfUnpaid();
  if (!released) return { action: 'kept', reason: 'release_lost_race' };
  return { action: 'released' };
}
