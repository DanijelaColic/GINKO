'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, ChevronRight } from 'lucide-react';

const FAQ_COL_1 = ['parking', 'breakfast', 'wifi', 'therms', 'attractions'] as const;
const FAQ_COL_2 = ['pets', 'checkin', 'wellness', 'families', 'booking'] as const;

type FaqId = (typeof FAQ_COL_1)[number] | (typeof FAQ_COL_2)[number];

function FaqColumn({
  ids,
  openId,
  onToggle,
  t,
}: {
  ids: readonly FaqId[];
  openId: string | null;
  onToggle: (id: string) => void;
  t: ReturnType<typeof useTranslations<'travelerQuestions'>>;
}) {
  return (
    <div className="bg-white border border-stone rounded-xl overflow-hidden">
      {ids.map((id, index) => {
        const isOpen = openId === id;
        const isLast = index === ids.length - 1;

        return (
          <div key={id} className={!isLast ? 'border-b border-stone' : ''}>
            <button
              type="button"
              onClick={() => onToggle(id)}
              aria-expanded={isOpen}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-stone-light/60 transition-colors"
            >
              <MessageCircle size={16} className="text-primary shrink-0" />
              <span className="flex-1 text-sm text-text leading-snug">
                {t(`faq.${id}.q`)}
              </span>
              <ChevronRight
                size={16}
                className={`text-muted shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pl-11">
                <p className="text-sm text-muted leading-relaxed">{t(`faq.${id}.a`)}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TravelerQuestionsSection() {
  const t = useTranslations('travelerQuestions');
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-14 px-4 bg-white border-t border-stone">
      <div className="max-w-6xl mx-auto">
        {/* Most prema FAQ-u */}
        <div className="border border-stone rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-sm text-text mb-2">{t('qualityTitle')}</h3>
          <p className="text-sm text-muted leading-relaxed">{t('qualityDesc')}</p>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text">
            {t('title')}
          </h2>
          <a
            href="#raspolozivost"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0"
          >
            {t('showAvailability')}
          </a>
        </div>

        {/* Tri kolone */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FaqColumn ids={FAQ_COL_1} openId={openId} onToggle={toggle} t={t} />
          <FaqColumn ids={FAQ_COL_2} openId={openId} onToggle={toggle} t={t} />

          {/* CTA kartica */}
          <div className="bg-white border border-stone rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
            <h3 className="font-semibold text-text text-base mb-4">{t('stillLooking')}</h3>
            <a
              href="mailto:info@ginko-sobe.com"
              className="inline-flex items-center justify-center border border-primary text-primary hover:bg-primary/5 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {t('askQuestion')}
            </a>
            <p className="text-xs text-muted mt-3 leading-relaxed">{t('answerHint')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
