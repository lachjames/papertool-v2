export interface SeriesMetadata {
  name: string;
  institution: string;
  seriesId: string;
  description?: string; // Added description
  createdAt: string;
  updatedAt: string;
  paperCount: number;
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
}

export interface NewSeriesData {
  seriesId: string;
  name: string;
  institution: string;
  description?: string; // Added description field
}

export interface NewPaperData {
  title: string;
  authors: string;
  abstract: string;
  keywords: string;
  jel?: string;     // Added JEL classification codes field
}

export interface ApiConfig {
  key: string;
}
