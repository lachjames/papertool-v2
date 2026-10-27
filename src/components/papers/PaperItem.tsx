import React, { useState } from 'react';
import {
    Typography,
    Button,
    Box,
    Chip,
    CircularProgress,
    Link,
    Paper,
    Divider,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorIcon from '@mui/icons-material/Error';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { PaperMetadata } from '../../types';
import { useArchive } from '../../context/ArchiveContext';
import getBaseURL from '../../getBaseURL';
import { DECLARATION_FIELDS, describeDeclaration } from '../../utilities/declarations';

interface PaperItemProps {
    paperId: string;
    metadata: PaperMetadata | undefined;
    onDelete: (paperId: string) => void;
    onEdit: (paperId: string, metadata: PaperMetadata) => void;
    seriesId: string;
}

const PaperItem: React.FC<PaperItemProps> = ({ paperId, metadata, onDelete, onEdit, seriesId }) => {
    const { selectedArchiveId, archives } = useArchive();
    const [copied, setCopied] = useState(false);

    // Loading state
    if (!metadata) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                    Loading... (ID: {paperId})
                </Typography>
            </Paper>
        );
    }

    // Error state
    if ('loadError' in metadata && metadata.loadError) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: '#fef2f2',
                    border: '1px solid #fecaca'
                }}
            >
                <ErrorIcon sx={{ fontSize: 20, color: 'error.main' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="error.main" fontWeight={500}>
                        Error loading metadata
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ID: {paperId}
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

    // Incomplete metadata
    const isMetadataIncomplete = !metadata.title || metadata.authors.length === 0;

    if (isMetadataIncomplete) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: '#fffbeb',
                    border: '1px solid #fde68a'
                }}
            >
                <ReportProblemIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="warning.dark" fontWeight={500}>
                        Incomplete metadata
                    </Typography>
                    {metadata.title && (
                        <Typography variant="caption" color="text.secondary">
                            {metadata.title}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => onEdit(paperId, metadata)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => onDelete(paperId)}
                    >
                        Delete
                    </Button>
                </Box>
            </Paper>
        );
    }

    const archiveHandle = selectedArchiveId || 'unknown';
    const pdfUrl = getBaseURL(`archives/${archiveHandle}/series/${seriesId}/papers/${paperId}/pdf`);

    // Public (unauthenticated) S3 link, the same URL RePEc receives as File-URL. Built from
    // the archive's configured base URL rather than a hard-coded bucket host.
    const currentArchive = archives.find(a => a.id === selectedArchiveId);
    const publicBase = (
        currentArchive?.archiveUrl ||
        (currentArchive?.baseUrl ? `${currentArchive.baseUrl.replace(/\/+$/, '')}/RePEc/${archiveHandle}/` : '')
    ).trim();
    const publicPdfUrl = publicBase
        ? `${publicBase.replace(/\/+$/, '')}/${seriesId}/${paperId}.pdf`
        : null;

    const handleCopyPublicLink = async () => {
        if (!publicPdfUrl) return;
        try {
            await navigator.clipboard.writeText(publicPdfUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Clipboard write failed:', error);
            // Fallback for browsers/contexts without clipboard access
            window.prompt('Copy the public PDF link:', publicPdfUrl);
        }
    };

    const displayDateSource = metadata.publicationDate || metadata.createdAt || metadata.updatedAt;
    const displayDate = displayDateSource ? new Date(displayDateSource).toLocaleDateString() : '';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'border-color 0.15s ease',
                '&:hover': {
                    borderColor: 'primary.main',
                }
            }}
        >
            {/* Title */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem', lineHeight: 1.4 }}>
                {metadata.title}
            </Typography>

            {/* Authors and Date */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8125rem' }}>
                {metadata.authors.join(', ')} · {displayDate}
            </Typography>

            {/* Abstract */}
            {metadata.abstract && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 1.5,
                        fontSize: '0.8125rem',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {metadata.abstract}
                </Typography>
            )}

            {/* Tags */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                {metadata.hasPDF && (
                    <Chip
                        icon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                        label="PDF Available"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                )}
                {metadata.paperNumber && (
                    <Chip
                        label={`No. ${metadata.paperNumber}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                )}
                {metadata.jel && metadata.jel.length > 0 && (
                    <Chip
                        label={`JEL: ${metadata.jel.join(', ')}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                )}
                {metadata.keywords?.slice(0, 3).map((keyword, index) => (
                    <Chip
                        key={index}
                        label={keyword}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                ))}
                {metadata.keywords && metadata.keywords.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        +{metadata.keywords.length - 3} more
                    </Typography>
                )}
            </Box>

            {/* Research integrity declarations (absent on historic papers => "Not provided") */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
                    Declarations
                </Typography>
                {DECLARATION_FIELDS.map(field => (
                    <Typography key={field.key} variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                        {field.label}: {describeDeclaration(metadata.declarations?.[field.key])}
                    </Typography>
                ))}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                {metadata.hasPDF && (
                    <Link href={pdfUrl} target="_blank" rel="noreferrer" underline="none">
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<PictureAsPdfIcon />}
                        >
                            View PDF
                        </Button>
                    </Link>
                )}
                {metadata.hasPDF && publicPdfUrl && (
                    <Tooltip title={publicPdfUrl}>
                        <Button
                            variant="outlined"
                            size="small"
                            color={copied ? 'success' : 'primary'}
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopyPublicLink}
                        >
                            {copied ? 'Copied!' : 'Copy public link'}
                        </Button>
                    </Tooltip>
                )}
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(paperId, metadata)}
                >
                    Edit
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => onDelete(paperId)}
                >
                    Delete
                </Button>
            </Box>
        </Paper>
    );
};

export default PaperItem;
