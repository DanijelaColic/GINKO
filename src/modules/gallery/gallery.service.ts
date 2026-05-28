import { GALLERY_CATEGORIES, getGalleryCategoryLabel } from './gallery.categories';
import { getGalleryItems } from './gallery.repository';
import type { GallerySection } from './gallery.types';

export async function getGallerySections(): Promise<GallerySection[]> {
  const items = await getGalleryItems();

  return GALLERY_CATEGORIES.map((category) => {
    const categoryItems = items.filter((item) => item.category_key === category.key);

    return {
      id: category.key,
      title: getGalleryCategoryLabel(category.key),
      media: categoryItems
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item, index) => ({
          src: item.src,
          type: item.media_type,
          alt: item.alt_text || `${category.label} ${index + 1}`,
          caption: item.title || item.alt_text || category.label,
        })),
    };
  }).filter((section) => section.media.length > 0);
}
