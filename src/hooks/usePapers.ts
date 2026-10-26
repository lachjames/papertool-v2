import { useState, useEffect, useCallback } from 'react';
import { PaperMetadata, NewPaperData } from '../types';
import {
    fetchPaperSummaries,
    createNewPaper,
    updateExistingPaper,
    deleteSinglePaper
} from '../services/paperService';
import { useApiContext } from '../context/ApiContext';
import { useAuth } from '../auth/AuthContext';
import { useArchive } from '../context/ArchiveContext';

const PAGE_SIZE = 20;

export const usePapers = (seriesId: string | null) => {
    const { apiConfig } = useApiContext();
    const { isAuthenticated } = useAuth();
    const { selectedArchiveId } = useArchive();
    const [paperIds, setPaperIds] = useState<string[]>([]);
    const [paperMetadata, setPaperMetadata] = useState<Record<string, PaperMetadata>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [totalPaperCount, setTotalPaperCount] = useState<number>(0);
    const [suggestedPaperNumber, setSuggestedPaperNumber] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetPaperState = useCallback(() => {
        setPaperIds([]);
        setPaperMetadata({});
        setHasMore(false);
        setTotalPaperCount(0);
        setSuggestedPaperNumber(null);
        setError(null);
    }, []);

    const applyPaperSummary = useCallback((summary: {
        papers: Array<{ paperId: string; metadata: PaperMetadata }>;
        total: number;
        hasMore: boolean;
        nextPaperNumber?: string;
    }, append: boolean) => {
        const nextIds = summary.papers.map(item => item.paperId);
        const nextMetadata = Object.fromEntries(summary.papers.map(item => [item.paperId, item.metadata]));

        if (append) {
            setPaperIds(prev => {
                const seen = new Set(prev);
                const additions = nextIds.filter(id => !seen.has(id));
                return [...prev, ...additions];
            });

            setPaperMetadata(prev => ({
                ...prev,
                ...nextMetadata
            }));
        } else {
            setPaperIds(nextIds);
            setPaperMetadata(nextMetadata);
        }

        setTotalPaperCount(summary.total);
        setHasMore(summary.hasMore);
        setSuggestedPaperNumber(summary.nextPaperNumber || null);
    }, []);

    const fetchPapers = useCallback(async (limit = PAGE_SIZE) => {
        if ((!apiConfig.key && !isAuthenticated) || !seriesId || !selectedArchiveId) return;

        try {
            setLoading(true);
            setError(null);

            const summary = await fetchPaperSummaries(apiConfig.key, selectedArchiveId, seriesId, {
                limit,
                offset: 0
            });

            applyPaperSummary(summary, false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch papers');
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, seriesId, applyPaperSummary]);

    const loadMorePapers = useCallback(async () => {
        if ((!apiConfig.key && !isAuthenticated) || !seriesId || !selectedArchiveId || !hasMore || loadingMore) return;

        try {
            setLoadingMore(true);
            setError(null);

            const summary = await fetchPaperSummaries(apiConfig.key, selectedArchiveId, seriesId, {
                limit: PAGE_SIZE,
                offset: paperIds.length
            });

            applyPaperSummary(summary, true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load more papers');
        } finally {
            setLoadingMore(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, seriesId, hasMore, loadingMore, paperIds.length, applyPaperSummary]);

    const createPaper = useCallback(async (
        paperData: NewPaperData,
        contentFile: File,
        coverPageFile?: File | null
    ) => {
        if ((!apiConfig.key && !isAuthenticated) || !seriesId || !selectedArchiveId) return;

        try {
            setLoading(true);
            setError(null);

            console.log('Creating paper with content file and cover page file:', {
                hasContentFile: !!contentFile,
                hasCoverPage: !!coverPageFile
            });

            const newPaperId = await createNewPaper(
                apiConfig.key,
                selectedArchiveId,
                seriesId,
                paperData,
                contentFile,
                coverPageFile
            );

            const refreshLimit = Math.max(PAGE_SIZE, paperIds.length || PAGE_SIZE);
            setTimeout(() => {
                void fetchPapers(refreshLimit);
            }, 1500);

            return newPaperId;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create paper');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, seriesId, paperIds.length, fetchPapers]);

    const updatePaper = useCallback(async (
        paperId: string,
        paperData: Partial<NewPaperData>,
        contentFile?: File | null,
        coverPageFile?: File | null
    ) => {
        if ((!apiConfig.key && !isAuthenticated) || !seriesId || !selectedArchiveId) return;

        try {
            setLoading(true);
            setError(null);

            console.log('Updating paper with data and files:', {
                paperId,
                hasContentFile: !!contentFile,
                hasCoverPage: !!coverPageFile,
                dataFields: Object.keys(paperData)
            });

            const updatedMetadata = await updateExistingPaper(
                apiConfig.key,
                selectedArchiveId,
                seriesId,
                paperId,
                paperData,
                contentFile,
                coverPageFile
            );

            setPaperMetadata(prev => ({
                ...prev,
                [paperId]: updatedMetadata
            }));

            const refreshLimit = Math.max(PAGE_SIZE, paperIds.length || PAGE_SIZE);
            setTimeout(() => {
                void fetchPapers(refreshLimit);
            }, 500);

            return updatedMetadata;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update paper');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, seriesId, paperIds.length, fetchPapers]);

    const deletePaper = useCallback(async (paperId: string) => {
        if ((!apiConfig.key && !isAuthenticated) || !seriesId || !selectedArchiveId) return;

        try {
            setLoading(true);
            setError(null);
            await deleteSinglePaper(apiConfig.key, selectedArchiveId, seriesId, paperId);
            const refreshLimit = Math.max(PAGE_SIZE, paperIds.length || PAGE_SIZE);
            await fetchPapers(refreshLimit);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete paper');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiConfig.key, isAuthenticated, selectedArchiveId, seriesId, paperIds.length, fetchPapers]);

    useEffect(() => {
        if (!seriesId || !selectedArchiveId || (!apiConfig.key && !isAuthenticated)) {
            resetPaperState();
            return;
        }

        void fetchPapers(PAGE_SIZE);
    }, [seriesId, selectedArchiveId, apiConfig.key, isAuthenticated, fetchPapers, resetPaperState]);

    return {
        paperIds,
        paperMetadata,
        totalPaperCount,
        suggestedPaperNumber,
        hasMore,
        loading,
        loadingMore,
        error,
        fetchPapers,
        loadMorePapers,
        createPaper,
        updatePaper,
        deletePaper,
    };
};
