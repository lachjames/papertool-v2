import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useAdminPanel } from '../../context/AdminPanelContext';
import { ArchiveMetadataOverrides, initArchiveAdmin } from '../../services/archiveAdminService';
import { useArchive } from '../../context/ArchiveContext';

const emptyMeta: ArchiveMetadataOverrides = {
  name: '',
  description: '',
  homepage: '',
  baseUrl: '',
  maintainerName: '',
  maintainerEmail: '',
  maintainerPhone: ''
};

const CreateArchivePanel: React.FC = () => {
  const { isOpen, view, close, openEditArchive } = useAdminPanel();
  const { refresh: refreshArchives, setSelectedArchiveId } = useArchive();

  const [createHandle, setCreateHandle] = useState('');
  const [meta, setMeta] = useState<ArchiveMetadataOverrides>(emptyMeta);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || view !== 'createArchive') return;
    setCreateHandle('');
    setMeta(emptyMeta);
    setBusy(false);
    setError(null);
    setNotice(null);
  }, [isOpen, view]);

  const updateMetaField = (key: keyof ArchiveMetadataOverrides, value: string) => {
    setMeta(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    const handle = createHandle.trim().toLowerCase();
    if (!handle) return;

    const maintainerName = meta.maintainerName?.trim() || '';
    if (!maintainerName) {
      setError('Maintainer name is required (used in the generated archive ReDIF).');
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const payload: ArchiveMetadataOverrides = {
        name: meta.name?.trim() || undefined,
        description: meta.description?.trim() || undefined,
        homepage: meta.homepage?.trim() || undefined,
        baseUrl: meta.baseUrl?.trim() || undefined,
        maintainerName,
        maintainerEmail: meta.maintainerEmail?.trim() || undefined,
        maintainerPhone: meta.maintainerPhone?.trim() || undefined,
      };

      await initArchiveAdmin(handle, payload);
      setNotice(`Initialized archive: ${handle}`);

      // Select it immediately, then refresh the dropdown/list.
      setSelectedArchiveId(handle);
      await refreshArchives();

      // Switch to the edit panel for the new archive.
      openEditArchive();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to init archive');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen || view !== 'createArchive') return null;

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
            Create Archive
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 520 }}>
            Creates the folder structure under <code>RePEc/&lt;handle&gt;/</code>
          </Typography>
        </Box>
        <IconButton onClick={close} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3 }}>
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

        <Box
          sx={{
            p: 2,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
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
            New archive
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Handles should be <strong>3 lowercase letters</strong> (e.g. <code>ajr</code>). You can also seed the new archive with its display name, public URL settings, and maintainer details now so the generated ReDIF is useful immediately.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2
            }}
          >
            <TextField
              size="small"
              label="Handle"
              value={createHandle}
              onChange={(e) => setCreateHandle(e.target.value.toLowerCase())}
              placeholder="ajr"
              autoFocus
              inputProps={{ maxLength: 3 }}
              disabled={busy}
              helperText="Required. Exactly 3 lowercase letters."
            />

            <TextField
              size="small"
              label="Archive display name"
              value={meta.name || ''}
              onChange={(e) => updateMetaField('name', e.target.value)}
              placeholder="Example Working Papers"
              disabled={busy}
              helperText="Optional but recommended. Used for the archive Name field and UI display."
            />

            <TextField
              size="small"
              label="Maintainer name"
              value={meta.maintainerName || ''}
              onChange={(e) => updateMetaField('maintainerName', e.target.value)}
              placeholder="e.g. Jane Smith"
              disabled={busy}
              helperText="Required. Used for Maintainer-Name in ReDIF."
            />

            <TextField
              size="small"
              label="Maintainer email"
              value={meta.maintainerEmail || ''}
              onChange={(e) => updateMetaField('maintainerEmail', e.target.value)}
              placeholder="jane.smith@example.edu"
              disabled={busy}
              helperText="Optional override; otherwise the server default is used."
            />

            <TextField
              size="small"
              label="Maintainer phone"
              value={meta.maintainerPhone || ''}
              onChange={(e) => updateMetaField('maintainerPhone', e.target.value)}
              placeholder="+61 ..."
              disabled={busy}
              helperText="Optional."
            />

            <TextField
              size="small"
              label="Public base URL override"
              value={meta.baseUrl || ''}
              onChange={(e) => updateMetaField('baseUrl', e.target.value)}
              placeholder="https://example.edu"
              disabled={busy}
              helperText="Optional. Leave blank to use the server default (REPEC_BASE_URL)."
            />

            <TextField
              size="small"
              label="Homepage URL"
              value={meta.homepage || ''}
              onChange={(e) => updateMetaField('homepage', e.target.value)}
              placeholder="https://example.edu/research"
              disabled={busy}
              helperText="Optional. Populates Homepage in ReDIF."
            />

            <TextField
              size="small"
              label="Description"
              value={meta.description || ''}
              onChange={(e) => updateMetaField('description', e.target.value)}
              placeholder="Archive description"
              multiline
              minRows={2}
              disabled={busy}
              helperText="Optional."
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 3 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={busy ? <CircularProgress size={16} /> : <AddIcon />}
              disabled={busy || createHandle.trim().length !== 3 || !meta.maintainerName?.trim()}
              onClick={handleCreate}
            >
              Create
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateArchivePanel;
