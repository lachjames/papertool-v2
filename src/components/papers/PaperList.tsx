import React from 'react';
import { 
  Typography, 
  Card, 
  CardContent,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import { PaperMetadata } from '../../types';
import PaperItem from './PaperItem';
import ScrollableContent from '../common/ScrollableContent';

interface PaperListProps {
  paperIds: string[];
  paperMetadata: Record<string, PaperMetadata>;
  onDeletePaper: (paperId: string) => void;
  isLoading: boolean;
  seriesId: string | null;
}

const PaperList: React.FC<PaperListProps> = ({ 
  paperIds, 
  paperMetadata, 
  onDeletePaper, 
  isLoading,
  seriesId
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!seriesId) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select a series to view papers.
        </Typography>
      </Paper>
    );
  }

  if (paperIds.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No papers found in this series. Add your first paper to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" gutterBottom>
          Papers in Series
        </Typography>
        
        <ScrollableContent maxHeight="calc(100vh - 350px)">
          {paperIds.map((paperId) => (
            <PaperItem
              key={paperId}
              paperId={paperId}
              metadata={paperMetadata[paperId]}
              onDelete={onDeletePaper}
              seriesId={seriesId}
            />
          ))}
        </ScrollableContent>
      </CardContent>
    </Card>
  );
};

export default PaperList;
