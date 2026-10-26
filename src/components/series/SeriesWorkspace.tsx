import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Tabs,
    Tab,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { SeriesMetadata, PaperMetadata, NewPaperData } from '../../types';
import PaperList from '../papers/PaperList';
import PaperModal from '../papers/PaperModal';
import ImportWizard from '../import/ImportWizard';
import ConfirmDialog from '../common/ConfirmDialog';
import { useArchive } from '../../context/ArchiveContext';
import { getSeriesAccess, SeriesAccess } from '../../services/accessService';

interface SeriesWorkspaceProps {
    selectedSeries: string | null;
    selectedSeriesData?: SeriesMetadata;
    onDeselectSeries: () => void;
    paperIds: string[];
    paperMetadata: Record<string, PaperMetadata>;
    totalPaperCount: number;
    suggestedPaperNumber?: string | null;
    papersLoading: boolean;
    papersLoadingMore: boolean;
    papersHasMore: boolean;
    onRefreshPapers: () => Promise<void>;
    onLoadMorePapers: () => Promise<void>;
    onCreatePaper: (paperData: NewPaperData, contentFile: File, coverPageFile?: File | null) => Promise<void>;
    onUpdatePaper: (paperId: string, paperData: Partial<NewPaperData>, contentFile?: File | null, coverPageFile?: File | null) => Promise<void>;
    onDeletePaper: (paperId: string) => Promise<void>;
    isAdmin: boolean;
    ownerOf: string[];
    editorOf: string[];
}

