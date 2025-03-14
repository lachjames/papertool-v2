import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { authError, clearAuthError, initiateLogin } = useAuth();

  const handleGoogleLogin = () => {
    setLoading(true);
    clearAuthError();
    initiateLogin();
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        mb: 3, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        maxWidth: '500px',
        mx: 'auto',
        mt: 4
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Welcome to RePEc Paper Management
      </Typography>
      
      <Divider sx={{ width: '100%', mb: 2 }} />
      
      <Typography variant="subtitle1" align="center" gutterBottom>
        Sign in to access the application
      </Typography>
      
      {authError && (
        <Alert 
          severity="error" 
          onClose={clearAuthError}
          sx={{ width: '100%' }}
        >
          {authError}
        </Alert>
      )}
      
      <Button
        variant="contained"
        startIcon={!loading && <GoogleIcon />}
        onClick={handleGoogleLogin}
        sx={{ 
          bgcolor: '#ffffff', 
          color: '#757575',
          '&:hover': {
            bgcolor: '#f5f5f5'
          },
          width: '100%',
          py: 1.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Google'}
      </Button>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
        By signing in, you agree to our terms of service and privacy policy.
      </Typography>
    </Paper>
  );
};

export default Login;
