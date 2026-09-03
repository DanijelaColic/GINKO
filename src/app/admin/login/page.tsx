'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import TurnstileWidget from '@/components/admin/TurnstileWidget';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const captchaEnabled = Boolean(TURNSTILE_SITE_KEY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (captchaEnabled && !turnstileToken) {
      setError('Potvrdite CAPTCHA provjeru.');
      setShakeKey((k) => k + 1);
      setLoading(false);
      return;
    }

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        turnstileToken: turnstileToken ?? undefined,
      }),
    });

    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Netočna lozinka');
      setShakeKey((k) => k + 1);
      setPassword('');
      setTurnstileToken(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Ginko Sobe</h1>
          <p className="text-gray-500 text-sm mt-1">Admin panel</p>
        </div>

        <form
          key={shakeKey}
          onSubmit={handleSubmit}
          className={clsx(
            'bg-white rounded-2xl shadow-sm border p-8 transition-colors',
            error ? 'border-red-200' : 'border-gray-200',
            error && 'animate-shake',
          )}
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={13} className="inline mr-1.5 text-gray-400" />
              Lozinka
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                autoFocus
                className={clsx(
                  'w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none transition-colors',
                  error
                    ? 'border-red-300 focus:border-red-400 bg-red-50'
                    : 'border-gray-200 focus:border-primary',
                )}
                placeholder="••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {captchaEnabled && (
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              onToken={setTurnstileToken}
              resetSignal={shakeKey}
            />
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || (captchaEnabled && !turnstileToken)}
            className="w-full bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-full transition-opacity text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Prijava...' : 'Prijavi se'}
          </button>
        </form>
      </div>
    </div>
  );
}
