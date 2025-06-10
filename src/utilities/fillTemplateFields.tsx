import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { drawJustifiedText } from './justifiedText';
import { sanitizeText } from './sanitizeText';

export interface TemplateField {
    id: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    fontName?: string;
    bold?: boolean;
    italic?: boolean;
    justified?: boolean;
    maxLines?: number;
    align?: 'left' | 'center' | 'right';
    color?: [number, number, number];
}

/**
 * Fills a PDF template with data based on field definitions
 * @param templatePdfBase64 Base64-encoded PDF template
 * @param fields Map of field definitions
 * @param values Data to insert into the template
 * @returns Uint8Array of the filled PDF
 */
export async function fillPdfTemplate(
    templatePdfBase64: string,
    fields: Record<string, TemplateField>,
    values: Record<string, string | string[]>
): Promise<Uint8Array> {
    // Convert base64 to Uint8Array
    const pdfBytes = base64ToUint8Array(templatePdfBase64);

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the first page (cover page)
    const page = pdfDoc.getPage(0);

    // Set page dimensions
    const { width, height } = page.getSize();

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    // Process each field
    for (const [fieldId, field] of Object.entries(fields)) {
        const value = values[fieldId];
        if (!value) continue; // Skip empty fields

        // Determine which font to use
        let fieldFont = font;
        if (field.bold && !field.italic) fieldFont = boldFont;
        if (field.italic && !field.bold) fieldFont = italicFont;

        // Get field color (default to black)
        const color = field.color || [0, 0, 0];

        // Convert value to string
        let textValue: string;
        if (Array.isArray(value)) {
            textValue = value.join(', ');
        } else {
            textValue = value;
        }

        // Sanitize text
        const sanitizedText = sanitizeText(textValue);

        // Calculate text position based on alignment
        let xPos = field.x;

        // For simple single-line fields
        if (!field.justified && field.maxLines === 1 || !field.maxLines) {
            if (field.align === 'center') {
                const textWidth = fieldFont.widthOfTextAtSize(sanitizedText, field.fontSize);
                xPos = field.x + (field.width - textWidth) / 2;
            } else if (field.align === 'right') {
                const textWidth = fieldFont.widthOfTextAtSize(sanitizedText, field.fontSize);
                xPos = field.x + field.width - textWidth;
            }

            // Draw text
            page.drawText(sanitizedText, {
                x: xPos,
                y: height - field.y, // Convert from top-down to bottom-up coordinate system
                size: field.fontSize,
                font: fieldFont,
                color: rgb(color[0], color[1], color[2]),
                maxWidth: field.width
            });
        } else {
            // For multi-line justified text
            drawJustifiedText(page, sanitizedText, {
                x: field.x,
                y: height - field.y, // Convert from top-down to bottom-up coordinate system
                font: fieldFont,
                fontSize: field.fontSize,
                color: color,
                maxWidth: field.width,
                lineHeight: field.fontSize * 1.2,
                justify: field.justified || false,
                maxLines: field.maxLines || 999
            });
        }
    }

    // Serialize the PDFDocument to bytes
    return await pdfDoc.save();
}

/**
 * Converts base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
}

/**
 * Creates a preview of a template with sample data
 */
export async function createTemplatePreview(
    templatePdfBase64: string,
    fields: Record<string, TemplateField>
): Promise<Uint8Array> {
    // Generate sample data for preview
    const sampleData: Record<string, string> = {
        title: "Sample Paper Title for Preview",
        authors: "John Doe, Jane Smith",
        abstract: "This is a sample abstract for the preview. It demonstrates how the abstract will appear in the final cover page with typical formatting and layout. The text will wrap according to the settings specified in the template.",
        date: new Date().toLocaleDateString(),
        institution: "Sample University",
        seriesName: "Working Paper Series",
        keywords: "Sample, Preview, Economics",
        jel: "A10, B20, C30"
    };

    // Fill template with sample data
    return await fillPdfTemplate(templatePdfBase64, fields, sampleData);
}
