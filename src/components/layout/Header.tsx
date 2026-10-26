import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Chip,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../auth/AuthContext';
import { useAccess } from '../../hooks/useAccess';
import { useArchive } from '../../context/ArchiveContext';
import { useAdminPanel } from '../../context/AdminPanelContext';

const Header: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout, initiateLogin } = useAuth();
  const { isAdmin, ownerOf, editorOf, loading: accessLoading } = useAccess();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const {
    archives,
    selectedArchiveId,
    setSelectedArchiveId,
    loading: archivesLoading,
    error: archivesError,
    refresh: refreshArchives
  } = useArchive();

  const {
    isOpen: archivePanelOpen,
    view: archivePanelView,
    openCreateArchive,
    openEditArchive
  } = useAdminPanel();

  const isCreateActive = archivePanelOpen && archivePanelView === 'createArchive';
  const isEditActive = archivePanelOpen && archivePanelView === 'editArchive';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const getUserInitials = (): string => {
    if (!user) return '?';
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if ((ownerOf.length + editorOf.length) > 0) return 'Editor';
    return 'User';
  };

  const getRoleColor = (): 'success' | 'info' | 'default' => {
    if (isAdmin) return 'success';
    if ((ownerOf.length + editorOf.length) > 0) return 'info';
    return 'default';
  };

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#3b82f6' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          {/* Logo & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 1.5 }}>
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                fontSize: '1.35rem',
                lineHeight: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,255,255,0.16)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)'
              }}
            >
              📚
            </Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ fontWeight: 600, letterSpacing: '.02rem' }}
            >
              Paper Tool 2
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Archive selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FormControl
              size="small"
              sx={{ minWidth: 220 }}
              disabled={archivesLoading || archives.length === 0}
            >
              <InputLabel
                id="archive-select-label"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  '&.Mui-focused': { color: 'white' }
                }}
              >
                Archive
              </InputLabel>
              <Select
                labelId="archive-select-label"
                label="Archive"
                value={selectedArchiveId || ''}
                displayEmpty
                renderValue={(v) => {
                  if (archivesLoading) return 'Loading archives…';
                  if (archivesError) return 'Failed to load archives';
                  if (!v) return archives.length === 0 ? 'No archives found' : 'Select an archive…';
                  const found = archives.find(a => a.id === v);
                  return found ? `${found.handle} — ${found.name}` : String(v);
                }}
                onChange={(e) => setSelectedArchiveId(String(e.target.value))}
                sx={{
                  color: 'white',
                  bgcolor: 'transparent',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.4)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.7)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '.MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.9)'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      maxHeight: 420,
                      overflowY: 'auto'
                    }
                  }
                }}
              >
                <MenuItem value="" disabled>
                  {archivesLoading
                    ? 'Loading archives…'
                    : archivesError
                      ? 'Failed to load archives'
                      : archives.length === 0
                        ? 'No archives found'
                        : 'Select an archive…'}
                </MenuItem>
                {archives.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.handle} — {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title={archivesLoading ? 'Loading…' : 'Refresh archives'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => refreshArchives()}
                  disabled={archivesLoading}
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Admin-only archive controls */}
          {!accessLoading && isAdmin && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Create new archive">
                <span>
                  <IconButton
                    size="small"
                    onClick={openCreateArchive}
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      },
                      ...(isCreateActive
                        ? { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.15)' }
                        : {})
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={selectedArchiveId ? 'Edit selected archive' : 'Select an archive to edit'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={!selectedArchiveId}
                    onClick={openEditArchive}
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255,255,255,0.5)',
                        borderColor: 'rgba(255,255,255,0.25)'
                      },
                      ...(isEditActive
                        ? { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.15)' }
                        : {})
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}

          {/* Divider */}
          {isAuthenticated && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 1 }}
            />
          )}

          {/* User section */}
          {isLoading ? (
            <Box sx={{ width: 100 }} />
          ) : isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {!accessLoading && (
                <Chip
                  label={getRoleLabel()}
                  color={getRoleColor()}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              )}

              <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0.5 }}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {getUserInitials()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 220,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '1rem'
                      }}
                    >
                      {getUserInitials()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user?.name || user?.email?.split('@')[0]}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider />

                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sign out</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              variant="outlined"
              startIcon={<LoginIcon />}
              onClick={initiateLogin}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
