import { processTemplate, TemplateData, TemplateSettings } from './templateManager';
import { addDefaultStyles } from './templateParser';
import { getTemplateByType } from './templates';
import { SeriesAssets } from '../services/assetService';
import { apiPost } from '../services/api';
import { pageToPoints } from './detectPdfPageSize';
import {
    PageSize,
    PdfOptions,
    PdfGenerationRequest
} from '../shared-pdf-types';

/**
 * Generate a cover page PDF using the series template system with server-side backend
 * @param paperData Paper metadata
 * @param seriesSettings Series configuration including template settings
 * @param pageSize Page size for the PDF (shared PageSize type)
 * @param assets Series assets (logos, footer images)
 * @param pdfOptions Additional PDF generation options (shared PdfOptions type)
 * @returns Promise resolving to a File containing the cover page PDF
 */
export async function generateCoverPageFromSeriesTemplate(
    paperData: {
        title: string;
        authors: string;
        abstract: string;
        keywords: string;
        jel?: string;
        publicationDate?: string;
        paperNumber?: string;
        link?: string;
    },
    seriesSettings: {
        name: string;
        institution: string;
        link?: string;
        coverPageSettings?: {
            templateId?: string;
            htmlTemplate?: string;
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
    assets?: SeriesAssets | null,
    pdfOptions?: PdfOptions
): Promise<File> {
    // Get the HTML template from series settings or use default
    const htmlTemplate = seriesSettings.coverPageSettings?.htmlTemplate ||
        getTemplateByType(seriesSettings.coverPageSettings?.templateId || 'academic');

    // Prepare template data
    const keywordsArray = paperData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const jelArray = paperData.jel?.split(',').map(j => j.trim()).filter(j => j.length > 0) ?? [];
    const publicationDateSource = paperData.publicationDate
        ? new Date(paperData.publicationDate)
        : new Date();

    const templateData: TemplateData = {
        title: paperData.title,
        authors: paperData.authors,
        abstract: paperData.abstract,
        institution: seriesSettings.institution || '',
        seriesName: seriesSettings.name || '',
        date: publicationDateSource.toLocaleDateString(),
        year: `${publicationDateSource.getFullYear()}`,
        keywords: keywordsArray.join(', '),
        jel: jelArray.join(', '),
        paperNumber: paperData.paperNumber || '',
        link: paperData.link || seriesSettings.link || '',
        headerText: seriesSettings.coverPageSettings?.headerText || 'Working Paper',
        affiliation: ''
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
    const filledHtml = processTemplate(htmlWithStyles, templateData, assets || null, templateSettings);

    console.log('Generated HTML for cover page using series template system:', {
        templateLength: htmlTemplate.length,
        filledHtmlLength: filledHtml.length,
        hasAssets: !!assets,
        logoUrl: assets?.logo?.url,
        footerImageUrl: assets?.footer?.url,
        templateSettings,
        pdfOptions
    });

    // Default options using shared types
    const defaultOptions: PdfOptions = {
        printBackground: true,
        preferCSSPageSize: true,
        scale: 1,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    };

    const finalOptions = { ...defaultOptions, ...pdfOptions };

    try {
        console.log('Using server-side PDF generation with size:', pageSize);

        // Create standardized request using shared types
        const request: PdfGenerationRequest = {
            html: filledHtml,
            size: pageSize,
            options: finalOptions
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

        // Create file from PDF bytes
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        return new File([blob], 'cover-page.pdf', { type: 'application/pdf' });

    } catch (error) {
        console.error('Server-side PDF generation failed:', error);
        throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Generate a cover page PDF with custom margins and advanced options
 * @param paperData Paper metadata
 * @param seriesSettings Series configuration
 * @param pageSize Page size for the PDF (shared PageSize type)
 * @param assets Series assets
 * @param customOptions Custom PDF generation options
 * @returns Promise resolving to a File containing the cover page PDF
 */
export async function generateCoverPageWithCustomOptions(
    paperData: {
        title: string;
        authors: string;
        abstract: string;
        keywords: string;
        jel?: string;
        publicationDate?: string;
    },
    seriesSettings: {
        name: string;
        institution: string;
        coverPageSettings?: {
            templateId?: string;
            htmlTemplate?: string;
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
    assets?: SeriesAssets | null,
    customOptions?: {
        margin?: {
            top?: string | number;
            right?: string | number;
            bottom?: string | number;
            left?: string | number;
        };
        headerFooter?: {
            displayHeaderFooter?: boolean;
            headerTemplate?: string;
            footerTemplate?: string;
        };
        scale?: number;
        landscape?: boolean;
    }
): Promise<File> {
    const pdfOptions: PdfOptions = {
        printBackground: true,
        preferCSSPageSize: true,
        scale: customOptions?.scale || 1,
        landscape: customOptions?.landscape || false,
        margin: customOptions?.margin || {
            top: '1in',
            right: '1in',
            bottom: '1in',
            left: '1in'
        },
        displayHeaderFooter: customOptions?.headerFooter?.displayHeaderFooter || false,
        headerTemplate: customOptions?.headerFooter?.headerTemplate || '',
        footerTemplate: customOptions?.headerFooter?.footerTemplate || ''
    };

    return generateCoverPageFromSeriesTemplate(
        paperData,
        seriesSettings,
        pageSize,
        assets,
        pdfOptions
    );
}

/**
 * Generate a preview HTML using the series template system
 * @param paperData Paper metadata
 * @param seriesSettings Series configuration including template settings
 * @param assets Series assets (logos, footer images)
 * @returns HTML string for preview
 */
export function generateCoverPagePreviewFromSeriesTemplate(
    paperData: {
        title: string;
        authors: string;
        abstract: string;
        keywords: string;
        jel?: string;
        publicationDate?: string;
        paperNumber?: string;
        link?: string;
    },
    seriesSettings: {
        name: string;
        institution: string;
        link?: string;
        coverPageSettings?: {
            templateId?: string;
            htmlTemplate?: string;
            headerText?: string;
            includeAbstract?: boolean;
            includeJEL?: boolean;
            includeKeywords?: boolean;
            includeInstitution?: boolean;
            includeSeriesName?: boolean;
            includeDate?: boolean;
        };
    },
    assets?: SeriesAssets | null
): string {
    // Get the HTML template from series settings or use default
    const htmlTemplate = seriesSettings.coverPageSettings?.htmlTemplate ||
        getTemplateByType(seriesSettings.coverPageSettings?.templateId || 'academic');

    // Prepare template data
    const keywordsArray = paperData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const jelArray = paperData.jel?.split(',').map(j => j.trim()).filter(j => j.length > 0) ?? [];
    const publicationDateSource = paperData.publicationDate
        ? new Date(paperData.publicationDate)
        : new Date();

    const templateData: TemplateData = {
        title: paperData.title || 'Sample Paper Title',
        authors: paperData.authors || 'Sample Author',
        abstract: paperData.abstract || 'This is a sample abstract for preview purposes.',
        institution: seriesSettings.institution || '',
        seriesName: seriesSettings.name || '',
        date: publicationDateSource.toLocaleDateString(),
        year: `${publicationDateSource.getFullYear()}`,
        keywords: keywordsArray.join(', ') || 'sample, keywords',
        jel: jelArray.join(', ') || 'C10, E20',
        paperNumber: paperData.paperNumber || '2025-01',
        link: paperData.link || seriesSettings.link || 'https://example.edu/department/working-papers',
        headerText: seriesSettings.coverPageSettings?.headerText || 'Working Paper',
        affiliation: ''
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

    // Generate the HTML with data using the series template system
    return processTemplate(htmlTemplate, templateData, assets || null, templateSettings);
}

/**
 * Validate that series settings are sufficient for cover page generation
 * @param seriesSettings Series configuration
 * @returns Object with validation result and error message if invalid
 */
export function validateSeriesSettingsForCoverPage(
    seriesSettings?: {
        name: string;
        institution: string;
        coverPageSettings?: {
            templateId?: string;
            htmlTemplate?: string;
        };
    }
): { valid: boolean; error?: string } {
    if (!seriesSettings) {
        return { valid: false, error: 'Series settings are required' };
    }

    if (!seriesSettings.name) {
        return { valid: false, error: 'Series name is required' };
    }

    if (!seriesSettings.institution) {
        return { valid: false, error: 'Series institution is required' };
    }

    // Check if we have either a template ID or HTML template
    const hasTemplate = seriesSettings.coverPageSettings?.templateId ||
        seriesSettings.coverPageSettings?.htmlTemplate;

    if (!hasTemplate) {
        // This is okay, we'll use the default template
        console.log('No specific template configured, will use default academic template');
    }

    return { valid: true };
}
