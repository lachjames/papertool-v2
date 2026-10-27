import { PDFDocument } from 'pdf-lib';
import { processTemplate, TemplateData, TemplateSettings } from './templateManager';
import { addDefaultStyles } from './templateParser';
import { SeriesAssets } from '../services/assetService';
import { apiPost } from '../services/api';
import { pageToPoints } from './detectPdfPageSize';
import {
    PdfGenerationRequest,
    PageSize,
    resolvePageSize
} from '../shared-pdf-types';

/**
 * Creates a cover page PDF from HTML template and paper data using server-side generation
 * @param htmlTemplate The HTML template to use
 * @param paperData The paper data to populate the template with
 * @param seriesSettings The series settings including template configuration
 * @param pageSize The page size (shared PageSize type)
 * @param assets The series assets (logos, footer images)
 * @returns A Uint8Array containing the PDF data
 */
export async function createCoverPagePdf(
    htmlTemplate: string,
    paperData: {
        title: string;
        authors: string;
        abstract: string;
        keywords: string;
        jel?: string;
    },
    seriesSettings: {
        name: string;
        institution: string;
        coverPageSettings?: {
            headerText?: string;
            includeAbstract?: boolean;
            includeJEL?: boolean;
            includeKeywords?: boolean;
            includeInstitution?: boolean;
            includeSeriesName?: boolean;
            includeDate?: boolean;
        };
    },
    pageSize: PageSize,
    assets?: SeriesAssets | null
): Promise<Uint8Array> {
    try {
        // Debug log basic info
        const resolved = resolvePageSize(pageSize);
        console.log('Creating cover page PDF with server-side generation:', {
            templateLength: htmlTemplate.length,
            paperTitle: paperData.title,
            pageSize: typeof pageSize === 'string' ? pageSize : `${pageSize.width} x ${pageSize.height}`,
            resolvedSize: resolved,
            hasAssets: !!assets,
            logoUrl: assets?.logo?.url,
            footerImageUrl: assets?.footer?.url
        });

        // Convert comma-separated strings to arrays where needed
        const keywordsArray = paperData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const jelArray = paperData.jel?.split(',').map(j => j.trim()).filter(j => j.length > 0) ?? [];

        // Prepare template data using the series template system format
        const templateData: TemplateData = {
            title: paperData.title,
            authors: paperData.authors,
            abstract: paperData.abstract,
            institution: seriesSettings.institution || '',
            seriesName: seriesSettings.name || '',
            date: new Date().toLocaleDateString(),
            keywords: keywordsArray.join(', '),
            jel: jelArray.join(', '),
            headerText: seriesSettings.coverPageSettings?.headerText || 'Working Paper',
            affiliation: '' // Optional field
        };

        // Prepare template settings from series configuration
        const templateSettings: TemplateSettings = {
            includeAbstract: seriesSettings.coverPageSettings?.includeAbstract ?? true,
            includeJEL: seriesSettings.coverPageSettings?.includeJEL ?? true,
            includeKeywords: seriesSettings.coverPageSettings?.includeKeywords ?? true,
            includeInstitution: seriesSettings.coverPageSettings?.includeInstitution ?? true,
            includeSeriesName: seriesSettings.coverPageSettings?.includeSeriesName ?? true,
            includeDate: seriesSettings.coverPageSettings?.includeDate ?? true
        };

        // Convert shared PageSize to points for legacy template functions
        const pageSizePoints = pageToPoints(pageSize);
        const htmlWithStyles = addDefaultStyles(htmlTemplate, pageSizePoints);

        // Generate the HTML with data using the series template system
        const filledHtml = processTemplate(htmlWithStyles, templateData, assets, templateSettings);

        // For debugging: check if there's actual content in the body
        if (!filledHtml.includes('<body') || filledHtml.includes('<body></body>')) {
            console.error('Warning: Possibly empty HTML body for PDF conversion');
        }

        console.log('Using server-side PDF generation with size:', pageSize);

        // Create standardized request using shared types
        const request: PdfGenerationRequest = {
            html: filledHtml,
            size: pageSize,
            options: {
                printBackground: true,
                preferCSSPageSize: true,
                scale: 1,
                margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            }
        };

        // UPDATED: Use new server endpoint instead of Lambda
        const response = await apiPost<ArrayBuffer>('generate-pdf', request, undefined, {
            responseType: 'arraybuffer'
        });

        // Check response type to handle both PDF and JSON error responses
        const contentType = response.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
            // Error response - convert ArrayBuffer back to JSON
            const errorText = new TextDecoder().decode(response.data);
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || errorData.error || 'PDF generation failed');
        }

        if (response.status !== 200) {
            throw new Error(`Server-side PDF generation failed: ${response.status}`);
        }

        const pdfBytes = new Uint8Array(response.data);

        console.log(`Server-side PDF generation successful, size: ${pdfBytes.length} bytes`);
        return pdfBytes;

    } catch (error) {
        console.error('Error creating cover page PDF:', error);
        throw new Error(`Failed to create cover page PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Merges a cover page PDF with a content PDF
 * @param coverPagePdf The cover page PDF as Uint8Array
 * @param contentPdf The content PDF as Uint8Array or File
 * @returns A Promise resolving to a merged PDF as Uint8Array
 */
export async function mergePdfs(coverPagePdf: Uint8Array, contentPdf: Uint8Array | File): Promise<Uint8Array> {
    try {
        // Log the PDF sizes for debugging
        console.log('Merging PDFs:', {
            coverPagePdfSize: coverPagePdf.length,
            contentPdfType: contentPdf instanceof File ? 'File' : 'Uint8Array'
        });

        // Load cover page PDF
        const coverPageDoc = await PDFDocument.load(coverPagePdf);

        console.log(`Cover page document has ${coverPageDoc.getPageCount()} pages`);

        // If contentPdf is a File, convert it to Uint8Array
        let contentPdfBytes: Uint8Array;
        if (contentPdf instanceof File) {
            const buffer = await contentPdf.arrayBuffer();
            contentPdfBytes = new Uint8Array(buffer);
        } else {
            contentPdfBytes = contentPdf;
        }

        // Load content PDF
        const contentPdfDoc = await PDFDocument.load(contentPdfBytes);
        console.log(`Content PDF document has ${contentPdfDoc.getPageCount()} pages`);

        // Create a new document for the merged PDF
        const mergedPdf = await PDFDocument.create();

        // Copy only the first page from cover page PDF (even if there are more)
        if (coverPageDoc.getPageCount() > 0) {
            const [firstCoverPage] = await mergedPdf.copyPages(coverPageDoc, [0]);
            mergedPdf.addPage(firstCoverPage);
        }

        // Copy pages from content PDF
        const contentPageIndices = [...Array(contentPdfDoc.getPageCount())].map((_, i) => i);
        const copiedContentPages = await mergedPdf.copyPages(contentPdfDoc, contentPageIndices);
        copiedContentPages.forEach(page => mergedPdf.addPage(page));

        console.log('PDF merge successful. Created document with',
            mergedPdf.getPageCount(), 'pages');

        // Save and return the merged PDF
        return await mergedPdf.save();
    } catch (error) {
        console.error('Error merging PDFs:', error);
        throw new Error('Failed to merge PDFs');
    }
}

/**
 * Creates a File object from a Uint8Array
 * @param pdfBytes The PDF bytes
 * @param fileName The file name
 * @returns A File object
 */
export function createFileFromPdfBytes(pdfBytes: Uint8Array, fileName: string): File {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return new File([blob], fileName, { type: 'application/pdf' });
}

/**
 * Process the PDF with cover page using server-side generation
 * @param file Original PDF file
 * @param htmlTemplate Cover page HTML template from series
 * @param paperData Paper metadata
 * @param seriesSettings Series settings including template configuration
 * @param pageSize Detected page size (shared PageSize type)
 * @param assets Series assets (logos, footer images)
 * @returns Promise resolving to a new File with cover page
 */
export async function processPdfWithCoverPage(
    file: File,
    htmlTemplate: string,
    paperData: {
        title: string;
        authors: string;
        abstract: string;
        keywords: string;
        jel?: string;
    },
    seriesSettings: {
        name: string;
        institution: string;
        coverPageSettings?: {
            headerText?: string;
            includeAbstract?: boolean;
            includeJEL?: boolean;
            includeKeywords?: boolean;
            includeInstitution?: boolean;
            includeSeriesName?: boolean;
            includeDate?: boolean;
        };
    },
    pageSize: PageSize,
    assets?: SeriesAssets | null
): Promise<File> {
    console.log('Processing PDF to add cover page using server-side generation:', file.name);

    // Generate the cover page PDF using server-side generation
    const coverPagePdf = await createCoverPagePdf(
        htmlTemplate,
        paperData,
        seriesSettings,
        pageSize,
        assets
    );

    // Verify we got valid PDF data
    if (!coverPagePdf || coverPagePdf.length === 0) {
        console.error('Cover page generation failed - empty PDF data');
        throw new Error('Failed to generate cover page');
    }

    // Merge the cover page with the content PDF
    const mergedPdfBytes = await mergePdfs(coverPagePdf, file);

    // Create a new File object from the merged PDF
    const fileName = file.name.replace(/\.pdf$/i, '_with_cover.pdf');
    return createFileFromPdfBytes(mergedPdfBytes, fileName);
}
