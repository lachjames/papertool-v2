import React, { ReactNode } from 'react';
import { Container, Box, CssBaseline } from '@mui/material';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', // Full viewport height
        overflow: 'hidden', // Prevent scrolling
        bgcolor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#121212'
      }}
    >
      <CssBaseline />
      <Header />
      <Container 
        maxWidth="xl" 
        sx={{ 
          flex: 1, 
          py: 2, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default MainLayout;
