// types/cop.ts

export interface CopImageDimensions {
  width: number;
  height: number;
}

export interface CopImage {
  filename: string;
  url: string;          // Full R2 URL (e.g. "https://pub-xxx.r2.dev/images/mrm/...")
  caption: string;
  dimensions: CopImageDimensions;
}

export interface CopSection {
  number: string;       // e.g. "8", "8.1", "8.1.1", "8.3A"
  title: string;
  level: number;        // 1 = chapter heading, 2 = section, 3 = subsection, etc.
  content: string;      // Plain text with \n line breaks
  pdfPages: number[];
  images?: CopImage[];
  subsections?: CopSection[];
}

export interface CopChapter {
  chapterNumber: number;
  title: string;
  version: string;      // e.g. "v25.12"
  sectionCount: number;
  sections: CopSection[];
}

// Lightweight metadata for the grid (avoids loading full content)
export interface CopChapterMeta {
  chapterNumber: number;
  title: string;
  version: string;
  sectionCount: number;
}
