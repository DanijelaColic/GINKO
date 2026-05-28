import type { GalleryCategoryKey } from './gallery.categories';

export type GalleryItem = {
  id: string;
  src: string;
  category_key: GalleryCategoryKey;
  alt_text: string | null;
  title: string | null;
  media_type: 'image' | 'video';
  sort_order: number;
};

export type GalleryMedia = {
  src: string;
  type: 'image' | 'video';
  alt: string;
  caption: string;
};

export type GallerySection = {
  id: string;
  title: string;
  media: GalleryMedia[];
};
