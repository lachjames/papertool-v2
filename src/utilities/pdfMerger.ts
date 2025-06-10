import { PDFDocument } from 'pdf-lib';
import { convertHtmlToPdf } from './html2pdf';
import { populateTemplate } from './templateManager';
import { addDefaultStyles } from './templateParser';
import { PageSize } from '../types';

/**
 * Creates a cover page PDF from HTML template and paper data
 * @param htmlTemplate The HTML template to use
 * @param paperData The paper data to populate the template with
 * @param pageSize The page size dimensions
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
        };
    },
    pageSize: PageSize
): Promise<Uint8Array> {
    try {
        // Debug log basic info
        console.log('Creating cover page PDF with:', {
            templateLength: htmlTemplate.length,
            paperTitle: paperData.title,
            pageSize: `${pageSize.width}x${pageSize.height} (${pageSize.format || 'custom'})`
        });

        // Convert comma-separated strings to arrays where needed
        const authorArray = paperData.authors.split(',').map(author => author.trim()).filter(author => author);
        const keywordsArray = paperData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const jelArray = paperData.jel?.split(',').map(j => j.trim()).filter(j => j.length > 0) ?? [];

        // Prepare template data
        const templateData = {
            title: paperData.title,
            authors: paperData.authors,
            abstract: paperData.abstract,
            institution: seriesSettings.institution || '',
            affiliation: '',
            date: new Date().toLocaleDateString(),
            seriesName: seriesSettings.name || '',
            keywords: keywordsArray.join(', '),
            jel: jelArray.join(', '),
            headerText: seriesSettings.coverPageSettings?.headerText || 'Working Paper',

            // Display flags for conditional rendering
            abstractDisplay: paperData.abstract ? 'block' : 'none',
            jelDisplay: jelArray.length ? 'block' : 'none',
            keywordsDisplay: keywordsArray.length ? 'block' : 'none',
            institutionDisplay: seriesSettings.institution ? 'block' : 'none',
            seriesNameDisplay: seriesSettings.name ? 'block' : 'none',
            dateDisplay: 'block',
            affiliationDisplay: 'none',

            // Page size information
            pageWidth: pageSize.width,
            pageHeight: pageSize.height
        };

        // Apply page size to the template
        const htmlWithStyles = addDefaultStyles(htmlTemplate, pageSize);

        // Generate the HTML with data
        const filledHtml = populateTemplate(htmlWithStyles, templateData);
        
        // For debugging: check if there's actual content in the body
        if (!filledHtml.includes('<body') || filledHtml.includes('<body></body>')) {
            console.error('Warning: Possibly empty HTML body for PDF conversion');
        }

        // Convert to PDF using our direct approach
        return await convertHtmlToPdf(filledHtml, pageSize);
    } catch (error) {
        console.error('Error creating cover page PDF:', error);
        throw new Error('Failed to create cover page PDF');
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
 * Process the PDF with cover page
 * @param file Original PDF file
 * @param htmlTemplate Cover page HTML template
 * @param paperData Paper metadata
 * @param seriesSettings Series settings
 * @param pageSize Detected page size
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
        };
    },
    pageSize: PageSize
): Promise<File> {
    console.log('Processing PDF to add cover page:', file.name);
    
    // Generate the cover page PDF
    const coverPagePdf = await createCoverPagePdf(
        htmlTemplate,
        paperData,
        seriesSettings,
        pageSize
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
