import { PageSize as AppPageSize } from '../types';
import { PageSize as ReactPdfPageSize } from '@react-pdf/types';

/**
 * Converts application PageSize to React-PDF's PageSize type
 * 
 * @param pageSize The PageSize object from the application
 * @returns A valid React-PDF PageSize value
 */
export function toReactPdfPageSize(pageSize: AppPageSize): ReactPdfPageSize {
    // Handle predefined formats directly
    if (pageSize.format) {
        const format = pageSize.format.toUpperCase();

        // Match to React-PDF's expected format strings
        switch (format) {
            case 'A4': return 'A4';
            case 'A3': return 'A3';
            case 'A5': return 'A5';
            case 'LETTER': return 'LETTER';
            case 'LEGAL': return 'LEGAL';
            case 'TABLOID': return 'TABLOID';
            case 'EXECUTIVE': return 'EXECUTIVE';
            case 'B5': return 'B5';
            // For unknown formats, we'll fall through to using dimensions
        }
    }

    // For custom sizes or unknown formats, use dimensions array
    // Must cast to ReactPdfPageSize to satisfy TypeScript
    return [pageSize.width, pageSize.height] as ReactPdfPageSize;
}

/**
 * Determines if the page is in portrait orientation
 */
export function isPortrait(pageSize: AppPageSize): boolean {
    return pageSize.height > pageSize.width;
}

/**
 * Gets orientation string for React-PDF
 */
export function getOrientation(pageSize: AppPageSize): 'portrait' | 'landscape' {
    return isPortrait(pageSize) ? 'portrait' : 'landscape';
}
