import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Grid,
    Paper,
    TextField,
    Typography,
    Alert,
    Divider,
    Switch
} from '@mui/material';
import { ImportCandidate, ImportResultItem, listRepecSeries, importOne } from '../../services/importService';
import { useArchive } from '../../context/ArchiveContext';

interface ImportWizardProps {
    selectedSeriesId: string | null;
    onImported?: () => void; // callback to refresh series papers after imports
}

const ImportWizard: React.FC<ImportWizardProps> = ({ selectedSeriesId, onImported }) => {
    const [seriesUrl, setSeriesUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
    const [selectedHandles, setSelectedHandles] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<ImportResultItem[] | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    // Manual import options
    const [stripFirstPage, setStripFirstPage] = useState(false);
    const [addCoverPage, setAddCoverPage] = useState(true);

    const { selectedArchiveId } = useArchive();

    const allSelected = useMemo(() => {
        if (candidates.length === 0) return false;
        return candidates.every(c => selectedHandles[c.handle]);
    }, [candidates, selectedHandles]);

    const anySelected = useMemo(() => Object.values(selectedHandles).some(Boolean), [selectedHandles]);

    const handleToggleAll = (checked: boolean) => {
        const next: Record<string, boolean> = {};
        candidates.forEach(c => { next[c.handle] = checked; });
        setSelectedHandles(next);
    };

    const handleToggleOne = (handle: string, checked: boolean) => {
        setSelectedHandles(prev => ({ ...prev, [handle]: checked }));
    };

    const extractSeriesCodeFromHandle = (handle: string): string | null => {
        const parts = handle.split(':');
        return parts.length >= 3 ? parts[2] : null;
    };

    const mismatchedSeriesWarning = useMemo(() => {
        if (!selectedSeriesId || candidates.length === 0) return null;
        const mismatches = candidates.filter(c => extractSeriesCodeFromHandle(c.handle) !== selectedSeriesId);
        if (mismatches.length > 0) {
            return `Warning: ${mismatches.length} paper(s) appear to be from a different RePEc series than "${selectedSeriesId}". They can still be imported, but handles won't match your series.`;
        }
        return null;
    }, [candidates, selectedSeriesId]);

    const handleList = async () => {
        setError(null);
        setResults(null);
        setCurrentIndex(-1);

        if (!selectedArchiveId) {
            setError('Select an archive before listing RePEc series.');
            return;
        }

        setLoading(true);
        try {
            const resp = await listRepecSeries(seriesUrl.trim(), selectedArchiveId);
            setCandidates(resp.candidates);
            const initialSel: Record<string, boolean> = {};
            resp.candidates.forEach(c => { initialSel[c.handle] = true; });
            setSelectedHandles(initialSel);
        } catch (e: any) {
            const msg = e?.response?.data?.error || e?.message || 'Failed to list series';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedSeriesId) {
            setError('Select a target series first');
            return;
        }
        if (!selectedArchiveId) {
            setError('Select an archive first');
            return;
        }

        const handles = Object.entries(selectedHandles).filter(([, v]) => v).map(([h]) => h);
        if (handles.length === 0) {
            setError('Select at least one paper to import');
            return;
        }
        setError(null);
        setResults([]);
        setCurrentIndex(0);
        setLoading(true);
        try {
            const run: ImportResultItem[] = [];
            for (let i = 0; i < handles.length; i++) {
                const h = handles[i];
                setCurrentIndex(i);
                try {
                    const item = await importOne(selectedArchiveId, selectedSeriesId, seriesUrl.trim(), h, {
                        stripFirstPage,
                        addCoverPage
                    });
                    run.push(item);
                    if (item.success && onImported) {
                        onImported(); // refresh papers in UI after each success
                    }
                } catch (err: any) {
                    const serverMsg = err?.response?.data?.error || err?.message || 'Import failed';
                    run.push({ handle: h, success: false, error: serverMsg });
                }
                setResults([...run]);
            }
        } finally {
            setLoading(false);
            setCurrentIndex(-1);
        }
    };

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Import from RePEc (Archive Series URL)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Paste the public URL of a RePEc series directory that lists its .rdf/.redif files. We'll fetch metadata and available PDF links,
                    let you select papers, and import them into your currently selected series.
                </Typography>

                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            label="Series URL (e.g., https://example.org/RePEc/aaa/wpaper/)"
                            value={seriesUrl}
                            onChange={(e) => setSeriesUrl(e.target.value)}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button variant="contained" onClick={handleList} disabled={loading || !seriesUrl.trim()} fullWidth>
                            {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                            List Papers
                        </Button>
                    </Grid>
                </Grid>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                )}

                {mismatchedSeriesWarning && (
                    <Alert severity="warning" sx={{ mt: 2 }}>{mismatchedSeriesWarning}</Alert>
                )}

                {candidates.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1">Found {candidates.length} paper(s)</Typography>
                            <Box>
                                <FormControlLabel
                                    control={<Checkbox checked={allSelected} onChange={(e) => handleToggleAll(e.target.checked)} />}
                                    label="Select all"
                                />
                            </Box>
                        </Box>

                        {/* Manual import options */}
                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Import options</Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <FormControlLabel
                                    control={<Switch checked={stripFirstPage} onChange={(e) => setStripFirstPage(e.target.checked)} />}
                                    label="Strip first page (remove existing cover)"
                                />
                                <FormControlLabel
                                    control={<Switch checked={addCoverPage} onChange={(e) => setAddCoverPage(e.target.checked)} />}
                                    label="Add new cover page"
                                />
                            </Box>
                        </Paper>

                        <Paper variant="outlined" sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                            <Box sx={{ p: 1 }}>
                                {candidates.map((c) => (
                                    <Box key={c.handle} sx={{ display: 'flex', alignItems: 'flex-start', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                                        <Checkbox
                                            checked={!!selectedHandles[c.handle]}
                                            onChange={(e) => handleToggleOne(c.handle, e.target.checked)}
                                            sx={{ mr: 1 }}
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
                                                {c.title || '(No title)'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                Handle: {c.handle}
                                            </Typography>
                                            {c.authors && c.authors.length > 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Authors: {c.authors.join(', ')}
                                                </Typography>
                                            )}
                                            {c.hasPdf ? (
                                                <Typography variant="caption" color="success.main">PDF available</Typography>
                                            ) : (
                                                <Typography variant="caption" color="warning.main">No PDF URL found</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        <Box sx={{ mt: 2 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ mt: 1 }}>
                                <Button variant="contained" onClick={handleImport} disabled={loading || !anySelected || !selectedSeriesId}>
                                    {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                                    Import Selected
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}

                {results && (
                    <Box sx={{ mt: 3 }}>
                        <Alert severity={results.some(r => !r.success) ? 'warning' : 'success'}>
                            Completed {results.length} import{results.length === 1 ? '' : 's'}. {results.filter(r => !r.success).length} failed.
                        </Alert>
                        <Paper variant="outlined" sx={{ mt: 2, maxHeight: '40vh', overflow: 'auto' }}>
                            <Box sx={{ p: 1 }}>
                                {results.map(item => (
                                    <Box key={item.handle} sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="caption" sx={{ display: 'block' }}>Handle: {item.handle}</Typography>
                                        {item.success ? (
                                            <Typography variant="caption" color="success.main">Imported as ID: {item.paperId}</Typography>
                                        ) : (
                                            <Typography variant="caption" color="error.main">Failed: {item.error || 'Unknown error'}</Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                        {loading && currentIndex >= 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Importing {currentIndex + 1} of {Object.values(selectedHandles).filter(Boolean).length}...
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default ImportWizard;
