import { apiGet, apiPost, apiDelete, apiPut } from './api';
import { SeriesMetadata, NewSeriesData } from '../types';
import axios from 'axios';
import getBaseURL from '../getBaseURL';

export const fetchAllSeries = async (apiKey: string, archiveId: string): Promise<SeriesMetadata[]> => {
  try {
    const response = await apiGet<SeriesMetadata[]>(`archives/${archiveId}/series`, apiKey);
    return response.data;
  } catch (error) {
    console.error('Error fetching all series:', error);
    throw error;
  }
};

// NEW: Fetch single series data
export const fetchSingleSeries = async (
  apiKey: string,
  archiveId: string,
  seriesId: string
): Promise<SeriesMetadata> => {
  try {
    // The backend doesn't have a specific endpoint for single series,
    // so we'll fetch all and filter. This could be optimized later.
    const allSeries = await fetchAllSeries(apiKey, archiveId);
    const series = allSeries.find(s => s.seriesId === seriesId);
    
    if (!series) {
      throw new Error(`Series with ID ${seriesId} not found`);
    }
    
    return series;
  } catch (error) {
    console.error(`Error fetching series ${seriesId}:`, error);
    throw error;
  }
};

export const createNewSeries = async (
  apiKey: string,
  archiveId: string,
  seriesData: NewSeriesData,
  basePdfFile?: File
): Promise<void> => {
  try {
    // If there's a base PDF file, we need to use FormData
    if (basePdfFile) {
      const formData = new FormData();
      formData.append('seriesData', JSON.stringify(seriesData));
      formData.append('basePdf', basePdfFile);

      await axios.post(
        getBaseURL(`archives/${archiveId}/series/with-base-pdf`),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(apiKey ? { 'x-proxy-key': apiKey } : {})
          },
          withCredentials: true
        }
      );
    } else {
      // Otherwise, use the regular API call
      await apiPost<void, NewSeriesData>(`archives/${archiveId}/series`, seriesData, apiKey);
    }
  } catch (error) {
    console.error('Error creating new series:', error);
    throw error;
  }
};

// UPDATED: Use the correct PUT endpoint
export const updateExistingSeries = async (
  apiKey: string,
  archiveId: string,
  seriesId: string,
  seriesData: Partial<NewSeriesData>
): Promise<SeriesMetadata> => {
  try {
    const response = await apiPut<SeriesMetadata, Partial<NewSeriesData>>(
      `archives/${archiveId}/series/${seriesId}`, 
      seriesData, 
      apiKey
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating series ${seriesId}:`, error);
    throw error;
  }
};

// DEPRECATED: Keep for backward compatibility but mark as deprecated
export const updateSeries = async (
  apiKey: string,
  archiveId: string,
  seriesId: string,
  seriesData: Partial<NewSeriesData>
): Promise<void> => {
  console.warn('updateSeries is deprecated, use updateExistingSeries instead');
  await updateExistingSeries(apiKey, archiveId, seriesId, seriesData);
};

export const deleteSingleSeries = async (
  apiKey: string,
  archiveId: string,
  seriesId: string
): Promise<void> => {
  try {
    const response = await apiDelete<{success: boolean}>(`archives/${archiveId}/series/${seriesId}`, apiKey);
    
    // Check the response structure to ensure it contains success: true
    if (!response.data.success) {
      throw new Error('Server reported deletion failure');
    }
  } catch (error) {
    console.error(`Error deleting series ${seriesId}:`, error);
    throw error;
  }
};

export const getSeriesBasePdf = async (
  apiKey: string,
  archiveId: string,
  seriesId: string
): Promise<ArrayBuffer> => {
  try {
    const response = await axios.get(
      getBaseURL(`archives/${archiveId}/series/${seriesId}/base-template`),
      {
        headers: {
          ...(apiKey ? { 'x-proxy-key': apiKey } : {})
        },
        responseType: 'arraybuffer',
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching base PDF for series ${seriesId}:`, error);
    throw error;
  }
};

export const getSeriesHtmlTemplate = async (
  apiKey: string,
  archiveId: string,
  seriesId: string
): Promise<string> => {
  try {
    const response = await apiGet<{htmlTemplate: string}>(
      `archives/${archiveId}/series/${seriesId}/html-template`,
      apiKey
    );
    return response.data.htmlTemplate;
  } catch (error) {
    console.error(`Error fetching HTML template for series ${seriesId}:`, error);
    throw error;
  }
};

// NEW: fetch ReDIF Series template text (published inside <archive>seri.rdf) for advanced editing
export const getSeriesRedif = async (
  apiKey: string,
  archiveId: string,
  seriesId: string
): Promise<string> => {
  try {
    const response = await apiGet<{ redif: string }>(
      `archives/${archiveId}/series/${seriesId}/redif`,
      apiKey
    );
    return response.data.redif;
  } catch (error) {
    console.error(`Error fetching ReDIF for series ${seriesId}:`, error);
    throw error;
  }
};

// NEW: update series metadata from edited ReDIF Series template
export const updateSeriesRedif = async (
  apiKey: string,
  archiveId: string,
  seriesId: string,
  redif: string
): Promise<SeriesMetadata> => {
  try {
    const response = await apiPut<SeriesMetadata, { redif: string }>(
      `archives/${archiveId}/series/${seriesId}/redif`,
      { redif },
      apiKey
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating ReDIF for series ${seriesId}:`, error);
    throw error;
  }
};
