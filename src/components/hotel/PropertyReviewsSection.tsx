'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import {
  GUEST_REVIEWS,
  REVIEW_TOPIC_KEYWORDS,
  REVIEW_TOPICS,
  REVIEWS_COPY,
  type GuestReview,
  type ReviewTopicId,
} from '@/modules/property/property-details.config';

const TEXT_PREVIEW_LENGTH = 180;
const PREVIEW_COUNT = 3;
const LOCALE = 'hr-HR';

function formatRating(value: number) {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatReviewDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightRegex(activeTopics: ReviewTopicId[]) {
  const keywords = [
    ...new Set(activeTopics.flatMap((topic) => REVIEW_TOPIC_KEYWORDS[topic])),
  ];
  if (keywords.length === 0) return null;

  const pattern = keywords
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');

  return new RegExp(`(${pattern})`, 'gi');
}

function renderHighlightedText(text: string, activeTopics: ReviewTopicId[]) {
  const regex = buildHighlightRegex(activeTopics);
  if (!regex) return text;

  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (index % 2 === 1) {
      return (
        <mark key={`${part}-${index}`} className="bg-yellow-200 rounded px-0.5 text-text">
          {part}
        </mark>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function AuthorAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center"
      aria-hidden
    >
      {initial}
    </div>
  );
}

function ReviewCard({
  review,
  activeTopics,
  compact = false,
}: {
  review: GuestReview;
  activeTopics: ReviewTopicId[];
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > TEXT_PREVIEW_LENGTH;
  const displayText =
    expanded || !isLong
      ? review.text
      : `${review.text.slice(0, TEXT_PREVIEW_LENGTH).trimEnd()}…`;

  return (
    <article
      className={`bg-white border border-stone rounded-xl p-5 flex flex-col gap-3 ${
        compact ? 'shrink-0 w-[min(100%,320px)] sm:w-[300px] snap-start' : 'w-full'
      }`}
    >
      <div className="flex items-center gap-3">
        <AuthorAvatar name={review.author} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-text truncate">{review.author}</p>
          <p className="text-xs text-muted">{review.country}</p>
        </div>
        <span className="shrink-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md">
          {formatRating(review.rating)}
        </span>
      </div>

      <blockquote className="text-sm text-text leading-relaxed flex-1">
        &ldquo;{renderHighlightedText(displayText, activeTopics)}&rdquo;
      </blockquote>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-left text-sm text-primary hover:text-primary-dark font-medium transition-colors"
        >
          {expanded ? REVIEWS_COPY.readLess : REVIEWS_COPY.readMore}
        </button>
      )}

      <div className="border-t border-stone pt-3 text-xs text-muted space-y-0.5">
        <p>{review.property}</p>
        <p>{formatReviewDate(review.date)}</p>
      </div>
    </article>
  );
}

export default function PropertyReviewsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [activeTopics, setActiveTopics] = useState<ReviewTopicId[]>([]);
  const [showAll, setShowAll] = useState(false);

  const filteredReviews = useMemo(() => {
    if (activeTopics.length === 0) return GUEST_REVIEWS;
    return GUEST_REVIEWS.filter((review) =>
      activeTopics.every((topic) => review.topics.includes(topic)),
    );
  }, [activeTopics]);

  const visibleReviews = showAll
    ? filteredReviews
    : filteredReviews.slice(0, PREVIEW_COUNT);

  const toggleTopic = (topicId: ReviewTopicId) => {
    setActiveTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId],
    );
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const handleToggleShowAll = () => {
    setShowAll((prev) => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(() => {
          sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return next;
    });
  };

  return (
    <section
      ref={sectionRef}
      className="py-14 px-4 bg-white border-t border-stone"
      id="recenzije"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text">
            {REVIEWS_COPY.title}
          </h2>
          <a
            href="#raspolozivost"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0"
          >
            {REVIEWS_COPY.showAvailability}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="bg-primary text-white font-bold text-lg px-2.5 py-1 rounded-md leading-none">
            {formatRating(REVIEWS_COPY.overallScore)}
          </span>
          <p className="text-sm text-text font-medium">
            {REVIEWS_COPY.overallLabel} ·{' '}
            {REVIEWS_COPY.reviewCountLabel.replace('{count}', String(GUEST_REVIEWS.length))}
          </p>
          {!showAll && filteredReviews.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={handleToggleShowAll}
              className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
            >
              {REVIEWS_COPY.showAll}
            </button>
          )}
        </div>
        <p className="text-sm text-muted mb-8">{REVIEWS_COPY.highlights}</p>

        <div className="mb-8">
          <p className="text-sm text-text mb-3">{REVIEWS_COPY.topicsHint}</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TOPICS.map(({ id, label }) => {
              const isActive = activeTopics.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTopic(id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-stone bg-white text-text hover:border-primary/40'
                  }`}
                >
                  {isActive ? <X size={14} /> : <Plus size={14} />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-sm text-text">{REVIEWS_COPY.featuredTitle}</h3>
          {!showAll && visibleReviews.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                aria-label="Prethodne recenzije"
                className="p-2 rounded-lg border border-stone text-muted hover:text-text hover:border-primary/40 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                aria-label="Sljedeće recenzije"
                className="p-2 rounded-lg border border-stone text-muted hover:text-text hover:border-primary/40 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {visibleReviews.length > 0 ? (
          showAll ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  activeTopics={activeTopics}
                />
              ))}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-thin"
            >
              {visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  activeTopics={activeTopics}
                  compact
                />
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-muted py-8 text-center border border-dashed border-stone rounded-xl">
            {REVIEWS_COPY.noResults}
          </p>
        )}

        {(showAll || filteredReviews.length > PREVIEW_COUNT) && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handleToggleShowAll}
              className="inline-flex items-center justify-center border border-primary text-primary hover:bg-primary/5 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {showAll ? REVIEWS_COPY.hideAll : REVIEWS_COPY.showAll}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
