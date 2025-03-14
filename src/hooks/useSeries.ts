import { useState, useEffect, useCallback } from 'react';
import { SeriesMetadata, NewSeriesData } from '../types';
import { fetchAllSeries, createNewSeries, deleteSingleSeries } from '../services/seriesService';
import { useApiContext } from '../context/ApiContext';
// import { useAuth } from '../context/AuthContext';
import { useAuth } from '../auth/AuthContext';

export const useSeries = () => {
    const { apiConfig } = useApiContext();
    const { isAuthenticated } = useAuth();
    const [series, setSeries] = useState<SeriesMetadata[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSeries = useCallback(async () => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return;
        
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAllSeries(apiConfig.key);
            setSeries(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch series');
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated]);

    const createSeries = useCallback(async (seriesData: NewSeriesData) => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return;
        
        try {
            setLoading(true);
            setError(null);
            await createNewSeries(apiConfig.key, seriesData);
            await fetchSeries();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create series');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, fetchSeries]);

    const deleteSeries = useCallback(async (seriesId: string) => {
        // Only proceed if either API key is provided or user is authenticated
        if (!apiConfig.key && !isAuthenticated) return;
        
        try {
            setLoading(true);
            setError(null);
            await deleteSingleSeries(apiConfig.key, seriesId);
            await fetchSeries();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete series');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, fetchSeries]);

    useEffect(() => {
        // Check if we can fetch series (either with API key or auth)
        if (apiConfig.key || isAuthenticated) {
            fetchSeries();
        }
    }, [apiConfig.key, isAuthenticated, fetchSeries]);

    return {
        series,
        loading,
        error,
        fetchSeries,
        createSeries,
        deleteSeries,
    };
};
