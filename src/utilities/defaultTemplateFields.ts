import { TemplateField } from './fillTemplateFields';

// A4 size template field positions (595 x 842 points)
export const DEFAULT_A4_TEMPLATE_FIELDS: Record<string, TemplateField> = {
    title: {
        id: 'title',
        x: 72,
        y: 200,
        width: 451,
        fontSize: 16,
        bold: true,
        justified: false,
        align: 'center'
    },
    authors: {
        id: 'authors',
        x: 72,
        y: 240,
        width: 451,
        fontSize: 12,
        italic: true,
        align: 'center'
    },
    institution: {
        id: 'institution',
        x: 72,
        y: 270,
        width: 451,
        fontSize: 12,
        align: 'center'
    },
    seriesName: {
        id: 'seriesName',
        x: 72,
        y: 100,
        width: 451,
        fontSize: 10
    },
    date: {
        id: 'date',
        x: 72,
        y: 300,
        width: 451,
        fontSize: 10,
        align: 'right'
    },
    abstract: {
        id: 'abstract',
        x: 72,
        y: 350,
        width: 451,
        fontSize: 10,
        justified: true,
        maxLines: 15
    },
    keywords: {
        id: 'keywords',
        x: 72,
        y: 500,
        width: 451,
        fontSize: 10
    },
    jel: {
        id: 'jel',
        x: 72,
        y: 520,
        width: 451,
        fontSize: 10
    }
};

// US Letter size template field positions (612 x 792 points)
export const DEFAULT_LETTER_TEMPLATE_FIELDS: Record<string, TemplateField> = {
    title: {
        id: 'title',
        x: 72,
        y: 180,
        width: 468,
        fontSize: 16,
        bold: true,
        justified: false,
        align: 'center'
    },
    authors: {
        id: 'authors',
        x: 72,
        y: 220,
        width: 468,
        fontSize: 12,
        italic: true,
        align: 'center'
    },
    institution: {
        id: 'institution',
        x: 72,
        y: 250,
        width: 468,
        fontSize: 12,
        align: 'center'
    },
    seriesName: {
        id: 'seriesName',
        x: 72,
        y: 100,
        width: 468,
        fontSize: 10
    },
    date: {
        id: 'date',
        x: 72,
        y: 270,
        width: 468,
        fontSize: 10,
        align: 'right'
    },
    abstract: {
        id: 'abstract',
        x: 72,
        y: 320,
        width: 468,
        fontSize: 10,
        justified: true,
        maxLines: 15
    },
    keywords: {
        id: 'keywords',
        x: 72,
        y: 480,
        width: 468,
        fontSize: 10
    },
    jel: {
        id: 'jel',
        x: 72,
        y: 500,
        width: 468,
        fontSize: 10
    }
};

/**
 * Get default template fields based on page dimensions
 */
export function getDefaultTemplateFields(width: number, height: number): Record<string, TemplateField> {
    // If it's close to A4 size
    if (Math.abs(width - 595) < 10 && Math.abs(height - 842) < 10) {
        return DEFAULT_A4_TEMPLATE_FIELDS;
    }

    // Default to US Letter
    return DEFAULT_LETTER_TEMPLATE_FIELDS;
}
