import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
// import { useAuth } from '../../context/AuthContext';
// import Login from './Login';
import { useAuth } from './AuthContext';
import Login from './LoginComponent';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 100px)'
            }}>
                <CircularProgress size={50} sx={{ mb: 3 }} />
                <Typography>Checking authentication...</Typography>
            </Box>
        );
    }

    // If not authenticated, show login component
    if (!isAuthenticated) {
        return <Login />;
    }

    // If authenticated, render the children
    return <>{children}</>;
};

export default ProtectedRoute;
