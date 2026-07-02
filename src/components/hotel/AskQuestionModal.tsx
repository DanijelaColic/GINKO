'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { SITE_NAME } from '@/modules/booking/booking.config';

const MAX_QUESTION_LENGTH = 300;

type Props = {
  onClose: () => void;
};

export default function AskQuestionModal({ onClose }: Props) {
  const t = useTranslations('travelerQuestions.askModal');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const remaining = MAX_QUESTION_LENGTH - question.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || success) return;

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          question: question.trim(),
          locale,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? t('errorGeneric'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-question-title"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-stone px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="ask-question-title"
                className="text-xl font-semibold text-text"
              >
                {t('title')}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t('aboutProperty', { siteName: SITE_NAME })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted transition-colors hover:bg-stone-light hover:text-text"
              aria-label={t('close')}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-semibold text-text">{t('successTitle')}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              {t('successMessage')}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              {t('close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {/* E-pošta */}
              <label htmlFor="ask-question-email" className="mb-1.5 block text-sm font-medium text-text">
                {t('emailLabel')}
              </label>
              <input
                id="ask-question-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="mb-5 w-full rounded-lg border border-stone bg-stone-light/30 px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted/70 focus:border-primary focus:ring-1 focus:ring-primary/30"
                required
              />

              {/* Pitanje */}
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="ask-question-text" className="text-sm font-medium text-text">
                  {t('questionLabel')}
                </label>
                <span className="text-xs text-muted tabular-nums">
                  {question.length} / {MAX_QUESTION_LENGTH}
                </span>
              </div>
              <textarea
                id="ask-question-text"
                value={question}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_QUESTION_LENGTH) {
                    setQuestion(e.target.value);
                  }
                }}
                placeholder={t('questionPlaceholder')}
                rows={6}
                className="w-full resize-none rounded-lg border border-stone bg-stone-light/30 px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted/70 focus:border-primary focus:ring-1 focus:ring-primary/30"
                required
                minLength={3}
              />
              <p className="mt-1.5 text-xs text-muted">
                {t('charsRemaining', { count: remaining })}
              </p>

              {error && (
                <p className="mt-4 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-stone px-6 py-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? t('submitting') : t('submit')}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
