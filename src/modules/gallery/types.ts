export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  /** Optional: logical category tag, e.g. "room", "exterior", "amenities" */
  tag?: string;
  width: number;
  height: number;
}

export interface GalleryCollection {
  id: string;
  label: string;
  images: GalleryImage[];
}
