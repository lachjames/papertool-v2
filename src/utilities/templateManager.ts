import Handlebars from 'handlebars';
import { SeriesAssets } from '../services/assetService';

export interface TemplateData {
  title: string;
  authors: string;
  abstract: string;
  institution: string;
  seriesName: string;
  date: string;
  year?: string;
  keywords: string;
  jel: string;
  paperNumber?: string;
  headerText: string;
  affiliation?: string;
  /** Series homepage or canonical link (series-level by default, per-paper override if provided). */
  link?: string;
}

export interface TemplateSettings {
  includeAbstract: boolean;
  includeJEL: boolean;
  includeKeywords: boolean;
  includeInstitution: boolean;
  includeSeriesName: boolean;
  includeDate: boolean;
}

export interface TemplateContext extends TemplateData, TemplateSettings {
  logoUrl?: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  backgroundImageUrl?: string;

  // Aliases (helpful when users copy/paste variable names)
  headerImageURL?: string;
  footerImageURL?: string;
  backgroundImageURL?: string;
}

export interface TemplateValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Process an HTML template with data, assets, and settings using Handlebars
 */
export const processTemplate = (
  template: string,
  data: TemplateData,
  assets: SeriesAssets | null | undefined,
  settings: TemplateSettings
): string => {
  try {
    const compiledTemplate = Handlebars.compile(template);

    const headerUrl = assets?.header?.url;
    const footerUrl = assets?.footer?.url;
    const backgroundUrl = assets?.background?.url;

    const context: TemplateContext = {
      ...data,
      ...settings,
      logoUrl: assets?.logo?.url,
      headerImageUrl: headerUrl,
      footerImageUrl: footerUrl,
      backgroundImageUrl: backgroundUrl,
      headerImageURL: headerUrl,
      footerImageURL: footerUrl,
      backgroundImageURL: backgroundUrl
    };

    return compiledTemplate(context);
  } catch (error) {
    console.error('Error processing template:', error);
    return `<html><body><h1>Template Error</h1><p>${error instanceof Error ? error.message : 'Unknown error'}</p></body></html>`;
  }
};

/**
 * Validate an HTML template
 */
export const validateTemplate = (template: string): TemplateValidation => {
  const errors: string[] = [];

  // Check if template is not empty
  if (!template.trim()) {
    errors.push('Template cannot be empty');
    return { valid: false, errors };
  }

  // Check for basic HTML structure
  if (!template.includes('<html>') && !template.includes('<!DOCTYPE html>')) {
    errors.push('Template should include proper HTML structure');
  }

  // Check for required CSS structure
  if (!template.includes('<style>') && !template.includes('stylesheet')) {
    errors.push('Template should include CSS styles');
  }

  // Check for body tag
  if (!template.includes('<body>')) {
    errors.push('Template should include a body tag');
  }

  // Try to compile the template with Handlebars
  try {
    Handlebars.compile(template);
  } catch (error) {
    errors.push(`Handlebars compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Generate a preview of the template with sample data
 */
export const generateTemplatePreview = (
  template: string,
  assets?: SeriesAssets | null
): string => {
  const sampleData = generateSampleData();
  const defaultSettings = generateDefaultSettings();

  return processTemplate(template, sampleData, assets, defaultSettings);
};

/**
 * Generate sample data for template preview
 */
export const generateSampleData = (): TemplateData => {
  const now = new Date();
  return {
    title: 'Sample Paper Title: An Investigation into Economic Phenomena',
    authors: 'John Smith, Jane Doe, Robert Johnson',
    abstract: 'This paper presents a comprehensive analysis of economic phenomena using advanced statistical methods. We examine the relationship between various economic indicators and their impact on market performance. Our findings suggest that there are significant correlations between the variables studied, with implications for policy makers and researchers in the field.',
    institution: 'University of Economics',
    seriesName: 'Working Paper Series',
    date: now.toLocaleDateString(),
    year: `${now.getFullYear()}`,
    keywords: 'economics, statistics, market analysis, policy',
    jel: 'C10, E20, G10',
    paperNumber: '2025-01',
    headerText: 'Working Paper',
    affiliation: 'Department of Economics',
    link: 'https://example.edu/department/working-papers'
  };
};

/**
 * Generate default template settings
 */
export const generateDefaultSettings = (): TemplateSettings => {
  return {
    includeAbstract: true,
    includeJEL: true,
    includeKeywords: true,
    includeInstitution: true,
    includeSeriesName: true,
    includeDate: true
  };
};
