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
    // Handle nested properties using dot notation
    const value = trimmedVarName.split('.').reduce((obj: any, key: string) => {
      if (obj === null || obj === undefined) return '';
      return obj[key] !== undefined ? obj[key] : '';
    }, data);

    return value !== undefined ? value : '';
  });
}

/**
 * Adds default styles to an HTML template if not already present
 * @param html The HTML template
 * @param pageSize The page size in points (PDF units)
 * @returns The HTML with default styles added
 */
export function addDefaultStyles(html: string, pageSize: { width: number, height: number }): string {
  // Replace any existing !important flags to avoid conflicts
  html = html.replace(/!important/g, '');
  
  // Basic crucial styles that must be included regardless of existing styles
  const forcedStyles = `
    <style>
      @page {
        size: ${pageSize.width}pt ${pageSize.height}pt !important;
        margin: 0 !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${pageSize.width}pt !important;
        min-height: ${pageSize.height}pt !important;
        background-color: #ffffff !important;
      }
    </style>
  `;
  
  // Check if the template has <style> tags
  if (!html.includes('<style>') && !html.includes('<link rel="stylesheet"')) {
    // Add complete styling if no styles exist
    const defaultStyles = `
      <style>
        @page {
          size: ${pageSize.width}pt ${pageSize.height}pt !important;
          margin: 0 !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          font-family: 'Times New Roman', Times, serif;
          width: ${pageSize.width}pt !important;
          min-height: ${pageSize.height}pt !important;
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .cover-page {
          padding: 72pt;
          box-sizing: border-box;
          min-height: ${pageSize.height}pt;
          background-color: #ffffff !important;
          color: #000000 !important;
          position: relative;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #000000 !important;
        }
        p, div, span {
          color: #000000 !important;
        }
        h1, .title {
          font-size: 24pt;
          margin-bottom: 24pt;
          font-weight: bold;
          color: #000000 !important;
        }
        .authors {
          font-size: 12pt;
          font-style: italic;
          margin-bottom: 18pt;
          color: #000000 !important;
        }
        .abstract {
          font-size: 10pt;
          text-align: justify;
          margin-top: 36pt;
          color: #000000 !important;
        }
      </style>
    `;

    // If no <head> tag, add one with the styles
    if (!html.includes('<head>')) {
      html = `<html><head>${defaultStyles}</head>${html.includes('<body>') ? html : `<body>${html}</body></html>`}`;
    } else {
      // Insert styles in the existing <head>
      html = html.replace('<head>', `<head>${defaultStyles}`);
    }
  } else {
    // Add the force styles before the closing head tag
    html = html.replace('</head>', `${forcedStyles}</head>`);
  }

  return html;
}

/**
 * Default HTML template for cover pages
 */
export const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      background-color: #ffffff;
      color: #000000;
    }
    .cover-page {
      padding: 72pt;
      box-sizing: border-box;
      min-height: 100vh;
      position: relative;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 48pt;
      font-size: 14pt;
      font-style: italic;
      color: #333333;
    }
    .title {
      font-size: 24pt;
      margin-bottom: 24pt;
      text-align: center;
      font-weight: bold;
      color: #000000;
    }
    .authors {
      font-size: 12pt;
      font-style: italic;
      text-align: center;
      margin-bottom: 18pt;
      color: #000000;
    }
    .institution {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 12pt;
      color: #000000;
    }
    .date {
      font-size: 10pt;
      text-align: right;
      margin-bottom: 36pt;
      color: #000000;
    }
    .abstract-section {
      margin-top: 36pt;
    }
    .abstract-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 12pt;
      color: #000000;
    }
    .abstract {
      font-size: 10pt;
      text-align: justify;
      color: #000000;
    }
    .metadata {
      font-size: 10pt;
      margin-top: 24pt;
      color: #000000;
    }
    .footer {
      position: absolute;
      bottom: 36pt;
      left: 72pt;
      right: 72pt;
      text-align: center;
      font-size: 10pt;
      border-top: 1px solid #ddd;
      padding-top: 12pt;
      color: #000000;
    }
    .series-name {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 12pt;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="header">
      {{ headerText }}
    </div>
    
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
    
    <div class="footer">
      Page 1
    </div>
  </div>
</body>
</html>
`.trim();
