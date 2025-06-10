import React, { useState } from 'react';
import { Box, Tab, Tabs, Button, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AddIcon from '@mui/icons-material/Add';
import { ApiProvider } from './context/ApiContext';
import MainLayout from './components/layout/MainLayout';
import ErrorAlert from './components/common/ErrorAlert';
import SeriesList from './components/series/SeriesList';
import PaperList from './components/papers/PaperList';
import TabPanel from './components/common/TabPanel';
import CreateSeriesModal from './components/series/CreateSeriesModal';
import CreatePaperModal from './components/papers/CreatePaperModal';
import ConfirmDialog from './components/common/ConfirmDialog';
import { useSeries } from './hooks/useSeries';
import { usePapers } from './hooks/usePapers';
import { NewSeriesData, NewPaperData } from './types';

// Tab icons
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DescriptionIcon from '@mui/icons-material/Description';
import { AuthProvider } from './auth/AuthContext';

// Create a theme instance
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f7f9fc'
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
                outlined: {
                    borderColor: '#e0e0e0',
                },
            },
        },
    },
});

function AppContent() {
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);

    // Modal states
    const [seriesModalOpen, setSeriesModalOpen] = useState(false);
    const [paperModalOpen, setPaperModalOpen] = useState(false);

    // Confirmation dialog states
    const [seriesDeleteConfirm, setSeriesDeleteConfirm] = useState<{ open: boolean, seriesId: string | null }>({
        open: false,
        seriesId: null
    });
    const [paperDeleteConfirm, setPaperDeleteConfirm] = useState<{ open: boolean, paperId: string | null }>({
        open: false,
        paperId: null
    });

    const {
        series,
        loading: seriesLoading,
        error: seriesError,
        createSeries,
        deleteSeries
    } = useSeries();

    const {
        paperIds,
        paperMetadata,
        loading: papersLoading,
        error: papersError,
        createPaper,
        deletePaper
    } = usePapers(selectedSeries);

    // Combine errors
    React.useEffect(() => {
        setGlobalError(seriesError || papersError);
    }, [seriesError, papersError]);

    const handleCreateSeries = async (seriesData: NewSeriesData) => {
        try {
            await createSeries(seriesData);
            setSeriesModalOpen(false);
        } catch (error) {
            // Error is already handled in the hook
        }
    };

    // Find this function in your App.tsx
    const handleCreatePaper = async (paperData: NewPaperData, contentFile: File, coverPageFile?: File | null) => {
        try {
            // Make sure you're passing all three parameters to createPaper
            await createPaper(paperData, contentFile, coverPageFile);
            setPaperModalOpen(false);
        } catch (error) {
            // Error handling
            console.error('Error creating paper:', error);
        }
    };

    // Updated delete handlers with confirmation
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
                // If we're deleting the currently selected series, clear it
                if (selectedSeries === seriesDeleteConfirm.seriesId) {
                    setSelectedSeries(null);
                }
            } catch (error) {
                // Error is handled in the hook
                console.error("Error deleting series:", error);
            } finally {
                // Close the confirmation dialog
                setSeriesDeleteConfirm({
                    open: false,
                    seriesId: null
                });
            }
        }
    };

    const handleDeletePaperClick = (paperId: string) => {
        setPaperDeleteConfirm({
            open: true,
            paperId
        });
    };

    const handleConfirmPaperDelete = async () => {
        if (paperDeleteConfirm.paperId) {
            try {
                await deletePaper(paperDeleteConfirm.paperId);
            } catch (error) {
                // Error is handled in the hook
                console.error("Error deleting paper:", error);
            } finally {
                // Close the confirmation dialog
                setPaperDeleteConfirm({
                    open: false,
                    paperId: null
                });
            }
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSelectSeries = (seriesId: string) => {
        setSelectedSeries(seriesId);
        // Automatically switch to Papers tab when a series is selected
        setTabValue(1);
    };

    return (
        <MainLayout>
            <ErrorAlert
                error={globalError}
                onDismiss={() => setGlobalError(null)}
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="application tabs"
                    variant="standard"
                >
                    <Tab
                        icon={<FormatListBulletedIcon />}
                        label="SERIES MANAGEMENT"
                        id="tab-0"
                        aria-controls="tabpanel-0"
                    />
                    <Tab
                        icon={<DescriptionIcon />}
                        label="PAPERS MANAGEMENT"
                        id="tab-1"
                        aria-controls="tabpanel-1"
                        disabled={!selectedSeries}
                    />
                </Tabs>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        {selectedSeries ? `Series "${selectedSeries}"` : 'Select a series to view papers'}
                    </Typography>
                    {tabValue === 0 && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setSeriesModalOpen(true)}
                        >
                            Create New Series
                        </Button>
                    )}
                    {tabValue === 1 && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setPaperModalOpen(true)}
                            disabled={!selectedSeries}
                        >
                            Add New Paper
                        </Button>
                    )}
                </div>
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <TabPanel value={tabValue} index={0}>
                    <SeriesList
                        series={series}
                        onSelectSeries={handleSelectSeries}
                        onDeleteSeries={handleDeleteSeriesClick}
                        selectedSeries={selectedSeries}
                        isLoading={seriesLoading}
                    />

                    <CreateSeriesModal
                        open={seriesModalOpen}
                        onClose={() => setSeriesModalOpen(false)}
                        onSubmit={handleCreateSeries}
                        isLoading={seriesLoading}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <PaperList
                        paperIds={paperIds}
                        paperMetadata={paperMetadata}
                        onDeletePaper={handleDeletePaperClick}
                        isLoading={papersLoading}
                        seriesId={selectedSeries}
                    />

                    <CreatePaperModal
                        open={paperModalOpen}
                        onClose={() => setPaperModalOpen(false)}
                        onSubmit={handleCreatePaper}
                        isLoading={papersLoading}
                        seriesSettings={series.find(s => s.seriesId === selectedSeries)}
                    />
                </TabPanel>
            </Box>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={seriesDeleteConfirm.open}
                title="Delete Series"
                message={`Are you sure you want to delete the series "${seriesDeleteConfirm.seriesId}"? This will permanently delete all papers in this series and cannot be undone.`}
                confirmLabel="Delete Series"
                onConfirm={handleConfirmSeriesDelete}
                onCancel={() => setSeriesDeleteConfirm({ open: false, seriesId: null })}
                isDestructive={true}
            />

            <ConfirmDialog
                open={paperDeleteConfirm.open}
                title="Delete Paper"
                message={`Are you sure you want to delete this paper? This action cannot be undone.`}
                confirmLabel="Delete Paper"
                onConfirm={handleConfirmPaperDelete}
                onCancel={() => setPaperDeleteConfirm({ open: false, paperId: null })}
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
                    <AppContent />
                </ApiProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
