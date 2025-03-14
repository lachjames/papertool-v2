import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton,
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaperForm from './PaperForm';
import { NewPaperData } from '../../types';

interface CreatePaperModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (paperData: NewPaperData, file: File | null) => Promise<void>;
  isLoading: boolean;
}

const CreatePaperModal: React.FC<CreatePaperModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 2 }}>
        Add New Paper
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
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Fill in the paper details manually or upload a PDF and click the magic wand icon to auto-extract metadata.
          </Typography>
        </Box>
        <PaperForm 
          onSubmit={onSubmit} 
          isLoading={isLoading}
          inModal={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaperModal;
