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

// Supplementary content linked to COP sections via cop_section_details / cop_section_htg
export interface SupplementaryDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  modelUrl: string | null;
  thumbnailUrl: string | null;
  sourceName: string;           // e.g. 'MRM' or 'RANZ'
  relationshipType: string;     // 'referenced', 'illustrates', 'alternative'
  stepCount?: number;           // Number of installation steps (from junction query)
  warningCount?: number;        // Number of warnings (from junction query)
  hasChecklist?: boolean;       // Whether a checklist exists (from junction query)
}

export interface SupplementaryHtg {
  id: string;
  guideName: string;
  sourceDocument: string;
  relevance: string | null;
}

export interface SupplementaryData {
  details: SupplementaryDetail[];
  htgGuides: SupplementaryHtg[];
}
