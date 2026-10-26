import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SeriesForm from './SeriesForm';
import { NewSeriesData, SeriesMetadata } from '../../types';

interface SeriesModalProps {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
  // Create mode props
  onSubmit?: (seriesData: NewSeriesData, basePdfFile?: File) => Promise<void>;
  // Edit mode props
  onUpdate?: (seriesId: string, seriesData: Partial<NewSeriesData>) => Promise<void>;
  editMode?: boolean;
  seriesId?: string;
  currentMetadata?: SeriesMetadata;
  isAdmin?: boolean;
}

const SeriesModal: React.FC<SeriesModalProps> = ({
  open,
  onClose,
  isLoading,
  onSubmit,
  onUpdate,
  editMode = false,
  seriesId,
  currentMetadata,
  isAdmin = false
}) => {
  const title = editMode ? 'Edit Series' : 'Create New Series';

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
        <SeriesForm
          onSubmit={onSubmit}
          onUpdate={onUpdate}
          isLoading={isLoading}
          inModal={true}
          editMode={editMode}
          editingSeriesId={seriesId}
          initialData={currentMetadata}
          isAdmin={isAdmin}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SeriesModal;
