// Utility function to sanitize text for PDF rendering
// Replaces Unicode characters that can't be encoded in WinAnsi with ASCII equivalents
export const sanitizeText = (text: string): string => {
    if (!text) return '';

    return text
        // Replace Unicode hyphens with ASCII hyphen
        .replace(/[\u2010-\u2015]/g, '-')
        // Replace curly quotes with straight quotes
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        // Replace other problematic characters
        .replace(/[\u2022]/g, '*') // bullet
        .replace(/[\u2026]/g, '...') // ellipsis
        .replace(/[\u2013\u2014]/g, '-') // en-dash, em-dash
        .replace(/[\u00A0]/g, ' ') // non-breaking space
        .replace(/[\u00AD]/g, '-'); // soft hyphen
};
