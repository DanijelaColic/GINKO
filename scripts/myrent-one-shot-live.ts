/**
 * Lokalni one-shot MyRent live upis (default DRY-RUN).
 *
 *   npx tsx --env-file=.env.local scripts/myrent-one-shot-live.ts --booking-id=<UUID>
 *
 * Stvarni write (jedan pokušaj):
 *   ... --confirm-live-write=I_UNDERSTAND_LIVE_MYRENT_WRITE
 *
 * Ne mijenja isMyRentLiveWriteAllowed(). Ne commitaj secrete.
 */
import { runMyRentOneShotCli } from '../src/modules/myrent/myrent.one-shot-live';

void runMyRentOneShotCli(process.argv.slice(2)).then((code) => {
  process.exit(code);
});
