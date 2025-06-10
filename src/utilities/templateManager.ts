import { sanitizeText } from './sanitizeText';
import { parseTemplate, defaultTemplate } from './templateParser';

/**
 * Mapping of paper metadata fields to template placeholders
 */
interface TemplateFields {
  title: string;
  authors: string | string[];
  abstract?: string;
  institution?: string;
  date?: string;
  seriesName?: string;
  keywords?: string | string[];
  jel?: string | string[];
  headerText?: string;
  affiliation?: string;
}

/**
 * Validates a HTML template to ensure it has the required structure
 * @param templateHtml The HTML template to validate
 * @returns Object containing validation result and any error messages
 */
export function validateTemplate(templateHtml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation - check if it's valid HTML
  if (!templateHtml || templateHtml.trim() === '') {
    errors.push('Template cannot be empty');
    return { valid: false, errors };
  }
  
  // Check for basic HTML structure
  if (!templateHtml.includes('<html') && !templateHtml.includes('<body')) {
    errors.push('Template should include basic HTML structure (html, body tags)');
  }
  
  // Check for head and style sections
  if (!templateHtml.includes('<head') && !templateHtml.includes('<style')) {
    errors.push('Template should include styling (either a head tag or style tag)');
  }
  
  // Check for at least a title placeholder
  if (!templateHtml.includes('{{') || !templateHtml.includes('}}')) {
    errors.push('Template should include at least one placeholder using {{ variable }} syntax');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Populates a template with data
 * @param templateHtml The HTML template with {{ variable }} syntax
 * @param data The data to populate the template with
 * @returns The populated HTML
 */
export function populateTemplate(templateHtml: string, data: TemplateFields): string {
  // Convert arrays to strings for template parsing
  const processedData: Record<string, string> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      processedData[key] = value.join(', ');
    } else if (value !== undefined && value !== null) {
      processedData[key] = sanitizeText(String(value));
    } else {
      processedData[key] = '';
    }
  });
  
  return parseTemplate(templateHtml, processedData);
}

/**
 * Generates sample data for template preview
 * @returns Sample data for preview
 */
export function generateSampleData(): TemplateFields {
  return {
    title: "Example Paper Title: The Effect of Sample Size on Statistical Power",
    authors: "Jane Smith, John Doe, Robert Johnson",
    abstract: "This is a sample abstract for the template preview. It demonstrates how the text will flow in the final cover page. The abstract typically includes a brief description of the research methodology, findings, and implications.",
    institution: "University Research Center",
    date: new Date().toLocaleDateString(),
    seriesName: "Economics Working Paper Series",
    keywords: "Sample, Example, Template, Preview",
    jel: "A10, B20, C30, D40",
    headerText: "Working Paper",
    affiliation: "Department of Economics"
  };
}

/**
 * Generate a preview of the template
 * @param templateHtml The HTML template to preview
 * @param customData Optional custom data to use instead of sample data
 * @returns Populated HTML ready for preview
 */
export function generateTemplatePreview(
  templateHtml: string = defaultTemplate, 
  customData?: Partial<TemplateFields>
): string {
  const data = { ...generateSampleData(), ...customData };
  return populateTemplate(templateHtml, data);
}
