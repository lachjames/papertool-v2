import React, { useState } from 'react';
import { Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApiProvider } from './context/ApiContext';
import { ArchiveProvider } from './context/ArchiveContext';
import MainLayout from './components/layout/MainLayout';
import ErrorAlert from './components/common/ErrorAlert';
import SeriesSidebar from './components/series/SeriesSidebar';
import SeriesWorkspace from './components/series/SeriesWorkspace';
import ConfirmDialog from './components/common/ConfirmDialog';
import { useSeries } from './hooks/useSeries';
import { usePapers } from './hooks/usePapers';
import { NewSeriesData, NewPaperData } from './types';
import { AuthProvider } from './auth/AuthContext';
import { useAccess } from './hooks/useAccess';
import { AdminPanelProvider } from './context/AdminPanelContext';
import ArchiveAdminPanel from './components/admin/ArchiveAdminPanel';
import CreateArchivePanel from './components/admin/CreateArchivePanel';
import ProtectedRoute from './auth/ProtectedRoute';

// Create a cleaner, flatter theme
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2563eb',
            light: '#3b82f6',
            dark: '#1e40af',
        },
        secondary: {
            main: '#64748b',
            light: '#94a3b8',
            dark: '#475569',
        },
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
        success: {
            main: '#10b981',
        },
        warning: {
            main: '#f59e0b',
        },
        error: {
            main: '#ef4444',
        },
        divider: '#e5e7eb',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
        },
        button: {
            fontWeight: 500,
            fontSize: '0.875rem',
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 4,
                    padding: '6px 14px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    }
                },
                contained: {
                    '&:hover': {
                        boxShadow: 'none',
                    }
                }
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    boxShadow: 'none',
                    border: '1px solid #e5e7eb',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    boxShadow: 'none',
                },
                outlined: {
                    borderColor: '#e5e7eb',
                },
                elevation1: {
                    boxShadow: 'none',
                    border: '1px solid #e5e7eb',
                }
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    height: 24,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                }
            }
        }
    },
    shape: {
        borderRadius: 4,
    },
});

