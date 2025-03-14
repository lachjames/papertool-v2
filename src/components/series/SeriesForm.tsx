import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Grid
} from '@mui/material';
import { NewSeriesData } from '../../types';

interface SeriesFormProps {
  onSubmit: (seriesData: NewSeriesData) => Promise<void>;
  isLoading: boolean;
  inModal?: boolean;
}

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSeriesData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(seriesData);
      // Only reset form if not in modal (since the modal will close)
      if (!inModal) {
        setSeriesData({ seriesId: '', name: '', institution: '' });
      }
    } catch (error) {
      // Error handling is managed in the parent component
    }
  };

  const formContent = (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: inModal ? 1 : 0 }}>
      <Grid container spacing={2}>
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
        
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            sx={{ mt: 1 }}
          >
            {isLoading ? 'Creating...' : 'Create Series'}
          </Button>
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
          Create New Series
        </Typography>
        {formContent}
      </CardContent>
    </Card>
  );
};

export default SeriesForm;
