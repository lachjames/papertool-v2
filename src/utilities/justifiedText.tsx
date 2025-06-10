import { PDFFont, PDFPage, rgb } from 'pdf-lib';

/**
 * Wraps and optionally justifies text with pdf-lib
 * @param text The text to wrap
 * @param font The PDFFont to use
 * @param fontSize The font size
 * @param maxWidth The maximum width in points
 * @param justify Whether to justify the text (except last line of paragraphs)
 */
export function wrapAndJustifyText(
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number,
    justify: boolean = false
): {
    lines: string[];
    wordPositions: Array<{ lineIndex: number; word: string; x: number }>;
} {
    if (!text) return { lines: [], wordPositions: [] };

    const words = text.split(' ');
    const lines: string[] = [];
    const wordLines: string[][] = [];
    let currentLine: string[] = [];
    let currentWidth = 0;
    const wordPositions: Array<{ lineIndex: number; word: string; x: number }> = [];

    // First pass: determine line breaks
    for (const word of words) {
        const wordWidth = font.widthOfTextAtSize(word, fontSize);
        const spaceWidth = font.widthOfTextAtSize(' ', fontSize);

        // Check if adding this word would exceed the max width
        const newWidth = currentWidth + (currentLine.length > 0 ? spaceWidth : 0) + wordWidth;

        if (currentLine.length > 0 && newWidth > maxWidth) {
            // Start a new line
            wordLines.push([...currentLine]);
            lines.push(currentLine.join(' '));
            currentLine = [word];
            currentWidth = wordWidth;
        } else {
            // Add to current line
            currentLine.push(word);
            currentWidth = newWidth;
        }
    }

    // Add the last line
    if (currentLine.length > 0) {
        wordLines.push([...currentLine]);
        lines.push(currentLine.join(' '));
    }

    // Second pass: calculate positions for justified text
    for (let lineIndex = 0; lineIndex < wordLines.length; lineIndex++) {
        const lineWords = wordLines[lineIndex];
        const isLastLine = lineIndex === wordLines.length - 1;

        if (!justify || isLastLine || lineWords.length === 1) {
            // For non-justified text, last line of paragraph, or single-word lines
            let xPos = 0;
            for (const word of lineWords) {
                wordPositions.push({ lineIndex, word, x: xPos });
                xPos += font.widthOfTextAtSize(word, fontSize) + font.widthOfTextAtSize(' ', fontSize);
            }
        } else {
            // For justified text
            const wordsWidth = lineWords.reduce((sum, word) => sum + font.widthOfTextAtSize(word, fontSize), 0);
            const spaces = lineWords.length - 1;
            const spaceWidth = spaces > 0 ? (maxWidth - wordsWidth) / spaces : 0;

            let xPos = 0;
            for (let i = 0; i < lineWords.length; i++) {
                const word = lineWords[i];
                wordPositions.push({ lineIndex, word, x: xPos });
                xPos += font.widthOfTextAtSize(word, fontSize);

                // Add justified space width (except after the last word)
                if (i < lineWords.length - 1) {
                    xPos += spaceWidth;
                }
            }
        }
    }

    return { lines, wordPositions };
}

/**
 * Draws justified text on a PDF page
 * @param page The PDF page to draw on
 * @param text The text to draw
 * @param options Configuration options for drawing the text
 */
export function drawJustifiedText(
    page: PDFPage,
    text: string,
    options: {
        x: number;
        y: number;
        font: PDFFont;
        fontSize: number;
        color?: [number, number, number];
        maxWidth: number;
        lineHeight: number;
        justify?: boolean;
        maxLines?: number;
    }
): number {
    const {
        x,
        y,
        font,
        fontSize,
        color = [0, 0, 0],
        maxWidth,
        lineHeight,
        justify = false,
        maxLines = Infinity
    } = options;

    const { lines, wordPositions } = wrapAndJustifyText(text, font, fontSize, maxWidth, justify);

    // If we're not justifying, just draw the lines normally
    if (!justify) {
        let currentY = y;
        const linesToDraw = Math.min(lines.length, maxLines);

        for (let i = 0; i < linesToDraw; i++) {
            page.drawText(lines[i], {
                x,
                y: currentY,
                size: fontSize,
                font,
                color: rgb(color[0], color[1], color[2])
            });
            currentY -= lineHeight;
        }

        return currentY;
    }

    // For justified text, draw each word at its calculated position
    let currentY = y;
    let currentLineIndex = 0;

    for (const { lineIndex, word, x: wordX } of wordPositions) {
        // Check if we've moved to a new line
        if (lineIndex > currentLineIndex) {
            currentLineIndex = lineIndex;
            currentY -= lineHeight;

            // Stop if we've reached the maximum number of lines
            if (currentLineIndex >= maxLines) {
                break;
            }
        }

        // Draw the word
        page.drawText(word, {
            x: x + wordX,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(color[0], color[1], color[2])
        });
    }

    // Return the Y position after the last line
    return currentY - lineHeight;
}
