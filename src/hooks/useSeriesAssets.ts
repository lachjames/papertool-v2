import { useState, useEffect } from 'react';
import { SeriesAssets, SeriesAsset, SeriesAssetType, getSeriesAssets } from '../services/assetService';
import { useArchive } from '../context/ArchiveContext';

export const useSeriesAssets = (seriesId: string | null) => {
    const { selectedArchiveId } = useArchive();
    const [assets, setAssets] = useState<SeriesAssets | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAssets = async () => {
        if (!seriesId || !selectedArchiveId) {
            setAssets(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const seriesAssets = await getSeriesAssets(selectedArchiveId, seriesId);
            setAssets(seriesAssets);
        } catch (err) {
            console.error('Error loading series assets:', err);
            setError(err instanceof Error ? err.message : 'Failed to load assets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAssets();
    }, [seriesId, selectedArchiveId]);

    const updateAsset = (type: SeriesAssetType, asset: SeriesAsset) => {
        setAssets(prev => prev ? {
            ...prev,
            [type]: asset
        } : null);
    };

    const removeAsset = (type: SeriesAssetType) => {
        setAssets(prev => {
            if (!prev) return null;
            const updated: SeriesAssets = { ...prev };
            delete updated[type];
            return updated;
        });
    };

    return {
        assets,
        loading,
        error,
        loadAssets,
        updateAsset,
        removeAsset
    };
};
