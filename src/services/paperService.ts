import { apiGet, apiDelete } from './api';
import { PaperMetadata, NewPaperData } from '../types';
import axios from 'axios';
import getBaseURL from '../getBaseURL';

export interface PaperSummaryItem {
  paperId: string;
  metadata: PaperMetadata;
}

export interface PaperSummaryResponse {
  papers: PaperSummaryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextPaperNumber?: string;
}

export const fetchPapersForSeries = async (
  apiKey: string,
  archiveId: string,
  seriesId: string
): Promise<string[]> => {
  try {
    const response = await apiGet<string[]>(`archives/${archiveId}/series/${seriesId}/papers`, apiKey);
    return response.data;
  } catch (error) {
    console.error(`Error fetching papers for series ${seriesId}:`, error);
    throw error;
  }
};

export const fetchPaperSummaries = async (
  apiKey: string,
  archiveId: string,
  seriesId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<PaperSummaryResponse> => {
  try {
    const params = new URLSearchParams();

    if (typeof options.limit === 'number') {
      params.set('limit', String(options.limit));
    }

    if (typeof options.offset === 'number') {
      params.set('offset', String(options.offset));
    }

    const query = params.toString();
    const endpoint = `archives/${archiveId}/series/${seriesId}/papers/summary${query ? `?${query}` : ''}`;
    const response = await apiGet<PaperSummaryResponse>(endpoint, apiKey);
    return response.data;
  } catch (error) {
    console.error(`Error fetching paper summaries for series ${seriesId}:`, error);
    throw error;
  }
};

export const fetchPaperMetadata = async (
  apiKey: string,
  archiveId: string,
  seriesId: string,
  paperId: string
): Promise<PaperMetadata> => {
  try {
    const response = await apiGet<PaperMetadata>(
      `archives/${archiveId}/series/${seriesId}/papers/${paperId}`,
      apiKey
    );

    const data = response.data;

    if (typeof data === 'object' && data !== null && '0' in data) {
      console.error('Received malformed paper metadata', data);
      throw new Error('Received malformed paper metadata from server');
    }

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
  archiveId: string,
  seriesId: string,
  paperData: NewPaperData,
  contentFile: File,
  coverPageFile?: File | null
): Promise<string> => {
  const paperId = `paper_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const formData = new FormData();

  const paperMetadata = {
    title: paperData.title.trim(),
    authors: paperData.authors.split(',').map(a => a.trim()).filter(a => a.length > 0),
    abstract: paperData.abstract ? paperData.abstract.trim() : '',
    keywords: paperData.keywords ? paperData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : [],
    jel: paperData.jel ? paperData.jel.split(',').map(j => j.trim()).filter(j => j.length > 0) : [],
    publicationDate: paperData.publicationDate ? paperData.publicationDate.trim() : undefined,
    paperNumber: paperData.paperNumber ? paperData.paperNumber.trim() : undefined,
    link: paperData.link ? paperData.link.trim() : undefined,
    pageSize: paperData.pageSize || 'a4'
  };

  console.log('Sending paper metadata:', JSON.stringify(paperMetadata));
  formData.append('metadata', JSON.stringify(paperMetadata));
  formData.append('pdf', contentFile);

  if (coverPageFile) {
    console.log('Including cover page PDF in upload');
    formData.append('coverPage', coverPageFile);
  } else {
    console.log('No cover page PDF included in upload');
  }

  try {
    const response = await axios.post(
      getBaseURL(`archives/${archiveId}/series/${seriesId}/papers/${paperId}`),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(apiKey ? { 'x-proxy-key': apiKey } : {})
        },
        withCredentials: true
      }
    );

    console.log('Paper creation response:', response.data);
    return paperId;
  } catch (error) {
    console.error('Error creating paper:', error);
    throw error;
  }
};

export const updateExistingPaper = async (
  apiKey: string,
  archiveId: string,
  seriesId: string,
  paperId: string,
  paperData: Partial<NewPaperData>,
  contentFile?: File | null,
  coverPageFile?: File | null
): Promise<PaperMetadata> => {
  const formData = new FormData();

  const paperMetadata: any = {};

  if (paperData.title !== undefined) {
    paperMetadata.title = paperData.title.trim();
  }

  if (paperData.authors !== undefined) {
    paperMetadata.authors = paperData.authors.split(',').map(a => a.trim()).filter(a => a.length > 0);
  }

  if (paperData.abstract !== undefined) {
    paperMetadata.abstract = paperData.abstract.trim();
  }

  if (paperData.keywords !== undefined) {
    paperMetadata.keywords = paperData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  if (paperData.jel !== undefined) {
    paperMetadata.jel = paperData.jel.split(',').map(j => j.trim()).filter(j => j.length > 0);
  }

  if (paperData.pageSize !== undefined) {
    paperMetadata.pageSize = paperData.pageSize;
  }

  if (paperData.publicationDate !== undefined) {
    paperMetadata.publicationDate = paperData.publicationDate ? paperData.publicationDate.trim() : '';
  }

  if (paperData.paperNumber !== undefined) {
    paperMetadata.paperNumber = paperData.paperNumber ? paperData.paperNumber.trim() : '';
  }

  if (paperData.link !== undefined) {
    paperMetadata.link = paperData.link ? paperData.link.trim() : '';
  }

  if (Object.keys(paperMetadata).length > 0) {
    console.log('Sending paper metadata update:', JSON.stringify(paperMetadata));
    formData.append('metadata', JSON.stringify(paperMetadata));
  }

  if (contentFile) {
    console.log('Including content PDF in update');
    formData.append('pdf', contentFile);
  }

  if (coverPageFile) {
    console.log('Including cover page PDF in update');
    formData.append('coverPage', coverPageFile);
  }

  try {
    const response = await axios.put(
      getBaseURL(`archives/${archiveId}/series/${seriesId}/papers/${paperId}`),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(apiKey ? { 'x-proxy-key': apiKey } : {})
        },
        withCredentials: true
      }
    );

    console.log('Paper update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating paper:', error);
    throw error;
  }
};

export const deleteSinglePaper = async (
  apiKey: string,
  archiveId: string,
  seriesId: string,
  paperId: string
): Promise<void> => {
  try {
    const response = await apiDelete<{success: boolean}>(
      `archives/${archiveId}/series/${seriesId}/papers/${paperId}`,
      apiKey
    );

    if (!response.data.success) {
      throw new Error('Server reported deletion failure');
    }
  } catch (error) {
    console.error(`Error deleting paper ${paperId} from series ${seriesId}:`, error);
    throw error;
  }
};
