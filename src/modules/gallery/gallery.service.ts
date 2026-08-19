import { GALLERY_CATEGORIES } from './gallery.categories';
import { getGalleryCategoryLabel } from './gallery.i18n';
import { getGalleryItems } from './gallery.repository';
import type { GallerySection } from './gallery.types';

export async function getGallerySections(
  locale: string | null | undefined = 'hr',
): Promise<GallerySection[]> {
  const items = await getGalleryItems(locale);

  return GALLERY_CATEGORIES.map((category) => {
    const categoryItems = items.filter((item) => item.category_key === category.key);
    const label = getGalleryCategoryLabel(category.key, locale);

    return {
      id: category.key,
      title: label,
      media: categoryItems
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item, index) => ({
          src: item.src,
          type: item.media_type,
          alt: item.alt_text || `${label} ${index + 1}`,
          caption: item.title || item.alt_text || label,
        })),
    };
  }).filter((section) => section.media.length > 0);
}
