import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { NewPaperData } from '../../types';
import axios from 'axios';
import getBaseURL from '../../getBaseURL';

interface PaperFormProps {
  onSubmit: (paperData: NewPaperData, file: File | null) => Promise<void>;
  isLoading: boolean;
  inModal?: boolean;
}

const PaperForm: React.FC<PaperFormProps> = ({ 
  onSubmit, 
  isLoading,
  inModal = false
}) => {
  const [paperData, setPaperData] = useState<NewPaperData>({
    title: '',
    authors: '',
    abstract: '',
    keywords: '',
    jel: '' // Added JEL classification codes field
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaperData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Clear any previous analysis error when a new file is selected
      setAnalysisError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(paperData, selectedFile);
      // Only reset form if not in modal (since the modal will close)
      if (!inModal) {
        setPaperData({ title: '', authors: '', abstract: '', keywords: '', jel: '' });
        setSelectedFile(null);
      }
    } catch (error) {
      // Error handling is managed in the parent component
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

  const formContent = (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: inModal ? 1 : 0 }}>
      <Grid container spacing={2}>
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
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="upload-file" shrink>
              Upload PDF (optional)
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Selected file: {selectedFile.name}
              </Typography>
            )}
            {analysisError && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {analysisError}
              </Typography>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || analyzing}
            sx={{ mt: 1 }}
          >
            {isLoading ? 'Adding Paper...' : 'Add Paper'}
          </Button>
          {analyzing && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2, verticalAlign: 'middle' }}>
              Analyzing PDF... This may take a moment.
            </Typography>
          )}
        </Grid>
      </Grid>
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
