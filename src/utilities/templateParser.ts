/**
 * Parses a Jinja-style template and replaces variables with values
 * @param template The HTML template with {{ variable }} syntax
 * @param data The data object with values for variables
 * @returns The filled HTML template
 */
export function parseTemplate(template: string, data: Record<string, any>): string {
  if (!template) return '';

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, varName) => {
    const trimmedVarName = varName.trim();
    const value = trimmedVarName.split('.').reduce((obj: any, key: string) => {
      if (obj === null || obj === undefined) return '';
      return obj[key] !== undefined ? obj[key] : '';
    }, data);

    return value !== undefined ? value : '';
  });
}

function injectStylesIntoDocument(html: string, styles: string): string {
  if (/<html[\s>]/i.test(html)) {
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<\/head>/i, `${styles}</head>`);
    }

    return html.replace(/<html([^>]*)>/i, `<html$1><head>${styles}</head>`);
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8" />${styles}</head><body>${html}</body></html>`;
}

/**
 * Adds PDF-optimized styles to an HTML template without destructively rewriting user CSS.
 * @param html The HTML template
 * @param pageSize The page size in points (PDF units)
 * @returns The HTML with PDF-friendly styles added
 */
export function addDefaultStyles(html: string, pageSize: { width: number, height: number }): string {
  const pdfOptimizedStyles = `
    <style id="pdf-optimization">
      @page {
        size: ${pageSize.width}pt ${pageSize.height}pt;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        width: ${pageSize.width}pt;
        min-height: ${pageSize.height}pt;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background: transparent;
      }

      body {
        position: relative;
      }

      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
      }
    </style>
  `;

  return injectStylesIntoDocument(html, pdfOptimizedStyles);
}

/**
 * Enhanced default HTML template optimized for PDF generation
 */
export const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      background: white;
      color: black;
    }

    .cover-page {
      padding: 72pt;
      background: white;
      color: black;
      position: relative;
    }

    .header {
      text-align: center;
      margin-bottom: 48pt;
      font-size: 14pt;
      font-style: italic;
      color: #333;
    }

    .title {
      font-size: 24pt;
      margin-bottom: 24pt;
      text-align: center;
      font-weight: bold;
      color: black;
    }

    .authors {
      font-size: 12pt;
      font-style: italic;
      text-align: center;
      margin-bottom: 18pt;
      color: black;
    }

    .institution {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 12pt;
      color: black;
    }

    .date {
      font-size: 10pt;
      text-align: right;
      margin-bottom: 36pt;
      color: black;
    }

    .abstract-section {
      margin-top: 36pt;
    }

    .abstract-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 12pt;
      color: black;
    }

    .abstract {
      font-size: 10pt;
      text-align: justify;
      color: black;
    }

    .metadata {
      font-size: 10pt;
      margin-top: 24pt;
      color: black;
    }

    .series-name {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 12pt;
      color: black;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="header">{{ headerText }}</div>
    <div class="series-name">{{ seriesName }}</div>
    <div class="title">{{ title }}</div>
    <div class="authors">{{ authors }}</div>
    <div class="institution">{{ institution }}</div>
    <div class="date">{{ date }}</div>

    <div class="abstract-section">
      <div class="abstract-title">Abstract</div>
      <div class="abstract">{{ abstract }}</div>
    </div>

    <div class="metadata">
      <div><strong>Keywords:</strong> {{ keywords }}</div>
      <div><strong>JEL Classification:</strong> {{ jel }}</div>
    </div>
  </div>
</body>
</html>
`.trim();
