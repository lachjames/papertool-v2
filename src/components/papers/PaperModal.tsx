import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaperForm from './PaperForm';
import { NewPaperData, PaperMetadata, SeriesMetadata } from '../../types';

interface PaperModalProps {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
  seriesSettings?: SeriesMetadata;
  suggestedPaperNumber?: string | null;
  // Create mode props
  onSubmit?: (paperData: NewPaperData, contentFile: File, coverPageFile?: File | null) => Promise<void>;
  // Edit mode props
  onUpdate?: (paperId: string, paperData: Partial<NewPaperData>, contentFile?: File | null, coverPageFile?: File | null) => Promise<void>;
  editMode?: boolean;
  paperId?: string;
  currentMetadata?: PaperMetadata;
}

const PaperModal: React.FC<PaperModalProps> = ({
  open,
  onClose,
  isLoading,
  seriesSettings,
  suggestedPaperNumber,
  onSubmit,
  onUpdate,
  editMode = false,
  paperId,
  currentMetadata
}) => {
  const title = editMode ? 'Edit Paper' : 'Add New Paper';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
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
        <PaperForm
          onSubmit={onSubmit}
          onUpdate={onUpdate}
          isLoading={isLoading}
          inModal={true}
          seriesSettings={seriesSettings}
          suggestedPaperNumber={suggestedPaperNumber}
          editMode={editMode}
          paperId={paperId}
          initialData={currentMetadata}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PaperModal;
