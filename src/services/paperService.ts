import { apiGet, apiDelete } from './api';
import { PaperMetadata, NewPaperData } from '../types';
import axios from 'axios';
import getBaseURL from '../getBaseURL'; // Adjust path if needed

export const fetchPapersForSeries = async (
  apiKey: string,
  seriesId: string
): Promise<string[]> => {
  try {
    const response = await apiGet<string[]>(`series/${seriesId}/papers`, apiKey);
    return response.data;
  } catch (error) {
    console.error(`Error fetching papers for series ${seriesId}:`, error);
    throw error;
  }
};

export const fetchPaperMetadata = async (
  apiKey: string,
  seriesId: string,
  paperId: string
): Promise<PaperMetadata> => {
  try {
    const response = await apiGet<PaperMetadata>(
      `series/${seriesId}/papers/${paperId}`,
      apiKey
    );
    
    const data = response.data;
    
    // Check if the response has the indexed character structure (indicating an error)
    if (typeof data === 'object' && data !== null && '0' in data) {
      console.error('Received malformed paper metadata', data);
      throw new Error('Received malformed paper metadata from server');
    }
    
    // Validate the structure has the minimum required fields
    if (!data.title || !Array.isArray(data.authors)) {
      console.error('Invalid paper metadata structure', data);
      throw new Error('Paper metadata is missing required fields');
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching metadata for paper ${paperId} in series ${seriesId}:`, error);
    throw error;
  }
};

export const createNewPaper = async (
  apiKey: string,
  seriesId: string,
  paperData: NewPaperData,
  file?: File
): Promise<string> => {
  // Generate a unique paper ID with prefix to make it easier to identify
  const paperId = `paper_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const formData = new FormData();
  
  // Process input data to ensure it's well-formed
  const paperMetadata = {
    title: paperData.title.trim(),
    authors: paperData.authors.split(',').map(a => a.trim()).filter(a => a.length > 0),
    abstract: paperData.abstract ? paperData.abstract.trim() : '',
    keywords: paperData.keywords ? paperData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : [],
    jel: paperData.jel ? paperData.jel.split(',').map(j => j.trim()).filter(j => j.length > 0) : [], // Handle JEL codes
  };

  // Ensure we're getting valid JSON in the metadata field
  console.log('Sending paper metadata:', JSON.stringify(paperMetadata));
  formData.append('metadata', JSON.stringify(paperMetadata));

  if (file) {
    formData.append('pdf', file);
  }

  // For file uploads, we need to use axios directly with FormData
  try {
    await axios.post(
      getBaseURL(`series/${seriesId}/papers/${paperId}`),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(apiKey ? { 'x-proxy-key': apiKey } : {})
        },
        withCredentials: true
      }
    );
    
    return paperId;
  } catch (error) {
    console.error('Error creating paper:', error);
    throw error;
  }
};

export const deleteSinglePaper = async (
  apiKey: string,
  seriesId: string,
  paperId: string
): Promise<void> => {
  try {
    const response = await apiDelete<{success: boolean}>(
      `series/${seriesId}/papers/${paperId}`,
      apiKey
    );
    
    // Check the response structure to ensure it contains success: true
    if (!response.data.success) {
      throw new Error('Server reported deletion failure');
    }
  } catch (error) {
    console.error(`Error deleting paper ${paperId} from series ${seriesId}:`, error);
    throw error;
  }
};