function AppContent() {
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Confirmation dialog states
    const [seriesDeleteConfirm, setSeriesDeleteConfirm] = useState<{ open: boolean, seriesId: string | null }>({
        open: false,
        seriesId: null
    });

    // Access/roles
    const { isAdmin, ownerOf, editorOf, archiveCreatorOf, loading: accessLoading } = useAccess();

    const {
        series,
        loading: seriesLoading,
        error: seriesError,
        createSeries,
        updateSeries,
        deleteSeries
    } = useSeries();

    const {
        paperIds,
        paperMetadata,
        totalPaperCount,
        suggestedPaperNumber,
        hasMore: papersHasMore,
        loading: papersLoading,
        loadingMore: papersLoadingMore,
        error: papersError,
        fetchPapers,
        loadMorePapers,
        createPaper,
        updatePaper,
        deletePaper
    } = usePapers(selectedSeries);

    // Combine errors
    React.useEffect(() => {
        setGlobalError(seriesError || papersError);
    }, [seriesError, papersError]);

    // Series handlers
    const handleCreateSeries = async (seriesData: NewSeriesData) => {
        try {
            await createSeries(seriesData);
        } catch (error) {
            // handled in hook
        }
    };

    const handleUpdateSeries = async (
        seriesId: string,
        seriesData: Partial<NewSeriesData>
    ) => {
        try {
            await updateSeries(seriesId, seriesData);
        } catch (error) {
            console.error('Error updating series:', error);
        }
    };

    // Paper handlers
    const handleCreatePaper = async (paperData: NewPaperData, contentFile: File, coverPageFile?: File | null) => {
        try {
            await createPaper(paperData, contentFile, coverPageFile);
        } catch (error) {
            console.error('Error creating paper:', error);
        }
    };

    const handleUpdatePaper = async (
        paperId: string,
        paperData: Partial<NewPaperData>,
        contentFile?: File | null,
        coverPageFile?: File | null
    ) => {
        try {
            await updatePaper(paperId, paperData, contentFile, coverPageFile);
        } catch (error) {
            console.error('Error updating paper:', error);
        }
    };

    // Delete handlers
    const handleDeleteSeriesClick = (seriesId: string) => {
        setSeriesDeleteConfirm({
            open: true,
            seriesId
        });
    };

    const handleConfirmSeriesDelete = async () => {
        if (seriesDeleteConfirm.seriesId) {
            try {
                await deleteSeries(seriesDeleteConfirm.seriesId);
                if (selectedSeries === seriesDeleteConfirm.seriesId) {
                    setSelectedSeries(null);
                }
            } catch (error) {
                console.error('Error deleting series:', error);
            } finally {
                setSeriesDeleteConfirm({ open: false, seriesId: null });
            }
        }
    };

    const handleSelectSeries = (seriesId: string) => {
        setSelectedSeries(seriesId);
    };

    const handleDeselectSeries = () => {
        setSelectedSeries(null);
    };

    const selectedSeriesData = series.find(s => s.seriesId === selectedSeries);

    return (
        <MainLayout>
            <ErrorAlert
                error={globalError}
                onDismiss={() => setGlobalError(null)}
            />

            <Box sx={{ 
                display: 'flex', 
                height: '100%',
                gap: 2,
                overflow: 'hidden'
            }}>
                {/* Left Sidebar - Series List */}
                <Box sx={{ 
                    width: 280,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <SeriesSidebar
                        series={series}
                        selectedSeries={selectedSeries}
                        onSelectSeries={handleSelectSeries}
                        onDeleteSeries={handleDeleteSeriesClick}
                        onCreateSeries={handleCreateSeries}
                        onUpdateSeries={handleUpdateSeries}
                        isLoading={seriesLoading || accessLoading}
                        isAdmin={isAdmin}
                        archiveCreatorOf={archiveCreatorOf}
                        ownerOf={ownerOf}
                    />
                </Box>

                {/* Right Content Area - Series Workspace */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    minWidth: 0,
                    position: 'relative' // For admin panel overlay
                }}>
                    {/* Series workspace - always mounted */}
                    <SeriesWorkspace
                        selectedSeries={selectedSeries}
                        selectedSeriesData={selectedSeriesData}
                        onDeselectSeries={handleDeselectSeries}
                        paperIds={paperIds}
                        paperMetadata={paperMetadata}
                        totalPaperCount={totalPaperCount}
                        suggestedPaperNumber={suggestedPaperNumber}
                        papersLoading={papersLoading}
                        papersLoadingMore={papersLoadingMore}
                        papersHasMore={papersHasMore}
                        onRefreshPapers={fetchPapers}
                        onLoadMorePapers={loadMorePapers}
                        onCreatePaper={handleCreatePaper}
                        onUpdatePaper={handleUpdatePaper}
                        onDeletePaper={deletePaper}
                        isAdmin={isAdmin}
                        ownerOf={ownerOf}
                        editorOf={editorOf}
                    />

                    {/* Admin panel overlay - covers workspace when open */}
                    <ArchiveAdminPanel />
                    <CreateArchivePanel />
                </Box>
            </Box>

            <ConfirmDialog
                open={seriesDeleteConfirm.open}
                title="Delete Series"
                message={`Are you sure you want to delete the series "${seriesDeleteConfirm.seriesId}"? This will permanently delete all papers in this series and cannot be undone.`}
                confirmLabel="Delete Series"
                onConfirm={handleConfirmSeriesDelete}
                onCancel={() => setSeriesDeleteConfirm({ open: false, seriesId: null })}
                isDestructive={true}
            />
        </MainLayout>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <ApiProvider>
                    <ArchiveProvider>
                        <AdminPanelProvider>
                            <ProtectedRoute>
                                <AppContent />
                            </ProtectedRoute>
                        </AdminPanelProvider>
                    </ArchiveProvider>
                </ApiProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
