import { apiGet, apiPut } from './api';

export interface SeriesAccess {
  owners: string[];
  editors: string[];
}

export interface MyAccess {
  isAdmin: boolean;
  ownerOf: string[];
  editorOf: string[];
  archiveCreatorOf: string[];
}

export async function getMyAccess() {
  const res = await apiGet<MyAccess>('access/me');
  return res.data;
}

export async function getSeriesAccess(archiveId: string, seriesId: string) {
  const res = await apiGet<SeriesAccess>(`archives/${archiveId}/series/${seriesId}/access`);
  return res.data;
}

export async function updateSeriesAccess(archiveId: string, seriesId: string, access: SeriesAccess) {
  const res = await apiPut<SeriesAccess, SeriesAccess>(`archives/${archiveId}/series/${seriesId}/access`, access);
  return res.data;
}
