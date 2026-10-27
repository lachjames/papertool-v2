import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    CircularProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { SeriesMetadata, NewSeriesData } from '../../types';
import SeriesModal from './SeriesModal';
import { useArchive } from '../../context/ArchiveContext';
import { useAdminPanel } from '../../context/AdminPanelContext';

interface SeriesSidebarProps {
    series: SeriesMetadata[];
    selectedSeries: string | null;
    onSelectSeries: (seriesId: string) => void;
    onDeleteSeries: (seriesId: string) => void;
    onCreateSeries: (data: NewSeriesData) => Promise<void>;
    onUpdateSeries: (seriesId: string, data: Partial<NewSeriesData>) => Promise<void>;
    isLoading: boolean;
    isAdmin: boolean;
    archiveCreatorOf: string[];
    ownerOf: string[];
}

const SeriesSidebar: React.FC<SeriesSidebarProps> = ({
    series,
    selectedSeries,
    onSelectSeries,
    onDeleteSeries,
    onCreateSeries,
    onUpdateSeries,
    isLoading,
    isAdmin,
    archiveCreatorOf,
    ownerOf
}) => {
    const { selectedArchiveId } = useArchive();
    const { close: closeAdminOverlay } = useAdminPanel();
    const archiveSelected = !!selectedArchiveId;

    const canCreateAnySeries = isAdmin || archiveCreatorOf.length > 0;
    const canCreateInSelectedArchive = !!(
        archiveSelected &&
        (isAdmin || (selectedArchiveId && archiveCreatorOf.includes(selectedArchiveId)))
    );

    const [seriesModalOpen, setSeriesModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
    const [editingSeriesMetadata, setEditingSeriesMetadata] = useState<SeriesMetadata | null>(null);

    const handleCreateClick = () => {
        setEditMode(false);
        setEditingSeriesId(null);
        setEditingSeriesMetadata(null);
        setSeriesModalOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, seriesId: string, metadata: SeriesMetadata) => {
        e.stopPropagation();
        setEditMode(true);
        setEditingSeriesId(seriesId);
        setEditingSeriesMetadata(metadata);
        setSeriesModalOpen(true);
    };

    const handleModalClose = () => {
        setSeriesModalOpen(false);
        setEditMode(false);
        setEditingSeriesId(null);
        setEditingSeriesMetadata(null);
    };

    const handleSubmit = async (data: NewSeriesData) => {
        await onCreateSeries(data);
        handleModalClose();
    };

    const handleUpdate = async (seriesId: string, data: Partial<NewSeriesData>) => {
        await onUpdateSeries(seriesId, data);
        handleModalClose();
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 2,
                pb: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        Series
                    </Typography>
                    {canCreateAnySeries && (
                        <Tooltip
                            title={
                                !archiveSelected
                                    ? 'Select an archive first'
                                    : canCreateInSelectedArchive
                                        ? 'Create series'
                                        : 'You do not have permission to create series in this archive'
                            }
                        >
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={!canCreateInSelectedArchive}
                                    onClick={handleCreateClick}
                                    sx={{ 
                                        width: 24, 
                                        height: 24,
                                        color: 'primary.main'
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {series.length} available
                </Typography>
            </Box>

            {/* Series List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : series.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8125rem' }}>
                            {archiveSelected ? 'No series available' : 'Select an archive to view or create series'}
                        </Typography>
                        {canCreateInSelectedArchive && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleCreateClick}
                            >
                                Create Series
                            </Button>
                        )}
                    </Box>
                ) : (
                    <List sx={{ py: 0.5, px: 1 }} dense>
                        {series.map((item) => {
                            const isSelected = selectedSeries === item.seriesId;
                            const canEdit = isAdmin || ownerOf.includes(item.seriesId);

                            return (
                                <ListItem
                                    key={item.seriesId}
                                    disablePadding
                                    secondaryAction={
                                        isSelected && (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {canEdit && (
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={(e) => handleEditClick(e, item.seriesId, item)}
                                                        sx={{ 
                                                            width: 28, 
                                                            height: 28, 
                                                            color: 'rgba(255,255,255,0.9)',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255,255,255,0.1)'
                                                            }
                                                        }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                )}
                                                {isAdmin && (
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteSeries(item.seriesId);
                                                        }}
                                                        sx={{ 
                                                            width: 28, 
                                                            height: 28, 
                                                            color: 'rgba(255,255,255,0.9)',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255,255,255,0.1)'
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        )
                                    }
                                    sx={{ mb: 0.5 }}
                                >
                                    <ListItemButton
                                        selected={isSelected}
                                        onClick={() => {
                                            closeAdminOverlay();
                                            onSelectSeries(item.seriesId);
                                        }}
                                        sx={{
                                            borderRadius: 1,
                                            py: 1,
                                            px: 1.5,
                                            '&.Mui-selected': {
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                },
                                            },
                                            '&:hover': {
                                                bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: isSelected ? 7 : 0 }}>
                                                    <Typography 
                                                        variant="body2" 
                                                        fontWeight={isSelected ? 600 : 500} 
                                                        sx={{ 
                                                            fontSize: '0.875rem', 
                                                            flex: 1, 
                                                            pr: 1,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {item.name}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{
                                                            color: isSelected ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {item.paperCount}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{
                                                        color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                                                        fontSize: '0.75rem',
                                                        display: 'block',
                                                        mt: 0.25,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {item.institution}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Box>

            {/* Modal */}
            <SeriesModal
                open={seriesModalOpen}
                onClose={handleModalClose}
                onSubmit={!editMode ? handleSubmit : undefined}
                onUpdate={editMode ? handleUpdate : undefined}
                isLoading={isLoading}
                editMode={editMode}
                seriesId={editingSeriesId || undefined}
                currentMetadata={editingSeriesMetadata || undefined}
                isAdmin={isAdmin}
            />
        </Paper>
    );
};

export default SeriesSidebar;
