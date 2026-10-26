import { apiPost, apiGet, apiDelete } from './api';

export type SeriesAssetType = 'logo' | 'header' | 'footer' | 'background';

export interface SeriesAsset {
    type: SeriesAssetType;
    filename: string;
    url: string;
    uploadedAt: string;
    size: number;
    contentType: string;
}

export interface SeriesAssets {
    seriesId: string;
    logo?: SeriesAsset;
    header?: SeriesAsset;
    footer?: SeriesAsset;
    background?: SeriesAsset;
}

/**
 * Upload an asset for a series
 */
export const uploadAsset = async (
    archiveId: string,
    seriesId: string,
    type: SeriesAssetType,
    file: File
): Promise<SeriesAsset> => {
    const formData = new FormData();
    formData.append('asset', file);

    const response = await apiPost<SeriesAsset, FormData>(
        `archives/${archiveId}/series/${seriesId}/assets/${type}`,
        formData,
        undefined,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
};

/**
 * Get all assets for a series
 */
export const getSeriesAssets = async (
    archiveId: string,
    seriesId: string
): Promise<SeriesAssets> => {
    const response = await apiGet<SeriesAssets>(`archives/${archiveId}/series/${seriesId}/assets`);
    return response.data;
};

/**
 * Delete an asset
 */
export const deleteAsset = async (
    archiveId: string,
    seriesId: string,
    type: SeriesAssetType
): Promise<void> => {
    await apiDelete(`archives/${archiveId}/series/${seriesId}/assets/${type}`);
};

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'Only image files are allowed' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { valid: false, error: 'File size must be less than 10MB' };
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Supported formats: JPEG, PNG, GIF, WebP, SVG' };
    }

    return { valid: true };
};