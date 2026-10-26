import React from 'react';
import { 
  Button, 
  Typography, 
  Card, 
  CardContent,
  Box,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // NEW: Edit icon
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import { SeriesMetadata } from '../../types';
import ScrollableContent from '../common/ScrollableContent';
import { useAdminPanel } from '../../context/AdminPanelContext';

interface SeriesListProps {
  series: SeriesMetadata[];
  onSelectSeries: (seriesId: string) => void;
  onDeleteSeries: (seriesId: string) => void;
  onEditSeries: (seriesId: string, metadata: SeriesMetadata) => void; // NEW: Edit callback
  selectedSeries: string | null;
  isLoading: boolean;
  isAdmin?: boolean;
  ownerOf?: string[];
}

const SeriesList: React.FC<SeriesListProps> = ({ 
  series, 
  onSelectSeries, 
  onDeleteSeries,
  onEditSeries, // NEW: Edit callback
  selectedSeries,
  isLoading,
  isAdmin = false,
  ownerOf = []
}) => {
  const { close: closeAdminOverlay } = useAdminPanel();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (series.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No series available. Create your first series to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" gutterBottom>
          Available Series
        </Typography>
        
        <ScrollableContent maxHeight="calc(100vh - 300px)">
          <Grid container spacing={2}>
            {series.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.seriesId}>
                <Paper
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: selectedSeries === item.seriesId ? 'primary.main' : 'divider',
                    bgcolor: selectedSeries === item.seriesId ? 'action.selected' : 'background.paper',
                    boxShadow: selectedSeries === item.seriesId ? '0 0 0 2px rgba(25, 118, 210, 0.2)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      borderColor: 'primary.light'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                      <SchoolIcon />
                    </Avatar>
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'medium' }}>
                      {item.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>
                    {item.institution}
                  </Typography>
                  
                  {item.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }} noWrap>
                      {item.description}
                    </Typography>
                  )}
                  
                  <Chip 
                    label={`${item.paperCount} papers`} 
                    size="small" 
                    sx={{ alignSelf: 'flex-start', mb: 1 }}
                  />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    ID: {item.seriesId}
                  </Typography>
                  
                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
                    <Button
                      size="small"
                      color="primary"
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        closeAdminOverlay();
                        onSelectSeries(item.seriesId);
                      }}
                      fullWidth
                    >
                      Select
                    </Button>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {(() => {
                        const canEditSeries = isAdmin || ownerOf.includes(item.seriesId);
                        const editBtn = (
                          <span style={{ flex: 1 }}>
                            <Button
                              size="small"
                              color="primary"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => onEditSeries(item.seriesId, item)}
                              sx={{ flex: 1 }}
                              disabled={!canEditSeries}
                            >
                              Edit
                            </Button>
                          </span>
                        );
                        return canEditSeries ? (
                          editBtn
                        ) : (
                          <Tooltip title="Only admins and series owners can edit series settings.">{editBtn}</Tooltip>
                        );
                      })()}
                      
                      {isAdmin && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => onDeleteSeries(item.seriesId)}
                          sx={{ flex: 1 }}
                        >
                          Delete
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </ScrollableContent>
      </CardContent>
    </Card>
  );
};

export default SeriesList;
