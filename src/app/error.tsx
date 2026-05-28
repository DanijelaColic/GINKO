'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[root-error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold text-text">Nešto je pošlo po krivu</h1>
      <p className="max-w-md text-text/60">
        Stranica se nije uspjela učitati. Pokušajte ponovo ili se vratite na početnu.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Pokušaj ponovo
        </button>
        <Link
          href="/"
          className="rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Početna stranica
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-xl bg-stone/10 p-4 text-left text-xs text-text/60">
          {error.message}
        </pre>
      )}
    </div>
  );
}
