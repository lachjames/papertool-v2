import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
    Visibility as PreviewIcon
} from '@mui/icons-material';
import { SeriesAsset, SeriesAssetType, uploadAsset, deleteAsset, validateImageFile } from '../../services/assetService';
import { useArchive } from '../../context/ArchiveContext';

interface AssetUploaderProps {
    seriesId: string;
    type: SeriesAssetType;
    currentAsset?: SeriesAsset;
    onAssetChange: (asset: SeriesAsset | null) => void;
    disabled?: boolean;
}

const AssetUploader: React.FC<AssetUploaderProps> = ({
    seriesId,
    type,
    currentAsset,
    onAssetChange,
    disabled = false
}) => {
    const { selectedArchiveId } = useArchive();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        if (!selectedArchiveId) {
            setError('Select an archive before uploading assets.');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const asset = await uploadAsset(selectedArchiveId, seriesId, type, file);
            onAssetChange(asset);
        } catch (err) {
            console.error('Error uploading asset:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload asset');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async () => {
        if (!currentAsset) return;

        if (!selectedArchiveId) {
            setError('Select an archive before deleting assets.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            await deleteAsset(selectedArchiveId, seriesId, type);
            onAssetChange(null);
        } catch (err) {
            console.error('Error deleting asset:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete asset');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getTypeLabel = () => {
        if (type === 'logo') return 'Logo';
        if (type === 'header') return 'Header Image';
        if (type === 'footer') return 'Footer Image';
        return 'Background Image';
    };

    const getTypeDescription = () => {
        if (type === 'logo') {
            return 'Upload a logo image (will be resized if larger)';
        }
        if (type === 'header') {
            return 'Upload a header image (will be resized if larger)';
        }
        if (type === 'footer') {
            return 'Upload a footer image (will be resized if larger)';
        }
        return 'Upload a full-page background image for custom cover templates (will be resized for PDF generation)';
    };

    const getTypeChipLabel = () => {
        if (type === 'logo') return 'Logo';
        if (type === 'header') return 'Header';
        if (type === 'footer') return 'Footer';
        return 'Background';
    };

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {getTypeLabel()}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {getTypeDescription()}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {currentAsset ? (
                    <Box>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <ImageIcon color="primary" />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                    {currentAsset.filename}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatFileSize(currentAsset.size)} • Uploaded {new Date(currentAsset.uploadedAt).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <Chip
                                label={getTypeChipLabel()}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                startIcon={<PreviewIcon />}
                                onClick={() => setPreviewOpen(true)}
                                size="small"
                            >
                                Preview
                            </Button>

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDelete}
                                disabled={uploading || disabled || !selectedArchiveId}
                                size="small"
                            >
                                {uploading ? <CircularProgress size={16} /> : 'Delete'}
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<UploadIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading || disabled || !selectedArchiveId}
                                size="small"
                            >
                                Replace
                            </Button>
                        </Stack>
                    </Box>
                ) : (
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || disabled || !selectedArchiveId}
                            fullWidth
                            sx={{ mb: 1 }}
                        >
                            {uploading ? 'Uploading...' : `Upload ${getTypeLabel()}`}
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                            Supported formats: JPEG, PNG, GIF, WebP, SVG (max 10MB)
                        </Typography>
                    </Box>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                <Dialog
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {getTypeLabel()} Preview
                    </DialogTitle>
                    <DialogContent>
                        {currentAsset && (
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                <img
                                    src={currentAsset.url}
                                    alt={`${type} preview`}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '400px',
                                        objectFit: 'contain'
                                    }}
                                />
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    {currentAsset.filename} • {formatFileSize(currentAsset.size)}
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default AssetUploader;
