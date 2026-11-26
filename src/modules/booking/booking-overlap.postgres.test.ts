import { rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { occupancyUnitForSlug } from './booking-overlap';

const embeddedPath = process.env.BOOKING_OVERLAP_EMBEDDED_POSTGRES;
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const migrationSql = readFileSync(
  path.join(root, 'supabase/migrations/021_booking_overlap_exclusion.sql'),
  'utf8',
);
const rollbackSql = readFileSync(
  path.join(root, 'supabase/scripts/021_booking_overlap_exclusion_rollback.sql'),
  'utf8',
);

type PgError = { code?: string; message?: string };
type PgClient = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>;
};
type EmbeddedServer = {
  initialise: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  createDatabase: (name: string) => Promise<void>;
  getPgClient: (database?: string) => PgClient;
};

const stubSql = `
  create table bookings (
    id uuid primary key default gen_random_uuid(),
    room_slug text not null,
    check_in date not null,
    check_out date not null,
    status text not null default 'pending'
      check (status in ('pending', 'confirmed', 'cancelled')),
    deposit_paid boolean not null default false,
    payment_hold_until timestamptz,
    constraint bookings_dates_valid check (check_out > check_in)
  );
`;

async function insert(
  client: PgClient,
  row: {
    slug: string;
    checkIn: string;
    checkOut: string;
    status?: string;
    depositPaid?: boolean;
    holdUntil?: string | null;
  },
): Promise<PgError | null> {
  try {
    await client.query(
      `insert into bookings (
         room_slug, check_in, check_out, status, deposit_paid, payment_hold_until
       ) values ($1, $2, $3, $4, $5, $6)`,
      [
        row.slug,
        row.checkIn,
        row.checkOut,
        row.status ?? 'pending',
        row.depositPaid ?? false,
        row.holdUntil ?? null,
      ],
    );
    return null;
  } catch (err) {
    return err as PgError;
  }
}

