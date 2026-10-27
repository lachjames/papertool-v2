import React from 'react';
import {
    Typography,
    Box,
    CircularProgress,
    Button
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { PaperMetadata } from '../../types';
import PaperItem from './PaperItem';

interface PaperListProps {
    paperIds: string[];
    paperMetadata: Record<string, PaperMetadata>;
    onDeletePaper: (paperId: string) => void;
    onEditPaper: (paperId: string, metadata: PaperMetadata) => void;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    totalPaperCount: number;
    onLoadMorePapers: () => Promise<void> | void;
    seriesId: string | null;
}

const PaperList: React.FC<PaperListProps> = ({
    paperIds,
    paperMetadata,
    onDeletePaper,
    onEditPaper,
    isLoading,
    isLoadingMore,
    hasMore,
    totalPaperCount,
    onLoadMorePapers,
    seriesId
}) => {
    if (isLoading && paperIds.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={8}>
                <CircularProgress />
            </Box>
        );
    }

    if (!seriesId) {
        return null;
    }

    if (paperIds.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 8,
                    textAlign: 'center'
                }}
            >
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                    }}
                >
                    <DescriptionIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                </Box>
                <Typography variant="h6" gutterBottom color="text.primary" fontWeight={600}>
                    No Papers Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                    This series doesn't have any papers yet. Click "Add Paper" above to create your first paper, or use the Import/Migrate tab to import papers from RePEc.
                </Typography>
            </Box>
        );
    }

    const loadedCount = paperIds.length;
    const totalCount = totalPaperCount || loadedCount;
    const showingSubset = totalCount > loadedCount;

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    {showingSubset
                        ? `Showing ${loadedCount} most recent of ${totalCount} papers in this series`
                        : `${totalCount} ${totalCount === 1 ? 'paper' : 'papers'} in this series`}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {paperIds.map((paperId) => (
                    <PaperItem
                        key={paperId}
                        paperId={paperId}
                        metadata={paperMetadata[paperId]}
                        onDelete={onDeletePaper}
                        onEdit={onEditPaper}
                        seriesId={seriesId}
                    />
                ))}
            </Box>

            {hasMore && (
                <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={onLoadMorePapers}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                        {isLoadingMore ? 'Loading older papers...' : 'Load Older Papers'}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default PaperList;
