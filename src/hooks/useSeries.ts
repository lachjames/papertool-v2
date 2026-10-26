import { useState, useEffect, useCallback } from 'react';
import { SeriesMetadata, NewSeriesData } from '../types';
import { 
    fetchAllSeries, 
    fetchSingleSeries,
    createNewSeries, 
    updateExistingSeries,
    deleteSingleSeries 
} from '../services/seriesService';
import { useApiContext } from '../context/ApiContext';
import { useAuth } from '../auth/AuthContext';
import { useArchive } from '../context/ArchiveContext';

export const useSeries = () => {
    const { apiConfig } = useApiContext();
    const { isAuthenticated } = useAuth();
    const { selectedArchiveId } = useArchive();
    const [series, setSeries] = useState<SeriesMetadata[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSeries = useCallback(async () => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return;
        if (!selectedArchiveId) return;
        
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAllSeries(apiConfig.key, selectedArchiveId);
            setSeries(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch series');
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId]);

    const createSeries = useCallback(async (seriesData: NewSeriesData, basePdfFile?: File) => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return;
        if (!selectedArchiveId) return;
        
        try {
            setLoading(true);
            setError(null);
            await createNewSeries(apiConfig.key, selectedArchiveId, seriesData, basePdfFile);
            await fetchSeries();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create series');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, fetchSeries]);

    // NEW: Update series function
    const updateSeries = useCallback(async (
        seriesId: string, 
        seriesData: Partial<NewSeriesData>
    ) => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return;
        if (!selectedArchiveId) return;
        
        try {
            setLoading(true);
            setError(null);
            
            console.log('Updating series with data:', {
                seriesId,
                dataFields: Object.keys(seriesData)
            });

            const updatedSeries = await updateExistingSeries(apiConfig.key, selectedArchiveId, seriesId, seriesData);
            
            // Update local state immediately for better UX
            setSeries(prev => prev.map(s => 
                s.seriesId === seriesId ? { ...s, ...updatedSeries } : s
            ));

            // Refresh the series list after a short delay
            setTimeout(() => fetchSeries(), 500);

            return updatedSeries;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update series');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, fetchSeries]);

    const deleteSeries = useCallback(async (seriesId: string) => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return;
        if (!selectedArchiveId) return;
        
        try {
            setLoading(true);
            setError(null);
            await deleteSingleSeries(apiConfig.key, selectedArchiveId, seriesId);
            await fetchSeries();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete series');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, fetchSeries]);

    // NEW: Get single series function
    const getSeries = useCallback(async (seriesId: string): Promise<SeriesMetadata | null> => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return null;
        if (!selectedArchiveId) return null;
        
        try {
            return await fetchSingleSeries(apiConfig.key, selectedArchiveId, seriesId);
        } catch (err) {
            console.error(`Failed to fetch series ${seriesId}:`, err);
            return null;
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId]);

    useEffect(() => {
        // Check if we can fetch series (either with API key or auth)
        if ((apiConfig.key || isAuthenticated) && selectedArchiveId) {
            fetchSeries();
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, fetchSeries]);

    return {
        series,
        loading,
        error,
        fetchSeries,
        createSeries,
        updateSeries, // NEW: Export the update function
        deleteSeries,
        getSeries, // NEW: Export the get single series function
    };
};
