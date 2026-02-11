'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getPublicUrl } from '@/lib/storage';
import { ImageLightbox } from './ImageLightbox';

interface ImageGalleryProps {
  images: string[]; // R2 keys
  detailCode: string; // For alt text
}

export function ImageGallery({ images, detailCode }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Early return if no images - use explicit length check to avoid rendering "0"
  if (!images || images.length === 0) {
    return null;
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((imageKey, index) => (
          <button
            key={imageKey}
            onClick={() => handleThumbnailClick(index)}
            className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Image
              src={imageKey.startsWith('http') ? imageKey : getPublicUrl(imageKey)}
              alt={`${detailCode} technical diagram ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover hover:scale-105 transition-transform duration-200"
              quality={80}
            />
          </button>
        ))}
      </div>

      <ImageLightbox
        images={images}
        selectedIndex={selectedIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}