describe.skipIf(!embeddedPath)('booking overlap exclusion u Postgresu', () => {
  let server: EmbeddedServer;
  let client: PgClient;
  const dataDir = '/tmp/ginko-booking-overlap-pg';

  beforeAll(async () => {
    await rm(dataDir, { recursive: true, force: true });
    const loaded = (await import(embeddedPath!)) as {
      default: new (options: Record<string, unknown>) => EmbeddedServer;
    };
    server = new loaded.default({
      databaseDir: dataDir,
      port: 54329,
      user: 'postgres',
      password: 'postgres',
      persistent: true,
      onLog: () => undefined,
      onError: () => undefined,
    });
    await server.initialise();
    await server.start();
    await server.createDatabase('overlap');
    client = server.getPgClient('overlap');
    await client.connect();
    await client.query(stubSql);
  }, 120_000);

  afterAll(async () => {
    await client?.end().catch(() => undefined);
    await server?.stop().catch(() => undefined);
    await rm(dataDir, { recursive: true, force: true });
  });

  async function clearBookings() {
    await client.query('delete from bookings');
  }

  it('migracija staje ako aktivna preklapanja već postoje', async () => {
    await insert(client, {
      slug: 'ginko-1',
      checkIn: '2027-01-10',
      checkOut: '2027-01-12',
      status: 'confirmed',
    });
    await insert(client, {
      slug: 'ginko-1',
      checkIn: '2027-01-11',
      checkOut: '2027-01-13',
      status: 'pending',
    });
    await expect(client.query(migrationSql)).rejects.toThrow(/preklapanja/);
    const column = await client.query(
      `select 1 from information_schema.columns
       where table_name = 'bookings' and column_name = 'occupancy_unit'`,
    );
    expect(column.rowCount).toBe(0);
    await clearBookings();
  });

  it('prazna tablica primi constraint', async () => {
    await client.query(migrationSql);
    const constraint = await client.query(
      `select 1 from pg_constraint where conname = 'bookings_no_active_overlap'`,
    );
    expect(constraint.rowCount).toBe(1);
  });

  it('dvije istovremene rezervacije iste sobe: jedna prođe', async () => {
    await clearBookings();
    const first = server.getPgClient('overlap');
    const second = server.getPgClient('overlap');
    await first.connect();
    await second.connect();
    try {
      const results = await Promise.allSettled([
        first.query(
          `insert into bookings (room_slug, check_in, check_out, status)
           values ('ginko-3', '2027-08-01', '2027-08-04', 'pending')`,
        ),
        second.query(
          `insert into bookings (room_slug, check_in, check_out, status)
           values ('ginko-3', '2027-08-02', '2027-08-05', 'pending')`,
        ),
      ]);
      const rejected = results.filter((result) => result.status === 'rejected');
      const fulfilled = results.filter((result) => result.status === 'fulfilled');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason.code).toBe('23P01');
    } finally {
      await first.end();
      await second.end();
    }
  });

  it('SPA 1 i SPA 2 se preklapaju, različite sobe ne', async () => {
    await clearBookings();
    expect(
      await insert(client, {
        slug: 'ginko-spa-1',
        checkIn: '2027-09-01',
        checkOut: '2027-09-04',
        status: 'confirmed',
      }),
    ).toBeNull();
    const spa = await insert(client, {
      slug: 'ginko-spa-2',
      checkIn: '2027-09-03',
      checkOut: '2027-09-06',
      status: 'pending',
    });
    expect(spa?.code).toBe('23P01');
    expect(
      await insert(client, {
        slug: 'ginko-4',
        checkIn: '2027-09-03',
        checkOut: '2027-09-06',
        status: 'pending',
      }),
    ).toBeNull();

    const units = await client.query(
      `select room_slug, occupancy_unit from bookings order by room_slug`,
    );
    for (const row of units.rows) {
      expect(row.occupancy_unit).toBe(occupancyUnitForSlug(String(row.room_slug)));
    }
  });

  it('check-out i check-in na isti datum prolaze, preklapanje noći ne', async () => {
    await clearBookings();
    expect(
      await insert(client, {
        slug: 'ginko-5',
        checkIn: '2027-10-01',
        checkOut: '2027-10-03',
      }),
    ).toBeNull();
    expect(
      await insert(client, {
        slug: 'ginko-5',
        checkIn: '2027-10-03',
        checkOut: '2027-10-05',
      }),
    ).toBeNull();
    const overlap = await insert(client, {
      slug: 'ginko-5',
      checkIn: '2027-10-04',
      checkOut: '2027-10-06',
    });
    expect(overlap?.code).toBe('23P01');
  });

  it('otkazana ne blokira, istekli hold i plaćeni pending blokiraju', async () => {
    await clearBookings();
    expect(
      await insert(client, {
        slug: 'ginko-6',
        checkIn: '2027-11-01',
        checkOut: '2027-11-04',
        status: 'cancelled',
        holdUntil: '2020-01-01T00:00:00Z',
      }),
    ).toBeNull();
    expect(
      await insert(client, {
        slug: 'ginko-6',
        checkIn: '2027-11-01',
        checkOut: '2027-11-04',
        status: 'pending',
      }),
    ).toBeNull();

    await clearBookings();
    expect(
      await insert(client, {
        slug: 'ginko-2',
        checkIn: '2027-12-01',
        checkOut: '2027-12-03',
        status: 'pending',
        depositPaid: false,
        holdUntil: '2020-01-01T00:00:00Z',
      }),
    ).toBeNull();
    expect(
      (
        await insert(client, {
          slug: 'ginko-2',
          checkIn: '2027-12-02',
          checkOut: '2027-12-04',
          status: 'confirmed',
        })
      )?.code,
    ).toBe('23P01');

    await clearBookings();
    expect(
      await insert(client, {
        slug: 'ginko-1',
        checkIn: '2028-01-01',
        checkOut: '2028-01-04',
        status: 'pending',
        depositPaid: true,
      }),
    ).toBeNull();
    expect(
      (
        await insert(client, {
          slug: 'ginko-1',
          checkIn: '2028-01-02',
          checkOut: '2028-01-05',
          status: 'pending',
          depositPaid: false,
        })
      )?.code,
    ).toBe('23P01');
  });

  it('izmjena datuma postojeće rezervacije pada samo kad novi raspon sudara', async () => {
    await clearBookings();
    await insert(client, {
      slug: 'ginko-1',
      checkIn: '2028-02-01',
      checkOut: '2028-02-04',
      status: 'confirmed',
    });
    await insert(client, {
      slug: 'ginko-1',
      checkIn: '2028-03-01',
      checkOut: '2028-03-04',
      status: 'confirmed',
    });
    const moved = client.query(
      `update bookings
       set check_in = '2028-02-03', check_out = '2028-02-06'
       where check_in = '2028-03-01'`,
    );
    await expect(moved).rejects.toMatchObject({ code: '23P01' });
    await client.query(
      `update bookings
       set check_in = '2028-02-04', check_out = '2028-02-07'
       where check_in = '2028-03-01'`,
    );
    const rows = await client.query(
      `select check_in::text, check_out::text from bookings order by check_in`,
    );
    expect(rows.rows).toEqual([
      { check_in: '2028-02-01', check_out: '2028-02-04' },
      { check_in: '2028-02-04', check_out: '2028-02-07' },
    ]);
  });

  it('rollback makne zabranu i ne briše redove', async () => {
    await clearBookings();
    await insert(client, {
      slug: 'ginko-1',
      checkIn: '2028-04-01',
      checkOut: '2028-04-03',
      status: 'confirmed',
    });
    await client.query(rollbackSql);
    const kept = await client.query('select count(*)::int as n from bookings');
    expect(kept.rows[0].n).toBe(1);
    expect(
      await insert(client, {
        slug: 'ginko-1',
        checkIn: '2028-04-02',
        checkOut: '2028-04-04',
        status: 'pending',
      }),
    ).toBeNull();
    const column = await client.query(
      `select 1 from information_schema.columns
       where table_name = 'bookings' and column_name = 'occupancy_unit'`,
    );
    expect(column.rowCount).toBe(0);
  });
});
