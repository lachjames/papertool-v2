export interface SeriesMetadata {
  name: string;
  institution: string;
  seriesId: string;
  description?: string; // Added description
  createdAt: string;
  updatedAt: string;
  paperCount: number;
  coverPageSettings?: CoverPageSettings; // Added cover page settings
}

export interface PaperMetadata {
  title: string;
  authors: string[];
  abstract?: string;
  keywords?: string[];
  jel?: string[];    // Added JEL classification codes
  hasPDF: boolean;
  createdAt: string;
  updatedAt: string;
  loadError?: boolean; // For tracking loading errors
  pageSize?: PageSize; // Added page size information
}

export interface PageSize {
  width: number;
  height: number;
  format?: string;
}

export interface NewSeriesData {
  seriesId: string;
  name: string;
  institution: string;
  description?: string; // Added description field
  coverPageSettings?: CoverPageSettings; // Added cover page settings
}

export interface NewPaperData {
  title: string;
  authors: string;
  abstract: string;
  keywords: string;
  jel?: string;     // Added JEL classification codes field
  pageSize?: PageSize; // Added page size information
}

export interface ApiConfig {
  key: string;
}

export interface CoverPageSettings {
  htmlTemplate?: string; // HTML template for custom cover pages
  defaultTemplate?: string; // Which template to use
  includeAbstract?: boolean;
  includeJEL?: boolean;
  includeKeywords?: boolean;
  includeInstitution?: boolean;
  includeSeriesName?: boolean;
  includeDate?: boolean;
  headerText?: string;
  basePdfId?: string; // For base PDF template if needed
  defaultPageSize?: PageSize; // Added default page size setting
}
