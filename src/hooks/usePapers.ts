import { useState, useEffect, useCallback } from 'react';
import { PaperMetadata, NewPaperData } from '../types';
import {
    fetchPapersForSeries,
    fetchPaperMetadata,
    createNewPaper,
    deleteSinglePaper
} from '../services/paperService';
import { useApiContext } from '../context/ApiContext';
// import { useAuth } from '../context/AuthContext';
import { useAuth } from '../auth/AuthContext';

const RETRIES = 1;

export const usePapers = (seriesId: string | null) => {
    const { apiConfig } = useApiContext();
    const { isAuthenticated } = useAuth();
    const [paperIds, setPaperIds] = useState<string[]>([]);
    const [paperMetadata, setPaperMetadata] = useState<Record<string, PaperMetadata>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPapers = useCallback(async () => {
        // Only proceed if we have a series ID and either API key or authentication
        if ((!apiConfig.key && !isAuthenticated) || !seriesId) return;
        
        try {
            setLoading(true);
            setError(null);
            const ids = await fetchPapersForSeries(apiConfig.key, seriesId);
            setPaperIds(ids);

            // Clear paper metadata when changing series
            setPaperMetadata({});

            // Fetch metadata for each paper
            await Promise.all(ids.map(id => fetchSinglePaperMetadata(id)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch papers');
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, seriesId]);

    const fetchSinglePaperMetadata = useCallback(async (paperId: string, retryCount = 0) => {
        // Only proceed if we have auth and series ID
        if ((!apiConfig.key && !isAuthenticated) || !seriesId) return;
        
        try {
            const data = await fetchPaperMetadata(apiConfig.key, seriesId, paperId);

            // Check if the data is valid (has at least a title)
            if (!data || !data.title) {
                throw new Error('Received invalid paper metadata');
            }

            setPaperMetadata(prev => ({
                ...prev,
                [paperId]: data
            }));
        } catch (err) {
            console.error(`Failed to fetch metadata for paper ${paperId}:`, err);

            // Retry logic with exponential backoff
            if (retryCount < RETRIES) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, etc.
                console.log(`Retrying metadata fetch for ${paperId} in ${delay / 1000}s...`);
                setTimeout(() => fetchSinglePaperMetadata(paperId, retryCount + 1), delay);
            } else {
                // After all retries failed, set error state for this paper
                setPaperMetadata(prev => ({
                    ...prev,
                    [paperId]: {
                        title: `Error loading paper (ID: ${paperId})`,
                        authors: ['Unknown'],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        hasPDF: false,
                        loadError: true // Flag to indicate loading error
                    }
                }));
            }
        }
    }, [apiConfig.key, isAuthenticated, seriesId]);

    const createPaper = useCallback(async (paperData: NewPaperData, file?: File) => {
        // Only proceed if we have auth and series ID
        if ((!apiConfig.key && !isAuthenticated) || !seriesId) return;
        
        try {
            setLoading(true);
            setError(null);

            // Create the paper
            const newPaperId = await createNewPaper(apiConfig.key, seriesId, paperData, file);

            // Add a delay before fetching papers to give the server time to process
            setTimeout(() => fetchPapers(), 1500);

            return newPaperId;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create paper');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, seriesId, fetchPapers]);

    const deletePaper = useCallback(async (paperId: string) => {
        // Only proceed if we have auth and series ID
        if ((!apiConfig.key && !isAuthenticated) || !seriesId) return;
        
        try {
            setLoading(true);
            setError(null);
            await deleteSinglePaper(apiConfig.key, seriesId, paperId);
            await fetchPapers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete paper');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, seriesId, fetchPapers]);

    useEffect(() => {
        // Fetch papers when we have a series ID and either API key or Cognito auth
        if (seriesId && (apiConfig.key || isAuthenticated)) {
            fetchPapers();
        }
    }, [seriesId, apiConfig.key, isAuthenticated, fetchPapers]);

    return {
        paperIds,
        paperMetadata,
        loading,
        error,
        fetchPapers,
        createPaper,
        deletePaper,
    };
};
