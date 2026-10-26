import { apiDelete, apiGet, apiPost, apiPut } from './api';

export interface ArchiveMetadataOverrides {
  name?: string;
  description?: string;
  homepage?: string;
  baseUrl?: string;
  maintainerName?: string;
  maintainerEmail?: string;
  maintainerPhone?: string;
}

export async function getArchiveMeta(archiveId: string) {
  return apiGet<ArchiveMetadataOverrides>(`archives/${archiveId}/meta`);
}

export async function putArchiveMeta(archiveId: string, meta: ArchiveMetadataOverrides) {
  return apiPut<ArchiveMetadataOverrides, ArchiveMetadataOverrides>(`archives/${archiveId}/meta`, meta);
}

export async function publishArchiveAdmin(archiveId: string) {
  return apiPost<{ success: boolean }, {}>(`archives/${archiveId}/publish`, {});
}

// Allow passing initial archive metadata (server will persist to RePEc/<archive>/archive.json)
export async function initArchiveAdmin(archiveId: string, meta: ArchiveMetadataOverrides = {}) {
  return apiPost<{ success: boolean }, ArchiveMetadataOverrides>(`archives/${archiveId}/init`, meta);
}

// Advanced archive-level ReDIF editor (plain-text)
export async function getArchiveRedif(archiveId: string) {
  return apiGet<{ redif: string }>(`archives/${archiveId}/redif`);
}

export async function putArchiveRedif(archiveId: string, redif: string) {
  return apiPut<ArchiveMetadataOverrides, { redif: string }>(`archives/${archiveId}/redif`, { redif });
}

export async function rebuildSeriesIndexAdmin(archiveId: string, seriesId: string) {
  return apiPost<{ success: boolean }, {}>(`archives/${archiveId}/rebuild-series-index/${seriesId}`, {});
}

export interface DeleteArchiveResult {
  success: boolean;
  archiveId: string;
  prefix: string;
  dryRun: boolean;
  keysFound: number;
  deleted: number;
}

export async function deleteArchiveAdmin(
  archiveId: string,
  params: { dryRun: boolean; confirm?: string }
) {
  const qs = params.dryRun ? '?dryRun=1' : '';
  return apiDelete<DeleteArchiveResult>(`archives/${archiveId}${qs}`, undefined, {
    data: params.confirm ? { confirm: params.confirm } : {}
  });
}
