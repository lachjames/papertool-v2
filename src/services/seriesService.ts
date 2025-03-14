import { apiGet, apiPost, apiDelete } from './api';
import { SeriesMetadata, NewSeriesData } from '../types';

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
  seriesData: NewSeriesData
): Promise<void> => {
  try {
    await apiPost<void, NewSeriesData>('series', seriesData, apiKey);
  } catch (error) {
    console.error('Error creating new series:', error);
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
