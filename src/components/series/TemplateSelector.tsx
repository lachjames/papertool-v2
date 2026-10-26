import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Chip,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

export interface TemplateAssets {
  logo?: File;
  footerImage?: File;
  footerText?: string;
}

export interface TemplateConfig {
  templateId: 'A' | 'B' | 'C';
  assets: TemplateAssets;
}

interface TemplateSelectorProps {
  value?: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
  seriesName?: string;
  institution?: string;
}

// Template definitions
const TEMPLATES = [
  {
    id: 'A' as const,
    name: 'Classic Academic',
    description: 'Traditional academic layout with header logo and footer text',
    features: ['Header logo placement', 'Footer text area', 'Clean typography'],
    requiresLogo: true,
    supportsFooterImage: false,
    supportsFooterText: true
  },
  {
    id: 'B' as const,
    name: 'Modern Professional',
    description: 'Contemporary design with sidebar logo and footer branding',
    features: ['Sidebar logo placement', 'Footer image/text', 'Modern styling'],
    requiresLogo: true,
    supportsFooterImage: true,
    supportsFooterText: true
  },
  {
    id: 'C' as const,
    name: 'Institutional Formal',
    description: 'Formal institutional layout with multiple branding areas',
    features: ['Multiple logo placements', 'Footer image required', 'Formal styling'],
    requiresLogo: true,
    supportsFooterImage: true,
    supportsFooterText: true
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  value,
  onChange,
  seriesName = 'Sample Series',
  institution = 'Sample Institution'
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const selectedTemplate = TEMPLATES.find(t => t.id === value?.templateId) || TEMPLATES[0];

  const handleTemplateChange = (event: SelectChangeEvent) => {
    const templateId = event.target.value as 'A' | 'B' | 'C';
    onChange({
      templateId,
      assets: value?.assets || {}
    });
  };

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && value) {
      onChange({
        ...value,
        assets: {
          ...value.assets,
          logo: file
        }
      });
    }
  }, [value, onChange]);

  const handleFooterImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && value) {
      onChange({
        ...value,
        assets: {
          ...value.assets,
          footerImage: file
        }
      });
    }
  }, [value, onChange]);

  const handleFooterTextChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    if (value) {
      onChange({
        ...value,
        assets: {
          ...value.assets,
          footerText: text
        }
      });
    }
  }, [value, onChange]);

  const handleRemoveLogo = useCallback(() => {
    if (value) {
      onChange({
        ...value,
        assets: {
          ...value.assets,
          logo: undefined
        }
      });
    }
  }, [value, onChange]);

  const handleRemoveFooterImage = useCallback(() => {
    if (value) {
      onChange({
        ...value,
        assets: {
          ...value.assets,
          footerImage: undefined
        }
      });
    }
  }, [value, onChange]);

  const generatePreview = useCallback(() => {
    const template = selectedTemplate;
    const assets = value?.assets || {};
    
    // Create preview URLs for uploaded images
    const logoUrl = assets.logo ? URL.createObjectURL(assets.logo) : null;
    const footerImageUrl = assets.footerImage ? URL.createObjectURL(assets.footerImage) : null;

    // Generate template-specific HTML
    let html = '';
    
    switch (template.id) {
      case 'A':
        html = generateTemplateA(logoUrl, assets.footerText, seriesName, institution);
        break;
      case 'B':
        html = generateTemplateB(logoUrl, footerImageUrl, assets.footerText, seriesName, institution);
        break;
      case 'C':
        html = generateTemplateC(logoUrl, footerImageUrl, assets.footerText, seriesName, institution);
        break;
    }

    setPreviewHtml(html);
    setPreviewOpen(true);
  }, [selectedTemplate, value?.assets, seriesName, institution]);

  const isConfigurationValid = () => {
    if (!value) return false;
    
    const template = selectedTemplate;
    const assets = value.assets;
    
    // Check if required logo is present
    if (template.requiresLogo && !assets.logo) {
      return false;
    }
    
    return true;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cover Page Template Configuration
      </Typography>
      
      <Grid container spacing={3}>
        {/* Template Selection */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Template Style</InputLabel>
            <Select
              value={value?.templateId || 'A'}
              onChange={handleTemplateChange}
              label="Template Style"
            >
              {TEMPLATES.map(template => (
                <MenuItem key={template.id} value={template.id}>
                  <Box>
                    <Typography variant="body1">{template.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Template Description */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              {selectedTemplate.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {selectedTemplate.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedTemplate.features.map(feature => (
                <Chip key={feature} label={feature} size="small" variant="outlined" />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Logo Upload */}
        {selectedTemplate.requiresLogo && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Logo Upload {selectedTemplate.requiresLogo && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            
            {value?.assets.logo ? (
              <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img 
                    src={URL.createObjectURL(value.assets.logo)} 
                    alt="Logo preview" 
                    style={{ maxHeight: 40, maxWidth: 100, objectFit: 'contain' }}
                  />
                  <Box>
                    <Typography variant="body2">{value.assets.logo.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(value.assets.logo.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={handleRemoveLogo} color="error">
                  <DeleteIcon />
                </IconButton>
              </Paper>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ py: 2 }}
              >
                Upload Logo Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </Button>
            )}
            
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Recommended: PNG or JPG, max 2MB, transparent background preferred
            </Typography>
          </Grid>
        )}

        {/* Footer Configuration */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Footer Configuration
          </Typography>
          
          {selectedTemplate.supportsFooterText && (
            <TextField
              fullWidth
              label="Footer Text"
              value={value?.assets.footerText || ''}
              onChange={handleFooterTextChange}
              placeholder="e.g., Department of Economics • University Name • Contact Information"
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
          )}
          
          {selectedTemplate.supportsFooterImage && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Footer Image (optional)
              </Typography>
              
              {value?.assets.footerImage ? (
                <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img 
                      src={URL.createObjectURL(value.assets.footerImage)} 
                      alt="Footer image preview" 
                      style={{ maxHeight: 30, maxWidth: 100, objectFit: 'contain' }}
                    />
                    <Box>
                      <Typography variant="body2">{value.assets.footerImage.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(value.assets.footerImage.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={handleRemoveFooterImage} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              ) : (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Upload Footer Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFooterImageUpload}
                  />
                </Button>
              )}
              
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Optional: Additional branding or institutional logos for footer
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Validation and Preview */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          
          {!isConfigurationValid() && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {selectedTemplate.requiresLogo && !value?.assets.logo && 
                'Logo upload is required for this template.'}
            </Alert>
          )}
          
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={generatePreview}
            disabled={!isConfigurationValid()}
            fullWidth
          >
            Preview Template
          </Button>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Template Preview - {selectedTemplate.name}
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
};

// Template generation functions
function generateTemplateA(logoUrl: string | null, footerText: string | undefined, seriesName: string, institution: string): string {
  return `
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
      padding: 50pt;
      box-sizing: border-box;
      min-height: 100vh;
      position: relative;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 40pt;
      border-bottom: 2px solid #333;
      padding-bottom: 20pt;
    }
    .logo {
      max-height: 80pt;
      max-width: 200pt;
      margin-bottom: 15pt;
    }
    .header-text {
      font-size: 16pt;
      font-weight: bold;
      color: #333;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      text-align: center;
      margin: 40pt 0 30pt 0;
      color: #000000;
    }
    .authors {
      font-size: 14pt;
      text-align: center;
      margin-bottom: 20pt;
      color: #000000;
    }
    .institution {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 20pt;
      color: #666;
    }
    .series-name {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 30pt;
      font-style: italic;
      color: #666;
    }
    .abstract-section {
      margin-top: 40pt;
    }
    .abstract-header {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10pt;
      color: #000000;
    }
    .abstract {
      font-size: 12pt;
      text-align: justify;
      color: #000000;
    }
    .footer {
      position: absolute;
      bottom: 30pt;
      left: 50pt;
      right: 50pt;
      text-align: center;
      font-size: 10pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10pt;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
      <div class="header-text">Working Paper</div>
    
    <div class="title">Sample Paper Title: The Effect of Template Design on Academic Publishing</div>
    
    <div class="authors">Jane Smith, John Doe</div>
    
    <div class="institution">${institution}</div>
    
    <div class="series-name">${seriesName}</div>
    
    <div class="abstract-section">
      <div class="abstract-header">Abstract</div>
      <div class="abstract">This is a sample abstract demonstrating how the template will display paper content. The abstract provides a brief overview of the research methodology, key findings, and implications of the study.</div>
    </div>
    
    <div class="footer">
      ${footerText || 'Department of Economics • Research Center • Contact Information'}
    </div>
  </div>
</body>
</html>
  `;
}

function generateTemplateB(logoUrl: string | null, footerImageUrl: string | null, footerText: string | undefined, seriesName: string, institution: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      line-height: 1.5;
      background-color: #ffffff;
      color: #000000;
    }
    .cover-page {
      display: flex;
      min-height: 100vh;
      background-color: #ffffff;
    }
    .sidebar {
      width: 150pt;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 30pt 20pt;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-right: 3px solid #007bff;
    }
    .logo {
      max-height: 100pt;
      max-width: 120pt;
      margin-bottom: 20pt;
    }
    .sidebar-text {
      font-size: 10pt;
      text-align: center;
      color: #666;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      margin-top: auto;
    }
    .main-content {
      flex: 1;
      padding: 50pt;
      position: relative;
    }
    .header-text {
      font-size: 14pt;
      color: #007bff;
      margin-bottom: 30pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }
    .title {
      font-size: 26pt;
      font-weight: 300;
      margin-bottom: 30pt;
      color: #000000;
      line-height: 1.2;
    }
    .authors {
      font-size: 16pt;
      margin-bottom: 20pt;
      color: #333;
    }
    .institution {
      font-size: 12pt;
      margin-bottom: 15pt;
      color: #666;
    }
    .series-name {
      font-size: 12pt;
      margin-bottom: 40pt;
      color: #007bff;
      font-weight: 500;
    }
    .abstract-section {
      margin-top: 40pt;
    }
    .abstract-header {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 15pt;
      color: #000000;
    }
    .abstract {
      font-size: 11pt;
      text-align: justify;
      color: #000000;
      line-height: 1.6;
    }
    .footer {
      position: absolute;
      bottom: 30pt;
      left: 50pt;
      right: 50pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 2px solid #007bff;
      padding-top: 15pt;
    }
    .footer-text {
      font-size: 9pt;
      color: #666;
    }
    .footer-image {
      max-height: 30pt;
      max-width: 100pt;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="sidebar">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
      <div class="sidebar-text">Research Publication</div>
    </div>
    
    <div class="main-content">
      <div class="header-text">Working Paper</div>
      
      <div class="title">Sample Paper Title: Modern Approaches to Academic Research</div>
      
      <div class="authors">Jane Smith, John Doe</div>
      
      <div class="institution">${institution}</div>
      
      <div class="series-name">${seriesName}</div>
      
      <div class="abstract-section">
        <div class="abstract-header">Abstract</div>
        <div class="abstract">This is a sample abstract demonstrating the modern template design. The layout emphasizes clean typography and contemporary styling while maintaining academic professionalism.</div>
      </div>
      
      <div class="footer">
        <div class="footer-text">
          ${footerText || 'Department of Economics • Research Center • Contact Information'}
        </div>
        ${footerImageUrl ? `<img src="${footerImageUrl}" alt="Footer branding" class="footer-image" />` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateTemplateC(logoUrl: string | null, footerImageUrl: string | null, footerText: string | undefined, seriesName: string, institution: string): string {
  return `
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
      min-height: 100vh;
      position: relative;
      background-color: #ffffff;
    }
    .header-band {
      background: linear-gradient(90deg, #1a365d 0%, #2d5a87 100%);
      color: white;
      padding: 25pt 50pt;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      flex: 1;
    }
    .header-title {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5pt;
    }
    .header-subtitle {
      font-size: 12pt;
      opacity: 0.9;
    }
    .header-logo {
      max-height: 60pt;
      max-width: 150pt;
    }
    .main-content {
      padding: 60pt 50pt;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 30pt;
      color: #1a365d;
      text-align: center;
    }
    .authors {
      font-size: 14pt;
      text-align: center;
      margin-bottom: 20pt;
      color: #000000;
    }
    .institution {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 15pt;
      color: #666;
    }
    .series-name {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 40pt;
      color: #1a365d;
      font-weight: 600;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, #1a365d 0%, #2d5a87 100%);
      margin: 30pt 0;
    }
    .abstract-section {
      margin-top: 40pt;
    }
    .abstract-header {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 15pt;
      color: #1a365d;
    }
    .abstract {
      font-size: 12pt;
      text-align: justify;
      color: #000000;
      line-height: 1.6;
    }
    .footer-band {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #1a365d 0%, #2d5a87 100%);
      color: white;
      padding: 20pt 50pt;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-text {
      font-size: 10pt;
      flex: 1;
    }
    .footer-image {
      max-height: 40pt;
      max-width: 120pt;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="header-band">
      <div class="header-left">
        <div class="header-title">Official Publication</div>
        <div class="header-subtitle">${institution}</div>
      </div>
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="header-logo" />` : ''}
    </div>
    
    <div class="main-content">
      <div class="title">Sample Paper Title: Formal Academic Research Publication</div>
      
      <div class="divider"></div>
      
      <div class="authors">Jane Smith, John Doe</div>
      
      <div class="institution">${institution}</div>
      
      <div class="series-name">${seriesName}</div>
      
      <div class="abstract-section">
        <div class="abstract-header">Abstract</div>
        <div class="abstract">This is a sample abstract demonstrating the formal institutional template. This design is suitable for official publications and emphasizes institutional branding and formal presentation.</div>
      </div>
    </div>
    
    <div class="footer-band">
      <div class="footer-text">
        ${footerText || 'Department of Economics • Research Center • Contact Information'}
      </div>
      ${footerImageUrl ? `<img src="${footerImageUrl}" alt="Footer branding" class="footer-image" />` : ''}
    </div>
  </div>
</body>
</html>
  `;
}

export default TemplateSelector;
