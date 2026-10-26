import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useArchive } from '../../context/ArchiveContext';
import { apiGet } from '../../services/api';
import type { SeriesMetadata } from '../../types';
import {
  type ArchiveMetadataOverrides,
  deleteArchiveAdmin,
  getArchiveMeta,
  initArchiveAdmin,
  publishArchiveAdmin,
  putArchiveMeta,
  rebuildSeriesIndexAdmin
} from '../../services/archiveAdminService';

function TabPanel(props: { value: number; index: number; children: React.ReactNode }) {
  const { value, index, children } = props;
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

const emptyMeta: ArchiveMetadataOverrides = {
  name: '',
  description: '',
  homepage: '',
  baseUrl: '',
  maintainerName: '',
  maintainerEmail: '',
  maintainerPhone: ''
};

export interface ArchiveAdminDialogProps {
  open: boolean;
  onClose: () => void;
}

const ArchiveAdminDialog: React.FC<ArchiveAdminDialogProps> = ({ open, onClose }) => {
  const { archives, selectedArchiveId, refresh: refreshArchives } = useArchive();

  const [tab, setTab] = useState(0);

  const [meta, setMeta] = useState<ArchiveMetadataOverrides>(emptyMeta);
  const [metaLoading, setMetaLoading] = useState(false);

  const [seriesLoading, setSeriesLoading] = useState(false);
  const [series, setSeries] = useState<SeriesMetadata[]>([]);
  const seriesIds = useMemo(() => series.map(s => s.seriesId).sort(), [series]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');

  const [createHandle, setCreateHandle] = useState('');
  const [createMeta, setCreateMeta] = useState<ArchiveMetadataOverrides>(emptyMeta);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteDryRunResult, setDeleteDryRunResult] = useState<{ keysFound: number } | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentArchive = useMemo(() => {
    return archives.find(a => a.id === selectedArchiveId) || null;
  }, [archives, selectedArchiveId]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotice(null);
    setDeleteDryRunResult(null);
    setDeleteConfirm('');
    setCreateMeta(emptyMeta);
  }, [open]);

  // Load archive meta + series list when dialog opens or archive changes
  useEffect(() => {
    if (!open) return;
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

        // Normalise undefined -> '' to keep TextFields controlled
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
  }, [open, selectedArchiveId]);

  // Pick a sensible default series for rebuild-index dropdown
  useEffect(() => {
    if (!open) return;
    if (selectedSeriesId) return;
    if (seriesIds.length > 0) setSelectedSeriesId(seriesIds[0]);
  }, [open, seriesIds, selectedSeriesId]);

  const disabledNoArchive = !selectedArchiveId;

  const handleSaveMeta = async (opts: { publishAfter: boolean }) => {
    if (!selectedArchiveId) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      // Convert '' -> undefined so server will clear fields
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

      if (opts.publishAfter) {
        await publishArchiveAdmin(selectedArchiveId);
        setNotice('Saved metadata and published archive.');
      } else {
        setNotice('Saved metadata.');
      }

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
      setNotice('Published archive.');
      await refreshArchives();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to publish archive');
    } finally {
      setBusy(false);
    }
  };

  const handleInitArchive = async () => {
    const handle = createHandle.trim();
    if (!handle) return;

    const mName = createMeta.maintainerName?.trim() || '';
    if (!mName) {
      setError('Maintainer name is required to initialize an archive.');
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const payload: ArchiveMetadataOverrides = {
        name: createMeta.name?.trim() || undefined,
        description: createMeta.description?.trim() || undefined,
        homepage: createMeta.homepage?.trim() || undefined,
        baseUrl: createMeta.baseUrl?.trim() || undefined,
        maintainerName: mName,
        maintainerEmail: createMeta.maintainerEmail?.trim() || undefined,
        maintainerPhone: createMeta.maintainerPhone?.trim() || undefined
      };

      await initArchiveAdmin(handle, payload);
      setNotice(`Initialized archive: ${handle}`);
      setCreateHandle('');
      setCreateMeta(emptyMeta);
      await refreshArchives();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to init archive');
    } finally {
      setBusy(false);
    }
  };

  const handleRebuildSeriesIndex = async () => {
    if (!selectedArchiveId) return;
    if (!selectedSeriesId) return;

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

      await refreshArchives();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Archive Admin</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {notice && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {notice}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
            Current archive
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {currentArchive ? `${currentArchive.handle} — ${currentArchive.name}` : 'None selected'}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Metadata" />
          <Tab label="Actions" />
          <Tab label="Create" />
          <Tab label="Danger" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          {disabledNoArchive ? (
            <Alert severity="info">Select an archive from the header dropdown first.</Alert>
          ) : metaLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These fields are stored in `RePEc/&lt;archive&gt;/archive.json` and override the generated archive ReDIF.
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Archive Name"
                  value={meta.name || ''}
                  onChange={(e) => setMeta(m => ({ ...m, name: e.target.value }))}
                />

                <TextField
                  label="Public base URL override"
                  value={meta.baseUrl || ''}
                  onChange={(e) => setMeta(m => ({ ...m, baseUrl: e.target.value }))}
                  placeholder="https://example.edu"
                  helperText="Optional. Leave blank to use the server default (REPEC_BASE_URL)."
                />

                <TextField
                  label="Homepage"
                  value={meta.homepage || ''}
                  onChange={(e) => setMeta(m => ({ ...m, homepage: e.target.value }))}
                  placeholder="https://example.edu/department"
                />

                <TextField
                  label="Description"
                  value={meta.description || ''}
                  onChange={(e) => setMeta(m => ({ ...m, description: e.target.value }))}
                  multiline
                  minRows={2}
                  sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
                />

                <Divider sx={{ gridColumn: '1 / -1', my: 1 }} />

                <TextField
                  label="Maintainer Name"
                  value={meta.maintainerName || ''}
                  onChange={(e) => setMeta(m => ({ ...m, maintainerName: e.target.value }))}
                />

                <TextField
                  label="Maintainer Email"
                  value={meta.maintainerEmail || ''}
                  onChange={(e) => setMeta(m => ({ ...m, maintainerEmail: e.target.value }))}
                />

                <TextField
                  label="Maintainer Phone"
                  value={meta.maintainerPhone || ''}
                  onChange={(e) => setMeta(m => ({ ...m, maintainerPhone: e.target.value }))}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                <Button variant="contained" disabled={busy} onClick={() => handleSaveMeta({ publishAfter: false })}>
                  Save
                </Button>
                <Button variant="outlined" disabled={busy} onClick={() => handleSaveMeta({ publishAfter: true })}>
                  Save & Publish
                </Button>
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {disabledNoArchive ? (
            <Alert severity="info">Select an archive from the header dropdown first.</Alert>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                <Button variant="contained" disabled={busy} onClick={handlePublish}>
                  Publish archive
                </Button>
                {busy && <CircularProgress size={18} />}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Rebuild a series index.html
              </Typography>

              {seriesLoading ? (
                <CircularProgress size={20} />
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="series-select-label">Series</InputLabel>
                    <Select
                      labelId="series-select-label"
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
                    variant="outlined"
                    disabled={busy || !selectedSeriesId}
                    onClick={handleRebuildSeriesIndex}
                  >
                    Rebuild index
                  </Button>
                </Box>
              )}
            </>
          )}
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a new archive by handle (exactly 3 lowercase letters) and optionally seed its metadata now.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="New archive handle"
              value={createHandle}
              onChange={(e) => setCreateHandle(e.target.value.toLowerCase())}
              placeholder="ajr"
              inputProps={{ maxLength: 3 }}
              helperText="Required. Exactly 3 lowercase letters."
            />

            <TextField
              label="Archive name"
              value={createMeta.name || ''}
              onChange={(e) => setCreateMeta(m => ({ ...m, name: e.target.value }))}
              placeholder="Example Working Papers"
            />

            <TextField
              label="Maintainer name"
              value={createMeta.maintainerName || ''}
              onChange={(e) => setCreateMeta(m => ({ ...m, maintainerName: e.target.value }))}
              placeholder="e.g. Jane Smith"
              helperText="Required. Used for Maintainer-Name in ReDIF."
            />

            <TextField
              label="Maintainer email"
              value={createMeta.maintainerEmail || ''}
              onChange={(e) => setCreateMeta(m => ({ ...m, maintainerEmail: e.target.value }))}
              placeholder="jane.smith@example.edu"
            />

            <TextField
              label="Maintainer phone"
              value={createMeta.maintainerPhone || ''}
              onChange={(e) => setCreateMeta(m => ({ ...m, maintainerPhone: e.target.value }))}
              placeholder="+61 ..."
            />

            <TextField
              label="Public base URL override"
              value={createMeta.baseUrl || ''}
              onChange={(e) => setCreateMeta(m => ({ ...m, baseUrl: e.target.value }))}
              placeholder="https://example.edu"
            />

            <TextField
              label="Homepage"
              value={createMeta.homepage || ''}
              onChange={(e) => setCreateMeta(m => ({ ...m, homepage: e.target.value }))}
              placeholder="https://example.edu/research"
            />

            <TextField
              label="Description"
              value={createMeta.description || ''}
              onChange={(e) => setCreateMeta(m => ({ ...m, description: e.target.value }))}
              multiline
              minRows={2}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mt: 2 }}>
            <Button variant="contained" disabled={busy || !createHandle.trim() || !createMeta.maintainerName?.trim()} onClick={handleInitArchive}>
              Create / Init
            </Button>
            {busy && <CircularProgress size={18} />}
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={3}>
          {disabledNoArchive ? (
            <Alert severity="info">Select an archive from the header dropdown first.</Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Deleting an archive removes <strong>all</strong> objects under `RePEc/{selectedArchiveId}/`.
              </Alert>

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                <Button variant="outlined" disabled={busy} onClick={handleDeleteDryRun}>
                  Dry run (count objects)
                </Button>

                {deleteDryRunResult && (
                  <Typography variant="body2" color="text.secondary">
                    Objects found: {deleteDryRunResult.keysFound}
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                label={`Type "${selectedArchiveId}" to confirm`}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                color="error"
                variant="contained"
                disabled={busy || deleteConfirm.trim() !== selectedArchiveId}
                onClick={handleDelete}
              >
                Delete archive
              </Button>
            </>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveAdminDialog;
