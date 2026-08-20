'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Send, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import AskQuestionModal from '@/components/hotel/AskQuestionModal';
import { scrollToSectionId } from '@/lib/scroll-to-section';
import { MIN_NIGHTS } from '@/modules/booking/booking.config';
import {
  CHAT_DEEP_LINKS,
  CHATBOT_SUGGESTION_IDS,
  buildWhatsAppHref,
  deepLinksForTopic,
  houseRuleAnswer,
  matchGuestQuestion,
  topicById,
  type ChatDeepLinkId,
  type ChatMatch,
  type KnowledgeTopic,
} from '@/modules/chatbot';

type ChatLine =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; kind: 'greeting' }
  | { id: number; role: 'assistant'; kind: 'faq'; faqId: string; topicId: string }
  | {
      id: number;
      role: 'assistant';
      kind: 'house_rules';
      houseRuleId: string;
      topicId: string;
    }
  | { id: number; role: 'assistant'; kind: 'min_nights'; topicId: string }
  | { id: number; role: 'assistant'; kind: 'availability' }
  | { id: number; role: 'assistant'; kind: 'legal' }
  | { id: number; role: 'assistant'; kind: 'gallery' }
  | { id: number; role: 'assistant'; kind: 'rooms' }
  | { id: number; role: 'assistant'; kind: 'escalate' };

let lineId = 0;
function nextId() {
  lineId += 1;
  return lineId;
}

function answerFromTopic(topic: KnowledgeTopic): ChatLine {
  if (topic.source === 'faq' && topic.messageFaqId) {
    return {
      id: nextId(),
      role: 'assistant',
      kind: 'faq',
      faqId: topic.messageFaqId,
      topicId: topic.id,
    };
  }
  if (topic.source === 'house_rules' && topic.houseRuleId) {
    return {
      id: nextId(),
      role: 'assistant',
      kind: 'house_rules',
      houseRuleId: topic.houseRuleId,
      topicId: topic.id,
    };
  }
  if (topic.source === 'booking_config') {
    return {
      id: nextId(),
      role: 'assistant',
      kind: 'min_nights',
      topicId: topic.id,
    };
  }
  return { id: nextId(), role: 'assistant', kind: 'escalate' };
}

function lineFromMatch(match: ChatMatch): ChatLine {
  if (match.kind === 'topic') {
    const topic = topicById(match.topicId);
    return topic
      ? answerFromTopic(topic)
      : { id: nextId(), role: 'assistant', kind: 'escalate' };
  }
  if (match.kind === 'unknown') {
    return { id: nextId(), role: 'assistant', kind: 'escalate' };
  }
  return { id: nextId(), role: 'assistant', kind: match.kind };
}

function linksForLine(line: Exclude<ChatLine, { role: 'user' }>): ChatDeepLinkId[] {
  switch (line.kind) {
    case 'greeting':
      return ['booking', 'whatsapp'];
    case 'availability':
      return ['availability', 'whatsapp'];
    case 'legal':
      return ['privacy', 'cookies'];
    case 'gallery':
      return ['gallery', 'rooms'];
    case 'rooms':
      return ['rooms', 'availability'];
    case 'escalate':
      return ['whatsapp', 'booking'];
    case 'faq':
    case 'house_rules':
    case 'min_nights':
      return [...deepLinksForTopic(line.topicId)];
    default:
      return [];
  }
}

