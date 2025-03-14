import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Box,
  InputAdornment,
  Tooltip,
  Alert,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import KeyIcon from '@mui/icons-material/Key';
import ErrorIcon from '@mui/icons-material/Error';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useApiContext } from '../../context/ApiContext';
// import { useAuth } from '../../context/AuthContext';
import { useAuth } from '../../auth/AuthContext';

const Header: React.FC = () => {
  const { apiConfig, setApiKey } = useApiContext();
  const { isAuthenticated, isLoading, user, logout, initiateLogin } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  // Get user initials for avatar
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

  console.log("Auth state:", { isAuthenticated, isLoading, user });
  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MenuBookIcon sx={{ mr: 2 }} />
              <Typography
                variant="h5"
                noWrap
                component="div"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '.05rem',
                }}
              >
                RePEc Paper Management System
              </Typography>
            </Box>

            {isLoading ? (
              <Box sx={{ width: 100 }}></Box> // Placeholder during loading
            ) : isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                  {user?.name || user?.email}
                </Typography>

                <IconButton
                  onClick={handleMenuOpen}
                  color="inherit"
                  size="small"
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'secondary.main',
                      color: 'white'
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </IconButton>

                <Menu
                  id="user-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="textSecondary">
                      Signed in as {user?.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Google login button */}
                <Button
                  color="inherit"
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  onClick={initiateLogin}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Sign In
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Show alert only if not authenticated and no API key */}
      {!isLoading && !isAuthenticated && !apiConfig.key && (
        <Box sx={{ width: '100%' }}>
          <Alert severity="warning" sx={{ borderRadius: 0, mb: 2 }}>
            Please enter an API key or sign in with Google to use the application
          </Alert>
        </Box>
      )}
    </>
  );
};

export default Header;
