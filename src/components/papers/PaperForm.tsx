import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Input,
  InputLabel,
  FormControl,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import { NewPaperData, PageSize } from '../../types';
import axios from 'axios';
import getBaseURL from '../../getBaseURL';
import { sanitizeText } from '../../utilities/sanitizeText';
import { detectPdfPageSize, getPageSizeName } from '../../utilities/detectPdfPageSize';
import { useCoverPageGenerator } from './CoverPageGenerator';

interface PaperFormProps {
  onSubmit: (paperData: NewPaperData, contentFile: File, coverPageFile?: File | null) => Promise<void>;
  isLoading: boolean;
  inModal?: boolean;
  seriesSettings?: {
    name: string;
    institution: string;
    coverPageSettings?: {
      defaultTemplate?: string;
      htmlTemplate?: string;
      headerText?: string;
      defaultPageSize?: PageSize;
    };
  };
}

const PaperForm: React.FC<PaperFormProps> = ({
  onSubmit,
  isLoading,
  inModal = false,
  seriesSettings
}) => {
  const [paperData, setPaperData] = useState<NewPaperData>({
    title: '',
    authors: '',
    abstract: '',
    keywords: '',
    jel: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [processingPdf, setProcessingPdf] = useState<boolean>(false);

  // Cover page generation state
  const [coverPageFile, setCoverPageFile] = useState<File | null>(null);
  const [generatingCoverPage, setGeneratingCoverPage] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  // Page size detection state
  const [detectedPageSize, setDetectedPageSize] = useState<PageSize>({
    width: 595,
    height: 842,
    format: 'A4'
  });

  // Use the cover page generator
  const coverPageGenerator = useCoverPageGenerator({
    paperData,
    seriesSettings: seriesSettings || { name: '', institution: '' },
    pageSize: detectedPageSize
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaperData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Clear any previous analysis error when a new file is selected
      setAnalysisError(null);

      // Detect page size if it's a PDF
      if (file.type === 'application/pdf') {
        // Use the default page size from series settings or default to A4
        const defaultSize = seriesSettings?.coverPageSettings?.defaultPageSize || {
          width: 595,
          height: 842,
          format: 'A4'
        };

        detectPdfPageSize(file, (pageSize) => {
          setDetectedPageSize(pageSize);
          console.log(`Detected PDF page size: ${pageSize.width}×${pageSize.height} (${pageSize.format || 'custom'})`);
        }, defaultSize);
      }
    }
  };

  // Generate cover page function
  const handleGenerateCoverPage = async () => {
    if (!paperData.title || !paperData.authors) {
      setAnalysisError('Title and authors are required to generate a cover page');
      return;
    }

    setGeneratingCoverPage(true);
    try {
      // Generate PDF file
      const file = await coverPageGenerator.generatePdfFile();
      setCoverPageFile(file);

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      console.log('Cover page generated successfully');
    } catch (error) {
      console.error('Error generating cover page:', error);
      setAnalysisError('Failed to generate cover page. Please try again.');
    } finally {
      setGeneratingCoverPage(false);
    }
  };

  // Show preview in dialog
  const handleShowPreview = () => {
    if (previewUrl) {
      setPreviewOpen(true);
    } else if (!coverPageFile && !generatingCoverPage) {
      handleGenerateCoverPage();
      setTimeout(() => setPreviewOpen(true), 500);
    }
  };

  // Find the handleSubmit function in PaperForm.tsx
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      setAnalysisError('Please select a content PDF file');
      return;
    }

    try {
      setProcessingPdf(true);

      // Generate cover page if not already done
      let coverPageFileToSubmit = coverPageFile;
      if (!coverPageFileToSubmit && paperData.title && paperData.authors) {
        try {
          coverPageFileToSubmit = await coverPageGenerator.generatePdfFile();
          setCoverPageFile(coverPageFileToSubmit);
          console.log('Generated cover page file for submission', {
            name: coverPageFileToSubmit.name,
            size: coverPageFileToSubmit.size
          });
        } catch (error) {
          console.error('Failed to generate cover page:', error);
        }
      }

      const enrichedPaperData: NewPaperData = {
        ...paperData,
        pageSize: detectedPageSize
      };

      // Debug logging
      console.log('Submitting paper with files:', {
        hasContentFile: !!selectedFile,
        contentFileSize: selectedFile?.size,
        hasCoverPage: !!coverPageFileToSubmit,
        coverPageSize: coverPageFileToSubmit?.size
      });

      // Make sure to pass both files to onSubmit
      await onSubmit(enrichedPaperData, selectedFile, coverPageFileToSubmit || null);

      // Reset form if not in modal
      if (!inModal) {
        setPaperData({ title: '', authors: '', abstract: '', keywords: '', jel: '' });
        setSelectedFile(null);
        setCoverPageFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setDetectedPageSize({ width: 595, height: 842, format: 'A4' });
      }
    } catch (error) {
      console.error('Error submitting paper:', error);
    } finally {
      setProcessingPdf(false);
    }
  };

  const analyzePDF = async () => {
    if (!selectedFile) {
      setAnalysisError('Please select a PDF file first');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setAnalysisError('Selected file must be a PDF');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisError(null);

      // Create form data for the file upload
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      // Send the PDF for analysis
      const response = await axios.post(
        getBaseURL('analyze-pdf'),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      // Process the response data
      const metadata = response.data;

      // Update form fields with extracted data
      setPaperData({
        title: metadata.title || '',
        authors: Array.isArray(metadata.authors) ? metadata.authors.join(', ') : '',
        abstract: metadata.abstract || '',
        keywords: Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : '',
        jel: Array.isArray(metadata.jel_classification_codes)
          ? metadata.jel_classification_codes.map((jel: any) => jel.code).join(', ')
          : ''
      });

    } catch (error) {
      console.error('Error analyzing PDF:', error);
      setAnalysisError('Failed to analyze PDF. Please try again or fill in the fields manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Clean up preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formContent = (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: inModal ? 1 : 0 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="upload-file" shrink>
              Upload PDF (required)
            </InputLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Input
                id="upload-file"
                type="file"
                inputProps={{ accept: '.pdf' }}
                onChange={handleFileChange}
                endAdornment={
                  <CloudUploadIcon color="action" sx={{ ml: 1 }} />
                }
                sx={{ flexGrow: 1 }}
                required
              />
              <Tooltip title="Auto-analyze PDF to extract metadata">
                <span>
                  <IconButton
                    onClick={analyzePDF}
                    disabled={analyzing || !selectedFile}
                    color="primary"
                    sx={{ ml: 1 }}
                  >
                    {analyzing ? <CircularProgress size={24} /> : <AutoFixHighIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            {selectedFile && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Selected file: {selectedFile.name}
                </Typography>
                {selectedFile.type === 'application/pdf' && detectedPageSize && (
                  <Tooltip title="Detected page size will be used for the cover page">
                    <Paper elevation={0} sx={{
                      display: 'inline-flex',
                      px: 1,
                      py: 0.5,
                      border: '1px solid',
                      borderColor: 'primary.light',
                      borderRadius: 1
                    }}>
                      <Typography variant="caption" color="primary">
                        {getPageSizeName(detectedPageSize)}
                      </Typography>
                    </Paper>
                  </Tooltip>
                )}
              </Box>
            )}
            {analysisError && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {analysisError}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="title"
            label="Paper Title"
            name="title"
            value={paperData.title}
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
            id="authors"
            label="Authors (comma-separated)"
            name="authors"
            value={paperData.authors}
            onChange={handleChange}
            variant="outlined"
            size="small"
            margin="normal"
            helperText="Enter author names separated by commas"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="abstract"
            label="Abstract"
            name="abstract"
            value={paperData.abstract}
            onChange={handleChange}
            variant="outlined"
            size="small"
            margin="normal"
            multiline
            rows={4}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="keywords"
            label="Keywords (comma-separated)"
            name="keywords"
            value={paperData.keywords}
            onChange={handleChange}
            variant="outlined"
            size="small"
            margin="normal"
            helperText="Enter keywords separated by commas"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="jel"
            label="JEL Classification Codes (comma-separated)"
            name="jel"
            value={paperData.jel}
            onChange={handleChange}
            variant="outlined"
            size="small"
            margin="normal"
            helperText="Enter JEL codes separated by commas (e.g., C61, D81)"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleGenerateCoverPage}
              disabled={!paperData.title || !paperData.authors || generatingCoverPage}
              startIcon={generatingCoverPage ? <CircularProgress size={18} /> : <FileDownloadIcon />}
            >
              {generatingCoverPage ? 'Generating...' : (coverPageFile ? 'Regenerate Cover' : 'Generate Cover')}
            </Button>

            <Button
              variant="outlined"
              color="primary"
              onClick={handleShowPreview}
              disabled={(!previewUrl && !paperData.title) || generatingCoverPage}
              startIcon={<VisibilityIcon />}
            >
              Preview Cover
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading || analyzing || processingPdf || !selectedFile}
            >
              {isLoading || processingPdf ?
                (processingPdf ? 'Processing...' : 'Adding Paper...') :
                'Add Paper'}
            </Button>
          </Box>

          {analyzing && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2, verticalAlign: 'middle' }}>
              Analyzing PDF... This may take a moment.
            </Typography>
          )}

          {processingPdf && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2, verticalAlign: 'middle' }}>
              Uploading files and merging on server... This may take a moment.
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Cover Page Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Cover Page Preview
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
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title="Cover Page Preview"
              style={{
                width: '100%',
                height: '600px',
                border: 'none'
              }}
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="600px">
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Box sx={{ mr: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              Page size: {getPageSizeName(detectedPageSize)}
            </Typography>
          </Box>
          {previewUrl && (
            <Button
              href={previewUrl}
              download="cover-page.pdf"
              color="primary"
            >
              Download
            </Button>
          )}
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
          Add New Paper
        </Typography>
        {formContent}
      </CardContent>
    </Card>
  );
};

export default PaperForm;
