'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { CopImage as CopImageType } from '@/types/cop';

interface CopImageProps {
  image: CopImageType;
  chapterNumber: number;
  sectionNumber: string;
  /** Optional figure index for numbered captions (e.g. "Figure 1: ...") */
  figureIndex?: number;
}

export function CopImage({ image, chapterNumber, sectionNumber, figureIndex }: CopImageProps) {
  const [open, setOpen] = useState(false);

  const altText = image.caption || `COP Chapter ${chapterNumber} Section ${sectionNumber} diagram`;
  const captionText = figureIndex
    ? `Figure ${figureIndex}: ${image.caption || `Section ${sectionNumber} diagram`}`
    : image.caption;

  return (
    <>
      <figure className="my-6">
        {/* Clickable thumbnail with zoom indicator */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full cursor-zoom-in rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`Zoom into ${altText}`}
        >
          <Image
            src={image.url}
            width={image.dimensions.width}
            height={image.dimensions.height}
            alt={altText}
            className="rounded-lg border border-slate-200"
            quality={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 720px"
          />
          {/* Zoom indicator overlay */}
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" />
            Click to zoom
          </span>
        </button>

        {/* Figure caption */}
        {captionText && (
          <figcaption className="text-sm text-slate-500 mt-2 text-center">
            {captionText}
          </figcaption>
        )}
      </figure>

      {/* Full-size zoom Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto p-2 sm:p-4 overflow-auto">
          <DialogTitle className="sr-only">{altText}</DialogTitle>
          <DialogDescription className="sr-only">
            Full-resolution view of {altText}
          </DialogDescription>
          <div className="flex flex-col items-center gap-3">
            <Image
              src={image.url}
              width={image.dimensions.width}
              height={image.dimensions.height}
              alt={altText}
              className="max-h-[80vh] w-auto object-contain rounded"
              quality={95}
              sizes="90vw"
              priority
            />
            {captionText && (
              <p className="text-sm text-slate-600 text-center max-w-2xl">
                {captionText}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
