import { apiGet, apiPost, apiDelete } from './api';
import { SeriesMetadata, NewSeriesData } from '../types';
import axios from 'axios';
import getBaseURL from '../getBaseURL';

export const fetchAllSeries = async (apiKey: string): Promise<SeriesMetadata[]> => {
  try {
    const response = await apiGet<SeriesMetadata[]>('series', apiKey);
    return response.data;
  } catch (error) {
    console.error('Error fetching all series:', error);
    throw error;
  }
};

export const createNewSeries = async (
  apiKey: string,
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
        getBaseURL('series/with-base-pdf'),
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
      await apiPost<void, NewSeriesData>('series', seriesData, apiKey);
    }
  } catch (error) {
    console.error('Error creating new series:', error);
    throw error;
  }
};

export const updateSeries = async (
  apiKey: string,
  seriesId: string,
  seriesData: Partial<NewSeriesData>
): Promise<void> => {
  try {
    await apiPost<void, Partial<NewSeriesData>>(`series/${seriesId}/update`, seriesData, apiKey);
  } catch (error) {
    console.error('Error updating series:', error);
    throw error;
  }
};

export const deleteSingleSeries = async (
  apiKey: string,
  seriesId: string
): Promise<void> => {
  try {
    const response = await apiDelete<{success: boolean}>(`series/${seriesId}`, apiKey);
    
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
  seriesId: string
): Promise<ArrayBuffer> => {
  try {
    const response = await axios.get(
      getBaseURL(`series/${seriesId}/base-template`),
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
  seriesId: string
): Promise<string> => {
  try {
    const response = await apiGet<{htmlTemplate: string}>(
      `series/${seriesId}/html-template`,
      apiKey
    );
    return response.data.htmlTemplate;
  } catch (error) {
    console.error(`Error fetching HTML template for series ${seriesId}:`, error);
    throw error;
  }
};
