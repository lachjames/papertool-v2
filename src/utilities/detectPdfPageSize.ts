import { PDFDocument } from 'pdf-lib';
import {
    PageSize,
    CustomPageSize,
    StandardPageSize,
    resolvePageSize
} from '../shared-pdf-types';

/**
 * Detects the page size of a PDF file using shared types
 * @param file The PDF file to analyze
 * @param callback Callback function that receives the detected page size
 * @param defaultSize Default page size to use if detection fails
 */
export async function detectPdfPageSize(
    file: File,
    callback: (pageSize: PageSize) => void,
    defaultSize: PageSize = 'a4'
): Promise<void> {
    if (!file || file.type !== 'application/pdf') {
        callback(defaultSize);
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();

        // Convert points to inches for comparison
        const widthInches = width / 72;
        const heightInches = height / 72;
        const tolerance = 0.1;

        // Check for standard sizes using shared constants
        if (Math.abs(widthInches - 8.5) < tolerance && Math.abs(heightInches - 11) < tolerance) {
            callback('letter');
        } else if (Math.abs(widthInches - 8.27) < tolerance && Math.abs(heightInches - 11.69) < tolerance) {
            callback('a4');
        } else if (Math.abs(widthInches - 6) < tolerance && Math.abs(heightInches - 4) < tolerance) {
            callback('small');
        } else {
            // Return custom size using shared format
            const customSize: CustomPageSize = {
                width: `${widthInches.toFixed(2)}in`,
                height: `${heightInches.toFixed(2)}in`
            };
            callback(customSize);
        }
    } catch (error) {
        console.error('Error detecting PDF page size:', error);
        callback(defaultSize);
    }
}

/**
 * Gets standard page size by format name
 * @param format Format name (e.g., "a4", "letter", "small")
 * @returns Standard page size
 */
export function getStandardPageSize(format: string): StandardPageSize {
    const normalizedFormat = format.toLowerCase();
    if (normalizedFormat === 'a4' || normalizedFormat === 'letter' || normalizedFormat === 'small') {
        return normalizedFormat as StandardPageSize;
    }
    return 'a4'; // Default to A4
}

/**
 * Checks if a page is in portrait orientation
 * @param pageSize Page size object
 * @returns true if portrait, false if landscape
 */
export function isPortrait(pageSize: PageSize): boolean {
    const resolved = resolvePageSize(pageSize);
    if (!resolved) return true; // Default to portrait
    
    const widthNum = parseFloat(resolved.width);
    const heightNum = parseFloat(resolved.height);
    return heightNum > widthNum;
}

/**
 * Gets page size name as a human-readable string
 * @param pageSize Page size object
 * @returns String representation (e.g., "A4 (Portrait)")
 */
export function getPageSizeName(pageSize: PageSize): string {
    const orientation = isPortrait(pageSize) ? 'Portrait' : 'Landscape';

    if (typeof pageSize === 'string') {
        return `${pageSize.toUpperCase()} (${orientation})`;
    }

    return `Custom ${pageSize.width} × ${pageSize.height} (${orientation})`;
}

/**
 * Convert PageSize to points for legacy template functions
 * @param pageSize Shared PageSize type
 * @returns Object with width and height in points
 */
export function pageToPoints(pageSize: PageSize): { width: number; height: number } {
    const resolved = resolvePageSize(pageSize);
    if (!resolved) {
        // Fallback to A4
        return { width: 595, height: 842 };
    }
    
    // Convert from inches to points (72 points = 1 inch)
    const widthPoints = parseFloat(resolved.width) * 72;
    const heightPoints = parseFloat(resolved.height) * 72;
    
    return { width: widthPoints, height: heightPoints };
}
