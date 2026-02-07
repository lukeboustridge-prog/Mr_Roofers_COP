import Image from 'next/image';
import type { CopImage as CopImageType } from '@/types/cop';
import { cn } from '@/lib/utils';

interface CopImageProps {
  image: CopImageType;
  chapterNumber: number;
  sectionNumber: string;
}

export function CopImage({ image, chapterNumber, sectionNumber }: CopImageProps) {
  return (
    <figure className="my-6">
      <Image
        src={image.url}
        width={image.dimensions.width}
        height={image.dimensions.height}
        alt={image.caption || `COP Chapter ${chapterNumber} Section ${sectionNumber} diagram`}
        className="rounded-lg border border-slate-200"
        quality={80}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 720px"
      />
      {image.caption && (
        <figcaption className="text-sm text-slate-500 mt-2 text-center">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}
