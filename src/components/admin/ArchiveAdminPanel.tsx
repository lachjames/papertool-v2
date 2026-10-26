import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PublishIcon from '@mui/icons-material/Publish';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useArchive } from '../../context/ArchiveContext';
import { apiGet } from '../../services/api';
import type { SeriesMetadata } from '../../types';
import {
  type ArchiveMetadataOverrides,
  deleteArchiveAdmin,
  getArchiveMeta,
  getArchiveRedif,
  initArchiveAdmin,
  publishArchiveAdmin,
  putArchiveMeta,
  putArchiveRedif,
  rebuildSeriesIndexAdmin
} from '../../services/archiveAdminService';
import { useAdminPanel } from '../../context/AdminPanelContext';

const emptyMeta: ArchiveMetadataOverrides = {
  name: '',
  description: '',
  homepage: '',
  baseUrl: '',
  maintainerName: '',
  maintainerEmail: '',
  maintainerPhone: ''
};

const ArchiveAdminPanel: React.FC = () => {
  const { isOpen, view, close } = useAdminPanel();
  const { archives, selectedArchiveId, refresh: refreshArchives } = useArchive();

  const [meta, setMeta] = useState<ArchiveMetadataOverrides>(emptyMeta);
  const [metaLoading, setMetaLoading] = useState(false);

  const [seriesLoading, setSeriesLoading] = useState(false);
  const [series, setSeries] = useState<SeriesMetadata[]>([]);
  const seriesIds = useMemo(() => series.map(s => s.seriesId).sort(), [series]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');



  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteDryRunResult, setDeleteDryRunResult] = useState<{ keysFound: number } | null>(null);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Advanced ReDIF editor state (archive-level)
  const [showRedifEditor, setShowRedifEditor] = useState(false);
  const [redifText, setRedifText] = useState('');
  const [redifLoading, setRedifLoading] = useState(false);
  const [redifError, setRedifError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentArchive = useMemo(() => {
    return archives.find(a => a.id === selectedArchiveId) || null;
  }, [archives, selectedArchiveId]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setNotice(null);
    setDeleteDryRunResult(null);
    setDeleteConfirm('');
    setShowDangerZone(false);

    setShowRedifEditor(false);
    setRedifText('');
    setRedifError(null);
  }, [isOpen]);

  // When the panel opens, clear transient state.

  // Load archive meta + series list when panel opens or archive changes
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedArchiveId) return;

    (async () => {
      setError(null);
      setNotice(null);
      setMetaLoading(true);
      setSeriesLoading(true);

      try {
        const [metaRes, seriesRes] = await Promise.all([
          getArchiveMeta(selectedArchiveId),
          apiGet<SeriesMetadata[]>(`archives/${selectedArchiveId}/series`)
        ]);

        const m = metaRes.data || {};
        setMeta({
          name: m.name || '',
          description: m.description || '',
          homepage: m.homepage || '',
          baseUrl: m.baseUrl || '',
          maintainerName: m.maintainerName || '',
          maintainerEmail: m.maintainerEmail || '',
          maintainerPhone: m.maintainerPhone || ''
        });

        setSeries(seriesRes.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || 'Failed to load archive admin data');
      } finally {
        setMetaLoading(false);
        setSeriesLoading(false);
      }
    })();
  }, [isOpen, selectedArchiveId]);

  // Pick a sensible default series for rebuild-index dropdown
  useEffect(() => {
    if (!isOpen) return;
    if (selectedSeriesId) return;
    if (seriesIds.length > 0) setSelectedSeriesId(seriesIds[0]);
  }, [isOpen, seriesIds, selectedSeriesId]);

  const handleToggleRedifEditor = async () => {
    if (!selectedArchiveId) return;
    const next = !showRedifEditor;
    setShowRedifEditor(next);

    if (next && !redifText && !redifLoading) {
      try {
        setRedifLoading(true);
        setRedifError(null);
        const res = await getArchiveRedif(selectedArchiveId);
        setRedifText(res.data.redif || '');
      } catch (e: any) {
        setRedifError(e?.response?.data?.error || e?.message || 'Failed to load ReDIF');
      } finally {
        setRedifLoading(false);
      }
    }
  };

  const handleSaveRedif = async () => {
    if (!selectedArchiveId) return;

    try {
      setRedifLoading(true);
      setRedifError(null);

      const res = await putArchiveRedif(selectedArchiveId, redifText);
      const m = res.data || {};

      // Keep the form fields in sync with what the server accepted
      setMeta({
        name: m.name || '',
        description: m.description || '',
        homepage: m.homepage || '',
        baseUrl: m.baseUrl || '',
        maintainerName: m.maintainerName || '',
        maintainerEmail: m.maintainerEmail || '',
        maintainerPhone: m.maintainerPhone || ''
      });

      // Apply changes immediately by rebuilding published outputs
      await publishArchiveAdmin(selectedArchiveId);
      setNotice('Saved archive ReDIF changes.');
      await refreshArchives();
    } catch (e: any) {
      setRedifError(e?.response?.data?.error || e?.message || 'Failed to save ReDIF');
    } finally {
      setRedifLoading(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!selectedArchiveId) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const payload: ArchiveMetadataOverrides = {
        name: meta.name?.trim() || undefined,
        description: meta.description?.trim() || undefined,
        homepage: meta.homepage?.trim() || undefined,
        baseUrl: meta.baseUrl?.trim() || undefined,
        maintainerName: meta.maintainerName?.trim() || undefined,
        maintainerEmail: meta.maintainerEmail?.trim() || undefined,
        maintainerPhone: meta.maintainerPhone?.trim() || undefined
      };

      await putArchiveMeta(selectedArchiveId, payload);

      // Save = apply (rebuild published files)
      await publishArchiveAdmin(selectedArchiveId);
      setNotice('Saved archive metadata.');

      await refreshArchives();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save metadata');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedArchiveId) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await publishArchiveAdmin(selectedArchiveId);
      setNotice('Rebuilt archive outputs.');
      await refreshArchives();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to publish archive');
    } finally {
      setBusy(false);
    }
  };



  const handleRebuildSeriesIndex = async () => {
    if (!selectedArchiveId || !selectedSeriesId) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await rebuildSeriesIndexAdmin(selectedArchiveId, selectedSeriesId);
      setNotice(`Rebuilt index.html for ${selectedArchiveId}/${selectedSeriesId}`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to rebuild series index');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDryRun = async () => {
    if (!selectedArchiveId) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const res = await deleteArchiveAdmin(selectedArchiveId, { dryRun: true });
      setDeleteDryRunResult({ keysFound: res.data.keysFound });
      setNotice(`Dry run: found ${res.data.keysFound} objects under RePEc/${selectedArchiveId}/`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Dry run failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArchiveId) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const res = await deleteArchiveAdmin(selectedArchiveId, {
        dryRun: false,
        confirm: deleteConfirm
      });

      setNotice(`Deleted archive ${selectedArchiveId} (${res.data.deleted} objects).`);
      setDeleteConfirm('');
      setDeleteDryRunResult(null);
      setShowDangerZone(false);

      await refreshArchives();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography
      variant="subtitle2"
      sx={{
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '0.75rem',
        fontWeight: 600,
        mb: 1.5
      }}
    >
      {children}
    </Typography>
  );

  if (!isOpen || view !== 'editArchive') return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.50',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Archive Administration
          </Typography>
          {currentArchive && (
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 520 }}>
              Managing: <strong>{currentArchive.handle}</strong> — {currentArchive.name}
            </Typography>
          )}
        </Box>
        <IconButton onClick={close} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Alerts */}
      <Box sx={{ px: 3, pt: 2, flexShrink: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
      </Box>

      {/* Main content - scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, pb: 3 }}>
        {archives.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No archives found yet. Create your first archive handle below (e.g. <code>ajr</code>).
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3
          }}
        >
          {/* Column 1: Metadata */}
          <Box>
            <SectionHeader>Archive Metadata</SectionHeader>

            {!selectedArchiveId ? (
              <Alert severity="info" variant="outlined">
                Select an archive from the dropdown above.
              </Alert>
            ) : metaLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  size="small"
                  label="Archive display name"
                  required
                  value={meta.name || ''}
                  onChange={(e) => setMeta(m => ({ ...m, name: e.target.value }))}
                  helperText="Required. Displayed in the archive dropdown and published into ReDIF (Name:)."
                />

                <TextField
                  size="small"
                  label="Public base URL override"
                  value={meta.baseUrl || ''}
                  onChange={(e) => setMeta(m => ({ ...m, baseUrl: e.target.value }))}
                  placeholder="https://example.edu"
                  helperText="Optional. Leave blank to use the server default (REPEC_BASE_URL). PaperTool appends /RePEc/<archive>/ automatically."
                />

                <TextField
                  size="small"
                  label="Homepage URL"
                  value={meta.homepage || ''}
                  onChange={(e) => setMeta(m => ({ ...m, homepage: e.target.value }))}
                  placeholder="https://example.edu/research"
                  helperText="Optional. Populates Homepage:."
                />

                <TextField
                  size="small"
                  label="Description"
                  value={meta.description || ''}
                  onChange={(e) => setMeta(m => ({ ...m, description: e.target.value }))}
                  multiline
                  rows={2}
                  helperText="Optional."
                />

                <Divider sx={{ my: 0.5 }} />

                <TextField
                  size="small"
                  label="Maintainer Name"
                  required
                  value={meta.maintainerName || ''}
                  onChange={(e) => setMeta(m => ({ ...m, maintainerName: e.target.value }))}
                  helperText="Required. This replaces the old MAINTAINER_NAME env var." 
                />

                <TextField
                  size="small"
                  label="Maintainer Email"
                  required
                  value={meta.maintainerEmail || ''}
                  onChange={(e) => setMeta(m => ({ ...m, maintainerEmail: e.target.value }))}
                  helperText="Required for published ReDIF (Maintainer-Email:)."
                />

                <TextField
                  size="small"
                  label="Maintainer Phone"
                  value={meta.maintainerPhone || ''}
                  onChange={(e) => setMeta(m => ({ ...m, maintainerPhone: e.target.value }))}
                  helperText="Optional."
                />

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busy}
                    onClick={handleSaveMeta}
                  >
                    Save
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Save will immediately apply changes by rebuilding the published ReDIF files.
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Advanced: edit archive ReDIF (plain-text)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Copy/paste an existing <code>*arch.rdf</code>. Supported fields are parsed back into metadata.
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={busy || !selectedArchiveId}
                  onClick={handleToggleRedifEditor}
                >
                  {showRedifEditor ? 'Hide ReDIF' : 'Edit ReDIF'}
                </Button>

                {showRedifEditor && (
                  <Box sx={{ mt: 1 }}>
                    {redifError && (
                      <Alert severity="error" sx={{ mb: 1 }}>
                        {redifError}
                      </Alert>
                    )}

                    {redifLoading && !redifText ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                        <CircularProgress size={18} />
                        <Typography variant="caption" color="text.secondary">
                          Loading ReDIF…
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          minRows={8}
                          value={redifText}
                          onChange={(e) => setRedifText(e.target.value)}
                          placeholder={
                            'Template-Type: ReDIF-Archive 1.0\n' +
                            'Handle: RePEc:ajr\n' +
                            'Name: ...\n' +
                            'Maintainer-Email: ...\n' +
                            'URL: https://example.edu/RePEc/ajr/\n'
                          }
                          sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={redifLoading || !redifText.trim()}
                            onClick={handleSaveRedif}
                          >
                            {redifLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                            Save ReDIF
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Column 2: Actions */}
          <Box>
            <SectionHeader>Actions</SectionHeader>

            {!selectedArchiveId ? (
              <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                Select an archive from the dropdown above.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}
                    aria-controls="archive-advanced-content"
                    id="archive-advanced-header"
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Advanced / Troubleshooting
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PublishIcon />}
                          disabled={busy}
                          onClick={handlePublish}
                        >
                          Rebuild archive outputs
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Regenerates archive + series ReDIF and the archive index. Rarely needed.
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Rebuild series index.html (rare)
                        </Typography>
                        {seriesLoading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                              <InputLabel>Series</InputLabel>
                              <Select
                                label="Series"
                                value={selectedSeriesId}
                                onChange={(e) => setSelectedSeriesId(e.target.value)}
                              >
                                {seriesIds.map(id => (
                                  <MenuItem key={id} value={id}>
                                    {id}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<RefreshIcon />}
                              disabled={busy || !selectedSeriesId}
                              onClick={handleRebuildSeriesIndex}
                            >
                              Rebuild
                            </Button>
                          </Box>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Only use if a series folder listing page looks out of date.
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Box>
        </Box>

        {/* Danger Zone moved to bottom */}
        <Box sx={{ mt: 3 }}>
          <SectionHeader>Danger Zone</SectionHeader>

          {!selectedArchiveId ? (
            <Alert severity="info" variant="outlined">
              Select an archive to see danger options.
            </Alert>
          ) : !showDangerZone ? (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<WarningIcon />}
              onClick={() => setShowDangerZone(true)}
            >
              Show Delete Options
            </Button>
          ) : (
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'error.light',
                borderRadius: 1,
                bgcolor: 'error.50'
              }}
            >
              <Alert severity="warning" sx={{ mb: 2 }}>
                Deleting an archive removes <strong>all</strong> objects under{' '}
                <code>RePEc/{selectedArchiveId}/</code>.
              </Alert>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <Button size="small" variant="outlined" disabled={busy} onClick={handleDeleteDryRun}>
                  Count Objects
                </Button>
                {deleteDryRunResult && (
                  <Typography variant="body2" color="text.secondary">
                    {deleteDryRunResult.keysFound} objects found
                  </Typography>
                )}
              </Box>

              <TextField
                size="small"
                fullWidth
                label={`Type "${selectedArchiveId}" to confirm`}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  startIcon={<DeleteIcon />}
                  disabled={busy || deleteConfirm.trim() !== selectedArchiveId}
                  onClick={handleDelete}
                >
                  Delete Archive
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setShowDangerZone(false);
                    setDeleteConfirm('');
                    setDeleteDryRunResult(null);
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Loading indicator */}
      {busy && (
        <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default ArchiveAdminPanel;
