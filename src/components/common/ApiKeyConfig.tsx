import React from 'react';
import { 
  Paper, 
  TextField, 
  Typography, 
  Box, 
  Alert
} from '@mui/material';
import { useApiContext } from '../../context/ApiContext';

const ApiKeyConfig: React.FC = () => {
  const { apiConfig, setApiKey } = useApiContext();

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 3, 
        bgcolor: 'primary.light', 
        display: 'flex', 
        alignItems: 'center', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2 
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" sx={{ minWidth: '80px' }}>
        API Key:
      </Typography>
      
      <TextField
        type="password"
        value={apiConfig.key}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your API key"
        size="small"
        sx={{ flex: 1, maxWidth: '400px' }}
        variant="outlined"
      />
      
      {!apiConfig.key && (
        <Box sx={{ flex: 1 }}>
          <Alert severity="warning">
            Please enter an API key to use the application
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default ApiKeyConfig;
