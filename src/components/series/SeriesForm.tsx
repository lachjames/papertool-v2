import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  Collapse,
  Paper,
  InputLabel,
  FormControl,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import { NewSeriesData } from '../../types';
import { validateTemplate, generateTemplatePreview } from '../../utilities/templateManager';
import { defaultTemplate } from '../../utilities/templateParser';
import { getTemplateByType } from '../../utilities/templates';

interface CoverPageSettings {
  htmlTemplate?: string;
  defaultTemplate?: string;
  includeAbstract?: boolean;
  includeJEL?: boolean;
  includeKeywords?: boolean;
  includeInstitution?: boolean;
  includeSeriesName?: boolean;
  includeDate?: boolean;
  headerText?: string;
}

interface SeriesFormProps {
  onSubmit: (seriesData: NewSeriesData, basePdfFile?: File) => Promise<void>;
  isLoading: boolean;
  inModal?: boolean;
}

// Templates for cover pages - now act as presets for the HTML editor
const TEMPLATES = [
  {
    id: 'academic',
    name: 'Academic Standard',
    headerText: 'Working Paper',
    description: 'Standard academic working paper format'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    headerText: 'Research Paper',
    description: 'Clean, minimal design with essential information only'
  },
  {
    id: 'formal',
    name: 'Formal',
    headerText: 'Official Publication',
    description: 'Formal design suitable for official publications'
  },
  {
    id: 'custom',
    name: 'Custom Template',
    headerText: 'Custom Template',
    description: 'Start with a blank template'
  }
];

