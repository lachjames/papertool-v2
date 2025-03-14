import React from 'react';
import {
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Link,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import ErrorIcon from '@mui/icons-material/Error';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { PaperMetadata } from '../../types';

interface PaperItemProps {
  paperId: string;
  metadata: PaperMetadata | undefined;
  onDelete: (paperId: string) => void;
  seriesId: string;
}

// This could be a configuration value imported from a central config
const REPEC_ARCHIVE_HANDLE = 'ajr';

const PaperItem: React.FC<PaperItemProps> = ({ paperId, metadata, onDelete, seriesId }) => {
  // Loading state
  if (!metadata) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={20} />
        <Box>
          <Typography variant="body2">Loading paper details...</Typography>
          <Typography variant="caption" color="text.secondary">
            Paper ID: {paperId}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Error state for papers with metadata loading errors
  if ('loadError' in metadata && metadata.loadError) {
    return (
      <Paper elevation={1} sx={{ 
        p: 2, 
        mb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        bgcolor: '#fff8f8', 
        border: '1px solid #ffcccc'
      }}>
        <ErrorIcon color="error" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" color="error">
            Error loading paper metadata
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Paper ID: {paperId}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => onDelete(paperId)}
        >
          Delete
        </Button>
      </Paper>
    );
  }

  // Check for minimal valid metadata
  const isMetadataIncomplete = !metadata.title || metadata.authors.length === 0;
  
  if (isMetadataIncomplete) {
    return (
      <Paper elevation={1} sx={{ 
        p: 2, 
        mb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        bgcolor: '#fffde7',
        border: '1px solid #fff59d'
      }}>
        <ReportProblemIcon color="warning" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" color="warning.dark">
            Incomplete paper metadata
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Paper ID: {paperId}
          </Typography>
          {metadata.title && (
            <Typography variant="body2">
              Title: {metadata.title}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => onDelete(paperId)}
        >
          Delete
        </Button>
      </Paper>
    );
  }

  // PDF URL according to RePEc structure
  const pdfUrl = `https://papertool-v2-storage.s3.us-east-1.amazonaws.com/RePEc/${REPEC_ARCHIVE_HANDLE}/${seriesId}/papers/${paperId}.pdf`;

  return (
    <Accordion sx={{ 
      mb: 2, 
      '&:before': { display: 'none' },
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderRadius: '8px !important',
      overflow: 'hidden'
    }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-${paperId}-content`}
        id={`panel-${paperId}-header`}
        sx={{ 
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <DescriptionIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {metadata.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {metadata.authors.join(', ')} • {new Date(metadata.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
          {metadata.hasPDF && (
            <Chip 
              icon={<PictureAsPdfIcon fontSize="small" />} 
              label="PDF" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ mr: 1 }}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2, bgcolor: 'background.paper' }}>
        {metadata.abstract && (
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary">
              <strong>Abstract:</strong> {metadata.abstract}
            </Typography>
          </Box>
        )}
        
        {(metadata?.keywords?.length ?? 0) > 0 && (
          <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
            {metadata.keywords!.map((keyword, index) => (
              <Chip 
                key={index} 
                label={keyword} 
                size="small" 
                variant="outlined"
                sx={{ bgcolor: 'background.default' }}
              />
            ))}
          </Box>
        )}
        
        {/* Display JEL codes if available */}
        {(metadata?.jel?.length ?? 0) > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>JEL Classification:</strong> {metadata.jel!.join(', ')}
            </Typography>
          </Box>
        )}
        
        <Box mt={2} mb={1}>
          <Typography variant="caption" color="text.secondary">
            Created: {new Date(metadata.createdAt).toLocaleDateString()}
          </Typography>
          {metadata.createdAt !== metadata.updatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Updated: {new Date(metadata.updatedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {metadata.hasPDF ? (
            <Link 
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              underline="none"
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdfIcon />}
                color="primary"
              >
                View PDF
              </Button>
            </Link>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No PDF available
            </Typography>
          )}
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion from toggling
              onDelete(paperId);
            }}
          >
            Delete
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default PaperItem;
