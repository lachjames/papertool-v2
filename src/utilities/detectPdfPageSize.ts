import { PDFDocument } from 'pdf-lib';

export interface PageSize {
    width: number;
    height: number;
    format?: string; // "A4", "Letter", etc.
}

/**
 * Detects the page size of a PDF file
 * @param file The PDF file to analyze
 * @param callback Callback function that receives the detected page size
 * @param defaultSize Default page size to use if detection fails
 */
export async function detectPdfPageSize(
    file: File,
    callback: (pageSize: PageSize) => void,
    defaultSize: PageSize = { width: 595, height: 842, format: 'A4' }
): Promise<void> {
    if (!file || file.type !== 'application/pdf') {
        callback(defaultSize);
        return;
    }

    try {
        // Read the file as an ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();

        // Determine if this is a standard page size
        let format: string | undefined;

        // Check for common page sizes with a small margin of error
        // A4: 595 × 842 points (210 × 297 mm)
        if (Math.abs(width - 595) < 5 && Math.abs(height - 842) < 5) {
            format = 'A4';
        }
        // US Letter: 612 × 792 points (8.5 × 11 inches)
        else if (Math.abs(width - 612) < 5 && Math.abs(height - 792) < 5) {
            format = 'Letter';
        }
        // A5: 420 × 595 points (148 × 210 mm)
        else if (Math.abs(width - 420) < 5 && Math.abs(height - 595) < 5) {
            format = 'A5';
        }
        // Legal: 612 × 1008 points (8.5 × 14 inches)
        else if (Math.abs(width - 612) < 5 && Math.abs(height - 1008) < 5) {
            format = 'Legal';
        }
        // Executive: 522 × 756 points (7.25 × 10.5 inches)
        else if (Math.abs(width - 522) < 5 && Math.abs(height - 756) < 5) {
            format = 'Executive';
        }
        // B5: 499 × 709 points (176 × 250 mm)
        else if (Math.abs(width - 499) < 5 && Math.abs(height - 709) < 5) {
            format = 'B5';
        }

        callback({ width, height, format });
    } catch (error) {
        console.error('Error detecting PDF page size:', error);
        // Return the default size
        callback(defaultSize);
    }
}

/**
 * Gets standard page size dimensions by format name
 * @param format Format name (e.g., "A4", "Letter")
 * @returns Page size object with width and height in points
 */
export function getStandardPageSize(format: string): PageSize {
    switch (format.toLowerCase()) {
        case 'a4':
            return { width: 595, height: 842, format: 'A4' };
        case 'letter':
            return { width: 612, height: 792, format: 'Letter' };
        case 'a5':
            return { width: 420, height: 595, format: 'A5' };
        case 'legal':
            return { width: 612, height: 1008, format: 'Legal' };
        case 'executive':
            return { width: 522, height: 756, format: 'Executive' };
        case 'b5':
            return { width: 499, height: 709, format: 'B5' };
        default:
            return { width: 595, height: 842, format: 'A4' }; // Default to A4
    }
}

/**
 * Checks if a page is in portrait orientation
 * @param pageSize Page size object
 * @returns true if portrait, false if landscape
 */
export function isPortrait(pageSize: PageSize): boolean {
    return pageSize.height > pageSize.width;
}

/**
 * Gets page size name as a human-readable string
 * @param pageSize Page size object
 * @returns String representation (e.g., "A4 (Portrait)")
 */
export function getPageSizeName(pageSize: PageSize): string {
    const orientation = isPortrait(pageSize) ? 'Portrait' : 'Landscape';

    if (pageSize.format) {
        return `${pageSize.format} (${orientation})`;
    }

    return `Custom ${Math.round(pageSize.width)} × ${Math.round(pageSize.height)} points (${orientation})`;
}