function AssistantFaq({
  faqId,
  tFaq,
}: {
  faqId: string;
  tFaq: ReturnType<typeof useTranslations<'travelerQuestions'>>;
}) {
  if (faqId === 'booking') {
    return (
      <p className="text-sm leading-relaxed text-text">
        {tFaq.rich('faq.booking.a', {
          bookingLink: (chunks) => (
            <Link
              href="/booking"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    );
  }
  return (
    <p className="text-sm leading-relaxed text-text">{tFaq(`faq.${faqId}.a`)}</p>
  );
}

function ChatDeepLinks({
  ids,
  onSiteNavigate,
  emphasizeWhatsapp = false,
}: {
  ids: readonly ChatDeepLinkId[];
  onSiteNavigate: () => void;
  emphasizeWhatsapp?: boolean;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('chatbot');
  const isHome = pathname === '/';

  if (!ids.length) return null;

  const labels = t.raw('links') as Record<ChatDeepLinkId, string>;
  const pill =
    'inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors';

  function classFor(id: ChatDeepLinkId) {
    if (id === 'whatsapp') {
      return emphasizeWhatsapp
        ? `${pill} bg-[#25D366] text-white hover:opacity-90`
        : `${pill} border border-stone text-muted hover:border-[#25D366] hover:text-[#128C7E]`;
    }
    const isMainCta = id === 'booking' || id === 'availability';
    if (isMainCta && !emphasizeWhatsapp) {
      return `${pill} bg-primary text-white hover:bg-primary-dark`;
    }
    return `${pill} border border-primary text-primary hover:bg-primary/5`;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {ids.map((id) => {
        if (id === 'whatsapp') {
          return (
            <a
              key={id}
              href={buildWhatsAppHref(locale)}
              target="_blank"
              rel="noopener noreferrer"
              className={classFor(id)}
            >
              <WhatsAppIcon size={12} />
              {labels.whatsapp}
            </a>
          );
        }

        const def = CHAT_DEEP_LINKS[id];
        return (
          <Link
            key={id}
            href={def.href}
            className={classFor(id)}
            onClick={(e) => {
              if (def.hashId && isHome) {
                e.preventDefault();
                scrollToSectionId(def.hashId);
              }
              onSiteNavigate();
            }}
          >
            {labels[id]}
          </Link>
        );
      })}
    </div>
  );
}

export default function ChatWidget() {
  const locale = useLocale();
  const t = useTranslations('chatbot');
  const tFaq = useTranslations('travelerQuestions');
  const chipLabels = t.raw('chips') as Record<
    (typeof CHATBOT_SUGGESTION_IDS)[number],
    string
  >;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [messages, setMessages] = useState<ChatLine[]>(() => [
    { id: nextId(), role: 'assistant', kind: 'greeting' },
  ]);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !askOpen) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, askOpen]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  function pushAnswer(match: ChatMatch, userText: string) {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: userText },
      lineFromMatch(match),
    ]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    pushAnswer(matchGuestQuestion(text, locale), text);
  }

  function onChip(id: (typeof CHATBOT_SUGGESTION_IDS)[number]) {
    pushAnswer({ kind: 'topic', topicId: id }, tFaq(`faq.${id}.q`));
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-[5.5rem] right-4 z-30 flex w-[calc(100vw-2rem)] max-w-[22.5rem] flex-col overflow-hidden rounded-2xl border border-stone bg-white shadow-xl sm:right-5"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chatbot-title"
        >
          <div className="flex items-center justify-between gap-3 border-b border-stone bg-primary px-4 py-3 text-white">
            <div className="min-w-0">
              <p id="chatbot-title" className="font-serif text-base font-semibold">
                {t('title')}
              </p>
              <p className="text-xs text-white/80">{t('subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/15"
              aria-label={t('close')}
            >
              <X size={18} />
            </button>
          </div>

          <div
            ref={listRef}
            className="max-h-[min(28rem,55vh)] min-h-[12rem] space-y-3 overflow-y-auto bg-stone-light/50 px-3 py-3"
          >
            {messages.map((line) => {
              if (line.role === 'user') {
                return (
                  <div key={line.id} className="flex justify-end">
                    <p className="max-w-[90%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-white">
                      {line.text}
                    </p>
                  </div>
                );
              }

              const links = linksForLine(line);

              return (
                <div key={line.id} className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-stone bg-white px-3 py-2">
                    {line.kind === 'greeting' && (
                      <p className="text-sm leading-relaxed text-text">
                        {t('greeting')}
                      </p>
                    )}
                    {line.kind === 'faq' && (
                      <AssistantFaq faqId={line.faqId} tFaq={tFaq} />
                    )}
                    {line.kind === 'house_rules' && (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-text">
                        {houseRuleAnswer(locale, line.houseRuleId) ?? t('escalate')}
                      </p>
                    )}
                    {line.kind === 'min_nights' && (
                      <p className="text-sm leading-relaxed text-text">
                        {t('minNights', { count: MIN_NIGHTS })}
                      </p>
                    )}
                    {line.kind === 'availability' && (
                      <p className="text-sm leading-relaxed text-text">
                        {t('availabilityAnswer')}
                      </p>
                    )}
                    {line.kind === 'legal' && (
                      <p className="text-sm leading-relaxed text-text">
                        {t('legalAnswer')}
                      </p>
                    )}
                    {line.kind === 'gallery' && (
                      <p className="text-sm leading-relaxed text-text">
                        {t('galleryAnswer')}
                      </p>
                    )}
                    {line.kind === 'rooms' && (
                      <p className="text-sm leading-relaxed text-text">
                        {t('roomsAnswer')}
                      </p>
                    )}
                    {line.kind === 'escalate' && (
                      <p className="text-sm leading-relaxed text-text">
                        {t('escalate')}
                      </p>
                    )}

                    <ChatDeepLinks
                      ids={links}
                      onSiteNavigate={() => setOpen(false)}
                      emphasizeWhatsapp={line.kind === 'escalate'}
                    />

                    {line.kind === 'escalate' && (
                      <button
                        type="button"
                        onClick={() => setAskOpen(true)}
                        className="mt-1.5 inline-flex items-center justify-center rounded-full border border-primary px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5"
                      >
                        {tFaq('askQuestion')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-stone bg-white px-3 py-2">
            <p className="mb-1.5 text-[11px] font-medium text-muted">
              {t('suggestionsLabel')}
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {CHATBOT_SUGGESTION_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChip(id)}
                  className="rounded-full border border-stone bg-stone-light px-2.5 py-1 text-[11px] text-text transition-colors hover:border-primary hover:text-primary"
                >
                  {chipLabels[id]}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('placeholder')}
                className="min-w-0 flex-1 rounded-lg border border-stone bg-stone-light/40 px-3 py-2 text-sm text-text outline-none placeholder:text-muted/70 focus:border-primary focus:ring-1 focus:ring-primary/30"
                aria-label={t('placeholder')}
                maxLength={300}
              />
              <button
                type="submit"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
                disabled={!input.trim()}
                aria-label={t('send')}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t('close') : t('open')}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {open ? <X size={24} aria-hidden /> : <MessageCircle size={26} aria-hidden />}
      </button>

      {askOpen && <AskQuestionModal onClose={() => setAskOpen(false)} />}
    </>
  );
}
