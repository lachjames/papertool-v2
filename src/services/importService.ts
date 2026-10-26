import { apiPost } from './api';

export interface ImportCandidate {
  handle: string;
  title?: string;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
  jel?: string[];
  pdfUrl?: string;
  hasPdf: boolean;
}

export interface ImportListResponse {
  seriesUrl: string;
  candidates: ImportCandidate[];
}

export interface ImportResultItem {
  handle: string;
  success: boolean;
  paperId?: string;
  error?: string;
}

export interface ImportResult {
  seriesId: string;
  total: number;
  imported: number;
  failed: number;
  items: ImportResultItem[];
}

export interface ImportOptions {
  stripFirstPage?: boolean;
  addCoverPage?: boolean;
}

export async function listRepecSeries(seriesUrl: string, archiveId: string): Promise<ImportListResponse> {
  const res = await apiPost<ImportListResponse, { seriesUrl: string }>(
    `archives/${archiveId}/import/repec/list`,
    { seriesUrl }
  );
  return res.data;
}

export async function importOne(
  archiveId: string,
  targetSeriesId: string,
  seriesUrl: string,
  handle: string,
  options?: ImportOptions
): Promise<ImportResultItem> {
  const res = await apiPost<ImportResultItem, { targetSeriesId: string; seriesUrl: string; handle: string; options?: ImportOptions }>(
    `archives/${archiveId}/import/repec/import-one`,
    { targetSeriesId, seriesUrl, handle, options }
  );
  return res.data;
}

export async function importSelected(
  archiveId: string,
  targetSeriesId: string,
  seriesUrl: string,
  handles: string[]
): Promise<ImportResult> {
  const res = await apiPost<ImportResult, { targetSeriesId: string; seriesUrl: string; handles: string[] }>(
    `archives/${archiveId}/import/repec/import`,
    { targetSeriesId, seriesUrl, handles }
  );
  return res.data;
}