const SeriesForm: React.FC<SeriesFormProps> = ({
  onSubmit,
  isLoading,
  inModal = false
}) => {
  const [seriesData, setSeriesData] = useState<NewSeriesData>({
    seriesId: '',
    name: '',
    institution: ''
  });

  // State for cover page settings
  const [coverPageSettings, setCoverPageSettings] = useState<CoverPageSettings>({
    defaultTemplate: 'academic',
    includeAbstract: true,
    includeJEL: true,
    includeKeywords: true,
    includeInstitution: true,
    includeSeriesName: true,
    includeDate: true,
    headerText: 'Working Paper',
    htmlTemplate: getTemplateByType('academic') // Initialize with academic template
  });

  // State for HTML template editing and preview
  const [htmlTemplate, setHtmlTemplate] = useState<string>(getTemplateByType('academic'));
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [templateTabValue, setTemplateTabValue] = useState(0);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Initialize template when the form loads
  useEffect(() => {
    const initialTemplateId = coverPageSettings.defaultTemplate || 'academic';
    const initialHtml = getTemplateByType(initialTemplateId);
    setHtmlTemplate(initialHtml);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSeriesData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverPageSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCoverPageSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverPageCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCoverPageSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleTemplateChange = (e: SelectChangeEvent) => {
    const templateId = e.target.value;

    // Get the HTML for the selected template
    let templateHtml;
    if (templateId === 'custom') {
      // For custom template, use a simplified starter template
      templateHtml = defaultTemplate;
    } else {
      // For predefined templates, get the corresponding HTML
      templateHtml = getTemplateByType(templateId);
    }

    // Update state
    setHtmlTemplate(templateHtml);
    setCoverPageSettings(prev => ({
      ...prev,
      defaultTemplate: templateId,
      htmlTemplate: templateHtml
    }));

    // Auto-open the HTML editor for custom template
    if (templateId === 'custom') {
      setShowHtmlEditor(true);
    }

    // Set template default header text
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setCoverPageSettings(prev => ({
        ...prev,
        headerText: template.headerText
      }));
    }

    // Validate the template
    validateHtmlTemplate(templateHtml);
  };

  const handleHtmlTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const templateContent = e.target.value;
    setHtmlTemplate(templateContent);

    // Update cover page settings with the new template
    setCoverPageSettings(prev => ({
      ...prev,
      htmlTemplate: templateContent
    }));

    // Validate the template content
    validateHtmlTemplate(templateContent);
  };

  const validateHtmlTemplate = (content: string) => {
    if (content.trim()) {
      const validation = validateTemplate(content);
      if (!validation.valid) {
        setTemplateError(`Template validation failed: ${validation.errors.join(', ')}`);
      } else {
        setTemplateError(null);
      }
    } else {
      setTemplateError('Template cannot be empty');
    }
  };

  const handlePreviewTemplate = () => {
    // Generate preview using the current template
    const preview = generateTemplatePreview(htmlTemplate || defaultTemplate);
    setPreviewHtml(preview);
    setPreviewOpen(true);
  };

  const handleTemplateTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTemplateTabValue(newValue);
  };

  const toggleHtmlEditor = () => {
    setShowHtmlEditor(!showHtmlEditor);
    if (!showHtmlEditor && templateTabValue !== 0) {
      setTemplateTabValue(0); // Switch to edit tab when opening
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Combine seriesData with coverPageSettings
    const formData: NewSeriesData = {
      ...seriesData,
      coverPageSettings: {
        ...coverPageSettings,
        htmlTemplate: htmlTemplate // Store the HTML template in the series data
      }
    };

    try {
      await onSubmit(formData);
      // Only reset form if not in modal (since the modal will close)
      if (!inModal) {
        setSeriesData({ seriesId: '', name: '', institution: '' });
        setCoverPageSettings({
          defaultTemplate: 'academic',
          includeAbstract: true,
          includeJEL: true,
          includeKeywords: true,
          includeInstitution: true,
          includeSeriesName: true,
          includeDate: true,
          headerText: 'Working Paper',
          htmlTemplate: getTemplateByType('academic')
        });
        setHtmlTemplate(getTemplateByType('academic'));
      }
    } catch (error) {
      // Error handling is managed in the parent component
    }
  };

  const formContent = (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: inModal ? 1 : 0 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Series Information
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="seriesId"
            label="Series ID"
            name="seriesId"
            value={seriesData.seriesId}
            onChange={handleChange}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="name"
            label="Series Name"
            name="name"
            value={seriesData.name}
            onChange={handleChange}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="institution"
            label="Institution"
            name="institution"
            value={seriesData.institution}
            onChange={handleChange}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} sx={{ mt: 2 }}>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
            <Typography variant="h6">Cover Page Settings</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </Button>
          </Box>
        </Grid>

        <Collapse in={showAdvancedSettings} sx={{ width: '100%' }}>
          <Grid container spacing={2} sx={{ pl: 2, pr: 2, mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Content to Include on Cover Pages
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={coverPageSettings.includeAbstract ?? true}
                    onChange={handleCoverPageCheckboxChange}
                    name="includeAbstract"
                  />
                }
                label="Include Abstract"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={coverPageSettings.includeJEL ?? true}
                    onChange={handleCoverPageCheckboxChange}
                    name="includeJEL"
                  />
                }
                label="Include JEL Codes"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={coverPageSettings.includeKeywords ?? true}
                    onChange={handleCoverPageCheckboxChange}
                    name="includeKeywords"
                  />
                }
                label="Include Keywords"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={coverPageSettings.includeInstitution ?? true}
                    onChange={handleCoverPageCheckboxChange}
                    name="includeInstitution"
                  />
                }
                label="Include Institution"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={coverPageSettings.includeSeriesName ?? true}
                    onChange={handleCoverPageCheckboxChange}
                    name="includeSeriesName"
                  />
                }
                label="Include Series Name"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={coverPageSettings.includeDate ?? true}
                    onChange={handleCoverPageCheckboxChange}
                    name="includeDate"
                  />
                }
                label="Include Date"
              />
            </Grid>
          </Grid>
        </Collapse>

        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="default-template-select">Template Style</InputLabel>
            <Select
              labelId="default-template-select"
              id="template-select"
              value={coverPageSettings.defaultTemplate || 'academic'}
              label="Template Style"
              onChange={handleTemplateChange}
              size="small"
            >
              {TEMPLATES.map(template => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            {TEMPLATES.find(t => t.id === coverPageSettings.defaultTemplate)?.description}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="headerText"
            label="Header Text"
            name="headerText"
            value={coverPageSettings.headerText || ''}
            onChange={handleCoverPageSettingChange}
            variant="outlined"
            size="small"
            margin="normal"
            helperText="Text that appears at the top of the cover page"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="subtitle1">HTML Template</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<CodeIcon />}
                onClick={toggleHtmlEditor}
                size="small"
                sx={{ mr: 1 }}
              >
                {showHtmlEditor ? 'Hide HTML Editor' : 'Edit HTML'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={handlePreviewTemplate}
                disabled={!htmlTemplate}
                size="small"
              >
                Preview
              </Button>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary">
            The template will be filled with paper details when generating cover pages.
          </Typography>

          <Collapse in={showHtmlEditor}>
            <Paper elevation={1} sx={{ p: 2, mt: 2, border: templateError ? '1px solid #f44336' : 'none' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={templateTabValue} onChange={handleTemplateTabChange}>
                  <Tab label="Edit Template" />
                  <Tab label="Help" />
                </Tabs>
              </Box>

              {templateTabValue === 0 && (
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={htmlTemplate}
                  onChange={handleHtmlTemplateChange}
                  variant="outlined"
                  size="small"
                  placeholder="Paste or edit your HTML template here"
                  sx={{
                    fontFamily: 'monospace',
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              )}

              {templateTabValue === 1 && (
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Template Variables:
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul>
                      <li><code>{'{{ title }}'}</code> - Paper title</li>
                      <li><code>{'{{ authors }}'}</code> - Comma-separated list of authors</li>
                      <li><code>{'{{ abstract }}'}</code> - Paper abstract</li>
                      <li><code>{'{{ institution }}'}</code> - Institution name</li>
                      <li><code>{'{{ seriesName }}'}</code> - Series name</li>
                      <li><code>{'{{ date }}'}</code> - Current date</li>
                      <li><code>{'{{ keywords }}'}</code> - Comma-separated keywords</li>
                      <li><code>{'{{ jel }}'}</code> - JEL classification codes</li>
                      <li><code>{'{{ headerText }}'}</code> - Header text (e.g., "Working Paper")</li>
                      <li><code>{'{{ affiliation }}'}</code> - Author affiliation</li>
                    </ul>
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Display Conditions:
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul>
                      <li><code>{'{{ abstractDisplay }}'}</code> - 'block' or 'none' based on include settings</li>
                      <li><code>{'{{ jelDisplay }}'}</code> - 'block' or 'none' based on include settings</li>
                      <li><code>{'{{ keywordsDisplay }}'}</code> - 'block' or 'none' based on include settings</li>
                      <li><code>{'{{ institutionDisplay }}'}</code> - 'block' or 'none' based on include settings</li>
                      <li><code>{'{{ seriesNameDisplay }}'}</code> - 'block' or 'none' based on include settings</li>
                      <li><code>{'{{ dateDisplay }}'}</code> - 'block' or 'none' based on include settings</li>
                      <li><code>{'{{ affiliationDisplay }}'}</code> - 'block' or 'none' if affiliation is provided</li>
                    </ul>
                  </Typography>
                </Box>
              )}

              {templateError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {templateError}
                </Alert>
              )}
            </Paper>
          </Collapse>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !!templateError}
            sx={{ mt: 2 }}
          >
            {isLoading ? 'Creating...' : 'Create Series'}
          </Button>
        </Grid>
      </Grid>

      {/* Template Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Template Preview
          <IconButton
            aria-label="close"
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              height: '600px',
              overflow: 'auto',
              border: '1px solid #ddd',
              '& iframe': {
                border: 'none',
                width: '100%',
                height: '100%'
              }
            }}
          >
            <iframe
              srcDoc={previewHtml}
              title="Template Preview"
              sandbox="allow-same-origin"
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // If in a modal, just return the form without the card wrapper
  if (inModal) {
    return formContent;
  }

  // Otherwise, wrap in a card for standalone use
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Create New Series
        </Typography>
        {formContent}
      </CardContent>
    </Card>
  );
};

export default SeriesForm;
