import type { AppLocale } from '@/i18n/routing';

export type GuideSection = {
  heading: string;
  paragraphs: string[];
};

export type GuideCoverImage = {
  src: string;
  alt: string;
};

export type GuideArticle = {
  slug: string;
  locale: AppLocale;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  keywords: string[];
  coverImage: GuideCoverImage;
  sections: GuideSection[];
};

export type GuideListItem = Pick<
  GuideArticle,
  'slug' | 'title' | 'description' | 'publishedAt' | 'readingTime' | 'coverImage'
>;
