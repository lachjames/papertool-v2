// Import shared types
import { PageSize } from '../shared-pdf-types';

// High-level archive summary used by the client when selecting which
// RePEc archive to work with. The `id` is the URL/path identifier and
// typically equals the RePEc archive handle (e.g. "nber").
export interface ArchiveSummary {
  id: string;
  handle: string;
  name: string;

  /** Optional public base URL for RePEc publishing, e.g. https://example.edu */
  baseUrl?: string;

  /** Optional computed archive URL, e.g. https://example.edu/RePEc/ajr/ */
  archiveUrl?: string;
}

export interface SeriesMetadata {
  name: string;
  institution: string;
  seriesId: string;
  description?: string;

  /** Homepage URL for the organisation or series releasing these papers. */
  link?: string;

  /** Optional per-series maintainer overrides (used in the published ReDIF series template inside <archive>seri.rdf). */
  maintainerName?: string;
  maintainerEmail?: string;
  maintainerPhone?: string;

  /** Optional RePEc institution handle (Provider-Institution: RePEc:edi:...) */
  providerInstitutionHandle?: string;

  /** Optional ReDIF fields */
  classificationJel?: string;
  notification?: string;

  providerPhone?: string;
  providerPostal?: string;
  providerFax?: string;

  editorName?: string;
  editorEmail?: string;

  orderEmail?: string;
  orderHomepage?: string;

  createdAt: string;
  updatedAt: string;
  paperCount: number;
  coverPageSettings?: CoverPageSettings;
}

export interface PaperMetadata {
  title: string;
  authors: string[];
  abstract?: string;
  keywords?: string[];
  jel?: string[];
  hasPDF: boolean;

  /** Date the paper was published/released (user-editable). Prefer this for display/cover pages. */
  publicationDate?: string;

  /** Series paper number/identifier (display and templating). */
  paperNumber?: string;

  /** Canonical landing page URL for this specific paper (optional override). */
  link?: string;

  createdAt: string;
  updatedAt: string;
  loadError?: boolean;
  pageSize?: PageSize; // Now uses shared PageSize type
}

export interface NewSeriesData {
  seriesId: string;
  name: string;
  institution: string;
  description?: string;

  /** Homepage URL for the organisation or series releasing these papers. */
  link?: string;

  /** Optional per-series maintainer overrides (used in the published ReDIF series template inside <archive>seri.rdf). */
  maintainerName?: string;
  maintainerEmail?: string;
  maintainerPhone?: string;

  /** Optional RePEc institution handle (Provider-Institution: RePEc:edi:...) */
  providerInstitutionHandle?: string;

  /** Optional ReDIF fields */
  classificationJel?: string;
  notification?: string;

  providerPhone?: string;
  providerPostal?: string;
  providerFax?: string;

  editorName?: string;
  editorEmail?: string;

  orderEmail?: string;
  orderHomepage?: string;

  coverPageSettings?: CoverPageSettings;
}

export interface NewPaperData {
  title: string;
  authors: string;
  abstract: string;
  keywords: string;
  jel?: string;

  /** Date the paper was published/released (YYYY-MM-DD preferred). */
  publicationDate?: string;

  /** Series paper number/identifier (free text). */
  paperNumber?: string;

  /** Canonical landing page URL for this specific paper (optional override). */
  link?: string;

  pageSize?: PageSize; // Now uses shared PageSize type
}

export interface ApiConfig {
  key: string;
}

export interface CoverPageSettings {
  templateId?: string;
  htmlTemplate?: string;
  defaultTemplate?: string;
  includeAbstract?: boolean;
  includeJEL?: boolean;
  includeKeywords?: boolean;
  includeInstitution?: boolean;
  includeSeriesName?: boolean;
  includeDate?: boolean;
  headerText?: string;
  basePdfId?: string;
  defaultPageSize?: PageSize; // Now uses shared PageSize type
}

export type { PageSize } from '../shared-pdf-types'; // Re-export shared PageSize type
