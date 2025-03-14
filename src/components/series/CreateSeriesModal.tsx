import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SeriesForm from './SeriesForm';
import { NewSeriesData } from '../../types';

interface CreateSeriesModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (seriesData: NewSeriesData) => Promise<void>;
  isLoading: boolean;
}

const CreateSeriesModal: React.FC<CreateSeriesModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 2 }}>
        Create New Series
        <IconButton
          aria-label="close"
          onClick={onClose}
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
        <SeriesForm 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
          inModal={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateSeriesModal;