const SeriesWorkspace: React.FC<SeriesWorkspaceProps> = ({
    selectedSeries,
    selectedSeriesData,
    onDeselectSeries,
    paperIds,
    paperMetadata,
    totalPaperCount,
    suggestedPaperNumber,
    papersLoading,
    papersLoadingMore,
    papersHasMore,
    onRefreshPapers,
    onLoadMorePapers,
    onCreatePaper,
    onUpdatePaper,
    onDeletePaper,
    isAdmin,
    ownerOf,
    editorOf
}) => {
    const { selectedArchiveId, archives } = useArchive();
    const [tabValue, setTabValue] = useState(0);
    const [paperModalOpen, setPaperModalOpen] = useState(false);
    const [paperEditMode, setPaperEditMode] = useState(false);
    const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
    const [editingPaperMetadata, setEditingPaperMetadata] = useState<PaperMetadata | null>(null);
    const [paperDeleteConfirm, setPaperDeleteConfirm] = useState<{ open: boolean, paperId: string | null }>({
        open: false,
        paperId: null
    });

    const [accessDialogOpen, setAccessDialogOpen] = useState(false);
    const [seriesAccess, setSeriesAccess] = useState<SeriesAccess | null>(null);
    const [accessLoading, setAccessLoading] = useState(false);
    const [accessError, setAccessError] = useState<string | null>(null);

    const canEdit = selectedSeries ? (isAdmin || ownerOf.includes(selectedSeries) || editorOf.includes(selectedSeries)) : false;
    const canManageAccess = selectedSeries ? (isAdmin || ownerOf.includes(selectedSeries)) : false;
    const currentArchive = archives.find(a => a.id === selectedArchiveId);
    const publicSeriesUrl = React.useMemo(() => {
        if (!selectedSeries || !selectedArchiveId) return null;

        const archiveUrl = currentArchive?.archiveUrl?.trim();
        if (archiveUrl) {
            return `${archiveUrl.replace(/\/+$/, '')}/${selectedSeries}/`;
        }

        const baseUrl = currentArchive?.baseUrl?.trim();
        if (baseUrl) {
            return `${baseUrl.replace(/\/+$/, '')}/RePEc/${selectedArchiveId}/${selectedSeries}/`;
        }

        return null;
    }, [currentArchive, selectedArchiveId, selectedSeries]);
    const visiblePaperCount = paperIds.length;
    const seriesPaperCount = totalPaperCount || visiblePaperCount;
    const showingRecentSubset = seriesPaperCount > visiblePaperCount;

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleCreatePaperClick = () => {
        setPaperEditMode(false);
        setEditingPaperId(null);
        setEditingPaperMetadata(null);
        setPaperModalOpen(true);
    };

    const handleEditPaper = (paperId: string, metadata: PaperMetadata) => {
        setEditingPaperId(paperId);
        setEditingPaperMetadata(metadata);
        setPaperEditMode(true);
        setPaperModalOpen(true);
    };

    const handlePaperModalClose = () => {
        setPaperModalOpen(false);
        setPaperEditMode(false);
        setEditingPaperId(null);
        setEditingPaperMetadata(null);
    };

    const handleCreatePaper = async (paperData: NewPaperData, contentFile: File, coverPageFile?: File | null) => {
        await onCreatePaper(paperData, contentFile, coverPageFile);
        handlePaperModalClose();
    };

    const handleUpdatePaper = async (paperId: string, paperData: Partial<NewPaperData>, contentFile?: File | null, coverPageFile?: File | null) => {
        await onUpdatePaper(paperId, paperData, contentFile, coverPageFile);
        handlePaperModalClose();
    };

    const handleDeletePaperClick = (paperId: string) => {
        setPaperDeleteConfirm({ open: true, paperId });
    };

    const handleConfirmPaperDelete = async () => {
        if (paperDeleteConfirm.paperId) {
            try {
                await onDeletePaper(paperDeleteConfirm.paperId);
            } catch (error) {
                console.error('Error deleting paper:', error);
            } finally {
                setPaperDeleteConfirm({ open: false, paperId: null });
            }
        }
    };

    const handleRefreshPapers = async () => {
        await onRefreshPapers();
    };

    const handleOpenAccessDialog = async () => {
        if (!selectedArchiveId || !selectedSeries || !canManageAccess) return;

        setAccessDialogOpen(true);
        setAccessLoading(true);
        setAccessError(null);

        try {
            const access = await getSeriesAccess(selectedArchiveId, selectedSeries);
            setSeriesAccess(access);
        } catch (error) {
            console.error('Error loading series access:', error);
            setAccessError(error instanceof Error ? error.message : 'Failed to load series access');
        } finally {
            setAccessLoading(false);
        }
    };

    // Empty state when no series selected
    if (!selectedSeries) {
        return (
            <Paper
                elevation={0}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 6,
                    textAlign: 'center'
                }}
            >
                <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom color="text.primary" fontWeight={600}>
                    No Series Selected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                    Select a series from the left sidebar to view and manage its papers.
                </Typography>
            </Paper>
        );
    }

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
            {/* Series Context Header - More compact */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'primary.dark'
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.25 }}>
                        <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Series
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.75rem' }}>
                            {showingRecentSubset
                                ? `${seriesPaperCount} papers · showing ${visiblePaperCount} recent`
                                : `${seriesPaperCount} ${seriesPaperCount === 1 ? 'paper' : 'papers'}`}
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                        {selectedSeriesData?.name || selectedSeries}
                    </Typography>
                    {selectedSeriesData?.institution && (
                        <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.75rem', display: 'block' }}>
                            {selectedSeriesData.institution}
                        </Typography>
                    )}
                    {publicSeriesUrl && (
                        <Typography
                            component="a"
                            href={publicSeriesUrl}
                            target="_blank"
                            rel="noreferrer"
                            variant="caption"
                            sx={{
                                opacity: 0.95,
                                fontSize: '0.75rem',
                                display: 'block',
                                color: 'inherit',
                                textDecoration: 'underline'
                            }}
                        >
                            Public URL: {publicSeriesUrl}
                        </Typography>
                    )}
                </Box>
                <IconButton
                    size="small"
                    onClick={onDeselectSeries}
                    sx={{
                        color: 'white',
                        opacity: 0.8,
                        '&:hover': {
                            opacity: 1,
                            bgcolor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        sx={{
                            minHeight: 44,
                            '& .MuiTab-root': {
                                minHeight: 44,
                                py: 1,
                            }
                        }}
                    >
                        <Tab
                            icon={<DescriptionIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="Papers"
                        />
                        <Tab
                            icon={<CloudUploadIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="Import"
                            disabled={!canEdit}
                        />
                    </Tabs>
                    {tabValue === 0 && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={handleRefreshPapers}
                                size="small"
                                disabled={papersLoading}
                            >
                                Refresh
                            </Button>

                            {canManageAccess && (
                                <Button
                                    variant="outlined"
                                    startIcon={<AdminPanelSettingsIcon />}
                                    onClick={handleOpenAccessDialog}
                                    size="small"
                                    disabled={!selectedArchiveId || accessLoading}
                                >
                                    Access
                                </Button>
                            )}

                            {canEdit && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreatePaperClick}
                                    size="small"
                                >
                                    Add Paper
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {tabValue === 0 && (
                    <PaperList
                        paperIds={paperIds}
                        paperMetadata={paperMetadata}
                        onDeletePaper={handleDeletePaperClick}
                        onEditPaper={handleEditPaper}
                        isLoading={papersLoading}
                        isLoadingMore={papersLoadingMore}
                        hasMore={papersHasMore}
                        totalPaperCount={seriesPaperCount}
                        onLoadMorePapers={onLoadMorePapers}
                        seriesId={selectedSeries}
                    />
                )}
                {tabValue === 1 && (
                    <>
                        {canEdit ? (
                            <>
                                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
                                    Import papers from RePEc archives. All papers will be added to <strong>{selectedSeriesData?.name}</strong>.
                                </Alert>
                                <ImportWizard selectedSeriesId={selectedSeries} />
                            </>
                        ) : (
                            <Alert severity="warning">
                                Only administrators, series owners, and editors can use the import tool.
                            </Alert>
                        )}
                    </>
                )}
            </Box>

            {/* Modals */}
            <PaperModal
                open={paperModalOpen}
                onClose={handlePaperModalClose}
                onSubmit={!paperEditMode ? handleCreatePaper : undefined}
                onUpdate={paperEditMode ? handleUpdatePaper : undefined}
                isLoading={papersLoading}
                seriesSettings={selectedSeriesData}
                suggestedPaperNumber={!paperEditMode ? suggestedPaperNumber : undefined}
                editMode={paperEditMode}
                paperId={editingPaperId || undefined}
                currentMetadata={editingPaperMetadata || undefined}
            />

            <ConfirmDialog
                open={paperDeleteConfirm.open}
                title="Delete Paper"
                message="Are you sure you want to delete this paper? This action cannot be undone."
                confirmLabel="Delete Paper"
                onConfirm={handleConfirmPaperDelete}
                onCancel={() => setPaperDeleteConfirm({ open: false, paperId: null })}
                isDestructive={true}
            />

            <Dialog
                open={accessDialogOpen}
                onClose={() => setAccessDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Series Access</DialogTitle>
                <DialogContent dividers>
                    {accessLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : accessError ? (
                        <Alert severity="error">{accessError}</Alert>
                    ) : seriesAccess ? (
                        <>
                            <Typography variant="subtitle2" gutterBottom>
                                Owners
                            </Typography>
                            <List dense sx={{ pt: 0 }}>
                                {seriesAccess.owners.length > 0 ? seriesAccess.owners.map(email => (
                                    <ListItem key={`owner-${email}`} disableGutters>
                                        <ListItemText primary={email} />
                                    </ListItem>
                                )) : (
                                    <ListItem disableGutters>
                                        <ListItemText primary="No owners assigned" />
                                    </ListItem>
                                )}
                            </List>

                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Editors
                            </Typography>
                            <List dense sx={{ pt: 0 }}>
                                {seriesAccess.editors.length > 0 ? seriesAccess.editors.map(email => (
                                    <ListItem key={`editor-${email}`} disableGutters>
                                        <ListItemText primary={email} />
                                    </ListItem>
                                )) : (
                                    <ListItem disableGutters>
                                        <ListItemText primary="No editors assigned" />
                                    </ListItem>
                                )}
                            </List>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No access data available for this series.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAccessDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default SeriesWorkspace;
